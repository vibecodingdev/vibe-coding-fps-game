import * as THREE from "three";
import { BaseSceneTheme, SceneThemeConfig } from "../core/SceneTheme";

export class IceTheme extends BaseSceneTheme {
  constructor(scene: THREE.Scene) {
    const config: SceneThemeConfig = {
      name: "Ice",
      primaryColor: 0x1a2540, // Dark blue
      secondaryColor: 0x2c4a7a, // Medium blue for fog
      fogColor: 0x3c5a8a,
      ambientLightColor: 0x222244,
      directionalLightColor: 0x6699ff,
      fillLightColor: 0x7799dd,
      groundColor: 0x1a2a3a, // Dark blue-gray ice
      skyColor: 0x2c3a5a, // Dark blue sky
      glowColor: 0x66ccff,
      accentColor: 0x4477ff,
    };
    super(scene, config);
  }

  createAtmosphere(): void {
    // Add cold, misty fog
    const fog = new THREE.Fog(this.config.fogColor, 100, 450);
    this.scene.fog = fog;
  }

  createGround(): THREE.Mesh {
    const groundGeometry = new THREE.PlaneGeometry(2000, 2000);
    const groundMaterial = new THREE.MeshLambertMaterial({
      color: this.config.groundColor,
      transparent: true,
      opacity: 0.95,
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

    // Add icy sky effects
    this.addSkyEffects();

    return sky;
  }

  private addSkyEffects(): void {
    // Add snow particles
    const particleSystem = this.createParticleSystem(300, 0xffffff, 1.5, 0.8);
    this.scene.add(particleSystem);

    // Add distant cold glow
    const glowGeometry = new THREE.SphereGeometry(800, 32, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x0044aa,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
    });

    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.y = -400;
    this.scene.add(glow);

    // Add aurora-like effect
    this.createAuroraEffect();
  }

  private createAuroraEffect(): void {
    const auroraGeometry = new THREE.PlaneGeometry(1000, 200);
    const auroraMaterial = new THREE.MeshBasicMaterial({
      color: this.config.glowColor,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });

    for (let i = 0; i < 3; i++) {
      const aurora = new THREE.Mesh(auroraGeometry, auroraMaterial);
      aurora.position.set(
        (Math.random() - 0.5) * 800,
        200 + Math.random() * 100,
        (Math.random() - 0.5) * 800
      );
      aurora.rotation.y = Math.random() * Math.PI * 2;
      this.scene.add(aurora);

      // Add subtle animation
      setInterval(() => {
        auroraMaterial.opacity = 0.15 * (0.5 + Math.random() * 0.5);
      }, 2000 + Math.random() * 3000);
    }
  }

  addLighting(): void {
    // Cold ambient light
    const ambientLight = new THREE.AmbientLight(
      this.config.ambientLightColor,
      0.7
    );
    this.scene.add(ambientLight);

    // Main directional light (cold sunlight)
    const directionalLight = new THREE.DirectionalLight(
      this.config.directionalLightColor,
      1.0
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
      0.5
    );
    fillLight.position.set(-30, 80, -30);
    this.scene.add(fillLight);

    // Ice crystal lights
    const iceLights: Array<{
      pos: [number, number, number];
      color: number;
      intensity: number;
    }> = [
      { pos: [-30, 8, -30], color: 0x4488ff, intensity: 1.5 },
      { pos: [40, 12, 20], color: 0x6699ff, intensity: 1.2 },
      { pos: [-15, 6, 35], color: 0x77aaff, intensity: 1.0 },
      { pos: [25, 10, -40], color: 0x5599dd, intensity: 1.3 },
      { pos: [-45, 15, 10], color: 0x66ccff, intensity: 1.4 },
      { pos: [0, 12, 0], color: 0x88bbff, intensity: 1.8 },
      { pos: [35, 8, -35], color: 0x4477dd, intensity: 1.1 },
      { pos: [-35, 8, 35], color: 0x5588ee, intensity: 1.1 },
    ];

    iceLights.forEach(({ pos, color, intensity }) => {
      const light = new THREE.PointLight(color, intensity, 45);
      light.position.set(pos[0], pos[1], pos[2]);
      this.scene.add(light);
    });

    // Area lighting
    this.createAreaLighting();

    // Crystal lights
    this.createCrystalLights();
  }

  private createAreaLighting(): void {
    const areaLights: Array<{
      pos: [number, number, number];
      color: number;
      intensity: number;
    }> = [
      { pos: [0, 25, 0], color: 0x6699dd, intensity: 1.5 },
      { pos: [-25, 20, -25], color: 0x5588cc, intensity: 1.2 },
      { pos: [25, 20, 25], color: 0x5588cc, intensity: 1.2 },
      { pos: [-25, 20, 25], color: 0x5588cc, intensity: 1.2 },
      { pos: [25, 20, -25], color: 0x5588cc, intensity: 1.2 },
    ];

    areaLights.forEach(({ pos, color, intensity }) => {
      const light = new THREE.PointLight(color, intensity, 55);
      light.position.set(pos[0], pos[1], pos[2]);
      this.scene.add(light);
    });

    // Hemisphere light for cold atmosphere
    const hemisphereLight = new THREE.HemisphereLight(0x7799dd, 0x223344, 0.3);
    this.scene.add(hemisphereLight);
  }

  private createCrystalLights(): void {
    for (let i = 0; i < 10; i++) {
      const crystalLight = this.createFlickeringLight(
        new THREE.Vector3(
          (Math.random() - 0.5) * 150,
          Math.random() * 6 + 2,
          (Math.random() - 0.5) * 150
        ),
        0x66ccff,
        1.0,
        25
      );
      this.scene.add(crystalLight);
    }
  }

  addEnvironmentObjects(): void {
    this.createIceCitadels();
    this.createCrystalFormations();
    this.createFrozenTrees();
    this.createIcePortals();
    this.createFrozenDebris();
    this.createIceBarricades();
  }

  private createIceCitadels(): void {
    for (let i = 0; i < 5; i++) {
      const width = 3 + Math.random() * 5;
      const height = 10 + Math.random() * 12;
      const depth = 3 + Math.random() * 5;

      const geometry = new THREE.BoxGeometry(width, height, depth);
      const material = new THREE.MeshLambertMaterial({
        color: 0x223355,
        transparent: true,
        opacity: 0.9,
      });

      const citadel = new THREE.Mesh(geometry, material);
      citadel.position.set(
        (Math.random() - 0.5) * 170,
        height / 2,
        (Math.random() - 0.5) * 170
      );
      citadel.rotation.y = Math.random() * Math.PI * 2;
      citadel.castShadow = true;
      citadel.receiveShadow = true;

      // Add ice citadel as collidable object
      this.addCollidableObject(citadel, "static");
      this.addCitadelDetails(citadel, width, height, depth);
    }
  }

  private addCitadelDetails(
    citadel: THREE.Mesh,
    width: number,
    height: number,
    depth: number
  ): void {
    // Add glowing ice windows
    for (let j = 0; j < 6; j++) {
      const windowGeometry = new THREE.BoxGeometry(0.6, 1.0, 0.1);
      const windowMaterial = new THREE.MeshBasicMaterial({
        color: this.config.glowColor,
        transparent: true,
        opacity: 0.7,
      });
      const window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(
        (Math.random() - 0.5) * width * 0.7,
        (Math.random() - 0.5) * height * 0.5,
        width / 2 + 0.05
      );
      citadel.add(window);
    }

    // Add ice spires
    for (let k = 0; k < 3; k++) {
      const spireGeometry = new THREE.ConeGeometry(0.2, 1.5, 6);
      const spireMaterial = new THREE.MeshLambertMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.8,
      });
      const spire = new THREE.Mesh(spireGeometry, spireMaterial);
      spire.position.set(
        (Math.random() - 0.5) * width * 0.8,
        height / 2 + 0.75,
        (Math.random() - 0.5) * depth * 0.8
      );
      citadel.add(spire);
    }
  }

  private createCrystalFormations(): void {
    for (let i = 0; i < 8; i++) {
      const crystalBase = new THREE.CylinderGeometry(1.5, 2.5, 0.8, 6);
      const crystalMaterial = new THREE.MeshLambertMaterial({
        color: 0x334466,
        transparent: true,
        opacity: 0.8,
      });
      const crystal = new THREE.Mesh(crystalBase, crystalMaterial);

      crystal.position.set(
        (Math.random() - 0.5) * 160,
        0.4,
        (Math.random() - 0.5) * 160
      );
      crystal.castShadow = true;
      crystal.receiveShadow = true;
      this.scene.add(crystal);

      // Add glowing crystal
      const gemGeometry = new THREE.OctahedronGeometry(0.8);
      const gemMaterial = new THREE.MeshBasicMaterial({
        color: this.config.glowColor,
        transparent: true,
        opacity: 0.9,
      });
      const gem = new THREE.Mesh(gemGeometry, gemMaterial);
      gem.position.set(0, 1.2, 0);
      crystal.add(gem);

      const gemLight = new THREE.PointLight(this.config.glowColor, 0.8, 12);
      gemLight.position.set(0, 1.2, 0);
      crystal.add(gemLight);
    }
  }

  private createFrozenTrees(): void {
    for (let i = 0; i < 10; i++) {
      const trunkGeometry = new THREE.CylinderGeometry(0.12, 0.25, 4, 6);
      const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x1a2a3a });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);

      trunk.position.set(
        (Math.random() - 0.5) * 180,
        2,
        (Math.random() - 0.5) * 180
      );
      trunk.rotation.z = (Math.random() - 0.5) * 0.2;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      this.scene.add(trunk);

      // Add frozen branches with ice
      for (let j = 0; j < 5; j++) {
        const branchGeometry = new THREE.CylinderGeometry(0.02, 0.06, 1.2, 4);
        const branch = new THREE.Mesh(branchGeometry, trunkMaterial);
        branch.position.set(
          (Math.random() - 0.5) * 0.5,
          1.5 + Math.random() * 1.5,
          (Math.random() - 0.5) * 0.5
        );
        branch.rotation.set(
          (Math.random() - 0.5) * Math.PI * 0.8,
          Math.random() * Math.PI * 2,
          (Math.random() - 0.5) * Math.PI * 0.8
        );
        trunk.add(branch);

        // Add ice crystals on branches
        const iceGeometry = new THREE.SphereGeometry(0.1, 6, 4);
        const iceMaterial = new THREE.MeshBasicMaterial({
          color: 0x88ccff,
          transparent: true,
          opacity: 0.7,
        });
        const ice = new THREE.Mesh(iceGeometry, iceMaterial);
        ice.position.set(0, 0.6, 0);
        branch.add(ice);
      }
    }
  }

  private createIcePortals(): void {
    for (let i = 0; i < 2; i++) {
      const portalGeometry = new THREE.RingGeometry(1.8, 2.8, 12);
      const portalMaterial = new THREE.MeshBasicMaterial({
        color: 0x4488ff,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      });

      const portal = new THREE.Mesh(portalGeometry, portalMaterial);
      portal.position.set(
        (Math.random() - 0.5) * 100,
        3.5,
        (Math.random() - 0.5) * 100
      );
      portal.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.3;
      this.scene.add(portal);

      // Add inner glow
      const innerGlow = new THREE.Mesh(
        new THREE.CircleGeometry(2.3, 12),
        new THREE.MeshBasicMaterial({
          color: 0x66aaff,
          transparent: true,
          opacity: 0.3,
          side: THREE.DoubleSide,
        })
      );
      innerGlow.position.copy(portal.position);
      innerGlow.rotation.copy(portal.rotation);
      this.scene.add(innerGlow);

      const portalLight = new THREE.PointLight(this.config.glowColor, 1.5, 25);
      portalLight.position.copy(portal.position);
      this.scene.add(portalLight);
    }
  }

  private createFrozenDebris(): void {
    for (let i = 0; i < 6; i++) {
      const debrisGeometry = new THREE.BoxGeometry(1.8, 1.2, 1.8);
      const debrisMaterial = new THREE.MeshLambertMaterial({
        color: [0x2a3a4a, 0x1a2a3a, 0x3a4a5a][Math.floor(Math.random() * 3)],
      });

      const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
      debris.position.set(
        (Math.random() - 0.5) * 150,
        0.6,
        (Math.random() - 0.5) * 150
      );
      debris.rotation.y = Math.random() * Math.PI * 2;
      debris.rotation.z = (Math.random() - 0.5) * 0.2;
      debris.castShadow = true;
      debris.receiveShadow = true;
      this.scene.add(debris);

      // Add ice coating
      const iceCoatingGeometry = new THREE.BoxGeometry(1.9, 1.3, 1.9);
      const iceCoatingMaterial = new THREE.MeshBasicMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.3,
      });
      const iceCoating = new THREE.Mesh(iceCoatingGeometry, iceCoatingMaterial);
      iceCoating.position.copy(debris.position);
      iceCoating.rotation.copy(debris.rotation);
      this.scene.add(iceCoating);
    }
  }

  private createIceBarricades(): void {
    for (let i = 0; i < 6; i++) {
      const barrierGeometry = new THREE.BoxGeometry(4.5, 1.2, 0.3);
      const barrierMaterial = new THREE.MeshLambertMaterial({
        color: 0x334455,
      });
      const barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);

      barrier.position.set(
        (Math.random() - 0.5) * 140,
        0.6,
        (Math.random() - 0.5) * 140
      );
      barrier.rotation.y = Math.random() * Math.PI * 2;
      barrier.rotation.z = (Math.random() - 0.5) * 0.3;
      barrier.castShadow = true;
      barrier.receiveShadow = true;
      this.scene.add(barrier);

      // Add ice spikes
      for (let j = 0; j < 3; j++) {
        const spikeGeometry = new THREE.ConeGeometry(0.08, 0.6, 6);
        const spikeMaterial = new THREE.MeshLambertMaterial({
          color: 0x88ccff,
          transparent: true,
          opacity: 0.8,
        });
        const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
        spike.position.set((j - 1) * 1.2, 0.9, 0);
        spike.rotation.x = (Math.random() - 0.5) * 0.2;
        barrier.add(spike);
      }
    }
  }

  addGroundDetails(): void {
    this.addIcePatches();
    this.addFrozenTilePattern();
    this.addIcyDebris();
    this.addIceCracks();
    this.addFrozenGrowths();
    this.addMetalGratingAreas();
    this.addIceRunes();
  }

  private addIcePatches(): void {
    // Large ice patches
    for (let i = 0; i < 15; i++) {
      const patchGeometry = new THREE.CircleGeometry(
        Math.random() * 3 + 1.5,
        12
      );
      const patchMaterial = new THREE.MeshBasicMaterial({
        color: [0x88ccff, 0x99ddff, 0x77bbee, 0xaaeeff][
          Math.floor(Math.random() * 4)
        ],
        transparent: true,
        opacity: 0.4 + Math.random() * 0.3,
      });

      const patch = new THREE.Mesh(patchGeometry, patchMaterial);
      patch.rotation.x = -Math.PI / 2;
      patch.position.set(
        (Math.random() - 0.5) * 180,
        0.01 + Math.random() * 0.02,
        (Math.random() - 0.5) * 180
      );
      this.addGroundTextureObject(patch);
    }
  }

  private addFrozenTilePattern(): void {
    const tileSize = 4;
    const tilesPerSide = 18;

    for (let x = 0; x < tilesPerSide; x++) {
      for (let z = 0; z < tilesPerSide; z++) {
        if (Math.random() > 0.75) continue;

        const tileGeometry = new THREE.PlaneGeometry(
          tileSize * (0.9 + Math.random() * 0.2),
          tileSize * (0.9 + Math.random() * 0.2)
        );

        const tileColors = [0x2a3a4a, 0x3a4a5a, 0x1a2a3a, 0x4a5a6a];
        const tileColor =
          tileColors[Math.floor(Math.random() * tileColors.length)];

        const tileMaterial = new THREE.MeshLambertMaterial({
          color: tileColor,
          transparent: true,
          opacity: 0.7,
        });

        const tile = new THREE.Mesh(tileGeometry, tileMaterial);
        tile.rotation.x = -Math.PI / 2;
        tile.position.set(
          (x - tilesPerSide / 2) * tileSize,
          0.005,
          (z - tilesPerSide / 2) * tileSize
        );
        tile.receiveShadow = true;
        this.addGroundTextureObject(tile);
      }
    }
  }

  private addIcyDebris(): void {
    for (let i = 0; i < 20; i++) {
      const debrisGeometry = new THREE.BoxGeometry(
        Math.random() * 1.2 + 0.4,
        Math.random() * 0.6 + 0.2,
        Math.random() * 1.2 + 0.4
      );
      const debrisColors = [0x3a4a5a, 0x2a3a4a, 0x4a5a6a, 0x5a6a7a, 0x1a2a3a];
      const debrisColor =
        debrisColors[Math.floor(Math.random() * debrisColors.length)];

      const debrisMaterial = new THREE.MeshLambertMaterial({
        color: debrisColor,
      });
      const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
      debris.position.set(
        (Math.random() - 0.5) * 170,
        Math.random() * 0.2,
        (Math.random() - 0.5) * 170
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

  private addIceCracks(): void {
    for (let i = 0; i < 6; i++) {
      const crackLength = 8 + Math.random() * 12;
      const crackWidth = 0.3 + Math.random() * 0.6;

      const crackGeometry = new THREE.PlaneGeometry(crackLength, crackWidth);
      const crackMaterial = new THREE.MeshBasicMaterial({
        color: 0x001122,
        transparent: true,
        opacity: 0.8,
      });

      const crack = new THREE.Mesh(crackGeometry, crackMaterial);
      crack.rotation.x = -Math.PI / 2;
      crack.rotation.z = Math.random() * Math.PI * 2;
      crack.position.set(
        (Math.random() - 0.5) * 150,
        0.05,
        (Math.random() - 0.5) * 150
      );
      this.addGroundTextureObject(crack);

      // Add ice glow in cracks
      const iceGlowGeometry = new THREE.PlaneGeometry(
        crackLength * 0.7,
        crackWidth * 0.5
      );
      const iceGlowMaterial = new THREE.MeshBasicMaterial({
        color: this.config.glowColor,
        transparent: true,
        opacity: 0.5,
      });

      const iceGlow = new THREE.Mesh(iceGlowGeometry, iceGlowMaterial);
      iceGlow.rotation.copy(crack.rotation);
      iceGlow.position.copy(crack.position);
      iceGlow.position.y += 0.005;
      this.addGroundTextureObject(iceGlow);
    }
  }

  private addFrozenGrowths(): void {
    for (let i = 0; i < 12; i++) {
      const growthGeometry = new THREE.ConeGeometry(
        0.2 + Math.random() * 0.5,
        0.8 + Math.random() * 1.5,
        8
      );

      const growthColors = [0x223344, 0x334455, 0x112233, 0x445566];
      const growthColor =
        growthColors[Math.floor(Math.random() * growthColors.length)];

      const growthMaterial = new THREE.MeshLambertMaterial({
        color: growthColor,
        transparent: true,
        opacity: 0.7,
      });

      const growth = new THREE.Mesh(growthGeometry, growthMaterial);
      growth.position.set(
        (Math.random() - 0.5) * 160,
        0.8,
        (Math.random() - 0.5) * 160
      );
      growth.castShadow = true;
      growth.receiveShadow = true;
      this.addGroundTextureObject(growth);

      // Add ice coating
      const iceGeometry = new THREE.SphereGeometry(0.15, 8, 6);
      const iceMaterial = new THREE.MeshBasicMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.6,
      });
      const ice = new THREE.Mesh(iceGeometry, iceMaterial);
      ice.position.set(0, 0.8, 0);
      growth.add(ice);
    }
  }

  private addMetalGratingAreas(): void {
    // Add frozen metal grating sections
    for (let i = 0; i < 4; i++) {
      const gratingSize = 5 + Math.random() * 3;
      const gratingGeometry = new THREE.PlaneGeometry(gratingSize, gratingSize);
      const gratingMaterial = new THREE.MeshLambertMaterial({
        color: 0x334455,
        transparent: true,
        opacity: 0.7,
      });

      const grating = new THREE.Mesh(gratingGeometry, gratingMaterial);
      grating.rotation.x = -Math.PI / 2;
      grating.position.set(
        (Math.random() - 0.5) * 140,
        0.08,
        (Math.random() - 0.5) * 140
      );
      grating.receiveShadow = true;
      this.addGroundTextureObject(grating);

      // Add ice-covered metal bars
      const barCount = 6;
      for (let j = 0; j < barCount; j++) {
        // Horizontal bars
        const hBarGeometry = new THREE.BoxGeometry(gratingSize, 0.08, 0.15);
        const hBarMaterial = new THREE.MeshLambertMaterial({ color: 0x445566 });
        const hBar = new THREE.Mesh(hBarGeometry, hBarMaterial);
        hBar.position.set(
          0,
          0.04,
          (j - barCount / 2) * (gratingSize / barCount)
        );
        grating.add(hBar);

        // Vertical bars
        const vBarGeometry = new THREE.BoxGeometry(0.15, 0.08, gratingSize);
        const vBar = new THREE.Mesh(vBarGeometry, hBarMaterial);
        vBar.position.set(
          (j - barCount / 2) * (gratingSize / barCount),
          0.04,
          0
        );
        grating.add(vBar);
      }
    }
  }

  private addIceRunes(): void {
    for (let i = 0; i < 6; i++) {
      const runeGeometry = new THREE.RingGeometry(0.8, 2.2, 8);
      const runeMaterial = new THREE.MeshBasicMaterial({
        color: this.config.glowColor,
        transparent: true,
        opacity: 0.5,
      });

      const rune = new THREE.Mesh(runeGeometry, runeMaterial);
      rune.rotation.x = -Math.PI / 2;
      rune.position.set(
        (Math.random() - 0.5) * 130,
        0.12,
        (Math.random() - 0.5) * 130
      );
      this.addGroundTextureObject(rune);

      // Add pulsing animation
      const originalOpacity = runeMaterial.opacity;
      setInterval(() => {
        runeMaterial.opacity = originalOpacity * (0.3 + Math.random() * 0.7);
      }, 1500 + Math.random() * 2000);
    }
  }
}
