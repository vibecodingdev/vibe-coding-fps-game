import * as THREE from "three";

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  private ground: THREE.Mesh | null = null;
  private sky: THREE.Mesh | null = null;
  private fog: THREE.Fog | null = null;

  // Ground texture management
  private groundTexturesEnabled: boolean = true;
  private groundTextureObjects: THREE.Object3D[] = [];

  // Boundary system
  public readonly BOUNDARY_SIZE = 90; // Size of the playable area
  public readonly BOUNDARY_WALL_HEIGHT = 20;
  public readonly BOUNDARY_WALL_THICKNESS = 5;
  // Visual walls are larger than movement boundary to prevent camera clipping
  private readonly VISUAL_BOUNDARY_OFFSET = 3; // Visual walls extend 3 units beyond movement boundary

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.01, // Very small near clip plane
      3000 // Very large far clip plane
    );
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false, // Disable alpha for better performance
      preserveDrawingBuffer: false,
    });

    this.setupRenderer();
    this.setupCamera();
  }

  public async initialize(): Promise<void> {
    this.createHellishAtmosphere();
    this.createGround();
    this.createSky();
    this.addLighting();
    this.createBoundaryWalls();
    this.addEnvironmentObjects();

    // Add renderer to DOM
    document.body.appendChild(this.renderer.domElement);
  }

  private setupRenderer(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    // DOOM-style dark reddish background - slightly brighter for better visibility
    this.renderer.setClearColor(0x3d2525);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Ensure canvas takes full screen
    this.renderer.domElement.style.position = "fixed";
    this.renderer.domElement.style.top = "0";
    this.renderer.domElement.style.left = "0";
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    this.renderer.domElement.style.zIndex = "1";
  }

  private setupCamera(): void {
    // Camera position for DOOM-style view
    this.camera.position.set(0, 1.8, 20);
    this.camera.lookAt(0, 1.8, 0);
    this.camera.near = 0.01;
    this.camera.far = 3000;
    this.camera.updateProjectionMatrix();

    // Set dark hellish background color - slightly brighter for comfort
    this.renderer.setClearColor(0x3d2525, 1.0);
  }

  private createHellishAtmosphere(): void {
    // Add fog for atmospheric depth - DOOM-style red/brown fog with reduced density
    this.fog = new THREE.Fog(0x552c2c, 80, 400);
    this.scene.fog = this.fog;
  }

  private createGround(): void {
    const groundGeometry = new THREE.PlaneGeometry(2000, 2000);

    // Create a hellish ground texture with mixed materials
    const groundMaterial = new THREE.MeshLambertMaterial({
      color: 0x3d2914, // Dark brown like dried blood and dirt
      transparent: true,
      opacity: 0.9,
    });

    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.ground.position.y = 0;
    this.scene.add(this.ground);

    // Add enhanced ground details
    this.addEnhancedGroundDetails();
  }

  private addEnhancedGroundDetails(): void {
    // Only add ground textures if enabled
    if (!this.groundTexturesEnabled) {
      return;
    }

    // Clear existing ground textures
    this.clearGroundTextures();

    // Add varied blood stains and cracks with different sizes and intensities
    this.addBloodStains();

    // Add stone tile patterns
    this.addStoneTilePattern();

    // Add scattered debris with more variety
    this.addVariedDebris();

    // Add Hell cracks with glowing effects
    this.addHellCracks();

    // Add organic hellish growths
    this.addHellishGrowths();

    // Add metal grating sections
    this.addMetalGratingAreas();

    // Add ancient runes on the ground
    this.addGroundRunes();
  }

  private addBloodStains(): void {
    // Large blood pools
    for (let i = 0; i < 12; i++) {
      const stainGeometry = new THREE.CircleGeometry(Math.random() * 4 + 2, 16);
      const stainMaterial = new THREE.MeshBasicMaterial({
        color: [0x4a0000, 0x660000, 0x330000, 0x550000][
          Math.floor(Math.random() * 4)
        ], // Varied blood red tones
        transparent: true,
        opacity: 0.6 + Math.random() * 0.3,
      });

      const stain = new THREE.Mesh(stainGeometry, stainMaterial);
      stain.rotation.x = -Math.PI / 2;
      stain.position.set(
        (Math.random() - 0.5) * 180,
        0.005 + Math.random() * 0.01, // Slightly varying heights
        (Math.random() - 0.5) * 180
      );
      this.addGroundTextureObject(stain);
    }

    // Smaller blood splatter
    for (let i = 0; i < 40; i++) {
      const splatGeometry = new THREE.CircleGeometry(
        Math.random() * 1 + 0.5,
        8
      );
      const splatMaterial = new THREE.MeshBasicMaterial({
        color: [0x3a0000, 0x5a0000, 0x2a0000][Math.floor(Math.random() * 3)],
        transparent: true,
        opacity: 0.5 + Math.random() * 0.4,
      });

      const splat = new THREE.Mesh(splatGeometry, splatMaterial);
      splat.rotation.x = -Math.PI / 2;
      splat.position.set(
        (Math.random() - 0.5) * 200,
        0.01 + Math.random() * 0.005,
        (Math.random() - 0.5) * 200
      );
      this.addGroundTextureObject(splat);
    }
  }

  private addStoneTilePattern(): void {
    // Create a stone tile pattern for more structured areas
    const tileSize = 4;
    const tilesPerSide = 20;

    for (let x = 0; x < tilesPerSide; x++) {
      for (let z = 0; z < tilesPerSide; z++) {
        // Skip some tiles randomly for irregular pattern
        if (Math.random() > 0.8) continue;

        const tileGeometry = new THREE.PlaneGeometry(
          tileSize * (0.95 + Math.random() * 0.1), // Slight size variation
          tileSize * (0.95 + Math.random() * 0.1)
        );

        // Vary tile colors for realism
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
        tile.rotation.z = (Math.random() - 0.5) * 0.1; // Slight rotation variation
        tile.position.set(
          (x - tilesPerSide / 2) * tileSize + (Math.random() - 0.5) * 0.5,
          0.002,
          (z - tilesPerSide / 2) * tileSize + (Math.random() - 0.5) * 0.5
        );
        tile.receiveShadow = true;
        this.addGroundTextureObject(tile);
      }
    }
  }

  private addVariedDebris(): void {
    // Large debris pieces
    for (let i = 0; i < 25; i++) {
      const debrisTypes = [
        // Boxes and crates
        () =>
          new THREE.BoxGeometry(
            Math.random() * 1.5 + 0.5,
            Math.random() * 0.8 + 0.3,
            Math.random() * 1.5 + 0.5
          ),
        // Cylindrical debris (pipes, barrels)
        () =>
          new THREE.CylinderGeometry(
            Math.random() * 0.5 + 0.2,
            Math.random() * 0.5 + 0.2,
            Math.random() * 1.5 + 0.5,
            8
          ),
        // Irregular rocks
        () => {
          const geo = new THREE.SphereGeometry(Math.random() * 0.8 + 0.3, 6, 4);
          // Randomly deform for irregular shape
          const positionAttribute = geo.attributes.position;
          if (positionAttribute?.array) {
            const positions = positionAttribute.array as Float32Array;
            for (let j = 0; j < positions.length; j += 3) {
              positions[j]! *= 0.8 + Math.random() * 0.4;
              positions[j + 1]! *= 0.8 + Math.random() * 0.4;
              positions[j + 2]! *= 0.8 + Math.random() * 0.4;
            }
            positionAttribute.needsUpdate = true;
          }
          return geo;
        },
      ];

      const randomIndex = Math.floor(Math.random() * debrisTypes.length);
      const debrisGeometry = debrisTypes[randomIndex]!();
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
    // Large hell cracks with glowing lava effect
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
        0.01,
        (Math.random() - 0.5) * 160
      );
      this.addGroundTextureObject(crack);

      // Add glowing lava inside cracks
      const lavaGeometry = new THREE.PlaneGeometry(
        crackLength * 0.8,
        crackWidth * 0.6
      );
      const lavaMaterial = new THREE.MeshBasicMaterial({
        color: 0xff3300,
        transparent: true,
        opacity: 0.7,
      });

      const lava = new THREE.Mesh(lavaGeometry, lavaMaterial);
      lava.rotation.x = -Math.PI / 2;
      lava.rotation.z = crack.rotation.z;
      lava.position.copy(crack.position);
      lava.position.y += 0.005;
      this.addGroundTextureObject(lava);

      // Add flickering light from lava
      const lavaLight = new THREE.PointLight(0xff3300, 1.5, 20);
      lavaLight.position.copy(crack.position);
      lavaLight.position.y = 2;
      this.addGroundTextureObject(lavaLight);

      // Add flickering animation
      const originalIntensity = lavaLight.intensity;
      setInterval(() => {
        lavaLight.intensity = originalIntensity * (0.7 + Math.random() * 0.6);
        lavaMaterial.opacity = 0.7 * (0.6 + Math.random() * 0.4);
      }, 150 + Math.random() * 200);
    }
  }

  private addHellishGrowths(): void {
    // Add hellish organic growths and tentacle-like structures
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
        (growthGeometry as THREE.ConeGeometry).parameters?.height
          ? (growthGeometry as THREE.ConeGeometry).parameters.height / 2
          : 1,
        (Math.random() - 0.5) * 170
      );
      growth.rotation.x = (Math.random() - 0.5) * 0.3;
      growth.rotation.z = (Math.random() - 0.5) * 0.3;
      growth.castShadow = true;
      growth.receiveShadow = true;
      this.addGroundTextureObject(growth);

      // Add twisted tentacle-like appendages
      for (let j = 0; j < 3; j++) {
        const tentacleGeometry = new THREE.CylinderGeometry(0.05, 0.15, 0.8, 6);
        const tentacle = new THREE.Mesh(tentacleGeometry, growthMaterial);
        tentacle.position.set(
          (Math.random() - 0.5) * 0.8,
          0.3,
          (Math.random() - 0.5) * 0.8
        );
        tentacle.rotation.set(
          (Math.random() - 0.5) * Math.PI * 0.5,
          Math.random() * Math.PI * 2,
          (Math.random() - 0.5) * Math.PI * 0.5
        );
        growth.add(tentacle);
      }
    }
  }

  private addMetalGratingAreas(): void {
    // Add metal grating sections for industrial hell aesthetic
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
        0.02,
        (Math.random() - 0.5) * 150
      );
      grating.receiveShadow = true;
      this.addGroundTextureObject(grating);

      // Add grating pattern with bars
      const barCount = 8;
      for (let j = 0; j < barCount; j++) {
        // Horizontal bars
        const hBarGeometry = new THREE.BoxGeometry(gratingSize, 0.1, 0.2);
        const hBar = new THREE.Mesh(hBarGeometry, gratingMaterial);
        hBar.position.set(
          0,
          0.05,
          (j - barCount / 2) * (gratingSize / barCount)
        );
        grating.add(hBar);

        // Vertical bars
        const vBarGeometry = new THREE.BoxGeometry(0.2, 0.1, gratingSize);
        const vBar = new THREE.Mesh(vBarGeometry, gratingMaterial);
        vBar.position.set(
          (j - barCount / 2) * (gratingSize / barCount),
          0.05,
          0
        );
        grating.add(vBar);
      }
    }
  }

  private addGroundRunes(): void {
    // Add large ancient runes carved into the ground
    for (let i = 0; i < 8; i++) {
      const runeGeometry = new THREE.RingGeometry(1, 2.5, 6);
      const runeMaterial = new THREE.MeshBasicMaterial({
        color: 0xff2200,
        transparent: true,
        opacity: 0.6,
      });

      const rune = new THREE.Mesh(runeGeometry, runeMaterial);
      rune.rotation.x = -Math.PI / 2;
      rune.rotation.z = Math.random() * Math.PI * 2;
      rune.position.set(
        (Math.random() - 0.5) * 140,
        0.008,
        (Math.random() - 0.5) * 140
      );
      this.addGroundTextureObject(rune);

      // Add inner symbol
      const symbolGeometry = new THREE.CircleGeometry(1.5, 6);
      const symbolMaterial = new THREE.MeshBasicMaterial({
        color: 0xff4400,
        transparent: true,
        opacity: 0.4,
      });
      const symbol = new THREE.Mesh(symbolGeometry, symbolMaterial);
      symbol.rotation.x = -Math.PI / 2;
      symbol.rotation.z = rune.rotation.z;
      symbol.position.copy(rune.position);
      symbol.position.y += 0.002;
      this.addGroundTextureObject(symbol);

      // Add pulsing animation
      const originalOpacity = runeMaterial.opacity;
      setInterval(() => {
        runeMaterial.opacity = originalOpacity * (0.5 + Math.random() * 0.5);
        symbolMaterial.opacity = 0.4 * (0.3 + Math.random() * 0.7);
      }, 300 + Math.random() * 500);
    }
  }

  private createSky(): void {
    const skyGeometry = new THREE.SphereGeometry(1500, 60, 40);

    // Create DOOM-style hellish sky gradient
    const skyMaterial = new THREE.MeshBasicMaterial({
      color: 0x4a2c2c, // Dark reddish-brown
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });

    this.sky = new THREE.Mesh(skyGeometry, skyMaterial);
    this.sky.renderOrder = -1000;
    this.sky.frustumCulled = false;
    this.scene.add(this.sky);

    // Add hellish sky effects
    this.addSkyEffects();
  }

  private addSkyEffects(): void {
    // Add floating embers/ash particles
    const particleCount = 200;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 1000;
      positions[i + 1] = Math.random() * 200 + 50;
      positions[i + 2] = (Math.random() - 0.5) * 1000;
    }

    particles.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xff4400,
      size: 2,
      transparent: true,
      opacity: 0.6,
    });

    const particleSystem = new THREE.Points(particles, particleMaterial);
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

  private addLighting(): void {
    // Increased ambient light for better visibility while maintaining atmosphere
    const ambientLight = new THREE.AmbientLight(0x442222, 0.6);
    this.scene.add(ambientLight);

    // Main directional light with hellish orange tint - increased intensity
    const directionalLight = new THREE.DirectionalLight(0xff5522, 1.2);
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

    // Additional soft directional light from opposite side for fill lighting
    const fillLight = new THREE.DirectionalLight(0xff7744, 0.6);
    fillLight.position.set(-30, 80, -30);
    fillLight.castShadow = false; // No shadows for fill light to avoid conflicts
    this.scene.add(fillLight);

    // Multiple hellish point lights for atmospheric lighting - increased intensity
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
      // Additional strategic lights for better coverage
      { pos: [0, 12, 0], color: 0xff6633, intensity: 2.0 }, // Central overhead light
      { pos: [35, 8, -35], color: 0xff4411, intensity: 1.2 },
      { pos: [-35, 8, 35], color: 0xff5533, intensity: 1.2 },
    ];

    hellLights.forEach(({ pos, color, intensity }) => {
      const light = new THREE.PointLight(color, intensity, 50); // Increased range
      light.position.set(pos[0], pos[1], pos[2]);
      this.scene.add(light);
    });

    // Add elevated area lighting for better general illumination
    this.createAreaLighting();

    // Add flickering fire lights
    this.createFlickeringLights();
  }

  private createAreaLighting(): void {
    // Create elevated area lights for general illumination
    const areaLights: Array<{
      pos: [number, number, number];
      color: number;
      intensity: number;
    }> = [
      // High overhead lights for general illumination
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

    // Add soft hemisphere light for ambient fill
    const hemisphereLight = new THREE.HemisphereLight(0xff7744, 0x441111, 0.4);
    this.scene.add(hemisphereLight);
  }

  private createFlickeringLights(): void {
    // Create flickering lights that simulate fire/lava - increased count and intensity
    for (let i = 0; i < 12; i++) {
      const fireLight = new THREE.PointLight(0xff5522, 1.2, 30);
      fireLight.position.set(
        (Math.random() - 0.5) * 150,
        Math.random() * 8 + 3,
        (Math.random() - 0.5) * 150
      );

      // Add flickering animation
      const originalIntensity = fireLight.intensity;
      setInterval(() => {
        fireLight.intensity = originalIntensity * (0.8 + Math.random() * 0.4);
      }, Math.floor(100 + Math.random() * 200));

      this.scene.add(fireLight);
    }
  }

  private addEnvironmentObjects(): void {
    // Reduced grid opacity for darker atmosphere
    const gridHelper = new THREE.GridHelper(200, 100, 0x442222, 0x221111);
    (gridHelper.material as THREE.Material).opacity = 0.3;
    (gridHelper.material as THREE.Material).transparent = true;
    this.scene.add(gridHelper);

    // Create DOOM-style hellish environment
    this.createDemonArchitecture();
    this.createHellishStructures();
    this.createDeadVegetation();
    this.createHellPortals();
    this.createTechDebris();
    this.createHellishBarricades();
  }

  private createDemonArchitecture(): void {
    // Create hell-fortress style buildings
    for (let i = 0; i < 6; i++) {
      const width = 4 + Math.random() * 6;
      const height = 12 + Math.random() * 15;
      const depth = 4 + Math.random() * 6;

      const geometry = new THREE.BoxGeometry(width, height, depth);
      const material = new THREE.MeshLambertMaterial({
        color: 0x2a1111, // Very dark red
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

      // Add hellish architectural details
      this.addBuildingDetails(building, width, height, depth);
    }
  }

  private addBuildingDetails(
    building: THREE.Mesh,
    width: number,
    height: number,
    depth: number
  ): void {
    // Add glowing windows/portals
    for (let j = 0; j < 8; j++) {
      const windowGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.1);
      const windowMaterial = new THREE.MeshBasicMaterial({
        color: 0xff3300,
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

      // Add glowing effect around windows
      const glowGeometry = new THREE.BoxGeometry(1.0, 1.4, 0.05);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xff6600,
        transparent: true,
        opacity: 0.3,
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.copy(window.position);
      glow.position.z -= 0.02;
      building.add(glow);
    }

    // Add spikes and hellish decorations
    for (let k = 0; k < 4; k++) {
      const spikeGeometry = new THREE.ConeGeometry(0.3, 2, 6);
      const spikeMaterial = new THREE.MeshLambertMaterial({ color: 0x1a0a0a });
      const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
      spike.position.set(
        (Math.random() - 0.5) * width,
        height / 2 + 1,
        (Math.random() - 0.5) * depth
      );
      spike.rotation.x = (Math.random() - 0.5) * 0.5;
      spike.rotation.z = (Math.random() - 0.5) * 0.5;
      building.add(spike);
    }
  }

  private createHellishStructures(): void {
    // Create demonic altars and structures
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

      // Add glowing orb on top
      const orbGeometry = new THREE.SphereGeometry(0.5, 16, 12);
      const orbMaterial = new THREE.MeshBasicMaterial({
        color: 0xff3300,
        transparent: true,
        opacity: 0.8,
      });
      const orb = new THREE.Mesh(orbGeometry, orbMaterial);
      orb.position.set(0, 1.5, 0);
      altar.add(orb);

      // Add point light for orb
      const orbLight = new THREE.PointLight(0xff3300, 1.0, 15);
      orbLight.position.set(0, 1.5, 0);
      altar.add(orbLight);
    }
  }

  private createDeadVegetation(): void {
    // Create twisted, dead trees
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

      // Add twisted branches
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
    // Create glowing hellish portals
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

      // Add inner glow
      const innerGlow = new THREE.Mesh(
        new THREE.CircleGeometry(2.5, 16),
        new THREE.MeshBasicMaterial({
          color: 0xff6600,
          transparent: true,
          opacity: 0.4,
          side: THREE.DoubleSide,
        })
      );
      innerGlow.position.copy(portal.position);
      innerGlow.rotation.copy(portal.rotation);
      this.scene.add(innerGlow);

      // Add portal light
      const portalLight = new THREE.PointLight(0xff3300, 2.0, 30);
      portalLight.position.copy(portal.position);
      this.scene.add(portalLight);
    }
  }

  private createTechDebris(): void {
    // Create destroyed tech/military equipment
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
      crate.rotation.z = (Math.random() - 0.5) * 0.3;
      crate.castShadow = true;
      crate.receiveShadow = true;

      this.scene.add(crate);

      // Add damage effects
      if (Math.random() > 0.5) {
        const damageGeometry = new THREE.SphereGeometry(0.3, 8, 6);
        const damageMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const damage = new THREE.Mesh(damageGeometry, damageMaterial);
        damage.position.set(
          (Math.random() - 0.5) * 1.5,
          (Math.random() - 0.5) * 1,
          (Math.random() - 0.5) * 1.5
        );
        crate.add(damage);
      }
    }
  }

  private createHellishBarricades(): void {
    // Create twisted metal barricades
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
      barrier.rotation.z = (Math.random() - 0.5) * 0.4;
      barrier.castShadow = true;
      barrier.receiveShadow = true;

      this.scene.add(barrier);

      // Add spikes on top
      for (let j = 0; j < 3; j++) {
        const spikeGeometry = new THREE.ConeGeometry(0.1, 0.8, 4);
        const spikeMaterial = new THREE.MeshLambertMaterial({
          color: 0x1a0808,
        });
        const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
        spike.position.set((j - 1) * 1.5, 1.2, 0);
        spike.rotation.x = (Math.random() - 0.5) * 0.3;
        barrier.add(spike);
      }
    }
  }

  private createBoundaryWalls(): void {
    const boundaryGroup = new THREE.Group();
    const halfSize = this.BOUNDARY_SIZE / 2;
    // Visual walls are positioned further out than the movement boundary
    const visualHalfSize = halfSize + this.VISUAL_BOUNDARY_OFFSET;

    // Create enhanced hellish wall material with better texture and color variation
    const wallMaterial = new THREE.MeshLambertMaterial({
      color: 0x4a2015, // Darker brick red instead of pure black
      transparent: true,
      opacity: 0.95,
    });

    // Create stone brick texture material
    const brickMaterial = new THREE.MeshLambertMaterial({
      color: 0x3d2914, // Dark brown stone
      transparent: true,
      opacity: 0.9,
    });

    // Create metal reinforcement material
    const metalMaterial = new THREE.MeshLambertMaterial({
      color: 0x2a2a2a, // Dark metal
      transparent: true,
      opacity: 0.8,
    });

    // Create glowing edge material for the top of walls
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xff3300,
      transparent: true,
      opacity: 0.6,
    });

    // North wall - positioned beyond movement boundary
    this.createEnhancedHellWallSection(
      boundaryGroup,
      new THREE.Vector3(0, this.BOUNDARY_WALL_HEIGHT / 2, visualHalfSize),
      new THREE.Vector3(
        this.BOUNDARY_SIZE +
          this.BOUNDARY_WALL_THICKNESS +
          this.VISUAL_BOUNDARY_OFFSET * 2,
        this.BOUNDARY_WALL_HEIGHT,
        this.BOUNDARY_WALL_THICKNESS
      ),
      wallMaterial,
      brickMaterial,
      metalMaterial,
      glowMaterial,
      0
    );

    // South wall - positioned beyond movement boundary
    this.createEnhancedHellWallSection(
      boundaryGroup,
      new THREE.Vector3(0, this.BOUNDARY_WALL_HEIGHT / 2, -visualHalfSize),
      new THREE.Vector3(
        this.BOUNDARY_SIZE +
          this.BOUNDARY_WALL_THICKNESS +
          this.VISUAL_BOUNDARY_OFFSET * 2,
        this.BOUNDARY_WALL_HEIGHT,
        this.BOUNDARY_WALL_THICKNESS
      ),
      wallMaterial,
      brickMaterial,
      metalMaterial,
      glowMaterial,
      0
    );

    // East wall - positioned beyond movement boundary
    this.createEnhancedHellWallSection(
      boundaryGroup,
      new THREE.Vector3(visualHalfSize, this.BOUNDARY_WALL_HEIGHT / 2, 0),
      new THREE.Vector3(
        this.BOUNDARY_WALL_THICKNESS,
        this.BOUNDARY_WALL_HEIGHT,
        this.BOUNDARY_SIZE + this.VISUAL_BOUNDARY_OFFSET * 2
      ),
      wallMaterial,
      brickMaterial,
      metalMaterial,
      glowMaterial,
      Math.PI / 2 // Fixed rotation for East wall
    );

    // West wall - positioned beyond movement boundary
    this.createEnhancedHellWallSection(
      boundaryGroup,
      new THREE.Vector3(-visualHalfSize, this.BOUNDARY_WALL_HEIGHT / 2, 0),
      new THREE.Vector3(
        this.BOUNDARY_WALL_THICKNESS,
        this.BOUNDARY_WALL_HEIGHT,
        this.BOUNDARY_SIZE + this.VISUAL_BOUNDARY_OFFSET * 2
      ),
      wallMaterial,
      brickMaterial,
      metalMaterial,
      glowMaterial,
      Math.PI / 2 // Fixed rotation for West wall
    );

    // Add corner towers and reinforcements - also positioned at visual boundary
    this.createCornerTowers(boundaryGroup, visualHalfSize);

    // Add wall decorations and defensive structures - positioned between movement and visual boundaries
    this.addWallDecorations(boundaryGroup, halfSize, visualHalfSize);

    this.scene.add(boundaryGroup);
  }

  private createEnhancedHellWallSection(
    parent: THREE.Group,
    position: THREE.Vector3,
    size: THREE.Vector3,
    wallMaterial: THREE.Material,
    brickMaterial: THREE.Material,
    metalMaterial: THREE.Material,
    glowMaterial: THREE.Material,
    rotation: number
  ): void {
    // Main wall structure with enhanced base material
    const wallGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.copy(position);
    wall.rotation.y = rotation;
    wall.castShadow = true;
    wall.receiveShadow = true;
    parent.add(wall);

    // Add detailed brick texture layers
    this.addBrickTextureLayers(parent, position, size, rotation, brickMaterial);

    // Add metal reinforcement bands
    this.addMetalReinforcements(
      parent,
      position,
      size,
      rotation,
      metalMaterial
    );

    // Add weathering and damage effects
    this.addWeatheringEffects(parent, position, size, rotation);

    // Glowing top edge
    const edgeGeometry = new THREE.BoxGeometry(
      size.x * 1.02,
      0.5,
      size.z * 1.02
    );
    const edge = new THREE.Mesh(edgeGeometry, glowMaterial);
    edge.position.copy(position);
    edge.position.y += size.y / 2;
    edge.rotation.y = rotation;
    parent.add(edge);

    // Add enhanced texture details
    this.addEnhancedWallTexture(parent, position, size, rotation);

    // Add wall damage and cracks
    this.addWallDamage(parent, position, size, rotation);
  }

  private addBrickTextureLayers(
    parent: THREE.Group,
    position: THREE.Vector3,
    size: THREE.Vector3,
    rotation: number,
    brickMaterial: THREE.Material
  ): void {
    // Add individual brick pattern
    const brickWidth = 2.5;
    const brickHeight = 1.2;
    const brickDepth = 0.2;

    // Calculate brick count based on wall orientation
    let bricksHorizontal, bricksVertical;
    if (Math.abs(rotation) < 0.1) {
      // North/South walls
      bricksHorizontal = Math.floor(size.x / brickWidth);
      bricksVertical = Math.floor(size.y / brickHeight);
    } else {
      // East/West walls
      bricksHorizontal = Math.floor(size.z / brickWidth);
      bricksVertical = Math.floor(size.y / brickHeight);
    }

    for (let row = 0; row < bricksVertical; row++) {
      for (let col = 0; col < bricksHorizontal; col++) {
        // Offset every other row for realistic brick pattern
        const offsetX = (row % 2) * (brickWidth / 2);

        const brickGeometry = new THREE.BoxGeometry(
          brickWidth * 0.95, // Slightly smaller for mortar gaps
          brickHeight * 0.95,
          brickDepth
        );

        // Vary brick colors for realism
        const brickColorVariants = [0x3d2914, 0x4a2c1a, 0x2f1f0d, 0x5a3520];
        const brickColor =
          brickColorVariants[
            Math.floor(Math.random() * brickColorVariants.length)
          ];

        const variantMaterial = new THREE.MeshLambertMaterial({
          color: brickColor,
          transparent: true,
          opacity: 0.9,
        });

        const brick = new THREE.Mesh(brickGeometry, variantMaterial);
        brick.position.copy(position);

        // Position bricks correctly based on wall orientation
        if (Math.abs(rotation) < 0.1) {
          // North/South walls (rotation ≈ 0)
          brick.position.x +=
            (col - bricksHorizontal / 2) * brickWidth + offsetX;
          brick.position.y += (row - bricksVertical / 2) * brickHeight;
          // Position on inner side of wall
          brick.position.z +=
            position.z > 0
              ? -size.z / 2 - brickDepth / 2
              : size.z / 2 + brickDepth / 2;
        } else {
          // East/West walls (rotation ≈ Math.PI/2)
          brick.position.z +=
            (col - bricksHorizontal / 2) * brickWidth + offsetX;
          brick.position.y += (row - bricksVertical / 2) * brickHeight;
          // Position on inner side of wall
          brick.position.x +=
            position.x > 0
              ? -size.x / 2 - brickDepth / 2
              : size.x / 2 + brickDepth / 2;
          brick.rotation.y = rotation;
        }

        brick.castShadow = true;
        brick.receiveShadow = true;
        parent.add(brick);
      }
    }
  }

  private addMetalReinforcements(
    parent: THREE.Group,
    position: THREE.Vector3,
    size: THREE.Vector3,
    rotation: number,
    metalMaterial: THREE.Material
  ): void {
    // Add horizontal metal bands
    const bandCount = 3;
    for (let i = 0; i < bandCount; i++) {
      const bandGeometry = new THREE.BoxGeometry(
        Math.abs(rotation) < 0.1 ? size.x * 1.01 : 0.1,
        0.3,
        Math.abs(rotation) < 0.1 ? 0.1 : size.z * 1.01
      );
      const band = new THREE.Mesh(bandGeometry, metalMaterial);

      band.position.copy(position);
      band.position.y += (i - bandCount / 2 + 0.5) * (size.y / bandCount);

      if (Math.abs(rotation) < 0.1) {
        // North/South walls
        band.position.z +=
          position.z > 0 ? -size.z / 2 - 0.15 : size.z / 2 + 0.15;
      } else {
        // East/West walls
        band.position.x +=
          position.x > 0 ? -size.x / 2 - 0.15 : size.x / 2 + 0.15;
      }

      band.castShadow = true;
      parent.add(band);
    }

    // Add vertical metal supports
    const supportCount = Math.floor(
      (Math.abs(rotation) < 0.1 ? size.x : size.z) / 8
    );
    for (let i = 0; i < supportCount; i++) {
      const supportGeometry = new THREE.BoxGeometry(
        Math.abs(rotation) < 0.1 ? 0.2 : 0.1,
        size.y * 1.01,
        Math.abs(rotation) < 0.1 ? 0.1 : 0.2
      );
      const support = new THREE.Mesh(supportGeometry, metalMaterial);

      support.position.copy(position);

      if (Math.abs(rotation) < 0.1) {
        // North/South walls
        support.position.x +=
          (i - supportCount / 2 + 0.5) * (size.x / supportCount);
        support.position.z +=
          position.z > 0 ? -size.z / 2 - 0.15 : size.z / 2 + 0.15;
      } else {
        // East/West walls
        support.position.z +=
          (i - supportCount / 2 + 0.5) * (size.z / supportCount);
        support.position.x +=
          position.x > 0 ? -size.x / 2 - 0.15 : size.x / 2 + 0.15;
      }

      support.castShadow = true;
      parent.add(support);
    }
  }

  private addWeatheringEffects(
    parent: THREE.Group,
    position: THREE.Vector3,
    size: THREE.Vector3,
    rotation: number
  ): void {
    // Add rust stains
    for (let i = 0; i < 8; i++) {
      const stainGeometry = new THREE.PlaneGeometry(
        0.5 + Math.random() * 1.5,
        1 + Math.random() * 2
      );
      const stainMaterial = new THREE.MeshBasicMaterial({
        color: 0x8b4513, // Rust brown
        transparent: true,
        opacity: 0.4,
      });

      const stain = new THREE.Mesh(stainGeometry, stainMaterial);
      stain.position.copy(position);

      if (Math.abs(rotation) < 0.1) {
        // North/South walls
        stain.position.x += (Math.random() - 0.5) * size.x * 0.8;
        stain.position.y += (Math.random() - 0.5) * size.y * 0.8;
        stain.position.z +=
          position.z > 0 ? -size.z / 2 - 0.05 : size.z / 2 + 0.05;
      } else {
        // East/West walls
        stain.position.z += (Math.random() - 0.5) * size.z * 0.8;
        stain.position.y += (Math.random() - 0.5) * size.y * 0.8;
        stain.position.x +=
          position.x > 0 ? -size.x / 2 - 0.05 : size.x / 2 + 0.05;
        stain.rotation.y = rotation;
      }

      parent.add(stain);
    }

    // Add moss/organic growth
    for (let i = 0; i < 5; i++) {
      const mossGeometry = new THREE.CircleGeometry(
        0.3 + Math.random() * 0.7,
        8
      );
      const mossMaterial = new THREE.MeshBasicMaterial({
        color: 0x2d4a2d, // Dark green
        transparent: true,
        opacity: 0.5,
      });

      const moss = new THREE.Mesh(mossGeometry, mossMaterial);
      moss.position.copy(position);
      moss.position.y -= size.y * 0.3; // Lower on the wall

      if (Math.abs(rotation) < 0.1) {
        // North/South walls
        moss.position.x += (Math.random() - 0.5) * size.x * 0.9;
        moss.position.z +=
          position.z > 0 ? -size.z / 2 - 0.03 : size.z / 2 + 0.03;
      } else {
        // East/West walls
        moss.position.z += (Math.random() - 0.5) * size.z * 0.9;
        moss.position.x +=
          position.x > 0 ? -size.x / 2 - 0.03 : size.x / 2 + 0.03;
        moss.rotation.y = rotation;
      }

      parent.add(moss);
    }
  }

  private addEnhancedWallTexture(
    parent: THREE.Group,
    position: THREE.Vector3,
    size: THREE.Vector3,
    rotation: number
  ): void {
    // Add larger stone blocks for base structure
    const blockCount = Math.floor(
      (Math.abs(rotation) < 0.1 ? size.x : size.z) / 4
    );
    for (let i = 0; i < blockCount; i++) {
      const blockGeometry = new THREE.BoxGeometry(3.8, 3, 0.4);

      // Vary block colors and materials
      const blockColorVariants = [0x2a0a0a, 0x1a0505, 0x330808, 0x4a1a1a];
      const blockColor =
        blockColorVariants[
          Math.floor(Math.random() * blockColorVariants.length)
        ];

      const blockMaterial = new THREE.MeshLambertMaterial({
        color: blockColor,
        transparent: true,
        opacity: 0.8,
      });

      const block = new THREE.Mesh(blockGeometry, blockMaterial);
      block.position.copy(position);
      block.position.y += (Math.random() - 0.5) * size.y * 0.3;

      if (Math.abs(rotation) < 0.1) {
        // North/South walls
        block.position.x += (i - blockCount / 2 + 0.5) * (size.x / blockCount);
        block.position.z += position.z > 0 ? -0.3 : 0.3;
      } else {
        // East/West walls
        block.position.z += (i - blockCount / 2 + 0.5) * (size.z / blockCount);
        block.position.x += position.x > 0 ? -0.3 : 0.3;
        block.rotation.y = rotation;
      }

      block.castShadow = true;
      block.receiveShadow = true;
      parent.add(block);
    }

    // Enhanced hellish runes and symbols with better visibility
    for (let i = 0; i < 5; i++) {
      const runeGeometry = new THREE.CircleGeometry(0.7, 6);
      const runeMaterial = new THREE.MeshBasicMaterial({
        color: 0xff4422, // Brighter red-orange
        transparent: true,
        opacity: 0.9,
      });

      const rune = new THREE.Mesh(runeGeometry, runeMaterial);
      rune.position.copy(position);

      if (Math.abs(rotation) < 0.1) {
        // North/South walls
        rune.position.x += (Math.random() - 0.5) * size.x * 0.8;
        rune.position.y += (Math.random() - 0.5) * size.y * 0.6;
        rune.position.z +=
          position.z > 0 ? -size.z / 2 - 0.1 : size.z / 2 + 0.1;
        rune.rotation.y = Math.PI / 2;
      } else {
        // East/West walls
        rune.position.z += (Math.random() - 0.5) * size.z * 0.8;
        rune.position.y += (Math.random() - 0.5) * size.y * 0.6;
        rune.position.x +=
          position.x > 0 ? -size.x / 2 - 0.1 : size.x / 2 + 0.1;
        rune.rotation.y = rotation + Math.PI / 2;
      }

      parent.add(rune);

      // Add enhanced glow around runes
      const glowGeometry = new THREE.CircleGeometry(1.2, 8);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xff7744, // Warmer orange glow
        transparent: true,
        opacity: 0.4,
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.copy(rune.position);
      glow.position.z -= 0.01;
      glow.rotation.copy(rune.rotation);
      parent.add(glow);

      // Add pulsing animation to runes
      const originalOpacity = runeMaterial.opacity;
      setInterval(() => {
        runeMaterial.opacity = originalOpacity * (0.6 + Math.random() * 0.4);
        glowMaterial.opacity = 0.4 * (0.5 + Math.random() * 0.5);
      }, 200 + Math.random() * 300);
    }

    // Add carved stone details
    this.addCarvedStoneDetails(parent, position, size, rotation);
  }

  private addCarvedStoneDetails(
    parent: THREE.Group,
    position: THREE.Vector3,
    size: THREE.Vector3,
    rotation: number
  ): void {
    // Add carved demon faces or skulls
    for (let i = 0; i < 3; i++) {
      const faceGeometry = new THREE.SphereGeometry(0.6, 8, 6);
      const faceMaterial = new THREE.MeshLambertMaterial({
        color: 0x2a1010,
        transparent: true,
        opacity: 0.7,
      });

      const face = new THREE.Mesh(faceGeometry, faceMaterial);
      face.position.copy(position);
      face.scale.z = 0.3; // Flatten for carved effect

      if (Math.abs(rotation) < 0.1) {
        // North/South walls
        face.position.x += (Math.random() - 0.5) * size.x * 0.6;
        face.position.y += (Math.random() - 0.5) * size.y * 0.4;
        face.position.z +=
          position.z > 0 ? -size.z / 2 - 0.2 : size.z / 2 + 0.2;
      } else {
        // East/West walls
        face.position.z += (Math.random() - 0.5) * size.z * 0.6;
        face.position.y += (Math.random() - 0.5) * size.y * 0.4;
        face.position.x +=
          position.x > 0 ? -size.x / 2 - 0.2 : size.x / 2 + 0.2;
        face.rotation.y = rotation;
      }

      face.castShadow = true;
      parent.add(face);

      // Add glowing eyes
      for (let j = 0; j < 2; j++) {
        const eyeGeometry = new THREE.SphereGeometry(0.08, 6, 4);
        const eyeMaterial = new THREE.MeshBasicMaterial({
          color: 0xff0000,
          transparent: true,
          opacity: 0.8,
        });

        const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        eye.position.set((j - 0.5) * 0.3, 0.1, 0.3);
        face.add(eye);
      }
    }

    // Add decorative stone trim
    const trimCount = Math.floor(
      (Math.abs(rotation) < 0.1 ? size.x : size.z) / 6
    );
    for (let i = 0; i < trimCount; i++) {
      const trimGeometry = new THREE.BoxGeometry(0.3, size.y * 0.8, 0.2);
      const trimMaterial = new THREE.MeshLambertMaterial({
        color: 0x5a3520,
        transparent: true,
        opacity: 0.8,
      });

      const trim = new THREE.Mesh(trimGeometry, trimMaterial);
      trim.position.copy(position);

      if (Math.abs(rotation) < 0.1) {
        // North/South walls
        trim.position.x += (i - trimCount / 2 + 0.5) * (size.x / trimCount);
        trim.position.z +=
          position.z > 0 ? -size.z / 2 - 0.2 : size.z / 2 + 0.2;
      } else {
        // East/West walls
        trim.position.z += (i - trimCount / 2 + 0.5) * (size.z / trimCount);
        trim.position.x +=
          position.x > 0 ? -size.x / 2 - 0.2 : size.x / 2 + 0.2;
        trim.rotation.y = rotation;
      }

      trim.castShadow = true;
      parent.add(trim);
    }
  }

  private addWallDamage(
    parent: THREE.Group,
    position: THREE.Vector3,
    size: THREE.Vector3,
    rotation: number
  ): void {
    // Add cracks and battle damage
    for (let i = 0; i < 5; i++) {
      const crackGeometry = new THREE.CylinderGeometry(0.05, 0.1, 2, 6);
      const crackMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const crack = new THREE.Mesh(crackGeometry, crackMaterial);

      crack.position.copy(position);
      crack.position.x += (Math.random() - 0.5) * size.x * 0.9;
      crack.position.y += (Math.random() - 0.5) * size.y * 0.8;
      crack.position.z += rotation === 0 ? size.z / 2 + 0.05 : 0;
      crack.position.x += rotation !== 0 ? size.z / 2 + 0.05 : 0;

      crack.rotation.z = Math.random() * Math.PI;
      crack.rotation.y = rotation + Math.PI / 2;
      parent.add(crack);
    }

    // Add scorch marks
    for (let i = 0; i < 3; i++) {
      const scorch = new THREE.Mesh(
        new THREE.CircleGeometry(1 + Math.random(), 8),
        new THREE.MeshBasicMaterial({
          color: 0x0a0a0a,
          transparent: true,
          opacity: 0.7,
        })
      );

      scorch.position.copy(position);
      scorch.position.x += (Math.random() - 0.5) * size.x * 0.8;
      scorch.position.y += (Math.random() - 0.5) * size.y * 0.6;
      scorch.position.z += rotation === 0 ? size.z / 2 + 0.02 : 0;
      scorch.position.x += rotation !== 0 ? size.z / 2 + 0.02 : 0;
      scorch.rotation.y = rotation + Math.PI / 2;
      parent.add(scorch);
    }
  }

  private createCornerTowers(
    parent: THREE.Group,
    visualHalfSize: number
  ): void {
    const towerPositions = [
      new THREE.Vector3(visualHalfSize, 0, visualHalfSize), // Northeast
      new THREE.Vector3(-visualHalfSize, 0, visualHalfSize), // Northwest
      new THREE.Vector3(visualHalfSize, 0, -visualHalfSize), // Southeast
      new THREE.Vector3(-visualHalfSize, 0, -visualHalfSize), // Southwest
    ];

    towerPositions.forEach((pos, index) => {
      const towerGroup = new THREE.Group();

      // Main tower structure
      const towerGeometry = new THREE.CylinderGeometry(
        4,
        6,
        this.BOUNDARY_WALL_HEIGHT + 5,
        8
      );
      const towerMaterial = new THREE.MeshLambertMaterial({ color: 0x0f0404 });
      const tower = new THREE.Mesh(towerGeometry, towerMaterial);
      tower.position.set(pos.x, (this.BOUNDARY_WALL_HEIGHT + 5) / 2, pos.z);
      tower.castShadow = true;
      tower.receiveShadow = true;
      towerGroup.add(tower);

      // Tower top with battlements
      for (let i = 0; i < 8; i++) {
        const battlementGeometry = new THREE.BoxGeometry(1, 2, 0.5);
        const battlementMaterial = new THREE.MeshLambertMaterial({
          color: 0x1a0808,
        });
        const battlement = new THREE.Mesh(
          battlementGeometry,
          battlementMaterial
        );

        const angle = (i / 8) * Math.PI * 2;
        battlement.position.set(
          pos.x + Math.cos(angle) * 4.5,
          this.BOUNDARY_WALL_HEIGHT + 5 + 1,
          pos.z + Math.sin(angle) * 4.5
        );
        battlement.rotation.y = angle;
        towerGroup.add(battlement);
      }

      // Glowing tower beacon
      const beaconGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
      const beaconMaterial = new THREE.MeshBasicMaterial({
        color: 0xff3300,
        transparent: true,
        opacity: 0.9,
      });
      const beacon = new THREE.Mesh(beaconGeometry, beaconMaterial);
      beacon.position.set(pos.x, this.BOUNDARY_WALL_HEIGHT + 8, pos.z);
      towerGroup.add(beacon);

      // Beacon light
      const beaconLight = new THREE.PointLight(0xff3300, 2.0, 50);
      beaconLight.position.set(pos.x, this.BOUNDARY_WALL_HEIGHT + 8, pos.z);
      towerGroup.add(beaconLight);

      // Add tower decorations - spikes and gargoyles
      this.addTowerDecorations(towerGroup, pos);

      parent.add(towerGroup);
    });
  }

  private addTowerDecorations(
    towerGroup: THREE.Group,
    position: THREE.Vector3
  ): void {
    // Add spikes around the tower
    for (let i = 0; i < 12; i++) {
      const spikeGeometry = new THREE.ConeGeometry(0.2, 3, 6);
      const spikeMaterial = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
      const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);

      const angle = (i / 12) * Math.PI * 2;
      spike.position.set(
        position.x + Math.cos(angle) * 7,
        6,
        position.z + Math.sin(angle) * 7
      );
      spike.rotation.z = (Math.random() - 0.5) * 0.3;
      towerGroup.add(spike);
    }

    // Add hellish gargoyle-like decorations
    for (let i = 0; i < 4; i++) {
      const gargoyleGeometry = new THREE.BoxGeometry(1, 1.5, 0.8);
      const gargoyleMaterial = new THREE.MeshLambertMaterial({
        color: 0x1a0505,
      });
      const gargoyle = new THREE.Mesh(gargoyleGeometry, gargoyleMaterial);

      const angle = (i / 4) * Math.PI * 2;
      gargoyle.position.set(
        position.x + Math.cos(angle) * 5,
        this.BOUNDARY_WALL_HEIGHT / 2,
        position.z + Math.sin(angle) * 5
      );
      gargoyle.rotation.y = angle + Math.PI;
      towerGroup.add(gargoyle);

      // Add glowing eyes
      const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 6);
      const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      leftEye.position.set(-0.2, 0.3, 0.4);
      gargoyle.add(leftEye);

      const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      rightEye.position.set(0.2, 0.3, 0.4);
      gargoyle.add(rightEye);
    }
  }

  private addWallDecorations(
    parent: THREE.Group,
    halfSize: number,
    visualHalfSize?: number
  ): void {
    const decorationHalfSize = visualHalfSize || halfSize;

    // Add defensive spikes along the walls
    this.addDefensiveSpikes(parent, decorationHalfSize);

    // Add wall-mounted torches
    this.addWallTorches(parent, decorationHalfSize);

    // Add barrier reinforcements
    this.addBarrierReinforcements(parent, decorationHalfSize);

    // Add hellish warning signs - positioned at movement boundary for gameplay visibility
    this.addWarningSigns(parent, halfSize);
  }

  private addDefensiveSpikes(parent: THREE.Group, halfSize: number): void {
    const spikePositions = [
      // North wall spikes - positioned between movement and visual boundary
      ...Array.from(
        { length: 10 },
        (_, i) =>
          new THREE.Vector3(
            -halfSize + (i + 1) * ((halfSize * 2) / 11),
            0,
            halfSize - 6
          )
      ),
      // South wall spikes
      ...Array.from(
        { length: 10 },
        (_, i) =>
          new THREE.Vector3(
            -halfSize + (i + 1) * ((halfSize * 2) / 11),
            0,
            -halfSize + 6
          )
      ),
      // East wall spikes
      ...Array.from(
        { length: 10 },
        (_, i) =>
          new THREE.Vector3(
            halfSize - 6,
            0,
            -halfSize + (i + 1) * ((halfSize * 2) / 11)
          )
      ),
      // West wall spikes
      ...Array.from(
        { length: 10 },
        (_, i) =>
          new THREE.Vector3(
            -halfSize + 6,
            0,
            -halfSize + (i + 1) * ((halfSize * 2) / 11)
          )
      ),
    ];

    spikePositions.forEach((pos) => {
      const spikeGroup = new THREE.Group();

      // Main spike
      const spikeGeometry = new THREE.ConeGeometry(0.4, 4, 8);
      const spikeMaterial = new THREE.MeshLambertMaterial({ color: 0x1a0808 });
      const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
      spike.position.set(0, 2, 0);
      spike.rotation.x = (Math.random() - 0.5) * 0.3;
      spike.rotation.z = (Math.random() - 0.5) * 0.3;
      spikeGroup.add(spike);

      // Base
      const baseGeometry = new THREE.CylinderGeometry(0.6, 0.8, 0.5, 8);
      const base = new THREE.Mesh(baseGeometry, spikeMaterial);
      base.position.set(0, 0.25, 0);
      spikeGroup.add(base);

      spikeGroup.position.copy(pos);
      spikeGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      parent.add(spikeGroup);
    });
  }

  private addWallTorches(parent: THREE.Group, halfSize: number): void {
    const torchPositions = [
      // North wall - positioned closer to visual wall
      new THREE.Vector3(-20, 8, halfSize - 1),
      new THREE.Vector3(0, 8, halfSize - 1),
      new THREE.Vector3(20, 8, halfSize - 1),
      // South wall
      new THREE.Vector3(-20, 8, -halfSize + 1),
      new THREE.Vector3(0, 8, -halfSize + 1),
      new THREE.Vector3(20, 8, -halfSize + 1),
      // East wall
      new THREE.Vector3(halfSize - 1, 8, -20),
      new THREE.Vector3(halfSize - 1, 8, 0),
      new THREE.Vector3(halfSize - 1, 8, 20),
      // West wall
      new THREE.Vector3(-halfSize + 1, 8, -20),
      new THREE.Vector3(-halfSize + 1, 8, 0),
      new THREE.Vector3(-halfSize + 1, 8, 20),
    ];

    torchPositions.forEach((pos) => {
      const torchGroup = new THREE.Group();

      // Torch holder
      const holderGeometry = new THREE.CylinderGeometry(0.1, 0.15, 1, 8);
      const holderMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
      const holder = new THREE.Mesh(holderGeometry, holderMaterial);
      holder.position.set(0, -0.5, 0);
      torchGroup.add(holder);

      // Flame effect
      const flameGeometry = new THREE.ConeGeometry(0.3, 1, 8);
      const flameMaterial = new THREE.MeshBasicMaterial({
        color: 0xff4400,
        transparent: true,
        opacity: 0.8,
      });
      const flame = new THREE.Mesh(flameGeometry, flameMaterial);
      flame.position.set(0, 0.5, 0);
      torchGroup.add(flame);

      // Torch light - increased intensity and range for better illumination
      const torchLight = new THREE.PointLight(0xff5522, 2.2, 35);
      torchLight.position.set(0, 0.5, 0);
      torchGroup.add(torchLight);

      // Add flickering animation
      const originalIntensity = torchLight.intensity;
      setInterval(() => {
        torchLight.intensity = originalIntensity * (0.85 + Math.random() * 0.3);
        flame.scale.y = 0.8 + Math.random() * 0.4;
      }, 150 + Math.random() * 100);

      torchGroup.position.copy(pos);
      parent.add(torchGroup);
    });
  }

  private addBarrierReinforcements(
    parent: THREE.Group,
    halfSize: number
  ): void {
    // Add razor wire on top of walls
    const wireSegments = 50;

    // North wall wire - positioned at visual boundary
    this.createRazorWire(
      parent,
      new THREE.Vector3(-halfSize, this.BOUNDARY_WALL_HEIGHT + 1, halfSize),
      new THREE.Vector3(halfSize, this.BOUNDARY_WALL_HEIGHT + 1, halfSize),
      wireSegments
    );

    // South wall wire
    this.createRazorWire(
      parent,
      new THREE.Vector3(-halfSize, this.BOUNDARY_WALL_HEIGHT + 1, -halfSize),
      new THREE.Vector3(halfSize, this.BOUNDARY_WALL_HEIGHT + 1, -halfSize),
      wireSegments
    );

    // East wall wire
    this.createRazorWire(
      parent,
      new THREE.Vector3(halfSize, this.BOUNDARY_WALL_HEIGHT + 1, -halfSize),
      new THREE.Vector3(halfSize, this.BOUNDARY_WALL_HEIGHT + 1, halfSize),
      wireSegments
    );

    // West wall wire
    this.createRazorWire(
      parent,
      new THREE.Vector3(-halfSize, this.BOUNDARY_WALL_HEIGHT + 1, -halfSize),
      new THREE.Vector3(-halfSize, this.BOUNDARY_WALL_HEIGHT + 1, halfSize),
      wireSegments
    );
  }

  private createRazorWire(
    parent: THREE.Group,
    start: THREE.Vector3,
    end: THREE.Vector3,
    segments: number
  ): void {
    const wireGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array((segments + 1) * 3);

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = start.x + (end.x - start.x) * t;
      const y = start.y + Math.sin(t * Math.PI * 8) * 0.3; // Wavy wire
      const z = start.z + (end.z - start.z) * t;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }

    wireGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );

    const wireMaterial = new THREE.LineBasicMaterial({
      color: 0x666666,
      linewidth: 2,
    });

    const wire = new THREE.Line(wireGeometry, wireMaterial);
    parent.add(wire);
  }

  private addWarningSigns(parent: THREE.Group, halfSize: number): void {
    const signPositions = [
      // Corner warning signs
      new THREE.Vector3(halfSize - 15, 3, halfSize - 15),
      new THREE.Vector3(-halfSize + 15, 3, halfSize - 15),
      new THREE.Vector3(halfSize - 15, 3, -halfSize + 15),
      new THREE.Vector3(-halfSize + 15, 3, -halfSize + 15),
    ];

    signPositions.forEach((pos) => {
      const signGroup = new THREE.Group();

      // Sign post
      const postGeometry = new THREE.CylinderGeometry(0.1, 0.1, 4, 8);
      const postMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
      const post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(0, 2, 0);
      signGroup.add(post);

      // Warning sign
      const signGeometry = new THREE.BoxGeometry(2, 1.5, 0.1);
      const signMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
      const sign = new THREE.Mesh(signGeometry, signMaterial);
      sign.position.set(0, 4, 0);
      signGroup.add(sign);

      // Danger symbol
      const symbolGeometry = new THREE.ConeGeometry(0.5, 0.8, 3);
      const symbolMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const symbol = new THREE.Mesh(symbolGeometry, symbolMaterial);
      symbol.position.set(0, 4, 0.06);
      symbol.rotation.z = Math.PI;
      signGroup.add(symbol);

      signGroup.position.copy(pos);
      signGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      parent.add(signGroup);
    });
  }

  /**
   * Check if a position is within the boundary area
   */
  public isWithinBoundary(position: THREE.Vector3): boolean {
    const halfSize = this.BOUNDARY_SIZE / 2;
    return (
      position.x >= -halfSize &&
      position.x <= halfSize &&
      position.z >= -halfSize &&
      position.z <= halfSize
    );
  }

  /**
   * Clamp a position to stay within boundaries
   */
  public clampToBoundary(position: THREE.Vector3): THREE.Vector3 {
    const halfSize = this.BOUNDARY_SIZE / 2;
    const clampedPosition = position.clone();

    clampedPosition.x = Math.max(
      -halfSize,
      Math.min(halfSize, clampedPosition.x)
    );
    clampedPosition.z = Math.max(
      -halfSize,
      Math.min(halfSize, clampedPosition.z)
    );

    return clampedPosition;
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  public onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getCamera(): THREE.Camera {
    return this.camera;
  }

  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  public addObject(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  public removeObject(object: THREE.Object3D): void {
    this.scene.remove(object);
  }

  /**
   * Toggle ground textures on/off for performance
   */
  public toggleGroundTextures(enabled: boolean): void {
    this.groundTexturesEnabled = enabled;

    if (enabled) {
      // Re-add ground textures
      this.addEnhancedGroundDetails();
    } else {
      // Remove ground textures
      this.clearGroundTextures();
    }

    console.log(`Ground textures ${enabled ? "enabled" : "disabled"}`);
  }

  /**
   * Get current ground texture state
   */
  public getGroundTexturesEnabled(): boolean {
    return this.groundTexturesEnabled;
  }

  /**
   * Clear all ground texture objects
   */
  private clearGroundTextures(): void {
    this.groundTextureObjects.forEach((obj) => {
      this.scene.remove(obj);
      // Dispose of geometry and materials to free memory
      if (obj instanceof THREE.Mesh) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((mat) => mat.dispose());
          } else {
            obj.material.dispose();
          }
        }
      }
    });
    this.groundTextureObjects = [];
  }

  /**
   * Helper method to add ground texture objects
   */
  private addGroundTextureObject(object: THREE.Object3D): void {
    this.scene.add(object);
    this.groundTextureObjects.push(object);
  }
}
