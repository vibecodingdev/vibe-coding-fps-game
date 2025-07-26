import * as THREE from "three";
import { BaseSceneTheme, SceneThemeConfig } from "../core/SceneTheme";

export class HellTheme extends BaseSceneTheme {
  constructor(scene: THREE.Scene) {
    const config: SceneThemeConfig = {
      name: "Hell",
      primaryColor: 0x3d2525, // Dark red-brown
      secondaryColor: 0x552c2c, // Red-brown for fog
      fogColor: 0x552c2c,
      ambientLightColor: 0x442222,
      directionalLightColor: 0xff5522,
      fillLightColor: 0xff7744,
      groundColor: 0x3d2914, // Dark brown like dried blood and dirt
      skyColor: 0x4a2c2c, // Dark reddish-brown
      glowColor: 0xff3300,
      accentColor: 0xff4422,
    };
    super(scene, config);
  }

  createAtmosphere(): void {
    // Add hellish fog
    const fog = new THREE.Fog(this.config.fogColor, 80, 400);
    this.scene.fog = fog;
  }

  createGround(): THREE.Mesh {
    const groundGeometry = new THREE.PlaneGeometry(2000, 2000);
    const groundMaterial = new THREE.MeshLambertMaterial({
      color: this.config.groundColor,
      transparent: true,
      opacity: 0.9,
    });

    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.position.y = 0;

    return ground;
  }

  createSky(): THREE.Mesh {
    const skyGeometry = new THREE.SphereGeometry(1500, 60, 40);
    const skyMaterial = new THREE.MeshBasicMaterial({
      color: this.config.skyColor,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });

    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    sky.renderOrder = -1000;
    sky.frustumCulled = false;

    // Add hellish sky effects
    this.addSkyEffects();

    return sky;
  }

  private addSkyEffects(): void {
    // Add floating embers/ash particles
    const particleSystem = this.createParticleSystem(200, 0xff4400, 2, 0.6);
    this.scene.add(particleSystem);

    // Add distant hellish glow
    const glowGeometry = new THREE.SphereGeometry(800, 32, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x660000,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide,
    });

    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.y = -400;
    this.scene.add(glow);
  }

  addLighting(): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(
      this.config.ambientLightColor,
      0.6
    );
    this.scene.add(ambientLight);

    // Main directional light
    const directionalLight = new THREE.DirectionalLight(
      this.config.directionalLightColor,
      1.2
    );
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    this.scene.add(directionalLight);

    // Fill light
    const fillLight = new THREE.DirectionalLight(
      this.config.fillLightColor,
      0.6
    );
    fillLight.position.set(-30, 80, -30);
    this.scene.add(fillLight);

    // Hell point lights
    const hellLights: Array<{
      pos: [number, number, number];
      color: number;
      intensity: number;
    }> = [
      { pos: [-30, 8, -30], color: 0xff2200, intensity: 1.8 },
      { pos: [40, 12, 20], color: 0xff4422, intensity: 1.5 },
      { pos: [-15, 6, 35], color: 0xff7722, intensity: 1.3 },
      { pos: [25, 10, -40], color: 0xdd4422, intensity: 1.4 },
      { pos: [-45, 15, 10], color: 0xff5522, intensity: 1.6 },
      { pos: [0, 12, 0], color: 0xff6633, intensity: 2.0 },
      { pos: [35, 8, -35], color: 0xff4411, intensity: 1.2 },
      { pos: [-35, 8, 35], color: 0xff5533, intensity: 1.2 },
    ];

    hellLights.forEach(({ pos, color, intensity }) => {
      const light = new THREE.PointLight(color, intensity, 50);
      light.position.set(pos[0], pos[1], pos[2]);
      this.scene.add(light);
    });

    // Area lighting
    this.createAreaLighting();

    // Flickering fire lights
    this.createFlickeringFireLights();
  }

  private createAreaLighting(): void {
    const areaLights: Array<{
      pos: [number, number, number];
      color: number;
      intensity: number;
    }> = [
      { pos: [0, 25, 0], color: 0xff6644, intensity: 1.8 },
      { pos: [-25, 20, -25], color: 0xff5533, intensity: 1.4 },
      { pos: [25, 20, 25], color: 0xff5533, intensity: 1.4 },
      { pos: [-25, 20, 25], color: 0xff5533, intensity: 1.4 },
      { pos: [25, 20, -25], color: 0xff5533, intensity: 1.4 },
    ];

    areaLights.forEach(({ pos, color, intensity }) => {
      const light = new THREE.PointLight(color, intensity, 60);
      light.position.set(pos[0], pos[1], pos[2]);
      this.scene.add(light);
    });

    // Hemisphere light
    const hemisphereLight = new THREE.HemisphereLight(0xff7744, 0x441111, 0.4);
    this.scene.add(hemisphereLight);
  }

  private createFlickeringFireLights(): void {
    for (let i = 0; i < 12; i++) {
      const fireLight = this.createFlickeringLight(
        new THREE.Vector3(
          (Math.random() - 0.5) * 150,
          Math.random() * 8 + 3,
          (Math.random() - 0.5) * 150
        ),
        0xff5522,
        1.2,
        30
      );
      this.scene.add(fireLight);
    }
  }

  addEnvironmentObjects(): void {
    this.createDemonArchitecture();
    this.createHellishStructures();
    this.createDeadVegetation();
    this.createHellPortals();
    this.createTechDebris();
    this.createHellishBarricades();
  }

  private createDemonArchitecture(): void {
    for (let i = 0; i < 6; i++) {
      const width = 4 + Math.random() * 6;
      const height = 12 + Math.random() * 15;
      const depth = 4 + Math.random() * 6;

      const geometry = new THREE.BoxGeometry(width, height, depth);
      const material = new THREE.MeshLambertMaterial({
        color: 0x2a1111,
        transparent: true,
        opacity: 0.9,
      });

      const building = new THREE.Mesh(geometry, material);
      building.position.set(
        (Math.random() - 0.5) * 180,
        height / 2,
        (Math.random() - 0.5) * 180
      );
      building.rotation.y = Math.random() * Math.PI * 2;
      building.castShadow = true;
      building.receiveShadow = true;

      this.scene.add(building);
      this.addBuildingDetails(building, width, height, depth);
    }
  }

  private addBuildingDetails(
    building: THREE.Mesh,
    width: number,
    height: number,
    depth: number
  ): void {
    // Add glowing windows
    for (let j = 0; j < 8; j++) {
      const windowGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.1);
      const windowMaterial = new THREE.MeshBasicMaterial({
        color: this.config.glowColor,
        transparent: true,
        opacity: 0.8,
      });
      const window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(
        (Math.random() - 0.5) * width * 0.8,
        (Math.random() - 0.5) * height * 0.6,
        width / 2 + 0.05
      );
      building.add(window);
    }

    // Add spikes
    for (let k = 0; k < 4; k++) {
      const spikeGeometry = new THREE.ConeGeometry(0.3, 2, 6);
      const spikeMaterial = new THREE.MeshLambertMaterial({ color: 0x1a0a0a });
      const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
      spike.position.set(
        (Math.random() - 0.5) * width,
        height / 2 + 1,
        (Math.random() - 0.5) * depth
      );
      building.add(spike);
    }
  }

  private createHellishStructures(): void {
    for (let i = 0; i < 5; i++) {
      const altarBase = new THREE.CylinderGeometry(2, 3, 1, 8);
      const altarMaterial = new THREE.MeshLambertMaterial({ color: 0x330000 });
      const altar = new THREE.Mesh(altarBase, altarMaterial);

      altar.position.set(
        (Math.random() - 0.5) * 160,
        0.5,
        (Math.random() - 0.5) * 160
      );
      altar.castShadow = true;
      altar.receiveShadow = true;
      this.scene.add(altar);

      // Add glowing orb
      const orbGeometry = new THREE.SphereGeometry(0.5, 16, 12);
      const orbMaterial = new THREE.MeshBasicMaterial({
        color: this.config.glowColor,
        transparent: true,
        opacity: 0.8,
      });
      const orb = new THREE.Mesh(orbGeometry, orbMaterial);
      orb.position.set(0, 1.5, 0);
      altar.add(orb);

      const orbLight = new THREE.PointLight(this.config.glowColor, 1.0, 15);
      orbLight.position.set(0, 1.5, 0);
      altar.add(orbLight);
    }
  }

  private createDeadVegetation(): void {
    for (let i = 0; i < 12; i++) {
      const trunkGeometry = new THREE.CylinderGeometry(0.15, 0.3, 5, 6);
      const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x2a1a0a });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);

      trunk.position.set(
        (Math.random() - 0.5) * 180,
        2.5,
        (Math.random() - 0.5) * 180
      );
      trunk.rotation.z = (Math.random() - 0.5) * 0.3;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      this.scene.add(trunk);

      // Add branches
      for (let j = 0; j < 6; j++) {
        const branchGeometry = new THREE.CylinderGeometry(0.03, 0.08, 1.5, 4);
        const branch = new THREE.Mesh(branchGeometry, trunkMaterial);
        branch.position.set(
          (Math.random() - 0.5) * 0.6,
          2 + Math.random() * 2,
          (Math.random() - 0.5) * 0.6
        );
        branch.rotation.set(
          (Math.random() - 0.5) * Math.PI,
          Math.random() * Math.PI * 2,
          (Math.random() - 0.5) * Math.PI
        );
        trunk.add(branch);
      }
    }
  }

  private createHellPortals(): void {
    for (let i = 0; i < 3; i++) {
      const portalGeometry = new THREE.RingGeometry(2, 3, 16);
      const portalMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
      });

      const portal = new THREE.Mesh(portalGeometry, portalMaterial);
      portal.position.set(
        (Math.random() - 0.5) * 120,
        4,
        (Math.random() - 0.5) * 120
      );
      portal.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
      this.scene.add(portal);

      const portalLight = new THREE.PointLight(this.config.glowColor, 2.0, 30);
      portalLight.position.copy(portal.position);
      this.scene.add(portalLight);
    }
  }

  private createTechDebris(): void {
    for (let i = 0; i < 8; i++) {
      const crateGeometry = new THREE.BoxGeometry(2, 1.5, 2);
      const crateMaterial = new THREE.MeshLambertMaterial({
        color: [0x2f2f2f, 0x1a1a1a, 0x4a2c2c][Math.floor(Math.random() * 3)],
      });

      const crate = new THREE.Mesh(crateGeometry, crateMaterial);
      crate.position.set(
        (Math.random() - 0.5) * 160,
        0.75,
        (Math.random() - 0.5) * 160
      );
      crate.rotation.y = Math.random() * Math.PI * 2;
      crate.castShadow = true;
      crate.receiveShadow = true;
      this.scene.add(crate);
    }
  }

  private createHellishBarricades(): void {
    for (let i = 0; i < 8; i++) {
      const barrierGeometry = new THREE.BoxGeometry(5, 1.5, 0.4);
      const barrierMaterial = new THREE.MeshLambertMaterial({
        color: 0x331111,
      });
      const barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);

      barrier.position.set(
        (Math.random() - 0.5) * 150,
        0.75,
        (Math.random() - 0.5) * 150
      );
      barrier.rotation.y = Math.random() * Math.PI * 2;
      barrier.castShadow = true;
      barrier.receiveShadow = true;
      this.scene.add(barrier);

      // Add spikes
      for (let j = 0; j < 3; j++) {
        const spikeGeometry = new THREE.ConeGeometry(0.1, 0.8, 4);
        const spikeMaterial = new THREE.MeshLambertMaterial({
          color: 0x1a0808,
        });
        const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
        spike.position.set((j - 1) * 1.5, 1.2, 0);
        barrier.add(spike);
      }
    }
  }

  addGroundDetails(): void {
    this.addBloodStains();
    this.addStoneTilePattern();
    this.addVariedDebris();
    this.addHellCracks();
    this.addHellishGrowths();
    this.addMetalGratingAreas();
    this.addGroundRunes();
  }

  private addBloodStains(): void {
    // Large blood pools
    for (let i = 0; i < 12; i++) {
      const stainGeometry = new THREE.CircleGeometry(Math.random() * 4 + 2, 16);
      const stainMaterial = new THREE.MeshBasicMaterial({
        color: [0x4a0000, 0x660000, 0x330000, 0x550000][
          Math.floor(Math.random() * 4)
        ],
        transparent: true,
        opacity: 0.6 + Math.random() * 0.3,
      });

      const stain = new THREE.Mesh(stainGeometry, stainMaterial);
      stain.rotation.x = -Math.PI / 2;
      stain.position.set(
        (Math.random() - 0.5) * 180,
        0.02 + Math.random() * 0.03,
        (Math.random() - 0.5) * 180
      );
      this.addGroundTextureObject(stain);
    }
  }

  private addStoneTilePattern(): void {
    const tileSize = 4;
    const tilesPerSide = 20;

    for (let x = 0; x < tilesPerSide; x++) {
      for (let z = 0; z < tilesPerSide; z++) {
        if (Math.random() > 0.8) continue;

        const tileGeometry = new THREE.PlaneGeometry(
          tileSize * (0.95 + Math.random() * 0.1),
          tileSize * (0.95 + Math.random() * 0.1)
        );

        const tileColors = [0x2a1f14, 0x3a2a1a, 0x1a1410, 0x4a3520];
        const tileColor =
          tileColors[Math.floor(Math.random() * tileColors.length)];

        const tileMaterial = new THREE.MeshLambertMaterial({
          color: tileColor,
          transparent: true,
          opacity: 0.8,
        });

        const tile = new THREE.Mesh(tileGeometry, tileMaterial);
        tile.rotation.x = -Math.PI / 2;
        tile.position.set(
          (x - tilesPerSide / 2) * tileSize,
          0.01,
          (z - tilesPerSide / 2) * tileSize
        );
        tile.receiveShadow = true;
        this.addGroundTextureObject(tile);
      }
    }
  }

  private addVariedDebris(): void {
    for (let i = 0; i < 25; i++) {
      const debrisGeometry = new THREE.BoxGeometry(
        Math.random() * 1.5 + 0.5,
        Math.random() * 0.8 + 0.3,
        Math.random() * 1.5 + 0.5
      );
      const debrisColors = [0x2f2f2f, 0x1a1a1a, 0x4a2c2c, 0x3a2414, 0x2a2a2a];
      const debrisColor =
        debrisColors[Math.floor(Math.random() * debrisColors.length)];

      const debrisMaterial = new THREE.MeshLambertMaterial({
        color: debrisColor,
      });
      const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
      debris.position.set(
        (Math.random() - 0.5) * 180,
        Math.random() * 0.3,
        (Math.random() - 0.5) * 180
      );
      debris.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      debris.castShadow = true;
      debris.receiveShadow = true;
      this.addGroundTextureObject(debris);
    }
  }

  private addHellCracks(): void {
    for (let i = 0; i < 8; i++) {
      const crackLength = 10 + Math.random() * 15;
      const crackWidth = 0.5 + Math.random() * 1;

      const crackGeometry = new THREE.PlaneGeometry(crackLength, crackWidth);
      const crackMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.9,
      });

      const crack = new THREE.Mesh(crackGeometry, crackMaterial);
      crack.rotation.x = -Math.PI / 2;
      crack.rotation.z = Math.random() * Math.PI * 2;
      crack.position.set(
        (Math.random() - 0.5) * 160,
        0.08,
        (Math.random() - 0.5) * 160
      );
      this.addGroundTextureObject(crack);

      // Add lava glow
      const lavaGeometry = new THREE.PlaneGeometry(
        crackLength * 0.8,
        crackWidth * 0.6
      );
      const lavaMaterial = new THREE.MeshBasicMaterial({
        color: this.config.glowColor,
        transparent: true,
        opacity: 0.7,
      });

      const lava = new THREE.Mesh(lavaGeometry, lavaMaterial);
      lava.rotation.copy(crack.rotation);
      lava.position.copy(crack.position);
      lava.position.y += 0.01;
      this.addGroundTextureObject(lava);
    }
  }

  private addHellishGrowths(): void {
    for (let i = 0; i < 15; i++) {
      const growthGeometry = new THREE.ConeGeometry(
        0.3 + Math.random() * 0.7,
        1 + Math.random() * 2,
        6
      );

      const growthColors = [0x1a0a0a, 0x2a0505, 0x0a1a0a, 0x1a1a0a];
      const growthColor =
        growthColors[Math.floor(Math.random() * growthColors.length)];

      const growthMaterial = new THREE.MeshLambertMaterial({
        color: growthColor,
        transparent: true,
        opacity: 0.8,
      });

      const growth = new THREE.Mesh(growthGeometry, growthMaterial);
      growth.position.set(
        (Math.random() - 0.5) * 170,
        1,
        (Math.random() - 0.5) * 170
      );
      growth.castShadow = true;
      growth.receiveShadow = true;
      this.addGroundTextureObject(growth);
    }
  }

  private addMetalGratingAreas(): void {
    for (let i = 0; i < 6; i++) {
      const gratingSize = 6 + Math.random() * 4;
      const gratingGeometry = new THREE.PlaneGeometry(gratingSize, gratingSize);
      const gratingMaterial = new THREE.MeshLambertMaterial({
        color: 0x2a2a2a,
        transparent: true,
        opacity: 0.8,
      });

      const grating = new THREE.Mesh(gratingGeometry, gratingMaterial);
      grating.rotation.x = -Math.PI / 2;
      grating.position.set(
        (Math.random() - 0.5) * 150,
        0.12,
        (Math.random() - 0.5) * 150
      );
      grating.receiveShadow = true;
      this.addGroundTextureObject(grating);
    }
  }

  private addGroundRunes(): void {
    for (let i = 0; i < 8; i++) {
      const runeGeometry = new THREE.RingGeometry(1, 2.5, 6);
      const runeMaterial = new THREE.MeshBasicMaterial({
        color: this.config.glowColor,
        transparent: true,
        opacity: 0.6,
      });

      const rune = new THREE.Mesh(runeGeometry, runeMaterial);
      rune.rotation.x = -Math.PI / 2;
      rune.position.set(
        (Math.random() - 0.5) * 140,
        0.15,
        (Math.random() - 0.5) * 140
      );
      this.addGroundTextureObject(rune);
    }
  }
}
