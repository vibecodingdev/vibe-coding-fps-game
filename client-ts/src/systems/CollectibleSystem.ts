import * as THREE from "three";
import {
  CollectibleItem,
  CollectibleSystem as ICollectibleSystem,
} from "@/types/game";

export class CollectibleSystem implements ICollectibleSystem {
  public healthPacks: CollectibleItem[] = [];
  public ammoPacks: CollectibleItem[] = [];
  public lastHealthPackSpawn = 0;
  public lastAmmoPackSpawn = 0;
  public healthPacksCollected = 0;
  public ammoPacksCollected = 0;

  private scene!: THREE.Scene;
  private readonly HEALTH_PACK_SPAWN_INTERVAL = 15000; // 15 seconds
  private readonly AMMO_PACK_SPAWN_INTERVAL = 20000; // 20 seconds
  private readonly HEALTH_PACK_HEAL_AMOUNT = 25;
  private readonly AMMO_PACK_REFILL_AMOUNT = 60;
  private readonly MAX_HEALTH_PACKS = 3;
  private readonly MAX_AMMO_PACKS = 2;

  public async initialize(): Promise<void> {
    console.log("💊 CollectibleSystem initialized");
  }

  public setScene(scene: THREE.Scene): void {
    this.scene = scene;
  }

  public update(deltaTime: number): void {
    const currentTime = Date.now();

    // Update spawning
    this.updateSpawning(currentTime);

    // Update animations
    this.updateAnimations(deltaTime);
  }

  private updateSpawning(currentTime: number): void {
    // Spawn health packs
    if (
      currentTime - this.lastHealthPackSpawn >
        this.HEALTH_PACK_SPAWN_INTERVAL &&
      this.healthPacks.length < this.MAX_HEALTH_PACKS
    ) {
      this.spawnHealthPack();
      this.lastHealthPackSpawn = currentTime;
    }

    // Spawn ammo packs
    if (
      currentTime - this.lastAmmoPackSpawn > this.AMMO_PACK_SPAWN_INTERVAL &&
      this.ammoPacks.length < this.MAX_AMMO_PACKS
    ) {
      this.spawnAmmoPack();
      this.lastAmmoPackSpawn = currentTime;
    }
  }

  private updateAnimations(deltaTime: number): void {
    const time = Date.now() * 0.001;

    // Animate health packs
    this.healthPacks.forEach((healthPack) => {
      healthPack.mesh.rotation.y +=
        healthPack.rotationSpeed * deltaTime * 0.001;
      healthPack.mesh.position.y =
        healthPack.position.y +
        Math.sin(time * healthPack.bobSpeed + healthPack.bobOffset) * 0.3;
    });

    // Animate ammo packs
    this.ammoPacks.forEach((ammoPack) => {
      ammoPack.mesh.rotation.y += ammoPack.rotationSpeed * deltaTime * 0.001;
      ammoPack.mesh.position.y =
        ammoPack.position.y +
        Math.sin(time * ammoPack.bobSpeed + ammoPack.bobOffset) * 0.3;
    });
  }

  private spawnHealthPack(): void {
    const healthPack = this.createHealthPackModel();
    const position = this.getRandomSpawnPosition();

    healthPack.position.copy(position);

    const collectible: CollectibleItem = {
      id: `health_${Date.now()}_${Math.random()}`,
      type: "health",
      mesh: healthPack,
      position: position,
      value: this.HEALTH_PACK_HEAL_AMOUNT,
      creationTime: Date.now(),
      rotationSpeed: 1 + Math.random() * 2,
      bobSpeed: 2 + Math.random() * 2,
      bobOffset: Math.random() * Math.PI * 2,
    };

    this.healthPacks.push(collectible);
    this.scene.add(healthPack);

    console.log(
      `💉 Neural stim spawned at (${position.x.toFixed(
        1
      )}, ${position.z.toFixed(1)})`
    );
  }

  private spawnAmmoPack(): void {
    const ammoPack = this.createAmmoPackModel();
    const position = this.getRandomSpawnPosition();

    ammoPack.position.copy(position);

    const collectible: CollectibleItem = {
      id: `ammo_${Date.now()}_${Math.random()}`,
      type: "ammo",
      mesh: ammoPack,
      position: position,
      value: this.AMMO_PACK_REFILL_AMOUNT,
      creationTime: Date.now(),
      rotationSpeed: 1 + Math.random() * 2,
      bobSpeed: 2 + Math.random() * 2,
      bobOffset: Math.random() * Math.PI * 2,
    };

    this.ammoPacks.push(collectible);
    this.scene.add(ammoPack);

    console.log(
      `🔋 Energy cell spawned at (${position.x.toFixed(
        1
      )}, ${position.z.toFixed(1)})`
    );
  }

  private createHealthPackModel(): THREE.Group {
    const group = new THREE.Group();

    // Main body (medical cross shape)
    const bodyGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.2);
    const bodyMaterial = new THREE.MeshLambertMaterial({
      color: 0x00ff00,
      emissive: 0x004400,
      emissiveIntensity: 0.3,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(body);

    // Cross horizontal bar
    const crossHGeometry = new THREE.BoxGeometry(0.4, 0.1, 0.21);
    const crossMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      emissive: 0x004400,
      emissiveIntensity: 0.2,
    });
    const crossH = new THREE.Mesh(crossHGeometry, crossMaterial);
    group.add(crossH);

    // Cross vertical bar
    const crossVGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.21);
    const crossV = new THREE.Mesh(crossVGeometry, crossMaterial);
    group.add(crossV);

    // Glow effect
    const glowGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.1,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);

    // Position above ground
    group.position.y = 1;

    // Enable shadows
    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return group;
  }

  private createAmmoPackModel(): THREE.Group {
    const group = new THREE.Group();

    // Main body
    const bodyGeometry = new THREE.BoxGeometry(0.5, 0.3, 0.8);
    const bodyMaterial = new THREE.MeshLambertMaterial({
      color: 0x0066ff,
      emissive: 0x001144,
      emissiveIntensity: 0.3,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(body);

    // Top detail
    const topGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.6);
    const topMaterial = new THREE.MeshLambertMaterial({
      color: 0x00aaff,
      emissive: 0x002244,
      emissiveIntensity: 0.2,
    });
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.y = 0.2;
    group.add(top);

    // Energy indicators
    for (let i = 0; i < 3; i++) {
      const indicatorGeometry = new THREE.SphereGeometry(0.05, 8, 8);
      const indicatorMaterial = new THREE.MeshLambertMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 0.8,
      });
      const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
      indicator.position.set((i - 1) * 0.15, 0.25, 0.3);
      group.add(indicator);
    }

    // Glow effect
    const glowGeometry = new THREE.SphereGeometry(0.9, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x0066ff,
      transparent: true,
      opacity: 0.1,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);

    // Position above ground
    group.position.y = 1;

    // Enable shadows
    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return group;
  }

  private getRandomSpawnPosition(): THREE.Vector3 {
    let x: number, z: number;
    let attempts = 0;

    do {
      x = (Math.random() - 0.5) * 50;
      z = (Math.random() - 0.5) * 50;
      attempts++;
    } while (attempts < 10 && this.isTooCloseToEntities(x, z, 8));

    return new THREE.Vector3(x, 0, z);
  }

  private isTooCloseToEntities(
    x: number,
    z: number,
    minDistance: number
  ): boolean {
    // Check distance from origin (player spawn)
    if (Math.sqrt(x * x + z * z) < minDistance) {
      return true;
    }

    // Check distance from existing health packs
    for (const healthPack of this.healthPacks) {
      const distance = Math.sqrt(
        Math.pow(x - healthPack.position.x, 2) +
          Math.pow(z - healthPack.position.z, 2)
      );
      if (distance < minDistance) {
        return true;
      }
    }

    // Check distance from existing ammo packs
    for (const ammoPack of this.ammoPacks) {
      const distance = Math.sqrt(
        Math.pow(x - ammoPack.position.x, 2) +
          Math.pow(z - ammoPack.position.z, 2)
      );
      if (distance < minDistance) {
        return true;
      }
    }

    return false;
  }

  public checkPlayerCollision(playerPosition: THREE.Vector3): {
    type: "health" | "ammo" | null;
    id: string | null;
    value: number;
  } {
    const collisionDistance = 2.0;

    // Check health pack collisions
    for (const healthPack of this.healthPacks) {
      const distance = playerPosition.distanceTo(healthPack.position);

      if (distance < collisionDistance) {
        return {
          type: "health",
          id: healthPack.id,
          value: healthPack.value,
        };
      }
    }

    // Check ammo pack collisions
    for (const ammoPack of this.ammoPacks) {
      const distance = playerPosition.distanceTo(ammoPack.position);

      if (distance < collisionDistance) {
        return {
          type: "ammo",
          id: ammoPack.id,
          value: ammoPack.value,
        };
      }
    }

    return { type: null, id: null, value: 0 };
  }

  public collectItem(id: string): boolean {
    // Try to find and remove health pack
    const healthPackIndex = this.healthPacks.findIndex(
      (pack) => pack.id === id
    );
    if (healthPackIndex !== -1) {
      const healthPack = this.healthPacks[healthPackIndex];
      if (healthPack) {
        this.scene.remove(healthPack.mesh);
        this.healthPacks.splice(healthPackIndex, 1);
        this.healthPacksCollected++;
        console.log(
          `💉 Neural stim collected! Total: ${this.healthPacksCollected}`
        );
        return true;
      }
    }

    // Try to find and remove ammo pack
    const ammoPackIndex = this.ammoPacks.findIndex((pack) => pack.id === id);
    if (ammoPackIndex !== -1) {
      const ammoPack = this.ammoPacks[ammoPackIndex];
      if (ammoPack) {
        this.scene.remove(ammoPack.mesh);
        this.ammoPacks.splice(ammoPackIndex, 1);
        this.ammoPacksCollected++;
        console.log(
          `🔋 Energy cell collected! Total: ${this.ammoPacksCollected}`
        );
        return true;
      }
    }

    return false;
  }

  public reset(): void {
    // Remove all health packs from scene
    this.healthPacks.forEach((healthPack) => {
      this.scene.remove(healthPack.mesh);
    });

    // Remove all ammo packs from scene
    this.ammoPacks.forEach((ammoPack) => {
      this.scene.remove(ammoPack.mesh);
    });

    // Reset state
    this.healthPacks = [];
    this.ammoPacks = [];
    this.lastHealthPackSpawn = 0;
    this.lastAmmoPackSpawn = 0;
    this.healthPacksCollected = 0;
    this.ammoPacksCollected = 0;
  }
}
