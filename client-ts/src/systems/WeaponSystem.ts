import * as THREE from "three";
import {
  WeaponType,
  WeaponState,
  Bullet,
  WeaponSystem as IWeaponSystem,
} from "@/types/weapons";
import {
  WEAPON_CONFIGS,
  BULLET_SPEED,
  BULLET_LIFETIME,
  DEFAULT_WEAPON,
} from "@/config/weapons";

export class WeaponSystem implements IWeaponSystem {
  public currentWeapon: WeaponType = DEFAULT_WEAPON;
  public weapons = WEAPON_CONFIGS;
  public weaponStates: Record<WeaponType, WeaponState> = {
    shotgun: { currentAmmo: 50, lastShotTime: 0, isReloading: false },
    chaingun: { currentAmmo: 200, lastShotTime: 0, isReloading: false },
    rocket: { currentAmmo: 20, lastShotTime: 0, isReloading: false },
    plasma: { currentAmmo: 100, lastShotTime: 0, isReloading: false },
  };
  public isAutoFiring = false;
  public mouseHeld = false;

  private scene!: THREE.Scene;
  private camera!: THREE.Camera;
  private audioSystem!: any; // Will be set via dependency injection
  private bullets: Bullet[] = [];
  private shotsFired = 0;
  private shotsHit = 0;
  private muzzleFlashLight: THREE.PointLight | null = null;
  private gunRecoilOffset = 0;
  private gunRecoilVelocity = 0;

  // Weapon models
  private gunModel: THREE.Group | null = null;
  private machineGunModel: THREE.Group | null = null;
  private rocketLauncherModel: THREE.Group | null = null;
  private plasmaRifleModel: THREE.Group | null = null;
  // Position weapon at bottom center like the old client for better first-person visibility
  private gunBasePosition = { x: 0, y: -2.5, z: -4 };

  // Network callbacks for multiplayer synchronization
  private networkManager: any = null;

  public async initialize(): Promise<void> {
    this.setupMuzzleFlashLight();
    this.createWeaponModels();
    console.log("🔫 WeaponSystem initialized with enhanced projectile effects");
  }

  public setNetworkManager(networkManager: any): void {
    this.networkManager = networkManager;
  }

  public setScene(scene: THREE.Scene): void {
    this.scene = scene;
  }

  public setCamera(camera: THREE.Camera): void {
    this.camera = camera;
  }

  public setAudioSystem(audioSystem: any): void {
    this.audioSystem = audioSystem;
  }

  private setupMuzzleFlashLight(): void {
    this.muzzleFlashLight = new THREE.PointLight(0xffaa00, 0, 10);
    this.muzzleFlashLight.position.set(0, 0, 0);
    if (this.scene) {
      this.scene.add(this.muzzleFlashLight);
    }
  }

  public update(deltaTime: number): void {
    // Update bullets with enhanced effects
    this.updateBullets(deltaTime);

    // Update gun recoil
    this.updateGunRecoil(deltaTime);

    // Handle auto-firing
    if (this.isAutoFiring && this.mouseHeld) {
      this.shoot();
    }
  }

  private updateBullets(deltaTime: number): void {
    const currentTime = Date.now();

    this.bullets.forEach((bullet, index) => {
      // Remove bullets that are too old
      if (currentTime - bullet.createdAt > BULLET_LIFETIME) {
        this.removeBulletFromScene(bullet);
        this.bullets.splice(index, 1);
        return;
      }

      // Move bullet forward
      const moveDistance = BULLET_SPEED * (deltaTime / 1000);
      bullet.mesh.position.add(
        bullet.velocity.clone().multiplyScalar(moveDistance)
      );

      // Update weapon-specific effects
      this.updateBulletEffects(bullet, deltaTime);

      // Remove bullets that are too far from origin
      if (bullet.mesh.position.length() > 100) {
        this.removeBulletFromScene(bullet);
        this.bullets.splice(index, 1);
      }
    });
  }

  private updateBulletEffects(bullet: Bullet, deltaTime: number): void {
    const time = performance.now() * 0.001;

    switch (bullet.weaponType) {
      case "shotgun":
        this.updateShotgunPelletEffects(bullet, time);
        break;
      case "chaingun":
        this.updateChainguBulletEffects(bullet, time);
        break;
      case "rocket":
        this.updateRocketEffects(bullet, time, deltaTime);
        break;
      case "plasma":
        this.updatePlasmaEffects(bullet, time, deltaTime);
        break;
    }
  }

  private updateShotgunPelletEffects(bullet: Bullet, time: number): void {
    // Shotgun pellets have trailing sparks
    if (bullet.mesh.userData.trailParticles) {
      bullet.mesh.userData.trailParticles.forEach(
        (particle: THREE.Mesh, index: number) => {
          particle.scale.multiplyScalar(0.98);
          (particle.material as THREE.MeshBasicMaterial).opacity *= 0.95;

          if (particle.scale.x < 0.1) {
            bullet.mesh.remove(particle);
            bullet.mesh.userData.trailParticles.splice(index, 1);
          }
        }
      );
    }

    // Add new trail particles occasionally
    if (Math.random() < 0.7) {
      this.addShotgunTrailParticle(bullet);
    }
  }

  private updateChainguBulletEffects(bullet: Bullet, time: number): void {
    // Chaingun bullets have glowing trail and heat shimmer
    if (bullet.mesh.userData.glowTrail) {
      const glow = bullet.mesh.userData.glowTrail as THREE.Mesh;
      const material = glow.material as THREE.MeshBasicMaterial;
      material.opacity = 0.3 + Math.sin(time * 10) * 0.2;
    }

    // Update bullet rotation for tracer effect
    bullet.mesh.rotation.z += 0.3;
  }

  private updateRocketEffects(
    bullet: Bullet,
    time: number,
    deltaTime: number
  ): void {
    // Rocket has fire trail and exhaust
    if (bullet.mesh.userData.fireTrail) {
      const trail = bullet.mesh.userData.fireTrail as THREE.Group;

      // Update trail particles
      trail.children.forEach((particle, index) => {
        const mesh = particle as THREE.Mesh;
        mesh.scale.multiplyScalar(0.95);
        (mesh.material as THREE.MeshBasicMaterial).opacity *= 0.9;

        // Move particles backward relative to rocket
        const backwardDirection = bullet.velocity
          .clone()
          .normalize()
          .multiplyScalar(-0.1);
        mesh.position.add(backwardDirection);

        if (mesh.scale.x < 0.2) {
          trail.remove(mesh);
        }
      });
    }

    // Add new exhaust particles
    if (Math.random() < 0.8) {
      this.addRocketExhaustParticle(bullet);
    }

    // Rocket slight wobble for realism
    const wobble = Math.sin(time * 20) * 0.02;
    bullet.mesh.rotation.x += wobble;
    bullet.mesh.rotation.y += wobble * 0.5;
  }

  private updatePlasmaEffects(
    bullet: Bullet,
    time: number,
    deltaTime: number
  ): void {
    // Plasma projectile energy effects
    if (bullet.mesh.userData.energyField) {
      const field = bullet.mesh.userData.energyField as THREE.Mesh;
      field.rotation.x += 0.1;
      field.rotation.y += 0.15;
      field.rotation.z += 0.05;

      // Pulsing energy effect
      const pulse = 1 + Math.sin(time * 15) * 0.3;
      field.scale.setScalar(pulse);

      const material = field.material as THREE.MeshLambertMaterial;
      material.emissiveIntensity = 0.5 + Math.sin(time * 20) * 0.3;
    }

    // Update plasma core glow
    if (bullet.mesh.userData.core) {
      const core = bullet.mesh.userData.core as THREE.Mesh;
      const material = core.material as THREE.MeshLambertMaterial;
      material.emissiveIntensity = 0.8 + Math.sin(time * 25) * 0.4;
    }

    // Electric arcs around plasma
    if (bullet.mesh.userData.electricArcs && Math.random() < 0.3) {
      this.updatePlasmaElectricArcs(bullet, time);
    }
  }

  private updateGunRecoil(deltaTime: number): void {
    // Apply recoil physics
    this.gunRecoilOffset += this.gunRecoilVelocity * (deltaTime / 1000);

    // Add spring back force
    const springForce = -this.gunRecoilOffset * 15; // Spring constant
    const dampingForce = -this.gunRecoilVelocity * 8; // Damping

    this.gunRecoilVelocity += (springForce + dampingForce) * (deltaTime / 1000);

    // Clamp recoil
    this.gunRecoilOffset = Math.max(0, Math.min(0.5, this.gunRecoilOffset));
  }

  public shoot(): void {
    const currentTime = Date.now();
    const weapon = this.weapons[this.currentWeapon];
    const weaponState = this.weaponStates[this.currentWeapon];

    // Check if weapon has ammo
    if (weaponState.currentAmmo <= 0) {
      console.log(`${weapon.name} is out of ammo!`);
      this.isAutoFiring = false;
      this.mouseHeld = false;
      return;
    }

    // Check fire rate
    if (currentTime - weaponState.lastShotTime < weapon.fireRate) {
      return;
    }

    // Handle different weapon types
    if (this.currentWeapon === "shotgun") {
      this.fireShotgun();
    } else {
      this.fireSingleBullet();
    }

    // Update weapon state
    weaponState.currentAmmo--;
    weaponState.lastShotTime = currentTime;
    this.shotsFired++;

    // Trigger enhanced effects based on weapon type
    this.createEnhancedMuzzleFlash();
    this.createMuzzleFlashLight();
    this.triggerGunRecoil();

    // Play weapon sound
    if (this.audioSystem) {
      this.audioSystem.playWeaponSound(this.currentWeapon);
    }

    // Send shooting event to network for multiplayer synchronization
    if (this.networkManager && this.camera) {
      const playerPosition = this.camera.position.clone();
      const shootDirection = new THREE.Vector3();
      this.camera.getWorldDirection(shootDirection);

      this.networkManager.sendShootingEvent(
        this.currentWeapon,
        playerPosition,
        shootDirection
      );
    }

    console.log(
      `${weapon.name} fired! Ammo: ${weaponState.currentAmmo}/${weapon.maxAmmo}`
    );
  }

  private fireShotgun(): void {
    const weapon = this.weapons.shotgun;
    const pelletCount = weapon.pellets || 8;

    for (let i = 0; i < pelletCount; i++) {
      this.createShotgunPellet(weapon.spread);
    }
  }

  private fireSingleBullet(): void {
    const weapon = this.weapons[this.currentWeapon];
    this.createEnhancedBullet(weapon.spread);
  }

  private createShotgunPellet(spread: number = 0): void {
    if (!this.camera || !this.scene) return;

    // Create shotgun pellet group
    const pelletGroup = new THREE.Group();

    // Main pellet
    const pelletGeometry = new THREE.SphereGeometry(0.015, 6, 6);
    const pelletMaterial = new THREE.MeshLambertMaterial({
      color: 0xffdd44,
      emissive: new THREE.Color(0xffaa00),
      emissiveIntensity: 0.4,
    });

    const pellet = new THREE.Mesh(pelletGeometry, pelletMaterial);
    pelletGroup.add(pellet);

    // Get camera position and direction
    const cameraPosition = this.camera.position.clone();
    const cameraDirection = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDirection);

    // Apply weapon spread
    if (spread > 0) {
      const spreadX = (Math.random() - 0.5) * spread;
      const spreadY = (Math.random() - 0.5) * spread;

      cameraDirection.x += spreadX;
      cameraDirection.y += spreadY;
      cameraDirection.normalize();
    }

    // Position pellet slightly in front of camera
    pelletGroup.position.copy(cameraPosition);
    pelletGroup.position.add(cameraDirection.clone().multiplyScalar(0.5));

    // Initialize trail particles array
    pelletGroup.userData.trailParticles = [];

    const bullet: Bullet = {
      id: `bullet_${Date.now()}_${Math.random()}`,
      mesh: pelletGroup,
      velocity: cameraDirection.clone(),
      damage: this.weapons.shotgun.damage,
      createdAt: Date.now(),
      weaponType: "shotgun",
    };

    this.bullets.push(bullet);
    this.scene.add(pelletGroup);
  }

  private createEnhancedBullet(spread: number = 0): void {
    if (!this.camera || !this.scene) return;

    const weapon = this.weapons[this.currentWeapon];
    let bulletGroup: THREE.Group;

    // Create weapon-specific projectile
    switch (this.currentWeapon) {
      case "chaingun":
        bulletGroup = this.createChainguBullet();
        break;
      case "rocket":
        bulletGroup = this.createRocketProjectile();
        break;
      case "plasma":
        bulletGroup = this.createPlasmaProjectile();
        break;
      default:
        bulletGroup = this.createBasicBullet();
        break;
    }

    // Get camera position and direction
    const cameraPosition = this.camera.position.clone();
    const cameraDirection = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDirection);

    // Apply weapon spread
    if (spread > 0) {
      const spreadX = (Math.random() - 0.5) * spread;
      const spreadY = (Math.random() - 0.5) * spread;

      cameraDirection.x += spreadX;
      cameraDirection.y += spreadY;
      cameraDirection.normalize();
    }

    // Position bullet slightly in front of camera
    bulletGroup.position.copy(cameraPosition);
    bulletGroup.position.add(cameraDirection.clone().multiplyScalar(0.5));

    const bullet: Bullet = {
      id: `bullet_${Date.now()}_${Math.random()}`,
      mesh: bulletGroup,
      velocity: cameraDirection.clone(),
      damage: weapon.damage,
      createdAt: Date.now(),
      weaponType: this.currentWeapon,
    };

    this.bullets.push(bullet);
    this.scene.add(bulletGroup);
  }

  private createBasicBullet(): THREE.Group {
    const group = new THREE.Group();

    const bulletGeometry = new THREE.SphereGeometry(0.02, 8, 8);
    const bulletMaterial = new THREE.MeshLambertMaterial({
      color: 0xffff00,
      emissive: new THREE.Color(0xffaa00),
      emissiveIntensity: 0.5,
    });

    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    group.add(bullet);

    return group;
  }

  private createChainguBullet(): THREE.Group {
    const group = new THREE.Group();

    // Main bullet with tracer effect
    const bulletGeometry = new THREE.CapsuleGeometry(0.012, 0.06, 4, 8);
    const bulletMaterial = new THREE.MeshLambertMaterial({
      color: 0xffaa00,
      emissive: new THREE.Color(0xff6600),
      emissiveIntensity: 0.6,
    });

    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    bullet.rotation.x = Math.PI / 2; // Orient along velocity
    group.add(bullet);

    // Glowing trail
    const trailGeometry = new THREE.CapsuleGeometry(0.02, 0.08, 4, 6);
    const trailMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa44,
      transparent: true,
      opacity: 0.4,
    });

    const trail = new THREE.Mesh(trailGeometry, trailMaterial);
    trail.rotation.x = Math.PI / 2;
    trail.position.z = -0.02;
    group.add(trail);

    group.userData.glowTrail = trail;

    return group;
  }

  private createRocketProjectile(): THREE.Group {
    const group = new THREE.Group();

    // Main rocket body
    const rocketGeometry = new THREE.CylinderGeometry(0.03, 0.04, 0.15, 8);
    const rocketMaterial = new THREE.MeshLambertMaterial({
      color: 0x444444,
      emissive: new THREE.Color(0x222222),
      emissiveIntensity: 0.2,
    });

    const rocket = new THREE.Mesh(rocketGeometry, rocketMaterial);
    rocket.rotation.x = Math.PI / 2;
    group.add(rocket);

    // Rocket nose cone
    const noseGeometry = new THREE.ConeGeometry(0.03, 0.06, 8);
    const noseMaterial = new THREE.MeshLambertMaterial({
      color: 0x666666,
      emissive: new THREE.Color(0x333333),
      emissiveIntensity: 0.3,
    });

    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.rotation.x = Math.PI / 2;
    nose.position.z = 0.105;
    group.add(nose);

    // Fire trail group
    const fireTrail = new THREE.Group();
    group.add(fireTrail);
    group.userData.fireTrail = fireTrail;

    // Add initial exhaust particles
    for (let i = 0; i < 5; i++) {
      const fakeBullet = {
        id: `temp_${i}`,
        mesh: group,
        velocity: new THREE.Vector3(0, 0, 1),
        damage: 0,
        createdAt: Date.now(),
        weaponType: "rocket" as const,
      };
      this.addRocketExhaustParticle(fakeBullet);
    }

    return group;
  }

  private createPlasmaProjectile(): THREE.Group {
    const group = new THREE.Group();

    // Plasma core
    const coreGeometry = new THREE.SphereGeometry(0.04, 12, 8);
    const coreMaterial = new THREE.MeshLambertMaterial({
      color: 0x00ffff,
      emissive: new THREE.Color(0x0088ff),
      emissiveIntensity: 0.8,
    });

    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);
    group.userData.core = core;

    // Energy field around core
    const fieldGeometry = new THREE.SphereGeometry(0.08, 8, 6);
    const fieldMaterial = new THREE.MeshLambertMaterial({
      color: 0x4488ff,
      emissive: new THREE.Color(0x2244aa),
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.6,
    });

    const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
    group.add(field);
    group.userData.energyField = field;

    // Electric arcs
    const arcs: THREE.Line[] = [];
    for (let i = 0; i < 4; i++) {
      const arcGeometry = new THREE.BufferGeometry();
      const arcMaterial = new THREE.LineBasicMaterial({
        color: 0x88ddff,
        transparent: true,
        opacity: 0.7,
      });

      const arc = new THREE.Line(arcGeometry, arcMaterial);
      group.add(arc);
      arcs.push(arc);
    }
    group.userData.electricArcs = arcs;

    this.generatePlasmaArcs(group);

    return group;
  }

  private addShotgunTrailParticle(bullet: Bullet): void {
    const sparkGeometry = new THREE.SphereGeometry(0.008, 4, 4);
    const sparkMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa44,
      transparent: true,
      opacity: 0.8,
    });

    const spark = new THREE.Mesh(sparkGeometry, sparkMaterial);
    spark.position.set(
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.02,
      -Math.random() * 0.05
    );

    bullet.mesh.add(spark);

    if (!bullet.mesh.userData.trailParticles) {
      bullet.mesh.userData.trailParticles = [];
    }
    bullet.mesh.userData.trailParticles.push(spark);
  }

  private addRocketExhaustParticle(bullet: Bullet): void {
    if (!bullet.mesh.userData.fireTrail) return;

    const trail = bullet.mesh.userData.fireTrail as THREE.Group;

    const exhaustGeometry = new THREE.SphereGeometry(
      0.02 + Math.random() * 0.01,
      6,
      4
    );
    const exhaustMaterial = new THREE.MeshBasicMaterial({
      color: Math.random() > 0.5 ? 0xff4400 : 0xff8800,
      transparent: true,
      opacity: 0.9,
    });

    const exhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
    exhaust.position.set(
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.02,
      -0.08 - Math.random() * 0.05
    );

    trail.add(exhaust);
  }

  private generatePlasmaArcs(group: THREE.Group): void {
    const arcs = group.userData.electricArcs as THREE.Line[];

    arcs.forEach((arc, index) => {
      const points: THREE.Vector3[] = [];
      const segments = 8;

      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const angle = (index / arcs.length) * Math.PI * 2;
        const radius = 0.06 + Math.random() * 0.02;

        const x = Math.cos(angle + t * Math.PI) * radius * (1 - t);
        const y = Math.sin(angle + t * Math.PI) * radius * (1 - t);
        const z = (Math.random() - 0.5) * 0.02;

        points.push(new THREE.Vector3(x, y, z));
      }

      arc.geometry.setFromPoints(points);
    });
  }

  private updatePlasmaElectricArcs(bullet: Bullet, time: number): void {
    if (Math.random() < 0.3) {
      this.generatePlasmaArcs(bullet.mesh);
    }
  }

  private createEnhancedMuzzleFlash(): void {
    if (!this.camera || !this.scene) return;

    const flashGroup = new THREE.Group();

    // Main flash based on weapon type
    let flashGeometry: THREE.BufferGeometry;
    let flashMaterial: THREE.MeshStandardMaterial;

    switch (this.currentWeapon) {
      case "shotgun":
        flashGeometry = new THREE.ConeGeometry(0.15, 0.3, 8);
        flashMaterial = new THREE.MeshStandardMaterial({
          color: 0xffaa00,
          emissive: new THREE.Color(0xffaa00),
          emissiveIntensity: 1.2,
          transparent: true,
          opacity: 0.9,
        });
        break;
      case "chaingun":
        flashGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        flashMaterial = new THREE.MeshStandardMaterial({
          color: 0xffcc44,
          emissive: new THREE.Color(0xff8800),
          emissiveIntensity: 1.0,
          transparent: true,
          opacity: 0.8,
        });
        break;
      case "rocket":
        flashGeometry = new THREE.SphereGeometry(0.2, 12, 8);
        flashMaterial = new THREE.MeshStandardMaterial({
          color: 0xff6600,
          emissive: new THREE.Color(0xff4400),
          emissiveIntensity: 1.5,
          transparent: true,
          opacity: 0.9,
        });
        break;
      case "plasma":
        flashGeometry = new THREE.SphereGeometry(0.12, 12, 8);
        flashMaterial = new THREE.MeshStandardMaterial({
          color: 0x44aaff,
          emissive: new THREE.Color(0x0088ff),
          emissiveIntensity: 1.3,
          transparent: true,
          opacity: 0.8,
        });
        break;
      default:
        flashGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        flashMaterial = new THREE.MeshStandardMaterial({
          color: 0xffaa00,
          emissive: new THREE.Color(0xffaa00),
          emissiveIntensity: 1,
          transparent: true,
          opacity: 0.8,
        });
        break;
    }

    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flashGroup.add(flash);

    // Add sparks for more dramatic effect
    for (let i = 0; i < (this.currentWeapon === "shotgun" ? 12 : 6); i++) {
      const sparkGeometry = new THREE.SphereGeometry(0.01, 4, 4);
      const sparkMaterial = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.5 ? 0xffaa00 : 0xff6600,
        transparent: true,
        opacity: 0.8,
      });

      const spark = new THREE.Mesh(sparkGeometry, sparkMaterial);
      spark.position.set(
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 0.4,
        Math.random() * 0.2
      );

      flashGroup.add(spark);
    }

    // Position at gun barrel
    const cameraPosition = this.camera.position.clone();
    const cameraDirection = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDirection);

    flashGroup.position.copy(cameraPosition);
    flashGroup.position.add(cameraDirection.clone().multiplyScalar(0.3));

    this.scene.add(flashGroup);

    // Enhanced removal with fade-out
    let opacity = 0.9;
    const fadeInterval = setInterval(() => {
      opacity -= 0.15;
      if (opacity <= 0) {
        this.scene.remove(flashGroup);
        clearInterval(fadeInterval);

        // Dispose geometries and materials
        flashGroup.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.geometry.dispose();
            if (mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach((mat) => mat.dispose());
              } else {
                mesh.material.dispose();
              }
            }
          }
        });
      } else {
        flashGroup.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const material = (child as THREE.Mesh).material as THREE.Material;
            if ("opacity" in material) {
              (material as any).opacity = opacity;
            }
          }
        });
      }
    }, 16); // ~60fps
  }

  private createMuzzleFlashLight(): void {
    if (!this.muzzleFlashLight || !this.camera) return;

    // Position light at camera
    this.muzzleFlashLight.position.copy(this.camera.position);

    // Set light properties based on weapon type
    let intensity = 3.0;
    let color = 0xffaa00;

    switch (this.currentWeapon) {
      case "shotgun":
        intensity = 4.0;
        color = 0xffaa00;
        break;
      case "chaingun":
        intensity = 2.5;
        color = 0xffcc44;
        break;
      case "rocket":
        intensity = 5.0;
        color = 0xff6600;
        break;
      case "plasma":
        intensity = 3.5;
        color = 0x44aaff;
        break;
    }

    // Turn on the light with weapon-specific intensity
    this.muzzleFlashLight.intensity = intensity;
    this.muzzleFlashLight.color.setHex(color);

    // Animate the light fading out
    let currentIntensity = intensity;
    const fadeInterval = setInterval(() => {
      currentIntensity -= intensity * 0.2;
      if (currentIntensity <= 0) {
        this.muzzleFlashLight!.intensity = 0;
        clearInterval(fadeInterval);
      } else {
        this.muzzleFlashLight!.intensity = currentIntensity;
        // Slightly randomize color for flicker effect
        const flicker = 0.9 + Math.random() * 0.1;
        const r = (((color >> 16) & 255) / 255) * flicker;
        const g = (((color >> 8) & 255) / 255) * flicker;
        const b = ((color & 255) / 255) * flicker;
        this.muzzleFlashLight!.color.setRGB(r, g, b);
      }
    }, 16); // ~60fps
  }

  private triggerGunRecoil(): void {
    const weapon = this.weapons[this.currentWeapon];
    this.gunRecoilVelocity += weapon.recoil;
  }

  public startAutoFire(): void {
    this.mouseHeld = true;
    if (this.currentWeapon !== "shotgun") {
      this.isAutoFiring = true;
    }
    this.shoot(); // Fire immediately on mouse down
  }

  public stopAutoFire(): void {
    this.mouseHeld = false;
    this.isAutoFiring = false;
  }

  public reload(): void {
    const weaponState = this.weaponStates[this.currentWeapon];
    const weapon = this.weapons[this.currentWeapon];

    if (weaponState.isReloading || weaponState.currentAmmo >= weapon.maxAmmo) {
      return;
    }

    weaponState.isReloading = true;
    console.log(`Reloading ${weapon.name}...`);

    // Simulate reload time
    setTimeout(() => {
      weaponState.currentAmmo = weapon.maxAmmo;
      weaponState.isReloading = false;
      console.log(`${weapon.name} reloaded!`);
    }, 1500); // 1.5 second reload time
  }

  public switchWeapon(weaponType: WeaponType): void {
    if (this.weaponStates[weaponType].isReloading) {
      console.log(`Cannot switch to ${weaponType} - still reloading`);
      return;
    }

    this.currentWeapon = weaponType;
    this.isAutoFiring = false;
    this.mouseHeld = false;

    // Update weapon model visibility
    this.updateWeaponModelVisibility();

    // Send weapon switch event to network for multiplayer synchronization
    if (this.networkManager) {
      this.networkManager.sendWeaponSwitch(weaponType);
    }

    console.log(`Switched to ${this.weapons[weaponType].name}`);
  }

  public refillAmmo(ammoAmount: number): {
    totalRefilled: number;
    details: string[];
  } {
    let totalRefilled = 0;
    const details: string[] = [];

    // Prioritize current weapon for ammo refill
    const currentWeaponState = this.weaponStates[this.currentWeapon];
    const currentWeaponConfig = this.weapons[this.currentWeapon];

    if (currentWeaponState.currentAmmo < currentWeaponConfig.maxAmmo) {
      // Give 80% of ammo to current weapon
      const currentWeaponRefillAmount = Math.floor(ammoAmount * 0.8);
      const oldAmmo = currentWeaponState.currentAmmo;
      currentWeaponState.currentAmmo = Math.min(
        currentWeaponConfig.maxAmmo,
        currentWeaponState.currentAmmo + currentWeaponRefillAmount
      );
      const actualRefill = currentWeaponState.currentAmmo - oldAmmo;

      if (actualRefill > 0) {
        totalRefilled += actualRefill;
        const ammoType = this.getAmmoTypeName(this.currentWeapon);
        details.push(`${actualRefill} ${ammoType}`);
      }

      // Distribute remaining 20% among other weapons
      const remainingAmmo = Math.floor(ammoAmount * 0.2);
      if (remainingAmmo > 0) {
        const otherWeapons = (
          Object.keys(this.weaponStates) as WeaponType[]
        ).filter((weapon) => weapon !== this.currentWeapon);

        const ammoPerWeapon = Math.floor(remainingAmmo / otherWeapons.length);

        otherWeapons.forEach((weaponType) => {
          const weaponState = this.weaponStates[weaponType];
          const weaponConfig = this.weapons[weaponType];

          if (
            weaponState.currentAmmo < weaponConfig.maxAmmo &&
            ammoPerWeapon > 0
          ) {
            const oldAmmo = weaponState.currentAmmo;
            weaponState.currentAmmo = Math.min(
              weaponConfig.maxAmmo,
              weaponState.currentAmmo + ammoPerWeapon
            );
            const actualRefill = weaponState.currentAmmo - oldAmmo;

            if (actualRefill > 0) {
              totalRefilled += actualRefill;
              const ammoType = this.getAmmoTypeName(weaponType);
              details.push(`${actualRefill} ${ammoType}`);
            }
          }
        });
      }
    } else {
      // Current weapon is full, distribute among all other weapons
      const otherWeapons = (Object.keys(this.weaponStates) as WeaponType[])
        .filter((weapon) => weapon !== this.currentWeapon)
        .filter(
          (weapon) =>
            this.weaponStates[weapon].currentAmmo < this.weapons[weapon].maxAmmo
        );

      if (otherWeapons.length > 0) {
        const ammoPerWeapon = Math.floor(ammoAmount / otherWeapons.length);

        otherWeapons.forEach((weaponType) => {
          const weaponState = this.weaponStates[weaponType];
          const weaponConfig = this.weapons[weaponType];

          if (ammoPerWeapon > 0) {
            const oldAmmo = weaponState.currentAmmo;
            weaponState.currentAmmo = Math.min(
              weaponConfig.maxAmmo,
              weaponState.currentAmmo + ammoPerWeapon
            );
            const actualRefill = weaponState.currentAmmo - oldAmmo;

            if (actualRefill > 0) {
              totalRefilled += actualRefill;
              const ammoType = this.getAmmoTypeName(weaponType);
              details.push(`${actualRefill} ${ammoType}`);
            }
          }
        });
      }
    }

    console.log(
      `🔋 Ammo refilled: ${details.join(" + ")} (Total: ${totalRefilled})`
    );
    return { totalRefilled, details };
  }

  private getAmmoTypeName(weaponType: WeaponType): string {
    switch (weaponType) {
      case "shotgun":
        return "shells";
      case "chaingun":
        return "rounds";
      case "rocket":
        return "rockets";
      case "plasma":
        return "cells";
      default:
        return "ammo";
    }
  }

  public canBenefitFromAmmo(): boolean {
    // Check if any weapon can benefit from ammo
    return (Object.keys(this.weaponStates) as WeaponType[]).some(
      (weaponType) =>
        this.weaponStates[weaponType].currentAmmo <
        this.weapons[weaponType].maxAmmo
    );
  }

  public getBullets(): Bullet[] {
    return this.bullets;
  }

  public removeBullet(bulletId: string): void {
    const index = this.bullets.findIndex((b) => b.id === bulletId);
    if (index !== -1) {
      const bullet = this.bullets[index];
      if (bullet) {
        this.removeBulletFromScene(bullet);
        this.bullets.splice(index, 1);
        this.shotsHit++;
      }
    }
  }

  public getShotsHit(): number {
    return this.shotsHit;
  }

  public getTotalShots(): number {
    return this.shotsFired;
  }

  public getCurrentWeaponState(): WeaponState {
    return this.weaponStates[this.currentWeapon];
  }

  public getCurrentWeapon(): WeaponType {
    return this.currentWeapon;
  }

  public reset(): void {
    // Clear all bullets
    this.bullets.forEach((bullet) => {
      this.removeBulletFromScene(bullet);
    });
    this.bullets = [];

    // Reset weapon states
    this.weaponStates = {
      shotgun: { currentAmmo: 50, lastShotTime: 0, isReloading: false },
      chaingun: { currentAmmo: 200, lastShotTime: 0, isReloading: false },
      rocket: { currentAmmo: 20, lastShotTime: 0, isReloading: false },
      plasma: { currentAmmo: 100, lastShotTime: 0, isReloading: false },
    };

    // Reset stats
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.isAutoFiring = false;
    this.mouseHeld = false;
    this.gunRecoilOffset = 0;
    this.gunRecoilVelocity = 0;

    console.log("WeaponSystem reset with enhanced effects");
  }

  private createWeaponModels(): void {
    // 创建霰弹枪模型
    this.gunModel = this.createShotgunModel();

    // 创建机枪模型
    this.machineGunModel = this.createMachineGunModel();

    // 创建火箭筒模型
    this.rocketLauncherModel = this.createRocketLauncherModel();

    // 创建等离子步枪模型
    this.plasmaRifleModel = this.createPlasmaRifleModel();

    // 只显示当前武器
    this.updateWeaponModelVisibility();
  }

  private createShotgunModel(): THREE.Group {
    const group = new THREE.Group();

    // Double-barrel shotgun design
    // Main barrel assembly
    const barrelGeometry1 = new THREE.CylinderGeometry(0.035, 0.035, 1.0, 8);
    const barrelGeometry2 = new THREE.CylinderGeometry(0.035, 0.035, 1.0, 8);
    const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

    const barrel1 = new THREE.Mesh(barrelGeometry1, barrelMaterial);
    barrel1.rotation.z = Math.PI / 2;
    barrel1.position.set(0, 0.04, -0.5);
    group.add(barrel1);

    const barrel2 = new THREE.Mesh(barrelGeometry2, barrelMaterial);
    barrel2.rotation.z = Math.PI / 2;
    barrel2.position.set(0, -0.04, -0.5);
    group.add(barrel2);

    // Receiver
    const receiverGeometry = new THREE.BoxGeometry(0.12, 0.12, 0.4);
    const receiverMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const receiver = new THREE.Mesh(receiverGeometry, receiverMaterial);
    receiver.position.set(0, 0, -0.1);
    group.add(receiver);

    // Wooden stock
    const stockGeometry = new THREE.BoxGeometry(0.08, 0.15, 0.35);
    const stockMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    const stock = new THREE.Mesh(stockGeometry, stockMaterial);
    stock.position.set(0, -0.08, 0.15);
    group.add(stock);

    // Wooden forend
    const forEndGeometry = new THREE.CylinderGeometry(0.06, 0.05, 0.25, 8);
    const forEndMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    const forEnd = new THREE.Mesh(forEndGeometry, forEndMaterial);
    forEnd.rotation.z = Math.PI / 2;
    forEnd.position.set(0, -0.02, -0.35);
    group.add(forEnd);

    // Trigger guard
    const triggerGuardGeometry = new THREE.TorusGeometry(0.05, 0.012, 8, 16);
    const triggerGuardMaterial = new THREE.MeshLambertMaterial({
      color: 0x404040,
    });
    const triggerGuard = new THREE.Mesh(
      triggerGuardGeometry,
      triggerGuardMaterial
    );
    triggerGuard.rotation.x = Math.PI / 2;
    triggerGuard.position.set(0, -0.06, -0.05);
    group.add(triggerGuard);

    // Sight
    const sightGeometry = new THREE.BoxGeometry(0.008, 0.03, 0.02);
    const sightMaterial = new THREE.MeshLambertMaterial({ color: 0x606060 });
    const sight = new THREE.Mesh(sightGeometry, sightMaterial);
    sight.position.set(0, 0.08, -0.3);
    group.add(sight);

    this.positionWeaponModel(group);

    if (this.scene) {
      this.scene.add(group);
    }

    return group;
  }

  private createMachineGunModel(): THREE.Group {
    const group = new THREE.Group();

    // Multi-barrel rotating chaingun design
    // Main body/receiver
    const bodyGeometry = new THREE.BoxGeometry(0.12, 0.1, 0.8);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 0, -0.4);
    group.add(body);

    // Rotating barrel assembly
    const barrelCount = 6;
    const barrelRadius = 0.05;
    for (let i = 0; i < barrelCount; i++) {
      const angle = (i / barrelCount) * Math.PI * 2;
      const barrelGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.6, 6);
      const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });
      const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
      barrel.rotation.z = Math.PI / 2;
      barrel.position.set(
        Math.cos(angle) * barrelRadius,
        Math.sin(angle) * barrelRadius,
        -0.6
      );
      group.add(barrel);
    }

    // Central barrel housing
    const housingGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8);
    const housingMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const housing = new THREE.Mesh(housingGeometry, housingMaterial);
    housing.rotation.z = Math.PI / 2;
    housing.position.set(0, 0, -0.6);
    group.add(housing);

    // Ammunition belt feed
    const beltGeometry = new THREE.BoxGeometry(0.03, 0.06, 0.15);
    const beltMaterial = new THREE.MeshLambertMaterial({ color: 0xb8860b });
    const belt = new THREE.Mesh(beltGeometry, beltMaterial);
    belt.position.set(-0.08, 0.08, -0.2);
    belt.rotation.z = -0.3;
    group.add(belt);

    // Heavy stock
    const stockGeometry = new THREE.BoxGeometry(0.1, 0.12, 0.3);
    const stockMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const stock = new THREE.Mesh(stockGeometry, stockMaterial);
    stock.position.set(0, -0.06, 0.1);
    group.add(stock);

    // Trigger assembly
    const triggerGuardGeometry = new THREE.TorusGeometry(0.04, 0.01, 8, 16);
    const triggerGuardMaterial = new THREE.MeshLambertMaterial({
      color: 0x404040,
    });
    const triggerGuard = new THREE.Mesh(
      triggerGuardGeometry,
      triggerGuardMaterial
    );
    triggerGuard.rotation.x = Math.PI / 2;
    triggerGuard.position.set(0, -0.05, -0.1);
    group.add(triggerGuard);

    // Heat sink vents
    for (let i = 0; i < 4; i++) {
      const ventGeometry = new THREE.BoxGeometry(0.02, 0.01, 0.08);
      const ventMaterial = new THREE.MeshLambertMaterial({ color: 0x606060 });
      const vent = new THREE.Mesh(ventGeometry, ventMaterial);
      vent.position.set(0, 0.06, -0.4 + i * 0.08);
      group.add(vent);
    }

    this.positionWeaponModel(group);

    if (this.scene) {
      this.scene.add(group);
    }

    return group;
  }

  private createRocketLauncherModel(): THREE.Group {
    const group = new THREE.Group();

    // Large main launcher tube
    const tubeGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.2, 8);
    const tubeMaterial = new THREE.MeshLambertMaterial({ color: 0x2f4f4f });
    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    tube.rotation.z = Math.PI / 2;
    tube.position.set(0, 0, -0.6);
    group.add(tube);

    // Muzzle flare
    const muzzleGeometry = new THREE.ConeGeometry(0.12, 0.15, 8);
    const muzzleMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });
    const muzzle = new THREE.Mesh(muzzleGeometry, muzzleMaterial);
    muzzle.rotation.z = -Math.PI / 2;
    muzzle.position.set(0, 0, -1.2);
    group.add(muzzle);

    // Rocket visible in tube
    const rocketGeometry = new THREE.CylinderGeometry(0.06, 0.04, 0.8, 6);
    const rocketMaterial = new THREE.MeshLambertMaterial({
      color: 0x8b0000,
      emissive: 0x220000,
    });
    const rocket = new THREE.Mesh(rocketGeometry, rocketMaterial);
    rocket.rotation.z = Math.PI / 2;
    rocket.position.set(0, 0, -0.4);
    group.add(rocket);

    // Scope/sight system
    const scopeBodyGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.12, 8);
    const scopeBodyMaterial = new THREE.MeshLambertMaterial({
      color: 0x1a1a1a,
    });
    const scopeBody = new THREE.Mesh(scopeBodyGeometry, scopeBodyMaterial);
    scopeBody.rotation.z = Math.PI / 2;
    scopeBody.position.set(0, 0.12, -0.3);
    group.add(scopeBody);

    // Scope mounts
    const mount1Geometry = new THREE.BoxGeometry(0.02, 0.03, 0.02);
    const mountMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });
    const mount1 = new THREE.Mesh(mount1Geometry, mountMaterial);
    mount1.position.set(0, 0.09, -0.2);
    group.add(mount1);

    const mount2 = new THREE.Mesh(mount1Geometry, mountMaterial);
    mount2.position.set(0, 0.09, -0.4);
    group.add(mount2);

    // Pistol grip
    const gripGeometry = new THREE.BoxGeometry(0.06, 0.15, 0.1);
    const gripMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const grip = new THREE.Mesh(gripGeometry, gripMaterial);
    grip.position.set(0, -0.08, 0.1);
    group.add(grip);

    // Trigger guard
    const triggerGuardGeometry = new THREE.TorusGeometry(0.045, 0.01, 8, 16);
    const triggerGuardMaterial = new THREE.MeshLambertMaterial({
      color: 0x404040,
    });
    const triggerGuard = new THREE.Mesh(
      triggerGuardGeometry,
      triggerGuardMaterial
    );
    triggerGuard.rotation.x = Math.PI / 2;
    triggerGuard.position.set(0, -0.06, 0.05);
    group.add(triggerGuard);

    // Heat shield/fins
    for (let i = 0; i < 6; i++) {
      const finGeometry = new THREE.BoxGeometry(0.02, 0.06, 0.01);
      const finMaterial = new THREE.MeshLambertMaterial({ color: 0x606060 });
      const fin = new THREE.Mesh(finGeometry, finMaterial);
      fin.position.set(0, 0.05, -0.8 + i * 0.1);
      group.add(fin);
    }

    this.positionWeaponModel(group);

    if (this.scene) {
      this.scene.add(group);
    }

    return group;
  }

  private createPlasmaRifleModel(): THREE.Group {
    const group = new THREE.Group();

    // Futuristic main body
    const bodyGeometry = new THREE.BoxGeometry(0.1, 0.12, 0.9);
    const bodyMaterial = new THREE.MeshLambertMaterial({
      color: 0x000080,
      emissive: 0x000020,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 0, -0.45);
    group.add(body);

    // Plasma containment chamber
    const chamberGeometry = new THREE.SphereGeometry(0.08, 12, 8);
    const chamberMaterial = new THREE.MeshLambertMaterial({
      color: 0x00ffff,
      emissive: 0x0080ff,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.8,
    });
    const chamber = new THREE.Mesh(chamberGeometry, chamberMaterial);
    chamber.position.set(0, 0.02, -0.2);
    group.add(chamber);

    // Energy conduits/tubes (multiple)
    for (let i = 0; i < 3; i++) {
      const tubeGeometry = new THREE.CylinderGeometry(0.008, 0.008, 0.4, 6);
      const tubeMaterial = new THREE.MeshLambertMaterial({
        color: 0x00ffff,
        emissive: 0x004080,
        emissiveIntensity: 0.5,
      });
      const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
      tube.rotation.z = Math.PI / 2;

      const angle = (i / 3) * Math.PI * 2;
      const radius = 0.04;
      tube.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius + 0.02,
        -0.6
      );
      group.add(tube);
    }

    // Plasma accelerator barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.05, 0.03, 0.5, 8);
    const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(0, 0, -0.75);
    group.add(barrel);

    // Muzzle energy field
    const muzzleFieldGeometry = new THREE.RingGeometry(0.02, 0.06, 8);
    const muzzleFieldMaterial = new THREE.MeshLambertMaterial({
      color: 0x00ffff,
      emissive: 0x008fff,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.6,
    });
    const muzzleField = new THREE.Mesh(
      muzzleFieldGeometry,
      muzzleFieldMaterial
    );
    muzzleField.position.set(0, 0, -1.0);
    group.add(muzzleField);

    // High-tech stock
    const stockGeometry = new THREE.BoxGeometry(0.08, 0.14, 0.25);
    const stockMaterial = new THREE.MeshLambertMaterial({
      color: 0x1a1a40,
      emissive: 0x000010,
    });
    const stock = new THREE.Mesh(stockGeometry, stockMaterial);
    stock.position.set(0, -0.06, 0.1);
    group.add(stock);

    // Energy display panels
    for (let i = 0; i < 3; i++) {
      const panelGeometry = new THREE.BoxGeometry(0.02, 0.03, 0.06);
      const panelMaterial = new THREE.MeshLambertMaterial({
        color: 0x00ff00,
        emissive: 0x004000,
        emissiveIntensity: 0.4,
      });
      const panel = new THREE.Mesh(panelGeometry, panelMaterial);
      panel.position.set(-0.06, 0.03, -0.3 + i * 0.15);
      group.add(panel);
    }

    // Trigger assembly
    const triggerGuardGeometry = new THREE.TorusGeometry(0.04, 0.01, 8, 16);
    const triggerGuardMaterial = new THREE.MeshLambertMaterial({
      color: 0x404080,
    });
    const triggerGuard = new THREE.Mesh(
      triggerGuardGeometry,
      triggerGuardMaterial
    );
    triggerGuard.rotation.x = Math.PI / 2;
    triggerGuard.position.set(0, -0.05, -0.1);
    group.add(triggerGuard);

    this.positionWeaponModel(group);

    if (this.scene) {
      this.scene.add(group);
    }

    return group;
  }

  private positionWeaponModel(weaponGroup: THREE.Group): void {
    weaponGroup.position.set(
      this.gunBasePosition.x,
      this.gunBasePosition.y,
      this.gunBasePosition.z
    );
    // Position like the old client - minimal rotation for better first-person visibility
    weaponGroup.rotation.set(0.1, 0, 0); // Slight upward tilt like old client
    weaponGroup.scale.setScalar(0.8); // Slightly larger scale for better visibility
  }

  private updateWeaponModelVisibility(): void {
    // 隐藏所有武器
    if (this.gunModel) this.gunModel.visible = false;
    if (this.machineGunModel) this.machineGunModel.visible = false;
    if (this.rocketLauncherModel) this.rocketLauncherModel.visible = false;
    if (this.plasmaRifleModel) this.plasmaRifleModel.visible = false;

    // 显示当前武器
    switch (this.currentWeapon) {
      case "shotgun":
        if (this.gunModel) this.gunModel.visible = true;
        break;
      case "chaingun":
        if (this.machineGunModel) this.machineGunModel.visible = true;
        break;
      case "rocket":
        if (this.rocketLauncherModel) this.rocketLauncherModel.visible = true;
        break;
      case "plasma":
        if (this.plasmaRifleModel) this.plasmaRifleModel.visible = true;
        break;
    }
  }

  public updateWeaponPosition(camera: THREE.Camera): void {
    if (!camera) return;

    const activeWeapon = this.getActiveWeaponModel();
    if (!activeWeapon) return;

    // Get camera position and direction (similar to old client)
    const cameraPosition = camera.position.clone();

    // Calculate weapon position with recoil offset (like old client)
    const weaponOffset = new THREE.Vector3(
      this.gunBasePosition.x,
      this.gunBasePosition.y,
      this.gunBasePosition.z + this.gunRecoilOffset // Apply recoil
    );

    // Apply camera rotation to offset (like old client)
    weaponOffset.applyQuaternion(camera.quaternion);

    // Set weapon position relative to camera (like old client)
    activeWeapon.position.copy(cameraPosition).add(weaponOffset);

    // Copy camera rotation and add slight upward tilt (like old client)
    activeWeapon.rotation.copy(camera.rotation);
    activeWeapon.rotation.x += 0.1; // Slight upward tilt like old client
  }

  private getActiveWeaponModel(): THREE.Group | null {
    switch (this.currentWeapon) {
      case "shotgun":
        return this.gunModel;
      case "chaingun":
        return this.machineGunModel;
      case "rocket":
        return this.rocketLauncherModel;
      case "plasma":
        return this.plasmaRifleModel;
      default:
        return null;
    }
  }

  private removeBulletFromScene(bullet: Bullet): void {
    this.scene.remove(bullet.mesh);

    // Dispose of geometries and materials
    bullet.mesh.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat) => mat.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      }
    });
  }
}
