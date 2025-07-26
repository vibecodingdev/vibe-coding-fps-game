import * as THREE from "three";

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  private ground: THREE.Mesh | null = null;
  private sky: THREE.Mesh | null = null;
  private fog: THREE.Fog | null = null;

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
    // DOOM-style dark reddish background
    this.renderer.setClearColor(0x2d1b1b);
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

    // Set dark hellish background color
    this.renderer.setClearColor(0x2d1b1b, 1.0);
  }

  private createHellishAtmosphere(): void {
    // Add fog for atmospheric depth - DOOM-style red/brown fog
    this.fog = new THREE.Fog(0x4a2c2c, 50, 300);
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

    // Add cracks and blood stains on the ground
    this.addGroundDetails();
  }

  private addGroundDetails(): void {
    // Add blood stains and cracks
    for (let i = 0; i < 30; i++) {
      const stainGeometry = new THREE.CircleGeometry(Math.random() * 3 + 1, 8);
      const stainMaterial = new THREE.MeshBasicMaterial({
        color: 0x4a0000, // Dark blood red
        transparent: true,
        opacity: 0.7,
      });

      const stain = new THREE.Mesh(stainGeometry, stainMaterial);
      stain.rotation.x = -Math.PI / 2;
      stain.position.set(
        (Math.random() - 0.5) * 200,
        0.01,
        (Math.random() - 0.5) * 200
      );
      this.scene.add(stain);
    }

    // Add scattered debris
    for (let i = 0; i < 50; i++) {
      const debris = new THREE.Mesh(
        new THREE.BoxGeometry(
          Math.random() * 0.5 + 0.1,
          Math.random() * 0.2 + 0.1,
          Math.random() * 0.5 + 0.1
        ),
        new THREE.MeshLambertMaterial({
          color: [0x2f2f2f, 0x1a1a1a, 0x4a2c2c][Math.floor(Math.random() * 3)],
        })
      );

      debris.position.set(
        (Math.random() - 0.5) * 200,
        Math.random() * 0.1,
        (Math.random() - 0.5) * 200
      );
      debris.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      this.scene.add(debris);
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
    // Reduced ambient light for darker DOOM atmosphere
    const ambientLight = new THREE.AmbientLight(0x331111, 0.3);
    this.scene.add(ambientLight);

    // Main directional light with hellish orange tint
    const directionalLight = new THREE.DirectionalLight(0xff3300, 0.8);
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

    // Multiple hellish point lights for atmospheric lighting
    const hellLights: Array<{
      pos: [number, number, number];
      color: number;
      intensity: number;
    }> = [
      { pos: [-30, 8, -30], color: 0xff0000, intensity: 1.2 },
      { pos: [40, 12, 20], color: 0xff3300, intensity: 1.0 },
      { pos: [-15, 6, 35], color: 0xff6600, intensity: 0.8 },
      { pos: [25, 10, -40], color: 0xcc3300, intensity: 0.9 },
      { pos: [-45, 15, 10], color: 0xff4400, intensity: 1.1 },
    ];

    hellLights.forEach(({ pos, color, intensity }) => {
      const light = new THREE.PointLight(color, intensity, 40);
      light.position.set(pos[0], pos[1], pos[2]);
      this.scene.add(light);
    });

    // Add flickering fire lights
    this.createFlickeringLights();
  }

  private createFlickeringLights(): void {
    // Create flickering lights that simulate fire/lava
    for (let i = 0; i < 8; i++) {
      const fireLight = new THREE.PointLight(0xff4400, 0.8, 25);
      fireLight.position.set(
        (Math.random() - 0.5) * 150,
        Math.random() * 8 + 3,
        (Math.random() - 0.5) * 150
      );

      // Add flickering animation
      const originalIntensity = fireLight.intensity;
      setInterval(() => {
        fireLight.intensity = originalIntensity * (0.7 + Math.random() * 0.6);
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

    // Create hellish wall material with animated fire texture
    const wallMaterial = new THREE.MeshLambertMaterial({
      color: 0x1a0808, // Very dark red-black
      transparent: true,
      opacity: 0.95,
    });

    // Create glowing edge material for the top of walls
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xff3300,
      transparent: true,
      opacity: 0.6,
    });

    // North wall - positioned beyond movement boundary
    this.createHellWallSection(
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
      glowMaterial,
      0
    );

    // South wall - positioned beyond movement boundary
    this.createHellWallSection(
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
      glowMaterial,
      0
    );

    // East wall - positioned beyond movement boundary
    this.createHellWallSection(
      boundaryGroup,
      new THREE.Vector3(visualHalfSize, this.BOUNDARY_WALL_HEIGHT / 2, 0),
      new THREE.Vector3(
        this.BOUNDARY_WALL_THICKNESS,
        this.BOUNDARY_WALL_HEIGHT,
        this.BOUNDARY_SIZE + this.VISUAL_BOUNDARY_OFFSET * 2
      ),
      wallMaterial,
      glowMaterial,
      0
    );

    // West wall - positioned beyond movement boundary
    this.createHellWallSection(
      boundaryGroup,
      new THREE.Vector3(-visualHalfSize, this.BOUNDARY_WALL_HEIGHT / 2, 0),
      new THREE.Vector3(
        this.BOUNDARY_WALL_THICKNESS,
        this.BOUNDARY_WALL_HEIGHT,
        this.BOUNDARY_SIZE + this.VISUAL_BOUNDARY_OFFSET * 2
      ),
      wallMaterial,
      glowMaterial,
      0
    );

    // Add corner towers and reinforcements - also positioned at visual boundary
    this.createCornerTowers(boundaryGroup, visualHalfSize);

    // Add wall decorations and defensive structures - positioned between movement and visual boundaries
    this.addWallDecorations(boundaryGroup, halfSize, visualHalfSize);

    this.scene.add(boundaryGroup);
  }

  private createHellWallSection(
    parent: THREE.Group,
    position: THREE.Vector3,
    size: THREE.Vector3,
    wallMaterial: THREE.Material,
    glowMaterial: THREE.Material,
    rotation: number
  ): void {
    // Main wall structure
    const wallGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.copy(position);
    wall.rotation.y = rotation;
    wall.castShadow = true;
    wall.receiveShadow = true;
    parent.add(wall);

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

    // Add hellish texture details
    this.addWallTexture(parent, position, size, rotation);

    // Add wall damage and cracks
    this.addWallDamage(parent, position, size, rotation);
  }

  private addWallTexture(
    parent: THREE.Group,
    position: THREE.Vector3,
    size: THREE.Vector3,
    rotation: number
  ): void {
    // Add stone blocks pattern
    const blockCount = Math.floor(size.x / 3);
    for (let i = 0; i < blockCount; i++) {
      const blockGeometry = new THREE.BoxGeometry(2.8, 2, 0.3);
      const blockMaterial = new THREE.MeshLambertMaterial({
        color: [0x2a0a0a, 0x1a0505, 0x330808][Math.floor(Math.random() * 3)],
      });

      const block = new THREE.Mesh(blockGeometry, blockMaterial);
      block.position.copy(position);
      block.position.x += (i - blockCount / 2) * 3;
      block.position.z += rotation === 0 ? 0.2 : 0;
      block.position.x += rotation !== 0 ? 0.2 : 0;
      block.rotation.y = rotation;
      parent.add(block);
    }

    // Add hellish runes and symbols
    for (let i = 0; i < 3; i++) {
      const runeGeometry = new THREE.CircleGeometry(0.5, 6);
      const runeMaterial = new THREE.MeshBasicMaterial({
        color: 0xff3300,
        transparent: true,
        opacity: 0.8,
      });

      const rune = new THREE.Mesh(runeGeometry, runeMaterial);
      rune.position.copy(position);
      rune.position.x += (Math.random() - 0.5) * size.x * 0.8;
      rune.position.y += (Math.random() - 0.5) * size.y * 0.6;
      rune.position.z += rotation === 0 ? size.z / 2 + 0.1 : 0;
      rune.position.x += rotation !== 0 ? size.z / 2 + 0.1 : 0;
      rune.rotation.y = rotation + Math.PI / 2;
      parent.add(rune);

      // Add glow around runes
      const glowGeometry = new THREE.CircleGeometry(0.8, 8);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xff6600,
        transparent: true,
        opacity: 0.3,
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.copy(rune.position);
      glow.position.z -= 0.01;
      glow.rotation.copy(rune.rotation);
      parent.add(glow);
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

      // Torch light
      const torchLight = new THREE.PointLight(0xff4400, 1.5, 25);
      torchLight.position.set(0, 0.5, 0);
      torchGroup.add(torchLight);

      // Add flickering animation
      const originalIntensity = torchLight.intensity;
      setInterval(() => {
        torchLight.intensity = originalIntensity * (0.8 + Math.random() * 0.4);
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
}
