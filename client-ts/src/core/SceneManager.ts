import * as THREE from "three";

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  private ground: THREE.Mesh | null = null;
  private sky: THREE.Mesh | null = null;
  private fog: THREE.Fog | null = null;

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
