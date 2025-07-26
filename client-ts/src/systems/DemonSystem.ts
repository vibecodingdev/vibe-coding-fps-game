import * as THREE from "three";
import {
  DemonType,
  DemonInstance,
  DemonSystem as IDemonSystem,
} from "@/types/demons";
import { Bullet } from "@/types/weapons";
import { DEMON_CONFIGS, getDemonTypesForWave } from "@/config/demons";

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
  private demonSpawnTimer: NodeJS.Timeout | null = null;
  private nextWaveTimer: NodeJS.Timeout | null = null;
  private readonly timeBetweenWaves = 5000; // 5 seconds between waves

  public async initialize(): Promise<void> {
    console.log("🔥 DemonSystem initialized");
  }

  public setScene(scene: THREE.Scene): void {
    this.scene = scene;
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

    // Get player position (this should come from the player controller)
    // For now, we'll use camera position as a placeholder
    const camera = this.scene.userData?.camera as THREE.Camera;
    if (!camera) return;

    const playerPosition = camera.position;

    // Handle falling demons
    if (userData.isFalling) {
      userData.fallSpeed += 0.02;
      meshObject.rotation.x += userData.fallSpeed;

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

        // Mark for removal after a short delay
        setTimeout(() => {
          userData.markedForRemoval = true;
        }, 2000); // Remove corpse after 2 seconds
      }
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
        this.prepareDemonAttack(demon, playerPosition);
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

    // Update mesh position and rotation (already updated in place for multiplayer demons)
    if (demon.mesh) {
      // Single-player: copy position from DemonInstance to mesh
      demon.mesh.position.copy(demon.position);
    }
    // For multiplayer demons, position is already updated directly on the object

    // Add subtle animation effects
    this.updateDemonAnimation(demon, deltaTime);
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

    // Handle attack scaling
    if (userData.isAttacking) {
      if (!userData.attackScaleSet) {
        userData.originalScale = meshObject.scale.x;
        meshObject.scale.setScalar(userData.originalScale * 1.15);
        userData.attackScaleSet = true;
      }
    } else {
      if (userData.attackScaleSet) {
        meshObject.scale.setScalar(userData.originalScale || 1);
        userData.attackScaleSet = false;
      }
    }

    // Add subtle bobbing animation
    const time = performance.now() * 0.001;
    const bobAmount = 0.05;
    const originalY = meshObject.position.y;
    meshObject.position.y = originalY + Math.sin(time * 3) * bobAmount;
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

    // Stop all movement during attack
    userData.isAttacking = true;

    // Execute attack if cooldown is ready
    if (!userData.hasAttacked && userData.attackCooldown <= 0) {
      userData.attackCooldown = 180; // 3 seconds at 60fps
      userData.hasAttacked = true;

      // Calculate direction to player
      const dx = playerPosition.x - meshObject.position.x;
      const dz = playerPosition.z - meshObject.position.z;
      const direction = Math.atan2(dx, dz);

      // Attack animation - lunge forward
      const lungeDistance = 0.8;
      meshObject.position.x += Math.sin(direction) * lungeDistance;
      meshObject.position.z += Math.cos(direction) * lungeDistance;

      console.log("Demon executing attack!");
    }

    // Face the player during attack
    const dx = playerPosition.x - meshObject.position.x;
    const dz = playerPosition.z - meshObject.position.z;
    const direction = Math.atan2(dx, dz);
    meshObject.rotation.y = direction;

    // Reset attack flag when cooldown ends
    if (userData.attackCooldown <= 60) {
      userData.hasAttacked = false;
      userData.isAttacking = false;
    }
  }

  private prepareDemonAttack(
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

    userData.isAttacking = false;

    // Move slowly toward player while preparing
    const prepareSpeed = (userData.walkSpeed || 0.3) * 0.6;
    const moveDistance = prepareSpeed * 0.016;

    const dx = playerPosition.x - meshObject.position.x;
    const dz = playerPosition.z - meshObject.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance > 0) {
      const normalizedX = dx / distance;
      const normalizedZ = dz / distance;

      meshObject.position.x += normalizedX * moveDistance;
      meshObject.position.z += normalizedZ * moveDistance;

      // Face the player
      const direction = Math.atan2(dx, dz);
      meshObject.rotation.y = direction;
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

    // Enhanced chase behavior
    const chaseSpeed = userData.walkSpeed || 0.3;
    const moveDistance = chaseSpeed * deltaTime * 0.1;

    const dx = playerPosition.x - meshObject.position.x;
    const dz = playerPosition.z - meshObject.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance > 0) {
      const normalizedX = dx / distance;
      const normalizedZ = dz / distance;

      meshObject.position.x += normalizedX * moveDistance;
      meshObject.position.z += normalizedZ * moveDistance;

      // Face movement direction
      const direction = Math.atan2(dx, dz);
      meshObject.rotation.y = direction;
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

    // Wandering behavior
    const wanderSpeed = (userData.walkSpeed || 0.3) * 0.3;
    const moveDistance = wanderSpeed * deltaTime * 0.1;

    // Update wander timer
    if (!userData.wanderTimer) userData.wanderTimer = 0;
    userData.wanderTimer--;

    if (userData.wanderTimer <= 0) {
      userData.wanderDirection = Math.random() * Math.PI * 2;
      userData.wanderTimer = 60 + Math.random() * 120;
    }

    // Move in wander direction
    meshObject.position.x += Math.sin(userData.wanderDirection) * moveDistance;
    meshObject.position.z += Math.cos(userData.wanderDirection) * moveDistance;
    meshObject.rotation.y = userData.wanderDirection;
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
      attackCooldown: 0,
      isAttacking: false,
      isFalling: false,
      isDead: false,
      attackScaleSet: false,
      originalScale: config.scale,
    };

    this.demons.push(demonInstance);
    this.scene.add(demon);

    console.log(
      `👹 Spawned ${demonType} at position (${position.x.toFixed(
        1
      )}, ${position.z.toFixed(1)})`
    );
  }

  private createDemonModel(demonType: DemonType): THREE.Group {
    const typeData = DEMON_CONFIGS[demonType];
    const demonGroup = new THREE.Group();

    // Body
    const bodyGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.3);
    const bodyMaterial = new THREE.MeshLambertMaterial({
      color: typeData.color,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.6;
    demonGroup.add(body);

    // Head
    const headGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const headMaterial = new THREE.MeshLambertMaterial({
      color: typeData.headColor,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.4;
    demonGroup.add(head);

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const eyeMaterial = new THREE.MeshLambertMaterial({
      color: typeData.eyeColor,
      emissive: new THREE.Color(typeData.eyeColor),
      emissiveIntensity: 0.5,
    });

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.1, 1.45, 0.25);
    demonGroup.add(leftEye);

    // Create a new material instead of cloning to avoid uniform issues
    const rightEyeMaterial = new THREE.MeshLambertMaterial({
      color: typeData.eyeColor,
      emissive: new THREE.Color(typeData.eyeColor),
      emissiveIntensity: 0.5,
    });
    const rightEye = new THREE.Mesh(eyeGeometry, rightEyeMaterial);
    rightEye.position.set(0.1, 1.45, 0.25);
    demonGroup.add(rightEye);

    // Arms
    const armGeometry = new THREE.BoxGeometry(0.15, 0.7, 0.15);
    const armMaterial = new THREE.MeshLambertMaterial({
      color: typeData.headColor,
    });

    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.45, 0.8, 0);
    leftArm.rotation.z = 0.3;
    demonGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.45, 0.8, 0);
    rightArm.rotation.z = -0.3;
    demonGroup.add(rightArm);

    // Legs
    const legGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
    const legMaterial = new THREE.MeshLambertMaterial({
      color: typeData.color,
    });

    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.15, -0.4, 0);
    demonGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.15, -0.4, 0);
    demonGroup.add(rightLeg);

    // Special features based on demon type
    if (demonType === "CACODEMON" || demonType === "BARON") {
      const armorGeometry = new THREE.BoxGeometry(0.8, 0.3, 0.4);
      const armorMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
      const armor = new THREE.Mesh(armorGeometry, armorMaterial);
      armor.position.y = 1.0;
      demonGroup.add(armor);
    }

    if (demonType === "DEMON") {
      const helmetGeometry = new THREE.BoxGeometry(0.45, 0.15, 0.45);
      const helmetMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
      const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
      helmet.position.y = 1.6;
      demonGroup.add(helmet);
    }

    if (demonType === "BARON") {
      const crownGeometry = new THREE.ConeGeometry(0.3, 0.4, 6);
      const crownMaterial = new THREE.MeshLambertMaterial({ color: 0x8b0000 });
      const crown = new THREE.Mesh(crownGeometry, crownMaterial);
      crown.position.y = 1.8;
      demonGroup.add(crown);
    }

    // Enable shadows
    demonGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return demonGroup;
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
