import * as THREE from "three";
import {
  DemonType,
  DemonInstance,
  DemonSystem as IDemonSystem,
} from "@/types/demons";
import { Bullet } from "@/types/weapons";
import { DEMON_CONFIGS, getDemonTypesForWave } from "@/config/demons";

// Animation states for demons
interface DemonAnimation {
  currentState: string;
  stateTime: number;
  frameTime: number;
  attackFrame: number;
  deathFrame: number;
  walkCycle: number;
  idleCycle: number;
}

export class DemonSystem implements IDemonSystem {
  public demons: DemonInstance[] = [];
  public currentWave = 1;
  public demonsThisWave = 0;
  public demonsSpawnedThisWave = 0;
  public waveInProgress = false;
  public demonTypeCounts = {
    IMP: 0,
    DEMON: 0,
    CACODEMON: 0,
    BARON: 0,
  } as Record<DemonType, number>;

  private scene!: THREE.Scene;
  private audioSystem: any = null;
  private demonSpawnTimer: NodeJS.Timeout | null = null;
  private nextWaveTimer: NodeJS.Timeout | null = null;
  private readonly timeBetweenWaves = 5000; // 5 seconds between waves

  public async initialize(): Promise<void> {
    console.log("🔥 DemonSystem initialized with enhanced DOOM-style models");
  }

  public setScene(scene: THREE.Scene): void {
    this.scene = scene;
  }

  public setAudioSystem(audioSystem: any): void {
    this.audioSystem = audioSystem;
  }

  public update(deltaTime: number): void {
    // Update demon AI and animations
    this.demons.forEach((demon: any) => {
      this.updateDemonAI(demon, deltaTime);
    });

    // Remove demons marked for removal
    this.removeDeadDemons();

    // Check if wave is complete
    this.checkWaveComplete();
  }

  private removeDeadDemons(): void {
    const demonsToRemove: any[] = [];

    this.demons.forEach((demon: any) => {
      let isDead = false;
      let isMarkedForRemoval = false;
      let meshObject: THREE.Object3D;

      // Handle both DemonInstance and direct THREE.Group objects
      if (demon.mesh) {
        // DemonInstance structure
        isDead = demon.state === "dead";
        isMarkedForRemoval = demon.mesh.userData?.markedForRemoval;
        meshObject = demon.mesh;
      } else if (demon.userData) {
        // Direct THREE.Group object (multiplayer)
        isDead = demon.userData.isDead;
        isMarkedForRemoval = demon.userData.markedForRemoval;
        meshObject = demon;
      } else {
        // Invalid demon object
        demonsToRemove.push(demon);
        return;
      }

      if (isDead || isMarkedForRemoval) {
        demonsToRemove.push(demon);
      }
    });

    // Remove dead demons
    demonsToRemove.forEach((demon: any) => {
      // Remove from scene
      let meshObject: THREE.Object3D;
      if (demon.mesh) {
        meshObject = demon.mesh;
      } else {
        meshObject = demon;
      }

      this.scene.remove(meshObject);

      // Remove from demons array
      const index = this.demons.indexOf(demon);
      if (index > -1) {
        this.demons.splice(index, 1);
      }
    });
  }

  private updateDemonAI(demon: DemonInstance, deltaTime: number): void {
    // Handle both single-player DemonInstance and multiplayer THREE.Group objects
    let meshObject: THREE.Object3D;
    let userData: any;
    let demonState: string;

    // Check if this is a DemonInstance (single-player) or THREE.Group (multiplayer)
    if (demon.mesh) {
      // Single-player DemonInstance
      meshObject = demon.mesh;
      userData = demon.mesh.userData;
      demonState = demon.state;
    } else if ((demon as any).userData) {
      // Multiplayer THREE.Group
      meshObject = demon as any;
      userData = (demon as any).userData;
      demonState = userData.isDead ? "dead" : "idle";
    } else {
      // Invalid demon object, skip
      console.warn("Invalid demon object structure, skipping AI update");
      return;
    }

    if (!userData || demonState === "dead") return;

    // Get player position from camera (real-time position)
    const camera = this.scene.userData?.camera as THREE.Camera;
    if (!camera) return;

    const playerPosition = camera.position;

    // Initialize animation data if not present
    if (!userData.animation) {
      userData.animation = {
        currentState: "idle",
        stateTime: 0,
        frameTime: 0,
        attackFrame: 0,
        deathFrame: 0,
        walkCycle: 0,
        idleCycle: 0,
      } as DemonAnimation;
    }

    // Update animation frame time
    userData.animation.frameTime += deltaTime;
    userData.animation.stateTime += deltaTime;

    // Handle death animation
    if (userData.isDead || demonState === "dead") {
      this.updateDeathAnimation(meshObject, userData);
      return;
    }

    // Handle falling demons
    if (userData.isFalling) {
      this.updateFallingAnimation(meshObject, userData, demon);
      return;
    }

    // Calculate distance to player
    const demonPosition = meshObject.position;
    const dx = playerPosition.x - demonPosition.x;
    const dz = playerPosition.z - demonPosition.z;
    const distanceToPlayer = Math.sqrt(dx * dx + dz * dz);

    // Get demon config - use default values if config not found
    const demonType = userData.demonType || "IMP";
    const config = DEMON_CONFIGS[demonType as DemonType] || DEMON_CONFIGS.IMP;

    // Update attack cooldown
    if (userData.attackCooldown > 0) {
      userData.attackCooldown--;
    }

    // Determine demon behavior based on distance to player
    if (distanceToPlayer < config.detectRange) {
      // Player detected - start hunting behavior
      if (distanceToPlayer <= config.attackRange) {
        this.executeDemonAttack(demon, playerPosition);
      } else if (distanceToPlayer <= config.chaseRange) {
        this.prepareDemonAttack(demon, playerPosition, deltaTime);
      } else {
        this.executeDemonChase(demon, playerPosition, deltaTime);
      }
    } else {
      this.executeDemonWander(demon, deltaTime);
    }

    // Keep demons within map bounds
    const maxDistance = 90; // Increased map bounds
    demonPosition.x = Math.max(
      -maxDistance,
      Math.min(maxDistance, demonPosition.x)
    );
    demonPosition.z = Math.max(
      -maxDistance,
      Math.min(maxDistance, demonPosition.z)
    );

    // Update DemonInstance position from mesh position (single-player)
    if (demon.mesh) {
      // Single-player: copy position from mesh to DemonInstance
      demon.position.copy(meshObject.position);
    }
    // For multiplayer demons, position is already updated directly on the object

    // Update animations based on current state
    this.updateDemonAnimation(demon, deltaTime);
  }

  private updateDeathAnimation(
    meshObject: THREE.Object3D,
    userData: any
  ): void {
    if (!userData.animation) return;

    userData.animation.currentState = "death";
    userData.animation.deathFrame += 0.1;

    // Death animation - dramatic fall and fade
    const deathProgress = Math.min(userData.animation.deathFrame, 1.0);

    // Rotate demon as it falls
    meshObject.rotation.x = (deathProgress * Math.PI) / 2;
    meshObject.rotation.z = Math.sin(deathProgress * Math.PI) * 0.5;

    // Scale down slightly
    const scale = userData.originalScale * (1 - deathProgress * 0.3);
    meshObject.scale.setScalar(scale);

    // Lower opacity of materials
    meshObject.traverse((child: any) => {
      if (child.isMesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat: any) => {
            mat.transparent = true;
            mat.opacity = 1 - deathProgress * 0.7;
          });
        } else {
          child.material.transparent = true;
          child.material.opacity = 1 - deathProgress * 0.7;
        }
      }
    });

    // Mark for removal when animation completes
    if (deathProgress >= 1.0) {
      setTimeout(() => {
        userData.markedForRemoval = true;
      }, 1000);
    }
  }

  private updateFallingAnimation(
    meshObject: THREE.Object3D,
    userData: any,
    demon: any
  ): void {
    userData.fallSpeed += 0.02;
    meshObject.rotation.x += userData.fallSpeed;

    // Add some spinning for dramatic effect
    meshObject.rotation.y += userData.fallSpeed * 0.5;
    meshObject.rotation.z += userData.fallSpeed * 0.3;

    if (meshObject.rotation.x >= Math.PI / 2) {
      meshObject.rotation.x = Math.PI / 2;
      userData.isFalling = false;

      // Update state properly for both types
      if (demon.mesh) {
        demon.state = "dead";
      } else {
        userData.isDead = true;
      }

      console.log(`Demon fell down and is now dead`);

      // Start death animation
      userData.animation = userData.animation || {
        currentState: "death",
        stateTime: 0,
        frameTime: 0,
        attackFrame: 0,
        deathFrame: 0,
        walkCycle: 0,
        idleCycle: 0,
      };
    }
  }

  private updateDemonAnimation(
    demon: DemonInstance | any,
    deltaTime: number
  ): void {
    // Handle both DemonInstance and direct THREE.Group objects
    let meshObject: THREE.Object3D;
    let userData: any;

    if (demon.mesh) {
      // DemonInstance structure
      meshObject = demon.mesh;
      userData = demon.mesh.userData;
    } else {
      // Direct THREE.Group object (multiplayer)
      meshObject = demon;
      userData = demon.userData;
    }

    if (!userData || userData.isDead) return;

    const animation = userData.animation;
    if (!animation) return;

    const time = performance.now() * 0.001;
    const demonType = userData.demonType || "IMP";

    // Get body parts for animation
    const body = meshObject.getObjectByName("body");
    const head = meshObject.getObjectByName("head");
    const leftArm = meshObject.getObjectByName("leftArm");
    const rightArm = meshObject.getObjectByName("rightArm");
    const leftLeg = meshObject.getObjectByName("leftLeg");
    const rightLeg = meshObject.getObjectByName("rightLeg");
    const leftEye = meshObject.getObjectByName("leftEye");
    const rightEye = meshObject.getObjectByName("rightEye");

    // Handle attack animation
    if (userData.isAttacking) {
      this.playAttackAnimation(meshObject, animation, demonType, time);
    } else if (userData.isMoving) {
      this.playWalkAnimation(meshObject, animation, demonType, time);
    } else {
      this.playIdleAnimation(meshObject, animation, demonType, time);
    }

    // Always animate eyes (glowing effect)
    this.animateEyes(leftEye, rightEye, time, demonType);

    // Add breathing effect to body
    if (body) {
      const breathe = 1 + Math.sin(time * 2) * 0.02;
      body.scale.set(breathe, 1, breathe);
    }
  }

  private playAttackAnimation(
    meshObject: THREE.Object3D,
    animation: DemonAnimation,
    demonType: string,
    time: number
  ): void {
    animation.currentState = "attacking";

    const attackSpeed = demonType === "IMP" ? 8 : demonType === "BARON" ? 4 : 6;
    const attackProgress = (time * attackSpeed) % (Math.PI * 2);

    // Scale up slightly during attack
    const attackScale = 1 + Math.sin(attackProgress) * 0.15;
    meshObject.scale.setScalar(
      (meshObject.userData?.originalScale || 1) * attackScale
    );

    // Aggressive arm movements
    const leftArm = meshObject.getObjectByName("leftArm");
    const rightArm = meshObject.getObjectByName("rightArm");
    const body = meshObject.getObjectByName("body");

    if (leftArm && rightArm) {
      leftArm.rotation.x = Math.sin(attackProgress) * 0.8 - 0.3;
      rightArm.rotation.x = Math.sin(attackProgress + Math.PI) * 0.8 - 0.3;
      leftArm.rotation.z = 0.3 + Math.sin(attackProgress) * 0.4;
      rightArm.rotation.z = -0.3 - Math.sin(attackProgress) * 0.4;
    }

    // Body lean forward during attack
    if (body) {
      body.rotation.x = Math.sin(attackProgress) * 0.2;
    }

    // Head movement for intimidation
    const head = meshObject.getObjectByName("head");
    if (head) {
      head.rotation.x = Math.sin(attackProgress * 2) * 0.1;
      head.rotation.y = Math.sin(attackProgress) * 0.15;
    }
  }

  private playWalkAnimation(
    meshObject: THREE.Object3D,
    animation: DemonAnimation,
    demonType: string,
    time: number
  ): void {
    animation.currentState = "walking";
    animation.walkCycle += 0.1;

    const walkSpeed = demonType === "IMP" ? 6 : demonType === "BARON" ? 3 : 4;
    const walkProgress = time * walkSpeed;

    // Leg movement
    const leftLeg = meshObject.getObjectByName("leftLeg");
    const rightLeg = meshObject.getObjectByName("rightLeg");

    if (leftLeg && rightLeg) {
      leftLeg.rotation.x = Math.sin(walkProgress) * 0.6;
      rightLeg.rotation.x = Math.sin(walkProgress + Math.PI) * 0.6;
    }

    // Arm swinging
    const leftArm = meshObject.getObjectByName("leftArm");
    const rightArm = meshObject.getObjectByName("rightArm");

    if (leftArm && rightArm) {
      leftArm.rotation.x = Math.sin(walkProgress + Math.PI) * 0.4;
      rightArm.rotation.x = Math.sin(walkProgress) * 0.4;
    }

    // Body bobbing
    const bobAmount = demonType === "BARON" ? 0.1 : 0.15;
    meshObject.position.y += Math.sin(walkProgress * 2) * bobAmount;

    // Slight body rotation for natural movement
    const body = meshObject.getObjectByName("body");
    if (body) {
      body.rotation.y = Math.sin(walkProgress) * 0.1;
    }
  }

  private playIdleAnimation(
    meshObject: THREE.Object3D,
    animation: DemonAnimation,
    demonType: string,
    time: number
  ): void {
    animation.currentState = "idle";
    animation.idleCycle += 0.02;

    const idleSpeed = 1.5;
    const idleProgress = time * idleSpeed;

    // Subtle breathing and swaying
    const sway = Math.sin(idleProgress) * 0.05;
    meshObject.rotation.y += sway * 0.1;

    // Gentle bobbing
    const bobAmount = demonType === "BARON" ? 0.05 : 0.08;
    meshObject.position.y += Math.sin(idleProgress * 0.8) * bobAmount;

    // Head scanning (looking around)
    const head = meshObject.getObjectByName("head");
    if (head && Math.random() < 0.01) {
      // Random head turns
      head.rotation.y = (Math.random() - 0.5) * 0.6;
    }

    // Occasional arm twitches for menacing effect
    const leftArm = meshObject.getObjectByName("leftArm");
    const rightArm = meshObject.getObjectByName("rightArm");

    if (leftArm && rightArm && Math.random() < 0.005) {
      const twitch = (Math.random() - 0.5) * 0.3;
      leftArm.rotation.x += twitch;
      rightArm.rotation.x += twitch;
    }

    // Occasional idle growling
    if (Math.random() < 0.001 && this.audioSystem) {
      // Very rare idle growls
      this.audioSystem.playDemonGrowlSound();
    }
  }

  private animateEyes(
    leftEye: any,
    rightEye: any,
    time: number,
    demonType: string
  ): void {
    if (!leftEye || !rightEye) return;

    // Glowing intensity based on demon type
    const baseIntensity =
      demonType === "BARON" ? 0.8 : demonType === "CACODEMON" ? 0.6 : 0.4;
    const pulse = Math.sin(time * 4) * 0.2 + baseIntensity;

    // Update eye glow - check if objects are meshes first
    if (
      leftEye.isMesh &&
      leftEye.material &&
      "emissiveIntensity" in leftEye.material
    ) {
      (leftEye.material as any).emissiveIntensity = pulse;
    }
    if (
      rightEye.isMesh &&
      rightEye.material &&
      "emissiveIntensity" in rightEye.material
    ) {
      (rightEye.material as any).emissiveIntensity = pulse;
    }

    // Random eye blink effect
    if (Math.random() < 0.01) {
      const blinkScale = Math.random() * 0.5 + 0.5;
      leftEye.scale.y = blinkScale;
      rightEye.scale.y = blinkScale;

      setTimeout(() => {
        leftEye.scale.y = 1;
        rightEye.scale.y = 1;
      }, 100);
    }
  }

  private executeDemonAttack(
    demon: DemonInstance | any,
    playerPosition: THREE.Vector3
  ): void {
    // Handle both DemonInstance and direct THREE.Group objects
    let meshObject: THREE.Object3D;
    let userData: any;

    if (demon.mesh) {
      // DemonInstance structure
      meshObject = demon.mesh;
      userData = demon.mesh.userData;
    } else {
      // Direct THREE.Group object (multiplayer)
      meshObject = demon;
      userData = demon.userData;
    }

    if (!userData) return;

    // Initialize attack state if not present - matches original
    if (userData.attackCooldown === undefined) {
      userData.attackCooldown = 0;
      userData.isAttacking = false;
      userData.hasAttacked = false;
    }

    // Stop all movement during attack
    userData.isAttacking = true;
    userData.isMoving = false;

    // Set demon state to attacking for collision detection
    if (demon.mesh) {
      demon.state = "attacking";
    }

    // Execute attack if cooldown is ready - matches original timing
    if (!userData.hasAttacked && userData.attackCooldown <= 0) {
      userData.attackCooldown = 180; // 3 seconds at 60fps - matches original
      userData.hasAttacked = true;

      // Calculate direction to player - matches original
      const dx = playerPosition.x - meshObject.position.x;
      const dz = playerPosition.z - meshObject.position.z;
      const direction = Math.atan2(dx, dz);

      // Attack animation - lunge forward - matches original
      const lungeDistance = 0.8;
      meshObject.position.x += Math.sin(direction) * lungeDistance;
      meshObject.position.z += Math.cos(direction) * lungeDistance;

      // Get demon config for damage calculation
      const demonType = userData.demonType || "IMP";
      const config = DEMON_CONFIGS[demonType as DemonType] || DEMON_CONFIGS.IMP;

      console.log(`Demon executing attack! Damage: ${config.attackDamage}`);

      // Play attack sound based on demon type
      if (this.audioSystem) {
        this.audioSystem.playDemonAttackSound(demonType);
      }
    }

    // Face the player during attack
    const dx = playerPosition.x - meshObject.position.x;
    const dz = playerPosition.z - meshObject.position.z;
    const direction = Math.atan2(dx, dz);
    meshObject.rotation.y = direction;

    // Reset attack flag when cooldown ends - matches original timing
    if (userData.attackCooldown <= 60) {
      // Last 1 second of cooldown - matches original
      userData.hasAttacked = false;
      userData.isAttacking = false;

      // Reset demon state
      if (demon.mesh) {
        demon.state = "idle";
      }
    }
  }

  private prepareDemonAttack(
    demon: DemonInstance | any,
    playerPosition: THREE.Vector3,
    deltaTime: number
  ): void {
    // Handle both DemonInstance and direct THREE.Group objects
    let meshObject: THREE.Object3D;
    let userData: any;

    if (demon.mesh) {
      // DemonInstance structure
      meshObject = demon.mesh;
      userData = demon.mesh.userData;
    } else {
      // Direct THREE.Group object (multiplayer)
      meshObject = demon;
      userData = demon.userData;
    }

    if (!userData) return;

    userData.isAttacking = false;
    userData.isMoving = true;

    // Get demon config for speed
    const demonType = userData.demonType || "IMP";
    const config = DEMON_CONFIGS[demonType as DemonType] || DEMON_CONFIGS.IMP;

    // Calculate direction to player
    const dx = playerPosition.x - meshObject.position.x;
    const dz = playerPosition.z - meshObject.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance === 0) return;

    const normalizedX = dx / distance;
    const normalizedZ = dz / distance;
    const direction = Math.atan2(dx, dz);

    // Move slowly toward player while preparing - matches original
    const prepareSpeed = config.speed * 0.6; // Slower approach - matches original
    const moveDistance = prepareSpeed * 0.016; // Frame-based movement

    meshObject.position.x += normalizedX * moveDistance;
    meshObject.position.z += normalizedZ * moveDistance;

    // Face the player
    meshObject.rotation.y = direction;

    // Set demon state to preparing for collision detection
    if (demon.mesh) {
      demon.state = "preparing";
    }
  }

  private executeDemonChase(
    demon: DemonInstance | any,
    playerPosition: THREE.Vector3,
    deltaTime: number
  ): void {
    // Handle both DemonInstance and direct THREE.Group objects
    let meshObject: THREE.Object3D;
    let userData: any;

    if (demon.mesh) {
      // DemonInstance structure
      meshObject = demon.mesh;
      userData = demon.mesh.userData;
    } else {
      // Direct THREE.Group object (multiplayer)
      meshObject = demon;
      userData = demon.userData;
    }

    if (!userData) return;

    userData.isAttacking = false;
    userData.isMoving = true;

    // Get demon config for speed
    const demonType = userData.demonType || "IMP";
    const config = DEMON_CONFIGS[demonType as DemonType] || DEMON_CONFIGS.IMP;

    // Calculate direction to player - matches original pathfinding
    const dx = playerPosition.x - meshObject.position.x;
    const dz = playerPosition.z - meshObject.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance === 0) return;

    const normalizedX = dx / distance;
    const normalizedZ = dz / distance;
    const direction = Math.atan2(dx, dz);

    // Fast aggressive movement toward player - matches original speed calculation
    const chaseSpeed = config.speed * 1.5; // Faster when chasing - matches original
    const moveDistance = chaseSpeed * 0.016; // Frame-based movement like original

    // Move directly toward player using pathfinding
    meshObject.position.x += normalizedX * moveDistance;
    meshObject.position.z += normalizedZ * moveDistance;

    // Face movement direction
    meshObject.rotation.y = direction;

    // Play chase sound occasionally
    if (this.audioSystem && Math.random() < 0.01) {
      // 1% chance per frame
      this.audioSystem.playDemonChaseSound(demonType);
    }

    // Set demon state to chasing for collision detection
    if (demon.mesh) {
      demon.state = "chasing";
    }
  }

  private executeDemonWander(
    demon: DemonInstance | any,
    deltaTime: number
  ): void {
    // Handle both DemonInstance and direct THREE.Group objects
    let meshObject: THREE.Object3D;
    let userData: any;

    if (demon.mesh) {
      // DemonInstance structure
      meshObject = demon.mesh;
      userData = demon.mesh.userData;
    } else {
      // Direct THREE.Group object (multiplayer)
      meshObject = demon;
      userData = demon.userData;
    }

    if (!userData) return;

    userData.isAttacking = false;

    // Initialize wander properties if not set
    if (userData.wanderTimer === undefined) {
      userData.wanderTimer = 0;
      userData.wanderDirection = Math.random() * Math.PI * 2;
    }

    userData.wanderTimer++;

    // Change direction occasionally - matches original timing
    if (userData.wanderTimer > 180 + Math.random() * 120) {
      // More frequent direction changes - matches original
      userData.wanderDirection += (Math.random() - 0.5) * 1.0; // Larger direction changes
      userData.wanderTimer = 0;
    }

    // Get demon config for speed
    const demonType = userData.demonType || "IMP";
    const config = DEMON_CONFIGS[demonType as DemonType] || DEMON_CONFIGS.IMP;

    // Check if demon is actually moving
    const wanderSpeed = config.speed * 0.3; // Very slow when wandering
    const moveDistance = wanderSpeed * 0.016; // Frame-based movement

    if (moveDistance > 0.001) {
      userData.isMoving = true;
      meshObject.position.x +=
        Math.sin(userData.wanderDirection) * moveDistance;
      meshObject.position.z +=
        Math.cos(userData.wanderDirection) * moveDistance;
    } else {
      userData.isMoving = false;
    }

    // Face movement direction
    meshObject.rotation.y = userData.wanderDirection;

    // Set demon state to wandering
    if (demon.mesh) {
      demon.state = "wandering";
    }
  }

  public startWaveSystem(): void {
    this.waveInProgress = true;
    this.spawnWave();
  }

  private spawnWave(): void {
    console.log(`🌊 Starting wave ${this.currentWave}`);

    const demonTypes = getDemonTypesForWave(this.currentWave);
    this.demonsThisWave = demonTypes.length;
    this.demonsSpawnedThisWave = 0;

    // Reset type counts
    this.demonTypeCounts = { IMP: 0, DEMON: 0, CACODEMON: 0, BARON: 0 };

    // Spawn demons with delay
    this.spawnDemonsWithDelay(demonTypes);
  }

  private spawnDemonsWithDelay(demonTypes: DemonType[]): void {
    if (this.demonsSpawnedThisWave >= demonTypes.length) {
      return;
    }

    const demonType = demonTypes[this.demonsSpawnedThisWave];
    if (!demonType) return;

    this.spawnDemon(demonType);
    this.demonsSpawnedThisWave++;
    this.demonTypeCounts[demonType]++;

    if (this.demonsSpawnedThisWave < demonTypes.length) {
      this.demonSpawnTimer = setTimeout(() => {
        this.spawnDemonsWithDelay(demonTypes);
      }, 1000); // 1 second between spawns
    }
  }

  private spawnDemon(demonType: DemonType): void {
    const config = DEMON_CONFIGS[demonType];
    const demon = this.createDemonModel(demonType);

    // Position demon randomly around the map edges
    const angle = Math.random() * Math.PI * 2;
    const distance = 35 + Math.random() * 10; // 35-45 units from center

    const position = new THREE.Vector3(
      Math.cos(angle) * distance,
      0,
      Math.sin(angle) * distance
    );

    demon.position.copy(position);
    demon.scale.setScalar(config.scale);

    const demonInstance: DemonInstance = {
      id: `demon_${Date.now()}_${Math.random()}`,
      type: demonType,
      mesh: demon,
      state: "idle",
      health: config.health,
      position: position,
      targetPosition: position.clone(),
      patrolCenter: position.clone(),
      patrolRadius: 10,
      lastAttackTime: 0,
      lastStateChange: Date.now(),
      movementSpeed: config.speed,
    };

    // Set up user data
    demon.userData = {
      demonType,
      detectRange: config.detectRange,
      attackRange: config.attackRange,
      chaseRange: config.chaseRange,
      attackDamage: config.attackDamage,
      walkSpeed: config.speed, // Add walk speed from config
      attackCooldown: 0,
      isAttacking: false,
      isFalling: false,
      isDead: false,
      attackScaleSet: false,
      originalScale: config.scale,
      wanderDirection: Math.random() * Math.PI * 2, // Add initial wander direction
      wanderTimer: Math.random() * 120, // Add initial wander timer
    };

    this.demons.push(demonInstance);
    this.scene.add(demon);

    // Play spawn sound
    if (this.audioSystem) {
      this.audioSystem.playDemonSpawnSound(demonType);
    }

    console.log(
      `👹 Spawned ${demonType} at position (${position.x.toFixed(
        1
      )}, ${position.z.toFixed(1)})`
    );
  }

  private createDemonModel(demonType: DemonType): THREE.Group {
    const typeData = DEMON_CONFIGS[demonType];
    const demonGroup = new THREE.Group();

    // Create enhanced materials with DOOM-style aesthetics
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: typeData.color,
      shininess: 10,
      specular: 0x222222,
    });

    const headMaterial = new THREE.MeshPhongMaterial({
      color: typeData.headColor,
      shininess: 15,
      specular: 0x333333,
    });

    // Create enhanced body geometry based on demon type
    let bodyGeometry: THREE.BufferGeometry;
    if (demonType === "CACODEMON") {
      // Cacodemon: Large floating sphere
      bodyGeometry = new THREE.SphereGeometry(0.8, 16, 12);
    } else if (demonType === "BARON") {
      // Baron: Tall imposing figure
      bodyGeometry = new THREE.CylinderGeometry(0.4, 0.5, 1.6, 12);
    } else {
      // Imp/Demon: More muscular torso
      bodyGeometry = new THREE.CylinderGeometry(0.25, 0.35, 1.2, 8);
    }

    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = demonType === "CACODEMON" ? 1.0 : 0.6;
    body.name = "body";
    demonGroup.add(body);

    // Head with demon-specific features
    let headGeometry: THREE.BufferGeometry;
    if (demonType === "CACODEMON") {
      // Cacodemon: Small head on top of sphere
      headGeometry = new THREE.SphereGeometry(0.3, 12, 8);
    } else if (demonType === "BARON") {
      // Baron: Angular, menacing head
      headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    } else {
      // Imp/Demon: Rounded but angular
      headGeometry = new THREE.CylinderGeometry(0.2, 0.25, 0.4, 8);
    }

    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = demonType === "CACODEMON" ? 1.5 : 1.4;
    head.name = "head";
    demonGroup.add(head);

    // Enhanced glowing eyes
    const eyeGeometry = new THREE.SphereGeometry(0.06, 8, 8);
    const eyeMaterial = new THREE.MeshLambertMaterial({
      color: typeData.eyeColor,
      emissive: new THREE.Color(typeData.eyeColor),
      emissiveIntensity: 0.8,
    });

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial.clone());

    if (demonType === "CACODEMON") {
      leftEye.position.set(-0.15, 1.55, 0.25);
      rightEye.position.set(0.15, 1.55, 0.25);
    } else {
      leftEye.position.set(-0.1, 1.45, 0.3);
      rightEye.position.set(0.1, 1.45, 0.3);
    }

    leftEye.name = "leftEye";
    rightEye.name = "rightEye";
    demonGroup.add(leftEye);
    demonGroup.add(rightEye);

    // Demon-specific features
    if (demonType === "CACODEMON") {
      this.addCacodemonFeatures(demonGroup, typeData);
    } else {
      this.addHumanoidFeatures(demonGroup, typeData, demonType);
    }

    // Add demon-specific details
    this.addDemonDetails(demonGroup, demonType, typeData);

    // Enable shadows and set up materials
    demonGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Enhance material properties for DOOM aesthetic
        if (
          mesh.material &&
          (mesh.material as any).type === "MeshPhongMaterial"
        ) {
          const mat = mesh.material as THREE.MeshPhongMaterial;
          mat.flatShading = true; // More angular DOOM look
        }
      }
    });

    return demonGroup;
  }

  private addCacodemonFeatures(demonGroup: THREE.Group, typeData: any): void {
    // Cacodemon is a floating sphere - no arms or legs needed
    // Add tentacles or spikes instead
    const spikeGeometry = new THREE.ConeGeometry(0.05, 0.3, 6);
    const spikeMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });

    for (let i = 0; i < 6; i++) {
      const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
      const angle = (i / 6) * Math.PI * 2;
      spike.position.set(
        Math.cos(angle) * 0.7,
        0.8 + Math.sin(i) * 0.2,
        Math.sin(angle) * 0.7
      );
      spike.rotation.z = angle;
      demonGroup.add(spike);
    }

    // Add large mouth
    const mouthGeometry = new THREE.BoxGeometry(0.4, 0.1, 0.1);
    const mouthMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    mouth.position.set(0, 1.0, 0.3);
    demonGroup.add(mouth);
  }

  private addHumanoidFeatures(
    demonGroup: THREE.Group,
    typeData: any,
    demonType: DemonType
  ): void {
    const armMaterial = new THREE.MeshPhongMaterial({
      color: typeData.headColor,
      shininess: 10,
    });

    // Enhanced arms with claws
    const armGeometry =
      demonType === "BARON"
        ? new THREE.CylinderGeometry(0.08, 0.12, 0.8, 8)
        : new THREE.CylinderGeometry(0.06, 0.1, 0.7, 6);

    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.45, 0.8, 0);
    leftArm.rotation.z = 0.3;
    leftArm.name = "leftArm";
    demonGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.45, 0.8, 0);
    rightArm.rotation.z = -0.3;
    rightArm.name = "rightArm";
    demonGroup.add(rightArm);

    // Add claws to arms
    const clawGeometry = new THREE.ConeGeometry(0.03, 0.15, 6);
    const clawMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });

    for (let side = 0; side < 2; side++) {
      const armSide = side === 0 ? -1 : 1;
      for (let i = 0; i < 3; i++) {
        const claw = new THREE.Mesh(clawGeometry, clawMaterial);
        claw.position.set(armSide * 0.45 + (i - 1) * 0.05, 0.4, 0.1);
        claw.rotation.x = Math.PI;
        demonGroup.add(claw);
      }
    }

    // Enhanced legs
    const legGeometry =
      demonType === "BARON"
        ? new THREE.CylinderGeometry(0.12, 0.15, 1.0, 8)
        : new THREE.CylinderGeometry(0.1, 0.12, 0.8, 6);

    const legMaterial = new THREE.MeshPhongMaterial({
      color: typeData.color,
      shininess: 8,
    });

    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.2, -0.4, 0);
    leftLeg.name = "leftLeg";
    demonGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.2, -0.4, 0);
    rightLeg.name = "rightLeg";
    demonGroup.add(rightLeg);

    // Add hooves
    const hoofGeometry = new THREE.BoxGeometry(0.15, 0.1, 0.25);
    const hoofMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 });

    const leftHoof = new THREE.Mesh(hoofGeometry, hoofMaterial);
    leftHoof.position.set(-0.2, -0.85, 0.05);
    demonGroup.add(leftHoof);

    const rightHoof = new THREE.Mesh(hoofGeometry, hoofMaterial);
    rightHoof.position.set(0.2, -0.85, 0.05);
    demonGroup.add(rightHoof);
  }

  private addDemonDetails(
    demonGroup: THREE.Group,
    demonType: DemonType,
    typeData: any
  ): void {
    if (demonType === "BARON") {
      // Baron: Crown and shoulder armor
      const crownGeometry = new THREE.ConeGeometry(0.25, 0.35, 8);
      const crownMaterial = new THREE.MeshPhongMaterial({
        color: 0x8b0000,
        emissive: new THREE.Color(0x440000),
        emissiveIntensity: 0.3,
      });
      const crown = new THREE.Mesh(crownGeometry, crownMaterial);
      crown.position.y = 1.8;
      demonGroup.add(crown);

      // Shoulder armor
      const shoulderGeometry = new THREE.SphereGeometry(0.15, 8, 6);
      const shoulderMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });

      const leftShoulder = new THREE.Mesh(shoulderGeometry, shoulderMaterial);
      leftShoulder.position.set(-0.35, 1.1, 0);
      demonGroup.add(leftShoulder);

      const rightShoulder = new THREE.Mesh(shoulderGeometry, shoulderMaterial);
      rightShoulder.position.set(0.35, 1.1, 0);
      demonGroup.add(rightShoulder);
    } else if (demonType === "DEMON") {
      // Demon: Helmet and battle scars
      const helmetGeometry = new THREE.BoxGeometry(0.45, 0.2, 0.45);
      const helmetMaterial = new THREE.MeshPhongMaterial({
        color: 0x444444,
        shininess: 50,
      });
      const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
      helmet.position.y = 1.6;
      demonGroup.add(helmet);

      // Add helmet spikes
      const spikeGeometry = new THREE.ConeGeometry(0.03, 0.1, 6);
      const spikeMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });

      for (let i = 0; i < 4; i++) {
        const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
        const angle = (i / 4) * Math.PI * 2;
        spike.position.set(Math.cos(angle) * 0.2, 1.7, Math.sin(angle) * 0.2);
        demonGroup.add(spike);
      }
    } else if (demonType === "IMP") {
      // Imp: Small horns
      const hornGeometry = new THREE.ConeGeometry(0.02, 0.15, 6);
      const hornMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });

      const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
      leftHorn.position.set(-0.08, 1.65, 0);
      leftHorn.rotation.z = -0.3;
      demonGroup.add(leftHorn);

      const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
      rightHorn.position.set(0.08, 1.65, 0);
      rightHorn.rotation.z = 0.3;
      demonGroup.add(rightHorn);
    }

    // Add ambient glow effect for all demons
    const glowGeometry = new THREE.SphereGeometry(0.5, 16, 8);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: typeData.eyeColor,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.y = 0.8;
    glow.scale.setScalar(typeData.scale * 1.5);
    demonGroup.add(glow);
  }

  private checkWaveComplete(): void {
    if (!this.waveInProgress) return;

    const aliveDemonsCount = this.demons.filter(
      (d) => d.state !== "dead"
    ).length;

    if (
      aliveDemonsCount === 0 &&
      this.demonsSpawnedThisWave >= this.demonsThisWave
    ) {
      console.log(`🎉 Wave ${this.currentWave} complete!`);
      this.waveInProgress = false;

      // Start next wave after delay
      this.nextWaveTimer = setTimeout(() => {
        this.currentWave++;
        this.startWaveSystem();
      }, this.timeBetweenWaves);
    }
  }

  public checkBulletCollision(bullet: Bullet): string | null {
    const bulletPosition = bullet.mesh.position;

    for (const demon of this.demons) {
      if (demon.state === "dead") continue;

      const distance = bulletPosition.distanceTo(demon.position);
      if (distance < 1.0) {
        // Hit threshold
        return demon.id;
      }
    }

    return null;
  }

  public damageDemon(demonId: string, damage: number): boolean {
    const demon = this.demons.find((d) => d.id === demonId);
    if (demon) {
      demon.health -= damage;
      if (demon.health <= 0) {
        demon.state = "dead";
        demon.mesh.userData.isFalling = true;
        demon.mesh.userData.fallSpeed = 0;
        return true; // Demon killed
      }
    }
    return false; // Demon damaged but not killed
  }

  public getNearbyDemons(
    position: THREE.Vector3,
    radius: number
  ): DemonInstance[] {
    return this.demons.filter((demon) => {
      if (demon.state === "dead") return false;
      return position.distanceTo(demon.position) <= radius;
    });
  }

  public getDemonDamage(demonType: string): number {
    const config = DEMON_CONFIGS[demonType as DemonType];
    return config ? config.attackDamage : 10;
  }

  public reset(): void {
    // Clear timers
    if (this.demonSpawnTimer) {
      clearTimeout(this.demonSpawnTimer);
      this.demonSpawnTimer = null;
    }
    if (this.nextWaveTimer) {
      clearTimeout(this.nextWaveTimer);
      this.nextWaveTimer = null;
    }

    // Remove all demons from scene
    this.demons.forEach((demon) => {
      this.scene.remove(demon.mesh);
    });

    // Reset state
    this.demons = [];
    this.currentWave = 1;
    this.demonsThisWave = 0;
    this.demonsSpawnedThisWave = 0;
    this.waveInProgress = false;
    this.demonTypeCounts = {
      IMP: 0,
      DEMON: 0,
      CACODEMON: 0,
      BARON: 0,
    };
  }
}
