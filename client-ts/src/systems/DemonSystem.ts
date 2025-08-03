import * as THREE from "three";
import {
  DemonType,
  DemonInstance,
  DemonSystem as IDemonSystem,
  Fireball,
} from "@/types/demons";
import { Bullet } from "@/types/weapons";
import {
  DEMON_CONFIGS,
  getDemonTypesForWave,
  getThemeDemonConfig,
} from "@/config/demons";
import { SceneManager } from "@/core/SceneManager";
import { SceneThemeName } from "@/themes";
import { JsonDemonManager } from "./JsonDemonManager";

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
  public fireballs: Fireball[] = []; // Track active fireballs
  public currentWave = 1;
  public demonsThisWave = 0;
  public demonsSpawnedThisWave = 0;
  public waveInProgress = false;
  public demonTypeCounts = {
    IMP: 0,
    DEMON: 0,
    CACODEMON: 0,
    BARON: 0,
    ARCHVILE: 0,
    CHARIZARD: 0,
    PIKACHU: 0,
    SQUIRTLE: 0,
    EEVEE: 0,
  } as Record<DemonType, number>;

  private scene!: THREE.Scene;
  private sceneManager: SceneManager | null = null;
  private audioSystem: any = null;
  private demonSpawnTimer: NodeJS.Timeout | null = null;
  private nextWaveTimer: NodeJS.Timeout | null = null;
  private readonly timeBetweenWaves = 5000; // 5 seconds between waves
  private isMultiplayerMode = false; // Track if we're in multiplayer mode
  private jsonDemonManager: JsonDemonManager | null = null; // JSON demon management
  private jsonDemonSpawnChance = 0.3; // 30% chance to spawn JSON demons by default

  public async initialize(): Promise<void> {
    console.log("🔥 DemonSystem initialized with enhanced DOOM-style models");

    // Initialize JSON demon manager
    this.jsonDemonManager = new JsonDemonManager();

    // Ensure auto-load is enabled
    this.jsonDemonManager.updateSettings({ autoLoad: true });

    console.log("📝 JSON Demon Manager initialized with auto-load enabled");

    // Log the number of loaded JSON demons
    const loadedDemons = this.jsonDemonManager.getLoadedDemons();
    console.log(
      `🎮 ${loadedDemons.size} JSON demons loaded and ready for spawning`
    );

    // Debug: List all loaded JSON demons
    if (loadedDemons.size > 0) {
      console.log("📋 Loaded JSON demons:");
      loadedDemons.forEach((config, id) => {
        console.log(`  - ${id}: ${(config as any).name || "Unnamed"}`);
      });
    } else {
      console.warn("⚠️ No JSON demons were loaded!");
    }
  }

  public setMultiplayerMode(isMultiplayer: boolean): void {
    this.isMultiplayerMode = isMultiplayer;
    console.log(
      `👹 DemonSystem multiplayer mode: ${
        isMultiplayer ? "ENABLED" : "DISABLED"
      }`
    );

    // If switching to multiplayer, stop any active wave spawning
    if (isMultiplayer) {
      this.stopWaveSystem();
    }
  }

  public setScene(scene: THREE.Scene): void {
    this.scene = scene;
  }

  public setAudioSystem(audioSystem: any): void {
    this.audioSystem = audioSystem;
  }

  public setSceneManager(sceneManager: SceneManager): void {
    this.sceneManager = sceneManager;
  }

  public getJsonDemonManager(): JsonDemonManager | null {
    return this.jsonDemonManager;
  }

  /**
   * Set the spawn chance for JSON demons (0.0 to 1.0)
   */
  public setJsonDemonSpawnChance(chance: number): void {
    this.jsonDemonSpawnChance = Math.max(0, Math.min(1, chance));
    console.log(
      `🎯 JSON demon spawn chance set to: ${(
        this.jsonDemonSpawnChance * 100
      ).toFixed(1)}%`
    );
  }

  /**
   * Get the current JSON demon spawn chance
   */
  public getJsonDemonSpawnChance(): number {
    return this.jsonDemonSpawnChance;
  }

  /**
   * Force spawn a JSON demon for testing/debugging purposes
   */
  public forceSpawnJsonDemon(demonType: DemonType = "IMP"): boolean {
    if (!this.jsonDemonManager) {
      console.error("❌ No JSON demon manager available for forced spawn");
      return false;
    }

    const jsonDemons = this.jsonDemonManager.getLoadedDemons();
    if (jsonDemons.size === 0) {
      console.error("❌ No JSON demons loaded for forced spawn");
      return false;
    }

    // Get first available JSON demon
    const firstDemonId = jsonDemons.keys().next().value;
    if (!firstDemonId) {
      console.error("❌ No JSON demon IDs found");
      return false;
    }

    console.log(`🎯 Force spawning JSON demon: ${firstDemonId}`);

    try {
      this.spawnSpecificJsonDemon(demonType, firstDemonId);
      return true;
    } catch (error) {
      console.error("❌ Failed to force spawn JSON demon:", error);
      return false;
    }
  }

  /**
   * Spawn a specific JSON demon by ID
   */
  private spawnSpecificJsonDemon(
    demonType: DemonType,
    jsonDemonId: string
  ): void {
    const config = DEMON_CONFIGS[demonType];
    let actualConfig = config;

    // Get JSON demon config
    if (this.jsonDemonManager) {
      const originalJsonConfig =
        this.jsonDemonManager.getOriginalJsonDemon(jsonDemonId);
      if (originalJsonConfig) {
        actualConfig = originalJsonConfig as any;
        console.log(
          `🎮 Spawning specific JSON demon: ${
            originalJsonConfig.name || jsonDemonId
          }`
        );
      }
    }

    const demon = this.createDemonModel(demonType, jsonDemonId);

    // Position demon randomly around the map edges, respecting boundaries
    const angle = Math.random() * Math.PI * 2;
    let distance: number;

    if (this.sceneManager) {
      // Use SceneManager's boundary system for spawn positioning
      const boundarySize = this.sceneManager.BOUNDARY_SIZE;
      const spawnMargin = 10; // Keep demons away from the walls
      distance = boundarySize / 2 - spawnMargin - Math.random() * 15; // Spawn 10-25 units inside boundary
    } else {
      // Fallback spawn distance
      distance = 35 + Math.random() * 10; // 35-45 units from center
    }

    // Calculate proper ground position based on demon geometry with terrain awareness
    const spawnPosition = new THREE.Vector3(
      Math.cos(angle) * distance,
      0, // Temporary Y position
      Math.sin(angle) * distance
    );
    const groundHeight = this.calculateTerrainAwareGroundHeight(
      demonType,
      spawnPosition
    );
    spawnPosition.y = groundHeight;

    demon.position.copy(spawnPosition);
    demon.scale.setScalar(actualConfig.scale);

    const demonInstance: DemonInstance = {
      id: `demon_${Date.now()}_${Math.random()}`,
      type: demonType,
      mesh: demon,
      state: "idle",
      health: actualConfig.health,
      position: spawnPosition,
      targetPosition: spawnPosition.clone(),
      patrolCenter: spawnPosition.clone(),
      patrolRadius: 10,
      lastAttackTime: 0,
      lastStateChange: Date.now(),
      movementSpeed: actualConfig.speed,
    };

    // Store JSON demon ID for reference
    (demonInstance as any).jsonDemonId = jsonDemonId;

    // Set up user data
    demon.userData = {
      demonType,
      detectRange: actualConfig.detectRange,
      attackRange: actualConfig.attackRange,
      chaseRange: actualConfig.chaseRange,
      attackDamage: actualConfig.attackDamage,
      walkSpeed: actualConfig.speed, // Add walk speed from config
      attackCooldown: 0,
      isAttacking: false,
      isFalling: false,
      isDead: false,
      attackScaleSet: false,
      originalScale: actualConfig.scale,
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
      `👹 Force spawned JSON demon ${jsonDemonId} at position (${spawnPosition.x.toFixed(
        1
      )}, ${spawnPosition.z.toFixed(1)})`
    );
  }

  /**
   * Select a random JSON demon based on spawn weights
   */
  private selectRandomJsonDemon(): string | null {
    if (!this.jsonDemonManager) {
      console.log("🚫 No JSON demon manager available");
      return null;
    }

    const jsonDemons = this.jsonDemonManager.getLoadedDemons();
    console.log(`🎲 Checking JSON demons: ${jsonDemons.size} available`);

    if (jsonDemons.size === 0) {
      console.log("📭 No JSON demons to select from");
      return null;
    }

    // Convert to array with spawn weights
    const weightedDemons: Array<{ id: string; weight: number }> = [];

    jsonDemons.forEach((config, id) => {
      const weight = (config as any).behavior?.spawnWeight || 1;
      weightedDemons.push({ id, weight });
    });

    // Calculate total weight
    const totalWeight = weightedDemons.reduce(
      (sum, demon) => sum + demon.weight,
      0
    );

    // Spawn chance for JSON demons (adjustable via setJsonDemonSpawnChance)
    const spawnChance = this.jsonDemonSpawnChance;
    const random = Math.random();
    console.log(
      `🎯 Spawn chance check: ${random.toFixed(3)} vs ${spawnChance} threshold`
    );

    if (random > spawnChance) {
      console.log("🚫 Random check failed, using standard demon");
      return null;
    }

    console.log("✅ JSON demon spawn chance succeeded!");
    console.log(`🎲 Available weighted demons:`, weightedDemons);

    // Select based on weight
    let weightRandom = Math.random() * totalWeight;
    console.log(
      `🎲 Weight selection: ${weightRandom.toFixed(3)} out of ${totalWeight}`
    );

    for (const demon of weightedDemons) {
      weightRandom -= demon.weight;
      console.log(
        `  Checking ${demon.id} (weight: ${
          demon.weight
        }), remaining: ${weightRandom.toFixed(3)}`
      );
      if (weightRandom <= 0) {
        console.log(`🎲 Selected JSON demon: ${demon.id}`);
        return demon.id;
      }
    }

    return null;
  }

  public update(deltaTime: number): void {
    // Update demon AI and animations
    this.demons.forEach((demon: any) => {
      this.updateDemonAI(demon, deltaTime);
    });

    // Update fireballs
    this.updateFireballs(deltaTime);

    // Remove demons marked for removal
    this.removeDeadDemons();

    // Check if wave is complete
    this.checkWaveComplete();
  }

  public updateDemonAI(
    demon: DemonInstance | THREE.Group,
    deltaTime: number
  ): void {
    // Handle both single-player DemonInstance and multiplayer THREE.Group objects
    let meshObject: THREE.Object3D;
    let userData: any;
    let demonState: string;

    // Check if this is a DemonInstance (single-player) or THREE.Group (multiplayer)
    if ("mesh" in demon && demon.mesh) {
      // Single-player DemonInstance
      meshObject = demon.mesh;
      userData = demon.mesh.userData;
      demonState = demon.state;
    } else if ("userData" in demon && demon.userData) {
      // Multiplayer THREE.Group
      meshObject = demon as THREE.Group;
      userData = demon.userData;
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
        // Ranged demons prefer to maintain distance
        if (config.isRanged) {
          this.executeRangedPositioning(demon, playerPosition, deltaTime);
        } else {
          this.prepareDemonAttack(demon, playerPosition, deltaTime);
        }
      } else {
        this.executeDemonChase(demon, playerPosition, deltaTime);
      }
    } else {
      this.executeDemonWander(demon, deltaTime);
    }

    // Keep demons within map bounds
    if (this.sceneManager) {
      // Use SceneManager's boundary system
      const clampedPosition = this.sceneManager.clampToBoundary(demonPosition);
      demonPosition.x = clampedPosition.x;
      demonPosition.z = clampedPosition.z;
    } else {
      // Fallback to hardcoded boundary if SceneManager not available
      const maxDistance = 45; // Match player controller fallback
      demonPosition.x = Math.max(
        -maxDistance,
        Math.min(maxDistance, demonPosition.x)
      );
      demonPosition.z = Math.max(
        -maxDistance,
        Math.min(maxDistance, demonPosition.z)
      );
    }

    // Final ground enforcement for all demons (safety net)
    this.enforceGroundMovement(meshObject, demonType, deltaTime);

    // Update DemonInstance position from mesh position (single-player)
    if ("mesh" in demon && demon.mesh) {
      // Single-player: copy position from mesh to DemonInstance
      demon.position.copy(meshObject.position);
    }
    // For multiplayer demons, position is already updated directly on the object

    // Update animations based on current state
    this.updateDemonAnimation(demon, deltaTime);
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

  private updateFireballs(deltaTime: number): void {
    const fireballsToRemove: Fireball[] = [];

    this.fireballs.forEach((fireball) => {
      // Move fireball
      fireball.mesh.position.add(fireball.velocity);

      // Check if fireball has reached its target or exceeded range
      const distanceToTarget = fireball.mesh.position.distanceTo(
        fireball.targetPosition
      );
      const distanceFromOrigin = fireball.mesh.position.length();
      const maxRange = 50; // Maximum fireball range
      const timeAlive = performance.now() - fireball.createdAt;

      // Remove fireball if it's close to target, out of range, or too old
      if (
        distanceToTarget < 1.0 ||
        distanceFromOrigin > maxRange ||
        timeAlive > 5000
      ) {
        // Create explosion effect at fireball position
        this.createFireballExplosion(fireball.mesh.position);

        // Remove from scene
        this.scene.remove(fireball.mesh);
        fireballsToRemove.push(fireball);
      }
    });

    // Remove expired fireballs
    fireballsToRemove.forEach((fireball) => {
      const index = this.fireballs.indexOf(fireball);
      if (index > -1) {
        this.fireballs.splice(index, 1);
      }
    });
  }

  private createFireballExplosion(position: THREE.Vector3): void {
    // Create multiple explosion effects for more dramatic impact

    // Main explosion sphere
    const explosionGeometry = new THREE.SphereGeometry(3, 16, 8);
    const explosionMaterial = new THREE.MeshBasicMaterial({
      color: 0xff4500,
      transparent: true,
      opacity: 0.9,
    });

    const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
    explosion.position.copy(position);
    this.scene.add(explosion);

    // Outer shockwave
    const shockwaveGeometry = new THREE.SphereGeometry(1, 16, 8);
    const shockwaveMaterial = new THREE.MeshBasicMaterial({
      color: 0xff8800,
      transparent: true,
      opacity: 0.6,
      side: THREE.BackSide,
    });

    const shockwave = new THREE.Mesh(shockwaveGeometry, shockwaveMaterial);
    shockwave.position.copy(position);
    this.scene.add(shockwave);

    // Add multiple fire particles
    const particles: THREE.Mesh[] = [];
    for (let i = 0; i < 12; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.2, 8, 6);
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.5 ? 0xff4400 : 0xff8800,
        transparent: true,
        opacity: 0.8,
      });

      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.position.copy(position);

      // Random particle direction
      const angle = (i / 12) * Math.PI * 2;
      const elevation = (Math.random() - 0.5) * Math.PI * 0.5;
      particle.userData.velocity = new THREE.Vector3(
        Math.cos(angle) * Math.cos(elevation) * 3,
        Math.sin(elevation) * 3 + 2,
        Math.sin(angle) * Math.cos(elevation) * 3
      );

      this.scene.add(particle);
      particles.push(particle);
    }

    // Enhanced animation
    let time = 0;
    const animate = () => {
      time += 0.02;

      // Main explosion
      const explosionScale = 0.1 + time * 4;
      const explosionOpacity = Math.max(0, 0.9 - time * 1.5);
      explosion.scale.setScalar(explosionScale);
      explosionMaterial.opacity = explosionOpacity;

      // Shockwave
      const shockwaveScale = 1 + time * 8;
      const shockwaveOpacity = Math.max(0, 0.6 - time * 2);
      shockwave.scale.setScalar(shockwaveScale);
      shockwaveMaterial.opacity = shockwaveOpacity;

      // Particles
      particles.forEach((particle, index) => {
        if (particle.userData.velocity) {
          particle.position.add(
            particle.userData.velocity.clone().multiplyScalar(0.02)
          );
          particle.userData.velocity.y -= 0.1; // Gravity
          (particle.material as THREE.MeshBasicMaterial).opacity = Math.max(
            0,
            0.8 - time * 1.5
          );

          const particleScale = 1 - time * 0.8;
          particle.scale.setScalar(Math.max(0.1, particleScale));
        }
      });

      // Cleanup when animation complete
      if (time >= 1.0) {
        this.scene.remove(explosion);
        this.scene.remove(shockwave);
        particles.forEach((p) => this.scene.remove(p));

        explosionGeometry.dispose();
        explosionMaterial.dispose();
        shockwaveGeometry.dispose();
        shockwaveMaterial.dispose();
        particles.forEach((p) => {
          p.geometry.dispose();
          (p.material as THREE.MeshBasicMaterial).dispose();
        });
      } else {
        requestAnimationFrame(animate);
      }
    };

    animate();

    // Play explosion sound
    if (this.audioSystem) {
      this.audioSystem.playExplosionSound?.();
    }

    console.log("🔥💥 Enhanced fireball explosion created!");
  }

  private launchFireball(
    startPosition: THREE.Vector3,
    targetPosition: THREE.Vector3,
    config: any,
    demonId: string
  ): void {
    // Create fireball visual
    const fireballGroup = new THREE.Group();

    // Main fireball body
    const fireballGeometry = new THREE.SphereGeometry(0.3, 8, 6);
    const fireballMaterial = new THREE.MeshLambertMaterial({
      color: 0xff4500,
      emissive: new THREE.Color(0xff2200),
      emissiveIntensity: 0.8,
    });

    const fireballCore = new THREE.Mesh(fireballGeometry, fireballMaterial);
    fireballGroup.add(fireballCore);

    // Outer glow effect
    const glowGeometry = new THREE.SphereGeometry(0.5, 8, 6);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.3,
    });

    const fireballGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    fireballGroup.add(fireballGlow);

    // Position fireball slightly above demon
    fireballGroup.position.copy(startPosition);
    fireballGroup.position.y += 1.5;

    // Calculate velocity toward target
    const direction = new THREE.Vector3()
      .subVectors(targetPosition, fireballGroup.position)
      .normalize();

    const speed = config.fireballSpeed || 15.0;
    const velocity = direction.multiplyScalar(speed * 0.016); // Frame-based speed

    // Create fireball instance
    const fireball: Fireball = {
      id: `fireball_${Date.now()}_${Math.random()}`,
      mesh: fireballGroup,
      velocity: velocity,
      damage: config.attackDamage,
      createdAt: performance.now(),
      demonId: demonId,
      targetPosition: targetPosition.clone(),
    };

    // Add to scene and tracking
    this.scene.add(fireballGroup);
    this.fireballs.push(fireball);

    // Add particle effects to fireball
    this.addFireballParticles(fireballGroup);

    console.log(`🔥 Fireball launched from ${demonId} toward player`);
  }

  private addFireballParticles(fireballGroup: THREE.Group): void {
    // Add trailing fire particles
    for (let i = 0; i < 6; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.05, 4, 4);
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: 0xff8800,
        transparent: true,
        opacity: 0.6,
      });

      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.position.set(
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 0.4
      );

      fireballGroup.add(particle);

      // Animate particles
      const animateParticle = () => {
        particle.scale.multiplyScalar(0.98);
        particle.material.opacity *= 0.95;

        if (particle.scale.x > 0.1) {
          requestAnimationFrame(animateParticle);
        }
      };

      setTimeout(() => animateParticle(), i * 100);
    }
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
    demonType: DemonType,
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
    demonType: DemonType,
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
    demonType: DemonType,
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
    demonType: DemonType
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
      // Get demon config for attack cooldown and damage calculation
      const demonType = userData.demonType || "IMP";
      const config = DEMON_CONFIGS[demonType as DemonType] || DEMON_CONFIGS.IMP;

      // Use configured attack cooldown or default to 180 frames (3 seconds at 60fps)
      userData.attackCooldown = config.attackCooldown || 180;
      userData.hasAttacked = true;

      // Calculate direction to player - matches original
      const dx = playerPosition.x - meshObject.position.x;
      const dz = playerPosition.z - meshObject.position.z;
      const direction = Math.atan2(dx, dz);

      // Check if this is a ranged demon
      if (config.isRanged) {
        // Ranged attack - launch fireball
        this.launchFireball(
          meshObject.position,
          playerPosition,
          config,
          demon.id || "unknown"
        );
        console.log(
          `${demonType} launching fireball! Damage: ${config.attackDamage}`
        );
      } else {
        // Melee attack - lunge forward - matches original
        const lungeDistance = 0.8;
        meshObject.position.x += Math.sin(direction) * lungeDistance;
        meshObject.position.z += Math.cos(direction) * lungeDistance;
        console.log(
          `${demonType} executing melee attack! Damage: ${config.attackDamage}`
        );
      }

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

    // Enforce proper ground movement with smooth transitions
    this.enforceGroundMovement(meshObject, demonType, deltaTime);

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

      // Enforce proper ground movement with smooth transitions
      this.enforceGroundMovement(meshObject, demonType, deltaTime);
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

  private executeRangedPositioning(
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

    // Get demon config for optimal positioning
    const demonType = userData.demonType || "IMP";
    const config = DEMON_CONFIGS[demonType as DemonType] || DEMON_CONFIGS.IMP;

    // Calculate optimal distance (slightly less than attack range)
    const optimalDistance = config.attackRange * 0.8;
    const currentDistance = meshObject.position.distanceTo(playerPosition);

    // Calculate direction to/from player
    const dx = playerPosition.x - meshObject.position.x;
    const dz = playerPosition.z - meshObject.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance === 0) return;

    const normalizedX = dx / distance;
    const normalizedZ = dz / distance;

    // Position demon to maintain optimal distance
    let moveDirection = 1; // Move toward player by default

    if (currentDistance < optimalDistance * 0.7) {
      // Too close - back away
      moveDirection = -1;
    } else if (currentDistance > optimalDistance * 1.3) {
      // Too far - move closer
      moveDirection = 1;
    } else {
      // Good distance - strafe around player
      const strafeDirection = Math.sin(performance.now() * 0.001) > 0 ? 1 : -1;
      meshObject.position.x +=
        normalizedZ * strafeDirection * config.speed * 0.008;
      meshObject.position.z -=
        normalizedX * strafeDirection * config.speed * 0.008;

      // Ensure demon stays at proper ground height during strafing
      const groundHeight = this.calculateDemonGroundHeight(demonType);
      meshObject.position.y = groundHeight;

      // Face the player while strafing
      const direction = Math.atan2(dx, dz);
      meshObject.rotation.y = direction;

      // Set demon state for AI tracking
      if (demon.mesh) {
        demon.state = "positioning";
      }
      return;
    }

    // Move toward or away from player
    const moveSpeed = config.speed * 0.6; // Moderate positioning speed
    const moveDistance = moveSpeed * 0.016; // Frame-based movement

    meshObject.position.x += normalizedX * moveDirection * moveDistance;
    meshObject.position.z += normalizedZ * moveDirection * moveDistance;

    // Ensure demon stays at proper ground height
    const groundHeight = this.calculateDemonGroundHeight(demonType);
    meshObject.position.y = groundHeight;

    // Always face the player
    const direction = Math.atan2(dx, dz);
    meshObject.rotation.y = direction;

    // Set demon state for AI tracking
    if (demon.mesh) {
      demon.state = "positioning";
    }
  }

  public startWaveSystem(): void {
    // Don't start wave system in multiplayer mode - server controls spawning
    if (this.isMultiplayerMode) {
      console.log("🚫 Skipping local wave system - multiplayer mode active");
      return;
    }

    this.waveInProgress = true;
    this.spawnWave();
  }

  public stopWaveSystem(): void {
    console.log("🛑 Stopping wave system for multiplayer mode");
    this.waveInProgress = false;

    // Clear any active timers
    if (this.demonSpawnTimer) {
      clearTimeout(this.demonSpawnTimer);
      this.demonSpawnTimer = null;
    }

    if (this.nextWaveTimer) {
      clearTimeout(this.nextWaveTimer);
      this.nextWaveTimer = null;
    }
  }

  private spawnWave(): void {
    console.log(`🌊 Starting wave ${this.currentWave}`);

    const demonTypes = getDemonTypesForWave(this.currentWave);
    this.demonsThisWave = demonTypes.length;
    this.demonsSpawnedThisWave = 0;

    // Reset type counts
    this.demonTypeCounts = {
      IMP: 0,
      DEMON: 0,
      CACODEMON: 0,
      BARON: 0,
      ARCHVILE: 0,
      CHARIZARD: 0,
      PIKACHU: 0,
      SQUIRTLE: 0,
      EEVEE: 0,
    };

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

    // Check if we should spawn a JSON demon instead
    const jsonDemonId = this.selectRandomJsonDemon();
    let actualConfig = config;

    // Get JSON demon config if selected
    if (jsonDemonId && this.jsonDemonManager) {
      const originalJsonConfig =
        this.jsonDemonManager.getOriginalJsonDemon(jsonDemonId);
      if (originalJsonConfig) {
        actualConfig = originalJsonConfig as any;
        console.log(
          `🎮 Spawning JSON demon: ${originalJsonConfig.name || jsonDemonId}`
        );
      }
    }

    const demon = jsonDemonId
      ? this.createDemonModel(demonType, jsonDemonId)
      : this.createDemonModel(demonType);

    // Position demon randomly around the map edges, respecting boundaries
    const angle = Math.random() * Math.PI * 2;
    let distance: number;

    if (this.sceneManager) {
      // Use SceneManager's boundary system for spawn positioning
      const boundarySize = this.sceneManager.BOUNDARY_SIZE;
      const spawnMargin = 10; // Keep demons away from the walls
      distance = boundarySize / 2 - spawnMargin - Math.random() * 15; // Spawn 10-25 units inside boundary
    } else {
      // Fallback spawn distance
      distance = 35 + Math.random() * 10; // 35-45 units from center
    }

    // Calculate proper ground position based on demon geometry with terrain awareness
    const spawnPosition = new THREE.Vector3(
      Math.cos(angle) * distance,
      0, // Temporary Y position
      Math.sin(angle) * distance
    );
    const groundHeight = this.calculateTerrainAwareGroundHeight(
      demonType,
      spawnPosition
    );
    spawnPosition.y = groundHeight;

    demon.position.copy(spawnPosition);
    demon.scale.setScalar(actualConfig.scale);

    const demonInstance: DemonInstance = {
      id: `demon_${Date.now()}_${Math.random()}`,
      type: demonType,
      mesh: demon,
      state: "idle",
      health: actualConfig.health,
      position: spawnPosition,
      targetPosition: spawnPosition.clone(),
      patrolCenter: spawnPosition.clone(),
      patrolRadius: 10,
      lastAttackTime: 0,
      lastStateChange: Date.now(),
      movementSpeed: actualConfig.speed,
    };

    // Store JSON demon ID for reference if this is a JSON demon
    if (jsonDemonId) {
      (demonInstance as any).jsonDemonId = jsonDemonId;
    }

    // Set up user data
    demon.userData = {
      demonType,
      detectRange: actualConfig.detectRange,
      attackRange: actualConfig.attackRange,
      chaseRange: actualConfig.chaseRange,
      attackDamage: actualConfig.attackDamage,
      walkSpeed: actualConfig.speed, // Add walk speed from config
      attackCooldown: 0,
      isAttacking: false,
      isFalling: false,
      isDead: false,
      attackScaleSet: false,
      originalScale: actualConfig.scale,
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
      `👹 Spawned ${demonType} at position (${spawnPosition.x.toFixed(
        1
      )}, ${spawnPosition.z.toFixed(1)})`
    );
  }

  public createDemonModel(
    demonType: DemonType,
    jsonDemonId?: string
  ): THREE.Group {
    // Get current theme from SceneManager for theme-specific demon variants
    const currentTheme = this.sceneManager?.getCurrentTheme();
    const themeName = currentTheme
      ?.getConfig()
      .name.toLowerCase() as SceneThemeName;

    let typeData: any;

    // Check if this is a JSON demon first
    if (jsonDemonId && this.jsonDemonManager) {
      const originalJsonConfig =
        this.jsonDemonManager.getOriginalJsonDemon(jsonDemonId);
      if (originalJsonConfig) {
        typeData = originalJsonConfig;
        console.log(
          `🎮 Creating JSON demon model: ${originalJsonConfig.name} with visual features:`,
          originalJsonConfig.appearance?.visualFeatures
        );
      } else {
        console.warn(
          `❌ JSON demon not found: ${jsonDemonId}, falling back to standard config`
        );
        typeData = getThemeDemonConfig(demonType, themeName);
      }
    } else {
      // Use theme-specific configuration if available, otherwise fall back to base config
      typeData = getThemeDemonConfig(demonType, themeName);
    }

    const demonGroup = new THREE.Group();

    // Create enhanced materials with DOOM-style aesthetics
    // Handle both standard and JSON demon configurations
    const bodyColor = typeData.colors?.primary || typeData.color || "#ff0000";
    const headColor = typeData.colors?.head || typeData.headColor || "#ff0000";
    const eyeColor = typeData.colors?.eyes || typeData.eyeColor || "#ffff00";

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(bodyColor),
      emissive: new THREE.Color(bodyColor),
      emissiveIntensity: 0.1,
      metalness: 0.2,
      roughness: 0.7,
    });

    const headMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(headColor),
      emissive: new THREE.Color(headColor),
      emissiveIntensity: 0.15,
      metalness: 0.3,
      roughness: 0.6,
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
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(eyeColor),
      emissive: new THREE.Color(eyeColor),
      emissiveIntensity: 1.0,
      metalness: 0.1,
      roughness: 0.3,
    });

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial.clone());

    if (demonType === "CACODEMON") {
      leftEye.position.set(-0.15, 1.55, 0.25);
      rightEye.position.set(0.15, 1.55, 0.25);
    } else if (demonType === "ARCHVILE") {
      leftEye.position.set(-0.12, 1.6, 0.3);
      rightEye.position.set(0.12, 1.6, 0.3);
    } else {
      leftEye.position.set(-0.1, 1.45, 0.3);
      rightEye.position.set(0.1, 1.45, 0.3);
    }

    leftEye.name = "leftEye";
    rightEye.name = "rightEye";
    demonGroup.add(leftEye);
    demonGroup.add(rightEye);

    // Build demon based on body type for better modularity - EXPANDED for 20 body types
    // For JSON demons, use the body type from appearance config; for standard demons, use bodyType field
    const actualBodyType =
      typeData.appearance?.bodyType || typeData.bodyType || "humanoid";

    // Skip standard body type features for JSON demons - they will be handled by JSON feature system
    if (!jsonDemonId) {
      switch (actualBodyType) {
        case "floating":
          if (demonType === "CACODEMON") {
            this.addCacodemonFeatures(demonGroup, typeData);
          } else {
            this.addFloatingFeatures(demonGroup, typeData, demonType);
          }
          break;
        case "dragon":
          this.addDragonFeatures(demonGroup, typeData, demonType);
          break;
        case "quadruped":
          this.addQuadrupedFeatures(demonGroup, typeData, demonType);
          break;
        case "small_biped":
          this.addSmallBipedFeatures(demonGroup, typeData, demonType);
          break;

        // NEW BODY TYPES - Use existing features as base with unique modifications
        case "serpentine":
          this.addSerpentineFeatures(demonGroup, typeData, demonType);
          break;
        case "arachnid":
          this.addArachnidFeatures(demonGroup, typeData, demonType);
          break;
        case "tentacled":
          this.addTentacledFeatures(demonGroup, typeData, demonType);
          break;
        case "insectoid":
          this.addInsectoidFeatures(demonGroup, typeData, demonType);
          break;
        case "amorphous":
          this.addAmorphousFeatures(demonGroup, typeData, demonType);
          break;
        case "centauroid":
          this.addCentauroidFeatures(demonGroup, typeData, demonType);
          break;
        case "multi_headed":
          this.addMultiHeadedFeatures(demonGroup, typeData, demonType);
          break;
        case "elemental":
          this.addElementalFeatures(demonGroup, typeData, demonType);
          break;
        case "mechanical":
          this.addMechanicalFeatures(demonGroup, typeData, demonType);
          break;
        case "plant_like":
          this.addPlantLikeFeatures(demonGroup, typeData, demonType);
          break;
        case "crystalline":
          this.addCrystallineFeatures(demonGroup, typeData, demonType);
          break;
        case "swarm":
          this.addSwarmFeatures(demonGroup, typeData, demonType);
          break;
        case "giant_humanoid":
          this.addGiantHumanoidFeatures(demonGroup, typeData, demonType);
          break;
        case "winged_humanoid":
          this.addWingedHumanoidFeatures(demonGroup, typeData, demonType);
          break;
        case "aquatic":
          this.addAquaticFeatures(demonGroup, typeData, demonType);
          break;

        case "humanoid":
        default:
          if (demonType === "ARCHVILE") {
            this.addArchvileFeatures(demonGroup, typeData);
          } else {
            this.addHumanoidFeatures(demonGroup, typeData, demonType);
          }
          break;
      }
    }

    // Add demon-specific details (skip for JSON demons as they have their own feature system)
    if (!jsonDemonId) {
      this.addDemonDetails(demonGroup, demonType, typeData, eyeColor);
    }

    // Add JSON demon visual features if this is a JSON demon
    if (jsonDemonId) {
      // Always add basic JSON demon features (limbs, etc.)
      this.addJsonDemonVisualFeatures(demonGroup, typeData, bodyMaterial);
    }

    // Add theme-specific enhancements
    if (themeName) {
      this.addThemeSpecificFeatures(demonGroup, demonType, themeName);
    }

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

  /**
   * Calculate the proper ground height for a demon based on its geometry
   * to ensure feet touch the ground instead of body center
   */
  private calculateDemonGroundHeight(demonType: DemonType): number {
    switch (demonType) {
      case "CACODEMON":
        // Cacodemon floats, so keep it slightly above ground
        return 0.5;
      case "BARON":
        // Baron has legs that extend to -0.4 - 0.5 (leg height/2), so need to offset upward
        return 0.9; // 0.4 (leg bottom) + 0.5 (leg height/2) = 0.9
      case "ARCHVILE":
        // Similar to other humanoid demons but slightly taller
        return 0.8;
      case "DEMON":
      case "IMP":
      default:
        // Standard humanoid demons: legs extend to -0.4 - 0.4 (leg height/2)
        return 0.8; // 0.4 (leg bottom) + 0.4 (leg height/2) = 0.8
    }
  }

  /**
   * Enhanced ground height calculation with terrain awareness and movement constraints
   */
  private calculateTerrainAwareGroundHeight(
    demonType: DemonType,
    position: THREE.Vector3,
    currentHeight?: number
  ): number {
    const baseHeight = this.calculateDemonGroundHeight(demonType);

    // Special handling for floating demons
    if (demonType === "CACODEMON") {
      // Floating demons can have slight variation but stay near ground
      const minFloat = 0.3;
      const maxFloat = 1.2;
      const targetFloat = baseHeight;

      // If we have current height, smoothly adjust toward target
      if (currentHeight !== undefined) {
        const heightDiff = Math.abs(currentHeight - targetFloat);
        if (heightDiff > 0.1) {
          // Gradually move toward target height
          const adjustSpeed = 0.02;
          if (currentHeight > targetFloat) {
            return Math.max(targetFloat, currentHeight - adjustSpeed);
          } else {
            return Math.min(targetFloat, currentHeight + adjustSpeed);
          }
        }
      }

      return Math.max(minFloat, Math.min(maxFloat, targetFloat));
    }

    // For ground-based demons, enforce strict ground contact
    const groundLevel = 0.0; // Scene ground level
    const minHeight = groundLevel + baseHeight * 0.9; // Allow slight ground penetration tolerance
    const maxHeight = groundLevel + baseHeight * 1.1; // Prevent excessive floating

    // If we have current height, prevent rapid height changes
    if (currentHeight !== undefined) {
      const maxHeightChange = 0.05; // Maximum height change per frame
      const targetHeight = Math.max(minHeight, Math.min(maxHeight, baseHeight));
      const heightDiff = targetHeight - currentHeight;

      if (Math.abs(heightDiff) > maxHeightChange) {
        // Gradually adjust height to prevent jumping
        return currentHeight + Math.sign(heightDiff) * maxHeightChange;
      }
    }

    return Math.max(minHeight, Math.min(maxHeight, baseHeight));
  }

  /**
   * Apply ground constraints to demon movement with smooth transitions
   */
  private enforceGroundMovement(
    meshObject: THREE.Object3D,
    demonType: DemonType,
    deltaTime: number
  ): void {
    const currentHeight = meshObject.position.y;
    const targetHeight = this.calculateTerrainAwareGroundHeight(
      demonType,
      meshObject.position,
      currentHeight
    );

    // Smooth height transition to prevent jerky movement
    const heightDiff = targetHeight - currentHeight;
    const maxHeightChangePerFrame = 0.03; // Slower, smoother height adjustments

    if (Math.abs(heightDiff) > 0.01) {
      const adjustment =
        Math.sign(heightDiff) *
        Math.min(Math.abs(heightDiff), maxHeightChangePerFrame);
      meshObject.position.y += adjustment;
    } else {
      meshObject.position.y = targetHeight;
    }

    // Add subtle bobbing animation for ground demons when moving
    const userData = meshObject.userData;
    if (userData && userData.isMoving && demonType !== "CACODEMON") {
      const time = performance.now() * 0.001;
      const bobbingIntensity = demonType === "BARON" ? 0.02 : 0.03;
      const bobbingSpeed = userData.walkSpeed ? userData.walkSpeed * 3 : 3;
      const bobbing = Math.sin(time * bobbingSpeed) * bobbingIntensity;
      meshObject.position.y += bobbing;
    }
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

  private addArchvileFeatures(demonGroup: THREE.Group, typeData: any): void {
    // Archvile is a tall, imposing humanoid with fire-based features
    const armMaterial = new THREE.MeshPhongMaterial({
      color: typeData.headColor,
      shininess: 15,
      emissive: new THREE.Color(0x440000),
      emissiveIntensity: 0.2,
    });

    // Long, thin arms for spellcasting
    const armGeometry = new THREE.CylinderGeometry(0.07, 0.09, 1.0, 8);

    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.5, 1.0, 0);
    leftArm.rotation.z = 0.4;
    leftArm.name = "leftArm";
    demonGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.5, 1.0, 0);
    rightArm.rotation.z = -0.4;
    rightArm.name = "rightArm";
    demonGroup.add(rightArm);

    // Add staff/wand for magical attacks
    const staffGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1.2, 8);
    const staffMaterial = new THREE.MeshPhongMaterial({
      color: 0x8b4513,
      emissive: new THREE.Color(0x441100),
      emissiveIntensity: 0.3,
    });

    const staff = new THREE.Mesh(staffGeometry, staffMaterial);
    staff.position.set(0.5, 0.8, 0);
    staff.rotation.z = -0.4;
    demonGroup.add(staff);

    // Add crystal orb at top of staff
    const orbGeometry = new THREE.SphereGeometry(0.08, 8, 6);
    const orbMaterial = new THREE.MeshLambertMaterial({
      color: 0xffd700,
      emissive: new THREE.Color(0xff4400),
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.8,
    });

    const orb = new THREE.Mesh(orbGeometry, orbMaterial);
    orb.position.set(0.5, 1.4, 0);
    demonGroup.add(orb);

    // Tall, thin legs
    const legGeometry = new THREE.CylinderGeometry(0.09, 0.11, 1.2, 8);
    const legMaterial = new THREE.MeshPhongMaterial({
      color: typeData.color,
      shininess: 10,
      emissive: new THREE.Color(0x220000),
      emissiveIntensity: 0.1,
    });

    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.25, -0.6, 0);
    leftLeg.name = "leftLeg";
    demonGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.25, -0.6, 0);
    rightLeg.name = "rightLeg";
    demonGroup.add(rightLeg);

    // Clawed feet
    const footGeometry = new THREE.BoxGeometry(0.2, 0.1, 0.3);
    const footMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 });

    const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
    leftFoot.position.set(-0.25, -1.25, 0.05);
    demonGroup.add(leftFoot);

    const rightFoot = new THREE.Mesh(footGeometry, footMaterial);
    rightFoot.position.set(0.25, -1.25, 0.05);
    demonGroup.add(rightFoot);

    // Add fire particles around the demon
    this.addFireAura(demonGroup);
  }

  private addFireAura(demonGroup: THREE.Group): void {
    // Add floating fire particles around the Archvile
    for (let i = 0; i < 8; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.03, 6, 4);
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: 0xff4400,
        transparent: true,
        opacity: 0.7,
      });

      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      const angle = (i / 8) * Math.PI * 2;
      const radius = 0.8 + Math.random() * 0.4;

      particle.position.set(
        Math.cos(angle) * radius,
        Math.random() * 2.0 + 0.5,
        Math.sin(angle) * radius
      );

      demonGroup.add(particle);

      // Animate fire particles
      const animateFireParticle = () => {
        particle.position.y += 0.01;
        particle.rotation.y += 0.05;
        particle.material.opacity =
          0.3 + Math.sin(performance.now() * 0.005) * 0.4;

        if (particle.position.y > 3.0) {
          particle.position.y = 0.5;
        }

        requestAnimationFrame(animateFireParticle);
      };

      setTimeout(() => animateFireParticle(), i * 200);
    }
  }

  private addDemonDetails(
    demonGroup: THREE.Group,
    demonType: DemonType,
    typeData: any,
    eyeColor: string
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
    } else if (demonType === "ARCHVILE") {
      // Archvile: Magical robe and fire crown
      const robeGeometry = new THREE.CylinderGeometry(0.6, 0.8, 1.5, 12);
      const robeMaterial = new THREE.MeshPhongMaterial({
        color: 0x4a0000,
        emissive: new THREE.Color(0x220000),
        emissiveIntensity: 0.3,
        shininess: 20,
      });
      const robe = new THREE.Mesh(robeGeometry, robeMaterial);
      robe.position.y = 0.3;
      demonGroup.add(robe);

      // Fire crown on head
      const crownGeometry = new THREE.ConeGeometry(0.3, 0.4, 8);
      const crownMaterial = new THREE.MeshLambertMaterial({
        color: 0xff4500,
        emissive: new THREE.Color(0xff2200),
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.8,
      });
      const crown = new THREE.Mesh(crownGeometry, crownMaterial);
      crown.position.y = 1.9;
      demonGroup.add(crown);

      // Add fire spikes around crown
      for (let i = 0; i < 6; i++) {
        const flameGeometry = new THREE.ConeGeometry(0.04, 0.2, 6);
        const flameMaterial = new THREE.MeshBasicMaterial({
          color: 0xff6600,
          transparent: true,
          opacity: 0.7,
        });

        const flame = new THREE.Mesh(flameGeometry, flameMaterial);
        const angle = (i / 6) * Math.PI * 2;
        flame.position.set(Math.cos(angle) * 0.25, 2.0, Math.sin(angle) * 0.25);
        demonGroup.add(flame);
      }
    }

    // Add ambient glow effect for all demons
    const glowGeometry = new THREE.SphereGeometry(0.5, 16, 8);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: eyeColor,
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

  public checkBulletCollision(
    bullet: Bullet,
    allDemons?: any[]
  ): string | null {
    const bulletPosition = bullet.mesh.position;
    const demonsToCheck = allDemons || this.demons;

    for (const demon of demonsToCheck) {
      // Handle both DemonInstance (single player) and THREE.Group (network) objects
      let demonPosition: THREE.Vector3;
      let demonId: string;
      let isDead = false;

      if (demon.mesh) {
        // DemonInstance structure (single player)
        if (demon.state === "dead") continue;
        demonPosition = demon.position;
        demonId = demon.id;
        isDead = demon.state === "dead";
      } else if (demon.userData) {
        // THREE.Group structure (network demon)
        if (demon.userData.isDead || demon.userData.markedForRemoval) continue;
        demonPosition = demon.position;
        demonId = demon.userData.serverId || demon.id || "unknown";
        isDead = demon.userData.isDead;
      } else {
        continue; // Invalid demon object
      }

      if (isDead) continue;

      const distance = bulletPosition.distanceTo(demonPosition);
      if (distance < 1.0) {
        // Hit threshold
        return demonId;
      }
    }

    return null;
  }

  public checkFireballCollision(
    playerPosition: THREE.Vector3
  ): Fireball | null {
    for (const fireball of this.fireballs) {
      const distance = fireball.mesh.position.distanceTo(playerPosition);
      // Increased collision range for better hit detection
      if (distance < 4.0) {
        // Fireball hit player
        return fireball;
      }
    }
    return null;
  }

  public removeFireball(fireball: Fireball): void {
    // Remove from scene
    this.scene.remove(fireball.mesh);

    // Create explosion at impact
    this.createFireballExplosion(fireball.mesh.position);

    // Remove from tracking array
    const index = this.fireballs.indexOf(fireball);
    if (index > -1) {
      this.fireballs.splice(index, 1);
    }
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

  public getDemonDamage(demonType: DemonType): number {
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

    // Remove all fireballs from scene
    this.fireballs.forEach((fireball) => {
      this.scene.remove(fireball.mesh);
    });

    // Reset state
    this.demons = [];
    this.fireballs = [];
    this.currentWave = 1;
    this.demonsThisWave = 0;
    this.demonsSpawnedThisWave = 0;
    this.waveInProgress = false;
    this.demonTypeCounts = {
      IMP: 0,
      DEMON: 0,
      CACODEMON: 0,
      BARON: 0,
      ARCHVILE: 0,
      CHARIZARD: 0,
      PIKACHU: 0,
      SQUIRTLE: 0,
      EEVEE: 0,
    };
  }

  /**
   * Add theme-specific visual enhancements to demons
   */
  private addThemeSpecificFeatures(
    demonGroup: THREE.Group,
    demonType: DemonType,
    themeName: SceneThemeName
  ): void {
    switch (themeName) {
      case "hell":
        this.addHellThemeFeatures(demonGroup, demonType);
        break;
      case "ice":
        this.addIceThemeFeatures(demonGroup, demonType);
        break;
      case "toxic":
        this.addToxicThemeFeatures(demonGroup, demonType);
        break;
      case "industrial":
        this.addIndustrialThemeFeatures(demonGroup, demonType);
        break;
    }
  }

  private addHellThemeFeatures(
    demonGroup: THREE.Group,
    demonType: DemonType
  ): void {
    // Add fire/lava effects for hell theme
    const fireParticles = this.createDemonParticleSystem(20, 0xff4500, 2, 0.6);
    fireParticles.position.y = demonType === "CACODEMON" ? 1.2 : 0.8;
    fireParticles.name = "fireParticles";
    demonGroup.add(fireParticles);

    // Add glowing emissive effect to body and head
    demonGroup.traverse((child) => {
      if (
        child instanceof THREE.Mesh &&
        child.material instanceof THREE.MeshPhongMaterial
      ) {
        if (child.name === "body" || child.name === "head") {
          child.material.emissive = new THREE.Color(0x330000);
          child.material.emissiveIntensity = 0.2;
        }
      }
    });

    // Add flickering light for larger demons
    if (demonType === "BARON" || demonType === "ARCHVILE") {
      const fireLight = new THREE.PointLight(0xff4500, 2, 8);
      fireLight.position.y = 1.5;
      fireLight.name = "fireLight";
      demonGroup.add(fireLight);

      // Animate the light
      const originalIntensity = fireLight.intensity;
      setInterval(() => {
        fireLight.intensity = originalIntensity * (0.7 + Math.random() * 0.6);
      }, 150);
    }
  }

  private addIceThemeFeatures(
    demonGroup: THREE.Group,
    demonType: DemonType
  ): void {
    // Add ice crystal spikes
    const crystalGeometry = new THREE.ConeGeometry(0.1, 0.3, 6);
    const crystalMaterial = new THREE.MeshPhongMaterial({
      color: 0x87ceeb,
      transparent: true,
      opacity: 0.8,
      emissive: new THREE.Color(0x001122),
      emissiveIntensity: 0.3,
    });

    // Add multiple ice crystals to the demon
    for (let i = 0; i < 3; i++) {
      const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
      const angle = (i / 3) * Math.PI * 2;
      crystal.position.set(
        Math.cos(angle) * 0.4,
        0.2 + Math.random() * 0.6,
        Math.sin(angle) * 0.4
      );
      crystal.rotation.z = Math.random() * Math.PI * 2;
      crystal.name = `iceCrystal${i}`;
      demonGroup.add(crystal);
    }

    // Add frost effect to materials
    demonGroup.traverse((child) => {
      if (
        child instanceof THREE.Mesh &&
        child.material instanceof THREE.MeshPhongMaterial
      ) {
        if (child.name === "body" || child.name === "head") {
          child.material.emissive = new THREE.Color(0x001133);
          child.material.emissiveIntensity = 0.1;
          child.material.shininess = 50; // More reflective for icy look
        }
      }
    });
  }

  private addToxicThemeFeatures(
    demonGroup: THREE.Group,
    demonType: DemonType
  ): void {
    // Add glowing veins/circuit-like patterns
    const veinGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 6);
    const veinMaterial = new THREE.MeshLambertMaterial({
      color: 0x00ff00,
      emissive: new THREE.Color(0x00ff00),
      transparent: true,
      opacity: 0.7,
    });

    // Add glowing veins across the demon's body
    for (let i = 0; i < 4; i++) {
      const vein = new THREE.Mesh(veinGeometry, veinMaterial);
      const angle = (i / 4) * Math.PI * 2;
      vein.position.set(Math.cos(angle) * 0.3, 0.6, Math.sin(angle) * 0.3);
      vein.rotation.z = angle + Math.PI / 2;
      vein.name = `toxicVein${i}`;
      demonGroup.add(vein);
    }

    // Add toxic glow to demon
    demonGroup.traverse((child) => {
      if (
        child instanceof THREE.Mesh &&
        child.material instanceof THREE.MeshPhongMaterial
      ) {
        if (child.name === "body" || child.name === "head") {
          child.material.emissive = new THREE.Color(0x002200);
          child.material.emissiveIntensity = 0.3;
        }
      }
    });

    // Add glowing particle cloud
    const toxicParticles = this.createDemonParticleSystem(
      30,
      0x44ff44,
      1.5,
      0.4
    );
    toxicParticles.position.y = demonType === "CACODEMON" ? 1.2 : 0.8;
    toxicParticles.name = "toxicParticles";
    demonGroup.add(toxicParticles);
  }

  private addIndustrialThemeFeatures(
    demonGroup: THREE.Group,
    demonType: DemonType
  ): void {
    // Add metal plating/armor
    const plateGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.4);
    const plateMaterial = new THREE.MeshPhongMaterial({
      color: 0x666666,
      shininess: 80,
      specular: 0x888888,
    });

    // Add armor plates
    for (let i = 0; i < 2; i++) {
      const plate = new THREE.Mesh(plateGeometry, plateMaterial);
      plate.position.set(0, 0.4 + i * 0.3, 0.2);
      plate.name = `armorPlate${i}`;
      demonGroup.add(plate);
    }

    // Add glowing tech elements
    const techGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const techMaterial = new THREE.MeshLambertMaterial({
      color: 0x00ffff,
      emissive: new THREE.Color(0x003333),
    });

    // Add tech lights/sensors
    for (let i = 0; i < 3; i++) {
      const tech = new THREE.Mesh(techGeometry, techMaterial.clone());
      const angle = (i / 3) * Math.PI * 2;
      tech.position.set(Math.cos(angle) * 0.35, 1.2, Math.sin(angle) * 0.35);
      tech.name = `techSensor${i}`;
      demonGroup.add(tech);

      // Animate the tech lights by changing opacity
      setInterval(() => {
        if (tech.material instanceof THREE.MeshLambertMaterial) {
          tech.material.opacity = 0.5 + Math.random() * 0.5;
          tech.material.transparent = true;
        }
      }, 500 + Math.random() * 1000);
    }

    // Add metallic sheen to demon materials
    demonGroup.traverse((child) => {
      if (
        child instanceof THREE.Mesh &&
        child.material instanceof THREE.MeshPhongMaterial
      ) {
        if (child.name === "body" || child.name === "head") {
          child.material.shininess = 60;
          child.material.specular = new THREE.Color(0x444444);
        }
      }
    });
  }

  /**
   * Create a particle system for demon theme effects
   */
  private createDemonParticleSystem(
    count: number,
    color: number,
    size: number,
    opacity: number
  ): THREE.Points {
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 2;
      positions[i + 1] = Math.random() * 2;
      positions[i + 2] = (Math.random() - 0.5) * 2;
    }

    particles.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color,
      size,
      transparent: true,
      opacity,
    });

    return new THREE.Points(particles, particleMaterial);
  }

  /**
   * Add features for floating type demons (non-Cacodemon)
   */
  private addFloatingFeatures(
    demonGroup: THREE.Group,
    typeData: any,
    demonType: DemonType
  ): void {
    // Floating demons have no legs, but may have floating appendages
    const tentacleGeometry = new THREE.CylinderGeometry(0.02, 0.08, 0.6, 6);
    const tentacleMaterial = new THREE.MeshPhongMaterial({
      color: typeData.accentColor || typeData.headColor,
    });

    // Add floating tentacles/appendages
    for (let i = 0; i < 4; i++) {
      const tentacle = new THREE.Mesh(tentacleGeometry, tentacleMaterial);
      const angle = (i / 4) * Math.PI * 2;
      tentacle.position.set(Math.cos(angle) * 0.4, 0.2, Math.sin(angle) * 0.4);
      tentacle.rotation.z = angle;
      demonGroup.add(tentacle);
    }
  }

  /**
   * Add features for dragon type demons (Charizard)
   */
  private addDragonFeatures(
    demonGroup: THREE.Group,
    typeData: any,
    demonType: DemonType
  ): void {
    const accentMaterial = new THREE.MeshPhongMaterial({
      color: typeData.accentColor || 0x8b0000,
    });

    const secondaryMaterial = new THREE.MeshPhongMaterial({
      color: typeData.secondaryColor || typeData.color,
    });

    // Wings
    if (typeData.visualFeatures?.hasWings) {
      const wingGeometry = new THREE.CylinderGeometry(0.05, 0.3, 1.2, 8);

      const leftWing = new THREE.Mesh(wingGeometry, accentMaterial);
      leftWing.position.set(-0.8, 1.0, -0.2);
      leftWing.rotation.z = Math.PI / 4;
      leftWing.rotation.x = -Math.PI / 6;
      leftWing.name = "leftWing";
      demonGroup.add(leftWing);

      const rightWing = new THREE.Mesh(wingGeometry, accentMaterial);
      rightWing.position.set(0.8, 1.0, -0.2);
      rightWing.rotation.z = -Math.PI / 4;
      rightWing.rotation.x = -Math.PI / 6;
      rightWing.name = "rightWing";
      demonGroup.add(rightWing);
    }

    // Dragon legs (bipedal)
    const legGeometry = new THREE.CylinderGeometry(0.15, 0.2, 1.0, 8);
    const legMaterial = new THREE.MeshPhongMaterial({
      color: typeData.color,
    });

    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.3, -0.5, 0);
    leftLeg.name = "leftLeg";
    demonGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.3, -0.5, 0);
    rightLeg.name = "rightLeg";
    demonGroup.add(rightLeg);

    // Dragon arms
    const armGeometry = new THREE.CylinderGeometry(0.1, 0.15, 0.8, 8);
    const armMaterial = new THREE.MeshPhongMaterial({
      color: typeData.headColor,
    });

    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.5, 0.8, 0);
    leftArm.rotation.z = 0.4;
    leftArm.name = "leftArm";
    demonGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.5, 0.8, 0);
    rightArm.rotation.z = -0.4;
    rightArm.name = "rightArm";
    demonGroup.add(rightArm);

    // Tail with flame tip
    if (typeData.visualFeatures?.hasTail) {
      const tailGeometry = new THREE.CylinderGeometry(0.05, 0.15, 1.0, 8);
      const tail = new THREE.Mesh(tailGeometry, secondaryMaterial);
      tail.position.set(0, 0.5, -0.8);
      tail.rotation.x = Math.PI / 3;
      tail.name = "tail";
      demonGroup.add(tail);

      // Flame tip if it's a fire demon
      if (typeData.visualFeatures?.specialFeatures?.includes("flame_tail")) {
        const flameGeometry = new THREE.ConeGeometry(0.1, 0.3, 6);
        const flameMaterial = new THREE.MeshLambertMaterial({
          color: 0xff4500,
          emissive: new THREE.Color(0xff2200),
          emissiveIntensity: 0.6,
        });
        const flame = new THREE.Mesh(flameGeometry, flameMaterial);
        flame.position.set(0, 1.0, -1.3);
        demonGroup.add(flame);
      }
    }

    // Dragon claws
    if (typeData.visualFeatures?.hasClaws) {
      this.addClaws(demonGroup, leftArm.position, rightArm.position);
    }
  }

  /**
   * Add features for quadruped demons (Eevee)
   */
  private addQuadrupedFeatures(
    demonGroup: THREE.Group,
    typeData: any,
    demonType: DemonType
  ): void {
    const legMaterial = new THREE.MeshPhongMaterial({
      color: typeData.color,
    });

    const accentMaterial = new THREE.MeshPhongMaterial({
      color: typeData.accentColor || typeData.headColor,
    });

    // Four legs for quadruped
    const legGeometry = new THREE.CylinderGeometry(0.08, 0.12, 0.6, 6);

    const frontLeft = new THREE.Mesh(legGeometry, legMaterial);
    frontLeft.position.set(-0.25, -0.3, 0.3);
    frontLeft.name = "frontLeftLeg";
    demonGroup.add(frontLeft);

    const frontRight = new THREE.Mesh(legGeometry, legMaterial);
    frontRight.position.set(0.25, -0.3, 0.3);
    frontRight.name = "frontRightLeg";
    demonGroup.add(frontRight);

    const backLeft = new THREE.Mesh(legGeometry, legMaterial);
    backLeft.position.set(-0.25, -0.3, -0.3);
    backLeft.name = "backLeftLeg";
    demonGroup.add(backLeft);

    const backRight = new THREE.Mesh(legGeometry, legMaterial);
    backRight.position.set(0.25, -0.3, -0.3);
    backRight.name = "backRightLeg";
    demonGroup.add(backRight);

    // Quadruped tail
    if (typeData.visualFeatures?.hasTail) {
      const tailGeometry = typeData.visualFeatures?.specialFeatures?.includes(
        "bushy_tail"
      )
        ? new THREE.SphereGeometry(0.15, 8, 6) // Bushy tail like Eevee
        : new THREE.CylinderGeometry(0.05, 0.1, 0.8, 6); // Regular tail

      const tail = new THREE.Mesh(tailGeometry, accentMaterial);
      tail.position.set(0, 0.6, -0.8);
      if (!typeData.visualFeatures?.specialFeatures?.includes("bushy_tail")) {
        tail.rotation.x = Math.PI / 4;
      }
      tail.name = "tail";
      demonGroup.add(tail);
    }

    // Fluffy collar (Eevee specific)
    if (typeData.visualFeatures?.specialFeatures?.includes("fluffy_collar")) {
      const collarGeometry = new THREE.TorusGeometry(0.35, 0.15, 8, 16);
      const collarMaterial = new THREE.MeshPhongMaterial({
        color: typeData.secondaryColor || 0xfffaf0,
      });
      const collar = new THREE.Mesh(collarGeometry, collarMaterial);
      collar.position.y = 1.2;
      collar.rotation.x = Math.PI / 2;
      demonGroup.add(collar);
    }

    // Big ears
    if (typeData.visualFeatures?.specialFeatures?.includes("big_ears")) {
      const earGeometry = new THREE.ConeGeometry(0.15, 0.4, 6);
      const earMaterial = new THREE.MeshPhongMaterial({
        color: typeData.headColor,
      });

      const leftEar = new THREE.Mesh(earGeometry, earMaterial);
      leftEar.position.set(-0.2, 1.6, 0);
      leftEar.rotation.z = -0.3;
      demonGroup.add(leftEar);

      const rightEar = new THREE.Mesh(earGeometry, earMaterial);
      rightEar.position.set(0.2, 1.6, 0);
      rightEar.rotation.z = 0.3;
      demonGroup.add(rightEar);
    }
  }

  /**
   * Add features for small biped demons (Pikachu, Squirtle)
   */
  private addSmallBipedFeatures(
    demonGroup: THREE.Group,
    typeData: any,
    demonType: DemonType
  ): void {
    const legMaterial = new THREE.MeshPhongMaterial({
      color: typeData.color,
    });

    const accentMaterial = new THREE.MeshPhongMaterial({
      color: typeData.accentColor || typeData.headColor,
    });

    // Small biped legs
    const legGeometry = new THREE.CylinderGeometry(0.1, 0.12, 0.5, 6);

    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.15, -0.25, 0);
    leftLeg.name = "leftLeg";
    demonGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.15, -0.25, 0);
    rightLeg.name = "rightLeg";
    demonGroup.add(rightLeg);

    // Small arms
    const armGeometry = new THREE.CylinderGeometry(0.06, 0.08, 0.4, 6);
    const armMaterial = new THREE.MeshPhongMaterial({
      color: typeData.color,
    });

    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.25, 0.5, 0);
    leftArm.rotation.z = 0.2;
    leftArm.name = "leftArm";
    demonGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.25, 0.5, 0);
    rightArm.rotation.z = -0.2;
    rightArm.name = "rightArm";
    demonGroup.add(rightArm);

    // Demon-specific features
    if (demonType === "PIKACHU") {
      this.addPikachuFeatures(demonGroup, typeData);
    } else if (demonType === "SQUIRTLE") {
      this.addSquirtleFeatures(demonGroup, typeData);
    }

    // Generic tail for small bipeds
    if (
      typeData.visualFeatures?.hasTail &&
      !typeData.visualFeatures?.specialFeatures?.includes("lightning_tail")
    ) {
      const tailGeometry = new THREE.CylinderGeometry(0.05, 0.1, 0.6, 6);
      const tail = new THREE.Mesh(tailGeometry, accentMaterial);
      tail.position.set(0, 0.3, -0.4);
      tail.rotation.x = Math.PI / 4;
      tail.name = "tail";
      demonGroup.add(tail);
    }
  }

  /**
   * Add Pikachu-specific features
   */
  private addPikachuFeatures(demonGroup: THREE.Group, typeData: any): void {
    // Long ears
    if (typeData.visualFeatures?.specialFeatures?.includes("long_ears")) {
      const earGeometry = new THREE.CylinderGeometry(0.08, 0.02, 0.6, 6);
      const earMaterial = new THREE.MeshPhongMaterial({
        color: typeData.color,
      });
      const tipMaterial = new THREE.MeshPhongMaterial({
        color: typeData.accentColor || 0x8b4513,
      });

      // Left ear
      const leftEar = new THREE.Mesh(earGeometry, earMaterial);
      leftEar.position.set(-0.15, 1.6, 0);
      leftEar.rotation.z = -0.2;
      demonGroup.add(leftEar);

      const leftTip = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 6, 4),
        tipMaterial
      );
      leftTip.position.set(-0.2, 2.0, 0);
      demonGroup.add(leftTip);

      // Right ear
      const rightEar = new THREE.Mesh(earGeometry, earMaterial);
      rightEar.position.set(0.15, 1.6, 0);
      rightEar.rotation.z = 0.2;
      demonGroup.add(rightEar);

      const rightTip = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 6, 4),
        tipMaterial
      );
      rightTip.position.set(0.2, 2.0, 0);
      demonGroup.add(rightTip);
    }

    // Cheek pouches
    if (typeData.visualFeatures?.specialFeatures?.includes("cheek_pouches")) {
      const cheekGeometry = new THREE.SphereGeometry(0.08, 8, 6);
      const cheekMaterial = new THREE.MeshLambertMaterial({
        color: typeData.secondaryColor || 0xff0000,
        emissive: new THREE.Color(typeData.secondaryColor || 0xff0000),
        emissiveIntensity: 0.3,
      });

      const leftCheek = new THREE.Mesh(cheekGeometry, cheekMaterial);
      leftCheek.position.set(-0.25, 1.4, 0.2);
      demonGroup.add(leftCheek);

      const rightCheek = new THREE.Mesh(cheekGeometry, cheekMaterial);
      rightCheek.position.set(0.25, 1.4, 0.2);
      demonGroup.add(rightCheek);
    }

    // Lightning bolt tail
    if (typeData.visualFeatures?.specialFeatures?.includes("lightning_tail")) {
      const tailSegments = [];
      const tailMaterial = new THREE.MeshPhongMaterial({
        color: typeData.color,
      });

      // Create zigzag tail
      for (let i = 0; i < 3; i++) {
        const segmentGeometry = new THREE.BoxGeometry(0.15, 0.05, 0.2);
        const segment = new THREE.Mesh(segmentGeometry, tailMaterial);
        segment.position.set(
          i % 2 === 0 ? -0.1 : 0.1,
          0.2 - i * 0.1,
          -0.4 - i * 0.15
        );
        segment.rotation.z = i % 2 === 0 ? 0.3 : -0.3;
        demonGroup.add(segment);
        tailSegments.push(segment);
      }
    }
  }

  /**
   * Add Squirtle-specific features
   */
  private addSquirtleFeatures(demonGroup: THREE.Group, typeData: any): void {
    // Shell
    if (typeData.visualFeatures?.specialFeatures?.includes("shell")) {
      const shellGeometry = new THREE.SphereGeometry(
        0.45,
        12,
        8,
        0,
        Math.PI * 2,
        0,
        Math.PI / 2
      );
      const shellMaterial = new THREE.MeshPhongMaterial({
        color: typeData.secondaryColor || 0xf5deb3,
      });

      const shell = new THREE.Mesh(shellGeometry, shellMaterial);
      shell.position.set(0, 0.6, -0.2);
      shell.rotation.x = Math.PI;
      demonGroup.add(shell);

      // Shell pattern
      const patternGeometry = new THREE.SphereGeometry(0.1, 8, 6);
      const patternMaterial = new THREE.MeshPhongMaterial({
        color: typeData.accentColor || 0x8b4513,
      });

      for (let i = 0; i < 6; i++) {
        const pattern = new THREE.Mesh(patternGeometry, patternMaterial);
        const angle = (i / 6) * Math.PI * 2;
        pattern.position.set(
          Math.cos(angle) * 0.25,
          0.8,
          -0.2 + Math.sin(angle) * 0.25
        );
        demonGroup.add(pattern);
      }
    }

    // Water cannon (mouth feature)
    if (typeData.visualFeatures?.specialFeatures?.includes("water_cannon")) {
      const cannonGeometry = new THREE.CylinderGeometry(0.05, 0.08, 0.15, 8);
      const cannonMaterial = new THREE.MeshPhongMaterial({
        color: 0x4682b4,
      });

      const cannon = new THREE.Mesh(cannonGeometry, cannonMaterial);
      cannon.position.set(0, 1.35, 0.3);
      cannon.rotation.x = Math.PI / 2;
      demonGroup.add(cannon);
    }
  }

  /**
   * Helper method to add claws to arms
   */
  private addClaws(
    demonGroup: THREE.Group,
    leftArmPos: THREE.Vector3,
    rightArmPos: THREE.Vector3
  ): void {
    const clawGeometry = new THREE.ConeGeometry(0.02, 0.1, 6);
    const clawMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });

    // Left arm claws
    for (let i = 0; i < 3; i++) {
      const claw = new THREE.Mesh(clawGeometry, clawMaterial);
      claw.position.set(
        leftArmPos.x + (i - 1) * 0.05,
        leftArmPos.y - 0.4,
        leftArmPos.z + 0.1
      );
      claw.rotation.x = Math.PI;
      demonGroup.add(claw);
    }

    // Right arm claws
    for (let i = 0; i < 3; i++) {
      const claw = new THREE.Mesh(clawGeometry, clawMaterial);
      claw.position.set(
        rightArmPos.x + (i - 1) * 0.05,
        rightArmPos.y - 0.4,
        rightArmPos.z + 0.1
      );
      claw.rotation.x = Math.PI;
      demonGroup.add(claw);
    }
  }

  // NEW BODY TYPE RENDERING METHODS - Basic implementations that reuse existing features

  /**
   * Add serpentine (snake-like) features
   */
  private addSerpentineFeatures(
    demonGroup: THREE.Group,
    typeData: any,
    demonType: DemonType
  ): void {
    // Use floating body as base but elongated
    this.addFloatingFeatures(demonGroup, typeData, demonType);

    // Add tail if specified in visual features
    if (typeData.visualFeatures?.hasTail) {
      this.addTail(demonGroup, typeData);
    }
  }

  // Visual feature methods for standard demons (used by body type systems)
  private addTail(demonGroup: THREE.Group, typeData: any): void {
    const tailMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(typeData.color || "#ff0000"),
      shininess: 10,
    });

    const tailGeometry = new THREE.CylinderGeometry(0.06, 0.12, 1.0, 8);
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.set(0, 0.3, -0.7);
    tail.rotation.x = Math.PI / 2.2;
    tail.name = "tail";
    tail.castShadow = true;
    tail.receiveShadow = true;
    demonGroup.add(tail);
  }

  private addSpikes(demonGroup: THREE.Group, typeData: any): void {
    const spikeMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color("#1a1a1a"),
      shininess: 30,
    });

    const spikeGeometry = new THREE.ConeGeometry(0.04, 0.18, 6);

    // Add spikes along the back
    for (let i = 0; i < 4; i++) {
      const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
      spike.position.set(0, 0.7 + i * 0.15, -0.25);
      spike.rotation.x = Math.PI;
      spike.name = `spike_${i}`;
      spike.castShadow = true;
      spike.receiveShadow = true;
      demonGroup.add(spike);
    }
  }

  private addHorns(demonGroup: THREE.Group, typeData: any): void {
    const hornMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color("#2a2a2a"),
      shininess: 20,
    });

    const hornGeometry = new THREE.ConeGeometry(0.06, 0.35, 8);
    const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
    const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);

    leftHorn.position.set(-0.18, 1.65, 0);
    rightHorn.position.set(0.18, 1.65, 0);
    leftHorn.rotation.z = -Math.PI / 10;
    rightHorn.rotation.z = Math.PI / 10;

    leftHorn.name = "leftHorn";
    rightHorn.name = "rightHorn";
    leftHorn.castShadow = true;
    rightHorn.castShadow = true;
    leftHorn.receiveShadow = true;
    rightHorn.receiveShadow = true;

    demonGroup.add(leftHorn);
    demonGroup.add(rightHorn);
  }

  private addArmor(demonGroup: THREE.Group, typeData: any): void {
    const armorMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color("#404040"),
      shininess: 60,
      specular: 0x555555,
    });

    const chestGeometry = new THREE.BoxGeometry(0.6, 0.25, 0.08);
    const chestArmor = new THREE.Mesh(chestGeometry, armorMaterial);
    chestArmor.position.set(0, 0.9, 0.32);
    chestArmor.name = "chestArmor";
    chestArmor.castShadow = true;
    chestArmor.receiveShadow = true;
    demonGroup.add(chestArmor);
  }

  private addWings(demonGroup: THREE.Group, typeData: any): void {
    const wingMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(typeData.color || "#ff0000"),
      shininess: 5,
      transparent: true,
      opacity: 0.8,
    });

    const wingGeometry = new THREE.PlaneGeometry(0.7, 0.5);
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);

    leftWing.position.set(-0.55, 1.1, -0.25);
    rightWing.position.set(0.55, 1.1, -0.25);
    leftWing.rotation.y = Math.PI / 4;
    rightWing.rotation.y = -Math.PI / 4;
    leftWing.rotation.x = -Math.PI / 8;
    rightWing.rotation.x = -Math.PI / 8;

    leftWing.name = "leftWing";
    rightWing.name = "rightWing";
    leftWing.castShadow = true;
    rightWing.castShadow = true;
    leftWing.receiveShadow = true;
    rightWing.receiveShadow = true;

    demonGroup.add(leftWing);
    demonGroup.add(rightWing);
  }

  /**
   * Add visual features specific to JSON demons (matching demon-gen implementation)
   */
  private addJsonDemonVisualFeatures(
    demonGroup: THREE.Group,
    typeData: any,
    baseMaterial: THREE.Material
  ): void {
    const features = typeData.appearance?.visualFeatures;

    // Create accent material matching demon-gen
    const accentMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(
        typeData.colors?.accent || typeData.colors?.secondary || "#ff8800"
      ),
      emissive: new THREE.Color(typeData.colors?.accent || "#ff4400"),
      emissiveIntensity: 0.2,
      metalness: 0.4,
      roughness: 0.5,
    });

    // Add wings - improved to match demon-gen style
    if (features && features.hasWings) {
      const bodyType = typeData.appearance?.bodyType || "humanoid";

      if (bodyType === "dragon") {
        // Dragon wings: More angular, like demon-gen dragon features
        const wingGeometry = new THREE.CylinderGeometry(0.05, 0.3, 1.2, 8);
        const leftWing = new THREE.Mesh(wingGeometry, accentMaterial);
        const rightWing = new THREE.Mesh(wingGeometry, accentMaterial);

        leftWing.position.set(-0.8, 1.0, -0.2);
        rightWing.position.set(0.8, 1.0, -0.2);
        leftWing.rotation.z = Math.PI / 4;
        leftWing.rotation.x = -Math.PI / 6;
        rightWing.rotation.z = -Math.PI / 4;
        rightWing.rotation.x = -Math.PI / 6;

        leftWing.castShadow = true;
        rightWing.castShadow = true;
        demonGroup.add(leftWing);
        demonGroup.add(rightWing);
      } else {
        // Standard wings: Plane geometry like demon-gen
        const wingGeometry = new THREE.PlaneGeometry(0.8, 0.4);
        const leftWing = new THREE.Mesh(wingGeometry, accentMaterial);
        const rightWing = new THREE.Mesh(wingGeometry, accentMaterial);

        leftWing.position.set(-0.6, 1.2, -0.2);
        rightWing.position.set(0.6, 1.2, -0.2);
        leftWing.rotation.z = 0.3;
        rightWing.rotation.z = -0.3;

        leftWing.castShadow = true;
        rightWing.castShadow = true;
        leftWing.name = "leftWing";
        rightWing.name = "rightWing";
        demonGroup.add(leftWing);
        demonGroup.add(rightWing);
      }
    }

    // Add horns - matching demon-gen
    if (features && features.hasHorns) {
      const hornGeometry = new THREE.ConeGeometry(0.05, 0.3, 6);
      const leftHorn = new THREE.Mesh(hornGeometry, accentMaterial);
      const rightHorn = new THREE.Mesh(hornGeometry, accentMaterial);

      leftHorn.position.set(-0.15, 1.6, 0);
      rightHorn.position.set(0.15, 1.6, 0);

      leftHorn.castShadow = true;
      rightHorn.castShadow = true;
      leftHorn.name = "leftHorn";
      rightHorn.name = "rightHorn";
      demonGroup.add(leftHorn);
      demonGroup.add(rightHorn);
    }

    // Add tail - matching demon-gen
    if (features && features.hasTail) {
      const tailGeometry = new THREE.CylinderGeometry(0.05, 0.02, 0.8, 6);
      const tail = new THREE.Mesh(tailGeometry, accentMaterial);
      tail.position.set(0, 0.4, -0.4);
      tail.rotation.x = 0.5;
      tail.castShadow = true;
      tail.name = "tail";
      demonGroup.add(tail);
    }

    // Add spikes - matching demon-gen circular arrangement
    if (features && features.hasSpikes) {
      for (let i = 0; i < 5; i++) {
        const spikeGeometry = new THREE.ConeGeometry(0.03, 0.15, 4);
        const spike = new THREE.Mesh(spikeGeometry, accentMaterial);
        const angle = (i / 5) * Math.PI * 2;
        spike.position.set(
          Math.cos(angle) * 0.3,
          1.0 + Math.random() * 0.4,
          Math.sin(angle) * 0.3
        );
        spike.castShadow = true;
        spike.name = `spike_${i}`;
        demonGroup.add(spike);
      }
    }

    // Add armor pieces
    if (features && features.hasArmor) {
      const armorGeometry = new THREE.BoxGeometry(0.7, 0.3, 0.1);
      const armorMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color("#404040"),
        emissive: new THREE.Color("#202020"),
        emissiveIntensity: 0.1,
        metalness: 0.8,
        roughness: 0.3,
      });

      const chestArmor = new THREE.Mesh(armorGeometry, armorMaterial);
      chestArmor.position.set(0, 1.0, 0.35);
      chestArmor.castShadow = true;
      chestArmor.receiveShadow = true;
      chestArmor.name = "chestArmor";
      demonGroup.add(chestArmor);
    }

    // Add basic limbs for humanoid types (matching demon-gen) - ALWAYS add limbs for JSON demons
    const actualBodyType = typeData.appearance?.bodyType || "humanoid";
    if (actualBodyType === "humanoid" || actualBodyType === "small_biped") {
      this.addBasicLimbsToJsonDemon(
        demonGroup,
        typeData,
        features && features.hasClaws
      );
    }
  }

  /**
   * Add basic limbs to JSON demons (matching demon-gen implementation)
   */
  private addBasicLimbsToJsonDemon(
    demonGroup: THREE.Group,
    typeData: any,
    hasClaws: boolean = false
  ): void {
    const bodyType = typeData.appearance?.bodyType || "humanoid";

    // Create arm material - matching demon-gen
    const armMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(typeData.colors?.head || "#ff0000"),
      emissive: new THREE.Color(typeData.colors?.head || "#ff0000"),
      emissiveIntensity: 0.1,
      metalness: 0.2,
      roughness: 0.7,
    });

    // Create leg material - matching demon-gen
    const legMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(typeData.colors?.primary || "#ff0000"),
      emissive: new THREE.Color(typeData.colors?.primary || "#ff0000"),
      emissiveIntensity: 0.1,
      metalness: 0.2,
      roughness: 0.7,
    });

    // Add arms
    const armGeometry =
      bodyType === "small_biped"
        ? new THREE.CylinderGeometry(0.06, 0.08, 0.4, 6)
        : new THREE.CylinderGeometry(0.06, 0.1, 0.7, 6);

    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);

    if (bodyType === "small_biped") {
      leftArm.position.set(-0.25, 0.5, 0);
      rightArm.position.set(0.25, 0.5, 0);
    } else {
      leftArm.position.set(-0.35, 0.8, 0);
      rightArm.position.set(0.35, 0.8, 0);
      leftArm.rotation.z = 0.3;
      rightArm.rotation.z = -0.3;
    }

    leftArm.castShadow = true;
    rightArm.castShadow = true;
    leftArm.name = "leftArm";
    rightArm.name = "rightArm";
    demonGroup.add(leftArm);
    demonGroup.add(rightArm);

    // Add legs
    const legGeometry =
      bodyType === "small_biped"
        ? new THREE.CylinderGeometry(0.08, 0.1, 0.5, 6)
        : new THREE.CylinderGeometry(0.08, 0.12, 0.8, 6);

    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);

    if (bodyType === "small_biped") {
      leftLeg.position.set(-0.1, 0.0, 0);
      rightLeg.position.set(0.1, 0.0, 0);
    } else {
      leftLeg.position.set(-0.15, -0.2, 0);
      rightLeg.position.set(0.15, -0.2, 0);
    }

    leftLeg.castShadow = true;
    rightLeg.castShadow = true;
    leftLeg.name = "leftLeg";
    rightLeg.name = "rightLeg";
    demonGroup.add(leftLeg);
    demonGroup.add(rightLeg);

    // Add claws if specified
    if (hasClaws) {
      const clawGeometry = new THREE.ConeGeometry(0.02, 0.1, 6);
      const clawMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color("#1a1a1a"),
        emissive: new THREE.Color("#0a0a0a"),
        emissiveIntensity: 0.1,
        metalness: 0.8,
        roughness: 0.2,
      });

      for (let hand = 0; hand < 2; hand++) {
        for (let finger = 0; finger < 4; finger++) {
          const claw = new THREE.Mesh(clawGeometry, clawMaterial);
          const xPos = (hand === 0 ? -0.35 : 0.35) + (finger - 1.5) * 0.03;
          const yPos = bodyType === "small_biped" ? 0.3 : 0.5;
          claw.position.set(xPos, yPos, 0.1);
          claw.rotation.x = Math.PI;
          claw.castShadow = true;
          claw.name = `claw_${hand}_${finger}`;
          demonGroup.add(claw);
        }
      }
    }
  }

  /**
   * Add arachnid (spider-like) features
   */
  private addArachnidFeatures(
    demonGroup: THREE.Group,
    typeData: any,
    demonType: DemonType
  ): void {
    // Use quadruped as base
    this.addQuadrupedFeatures(demonGroup, typeData, demonType);

    // Add spikes for leg-like appearance
    if (typeData.visualFeatures?.hasSpikes) {
      this.addSpikes(demonGroup, typeData);
    }
  }

  /**
   * Add tentacled (octopus-like) features
   */
  private addTentacledFeatures(
    demonGroup: THREE.Group,
    typeData: any,
    demonType: DemonType
  ): void {
    // Use floating as base
    this.addFloatingFeatures(demonGroup, typeData, demonType);

    // Add multiple tails for tentacle effect
    if (typeData.visualFeatures?.hasTail) {
      this.addTail(demonGroup, typeData);
    }
  }

  /**
   * Add insectoid (bug-like) features
   */
  private addInsectoidFeatures(
    demonGroup: THREE.Group,
    typeData: any,
    demonType: DemonType
  ): void {
    // Use small_biped as base
    this.addSmallBipedFeatures(demonGroup, typeData, demonType);

    // Add spikes for segmented appearance
    if (typeData.visualFeatures?.hasSpikes) {
      this.addSpikes(demonGroup, typeData);
    }
  }

  /**
   * Add amorphous (blob-like) features - FOR THE USER'S SLIME DEMON
   */
  private addAmorphousFeatures(
    demonGroup: THREE.Group,
    typeData: any,
    demonType: DemonType
  ): void {
    // Use floating but with different geometry for blob-like appearance
    this.addFloatingFeatures(demonGroup, typeData, demonType);

    // Modify the body to be more blob-like (this can be enhanced later)
    const bodyMesh = demonGroup.children.find((child) => child.name === "body");
    if (bodyMesh && bodyMesh instanceof THREE.Mesh) {
      // Scale to make it more blob-like
      bodyMesh.scale.set(1.2, 0.8, 1.2);
    }
  }

  /**
   * Add centauroid (half-beast) features
   */
  private addCentauroidFeatures(
    demonGroup: THREE.Group,
    typeData: any,
    demonType: DemonType
  ): void {
    // Combine quadruped lower with humanoid upper
    this.addQuadrupedFeatures(demonGroup, typeData, demonType);
    this.addHumanoidFeatures(demonGroup, typeData, demonType);
  }

  /**
   * Add multi-headed features
   */
  private addMultiHeadedFeatures(
    demonGroup: THREE.Group,
    typeData: any,
    demonType: DemonType
  ): void {
    // Use humanoid as base
    this.addHumanoidFeatures(demonGroup, typeData, demonType);

    // Add horns for multiple head effect
    if (typeData.visualFeatures?.hasHorns) {
      this.addHorns(demonGroup, typeData);
    }
  }

  /**
   * Add elemental (energy being) features
   */
  private addElementalFeatures(
    demonGroup: THREE.Group,
    typeData: any,
    demonType: DemonType
  ): void {
    // Use floating as base for energy beings
    this.addFloatingFeatures(demonGroup, typeData, demonType);
  }

  /**
   * Add mechanical (cybernetic) features
   */
  private addMechanicalFeatures(
    demonGroup: THREE.Group,
    typeData: any,
    demonType: DemonType
  ): void {
    // Use humanoid as base
    this.addHumanoidFeatures(demonGroup, typeData, demonType);

    // Add armor for mechanical look
    if (typeData.visualFeatures?.hasArmor) {
      this.addArmor(demonGroup, typeData);
    }
  }

  /**
   * Add plant-like features
   */
  private addPlantLikeFeatures(
    demonGroup: THREE.Group,
    typeData: any,
    demonType: DemonType
  ): void {
    // Use humanoid as base but taller
    this.addHumanoidFeatures(demonGroup, typeData, demonType);

    // Add spikes for thorn effect
    if (typeData.visualFeatures?.hasSpikes) {
      this.addSpikes(demonGroup, typeData);
    }
  }

  /**
   * Add crystalline (gem-based) features
   */
  private addCrystallineFeatures(
    demonGroup: THREE.Group,
    typeData: any,
    demonType: DemonType
  ): void {
    // Use floating for crystal beings
    this.addFloatingFeatures(demonGroup, typeData, demonType);

    // Add spikes for crystal formations
    if (typeData.visualFeatures?.hasSpikes) {
      this.addSpikes(demonGroup, typeData);
    }
  }

  /**
   * Add swarm (collective) features
   */
  private addSwarmFeatures(
    demonGroup: THREE.Group,
    typeData: any,
    demonType: DemonType
  ): void {
    // Use small_biped as base for individual units
    this.addSmallBipedFeatures(demonGroup, typeData, demonType);
  }

  /**
   * Add giant humanoid features
   */
  private addGiantHumanoidFeatures(
    demonGroup: THREE.Group,
    typeData: any,
    demonType: DemonType
  ): void {
    // Use humanoid but scaled up
    this.addHumanoidFeatures(demonGroup, typeData, demonType);

    // Scale the entire group up
    demonGroup.scale.multiplyScalar(1.5);
  }

  /**
   * Add winged humanoid features
   */
  private addWingedHumanoidFeatures(
    demonGroup: THREE.Group,
    typeData: any,
    demonType: DemonType
  ): void {
    // Use humanoid as base
    this.addHumanoidFeatures(demonGroup, typeData, demonType);

    // Add wings
    if (typeData.visualFeatures?.hasWings) {
      this.addWings(demonGroup, typeData);
    }
  }

  /**
   * Add aquatic (sea creature) features
   */
  private addAquaticFeatures(
    demonGroup: THREE.Group,
    typeData: any,
    demonType: DemonType
  ): void {
    // Use floating for water-based movement
    this.addFloatingFeatures(demonGroup, typeData, demonType);

    // Add tail for swimming
    if (typeData.visualFeatures?.hasTail) {
      this.addTail(demonGroup, typeData);
    }
  }
}
