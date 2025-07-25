import * as THREE from "three";

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  private ground: THREE.Mesh | null = null;
  private sky: THREE.Mesh | null = null;

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
    this.createGround();
    this.createSky();
    this.addLighting();
    this.addEnvironmentObjects();

    // Add renderer to DOM
    document.body.appendChild(this.renderer.domElement);
  }

  private setupRenderer(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x87ceeb);
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
    // 设置与原版JavaScript一致的摄像头位置
    this.camera.position.set(0, 1.8, 20);
    // 确保摄像头方向正确
    this.camera.lookAt(0, 1.8, 0);
    // 设置更安全的clip planes
    this.camera.near = 0.01;
    this.camera.far = 3000;
    this.camera.updateProjectionMatrix();

    // Clear color to match sky
    this.renderer.setClearColor(0x87ceeb, 1.0);
  }

  private createGround(): void {
    const groundGeometry = new THREE.PlaneGeometry(2000, 2000); // Much larger ground
    const groundMaterial = new THREE.MeshLambertMaterial({
      color: 0x4a4a4a,
      transparent: true,
      opacity: 0.8,
    });

    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.ground.position.y = 0; // Ensure ground is at y=0
    this.scene.add(this.ground);
  }

  private createSky(): void {
    const skyGeometry = new THREE.SphereGeometry(1500, 60, 40); // Even larger radius
    const skyMaterial = new THREE.MeshBasicMaterial({
      color: 0x87ceeb,
      side: THREE.BackSide, // Render inside of sphere
      depthWrite: false, // Prevent depth issues
      fog: false, // Disable fog for sky
    });

    this.sky = new THREE.Mesh(skyGeometry, skyMaterial);
    this.sky.renderOrder = -1000; // Render sky first with high priority
    this.sky.frustumCulled = false; // Never cull the sky
    this.scene.add(this.sky);

    // Skip gradient shader for now to avoid errors
    console.log("Sky created with basic material to prevent rendering errors");
  }

  private addLighting(): void {
    // Ambient light for general illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    // Directional light for shadows
    const directionalLight = new THREE.DirectionalLight(0xff6600, 1.0);
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

    // Hellish red point lights
    const redLight1 = new THREE.PointLight(0xff0000, 0.8, 30);
    redLight1.position.set(-20, 5, -20);
    this.scene.add(redLight1);

    const redLight2 = new THREE.PointLight(0xff4400, 0.6, 25);
    redLight2.position.set(25, 8, 15);
    this.scene.add(redLight2);
  }

  private addEnvironmentObjects(): void {
    // Add grid helper for better depth perception
    const gridHelper = new THREE.GridHelper(200, 100, 0x606060, 0x404040);
    (gridHelper.material as THREE.Material).opacity = 0.5;
    (gridHelper.material as THREE.Material).transparent = true;
    this.scene.add(gridHelper);

    // Create apocalyptic environment
    this.createBurnedBuildings();
    this.createAbandonedVehicles();
    this.createDeadTrees();
    this.createDebrisAndWreckage();
    this.createStreetLights();
    this.createBarricades();
  }

  private createBurnedBuildings(): void {
    for (let i = 0; i < 8; i++) {
      const width = 3 + Math.random() * 4;
      const height = 8 + Math.random() * 12;
      const depth = 3 + Math.random() * 4;

      const geometry = new THREE.BoxGeometry(width, height, depth);
      const material = new THREE.MeshLambertMaterial({
        color: 0x2a2a2a,
        transparent: true,
        opacity: 0.8,
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

      // Add broken windows
      for (let j = 0; j < 6; j++) {
        const windowGeometry = new THREE.BoxGeometry(0.5, 0.8, 0.1);
        const windowMaterial = new THREE.MeshBasicMaterial({
          color: 0x000000,
          transparent: true,
          opacity: 0.7,
        });
        const window = new THREE.Mesh(windowGeometry, windowMaterial);
        window.position.set(
          (Math.random() - 0.5) * width * 0.8,
          (Math.random() - 0.5) * height * 0.6,
          width / 2 + 0.05
        );
        building.add(window);
      }
    }
  }

  private createAbandonedVehicles(): void {
    for (let i = 0; i < 6; i++) {
      const carBody = new THREE.BoxGeometry(4, 1.5, 2);
      const material = new THREE.MeshLambertMaterial({
        color: [0x8b0000, 0x2f4f4f, 0x556b2f, 0x800000][
          Math.floor(Math.random() * 4)
        ],
      });

      const car = new THREE.Mesh(carBody, material);
      car.position.set(
        (Math.random() - 0.5) * 160,
        0.75,
        (Math.random() - 0.5) * 160
      );
      car.rotation.y = Math.random() * Math.PI * 2;
      car.castShadow = true;
      car.receiveShadow = true;

      this.scene.add(car);

      // Add wheels
      const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8);
      const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

      const positions: [number, number, number][] = [
        [-1.5, -0.3, 0.8],
        [1.5, -0.3, 0.8],
        [-1.5, -0.3, -0.8],
        [1.5, -0.3, -0.8],
      ];

      positions.forEach(([x, y, z]) => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.position.set(x, y, z);
        wheel.rotation.z = Math.PI / 2;
        car.add(wheel);
      });
    }
  }

  private createDeadTrees(): void {
    for (let i = 0; i < 15; i++) {
      const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 4, 8);
      const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x3d2914 });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);

      trunk.position.set(
        (Math.random() - 0.5) * 180,
        2,
        (Math.random() - 0.5) * 180
      );
      trunk.castShadow = true;
      trunk.receiveShadow = true;

      this.scene.add(trunk);

      // Add dead branches
      for (let j = 0; j < 5; j++) {
        const branchGeometry = new THREE.CylinderGeometry(0.05, 0.1, 1, 6);
        const branch = new THREE.Mesh(branchGeometry, trunkMaterial);
        branch.position.set(
          (Math.random() - 0.5) * 0.5,
          1.5 + Math.random() * 1.5,
          (Math.random() - 0.5) * 0.5
        );
        branch.rotation.z = (Math.random() - 0.5) * Math.PI;
        trunk.add(branch);
      }
    }
  }

  private createDebrisAndWreckage(): void {
    for (let i = 0; i < 20; i++) {
      const size = 0.5 + Math.random() * 2;
      const geometry = new THREE.BoxGeometry(size, size * 0.3, size * 0.8);
      const material = new THREE.MeshLambertMaterial({
        color: [0x666666, 0x8b4513, 0x2f4f4f, 0x708090][
          Math.floor(Math.random() * 4)
        ],
      });

      const debris = new THREE.Mesh(geometry, material);
      debris.position.set(
        (Math.random() - 0.5) * 190,
        size * 0.15,
        (Math.random() - 0.5) * 190
      );
      debris.rotation.set(
        (Math.random() - 0.5) * 0.5,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.5
      );
      debris.castShadow = true;
      debris.receiveShadow = true;

      this.scene.add(debris);
    }
  }

  private createStreetLights(): void {
    for (let i = 0; i < 8; i++) {
      const poleGeometry = new THREE.CylinderGeometry(0.1, 0.15, 6, 8);
      const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });
      const pole = new THREE.Mesh(poleGeometry, poleMaterial);

      pole.position.set(
        (Math.random() - 0.5) * 180,
        3,
        (Math.random() - 0.5) * 180
      );
      pole.castShadow = true;

      this.scene.add(pole);

      // Add broken light fixture
      const lightGeometry = new THREE.BoxGeometry(0.8, 0.3, 0.8);
      const lightMaterial = new THREE.MeshBasicMaterial({
        color: 0x2a2a2a,
        transparent: true,
        opacity: 0.6,
      });
      const light = new THREE.Mesh(lightGeometry, lightMaterial);
      light.position.y = 5.5;
      pole.add(light);
    }
  }

  private createBarricades(): void {
    for (let i = 0; i < 10; i++) {
      const barrierGeometry = new THREE.BoxGeometry(4, 1, 0.3);
      const barrierMaterial = new THREE.MeshLambertMaterial({
        color: 0x8b4513,
      });
      const barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);

      barrier.position.set(
        (Math.random() - 0.5) * 150,
        0.5,
        (Math.random() - 0.5) * 150
      );
      barrier.rotation.y = Math.random() * Math.PI * 2;
      barrier.castShadow = true;
      barrier.receiveShadow = true;

      this.scene.add(barrier);
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
