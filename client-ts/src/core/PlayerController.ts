import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { PlayerState, InputState } from "@/types/game";
import { SceneManager } from "./SceneManager";
import { CollisionSystem } from "../systems/CollisionSystem";

export class PlayerController {
  private camera: THREE.PerspectiveCamera | null = null;
  private controls: PointerLockControls | null = null;
  private velocity = new THREE.Vector3();
  private direction = new THREE.Vector3();
  private sceneManager: SceneManager | null = null;
  private lastEscapeTime = 0; // Prevent frequent escapes
  private readonly ESCAPE_COOLDOWN = 500; // 0.5 second cooldown between escapes (reduced for better responsiveness)
  private readonly MOVE_SPEED = 25; // Reduced speed to prevent collision tunneling

  // Jump physics properties
  private verticalVelocity = 0;
  private isOnGround = true;
  private readonly JUMP_SPEED = 12;
  private readonly GRAVITY = -30;
  private readonly GROUND_HEIGHT = 1.6;

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
    // Handle jump input
    if (this.inputState.jump && this.isOnGround) {
      this.verticalVelocity = this.JUMP_SPEED;
      this.isOnGround = false;
    }

    // Apply gravity
    this.verticalVelocity += this.GRAVITY * delta;

    // Reset horizontal velocity for direct movement
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

  private updatePosition(delta: number): void {
    if (!this.controls || !this.camera) return;

    // Store current position before movement
    const currentPos = this.controls.getObject().position.clone();

    // Calculate potential new position
    // Note: velocity.z is already negative for forward movement, so we add it directly
    const newPos = currentPos.clone();
    newPos.x += this.velocity.x;
    newPos.z += this.velocity.z;

    // Check for scene object collisions if SceneManager is available
    let canMove = true;
    let adjustedPos = newPos.clone();

    if (this.sceneManager) {
      const collisionSystem = this.sceneManager.getCollisionSystem();

      // First check if we're already in a collision state and need to escape
      // Use tolerance to allow slight overlaps
      const currentCollision = collisionSystem.checkCollisionWithTolerance(
        currentPos,
        0.1
      );
      if (currentCollision) {
        // Check if we can escape (not too frequent)
        const currentTime = performance.now();
        const canEscape =
          currentTime - this.lastEscapeTime > this.ESCAPE_COOLDOWN;

        if (canEscape) {
          // Player is stuck in an object, try to find escape direction
          const escapePos = this.findEscapePosition(
            currentPos,
            collisionSystem
          );
          if (escapePos) {
            // Directly set player position for escape
            this.controls.getObject().position.copy(escapePos);
            this.lastEscapeTime = currentTime;
            console.log("🆘 Escaping from collision to:", escapePos);
            this.notifyPositionChange(escapePos);
            return; // Skip normal movement processing
          } else {
            // Last resort: force teleport to a safe position
            const safePos = this.findSafePosition(collisionSystem);
            if (safePos) {
              this.controls.getObject().position.copy(safePos);
              this.lastEscapeTime = currentTime;
              console.log("🚨 Force teleporting to safe position:", safePos);
              this.notifyPositionChange(safePos);
              return; // Skip normal movement processing
            } else {
              // Absolute last resort: teleport to spawn point
              const spawnPos = new THREE.Vector3(0, 1.6, 20);
              this.controls.getObject().position.copy(spawnPos);
              this.lastEscapeTime = currentTime;
              console.log("🏠 Emergency teleport to spawn position:", spawnPos);
              this.notifyPositionChange(spawnPos);
              return; // Skip normal movement processing
            }
          }
        } else {
          // Too soon to escape again, just don't move
          canMove = false;
          console.log("⏳ Escape on cooldown, waiting...");
        }
      } else {
        // Normal movement collision checking with stepped movement
        const movementResult = this.checkSteppedMovement(
          currentPos,
          newPos,
          collisionSystem
        );

        if (!movementResult.canMove) {
          // Cannot move to new position due to collision
          canMove = false;
          console.log("🚧 Movement blocked by scene object collision");
        } else if (movementResult.adjustedPosition) {
          // Can move but position is adjusted (sliding along wall)
          adjustedPos = movementResult.adjustedPosition;
          console.log("🔄 Movement adjusted for collision sliding");
        }
      }
    }

    if (canMove) {
      // Apply movement (either original or adjusted position)
      const deltaX = adjustedPos.x - currentPos.x;
      const deltaZ = adjustedPos.z - currentPos.z;

      // Use PointerLockControls movement methods with calculated deltas
      // Note: PointerLockControls expects the movement values as they are
      this.controls.moveRight(deltaX);
      this.controls.moveForward(-deltaZ);
    }

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

    // Apply vertical movement and handle ground collision
    const newY = playerPos.y + this.verticalVelocity * delta;

    // Ground collision detection
    if (newY <= this.GROUND_HEIGHT) {
      playerPos.y = this.GROUND_HEIGHT;
      this.verticalVelocity = 0;
      this.isOnGround = true;
    } else {
      playerPos.y = Math.min(newY, 200); // Prevent flying too high
      this.isOnGround = false;
    }
  }

  /**
   * Find a position to escape from collision with progressive search
   */
  private findEscapePosition(
    currentPos: THREE.Vector3,
    collisionSystem: any
  ): THREE.Vector3 | null {
    // Progressive escape strategy: try different distances and patterns
    const escapeStrategies = [
      // Strategy 1: Medium steps in cardinal directions (increased distances)
      {
        directions: [
          new THREE.Vector3(1, 0, 0), // Right (+X)
          new THREE.Vector3(-1, 0, 0), // Left (-X)
          new THREE.Vector3(0, 0, 1), // Forward (+Z)
          new THREE.Vector3(0, 0, -1), // Backward (-Z)
        ],
        distances: [1.5, 3.0, 4.5, 6.0],
      },
      // Strategy 2: Large steps in cardinal directions
      {
        directions: [
          new THREE.Vector3(1, 0, 0), // Right
          new THREE.Vector3(-1, 0, 0), // Left
          new THREE.Vector3(0, 0, 1), // Forward
          new THREE.Vector3(0, 0, -1), // Backward
        ],
        distances: [7.0, 8.0, 9.0, 10.0],
      },
      // Strategy 3: Diagonal movements with larger distances
      {
        directions: [
          new THREE.Vector3(1, 0, 1).normalize(),
          new THREE.Vector3(-1, 0, 1).normalize(),
          new THREE.Vector3(1, 0, -1).normalize(),
          new THREE.Vector3(-1, 0, -1).normalize(),
        ],
        distances: [3.0, 5.0, 7.0, 9.0],
      },
      // Strategy 4: Random directions with larger distances
      {
        directions: this.generateRandomDirections(16),
        distances: [4.0, 6.0, 8.0, 12.0],
      },
    ];

    // Try each strategy
    for (const strategy of escapeStrategies) {
      for (const distance of strategy.distances) {
        for (const direction of strategy.directions) {
          const escapePos = currentPos
            .clone()
            .add(direction.clone().multiplyScalar(distance));
          if (!collisionSystem.checkCollision(escapePos)) {
            // Add direction name for better debugging
            let directionName = "Unknown";
            if (direction.x > 0) directionName = "Right(+X)";
            else if (direction.x < 0) directionName = "Left(-X)";
            else if (direction.z > 0) directionName = "Forward(+Z)";
            else if (direction.z < 0) directionName = "Backward(-Z)";

            console.log(
              `✅ Found escape route: distance ${distance}, direction: ${directionName}`,
              direction
            );
            console.log(
              `📍 From position:`,
              currentPos,
              `to position:`,
              escapePos
            );
            return escapePos;
          }
        }
      }
    }

    // Last resort: try moving upward slightly then back down
    const upwardEscape = currentPos.clone();
    upwardEscape.y += 2.0; // Move up
    if (!collisionSystem.checkCollision(upwardEscape)) {
      // Try to move back down to ground level
      for (let y = upwardEscape.y; y >= currentPos.y; y -= 0.2) {
        const testPos = upwardEscape.clone();
        testPos.y = Math.max(y, 1.6); // Don't go below ground
        if (!collisionSystem.checkCollision(testPos)) {
          console.log(
            `🚁 Found escape via upward movement at height ${testPos.y}`
          );
          return testPos;
        }
      }
    }

    console.log("❌ No escape route found with any strategy");
    return null;
  }

  /**
   * Generate random directions for escape attempts
   */
  private generateRandomDirections(count: number): THREE.Vector3[] {
    const directions: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      directions.push(new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)));
    }
    return directions;
  }

  /**
   * Notify external systems about position changes (for networking)
   */
  private notifyPositionChange(newPosition: THREE.Vector3): void {
    // Update player state
    this.playerState.position.copy(newPosition);

    // Force network position update if we have access to a game instance
    try {
      // Try to access global game instance for network sync
      const game = (window as any).game;
      if (game && game.networkManager && game.isMultiplayer) {
        game.networkManager.forcePositionUpdate(
          newPosition,
          this.camera?.rotation || new THREE.Euler()
        );
        console.log("📡 Forced network position update for escape");
      }
    } catch (error) {
      // Silently fail if network manager is not available
      console.log("📡 Network position update not available");
    }
  }

  /**
   * Find a completely safe position when normal escape fails
   */
  private findSafePosition(collisionSystem: any): THREE.Vector3 | null {
    // Try well-known safe positions in order of preference
    const safePositions = [
      new THREE.Vector3(0, 1.6, 20), // Default spawn
      new THREE.Vector3(0, 1.6, -20), // Opposite spawn
      new THREE.Vector3(20, 1.6, 0), // Right side
      new THREE.Vector3(-20, 1.6, 0), // Left side
      new THREE.Vector3(10, 1.6, 10), // Diagonal positions
      new THREE.Vector3(-10, 1.6, 10),
      new THREE.Vector3(10, 1.6, -10),
      new THREE.Vector3(-10, 1.6, -10),
      new THREE.Vector3(0, 3.0, 0), // Higher up in center
    ];

    for (const position of safePositions) {
      if (!collisionSystem.checkCollision(position)) {
        console.log("🏆 Found safe position:", position);
        return position;
      }
    }

    console.log("🔥 No safe positions found, this should never happen!");
    return null;
  }

  /**
   * Check movement with smaller steps to prevent tunneling
   */
  private checkSteppedMovement(
    fromPos: THREE.Vector3,
    toPos: THREE.Vector3,
    collisionSystem: any
  ): { canMove: boolean; adjustedPosition?: THREE.Vector3; hitObject?: any } {
    const movementVector = new THREE.Vector3().subVectors(toPos, fromPos);
    const movementDistance = movementVector.length();

    // If movement is very small, just check normally
    if (movementDistance < 0.1) {
      return collisionSystem.checkMovementCollision(fromPos, toPos);
    }

    // Use smaller steps for collision checking
    const stepSize = 0.2; // Small step size to prevent tunneling
    const steps = Math.ceil(movementDistance / stepSize);
    const stepVector = movementVector.clone().divideScalar(steps);

    let currentTestPos = fromPos.clone();

    // Check each step
    for (let i = 1; i <= steps; i++) {
      const nextTestPos = fromPos
        .clone()
        .add(stepVector.clone().multiplyScalar(i));

      const collision = collisionSystem.checkCollision(nextTestPos);
      if (collision) {
        // Hit something, try sliding from the last valid position
        const lastValidPos = currentTestPos.clone();
        const slidingResult = collisionSystem.checkMovementCollision(
          fromPos,
          lastValidPos
        );

        if (slidingResult.adjustedPosition) {
          return {
            canMove: true,
            adjustedPosition: slidingResult.adjustedPosition,
          };
        }

        return { canMove: false, hitObject: collision };
      }

      currentTestPos = nextTestPos.clone();
    }

    // No collision detected, movement is safe
    return { canMove: true };
  }

  public setCamera(camera: THREE.PerspectiveCamera): void {
    this.camera = camera;

    // If initialize() was already called, we need to setup controls now
    if (!this.controls) {
      this.setupPointerLockControls();
    }

    // 确保camera被正确添加到controls中
    if (this.controls) {
      // Get safe spawn position from scene manager if available
      let spawnPosition = new THREE.Vector3(0, 1.6, 20); // Default position

      if (this.sceneManager) {
        const safeSpawn = this.sceneManager.getSafeSpawnPosition();
        spawnPosition = safeSpawn.clone();
        // Adjust to head level (camera height)
        spawnPosition.y += 1.6; // Camera is at head level

        console.log(
          `🎯 Using safe spawn position: (${spawnPosition.x.toFixed(
            1
          )}, ${spawnPosition.y.toFixed(1)}, ${spawnPosition.z.toFixed(1)})`
        );
      }

      // 设置初始位置 - Head level camera position for proper FPS perspective
      this.controls.getObject().position.copy(spawnPosition);
      // 不要调用lookAt！PointerLockControls会管理摄像头旋转
    }
  }

  public reset(): void {
    if (this.controls) {
      // Get safe spawn position from scene manager if available
      let spawnPosition = new THREE.Vector3(0, 1.6, 20); // Default position

      if (this.sceneManager) {
        const safeSpawn = this.sceneManager.getSafeSpawnPosition();
        spawnPosition = safeSpawn.clone();
        // Adjust to head level (camera height)
        spawnPosition.y += 1.6; // Camera is at head level

        console.log(
          `🔄 Resetting to safe spawn position: (${spawnPosition.x.toFixed(
            1
          )}, ${spawnPosition.y.toFixed(1)}, ${spawnPosition.z.toFixed(1)})`
        );
      }

      // Reset to head level camera position
      this.controls.getObject().position.copy(spawnPosition);
      // 不要调用lookAt！PointerLockControls会管理摄像头旋转
    }
    this.velocity.set(0, 0, 0);
    this.direction.set(0, 0, 0);
    this.verticalVelocity = 0;
    this.isOnGround = true;
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
      // Get safe spawn position from scene manager if available
      let spawnPosition = new THREE.Vector3(0, 1.8, 0); // Default position

      if (this.sceneManager) {
        const safeSpawn = this.sceneManager.getSafeSpawnPosition();
        spawnPosition = safeSpawn.clone();
        // Adjust to head level (camera height)
        spawnPosition.y += 1.6; // Camera is at head level

        console.log(
          `🔄 Reset position to safe spawn: (${spawnPosition.x.toFixed(
            1
          )}, ${spawnPosition.y.toFixed(1)}, ${spawnPosition.z.toFixed(1)})`
        );
      }

      // Reset player to spawn position
      this.controls.getObject().position.copy(spawnPosition);
      this.playerState.position.copy(spawnPosition);
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
