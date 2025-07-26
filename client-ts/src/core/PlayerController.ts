import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { PlayerState, InputState } from "@/types/game";

export class PlayerController {
  private camera: THREE.PerspectiveCamera | null = null;
  private controls: PointerLockControls | null = null;
  private velocity = new THREE.Vector3();
  private direction = new THREE.Vector3();

  private readonly MOVE_SPEED = 400;

  constructor(
    private playerState: PlayerState,
    private inputState: InputState
  ) {}

  public async initialize(): Promise<void> {
    // Camera should be set before calling initialize
    if (this.camera) {
      this.setupPointerLockControls();
    }
  }

  private setupPointerLockControls(): void {
    if (!this.camera) {
      console.warn("⚠️ Camera not found, cannot initialize controls yet");
      return;
    }

    // Create pointer lock controls
    this.controls = new PointerLockControls(this.camera, document.body);

    // Add event listeners for pointer lock
    this.controls.addEventListener("lock", () => {
      console.log("🔒 Pointer lock acquired");
      this.inputState.isMouseLocked = true;

      // 隐藏菜单，显示游戏UI
      const mainMenu = document.getElementById("mainMenu");
      const gameUI = document.getElementById("gameUI");
      if (mainMenu) mainMenu.style.display = "none";
      if (gameUI) gameUI.style.display = "block";
    });

    this.controls.addEventListener("unlock", () => {
      console.log("🔓 Pointer lock released");
      this.inputState.isMouseLocked = false;
    });

    // 添加controls对象到场景中，而不是camera
    // 这样camera的位置将由controls管理
  }

  public update(deltaTime: number): void {
    if (!this.camera || !this.controls) return;

    const delta = deltaTime / 1000; // Convert to seconds

    this.updateMovement(delta);
    this.updatePosition(delta);

    // Update player state
    this.playerState.position.copy(this.camera.position);
    this.playerState.rotation.copy(this.camera.rotation);
  }

  private updateMovement(delta: number): void {
    // Reset velocity for direct movement
    this.velocity.set(0, 0, 0);

    // Calculate movement direction based on input
    if (this.inputState.moveForward) {
      this.velocity.z = -this.MOVE_SPEED * delta;
    }
    if (this.inputState.moveBackward) {
      this.velocity.z = this.MOVE_SPEED * delta;
    }
    if (this.inputState.moveLeft) {
      this.velocity.x = -this.MOVE_SPEED * delta;
    }
    if (this.inputState.moveRight) {
      this.velocity.x = this.MOVE_SPEED * delta;
    }

    // Normalize diagonal movement
    if (this.velocity.x !== 0 && this.velocity.z !== 0) {
      this.velocity.multiplyScalar(0.707); // Math.sqrt(0.5) for diagonal movement
    }
  }

  private updatePosition(_delta: number): void {
    if (!this.controls || !this.camera) return;

    // Use PointerLockControls movement methods
    // 注意：这里不需要乘以delta，因为velocity已经包含了delta
    this.controls.moveRight(this.velocity.x);
    this.controls.moveForward(-this.velocity.z);

    // Keep player within game boundaries
    const playerPos = this.controls.getObject().position;
    const boundary = 900; // Match larger 2000x2000 ground size

    // Clamp X position
    if (playerPos.x > boundary) {
      playerPos.x = boundary;
    } else if (playerPos.x < -boundary) {
      playerPos.x = -boundary;
    }

    // Clamp Z position
    if (playerPos.z > boundary) {
      playerPos.z = boundary;
    } else if (playerPos.z < -boundary) {
      playerPos.z = -boundary;
    }

    // Keep camera above ground with better height management
    const minHeight = 1.6; // Slightly lower for better ground clearance
    const maxHeight = 200; // Prevent flying too high
    playerPos.y = Math.max(minHeight, Math.min(maxHeight, playerPos.y));
  }

  public setCamera(camera: THREE.PerspectiveCamera): void {
    this.camera = camera;

    // If initialize() was already called, we need to setup controls now
    if (!this.controls) {
      this.setupPointerLockControls();
    }

    // 确保camera被正确添加到controls中
    if (this.controls) {
      // 设置初始位置
      this.controls.getObject().position.set(0, 1.8, 20);
      // 不要调用lookAt！PointerLockControls会管理摄像头旋转
    }
  }

  public reset(): void {
    if (this.controls) {
      this.controls.getObject().position.set(0, 1.8, 20);
      // 不要调用lookAt！PointerLockControls会管理摄像头旋转
    }
    this.velocity.set(0, 0, 0);
    this.direction.set(0, 0, 0);
  }

  public getCamera(): THREE.PerspectiveCamera | null {
    return this.camera;
  }

  public getControls(): PointerLockControls | null {
    return this.controls;
  }

  public getVelocity(): THREE.Vector3 {
    return this.velocity;
  }

  public getPosition(): THREE.Vector3 {
    return this.controls?.getObject().position.clone() || new THREE.Vector3();
  }

  public getDirection(): THREE.Vector3 {
    if (!this.camera) return new THREE.Vector3(0, 0, -1);

    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(this.camera.quaternion);
    return direction;
  }
}
