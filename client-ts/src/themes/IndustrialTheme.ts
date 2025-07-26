import * as THREE from "three";
import { BaseSceneTheme, SceneThemeConfig } from "../core/SceneTheme";

export class IndustrialTheme extends BaseSceneTheme {
  constructor(scene: THREE.Scene) {
    const config: SceneThemeConfig = {
      name: "Industrial",
      primaryColor: 0x404040, // Medium gray
      secondaryColor: 0x606060, // Light gray for fog
      fogColor: 0x707070,
      ambientLightColor: 0x666666,
      directionalLightColor: 0xffffff,
      fillLightColor: 0xe6e6e6,
      groundColor: 0x505050, // Dark gray metal
      skyColor: 0x808080, // Light gray sky
      glowColor: 0x00ccff,
      accentColor: 0x0099cc,
    };
    super(scene, config);
  }

  createAtmosphere(): void {
    // Add industrial haze
    const fog = new THREE.Fog(this.config.fogColor, 120, 500);
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

    // Add industrial sky effects
    this.addSkyEffects();

    return sky;
  }

  private addSkyEffects(): void {
    // Add steam/vapor particles
    const particleSystem = this.createParticleSystem(180, 0xcccccc, 2.2, 0.6);
    this.scene.add(particleSystem);

    // Add distant industrial glow
    const glowGeometry = new THREE.SphereGeometry(800, 32, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x444444,
      transparent: true,
      opacity: 0.06,
      side: THREE.BackSide,
    });

    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.y = -400;
    this.scene.add(glow);

    // Add industrial smokestacks in distance
    this.createDistantSmokeStacks();
  }

  private createDistantSmokeStacks(): void {
    for (let i = 0; i < 6; i++) {
      const stackGeometry = new THREE.CylinderGeometry(8, 12, 120, 12);
      const stackMaterial = new THREE.MeshBasicMaterial({
        color: 0x606060,
        transparent: true,
        opacity: 0.15,
      });

      const stack = new THREE.Mesh(stackGeometry, stackMaterial);
      stack.position.set(
        (Math.random() - 0.5) * 1200,
        60,
        (Math.random() - 0.5) * 1200
      );
      this.scene.add(stack);

      // Add smoke effect
      const smokeGeometry = new THREE.SphereGeometry(15, 12, 8);
      const smokeMaterial = new THREE.MeshBasicMaterial({
        color: 0x999999,
        transparent: true,
        opacity: 0.1,
      });

      for (let s = 0; s < 3; s++) {
        const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
        smoke.position.set(
          stack.position.x + (Math.random() - 0.5) * 30,
          stack.position.y + 60 + s * 20,
          stack.position.z + (Math.random() - 0.5) * 30
        );
        smoke.scale.setScalar(1 + s * 0.3);
        this.scene.add(smoke);

        // Add drift animation
        setInterval(() => {
          smoke.position.x += (Math.random() - 0.5) * 0.5;
          smoke.position.z += (Math.random() - 0.5) * 0.5;
          smokeMaterial.opacity = 0.1 * (0.5 + Math.random() * 0.5);
        }, 4000 + Math.random() * 2000);
      }
    }
  }

  addLighting(): void {
    // Bright industrial ambient light
    const ambientLight = new THREE.AmbientLight(
      this.config.ambientLightColor,
      0.8
    );
    this.scene.add(ambientLight);

    // Main directional light (bright white)
    const directionalLight = new THREE.DirectionalLight(
      this.config.directionalLightColor,
      1.4
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
      0.7
    );
    fillLight.position.set(-30, 80, -30);
    this.scene.add(fillLight);

    // Industrial facility lights
    const facilityLights: Array<{
      pos: [number, number, number];
      color: number;
      intensity: number;
    }> = [
      { pos: [-30, 12, -30], color: 0xffffff, intensity: 2.0 },
      { pos: [40, 15, 20], color: 0xe6e6e6, intensity: 1.8 },
      { pos: [-15, 10, 35], color: 0xffffff, intensity: 1.6 },
      { pos: [25, 14, -40], color: 0xcccccc, intensity: 1.9 },
      { pos: [-45, 18, 10], color: 0xffffff, intensity: 2.1 },
      { pos: [0, 16, 0], color: 0xffffff, intensity: 2.4 },
      { pos: [35, 12, -35], color: 0xe6e6e6, intensity: 1.7 },
      { pos: [-35, 12, 35], color: 0xe6e6e6, intensity: 1.7 },
    ];

    facilityLights.forEach(({ pos, color, intensity }) => {
      const light = new THREE.PointLight(color, intensity, 65);
      light.position.set(pos[0], pos[1], pos[2]);
      this.scene.add(light);
    });

    // Area lighting
    this.createAreaLighting();

    // Status indicator lights
    this.createStatusLights();
  }

  private createAreaLighting(): void {
    const areaLights: Array<{
      pos: [number, number, number];
      color: number;
      intensity: number;
    }> = [
      { pos: [0, 30, 0], color: 0xffffff, intensity: 2.2 },
      { pos: [-25, 25, -25], color: 0xe6e6e6, intensity: 1.8 },
      { pos: [25, 25, 25], color: 0xe6e6e6, intensity: 1.8 },
      { pos: [-25, 25, 25], color: 0xe6e6e6, intensity: 1.8 },
      { pos: [25, 25, -25], color: 0xe6e6e6, intensity: 1.8 },
    ];

    areaLights.forEach(({ pos, color, intensity }) => {
      const light = new THREE.PointLight(color, intensity, 70);
      light.position.set(pos[0], pos[1], pos[2]);
      this.scene.add(light);
    });

    // Hemisphere light for clean atmosphere
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x666666, 0.4);
    this.scene.add(hemisphereLight);
  }

  private createStatusLights(): void {
    // Status indicator lights - blue blinking
    for (let i = 0; i < 8; i++) {
      const statusLight = new THREE.PointLight(this.config.glowColor, 0.8, 20);
      statusLight.position.set(
        (Math.random() - 0.5) * 150,
        Math.random() * 8 + 4,
        (Math.random() - 0.5) * 150
      );
      this.scene.add(statusLight);

      // Add blinking animation
      const originalIntensity = statusLight.intensity;
      let blinkState = true;
      setInterval(() => {
        blinkState = !blinkState;
        statusLight.intensity = blinkState ? originalIntensity : 0.1;
      }, 1000 + Math.random() * 2000);
    }
  }

  addEnvironmentObjects(): void {
    this.createIndustrialFacilities();
    this.createMetalStructures();
    this.createMachinery();
    this.createEnergyPortals();
    this.createIndustrialDebris();
    this.createSecurityBarriers();
  }

  private createIndustrialFacilities(): void {
    for (let i = 0; i < 5; i++) {
      const width = 5 + Math.random() * 7;
      const height = 15 + Math.random() * 18;
      const depth = 5 + Math.random() * 7;

      const geometry = new THREE.BoxGeometry(width, height, depth);
      const material = new THREE.MeshLambertMaterial({
        color: 0x888888,
        transparent: true,
        opacity: 0.9,
      });

      const facility = new THREE.Mesh(geometry, material);
      facility.position.set(
        (Math.random() - 0.5) * 170,
        height / 2,
        (Math.random() - 0.5) * 170
      );
      facility.rotation.y = Math.random() * Math.PI * 2;
      facility.castShadow = true;
      facility.receiveShadow = true;

      this.scene.add(facility);
      this.addFacilityDetails(facility, width, height, depth);
    }
  }

  private addFacilityDetails(
    facility: THREE.Mesh,
    width: number,
    height: number,
    depth: number
  ): void {
    // Add glowing windows/screens
    for (let j = 0; j < 10; j++) {
      const windowGeometry = new THREE.BoxGeometry(0.8, 1.0, 0.05);
      const windowMaterial = new THREE.MeshBasicMaterial({
        color: this.config.glowColor,
        transparent: true,
        opacity: 0.9,
      });
      const window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(
        (Math.random() - 0.5) * width * 0.8,
        (Math.random() - 0.5) * height * 0.7,
        width / 2 + 0.025
      );
      facility.add(window);
    }

    // Add ventilation systems
    for (let k = 0; k < 4; k++) {
      const ventGeometry = new THREE.BoxGeometry(1.2, 0.6, 1.2);
      const ventMaterial = new THREE.MeshLambertMaterial({
        color: 0x666666,
        transparent: true,
        opacity: 0.9,
      });
      const vent = new THREE.Mesh(ventGeometry, ventMaterial);
      vent.position.set(
        (Math.random() - 0.5) * width * 0.8,
        height / 2 + 0.3,
        (Math.random() - 0.5) * depth * 0.8
      );
      facility.add(vent);

      // Add fan blades
      const fanGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 8);
      const fanMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
      const fan = new THREE.Mesh(fanGeometry, fanMaterial);
      fan.position.set(0, 0.35, 0);
      fan.rotation.x = Math.PI / 2;
      vent.add(fan);

      // Add rotation animation
      setInterval(() => {
        fan.rotation.z += 0.2;
      }, 100);
    }

    // Add antenna/communications
    for (let a = 0; a < 2; a++) {
      const antennaGeometry = new THREE.CylinderGeometry(0.05, 0.05, 3, 8);
      const antennaMaterial = new THREE.MeshLambertMaterial({
        color: 0x999999,
      });
      const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
      antenna.position.set(
        (Math.random() - 0.5) * width * 0.6,
        height / 2 + 1.5,
        (Math.random() - 0.5) * depth * 0.6
      );
      facility.add(antenna);

      // Add blinking communication light
      const commLightGeometry = new THREE.SphereGeometry(0.1, 8, 6);
      const commLightMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 1.0,
      });
      const commLight = new THREE.Mesh(commLightGeometry, commLightMaterial);
      commLight.position.set(0, 1.5, 0);
      antenna.add(commLight);

      // Add blinking animation
      setInterval(() => {
        commLightMaterial.opacity = commLightMaterial.opacity > 0.5 ? 0.2 : 1.0;
      }, 800 + Math.random() * 400);
    }
  }

  private createMetalStructures(): void {
    for (let i = 0; i < 8; i++) {
      const baseGeometry = new THREE.CylinderGeometry(2, 3, 1.5, 8);
      const baseMaterial = new THREE.MeshLambertMaterial({
        color: 0x777777,
        transparent: true,
        opacity: 0.9,
      });
      const base = new THREE.Mesh(baseGeometry, baseMaterial);

      base.position.set(
        (Math.random() - 0.5) * 160,
        0.75,
        (Math.random() - 0.5) * 160
      );
      base.castShadow = true;
      base.receiveShadow = true;
      this.scene.add(base);

      // Add control panel
      const panelGeometry = new THREE.BoxGeometry(1.5, 2, 0.3);
      const panelMaterial = new THREE.MeshLambertMaterial({
        color: 0x999999,
        transparent: true,
        opacity: 0.9,
      });
      const panel = new THREE.Mesh(panelGeometry, panelMaterial);
      panel.position.set(0, 2.25, 0);
      base.add(panel);

      // Add status indicators
      for (let s = 0; s < 6; s++) {
        const indicatorGeometry = new THREE.SphereGeometry(0.05, 8, 6);
        const colors = [0x00ff00, 0xff0000, 0x0000ff, 0xffff00];
        const indicatorColor =
          colors[Math.floor(Math.random() * colors.length)];
        const indicatorMaterial = new THREE.MeshBasicMaterial({
          color: indicatorColor,
          transparent: true,
          opacity: 0.9,
        });
        const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
        indicator.position.set(
          ((s % 3) - 1) * 0.3,
          (Math.floor(s / 3) - 0.5) * 0.4,
          0.16
        );
        panel.add(indicator);

        // Add random blinking
        if (Math.random() > 0.5) {
          setInterval(() => {
            indicatorMaterial.opacity =
              indicatorMaterial.opacity > 0.5 ? 0.2 : 0.9;
          }, 500 + Math.random() * 1500);
        }
      }

      // Add holographic display
      const holoGeometry = new THREE.PlaneGeometry(1.0, 0.8);
      const holoMaterial = new THREE.MeshBasicMaterial({
        color: this.config.glowColor,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      });
      const holo = new THREE.Mesh(holoGeometry, holoMaterial);
      holo.position.set(0, 3.5, 0);
      holo.rotation.x = -Math.PI / 6;
      base.add(holo);

      // Add hologram animation
      setInterval(() => {
        holoMaterial.opacity = 0.3 * (0.6 + Math.random() * 0.4);
        holo.rotation.y += 0.05;
      }, 200);
    }
  }

  private createMachinery(): void {
    for (let i = 0; i < 10; i++) {
      const machineGeometry = new THREE.BoxGeometry(
        2 + Math.random() * 2,
        1.5 + Math.random() * 1,
        2 + Math.random() * 2
      );
      const machineMaterial = new THREE.MeshLambertMaterial({
        color: 0x666666,
      });
      const machine = new THREE.Mesh(machineGeometry, machineMaterial);

      machine.position.set(
        (Math.random() - 0.5) * 180,
        machine.geometry.parameters.height / 2,
        (Math.random() - 0.5) * 180
      );
      machine.rotation.y = Math.random() * Math.PI * 2;
      machine.castShadow = true;
      machine.receiveShadow = true;
      this.scene.add(machine);

      // Add pipes
      for (let p = 0; p < 3; p++) {
        const pipeGeometry = new THREE.CylinderGeometry(0.08, 0.08, 1.5, 8);
        const pipeMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        const pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
        pipe.position.set(
          (Math.random() - 0.5) * 1.5,
          0.75,
          (Math.random() - 0.5) * 1.5
        );
        pipe.rotation.z = (Math.random() - 0.5) * Math.PI;
        machine.add(pipe);
      }

      // Add warning lights
      const warningGeometry = new THREE.SphereGeometry(0.08, 8, 6);
      const warningMaterial = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.8,
      });
      const warning = new THREE.Mesh(warningGeometry, warningMaterial);
      warning.position.set(0, machine.geometry.parameters.height / 2 + 0.1, 0);
      machine.add(warning);

      // Add warning light animation
      setInterval(() => {
        warningMaterial.opacity = warningMaterial.opacity > 0.4 ? 0.1 : 0.8;
      }, 1200 + Math.random() * 800);
    }
  }

  private createEnergyPortals(): void {
    for (let i = 0; i < 2; i++) {
      const portalGeometry = new THREE.RingGeometry(1.5, 2.5, 16);
      const portalMaterial = new THREE.MeshBasicMaterial({
        color: this.config.glowColor,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
      });

      const portal = new THREE.Mesh(portalGeometry, portalMaterial);
      portal.position.set(
        (Math.random() - 0.5) * 100,
        4,
        (Math.random() - 0.5) * 100
      );
      portal.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.2;
      this.scene.add(portal);

      // Add energy field
      const fieldGeometry = new THREE.CircleGeometry(2.0, 16);
      const fieldMaterial = new THREE.MeshBasicMaterial({
        color: this.config.glowColor,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
      });
      const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
      field.position.copy(portal.position);
      field.rotation.copy(portal.rotation);
      this.scene.add(field);

      // Add containment rings
      for (let r = 0; r < 3; r++) {
        const ringGeometry = new THREE.TorusGeometry(2.8 + r * 0.5, 0.1, 8, 16);
        const ringMaterial = new THREE.MeshLambertMaterial({
          color: 0xaaaaaa,
          transparent: true,
          opacity: 0.8,
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(portal.position);
        ring.rotation.x = portal.rotation.x;
        this.scene.add(ring);

        // Add rotation animation
        setInterval(() => {
          ring.rotation.z += 0.01 * (r + 1);
        }, 50);
      }

      const portalLight = new THREE.PointLight(this.config.glowColor, 2.5, 35);
      portalLight.position.copy(portal.position);
      this.scene.add(portalLight);

      // Add energy pulse animation
      setInterval(() => {
        portalMaterial.opacity = 0.8 * (0.7 + Math.random() * 0.3);
        fieldMaterial.opacity = 0.2 * (0.5 + Math.random() * 0.5);
        portalLight.intensity = 2.5 * (0.8 + Math.random() * 0.4);
      }, 300 + Math.random() * 200);
    }
  }

  private createIndustrialDebris(): void {
    for (let i = 0; i < 6; i++) {
      const debrisGeometry = new THREE.BoxGeometry(2.2, 1.4, 2.2);
      const debrisMaterial = new THREE.MeshLambertMaterial({
        color: [0x777777, 0x666666, 0x888888][Math.floor(Math.random() * 3)],
      });

      const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
      debris.position.set(
        (Math.random() - 0.5) * 150,
        0.7,
        (Math.random() - 0.5) * 150
      );
      debris.rotation.y = Math.random() * Math.PI * 2;
      debris.rotation.z = (Math.random() - 0.5) * 0.2;
      debris.castShadow = true;
      debris.receiveShadow = true;
      this.scene.add(debris);

      // Add scratches and wear marks
      for (let w = 0; w < 4; w++) {
        const wearGeometry = new THREE.PlaneGeometry(0.5, 0.1);
        const wearMaterial = new THREE.MeshBasicMaterial({
          color: 0x333333,
          transparent: true,
          opacity: 0.6,
        });
        const wear = new THREE.Mesh(wearGeometry, wearMaterial);
        wear.position.set(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 1.2,
          1.11
        );
        wear.rotation.z = Math.random() * Math.PI * 2;
        debris.add(wear);
      }
    }
  }

  private createSecurityBarriers(): void {
    for (let i = 0; i < 6; i++) {
      const barrierGeometry = new THREE.BoxGeometry(5.5, 1.8, 0.4);
      const barrierMaterial = new THREE.MeshLambertMaterial({
        color: 0x999999,
      });
      const barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);

      barrier.position.set(
        (Math.random() - 0.5) * 140,
        0.9,
        (Math.random() - 0.5) * 140
      );
      barrier.rotation.y = Math.random() * Math.PI * 2;
      barrier.castShadow = true;
      barrier.receiveShadow = true;
      this.scene.add(barrier);

      // Add warning stripes
      for (let s = 0; s < 8; s++) {
        const stripeGeometry = new THREE.BoxGeometry(0.3, 1.8, 0.02);
        const stripeColor = s % 2 === 0 ? 0xffff00 : 0x000000;
        const stripeMaterial = new THREE.MeshBasicMaterial({
          color: stripeColor,
          transparent: true,
          opacity: 0.8,
        });
        const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
        stripe.position.set((s - 4) * 0.6, 0, 0.21);
        barrier.add(stripe);
      }

      // Add security scanners
      for (let sc = 0; sc < 2; sc++) {
        const scannerGeometry = new THREE.SphereGeometry(0.1, 8, 6);
        const scannerMaterial = new THREE.MeshBasicMaterial({
          color: 0xff0000,
          transparent: true,
          opacity: 0.9,
        });
        const scanner = new THREE.Mesh(scannerGeometry, scannerMaterial);
        scanner.position.set((sc - 0.5) * 4, 1.2, 0);
        barrier.add(scanner);

        // Add scanning animation
        setInterval(() => {
          scannerMaterial.opacity = scannerMaterial.opacity > 0.5 ? 0.2 : 0.9;
        }, 600 + Math.random() * 400);
      }
    }
  }

  addGroundDetails(): void {
    this.addMetalPanels();
    this.addIndustrialTilePattern();
    this.addMechanicalDebris();
    this.addServiceConduits();
    this.addHolographicMarkers();
    this.addMetalGratingAreas();
    this.addTechRunes();
  }

  private addMetalPanels(): void {
    // Large metal floor panels
    for (let i = 0; i < 25; i++) {
      const panelGeometry = new THREE.PlaneGeometry(
        4 + Math.random() * 2,
        4 + Math.random() * 2
      );
      const panelMaterial = new THREE.MeshLambertMaterial({
        color: [0x888888, 0x999999, 0x777777, 0xaaaaaa][
          Math.floor(Math.random() * 4)
        ],
        transparent: true,
        opacity: 0.8,
      });

      const panel = new THREE.Mesh(panelGeometry, panelMaterial);
      panel.rotation.x = -Math.PI / 2;
      panel.position.set(
        (Math.random() - 0.5) * 180,
        0.005 + Math.random() * 0.01,
        (Math.random() - 0.5) * 180
      );
      this.addGroundTextureObject(panel);

      // Add panel seams
      const seamGeometry = new THREE.PlaneGeometry(
        panelGeometry.parameters.width + 0.1,
        0.05
      );
      const seamMaterial = new THREE.MeshBasicMaterial({
        color: 0x444444,
        transparent: true,
        opacity: 0.7,
      });

      for (let s = 0; s < 2; s++) {
        const seam = new THREE.Mesh(seamGeometry, seamMaterial);
        seam.rotation.x = -Math.PI / 2;
        seam.rotation.z = (s * Math.PI) / 2;
        seam.position.copy(panel.position);
        seam.position.y += 0.001;
        this.addGroundTextureObject(seam);
      }
    }
  }

  private addIndustrialTilePattern(): void {
    const tileSize = 3;
    const tilesPerSide = 24;

    for (let x = 0; x < tilesPerSide; x++) {
      for (let z = 0; z < tilesPerSide; z++) {
        if (Math.random() > 0.6) continue;

        const tileGeometry = new THREE.PlaneGeometry(
          tileSize * (0.95 + Math.random() * 0.1),
          tileSize * (0.95 + Math.random() * 0.1)
        );

        const tileColors = [0x777777, 0x888888, 0x666666, 0x999999];
        const tileColor =
          tileColors[Math.floor(Math.random() * tileColors.length)];

        const tileMaterial = new THREE.MeshLambertMaterial({
          color: tileColor,
          transparent: true,
          opacity: 0.85,
        });

        const tile = new THREE.Mesh(tileGeometry, tileMaterial);
        tile.rotation.x = -Math.PI / 2;
        tile.position.set(
          (x - tilesPerSide / 2) * tileSize,
          0.002,
          (z - tilesPerSide / 2) * tileSize
        );
        tile.receiveShadow = true;
        this.addGroundTextureObject(tile);
      }
    }
  }

  private addMechanicalDebris(): void {
    for (let i = 0; i < 18; i++) {
      const debrisGeometry = new THREE.BoxGeometry(
        Math.random() * 1.0 + 0.3,
        Math.random() * 0.4 + 0.1,
        Math.random() * 1.0 + 0.3
      );
      const debrisColors = [0x666666, 0x777777, 0x555555, 0x888888, 0x999999];
      const debrisColor =
        debrisColors[Math.floor(Math.random() * debrisColors.length)];

      const debrisMaterial = new THREE.MeshLambertMaterial({
        color: debrisColor,
      });
      const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
      debris.position.set(
        (Math.random() - 0.5) * 170,
        Math.random() * 0.15,
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

  private addServiceConduits(): void {
    for (let i = 0; i < 8; i++) {
      const conduitLength = 12 + Math.random() * 8;
      const conduitGeometry = new THREE.CylinderGeometry(
        0.15,
        0.15,
        conduitLength,
        8
      );
      const conduitMaterial = new THREE.MeshLambertMaterial({
        color: 0x666666,
        transparent: true,
        opacity: 0.9,
      });

      const conduit = new THREE.Mesh(conduitGeometry, conduitMaterial);
      conduit.rotation.z = Math.PI / 2;
      conduit.rotation.y = Math.random() * Math.PI * 2;
      conduit.position.set(
        (Math.random() - 0.5) * 160,
        0.15,
        (Math.random() - 0.5) * 160
      );
      this.addGroundTextureObject(conduit);

      // Add junction boxes
      for (let j = 0; j < 3; j++) {
        const junctionGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.4);
        const junctionMaterial = new THREE.MeshLambertMaterial({
          color: 0x555555,
        });
        const junction = new THREE.Mesh(junctionGeometry, junctionMaterial);
        junction.position.set((j - 1) * (conduitLength / 3), 0, 0);
        conduit.add(junction);
      }
    }
  }

  private addHolographicMarkers(): void {
    for (let i = 0; i < 12; i++) {
      const markerGeometry = new THREE.CircleGeometry(0.5, 8);
      const markerMaterial = new THREE.MeshBasicMaterial({
        color: this.config.glowColor,
        transparent: true,
        opacity: 0.4,
      });

      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.rotation.x = -Math.PI / 2;
      marker.position.set(
        (Math.random() - 0.5) * 150,
        0.05,
        (Math.random() - 0.5) * 150
      );
      this.addGroundTextureObject(marker);

      // Add text/symbols (simplified as geometric shapes)
      const symbolGeometry = new THREE.RingGeometry(0.3, 0.4, 6);
      const symbolMaterial = new THREE.MeshBasicMaterial({
        color: this.config.glowColor,
        transparent: true,
        opacity: 0.7,
      });
      const symbol = new THREE.Mesh(symbolGeometry, symbolMaterial);
      symbol.rotation.x = -Math.PI / 2;
      symbol.position.copy(marker.position);
      symbol.position.y += 0.005;
      this.addGroundTextureObject(symbol);

      // Add pulsing animation
      const originalOpacity = markerMaterial.opacity;
      setInterval(() => {
        markerMaterial.opacity = originalOpacity * (0.2 + Math.random() * 0.8);
        symbolMaterial.opacity = 0.7 * (0.3 + Math.random() * 0.7);
      }, 1000 + Math.random() * 2000);
    }
  }

  private addMetalGratingAreas(): void {
    // Add industrial metal grating sections
    for (let i = 0; i < 7; i++) {
      const gratingSize = 6 + Math.random() * 4;
      const gratingGeometry = new THREE.PlaneGeometry(gratingSize, gratingSize);
      const gratingMaterial = new THREE.MeshLambertMaterial({
        color: 0x777777,
        transparent: true,
        opacity: 0.9,
      });

      const grating = new THREE.Mesh(gratingGeometry, gratingMaterial);
      grating.rotation.x = -Math.PI / 2;
      grating.position.set(
        (Math.random() - 0.5) * 140,
        0.1,
        (Math.random() - 0.5) * 140
      );
      grating.receiveShadow = true;
      this.addGroundTextureObject(grating);

      // Add precision-cut metal bars
      const barCount = 10;
      for (let j = 0; j < barCount; j++) {
        // Horizontal bars
        const hBarGeometry = new THREE.BoxGeometry(gratingSize, 0.1, 0.2);
        const hBarMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
        const hBar = new THREE.Mesh(hBarGeometry, hBarMaterial);
        hBar.position.set(
          0,
          0.05,
          (j - barCount / 2) * (gratingSize / barCount)
        );
        grating.add(hBar);

        // Vertical bars
        const vBarGeometry = new THREE.BoxGeometry(0.2, 0.1, gratingSize);
        const vBar = new THREE.Mesh(vBarGeometry, hBarMaterial);
        vBar.position.set(
          (j - barCount / 2) * (gratingSize / barCount),
          0.05,
          0
        );
        grating.add(vBar);
      }
    }
  }

  private addTechRunes(): void {
    for (let i = 0; i < 5; i++) {
      const runeGeometry = new THREE.RingGeometry(1.0, 2.8, 12);
      const runeMaterial = new THREE.MeshBasicMaterial({
        color: this.config.glowColor,
        transparent: true,
        opacity: 0.6,
      });

      const rune = new THREE.Mesh(runeGeometry, runeMaterial);
      rune.rotation.x = -Math.PI / 2;
      rune.position.set(
        (Math.random() - 0.5) * 120,
        0.15,
        (Math.random() - 0.5) * 120
      );
      this.addGroundTextureObject(rune);

      // Add circuit-like inner pattern
      const circuitGeometry = new THREE.CircleGeometry(1.9, 12);
      const circuitMaterial = new THREE.MeshBasicMaterial({
        color: this.config.glowColor,
        transparent: true,
        opacity: 0.2,
      });
      const circuit = new THREE.Mesh(circuitGeometry, circuitMaterial);
      circuit.rotation.x = -Math.PI / 2;
      circuit.position.copy(rune.position);
      circuit.position.y += 0.005;
      this.addGroundTextureObject(circuit);

      // Add data flow animation
      const originalOpacity = runeMaterial.opacity;
      setInterval(() => {
        runeMaterial.opacity = originalOpacity * (0.4 + Math.random() * 0.6);
        circuitMaterial.opacity = 0.2 * (0.2 + Math.random() * 0.8);
      }, 800 + Math.random() * 1200);
    }
  }
}
