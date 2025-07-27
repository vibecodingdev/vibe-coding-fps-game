import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { PlayerState, InputState } from "@/types/game";
import { SceneManager } from "./SceneManager";

export class PlayerController {
  private camera: THREE.PerspectiveCamera | null = null;
  private controls: PointerLockControls | null = null;
  private velocity = new THREE.Vector3();
  private direction = new THREE.Vector3();
  private sceneManager: SceneManager | null = null;

  private readonly MOVE_SPEED = 100;

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

    // Check if Pointer Lock API is available
    if (!document.body.requestPointerLock) {
      console.warn("⚠️ Pointer Lock API not available in this browser");
      return;
    }

    try {
      // Create pointer lock controls
      this.controls = new PointerLockControls(this.camera, document.body);
    } catch (error) {
      console.error("❌ Failed to create PointerLockControls:", error);
      return;
    }

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

      // Check if we should show pause menu or add relock listener
      this.handlePointerUnlock();
    });

    // 添加controls对象到场景中，而不是camera
    // 这样camera的位置将由controls管理
  }

  private addRelockClickListener(): void {
    // Only add relock listener if we're still in playing state
    const game = (window as any).game;
    if (!game || game.getGameState() !== "playing") {
      console.log("🚫 Not adding relock listener - not in game state");
      return;
    }

    const relockHandler = (event: MouseEvent) => {
      event.preventDefault();

      // Double-check game state when clicked
      if (game.getGameState() !== "playing") {
        console.log("🚫 Ignoring relock attempt - not in game state");
        document.removeEventListener("click", relockHandler);
        return;
      }

      if (this.controls && !this.controls.isLocked) {
        console.log("🔒 Attempting to re-lock pointer...");
        try {
          this.controls.lock();
        } catch (error) {
          console.warn("⚠️ Failed to re-lock pointer:", error);
        }
      }

      // Remove this specific listener after one use
      document.removeEventListener("click", relockHandler);
    };

    // Add the click listener
    document.addEventListener("click", relockHandler);

    // Auto-remove after 10 seconds if not used
    setTimeout(() => {
      document.removeEventListener("click", relockHandler);
    }, 10000);
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

    // Keep player within game boundaries using SceneManager's boundary system
    const playerPos = this.controls.getObject().position;

    if (this.sceneManager) {
      // Use SceneManager's boundary system with camera offset consideration
      const cameraOffset = 1.5; // Account for camera distance from player center
      const adjustedBoundarySize =
        this.sceneManager.BOUNDARY_SIZE - cameraOffset * 2;
      const halfSize = adjustedBoundarySize / 2;

      // Clamp position with camera offset consideration
      playerPos.x = Math.max(-halfSize, Math.min(halfSize, playerPos.x));
      playerPos.z = Math.max(-halfSize, Math.min(halfSize, playerPos.z));

      // Check if player hit a boundary and provide feedback
      if (
        Math.abs(playerPos.x) >= halfSize - 1 ||
        Math.abs(playerPos.z) >= halfSize - 1
      ) {
        // Player is close to boundary wall
        console.log("🚧 Player near boundary wall");
      }
    } else {
      // Fallback to smaller boundary system if SceneManager not available
      const boundary = 45; // Match client's boundary system

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

  public resetPosition(): void {
    if (this.controls) {
      // Reset player to spawn position
      this.controls.getObject().position.set(0, 1.8, 0);
      this.playerState.position.set(0, 1.8, 0);
      console.log("🔄 Player position reset to spawn");
    }
  }

  public getDirection(): THREE.Vector3 {
    if (!this.camera) return new THREE.Vector3(0, 0, -1);

    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(this.camera.quaternion);
    return direction;
  }

  public setSceneManager(sceneManager: SceneManager): void {
    this.sceneManager = sceneManager;
  }

  private handlePointerUnlock(): void {
    // Get the current game state from global window object
    const game = (window as any).game;
    if (game && game.getGameState() === "playing") {
      // If in game, show pause menu automatically when pointer is unlocked
      console.log("🎮 Pointer unlocked during game - showing pause menu");
      setTimeout(() => {
        if (game.getGameState() === "playing") {
          game.pauseGame();
        }
      }, 50); // Small delay to ensure proper state handling
    } else {
      // If not in game or no game instance, don't add relock listener
      console.log("🔓 Pointer unlocked outside of game - no relock");
    }
  }

  public resetPointerLockState(): void {
    // Remove any existing click event listeners that might try to relock
    // This is called when returning to main menu to prevent unwanted pointer locking
    console.log("🔄 Resetting pointer lock state");

    // Note: We can't easily remove specific listeners without references,
    // but the addRelockClickListener already has auto-cleanup timeouts
    // The main protection is in handlePointerUnlock() checking game state
  }
}
