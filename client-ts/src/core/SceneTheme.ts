import * as THREE from "three";
import { CollisionSystem } from "../systems/CollisionSystem";

export interface SceneThemeConfig {
  name: string;
  primaryColor: number;
  secondaryColor: number;
  fogColor: number;
  ambientLightColor: number;
  directionalLightColor: number;
  fillLightColor: number;
  groundColor: number;
  skyColor: number;
  glowColor: number;
  accentColor: number;
}

export abstract class BaseSceneTheme {
  protected scene: THREE.Scene;
  protected config: SceneThemeConfig;
  protected groundTextureObjects: THREE.Object3D[] = [];
  protected collisionSystem: CollisionSystem;

  constructor(scene: THREE.Scene, config: SceneThemeConfig) {
    this.scene = scene;
    this.config = config;
    this.collisionSystem = CollisionSystem.getInstance();
  }

  abstract createAtmosphere(): void;
  abstract createGround(): THREE.Mesh;
  abstract createSky(): THREE.Mesh;
  abstract addLighting(): void;
  abstract addEnvironmentObjects(): void;
  abstract addGroundDetails(): void;

  // Common utility methods
  protected addGroundTextureObject(object: THREE.Object3D): void {
    this.scene.add(object);
    this.groundTextureObjects.push(object);
  }

  /**
   * Add a collidable object to both the scene and collision system
   */
  protected addCollidableObject(
    object: THREE.Object3D,
    type: "static" | "interactive" | "decorative" = "static",
    customBoundingBox?: THREE.Box3,
    onCollision?: (player: THREE.Vector3) => void
  ): void {
    this.scene.add(object);
    this.collisionSystem.addCollidableObject(
      object,
      type,
      customBoundingBox,
      onCollision
    );
  }

  /**
   * Get all collidable objects from the collision system
   */
  public getCollidableObjects(): any[] {
    return this.collisionSystem.getCollidableObjects();
  }

  protected clearGroundTextures(): void {
    this.groundTextureObjects.forEach((obj) => {
      this.scene.remove(obj);
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

  protected createFlickeringLight(
    position: THREE.Vector3,
    color: number,
    intensity: number,
    range: number
  ): THREE.PointLight {
    const light = new THREE.PointLight(color, intensity, range);
    light.position.copy(position);

    // Add flickering animation
    const originalIntensity = light.intensity;
    setInterval(() => {
      light.intensity = originalIntensity * (0.8 + Math.random() * 0.4);
    }, Math.floor(100 + Math.random() * 200));

    return light;
  }

  protected createParticleSystem(
    count: number,
    color: number,
    size: number,
    opacity: number
  ): THREE.Points {
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 1000;
      positions[i + 1] = Math.random() * 200 + 50;
      positions[i + 2] = (Math.random() - 0.5) * 1000;
    }

    particles.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color,
      size,
      transparent: true,
      opacity,
    });

    return new THREE.Points(particles, particleMaterial);
  }

  public getConfig(): SceneThemeConfig {
    return this.config;
  }

  public clearAll(): void {
    this.clearGroundTextures();
    // Clear collision objects when theme is cleared
    this.collisionSystem.clearAll();
  }
}
