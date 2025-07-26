import * as THREE from "three";
import { SCENE_THEMES, type SceneThemeName, BaseSceneTheme } from "../themes";

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  private ground: THREE.Mesh | null = null;
  private sky: THREE.Mesh | null = null;
  private fog: THREE.Fog | null = null;

  // Current theme
  private currentTheme: BaseSceneTheme | null = null;

  // Ground texture management
  private groundTexturesEnabled: boolean = true;

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
      0.1, // Increased near clip plane to reduce Z-fighting
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

  public async initialize(themeName?: SceneThemeName): Promise<void> {
    // Clear any existing theme
    this.clearCurrentScene();

    // Select theme (random if not specified)
    const selectedTheme = themeName || this.getRandomTheme();
    console.log(`Initializing scene with ${selectedTheme} theme`);

    // Create theme instance
    const ThemeClass = SCENE_THEMES[selectedTheme];
    this.currentTheme = new ThemeClass(this.scene);

    // Initialize scene using theme
    this.currentTheme.createAtmosphere();
    this.ground = this.currentTheme.createGround();
    this.scene.add(this.ground);

    this.sky = this.currentTheme.createSky();
    this.scene.add(this.sky);

    this.currentTheme.addLighting();
    this.createBoundaryWalls();
    this.currentTheme.addEnvironmentObjects();

    if (this.groundTexturesEnabled) {
      this.currentTheme.addGroundDetails();
    }

    // Add renderer to DOM if not already added
    if (!document.body.contains(this.renderer.domElement)) {
      document.body.appendChild(this.renderer.domElement);
    }
  }

  private clearCurrentScene(): void {
    // Clear all objects from scene except camera
    const objectsToRemove: THREE.Object3D[] = [];
    this.scene.traverse((object) => {
      if (object !== this.camera) {
        objectsToRemove.push(object);
      }
    });

    objectsToRemove.forEach((object) => {
      this.scene.remove(object);
      // Dispose of geometry and materials
      if (object instanceof THREE.Mesh) {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((mat) => mat.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
    });

    // Clear current theme
    if (this.currentTheme) {
      this.currentTheme.clearAll();
      this.currentTheme = null;
    }

    // Reset fog
    this.scene.fog = null;

    // Reset ground and sky references
    this.ground = null;
    this.sky = null;
  }

  private getRandomTheme(): SceneThemeName {
    const themes = Object.keys(SCENE_THEMES) as SceneThemeName[];
    return themes[Math.floor(Math.random() * themes.length)]!;
  }

  public switchTheme(themeName: SceneThemeName): Promise<void> {
    return this.initialize(themeName);
  }

  public getCurrentTheme(): BaseSceneTheme | null {
    return this.currentTheme;
  }

  public getAvailableThemes(): SceneThemeName[] {
    return Object.keys(SCENE_THEMES) as SceneThemeName[];
  }

  private setupRenderer(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    // Default clear color (will be overridden by theme)
    this.renderer.setClearColor(0x000000);
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
    this.camera.near = 0.1; // Increased near clip to reduce Z-fighting
    this.camera.far = 3000;
    this.camera.updateProjectionMatrix();
  }

  // Keep the existing boundary wall system since it's game-specific
  private createBoundaryWalls(): void {
    // Set clear color based on current theme
    if (this.currentTheme) {
      const config = this.currentTheme.getConfig();
      this.renderer.setClearColor(config.primaryColor);
    }

    const boundaryGroup = new THREE.Group();
    const halfSize = this.BOUNDARY_SIZE / 2;
    // Visual walls are positioned further out than the movement boundary
    const visualHalfSize = halfSize + this.VISUAL_BOUNDARY_OFFSET;

    // Get theme colors
    const config = this.currentTheme?.getConfig();
    const wallColor = config?.secondaryColor || 0x333333;
    const accentColor = config?.accentColor || 0x666666;

    // Create enhanced wall material with theme colors
    const wallMaterial = new THREE.MeshLambertMaterial({
      color: wallColor,
      transparent: true,
      opacity: 0.25,
    });

    // Create accent material
    const accentMaterial = new THREE.MeshLambertMaterial({
      color: accentColor,
      transparent: true,
      opacity: 0.35,
    });

    // Create glowing edge material
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: config?.glowColor || 0xff3300,
      transparent: true,
      opacity: 0.45,
    });

    // North wall - positioned beyond movement boundary
    this.createWallSection(
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
      accentMaterial,
      glowMaterial,
      0
    );

    // South wall
    this.createWallSection(
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
      accentMaterial,
      glowMaterial,
      0
    );

    // East wall
    this.createWallSection(
      boundaryGroup,
      new THREE.Vector3(visualHalfSize, this.BOUNDARY_WALL_HEIGHT / 2, 0),
      new THREE.Vector3(
        this.BOUNDARY_WALL_THICKNESS,
        this.BOUNDARY_WALL_HEIGHT,
        this.BOUNDARY_SIZE + this.VISUAL_BOUNDARY_OFFSET * 2
      ),
      wallMaterial,
      accentMaterial,
      glowMaterial,
      0
    );

    // West wall
    this.createWallSection(
      boundaryGroup,
      new THREE.Vector3(-visualHalfSize, this.BOUNDARY_WALL_HEIGHT / 2, 0),
      new THREE.Vector3(
        this.BOUNDARY_WALL_THICKNESS,
        this.BOUNDARY_WALL_HEIGHT,
        this.BOUNDARY_SIZE + this.VISUAL_BOUNDARY_OFFSET * 2
      ),
      wallMaterial,
      accentMaterial,
      glowMaterial,
      0
    );

    // Add corner towers
    this.createCornerTowers(
      boundaryGroup,
      visualHalfSize,
      wallMaterial,
      accentMaterial,
      glowMaterial
    );

    this.scene.add(boundaryGroup);
  }

  private createWallSection(
    parent: THREE.Group,
    position: THREE.Vector3,
    size: THREE.Vector3,
    wallMaterial: THREE.Material,
    accentMaterial: THREE.Material,
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

    // Add accent strips
    for (let i = 0; i < 3; i++) {
      const stripGeometry = new THREE.BoxGeometry(
        Math.abs(rotation) < 0.1 ? size.x * 1.01 : 0.1,
        0.3,
        Math.abs(rotation) < 0.1 ? 0.1 : size.z * 1.01
      );
      const strip = new THREE.Mesh(stripGeometry, accentMaterial);

      strip.position.copy(position);
      strip.position.y += (i - 1) * (size.y / 4);

      if (Math.abs(rotation) < 0.1) {
        strip.position.z +=
          position.z > 0 ? -size.z / 2 - 0.15 : size.z / 2 + 0.15;
      } else {
        strip.position.x +=
          position.x > 0 ? -size.x / 2 - 0.15 : size.x / 2 + 0.15;
      }

      strip.castShadow = true;
      parent.add(strip);
    }
  }

  private createCornerTowers(
    parent: THREE.Group,
    visualHalfSize: number,
    wallMaterial: THREE.Material,
    accentMaterial: THREE.Material,
    glowMaterial: THREE.Material
  ): void {
    const towerPositions = [
      new THREE.Vector3(visualHalfSize, 0, visualHalfSize), // Northeast
      new THREE.Vector3(-visualHalfSize, 0, visualHalfSize), // Northwest
      new THREE.Vector3(visualHalfSize, 0, -visualHalfSize), // Southeast
      new THREE.Vector3(-visualHalfSize, 0, -visualHalfSize), // Southwest
    ];

    towerPositions.forEach((pos) => {
      const towerGroup = new THREE.Group();

      // Main tower structure
      const towerGeometry = new THREE.CylinderGeometry(
        4,
        6,
        this.BOUNDARY_WALL_HEIGHT + 5,
        8
      );
      const tower = new THREE.Mesh(towerGeometry, wallMaterial);
      tower.position.set(pos.x, (this.BOUNDARY_WALL_HEIGHT + 5) / 2, pos.z);
      tower.castShadow = true;
      tower.receiveShadow = true;
      towerGroup.add(tower);

      // Tower beacon
      const beaconGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
      const beacon = new THREE.Mesh(beaconGeometry, glowMaterial);
      beacon.position.set(pos.x, this.BOUNDARY_WALL_HEIGHT + 8, pos.z);
      towerGroup.add(beacon);

      // Beacon light
      const beaconLight = new THREE.PointLight(
        this.currentTheme?.getConfig().glowColor || 0xff3300,
        2.0,
        50
      );
      beaconLight.position.set(pos.x, this.BOUNDARY_WALL_HEIGHT + 8, pos.z);
      towerGroup.add(beaconLight);

      parent.add(towerGroup);
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

    if (this.currentTheme) {
      if (enabled) {
        // Re-add ground textures
        this.currentTheme.addGroundDetails();
      } else {
        // Remove ground textures
        this.currentTheme.clearAll();
      }
    }

    console.log(`Ground textures ${enabled ? "enabled" : "disabled"}`);
  }

  /**
   * Get current ground texture state
   */
  public getGroundTexturesEnabled(): boolean {
    return this.groundTexturesEnabled;
  }
}
