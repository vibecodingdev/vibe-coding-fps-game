import * as THREE from "three";
import { BaseSceneTheme, SceneThemeConfig } from "../core/SceneTheme";

export class ToxicTheme extends BaseSceneTheme {
  constructor(scene: THREE.Scene) {
    const config: SceneThemeConfig = {
      name: "Toxic",
      primaryColor: 0x1a2e1a, // Dark green
      secondaryColor: 0x2a4a2a, // Medium green for fog
      fogColor: 0x3a5a3a,
      ambientLightColor: 0x224422,
      directionalLightColor: 0x55bb55,
      fillLightColor: 0x44aa44,
      groundColor: 0x1a3a1a, // Dark toxic green
      skyColor: 0x2a4a2a, // Dark green sky
      glowColor: 0x66ff66,
      accentColor: 0x44dd44,
    };
    super(scene, config);
  }

  createAtmosphere(): void {
    // Add toxic, misty fog
    const fog = new THREE.Fog(this.config.fogColor, 70, 400);
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

    // Add toxic sky effects
    this.addSkyEffects();

    return sky;
  }

  private addSkyEffects(): void {
    // Add toxic spores/particles
    const particleSystem = this.createParticleSystem(250, 0x66ff66, 1.8, 0.7);
    this.scene.add(particleSystem);

    // Add distant toxic glow
    const glowGeometry = new THREE.SphereGeometry(800, 32, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x004400,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide,
    });

    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.y = -400;
    this.scene.add(glow);

    // Add toxic clouds
    this.createToxicClouds();
  }

  private createToxicClouds(): void {
    for (let i = 0; i < 4; i++) {
      const cloudGeometry = new THREE.SphereGeometry(40, 16, 12);
      const cloudMaterial = new THREE.MeshBasicMaterial({
        color: this.config.glowColor,
        transparent: true,
        opacity: 0.08,
      });

      const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
      cloud.position.set(
        (Math.random() - 0.5) * 600,
        150 + Math.random() * 50,
        (Math.random() - 0.5) * 600
      );
      cloud.scale.set(
        1 + Math.random() * 0.5,
        0.5 + Math.random() * 0.3,
        1 + Math.random() * 0.5
      );
      this.scene.add(cloud);

      // Add subtle movement
      setInterval(() => {
        cloudMaterial.opacity = 0.08 * (0.6 + Math.random() * 0.4);
        cloud.position.x += (Math.random() - 0.5) * 0.2;
        cloud.position.z += (Math.random() - 0.5) * 0.2;
      }, 3000 + Math.random() * 2000);
    }
  }

  addLighting(): void {
    // Toxic ambient light
    const ambientLight = new THREE.AmbientLight(
      this.config.ambientLightColor,
      0.65
    );
    this.scene.add(ambientLight);

    // Main directional light (sickly green sunlight)
    const directionalLight = new THREE.DirectionalLight(
      this.config.directionalLightColor,
      1.1
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
      0.55
    );
    fillLight.position.set(-30, 80, -30);
    this.scene.add(fillLight);

    // Toxic plant lights
    const toxicLights: Array<{
      pos: [number, number, number];
      color: number;
      intensity: number;
    }> = [
      { pos: [-30, 8, -30], color: 0x44bb44, intensity: 1.6 },
      { pos: [40, 12, 20], color: 0x55cc55, intensity: 1.3 },
      { pos: [-15, 6, 35], color: 0x66dd66, intensity: 1.1 },
      { pos: [25, 10, -40], color: 0x33aa33, intensity: 1.4 },
      { pos: [-45, 15, 10], color: 0x44cc44, intensity: 1.5 },
      { pos: [0, 12, 0], color: 0x55dd55, intensity: 1.9 },
      { pos: [35, 8, -35], color: 0x22bb22, intensity: 1.2 },
      { pos: [-35, 8, 35], color: 0x33cc33, intensity: 1.2 },
    ];

    toxicLights.forEach(({ pos, color, intensity }) => {
      const light = new THREE.PointLight(color, intensity, 48);
      light.position.set(pos[0], pos[1], pos[2]);
      this.scene.add(light);
    });

    // Area lighting
    this.createAreaLighting();

    // Bio-luminescent lights
    this.createBioLights();
  }

  private createAreaLighting(): void {
    const areaLights: Array<{
      pos: [number, number, number];
      color: number;
      intensity: number;
    }> = [
      { pos: [0, 25, 0], color: 0x55cc55, intensity: 1.6 },
      { pos: [-25, 20, -25], color: 0x44bb44, intensity: 1.3 },
      { pos: [25, 20, 25], color: 0x44bb44, intensity: 1.3 },
      { pos: [-25, 20, 25], color: 0x44bb44, intensity: 1.3 },
      { pos: [25, 20, -25], color: 0x44bb44, intensity: 1.3 },
    ];

    areaLights.forEach(({ pos, color, intensity }) => {
      const light = new THREE.PointLight(color, intensity, 58);
      light.position.set(pos[0], pos[1], pos[2]);
      this.scene.add(light);
    });

    // Hemisphere light for toxic atmosphere
    const hemisphereLight = new THREE.HemisphereLight(0x66aa66, 0x334433, 0.35);
    this.scene.add(hemisphereLight);
  }

  private createBioLights(): void {
    for (let i = 0; i < 14; i++) {
      const bioLight = this.createFlickeringLight(
        new THREE.Vector3(
          (Math.random() - 0.5) * 150,
          Math.random() * 7 + 2.5,
          (Math.random() - 0.5) * 150
        ),
        0x66ff66,
        1.1,
        28
      );
      this.scene.add(bioLight);
    }
  }

  addEnvironmentObjects(): void {
    this.createToxicLabs();
    this.createMutatedTrees();
    this.createToxicPools();
    this.createBioPortals();
    this.createContaminatedDebris();
    this.createToxicBarricades();
  }

  private createToxicLabs(): void {
    for (let i = 0; i < 4; i++) {
      const width = 4 + Math.random() * 6;
      const height = 8 + Math.random() * 10;
      const depth = 4 + Math.random() * 6;

      const geometry = new THREE.BoxGeometry(width, height, depth);
      const material = new THREE.MeshLambertMaterial({
        color: 0x223322,
        transparent: true,
        opacity: 0.85,
      });

      const lab = new THREE.Mesh(geometry, material);
      lab.position.set(
        (Math.random() - 0.5) * 170,
        height / 2,
        (Math.random() - 0.5) * 170
      );
      lab.rotation.y = Math.random() * Math.PI * 2;
      lab.castShadow = true;
      lab.receiveShadow = true;

      // Add toxic lab as collidable object
      this.addCollidableObject(lab, "static");
      this.addLabDetails(lab, width, height, depth);
    }
  }

  private addLabDetails(
    lab: THREE.Mesh,
    width: number,
    height: number,
    depth: number
  ): void {
    // Add glowing toxic windows
    for (let j = 0; j < 6; j++) {
      const windowGeometry = new THREE.BoxGeometry(0.7, 1.1, 0.1);
      const windowMaterial = new THREE.MeshBasicMaterial({
        color: this.config.glowColor,
        transparent: true,
        opacity: 0.75,
      });
      const window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(
        (Math.random() - 0.5) * width * 0.75,
        (Math.random() - 0.5) * height * 0.55,
        width / 2 + 0.05
      );
      lab.add(window);
    }

    // Add toxic vents
    for (let k = 0; k < 3; k++) {
      const ventGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.8, 8);
      const ventMaterial = new THREE.MeshLambertMaterial({
        color: 0x335533,
        transparent: true,
        opacity: 0.8,
      });
      const vent = new THREE.Mesh(ventGeometry, ventMaterial);
      vent.position.set(
        (Math.random() - 0.5) * width * 0.7,
        height / 2 + 0.9,
        (Math.random() - 0.5) * depth * 0.7
      );
      lab.add(vent);

      // Add toxic gas effect
      const gasGeometry = new THREE.SphereGeometry(0.3, 8, 6);
      const gasMaterial = new THREE.MeshBasicMaterial({
        color: this.config.glowColor,
        transparent: true,
        opacity: 0.4,
      });
      const gas = new THREE.Mesh(gasGeometry, gasMaterial);
      gas.position.set(0, 1.2, 0);
      vent.add(gas);

      // Add pulsing animation
      setInterval(() => {
        gasMaterial.opacity = 0.4 * (0.5 + Math.random() * 0.5);
        gas.scale.setScalar(0.8 + Math.random() * 0.4);
      }, 800 + Math.random() * 400);
    }
  }

  private createMutatedTrees(): void {
    for (let i = 0; i < 15; i++) {
      const trunkGeometry = new THREE.CylinderGeometry(0.18, 0.35, 6, 8);
      const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x2a3a2a });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);

      trunk.position.set(
        (Math.random() - 0.5) * 180,
        3,
        (Math.random() - 0.5) * 180
      );
      trunk.rotation.z = (Math.random() - 0.5) * 0.25;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      this.scene.add(trunk);

      // Add mutated branches with glowing pods
      for (let j = 0; j < 8; j++) {
        const branchGeometry = new THREE.CylinderGeometry(0.04, 0.1, 1.8, 6);
        const branch = new THREE.Mesh(branchGeometry, trunkMaterial);
        branch.position.set(
          (Math.random() - 0.5) * 0.7,
          2 + Math.random() * 2.5,
          (Math.random() - 0.5) * 0.7
        );
        branch.rotation.set(
          (Math.random() - 0.5) * Math.PI * 0.9,
          Math.random() * Math.PI * 2,
          (Math.random() - 0.5) * Math.PI * 0.9
        );
        trunk.add(branch);

        // Add glowing toxic pods
        if (Math.random() > 0.4) {
          const podGeometry = new THREE.SphereGeometry(0.15, 8, 6);
          const podMaterial = new THREE.MeshBasicMaterial({
            color: this.config.glowColor,
            transparent: true,
            opacity: 0.8,
          });
          const pod = new THREE.Mesh(podGeometry, podMaterial);
          pod.position.set(0, 0.9, 0);
          branch.add(pod);

          // Add pulsing effect
          setInterval(() => {
            podMaterial.opacity = 0.8 * (0.6 + Math.random() * 0.4);
          }, 1200 + Math.random() * 600);
        }
      }

      // Add toxic mushrooms at base
      for (let m = 0; m < 3; m++) {
        const mushroomStem = new THREE.CylinderGeometry(0.05, 0.08, 0.4, 6);
        const mushroomCap = new THREE.SphereGeometry(0.2, 8, 6);

        const mushroomMaterial = new THREE.MeshLambertMaterial({
          color: 0x445544,
          transparent: true,
          opacity: 0.9,
        });

        const stem = new THREE.Mesh(mushroomStem, mushroomMaterial);
        const cap = new THREE.Mesh(mushroomCap, mushroomMaterial);

        stem.position.set(
          (Math.random() - 0.5) * 2,
          0.2,
          (Math.random() - 0.5) * 2
        );
        cap.position.set(0, 0.4, 0);
        cap.scale.y = 0.6;

        stem.add(cap);
        trunk.add(stem);

        // Add glowing spots on mushroom cap
        const spotGeometry = new THREE.SphereGeometry(0.04, 6, 4);
        const spotMaterial = new THREE.MeshBasicMaterial({
          color: this.config.glowColor,
          transparent: true,
          opacity: 0.9,
        });

        for (let s = 0; s < 3; s++) {
          const spot = new THREE.Mesh(spotGeometry, spotMaterial);
          spot.position.set(
            (Math.random() - 0.5) * 0.3,
            0.1,
            (Math.random() - 0.5) * 0.3
          );
          cap.add(spot);
        }
      }
    }
  }

  private createToxicPools(): void {
    for (let i = 0; i < 6; i++) {
      const poolGeometry = new THREE.CircleGeometry(2 + Math.random() * 2, 12);
      const poolMaterial = new THREE.MeshBasicMaterial({
        color: this.config.glowColor,
        transparent: true,
        opacity: 0.7,
      });

      const pool = new THREE.Mesh(poolGeometry, poolMaterial);
      pool.rotation.x = -Math.PI / 2;
      pool.position.set(
        (Math.random() - 0.5) * 150,
        0.02,
        (Math.random() - 0.5) * 150
      );
      this.scene.add(pool);

      // Add bubbling effect
      for (let b = 0; b < 5; b++) {
        const bubbleGeometry = new THREE.SphereGeometry(0.1, 6, 4);
        const bubbleMaterial = new THREE.MeshBasicMaterial({
          color: this.config.glowColor,
          transparent: true,
          opacity: 0.6,
        });
        const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
        bubble.position.set(
          (Math.random() - 0.5) * 3,
          0.1,
          (Math.random() - 0.5) * 3
        );
        pool.add(bubble);

        // Add floating animation
        let time = Math.random() * Math.PI * 2;
        setInterval(() => {
          time += 0.05;
          bubble.position.y = 0.1 + Math.sin(time) * 0.05;
          bubbleMaterial.opacity = 0.6 * (0.5 + Math.sin(time * 2) * 0.5);
        }, 100);
      }

      // Add pool light
      const poolLight = new THREE.PointLight(this.config.glowColor, 1.2, 20);
      poolLight.position.copy(pool.position);
      poolLight.position.y = 1;
      this.scene.add(poolLight);
    }
  }

  private createBioPortals(): void {
    for (let i = 0; i < 2; i++) {
      const portalGeometry = new THREE.RingGeometry(1.6, 2.6, 10);
      const portalMaterial = new THREE.MeshBasicMaterial({
        color: 0x44bb44,
        transparent: true,
        opacity: 0.65,
        side: THREE.DoubleSide,
      });

      const portal = new THREE.Mesh(portalGeometry, portalMaterial);
      portal.position.set(
        (Math.random() - 0.5) * 110,
        3.8,
        (Math.random() - 0.5) * 110
      );
      portal.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.4;
      this.scene.add(portal);

      // Add organic inner structure
      const innerGeometry = new THREE.CircleGeometry(2.1, 10);
      const innerMaterial = new THREE.MeshBasicMaterial({
        color: 0x55cc55,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      });
      const inner = new THREE.Mesh(innerGeometry, innerMaterial);
      inner.position.copy(portal.position);
      inner.rotation.copy(portal.rotation);
      this.scene.add(inner);

      // Add tendrils around portal
      for (let t = 0; t < 6; t++) {
        const tendrilGeometry = new THREE.CylinderGeometry(0.05, 0.15, 1.5, 6);
        const tendrilMaterial = new THREE.MeshLambertMaterial({
          color: 0x335533,
          transparent: true,
          opacity: 0.8,
        });
        const tendril = new THREE.Mesh(tendrilGeometry, tendrilMaterial);

        const angle = (t / 6) * Math.PI * 2;
        tendril.position.set(
          portal.position.x + Math.cos(angle) * 2.8,
          portal.position.y - 1,
          portal.position.z + Math.sin(angle) * 2.8
        );
        tendril.rotation.set(
          (Math.random() - 0.5) * 0.5,
          angle,
          (Math.random() - 0.5) * 0.5
        );
        this.scene.add(tendril);
      }

      const portalLight = new THREE.PointLight(this.config.glowColor, 1.8, 28);
      portalLight.position.copy(portal.position);
      this.scene.add(portalLight);
    }
  }

  private createContaminatedDebris(): void {
    for (let i = 0; i < 8; i++) {
      const debrisGeometry = new THREE.BoxGeometry(1.6, 1.0, 1.6);
      const debrisMaterial = new THREE.MeshLambertMaterial({
        color: [0x3a4a3a, 0x2a3a2a, 0x4a5a4a][Math.floor(Math.random() * 3)],
      });

      const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
      debris.position.set(
        (Math.random() - 0.5) * 160,
        0.5,
        (Math.random() - 0.5) * 160
      );
      debris.rotation.y = Math.random() * Math.PI * 2;
      debris.rotation.z = (Math.random() - 0.5) * 0.3;
      debris.castShadow = true;
      debris.receiveShadow = true;
      this.scene.add(debris);

      // Add toxic growth/corrosion
      const corrosionGeometry = new THREE.SphereGeometry(0.3, 8, 6);
      const corrosionMaterial = new THREE.MeshBasicMaterial({
        color: this.config.glowColor,
        transparent: true,
        opacity: 0.4,
      });

      for (let c = 0; c < 3; c++) {
        const corrosion = new THREE.Mesh(corrosionGeometry, corrosionMaterial);
        corrosion.position.set(
          (Math.random() - 0.5) * 1.5,
          (Math.random() - 0.5) * 0.8,
          (Math.random() - 0.5) * 1.5
        );
        corrosion.scale.setScalar(0.5 + Math.random() * 0.5);
        debris.add(corrosion);
      }
    }
  }

  private createToxicBarricades(): void {
    for (let i = 0; i < 7; i++) {
      const barrierGeometry = new THREE.BoxGeometry(4.8, 1.4, 0.35);
      const barrierMaterial = new THREE.MeshLambertMaterial({
        color: 0x334433,
      });
      const barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);

      barrier.position.set(
        (Math.random() - 0.5) * 145,
        0.7,
        (Math.random() - 0.5) * 145
      );
      barrier.rotation.y = Math.random() * Math.PI * 2;
      barrier.rotation.z = (Math.random() - 0.5) * 0.25;
      barrier.castShadow = true;
      barrier.receiveShadow = true;
      this.scene.add(barrier);

      // Add toxic thorns
      for (let j = 0; j < 4; j++) {
        const thornGeometry = new THREE.ConeGeometry(0.06, 0.5, 6);
        const thornMaterial = new THREE.MeshLambertMaterial({
          color: 0x225522,
          transparent: true,
          opacity: 0.9,
        });
        const thorn = new THREE.Mesh(thornGeometry, thornMaterial);
        thorn.position.set((j - 1.5) * 1.0, 1.0, 0);
        thorn.rotation.x = (Math.random() - 0.5) * 0.3;
        barrier.add(thorn);

        // Add glowing tip
        const tipGeometry = new THREE.SphereGeometry(0.03, 6, 4);
        const tipMaterial = new THREE.MeshBasicMaterial({
          color: this.config.glowColor,
          transparent: true,
          opacity: 0.8,
        });
        const tip = new THREE.Mesh(tipGeometry, tipMaterial);
        tip.position.set(0, 0.25, 0);
        thorn.add(tip);
      }

      // Add creeping vines
      for (let v = 0; v < 3; v++) {
        const vineGeometry = new THREE.CylinderGeometry(0.03, 0.06, 0.8, 6);
        const vineMaterial = new THREE.MeshLambertMaterial({
          color: 0x446644,
          transparent: true,
          opacity: 0.8,
        });
        const vine = new THREE.Mesh(vineGeometry, vineMaterial);
        vine.position.set(
          (Math.random() - 0.5) * 4,
          0.4,
          (Math.random() - 0.5) * 0.3
        );
        vine.rotation.set(
          (Math.random() - 0.5) * Math.PI * 0.3,
          Math.random() * Math.PI * 2,
          (Math.random() - 0.5) * Math.PI * 0.5
        );
        barrier.add(vine);
      }
    }
  }

  addGroundDetails(): void {
    this.addToxicStains();
    this.addMoldTilePattern();
    this.addToxicDebris();
    this.addToxicCracks();
    this.addMutatedGrowths();
    this.addMetalGratingAreas();
    this.addBioRunes();
  }

  private addToxicStains(): void {
    // Large toxic spills
    for (let i = 0; i < 18; i++) {
      const stainGeometry = new THREE.CircleGeometry(
        Math.random() * 3.5 + 1.5,
        14
      );
      const stainMaterial = new THREE.MeshBasicMaterial({
        color: [0x446644, 0x556655, 0x335533, 0x667766][
          Math.floor(Math.random() * 4)
        ],
        transparent: true,
        opacity: 0.5 + Math.random() * 0.3,
      });

      const stain = new THREE.Mesh(stainGeometry, stainMaterial);
      stain.rotation.x = -Math.PI / 2;
      stain.position.set(
        (Math.random() - 0.5) * 180,
        0.015 + Math.random() * 0.02,
        (Math.random() - 0.5) * 180
      );
      this.addGroundTextureObject(stain);
    }
  }

  private addToxicDebris(): void {
    for (let i = 0; i < 15; i++) {
      const debrisGeometry = new THREE.BoxGeometry(
        Math.random() * 1.0 + 0.4,
        Math.random() * 0.5 + 0.2,
        Math.random() * 1.0 + 0.4
      );
      const debrisColors = [0x3a4a3a, 0x2a3a2a, 0x4a5a4a, 0x5a6a5a, 0x1a3a2a];
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

      // Add toxic growth
      if (Math.random() > 0.6) {
        const growthGeometry = new THREE.SphereGeometry(0.1, 6, 4);
        const growthMaterial = new THREE.MeshBasicMaterial({
          color: this.config.glowColor,
          transparent: true,
          opacity: 0.5,
        });
        const growth = new THREE.Mesh(growthGeometry, growthMaterial);
        growth.position.set(
          (Math.random() - 0.5) * 0.8,
          0.1,
          (Math.random() - 0.5) * 0.8
        );
        debris.add(growth);
      }
    }
  }

  private addMoldTilePattern(): void {
    const tileSize = 4;
    const tilesPerSide = 16;

    for (let x = 0; x < tilesPerSide; x++) {
      for (let z = 0; z < tilesPerSide; z++) {
        if (Math.random() > 0.7) continue;

        const tileGeometry = new THREE.PlaneGeometry(
          tileSize * (0.9 + Math.random() * 0.2),
          tileSize * (0.9 + Math.random() * 0.2)
        );

        const tileColors = [0x3a4a3a, 0x4a5a4a, 0x2a3a2a, 0x5a6a5a];
        const tileColor =
          tileColors[Math.floor(Math.random() * tileColors.length)];

        const tileMaterial = new THREE.MeshLambertMaterial({
          color: tileColor,
          transparent: true,
          opacity: 0.75,
        });

        const tile = new THREE.Mesh(tileGeometry, tileMaterial);
        tile.rotation.x = -Math.PI / 2;
        tile.position.set(
          (x - tilesPerSide / 2) * tileSize,
          0.008,
          (z - tilesPerSide / 2) * tileSize
        );
        tile.receiveShadow = true;
        this.addGroundTextureObject(tile);

        // Add mold growth
        if (Math.random() > 0.6) {
          const moldGeometry = new THREE.CircleGeometry(
            0.3 + Math.random() * 0.4,
            8
          );
          const moldMaterial = new THREE.MeshBasicMaterial({
            color: this.config.glowColor,
            transparent: true,
            opacity: 0.3,
          });
          const mold = new THREE.Mesh(moldGeometry, moldMaterial);
          mold.rotation.x = -Math.PI / 2;
          mold.position.set(
            (Math.random() - 0.5) * tileSize * 0.8,
            0.001,
            (Math.random() - 0.5) * tileSize * 0.8
          );
          tile.add(mold);
        }
      }
    }
  }

  private addToxicCracks(): void {
    for (let i = 0; i < 7; i++) {
      const crackLength = 9 + Math.random() * 14;
      const crackWidth = 0.4 + Math.random() * 0.8;

      const crackGeometry = new THREE.PlaneGeometry(crackLength, crackWidth);
      const crackMaterial = new THREE.MeshBasicMaterial({
        color: 0x001100,
        transparent: true,
        opacity: 0.85,
      });

      const crack = new THREE.Mesh(crackGeometry, crackMaterial);
      crack.rotation.x = -Math.PI / 2;
      crack.rotation.z = Math.random() * Math.PI * 2;
      crack.position.set(
        (Math.random() - 0.5) * 155,
        0.06,
        (Math.random() - 0.5) * 155
      );
      this.addGroundTextureObject(crack);

      // Add toxic ooze in cracks
      const oozeGeometry = new THREE.PlaneGeometry(
        crackLength * 0.75,
        crackWidth * 0.6
      );
      const oozeMaterial = new THREE.MeshBasicMaterial({
        color: this.config.glowColor,
        transparent: true,
        opacity: 0.6,
      });

      const ooze = new THREE.Mesh(oozeGeometry, oozeMaterial);
      ooze.rotation.copy(crack.rotation);
      ooze.position.copy(crack.position);
      ooze.position.y += 0.008;
      this.addGroundTextureObject(ooze);

      // Add pulsing effect
      setInterval(() => {
        oozeMaterial.opacity = 0.6 * (0.4 + Math.random() * 0.6);
      }, 1800 + Math.random() * 1200);
    }
  }

  private addMutatedGrowths(): void {
    for (let i = 0; i < 20; i++) {
      const growthGeometry = new THREE.ConeGeometry(
        0.25 + Math.random() * 0.6,
        1.2 + Math.random() * 1.8,
        8
      );

      const growthColors = [0x334433, 0x445544, 0x223322, 0x556655];
      const growthColor =
        growthColors[Math.floor(Math.random() * growthColors.length)];

      const growthMaterial = new THREE.MeshLambertMaterial({
        color: growthColor,
        transparent: true,
        opacity: 0.85,
      });

      const growth = new THREE.Mesh(growthGeometry, growthMaterial);
      growth.position.set(
        (Math.random() - 0.5) * 165,
        1.2,
        (Math.random() - 0.5) * 165
      );
      growth.rotation.z = (Math.random() - 0.5) * 0.3;
      growth.castShadow = true;
      growth.receiveShadow = true;
      this.addGroundTextureObject(growth);

      // Add glowing spots
      for (let s = 0; s < 3; s++) {
        const spotGeometry = new THREE.SphereGeometry(0.08, 6, 4);
        const spotMaterial = new THREE.MeshBasicMaterial({
          color: this.config.glowColor,
          transparent: true,
          opacity: 0.7,
        });
        const spot = new THREE.Mesh(spotGeometry, spotMaterial);
        spot.position.set(
          (Math.random() - 0.5) * 0.4,
          0.5 + Math.random() * 0.8,
          (Math.random() - 0.5) * 0.4
        );
        growth.add(spot);
      }
    }
  }

  private addMetalGratingAreas(): void {
    // Add corroded metal grating sections
    for (let i = 0; i < 5; i++) {
      const gratingSize = 5.5 + Math.random() * 3.5;
      const gratingGeometry = new THREE.PlaneGeometry(gratingSize, gratingSize);
      const gratingMaterial = new THREE.MeshLambertMaterial({
        color: 0x445544,
        transparent: true,
        opacity: 0.75,
      });

      const grating = new THREE.Mesh(gratingGeometry, gratingMaterial);
      grating.rotation.x = -Math.PI / 2;
      grating.position.set(
        (Math.random() - 0.5) * 145,
        0.09,
        (Math.random() - 0.5) * 145
      );
      grating.receiveShadow = true;
      this.addGroundTextureObject(grating);

      // Add corroded metal bars with toxic growth
      const barCount = 7;
      for (let j = 0; j < barCount; j++) {
        // Horizontal bars
        const hBarGeometry = new THREE.BoxGeometry(gratingSize, 0.09, 0.18);
        const hBarMaterial = new THREE.MeshLambertMaterial({ color: 0x556655 });
        const hBar = new THREE.Mesh(hBarGeometry, hBarMaterial);
        hBar.position.set(
          0,
          0.045,
          (j - barCount / 2) * (gratingSize / barCount)
        );
        grating.add(hBar);

        // Vertical bars
        const vBarGeometry = new THREE.BoxGeometry(0.18, 0.09, gratingSize);
        const vBar = new THREE.Mesh(vBarGeometry, hBarMaterial);
        vBar.position.set(
          (j - barCount / 2) * (gratingSize / barCount),
          0.045,
          0
        );
        grating.add(vBar);

        // Add toxic corrosion
        if (Math.random() > 0.5) {
          const corrosionGeometry = new THREE.SphereGeometry(0.1, 6, 4);
          const corrosionMaterial = new THREE.MeshBasicMaterial({
            color: this.config.glowColor,
            transparent: true,
            opacity: 0.5,
          });
          const corrosion = new THREE.Mesh(
            corrosionGeometry,
            corrosionMaterial
          );
          corrosion.position.set(0, 0.08, 0);
          corrosion.scale.setScalar(0.6 + Math.random() * 0.4);
          hBar.add(corrosion);
        }
      }
    }
  }

  private addBioRunes(): void {
    for (let i = 0; i < 7; i++) {
      const runeGeometry = new THREE.RingGeometry(0.9, 2.4, 10);
      const runeMaterial = new THREE.MeshBasicMaterial({
        color: this.config.glowColor,
        transparent: true,
        opacity: 0.55,
      });

      const rune = new THREE.Mesh(runeGeometry, runeMaterial);
      rune.rotation.x = -Math.PI / 2;
      rune.position.set(
        (Math.random() - 0.5) * 135,
        0.13,
        (Math.random() - 0.5) * 135
      );
      this.addGroundTextureObject(rune);

      // Add organic inner pattern
      const innerGeometry = new THREE.CircleGeometry(1.6, 10);
      const innerMaterial = new THREE.MeshBasicMaterial({
        color: this.config.glowColor,
        transparent: true,
        opacity: 0.25,
      });
      const inner = new THREE.Mesh(innerGeometry, innerMaterial);
      inner.rotation.x = -Math.PI / 2;
      inner.position.copy(rune.position);
      inner.position.y += 0.005;
      this.addGroundTextureObject(inner);

      // Add pulsing animation
      const originalOpacity = runeMaterial.opacity;
      setInterval(() => {
        runeMaterial.opacity = originalOpacity * (0.4 + Math.random() * 0.6);
        innerMaterial.opacity = 0.25 * (0.3 + Math.random() * 0.7);
      }, 2200 + Math.random() * 1800);
    }
  }
}
