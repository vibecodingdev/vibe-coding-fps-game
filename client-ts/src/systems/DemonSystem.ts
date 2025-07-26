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
    this.demons.forEach((demon) => {
      this.updateDemonAI(demon, deltaTime);
    });

    // Remove demons marked for removal
    this.removeDeadDemons();

    // Check if wave is complete
    this.checkWaveComplete();
  }

  private removeDeadDemons(): void {
    // Find demons marked for removal
    const demonsToRemove = this.demons.filter(
      (demon) => demon.mesh.userData.markedForRemoval
    );

    // Remove them from scene and array
    demonsToRemove.forEach((demon) => {
      console.log(`🗑️ Removing dead ${demon.type} from scene`);
      this.scene.remove(demon.mesh);

      // Remove from demons array
      const index = this.demons.indexOf(demon);
      if (index > -1) {
        this.demons.splice(index, 1);
      }
    });
  }

  private updateDemonAI(demon: DemonInstance, deltaTime: number): void {
    if (!demon.mesh.userData || demon.state === "dead") return;

    // Get player position (this should come from the player controller)
    // For now, we'll use camera position as a placeholder
    const camera = this.scene.userData?.camera as THREE.Camera;
    if (!camera) return;

    const playerPosition = camera.position;
    const userData = demon.mesh.userData;

    // Handle falling demons
    if (userData.isFalling) {
      userData.fallSpeed += 0.02;
      demon.mesh.rotation.x += userData.fallSpeed;

      if (demon.mesh.rotation.x >= Math.PI / 2) {
        demon.mesh.rotation.x = Math.PI / 2;
        userData.isFalling = false;
        demon.state = "dead";
        console.log(`${demon.type} fell down and is now dead`);

        // Mark for removal after a short delay
        setTimeout(() => {
          if (demon.state === "dead") {
            userData.markedForRemoval = true;
          }
        }, 2000); // Remove corpse after 2 seconds
      }
      return;
    }

    // Calculate distance to player
    const dx = playerPosition.x - demon.position.x;
    const dz = playerPosition.z - demon.position.z;
    const distanceToPlayer = Math.sqrt(dx * dx + dz * dz);

    // Get demon config
    const config = DEMON_CONFIGS[demon.type];

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
    demon.position.x = Math.max(
      -maxDistance,
      Math.min(maxDistance, demon.position.x)
    );
    demon.position.z = Math.max(
      -maxDistance,
      Math.min(maxDistance, demon.position.z)
    );

    // Update mesh position and rotation
    demon.mesh.position.copy(demon.position);

    // Add subtle animation effects
    this.updateDemonAnimation(demon, deltaTime);
  }

  private updateDemonAnimation(demon: DemonInstance, _deltaTime: number): void {
    const time = Date.now() * 0.001;

    // Breathing/bobbing animation
    const bobAmount = 0.1;
    const bobSpeed = 2.0;
    demon.mesh.position.y =
      demon.position.y + Math.sin(time * bobSpeed) * bobAmount;

    // Subtle swaying when not moving aggressively
    if (demon.state === "idle" || demon.state === "patrolling") {
      const swayAmount = 0.05;
      const swaySpeed = 1.5;
      demon.mesh.rotation.z = Math.sin(time * swaySpeed) * swayAmount;
    }

    // Scale animation when attacking
    if (demon.state === "attacking" && demon.mesh.userData.isAttacking) {
      const scaleMultiplier = 1 + Math.sin(time * 8) * 0.1;
      demon.mesh.scale.setScalar(
        demon.mesh.userData.originalScale * scaleMultiplier
      );
    } else {
      // Return to normal scale
      demon.mesh.scale.setScalar(demon.mesh.userData.originalScale);
    }
  }

  private executeDemonAttack(
    demon: DemonInstance,
    _playerPosition: THREE.Vector3
  ): void {
    demon.state = "attacking";
    const userData = demon.mesh.userData;

    if (userData.attackCooldown <= 0) {
      // Execute attack
      userData.attackCooldown = 60; // 1 second at 60fps
      userData.isAttacking = true;

      // Scale up when attacking
      if (!userData.attackScaleSet) {
        userData.originalScale = demon.mesh.scale.x;
        demon.mesh.scale.setScalar(userData.originalScale * 1.15);
        userData.attackScaleSet = true;
      }

      console.log(`${demon.type} attacks!`);
    }
  }

  private prepareDemonAttack(
    demon: DemonInstance,
    playerPosition: THREE.Vector3
  ): void {
    demon.state = "chasing";
    // Slow movement, preparing to attack
    const dx = playerPosition.x - demon.position.x;
    const dz = playerPosition.z - demon.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance > 0) {
      const speed = DEMON_CONFIGS[demon.type].speed * 0.5; // Slower when preparing
      demon.position.x += (dx / distance) * speed * 0.016; // Assuming 60fps
      demon.position.z += (dz / distance) * speed * 0.016;
    }
  }

  private executeDemonChase(
    demon: DemonInstance,
    playerPosition: THREE.Vector3,
    deltaTime: number
  ): void {
    demon.state = "chasing";

    const dx = playerPosition.x - demon.position.x;
    const dz = playerPosition.z - demon.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance > 0) {
      const speed = DEMON_CONFIGS[demon.type].speed;
      const moveDistance = speed * (deltaTime / 1000); // Convert deltaTime to seconds

      demon.position.x += (dx / distance) * moveDistance;
      demon.position.z += (dz / distance) * moveDistance;

      // Face the player
      demon.mesh.lookAt(playerPosition);
    }
  }

  private executeDemonWander(demon: DemonInstance, deltaTime: number): void {
    demon.state = "patrolling";

    // Simple wandering behavior
    if (!demon.mesh.userData.wanderDirection) {
      demon.mesh.userData.wanderDirection = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        0,
        (Math.random() - 0.5) * 2
      ).normalize();
      demon.mesh.userData.wanderTimer = Math.random() * 3000 + 1000; // 1-4 seconds
    }

    demon.mesh.userData.wanderTimer -= deltaTime;

    if (demon.mesh.userData.wanderTimer <= 0) {
      // Change direction
      demon.mesh.userData.wanderDirection = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        0,
        (Math.random() - 0.5) * 2
      ).normalize();
      demon.mesh.userData.wanderTimer = Math.random() * 3000 + 1000;
    }

    // Move in wander direction
    const speed = DEMON_CONFIGS[demon.type].speed * 0.3; // Slower when wandering
    const moveDistance = speed * (deltaTime / 1000);

    demon.position.add(
      demon.mesh.userData.wanderDirection.clone().multiplyScalar(moveDistance)
    );
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
