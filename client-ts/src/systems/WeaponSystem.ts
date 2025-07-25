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
  private gunBasePosition = { x: 0.3, y: -0.5, z: -1.2 };

  public async initialize(): Promise<void> {
    this.setupMuzzleFlashLight();
    this.createWeaponModels();
    console.log("🔫 WeaponSystem initialized");
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
    // Update bullets
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
        this.scene.remove(bullet.mesh);
        this.bullets.splice(index, 1);
        return;
      }

      // Move bullet forward
      const moveDistance = BULLET_SPEED * (deltaTime / 1000);
      bullet.mesh.position.add(
        bullet.velocity.clone().multiplyScalar(moveDistance)
      );

      // Remove bullets that are too far from origin
      if (bullet.mesh.position.length() > 100) {
        this.scene.remove(bullet.mesh);
        this.bullets.splice(index, 1);
      }
    });
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

    // Trigger effects
    this.createMuzzleFlash();
    this.createMuzzleFlashLight();
    this.triggerGunRecoil();

    // Play weapon sound
    if (this.audioSystem) {
      this.audioSystem.playWeaponSound(this.currentWeapon);
    }

    console.log(
      `${weapon.name} fired! Ammo: ${weaponState.currentAmmo}/${weapon.maxAmmo}`
    );
  }

  private fireShotgun(): void {
    const weapon = this.weapons.shotgun;
    const pelletCount = weapon.pellets || 8;

    for (let i = 0; i < pelletCount; i++) {
      this.createBullet(weapon.spread);
    }
  }

  private fireSingleBullet(): void {
    const weapon = this.weapons[this.currentWeapon];
    this.createBullet(weapon.spread);
  }

  private createBullet(spread: number = 0): void {
    if (!this.camera || !this.scene) return;

    const bulletGeometry = new THREE.SphereGeometry(0.02, 8, 8);
    const bulletMaterial = new THREE.MeshLambertMaterial({
      color: 0xffff00,
      emissive: new THREE.Color(0xffaa00),
      emissiveIntensity: 0.5,
    });

    const bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial);

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
    bulletMesh.position.copy(cameraPosition);
    bulletMesh.position.add(cameraDirection.clone().multiplyScalar(0.5));

    const bullet: Bullet = {
      id: `bullet_${Date.now()}_${Math.random()}`,
      mesh: bulletMesh,
      velocity: cameraDirection.clone(),
      damage: this.weapons[this.currentWeapon].damage,
      createdAt: Date.now(),
      weaponType: this.currentWeapon,
    };

    this.bullets.push(bullet);
    this.scene.add(bulletMesh);
  }

  private createMuzzleFlash(): void {
    if (!this.camera || !this.scene) return;

    const flashGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const flashMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.8,
    });
    // Set emissive properties
    (flashMaterial as any).emissive = new THREE.Color(0xffaa00);
    (flashMaterial as any).emissiveIntensity = 1;

    const flash = new THREE.Mesh(flashGeometry, flashMaterial);

    // Position at gun barrel
    const cameraPosition = this.camera.position.clone();
    const cameraDirection = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDirection);

    flash.position.copy(cameraPosition);
    flash.position.add(cameraDirection.clone().multiplyScalar(0.3));

    this.scene.add(flash);

    // Remove flash after short duration
    setTimeout(() => {
      this.scene.remove(flash);
    }, 100);
  }

  private createMuzzleFlashLight(): void {
    if (!this.muzzleFlashLight || !this.camera) return;

    // Position light at camera
    this.muzzleFlashLight.position.copy(this.camera.position);

    // Turn on the light with full intensity
    this.muzzleFlashLight.intensity = 3.0;
    this.muzzleFlashLight.color.setHex(0xffaa00);

    // Animate the light fading out
    let intensity = 3.0;
    const fadeInterval = setInterval(() => {
      intensity -= 0.3;
      if (intensity <= 0) {
        this.muzzleFlashLight!.intensity = 0;
        clearInterval(fadeInterval);
      } else {
        this.muzzleFlashLight!.intensity = intensity;
        // Slightly randomize color for flicker effect
        const flicker = 0.9 + Math.random() * 0.1;
        this.muzzleFlashLight!.color.setRGB(1.0 * flicker, 0.67 * flicker, 0.0);
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
    console.log(`Switched to ${this.weapons[weaponType].name}`);
  }

  public getBullets(): Bullet[] {
    return this.bullets;
  }

  public removeBullet(bulletId: string): void {
    const index = this.bullets.findIndex((b) => b.id === bulletId);
    if (index !== -1) {
      const bullet = this.bullets[index];
      if (bullet) {
        this.scene.remove(bullet.mesh);
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
      this.scene.remove(bullet.mesh);
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

    console.log("WeaponSystem reset");
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

    // 枪身
    const barrelGeometry = new THREE.CylinderGeometry(0.03, 0.04, 0.8, 8);
    const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(0, 0, -0.4);
    group.add(barrel);

    // 枪托
    const stockGeometry = new THREE.BoxGeometry(0.08, 0.15, 0.3);
    const stockMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    const stock = new THREE.Mesh(stockGeometry, stockMaterial);
    stock.position.set(0, -0.1, 0.1);
    group.add(stock);

    // 扳机护圈
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

    // 设置位置和旋转
    this.positionWeaponModel(group);

    if (this.scene) {
      this.scene.add(group);
    }

    return group;
  }

  private createMachineGunModel(): THREE.Group {
    const group = new THREE.Group();

    // 主枪身
    const bodyGeometry = new THREE.BoxGeometry(0.06, 0.08, 0.6);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 0, -0.3);
    group.add(body);

    // 枪管
    const barrelGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8);
    const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(0, 0.02, -0.5);
    group.add(barrel);

    // 弹夹
    const magGeometry = new THREE.BoxGeometry(0.04, 0.12, 0.08);
    const magMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const mag = new THREE.Mesh(magGeometry, magMaterial);
    mag.position.set(0, -0.08, -0.1);
    group.add(mag);

    this.positionWeaponModel(group);

    if (this.scene) {
      this.scene.add(group);
    }

    return group;
  }

  private createRocketLauncherModel(): THREE.Group {
    const group = new THREE.Group();

    // 主发射管
    const tubeGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8);
    const tubeMaterial = new THREE.MeshLambertMaterial({ color: 0x2f4f4f });
    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    tube.rotation.z = Math.PI / 2;
    tube.position.set(0, 0, -0.4);
    group.add(tube);

    // 瞄准镜
    const sightGeometry = new THREE.BoxGeometry(0.02, 0.03, 0.06);
    const sightMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });
    const sight = new THREE.Mesh(sightGeometry, sightMaterial);
    sight.position.set(0, 0.05, -0.2);
    group.add(sight);

    // 握把
    const gripGeometry = new THREE.BoxGeometry(0.04, 0.12, 0.08);
    const gripMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    const grip = new THREE.Mesh(gripGeometry, gripMaterial);
    grip.position.set(0, -0.06, 0);
    group.add(grip);

    this.positionWeaponModel(group);

    if (this.scene) {
      this.scene.add(group);
    }

    return group;
  }

  private createPlasmaRifleModel(): THREE.Group {
    const group = new THREE.Group();

    // 主体
    const bodyGeometry = new THREE.BoxGeometry(0.08, 0.1, 0.7);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x000080 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 0, -0.35);
    group.add(body);

    // 能量管
    const energyTubeGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.3, 6);
    const energyTubeMaterial = new THREE.MeshLambertMaterial({
      color: 0x00ffff,
      emissive: 0x004040,
    });
    const energyTube = new THREE.Mesh(energyTubeGeometry, energyTubeMaterial);
    energyTube.rotation.z = Math.PI / 2;
    energyTube.position.set(0, 0.02, -0.5);
    group.add(energyTube);

    // 发射口
    const muzzleGeometry = new THREE.CylinderGeometry(0.04, 0.02, 0.08, 8);
    const muzzleMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });
    const muzzle = new THREE.Mesh(muzzleGeometry, muzzleMaterial);
    muzzle.rotation.z = Math.PI / 2;
    muzzle.position.set(0, 0, -0.74);
    group.add(muzzle);

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
    weaponGroup.rotation.set(0.1, 0, 0); // 轻微向上倾斜
    weaponGroup.scale.setScalar(0.8);
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

    // 获取摄像头位置和方向
    const cameraPosition = camera.position.clone();
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);

    // 计算武器位置，包括后坐力偏移
    const weaponOffset = new THREE.Vector3(
      this.gunBasePosition.x,
      this.gunBasePosition.y,
      this.gunBasePosition.z + this.gunRecoilOffset // 应用后坐力
    );

    // 应用摄像头旋转到偏移量
    weaponOffset.applyQuaternion(camera.quaternion);

    // 设置武器位置相对于摄像头
    activeWeapon.position.copy(cameraPosition).add(weaponOffset);
    activeWeapon.rotation.copy(camera.rotation);
    activeWeapon.rotation.x += 0.1; // 轻微向上倾斜
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
}
