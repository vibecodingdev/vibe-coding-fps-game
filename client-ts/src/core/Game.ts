import * as THREE from "three";
import { GameState, GameStats, PlayerState, InputState } from "@/types/game";
import { SceneManager } from "@/core/SceneManager";
import { PlayerController } from "@/core/PlayerController";
import { WeaponSystem } from "@/systems/WeaponSystem";
import { DemonSystem } from "@/systems/DemonSystem";
import { AudioSystem } from "@/systems/AudioSystem";
import { NetworkManager } from "@/systems/NetworkManager";
import { UIManager } from "@/systems/UIManager";
import { CollectibleSystem } from "@/systems/CollectibleSystem";
import { StateManager } from "@/core/StateManager";
import { GAME_CONFIG } from "@/config/game";
import { type SceneThemeName } from "@/themes";

export class Game {
  private static instance: Game | null = null;

  private gameState: GameState = "mainMenu";
  private gameInitialized = false;
  private isMultiplayer = false;
  private isDead = false;
  private respawnCountdown = 0;
  private respawnTimer: NodeJS.Timeout | null = null;

  // Core systems
  private sceneManager!: SceneManager;
  private playerController!: PlayerController;
  private weaponSystem!: WeaponSystem;
  private demonSystem!: DemonSystem;
  private networkDemons: THREE.Group[] = []; // Separate array for network demons
  private audioSystem!: AudioSystem;
  private networkManager!: NetworkManager;
  private uiManager!: UIManager;
  private collectibleSystem!: CollectibleSystem;

  // Game state
  private playerState!: PlayerState;
  private gameStats!: GameStats;
  // 使用StateManager管理inputState，避免引用断开
  private stateManager = StateManager.getInstance();

  // Animation
  private animationId: number | null = null;
  private prevTime = performance.now();

  // Wave tracking for multiplayer
  public currentWaveStats = {
    totalDemons: 0,
    demonsRemaining: 0,
    waveNumber: 1,
  };

  private constructor() {
    this.initializeState();
    this.initializeSystems();
  }

  public static getInstance(): Game {
    if (!Game.instance) {
      Game.instance = new Game();
    }
    return Game.instance;
  }

  private initializeState(): void {
    this.playerState = {
      health: GAME_CONFIG.MAX_HEALTH,
      position: new THREE.Vector3(0, 1.8, 0),
      rotation: new THREE.Euler(0, 0, 0),
      isAlive: true,
      lastDamageTime: 0,
    };

    this.gameStats = {
      demonKills: 0,
      currentWave: 1,
      score: 0,
      accuracy: 0,
      startTime: Date.now(),
    };

    // inputState现在由StateManager管理，确保引用一致性
  }

  private initializeSystems(): void {
    this.sceneManager = SceneManager.getInstance();
    this.playerController = new PlayerController(
      this.playerState,
      this.stateManager.getInputState()
    );
    this.weaponSystem = new WeaponSystem();
    this.demonSystem = new DemonSystem();
    this.audioSystem = AudioSystem.getInstance();
    // Use singleton NetworkManager to ensure consistent state
    this.networkManager = NetworkManager.getInstance();
    this.uiManager = UIManager.getInstance();
    this.collectibleSystem = new CollectibleSystem();
  }

  public async initialize(themeName?: SceneThemeName): Promise<void> {
    if (this.gameInitialized) return;

    try {
      // Initialize all systems with optional theme
      await this.sceneManager.initialize(themeName);

      // Get scene and camera first
      const scene = this.sceneManager.getScene();
      const camera = this.sceneManager.getCamera();

      // Set camera for player controller BEFORE initializing it
      this.playerController.setCamera(camera as THREE.PerspectiveCamera);
      // Connect PlayerController with SceneManager for boundary enforcement
      this.playerController.setSceneManager(this.sceneManager);
      await this.playerController.initialize();

      // Initialize other systems
      await this.weaponSystem.initialize();
      await this.demonSystem.initialize();
      await this.audioSystem.initialize();
      await this.networkManager.initialize();
      await this.uiManager.initialize();
      await this.collectibleSystem.initialize();

      // Add controls to scene
      const controls = this.playerController.getControls();
      if (controls) {
        scene.add(controls.getObject());
        console.log("✅ Controls object added to scene");
      }

      // Connect weapon and demon systems
      this.weaponSystem.setScene(scene);
      this.weaponSystem.setCamera(camera);
      this.weaponSystem.setAudioSystem(this.audioSystem);
      this.weaponSystem.setNetworkManager(this.networkManager);
      this.demonSystem.setScene(scene);
      this.demonSystem.setSceneManager(this.sceneManager);
      this.demonSystem.setAudioSystem(this.audioSystem);
      this.collectibleSystem.setScene(scene);

      // Connect audio system
      this.audioSystem.setCamera(camera);

      // Store camera reference in scene for demon system
      scene.userData = { camera };

      // Setup event listeners
      this.setupEventListeners();

      this.gameInitialized = true;
      console.log("🎮 Game initialized successfully");
    } catch (error) {
      console.error("Failed to initialize game:", error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    // Input events
    document.addEventListener("keydown", this.onKeyDown.bind(this));
    document.addEventListener("keyup", this.onKeyUp.bind(this));
    document.addEventListener("mousedown", this.onMouseDown.bind(this));
    document.addEventListener("mouseup", this.onMouseUp.bind(this));

    // Window events
    window.addEventListener("resize", this.onWindowResize.bind(this));
    window.addEventListener("beforeunload", this.onBeforeUnload.bind(this));
  }

  public async startGame(
    isMultiplayer = false,
    themeName?: SceneThemeName
  ): Promise<void> {
    this.isMultiplayer = isMultiplayer;
    this.gameState = "playing";
    this.resetGameState();

    // For single player, use random theme if not specified
    if (!isMultiplayer && !themeName) {
      const availableThemes = this.sceneManager.getAvailableThemes();
      themeName =
        availableThemes[Math.floor(Math.random() * availableThemes.length)];
      console.log(`🎨 Selected random theme for single player: ${themeName}`);
    }

    // Switch to the selected theme if different from current
    if (themeName) {
      await this.sceneManager.switchTheme(themeName);
      console.log(`🎮 Started game with ${themeName} theme`);
    }

    this.startGameLoop();

    if (isMultiplayer) {
      this.networkManager.joinGame();
    }

    this.audioSystem.startBackgroundMusic();
    this.demonSystem.startWaveSystem();

    // 自动锁定鼠标
    this.autoLockPointer();
  }

  public pauseGame(): void {
    if (this.gameState === "playing") {
      this.gameState = "paused";

      // Release pointer lock
      if (this.playerController.getControls()?.isLocked) {
        document.exitPointerLock();
      }

      // Set body to menu mode to allow scrolling in pause menu
      document.body.className = "menu-mode";

      // Show pause menu
      const pauseMenu = document.getElementById("pauseMenu");

      if (pauseMenu) {
        pauseMenu.style.display = "flex";
        this.setupPauseMenuListeners();
      }

      console.log("⏸️ Game paused");
    }
  }

  public resumeGame(): void {
    if (this.gameState === "paused") {
      this.gameState = "playing";

      // Set body back to game mode to prevent scrolling
      document.body.className = "game-mode";

      // Hide pause menu
      const pauseMenu = document.getElementById("pauseMenu");
      if (pauseMenu) {
        pauseMenu.style.display = "none";
      }

      console.log("▶️ Game resumed");

      // Add click listener to re-acquire pointer lock
      this.addPointerLockListener();
    }
  }

  private setupPauseMenuListeners(): void {
    const resumeBtn = document.getElementById("resumeBtn");
    const restartBtn = document.getElementById("restartBtn");
    const mainMenuBtn = document.getElementById("mainMenuBtn");

    if (resumeBtn) {
      resumeBtn.onclick = () => this.resumeGame();
    }

    if (restartBtn) {
      restartBtn.onclick = () => {
        this.restartWave();
        this.resumeGame();
      };
    }

    if (mainMenuBtn) {
      mainMenuBtn.onclick = () => {
        this.returnToMainMenu();
      };
    }

    // Setup ground texture toggle
    this.uiManager.setupGroundTextureToggle(this.sceneManager);
  }

  private addPointerLockListener(): void {
    const clickHandler = () => {
      const controls = this.playerController.getControls();
      if (controls && !controls.isLocked && this.gameState === "playing") {
        controls.lock();
      }
      document.removeEventListener("click", clickHandler);
    };

    document.addEventListener("click", clickHandler);

    // Auto-remove listener after 5 seconds if not used
    setTimeout(() => {
      document.removeEventListener("click", clickHandler);
    }, 5000);
  }

  private autoLockPointer(): void {
    // 延迟一小段时间后自动锁定鼠标，确保游戏UI已经显示
    setTimeout(() => {
      const controls = this.playerController.getControls();
      if (controls && !controls.isLocked && this.gameState === "playing") {
        console.log("🔒 Auto-locking pointer...");
        try {
          controls.lock();
        } catch (error) {
          console.warn("⚠️ Auto pointer lock failed:", error);
          console.log("💡 User needs to click to enable pointer lock");
          this.addPointerLockListener();
        }
      }
    }, 100); // 100ms delay to ensure UI is ready
  }

  private restartWave(): void {
    // Reset demons
    this.demonSystem.reset();

    // Reset player position
    this.playerState.position.set(0, 1.8, 0);
    this.playerState.health = GAME_CONFIG.MAX_HEALTH;

    // Force position update for multiplayer after respawn
    if (this.isMultiplayer && this.networkManager) {
      const camera = this.sceneManager.getCamera();
      if (camera) {
        this.networkManager.forcePositionUpdate(
          camera.position,
          camera.rotation
        );
        console.log("🔄 Forced position update after wave restart");
      }
    }

    // Reset weapon
    this.weaponSystem.reset();

    console.log("🔄 Wave restarted");
  }

  public endGame(): void {
    console.log("💀 Game Over!");
    this.gameState = "gameOver";
    this.stopGameLoop();
    this.audioSystem.stopBackgroundMusic();

    // Reset demon system to stop wave spawning
    this.demonSystem.waveInProgress = false;

    // Update final stats in UI
    this.uiManager.updateGameOverStats(this.gameStats);

    // Show game over screen after a brief delay
    setTimeout(() => {
      this.uiManager.showGameOver();

      // Exit pointer lock
      if (document.exitPointerLock) {
        document.exitPointerLock();
      }
    }, 1000);

    if (this.isMultiplayer) {
      this.networkManager.leaveGame();
      this.setMultiplayerMode(false);
    }
  }

  public resetGameState(): void {
    this.initializeState();
    this.stateManager.resetInputState(); // 重置输入状态但保持引用
    this.weaponSystem.reset();
    this.demonSystem.reset();
    this.playerController.reset();
  }

  public returnToMainMenu(): void {
    console.log("🏠 Returning to main menu...");

    // Stop the game loop first to prevent issues
    this.stopGameLoop();

    // Change game state
    this.gameState = "mainMenu";

    // Stop background music
    this.audioSystem.stopBackgroundMusic();

    // Exit pointer lock and reset controls state
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }

    // Reset pointer lock controls state to prevent relock attempts
    const controls = this.playerController.getControls();
    if (controls) {
      this.playerController.resetPointerLockState();
    }

    // If in multiplayer, leave the game
    if (this.isMultiplayer) {
      this.networkManager.leaveGame();
      this.setMultiplayerMode(false);
    }

    // Set body to menu mode to allow scrolling
    document.body.className = "menu-mode";

    // Hide the 3D renderer canvas
    this.sceneManager.hideRenderer();

    // Hide all game UI elements with more thorough cleanup
    const pauseMenu = document.getElementById("pauseMenu");
    const gameUI = document.getElementById("gameUI");
    const gameOverScreen = document.getElementById("gameOverScreen");

    if (pauseMenu) {
      pauseMenu.style.display = "none";
      console.log("✅ Pause menu hidden");
    }
    if (gameUI) {
      gameUI.style.display = "none";
      console.log("✅ Game UI hidden");
    }
    if (gameOverScreen) {
      gameOverScreen.style.display = "none";
      console.log("✅ Game over screen hidden");
    }

    // Reset game state
    this.resetGameState();

    // Hide multiplayer room info if present
    this.uiManager.hideRoomInfo();

    // Show main menu with a small delay to ensure proper cleanup
    setTimeout(() => {
      this.uiManager.showMainMenu();

      // Double-check that main menu is visible
      const mainMenu = document.getElementById("mainMenu");
      if (mainMenu) {
        console.log("✅ Main menu element found and should be visible");
        console.log("Main menu display style:", mainMenu.style.display);
        console.log(
          "Main menu computed style display:",
          window.getComputedStyle(mainMenu).display
        );
        console.log(
          "Main menu z-index:",
          window.getComputedStyle(mainMenu).zIndex
        );
      } else {
        console.error("❌ Main menu element not found!");
      }
    }, 100);

    console.log("✅ Successfully returned to main menu");
  }

  public restartGame(): void {
    console.log("🔄 Restarting game...");

    // Reset all game systems
    this.resetGameState();

    // Reset game state
    this.gameState = "playing";

    // Start game loop
    this.startGameLoop();

    // Hide all menus
    const gameOverScreen = document.getElementById("gameOverScreen");
    const pauseMenu = document.getElementById("pauseMenu");
    const mainMenu = document.getElementById("mainMenu");

    if (gameOverScreen) gameOverScreen.style.display = "none";
    if (pauseMenu) pauseMenu.style.display = "none";
    if (mainMenu) mainMenu.style.display = "none";

    // Set body to game mode
    document.body.className = "game-mode";

    // Show the 3D renderer canvas
    this.sceneManager.showRenderer();

    // Show game UI
    const gameUI = document.getElementById("gameUI");
    if (gameUI) {
      gameUI.style.display = "block";
    }

    // Lock pointer for controls
    const blocker = document.getElementById("blocker");
    if (blocker) {
      blocker.style.display = "none";
    }

    // Start background music
    this.audioSystem.startBackgroundMusic();

    console.log("✅ Game restarted successfully");
  }

  // 通过StateManager访问inputState
  private get inputState(): InputState {
    return this.stateManager.getInputState();
  }

  private startGameLoop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.animate();
  }

  private stopGameLoop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public isGameLoopRunning(): boolean {
    return this.animationId !== null;
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());

    const currentTime = performance.now();
    const deltaTime = currentTime - this.prevTime;
    this.prevTime = currentTime;

    this.update(deltaTime);
    this.render();
  }

  private update(deltaTime: number): void {
    if (this.gameState === "playing") {
      this.playerController.update(deltaTime);
      this.weaponSystem.update(deltaTime);
      this.demonSystem.update(deltaTime);

      // Also update network demons through the DemonSystem
      if (this.isMultiplayer && this.networkDemons.length > 0) {
        // Pass network demons to DemonSystem for AI processing
        this.networkDemons.forEach((networkDemon) => {
          if (
            networkDemon &&
            networkDemon.userData &&
            !networkDemon.userData.isDead &&
            !networkDemon.userData.markedForRemoval
          ) {
            // Use DemonSystem's updateDemonAI for network demons
            this.demonSystem.updateDemonAI(networkDemon, deltaTime);
          }
        });

        // Clean up dead network demons immediately
        const scene = this.sceneManager.getScene();
        this.networkDemons = this.networkDemons.filter((demon) => {
          if (demon && demon.userData) {
            // Remove demons that are dead or marked for removal
            if (
              demon.userData.isDead ||
              demon.userData.markedForRemoval ||
              demon.userData.serverHealth <= 0
            ) {
              scene.remove(demon);
              console.log(
                `🧹 Cleaned up dead network demon: ${demon.userData.serverId}`
              );
              return false;
            }
          }
          return true;
        });
      }

      this.collectibleSystem.update(deltaTime);
      this.checkCollisions();
      this.updateGameStats();

      // 更新武器位置
      const camera = this.sceneManager.getCamera();
      if (this.weaponSystem.updateWeaponPosition) {
        this.weaponSystem.updateWeaponPosition(camera);
      }

      // 更新UI系统
      this.updateUI();
    }

    if (this.isMultiplayer) {
      this.networkManager.update(deltaTime);
    }

    this.audioSystem.update(deltaTime);
    this.uiManager.update(deltaTime);
  }

  private updateUI(): void {
    // 更新血量条
    this.uiManager.updateHealth(this.playerState);

    // 更新武器信息
    const currentWeapon =
      this.weaponSystem.weapons[this.weaponSystem.currentWeapon];
    const weaponState = this.weaponSystem.getCurrentWeaponState();
    this.uiManager.updateWeaponInfo({
      name: currentWeapon.name,
      emoji: currentWeapon.emoji,
      currentAmmo: weaponState.currentAmmo,
      maxAmmo: currentWeapon.maxAmmo,
    });

    // 更新游戏统计
    this.uiManager.updateGameStats(this.gameStats);

    // 更新雷达 - 显示所有活着的怪物（本地和网络）
    const aliveDemoms = (this.demonSystem.demons || []).filter((demon) => {
      // Handle DemonInstance type - single player demons
      if ((demon as any).mesh) {
        const demonInstance = demon as any;
        return (
          demonInstance.state !== "dead" &&
          demonInstance.mesh.userData &&
          !demonInstance.mesh.userData.markedForRemoval &&
          !demonInstance.mesh.userData.isDead
        );
      }
      return false;
    });

    // Add network demons to radar
    const aliveNetworkDemons = (this.networkDemons || []).filter((demon) => {
      // THREE.Group type - multiplayer server demons (direct mesh objects)
      if (demon && demon.userData) {
        return (
          !demon.userData.markedForRemoval &&
          !demon.userData.isDead &&
          demon.userData.serverHealth > 0
        );
      }
      return false;
    });

    // Combine both local and network demons for radar
    const allAliveDemons = [...aliveDemoms, ...aliveNetworkDemons];

    const camera = this.sceneManager.getCamera();
    if (camera) {
      // 获取远程玩家信息（如果是多人游戏）
      const remotePlayers = this.isMultiplayer
        ? this.networkManager.remotePlayers
        : undefined;

      // Only log radar update info occasionally to avoid spam
      if (Date.now() % 5000 < 16) {
        // Approximately every 5 seconds
        console.log(`🗺️ Updating radar:`, {
          isMultiplayer: this.isMultiplayer,
          remotePlayersCount: remotePlayers?.size || 0,
          remotePlayerIds: remotePlayers
            ? Array.from(remotePlayers.keys())
            : [],
          demonsCount: allAliveDemons.length,
        });
      }

      // 使用相机的实时位置而不是playerState.position
      this.uiManager.updateRadar(
        camera.position,
        allAliveDemons,
        camera,
        remotePlayers
      );
    }
  }

  private render(): void {
    this.sceneManager.render();

    // Update FPS counter
    this.uiManager.updateFPS();
  }

  private checkCollisions(): void {
    // Check bullet-demon collisions for both single player and network demons
    this.weaponSystem.getBullets().forEach((bullet) => {
      const allDemons = this.getAllDemons();
      const hitDemon = this.demonSystem.checkBulletCollision(bullet, allDemons);
      if (hitDemon) {
        this.weaponSystem.removeBullet(bullet.id);
        this.onDemonHit(hitDemon, bullet.damage);
        return; // Bullet already removed, skip other checks
      }

      // Check bullet-player collisions in multiplayer mode
      if (this.isMultiplayer && this.networkManager) {
        const hitPlayer = this.checkBulletPlayerCollision(bullet);
        if (hitPlayer) {
          this.weaponSystem.removeBullet(bullet.id);
          this.onPlayerHit(hitPlayer, bullet.damage, bullet.weaponType);
        }
      }
    });

    // Check player-demon collisions and attacks
    // Use real-time camera position instead of stale playerState.position
    const playerPosition = this.playerController.getPosition();

    // Get all nearby demons (both local and network)
    const allDemons = this.getAllDemons();
    const nearbyDemons = allDemons.filter((demon) => {
      let demonPosition: THREE.Vector3;
      let isDead = false;

      // Handle both DemonInstance and THREE.Group objects
      if (demon.mesh) {
        // DemonInstance (local demon)
        demonPosition = demon.position;
        isDead = demon.state === "dead";
      } else if (demon.userData) {
        // THREE.Group (network demon)
        demonPosition = demon.position;
        isDead = demon.userData.isDead;
      } else {
        return false;
      }

      if (isDead) return false;
      return playerPosition.distanceTo(demonPosition) <= 2;
    });

    nearbyDemons.forEach((demon) => {
      // Handle both DemonInstance and direct THREE.Group objects
      let isAttacking = false;
      let demonType = "";
      let meshObject: THREE.Object3D;

      if (demon.mesh) {
        // DemonInstance structure (single-player)
        isAttacking =
          demon.state === "attacking" && demon.mesh.userData?.isAttacking;
        demonType = demon.type;
        meshObject = demon.mesh;
      } else if ((demon as any).userData) {
        // Direct THREE.Group object (multiplayer)
        const demonMesh = demon as any;
        isAttacking = demonMesh.userData?.isAttacking;
        demonType = demonMesh.userData?.demonType || "IMP";
        meshObject = demonMesh;
      } else {
        return; // Invalid demon object
      }

      // Check distance to ensure demon is close enough to attack
      const distance = playerPosition.distanceTo(meshObject.position);
      const attackRange = meshObject.userData?.attackRange || 3.5;

      // Only take damage if demon is attacking, close enough, and we can take damage
      if (isAttacking && distance <= attackRange && this.canTakeDamage()) {
        this.takeDamage(demonType);

        // Reset demon attack state to prevent continuous damage
        meshObject.userData.isAttacking = false;

        // Also reset demon state for DemonInstance
        if (demon.mesh) {
          demon.state = "idle";
        }

        console.log(
          `🩸 Player damaged by ${demonType} at distance ${distance.toFixed(2)}`
        );
      }
    });

    // Check fireball-player collisions
    const hitFireball = this.demonSystem.checkFireballCollision(playerPosition);
    if (hitFireball && this.canTakeDamage()) {
      // Take fireball damage
      this.takeDamageFromFireball(hitFireball);

      // Remove the fireball that hit us
      this.demonSystem.removeFireball(hitFireball);

      console.log(`🔥 Player hit by fireball! Damage: ${hitFireball.damage}`);
    }

    // Check player-collectible collisions (reuse existing playerPosition)
    const collectibleCollision =
      this.collectibleSystem.checkPlayerCollision(playerPosition);
    if (collectibleCollision.type) {
      this.onCollectiblePickup(collectibleCollision);
    }
  }

  private onCollectiblePickup(collision: {
    type: "health" | "ammo" | null;
    id: string | null;
    value: number;
  }): void {
    if (!collision.id || !collision.type) return;

    // Check if we can benefit from this pickup
    if (
      collision.type === "health" &&
      this.playerState.health >= GAME_CONFIG.MAX_HEALTH
    ) {
      return; // Skip if health is already full
    }

    if (collision.type === "ammo" && !this.weaponSystem.canBenefitFromAmmo()) {
      return; // Skip if ammo is already full
    }

    const collected = this.collectibleSystem.collectItem(collision.id);
    if (!collected) return;

    if (collision.type === "health") {
      const oldHealth = this.playerState.health;
      this.playerState.health = Math.min(
        GAME_CONFIG.MAX_HEALTH,
        this.playerState.health + collision.value
      );
      const actualHealing = this.playerState.health - oldHealth;

      if (actualHealing > 0) {
        console.log(
          `💉 Healed ${actualHealing} HP! Health: ${this.playerState.health}/${GAME_CONFIG.MAX_HEALTH}`
        );
        // Play health pack sound
        this.audioSystem.playHealthPackSound();

        // Update UI to reflect health change
        this.uiManager.updateHealth(this.playerState);
      }
    } else if (collision.type === "ammo") {
      // Refill ammo using WeaponSystem method
      const refillResult = this.weaponSystem.refillAmmo(collision.value);

      if (refillResult.totalRefilled > 0) {
        const refillText = refillResult.details.join(" + ");
        console.log(`🔋 Energy cell collected! Refilled ${refillText}`);
        // Play ammo pack sound
        this.audioSystem.playAmmoPackSound();

        // Update UI to reflect ammo changes
        const currentWeapon = this.weaponSystem.currentWeapon;
        const weaponState = this.weaponSystem.weaponStates[currentWeapon];
        const weaponConfig = this.weaponSystem.weapons[currentWeapon];

        this.uiManager.updateWeaponInfo({
          name: weaponConfig.name,
          currentAmmo: weaponState.currentAmmo,
          maxAmmo: weaponConfig.maxAmmo,
          emoji: weaponConfig.emoji,
        });
      }
    }
  }

  private checkBulletPlayerCollision(bullet: any): string | null {
    if (!this.networkManager) return null;

    const bulletPosition = bullet.mesh.position;

    // Check collision with remote players
    for (const [playerId, playerInfo] of this.networkManager.remotePlayers) {
      const playerPosition = playerInfo.mesh.position;
      const distance = bulletPosition.distanceTo(playerPosition);

      // Hit threshold for players (larger than demons since players are bigger)
      if (distance < 1.5) {
        return playerId;
      }
    }

    return null;
  }

  private onPlayerHit(
    playerId: string,
    damage: number,
    weaponType: string
  ): void {
    console.log(
      `🎯 Player ${playerId} hit for ${damage} damage with ${weaponType}`
    );

    // Send damage event to server for synchronization
    if (this.networkManager) {
      this.networkManager.sendPlayerDamage(playerId, damage, weaponType);
    }

    // Create hit effect on the player
    const playerInfo = this.networkManager.remotePlayers.get(playerId);
    if (playerInfo) {
      this.createHitEffect(playerInfo.mesh.position);

      // Add some visual feedback (temporary red tint effect)
      this.createPlayerHitEffect(playerInfo.mesh);
    }
  }

  private createPlayerHitEffect(playerMesh: THREE.Group): void {
    // Create a temporary red overlay effect
    const hitEffect = new THREE.SphereGeometry(1.5, 8, 6);
    const hitMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.3,
    });
    const hitSphere = new THREE.Mesh(hitEffect, hitMaterial);
    hitSphere.position.copy(playerMesh.position);

    const scene = this.sceneManager.getScene();
    scene.add(hitSphere);

    // Remove effect after short duration
    setTimeout(() => {
      scene.remove(hitSphere);
    }, 200);
  }

  public takeDamageFromPlayer(
    damage: number,
    attackerName: string,
    weaponType: string
  ): void {
    if (!this.playerState.isAlive || this.isDead) return;

    this.playerState.health -= damage;
    this.playerState.health = Math.max(0, this.playerState.health);
    this.playerState.lastDamageTime = Date.now();

    console.log(
      `💥 Took ${damage} damage from ${attackerName} (${this.playerState.health} HP left)`
    );

    // Show damage effect
    this.createDamageEffect();

    // Check if player died
    if (this.playerState.health <= 0) {
      this.onPlayerDeath(attackerName, weaponType);
    }
  }

  private createDamageEffect(): void {
    // Add screen shake or red flash effect
    if (this.uiManager) {
      this.uiManager.showDamageIndicator();
    }
  }

  private onPlayerDeath(killerName: string, weaponType: string): void {
    this.isDead = true;
    this.playerState.isAlive = false;
    this.playerState.health = 0;

    console.log(`💀 You were killed by ${killerName} with ${weaponType}`);

    // Release pointer lock immediately when player dies
    if (document.exitPointerLock) {
      document.exitPointerLock();
      console.log("🔓 Released pointer lock on player death");
    }

    // Show death screen with countdown
    this.showDeathScreen(killerName, weaponType);

    // Start respawn countdown after a small delay to ensure UI is ready
    setTimeout(() => {
      console.log("🎬 Starting respawn countdown...");
      this.startRespawnCountdown();
    }, 200);
  }

  private showDeathScreen(killerName: string, weaponType: string): void {
    if (this.uiManager) {
      this.uiManager.showDeathScreen(killerName, weaponType, () => {
        console.log("🚪 Quit to main menu button clicked");
        this.quitToMainMenu();
      });
    }
  }

  private quitToMainMenu(): void {
    // Clear any running timers
    if (this.respawnTimer) {
      clearInterval(this.respawnTimer);
      this.respawnTimer = null;
    }

    // Reset death state
    this.isDead = false;
    this.respawnCountdown = 0;

    // Hide death screen
    if (this.uiManager) {
      this.uiManager.hideDeathScreen();
    }

    // Return to main menu
    this.returnToMainMenu();

    console.log("🚪 Returned to main menu from death screen");
  }

  private startRespawnCountdown(): void {
    this.respawnCountdown = 5; // 5 seconds

    if (this.respawnTimer) {
      clearInterval(this.respawnTimer);
    }

    console.log("🕒 Starting respawn countdown from 5 seconds");

    this.respawnTimer = setInterval(() => {
      this.respawnCountdown--;
      console.log(`⏱️ Respawn countdown: ${this.respawnCountdown} seconds`);

      if (this.uiManager) {
        this.uiManager.updateRespawnCountdown(this.respawnCountdown);
      }

      if (this.respawnCountdown <= 0) {
        console.log("✅ Respawn countdown complete - enabling button");
        this.enableRespawnButton();
        if (this.respawnTimer) {
          clearInterval(this.respawnTimer);
          this.respawnTimer = null;
        }
      }
    }, 1000);
  }

  private enableRespawnButton(): void {
    if (this.uiManager) {
      this.uiManager.enableRespawnButton(() => {
        this.respawnPlayer();
      });
    }
  }

  public respawnPlayer(): void {
    if (!this.isDead) return;

    // Reset player state
    this.isDead = false;
    this.playerState.isAlive = true;
    this.playerState.health = 100;
    this.playerState.position.set(0, 1.8, 0);

    // Reset weapon ammo
    this.weaponSystem.reset();

    // Send respawn event to server if in multiplayer
    if (this.isMultiplayer && this.networkManager) {
      this.networkManager.sendPlayerRespawn();
    }

    // Hide death screen
    if (this.uiManager) {
      this.uiManager.hideDeathScreen();
    }

    // Hide pause menu if it's showing and set game state to playing
    const pauseMenu = document.getElementById("pauseMenu");
    if (pauseMenu) {
      pauseMenu.style.display = "none";
      console.log("✅ Pause menu hidden on respawn");
    }

    // Set game state to playing
    this.gameState = "playing";

    // Set body back to game mode to prevent scrolling
    document.body.className = "game-mode";

    // Show game UI
    const gameUI = document.getElementById("gameUI");
    if (gameUI) {
      gameUI.style.display = "block";
    }

    // Reset player position in the world
    this.playerController.resetPosition();

    // Auto-lock mouse pointer after a small delay
    setTimeout(() => {
      this.autoLockPointer();
      console.log("🔒 Auto-locking pointer for respawn");
    }, 100);

    console.log("🔄 You have respawned!");
  }

  private onDemonHit(demonId: string, damage: number): void {
    // Check if this is a network demon first
    const networkDemon = this.networkDemons.find(
      (d) => d.userData?.serverId === demonId
    );

    if (networkDemon) {
      console.log(
        `🎯 Network demon hit: ${demonId}, damage: ${damage}, health: ${networkDemon.userData?.serverHealth}`
      );
      // Network demon - apply damage locally for immediate visual feedback
      if (networkDemon.userData) {
        networkDemon.userData.serverHealth -= damage;
        if (networkDemon.userData.serverHealth <= 0) {
          console.log(
            `💀 Network demon killed: ${demonId}, checking multiplayer conditions:`,
            {
              isMultiplayer: this.isMultiplayer,
              isConnected: this.networkManager.isConnected,
            }
          );
          // Demon killed - emit proper death event to server (matching old client)
          if (this.isMultiplayer) {
            // Debug connection status before sending
            console.log("🔍 NetworkManager instance check:", {
              isGlobal: this.networkManager === window.networkManager,
              gameNMId: this.networkManager.constructor.name,
              globalNMId: window.networkManager?.constructor.name,
            });
            this.networkManager.debugConnectionStatus();

            console.log(
              `🎯 Sending demon death to server: ${demonId} (type: ${networkDemon.userData.demonType})`
            );
            this.networkManager.sendDemonDeath(demonId);
          } else {
            console.warn(
              `❌ Cannot send demon death - not in multiplayer mode`
            );
          }

          // Mark as dead immediately for local client feedback
          networkDemon.userData.isDead = true;
          networkDemon.userData.markedForRemoval = true;
          networkDemon.userData.serverHealth = 0;

          // Add visual death effects locally
          this.createHitEffect(networkDemon.position);
          this.createWoundedEffect(networkDemon.position);

          // Update local stats immediately (server will sync with all players)
          this.gameStats.demonKills++;
          this.gameStats.score += 100;
          this.audioSystem.playDemonDeathSound();
        } else {
          // Demon hit but not killed - just play hit sound
          this.audioSystem.playDemonHitSound();
        }
      }
    } else {
      // Single player demon - handle locally
      const killed = this.demonSystem.damageDemon(demonId, damage);
      if (killed) {
        this.gameStats.demonKills++;
        this.gameStats.score += 100;
        this.audioSystem.playDemonDeathSound();
      } else {
        this.audioSystem.playDemonHitSound();
      }
    }
  }

  private takeDamage(demonType: string): void {
    const damage = this.demonSystem.getDemonDamage(demonType);
    this.playerState.health = Math.max(0, this.playerState.health - damage);
    this.playerState.lastDamageTime = performance.now();

    // Show damage effect
    this.uiManager.showDamageEffect();

    console.log(
      `🩸 Player took ${damage} damage from ${demonType}. Health: ${this.playerState.health}`
    );

    if (this.playerState.health <= 0) {
      this.playerState.isAlive = false;
      this.isDead = true;

      // Show death screen with respawn option instead of ending game
      this.onPlayerDeath("Demon", demonType);
      console.log("💀 Player died from demon attack - showing respawn screen");
    }
  }

  private takeDamageFromFireball(fireball: any): void {
    const damage = fireball.damage;
    this.playerState.health = Math.max(0, this.playerState.health - damage);
    this.playerState.lastDamageTime = performance.now();

    // Show enhanced damage effect for fireball
    this.uiManager.showDamageEffect(true);

    // Play fireball damage sound
    this.audioSystem.playDemonAttackSound("ARCHVILE");

    console.log(
      `🔥 Player took ${damage} fireball damage! Health: ${this.playerState.health}`
    );

    if (this.playerState.health <= 0) {
      this.playerState.isAlive = false;
      this.isDead = true;

      // Show death screen with respawn option instead of ending game
      this.onPlayerDeath("Archvile", "Demon Fireball");
      console.log(
        "💀 Player died from fireball attack - showing respawn screen"
      );
    }
  }

  private canTakeDamage(): boolean {
    const now = performance.now();
    return (
      now - this.playerState.lastDamageTime >
      GAME_CONFIG.DAMAGE_INVULNERABILITY_TIME
    );
  }

  private updateGameStats(): void {
    const shotsHit = this.weaponSystem.getShotsHit();
    const totalShots = this.weaponSystem.getTotalShots();
    this.gameStats.accuracy =
      totalShots > 0 ? (shotsHit / totalShots) * 100 : 0;
  }

  // Input handlers
  private onKeyDown(event: KeyboardEvent): void {
    if (this.gameState !== "playing") return;

    switch (event.code) {
      case "KeyW":
      case "ArrowUp":
        this.inputState.moveForward = true;
        break;
      case "KeyS":
      case "ArrowDown":
        this.inputState.moveBackward = true;
        break;
      case "KeyA":
      case "ArrowLeft":
        this.inputState.moveLeft = true;
        break;
      case "KeyD":
      case "ArrowRight":
        this.inputState.moveRight = true;
        break;
      case "Space":
        event.preventDefault();
        this.weaponSystem.shoot();
        break;
      case "KeyR":
        this.weaponSystem.reload();
        break;
      case "Digit1":
        this.weaponSystem.switchWeapon("shotgun");
        break;
      case "Digit2":
        this.weaponSystem.switchWeapon("chaingun");
        break;
      case "Digit3":
        this.weaponSystem.switchWeapon("rocket");
        break;
      case "Digit4":
        this.weaponSystem.switchWeapon("plasma");
        break;
      case "Escape":
        this.pauseGame();
        break;
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    switch (event.code) {
      case "KeyW":
      case "ArrowUp":
        this.inputState.moveForward = false;
        break;
      case "KeyS":
      case "ArrowDown":
        this.inputState.moveBackward = false;
        break;
      case "KeyA":
      case "ArrowLeft":
        this.inputState.moveLeft = false;
        break;
      case "KeyD":
      case "ArrowRight":
        this.inputState.moveRight = false;
        break;
    }
  }

  private onMouseDown(event: MouseEvent): void {
    if (this.gameState === "playing" && event.button === 0) {
      this.weaponSystem.startAutoFire();
    }
  }

  private onMouseUp(event: MouseEvent): void {
    if (event.button === 0) {
      this.weaponSystem.stopAutoFire();
    }
  }

  private onWindowResize(): void {
    this.sceneManager.onResize();
  }

  private onBeforeUnload(): void {
    if (this.isMultiplayer) {
      this.networkManager.disconnect();
    }
  }

  // Getters
  public getGameState(): GameState {
    return this.gameState;
  }

  public getPlayerState(): PlayerState {
    return { ...this.playerState };
  }

  public getGameStats(): GameStats {
    return { ...this.gameStats };
  }

  public getSceneManager(): SceneManager {
    return this.sceneManager;
  }

  public getWeaponSystem(): WeaponSystem {
    return this.weaponSystem;
  }

  public getDemonSystem(): DemonSystem {
    return this.demonSystem;
  }

  public getAudioSystem(): AudioSystem {
    return this.audioSystem;
  }

  // Additional public interface methods for multiplayer support
  public getUIManager(): UIManager {
    return this.uiManager;
  }

  public getNetworkManager(): NetworkManager {
    return this.networkManager;
  }

  public getPlayerController(): PlayerController {
    return this.playerController;
  }

  public getCollectibleSystem(): CollectibleSystem {
    return this.collectibleSystem;
  }

  public getScene(): THREE.Scene | null {
    return this.sceneManager.getScene();
  }

  public getCamera(): THREE.Camera | null {
    return this.sceneManager.getCamera();
  }

  public getRenderer(): THREE.WebGLRenderer | null {
    return this.sceneManager.getRenderer();
  }

  public getControls(): any {
    return this.playerController.getControls();
  }

  // Game state management for multiplayer
  public setGameState(state: GameState): void {
    this.gameState = state;
  }

  public setMultiplayerMode(isMultiplayer: boolean): void {
    this.demonSystem.setMultiplayerMode(isMultiplayer);
    if (isMultiplayer) {
      // Clear any existing local demons when entering multiplayer
      this.demonSystem.reset();
      console.log(
        "🌐 Switched to multiplayer mode - local demon spawning disabled"
      );
    } else {
      // Clear network demons when leaving multiplayer
      this.clearNetworkDemons();
      console.log(
        "🎮 Switched to single player mode - local demon spawning enabled"
      );
    }
  }

  public getMultiplayerMode(): boolean {
    return this.isMultiplayer;
  }

  // Effect creation methods for multiplayer events
  public createHitEffect(position: THREE.Vector3): void {
    // Create hit effect particles
    const particleCount = 20;
    const particles = new THREE.Group();

    for (let i = 0; i < particleCount; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.05, 4, 4);
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.5 ? 0xff0000 : 0xff4400,
      });
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);

      particle.position.copy(position);
      particle.position.add(
        new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        )
      );

      particles.add(particle);
    }

    const scene = this.getScene();
    if (scene) {
      scene.add(particles);

      // Remove particles after animation
      setTimeout(() => {
        scene.remove(particles);
      }, 1000);
    }
  }

  public createWoundedEffect(position: THREE.Vector3): void {
    // Create wounded effect
    const woundedGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const woundedMaterial = new THREE.MeshBasicMaterial({
      color: 0x8b0000,
      transparent: true,
      opacity: 0.7,
    });
    const woundedEffect = new THREE.Mesh(woundedGeometry, woundedMaterial);
    woundedEffect.position.copy(position);

    const scene = this.getScene();
    if (scene) {
      scene.add(woundedEffect);

      // Animate and remove
      let opacity = 0.7;
      const fadeInterval = setInterval(() => {
        opacity -= 0.05;
        woundedMaterial.opacity = opacity;
        woundedEffect.scale.multiplyScalar(1.05);

        if (opacity <= 0) {
          scene.remove(woundedEffect);
          clearInterval(fadeInterval);
        }
      }, 50);
    }
  }

  // Kill count management
  public incrementKillCount(): void {
    this.gameStats.demonKills++;
    this.uiManager.updateGameStats(this.gameStats);
  }

  public updatePlayerHealth(health: number): void {
    this.playerState.health = Math.max(0, Math.min(100, health));
    this.uiManager.updateHealth(this.playerState);
  }

  public getPlayerHealth(): number {
    return this.playerState.health;
  }

  public getPlayerPosition(): THREE.Vector3 {
    const controls = this.getControls();
    if (controls && controls.getObject) {
      return controls.getObject().position.clone();
    }
    return new THREE.Vector3(0, 0, 0);
  }

  public getPlayerRotation(): THREE.Euler {
    const controls = this.getControls();
    if (controls && controls.getObject) {
      return controls.getObject().rotation.clone();
    }
    return new THREE.Euler(0, 0, 0);
  }

  // Weapon management for multiplayer
  public getCurrentWeapon(): any {
    return this.weaponSystem.getCurrentWeapon();
  }

  public switchWeapon(weaponType: any): void {
    this.weaponSystem.switchWeapon(weaponType);
  }

  // Remote player management
  public addRemotePlayer(playerData: any): THREE.Group | null {
    const scene = this.getScene();
    if (scene && this.networkManager) {
      return this.networkManager.createRemotePlayer(playerData, scene);
    }
    return null;
  }

  public removeRemotePlayer(playerId: string): void {
    const scene = this.getScene();
    if (scene && this.networkManager) {
      this.networkManager.removeRemotePlayer(playerId, scene);
    }
  }

  public clearRemotePlayers(): void {
    const scene = this.getScene();
    if (scene && this.networkManager) {
      this.networkManager.clearRemotePlayers(scene);
    }
  }

  // Demon management for multiplayer
  public getDemons(): any[] {
    return this.demonSystem.demons;
  }

  public addDemon(demon: any): void {
    // For compatibility with multiplayer system
    // Check if this is already a THREE.Group with userData (server demon)
    if (demon && demon.userData) {
      // This is a server demon (THREE.Group), add directly to the demons array
      this.demonSystem.demons.push(demon);
    } else {
      // This might be a DemonInstance, extract the mesh
      const meshToAdd = demon.mesh || demon;
      this.demonSystem.demons.push(meshToAdd);
    }
  }

  public addNetworkDemon(demon: THREE.Group): void {
    // Add network demon to separate array to avoid conflicts with single player demons
    this.networkDemons.push(demon);
    console.log(
      `👹 Added network demon: ${demon.userData?.serverId}, type: ${demon.userData?.demonType}`
    );
  }

  public getNetworkDemons(): THREE.Group[] {
    return this.networkDemons;
  }

  public getAllDemons(): any[] {
    // Return combined array for collision detection - single player DemonInstances and network THREE.Groups
    return [...this.demonSystem.demons, ...this.networkDemons];
  }

  public removeNetworkDemon(demon: THREE.Group): void {
    const index = this.networkDemons.findIndex((d) => d === demon);
    if (index > -1) {
      this.networkDemons.splice(index, 1);
      console.log(`👹 Removed network demon: ${demon.userData?.serverId}`);
    }
  }

  public removeNetworkDemonById(serverId: string): boolean {
    const index = this.networkDemons.findIndex(
      (d) => d.userData?.serverId === serverId
    );
    if (index > -1) {
      const demon = this.networkDemons[index];
      const scene = this.sceneManager.getScene();
      if (scene && demon) {
        scene.remove(demon);
      }
      this.networkDemons.splice(index, 1);

      // Update wave progress
      if (this.currentWaveStats.demonsRemaining > 0) {
        this.currentWaveStats.demonsRemaining--;
        console.log(
          `👹 Demons remaining in wave: ${this.currentWaveStats.demonsRemaining}/${this.currentWaveStats.totalDemons}`
        );
      }

      console.log(`👹 Removed network demon by ID: ${serverId}`);
      return true;
    }
    console.warn(`❗️ Could not find network demon with ID: ${serverId}`);
    return false;
  }

  public clearNetworkDemons(): void {
    // Remove all network demons from scene
    const scene = this.getScene();
    this.networkDemons.forEach((demon) => {
      if (scene) {
        scene.remove(demon);
      }
    });
    this.networkDemons = [];
    console.log("🧹 Cleared all network demons");
  }

  public removeDemon(demon: any): void {
    const index = this.demonSystem.demons.findIndex((d) => d === demon);
    if (index > -1) {
      this.demonSystem.demons.splice(index, 1);
    }
    const scene = this.getScene();
    if (scene && demon) {
      if (demon.mesh) {
        scene.remove(demon.mesh);
      } else {
        scene.remove(demon);
      }
    }
  }

  public clearDemons(): void {
    const scene = this.getScene();
    if (scene) {
      this.demonSystem.demons.forEach((demon) => {
        if ((demon as any).mesh) {
          // DemonInstance type - remove the mesh
          scene.remove((demon as any).mesh);
        } else {
          // THREE.Group type - remove the demon directly
          scene.remove(demon as any);
        }
      });
    }
    this.demonSystem.demons = [];
  }

  public createDemonModel(demonType: string): THREE.Group | null {
    // 创建基于类型的demon模型，参考旧版实现
    try {
      // 导入demon配置
      const { DEMON_CONFIGS } = require("@/config/demons");
      const typeData = DEMON_CONFIGS[demonType as keyof typeof DEMON_CONFIGS];

      if (!typeData) {
        console.warn(`Unknown demon type: ${demonType}, using IMP as fallback`);
        return this.createDemonModel("IMP");
      }

      const demonGroup = new THREE.Group();

      // 主体（使用box geometry以确保兼容性）
      const bodyGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.3);
      const bodyMaterial = new THREE.MeshLambertMaterial({
        color: typeData.color,
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 0.6;
      demonGroup.add(body);

      // 头部
      const headGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
      const headMaterial = new THREE.MeshLambertMaterial({
        color: typeData.headColor,
      });
      const head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 1.4;
      demonGroup.add(head);

      // 眼睛（不同类型有不同颜色）
      const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
      const eyeMaterial = new THREE.MeshBasicMaterial({
        color: typeData.eyeColor,
      });

      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      leftEye.position.set(-0.1, 1.45, 0.25);
      demonGroup.add(leftEye);

      const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      rightEye.position.set(0.1, 1.45, 0.25);
      demonGroup.add(rightEye);

      // 手臂
      const armGeometry = new THREE.BoxGeometry(0.15, 0.7, 0.15);
      const armMaterial = new THREE.MeshLambertMaterial({
        color: typeData.headColor,
      });

      const leftArm = new THREE.Mesh(armGeometry, armMaterial);
      leftArm.position.set(-0.45, 0.8, 0);
      leftArm.rotation.z = 0.3;
      demonGroup.add(leftArm);

      const rightArm = new THREE.Mesh(armGeometry, armMaterial);
      rightArm.position.set(0.45, 0.8, 0);
      rightArm.rotation.z = -0.3;
      demonGroup.add(rightArm);

      // 腿部
      const legGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
      const legMaterial = new THREE.MeshLambertMaterial({
        color: typeData.color,
      });

      const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
      leftLeg.position.set(-0.15, -0.4, 0);
      demonGroup.add(leftLeg);

      const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
      rightLeg.position.set(0.15, -0.4, 0);
      demonGroup.add(rightLeg);

      // 基于demon类型的特殊特征
      if (demonType === "CACODEMON" || demonType === "BARON") {
        // 为Cacodemon和Baron添加装甲/尖刺
        const armorGeometry = new THREE.BoxGeometry(0.8, 0.3, 0.4);
        const armorMaterial = new THREE.MeshLambertMaterial({
          color: 0x222222,
        });
        const armor = new THREE.Mesh(armorGeometry, armorMaterial);
        armor.position.y = 1.0;
        demonGroup.add(armor);
      }

      if (demonType === "DEMON") {
        // 为快速demon添加头盔
        const helmetGeometry = new THREE.BoxGeometry(0.45, 0.15, 0.45);
        const helmetMaterial = new THREE.MeshLambertMaterial({
          color: 0x444444,
        });
        const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
        helmet.position.y = 1.6;
        demonGroup.add(helmet);
      }

      if (demonType === "BARON") {
        // 为Baron添加王冠
        const crownGeometry = new THREE.ConeGeometry(0.3, 0.4, 6);
        const crownMaterial = new THREE.MeshLambertMaterial({
          color: 0x8b0000,
        });
        const crown = new THREE.Mesh(crownGeometry, crownMaterial);
        crown.position.y = 1.8;
        demonGroup.add(crown);
      }

      // 应用大小缩放
      demonGroup.scale.setScalar(typeData.scale);

      // 启用阴影
      demonGroup.traverse(function (child) {
        if ((child as any).isMesh) {
          (child as THREE.Mesh).castShadow = true;
          (child as THREE.Mesh).receiveShadow = true;
        }
      });

      // 在模型中存储demon类型和其他属性
      demonGroup.userData = {
        demonType: demonType,
        health: typeData.health,
        maxHealth: typeData.health,
        isServerControlled: true,
        speed: typeData.speed,
        attackDamage: typeData.attackDamage,
        isDead: false,
        markedForRemoval: false,
      };

      return demonGroup;
    } catch (error) {
      console.error("Failed to create demon model:", error);

      // 创建简单的备用模型
      const demonGeometry = new THREE.BoxGeometry(1, 2, 1);
      const demonMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
      const demon = new THREE.Mesh(demonGeometry, demonMaterial);

      const demonGroup = new THREE.Group();
      demonGroup.add(demon);

      demonGroup.userData = {
        demonType: demonType,
        health: 1,
        maxHealth: 1,
        isServerControlled: true,
      };

      return demonGroup;
    }
  }

  // Wave management
  public startWave(waveNumber: number, demonCount?: number): void {
    this.gameStats.currentWave = waveNumber;

    // Update wave tracking stats
    this.currentWaveStats.waveNumber = waveNumber;
    this.currentWaveStats.totalDemons = demonCount || 0;
    this.currentWaveStats.demonsRemaining = demonCount || 0;

    this.uiManager.updateGameStats(this.gameStats);

    // Log wave start for debugging
    console.log(
      `🎯 Starting Wave ${waveNumber}${
        demonCount ? ` with ${demonCount} demons` : ""
      }`
    );

    // Clear any remaining demons from previous wave
    this.clearNetworkDemons();

    // Reset wave-specific stats if needed
    // Additional wave start logic can be added here
  }

  public completeWave(waveNumber: number): void {
    console.log(`Wave ${waveNumber} completed!`);

    // Update UI to reflect wave completion
    this.uiManager.updateGameStats(this.gameStats);

    // Additional wave completion logic can be added here
    // For example: bonus points, special effects, etc.
  }

  // Utility methods
  public showMessage(message: string, duration?: number): void {
    this.uiManager.showMessage(message, duration);
  }

  public showDamageEffect(): void {
    this.uiManager.showDamageEffect();
  }

  // Menu navigation helpers
  public showMainMenu(): void {
    this.uiManager.showMainMenu();
    this.gameState = "mainMenu";
  }

  public showGameOver(): void {
    this.uiManager.showGameOver();
    this.gameState = "gameOver";
  }

  // Sound management
  public playSound(soundName: string): void {
    // AudioSystem playSound method access will be implemented when available
    console.log("Playing sound:", soundName);
  }

  /**
   * Switch to a different scene theme
   */
  public async switchSceneTheme(themeName: SceneThemeName): Promise<void> {
    try {
      await this.sceneManager.switchTheme(themeName);
      console.log(`🎨 Switched to ${themeName} theme`);
    } catch (error) {
      console.error(`Failed to switch to ${themeName} theme:`, error);
    }
  }

  /**
   * Get available scene themes
   */
  public getAvailableThemes(): SceneThemeName[] {
    return this.sceneManager.getAvailableThemes();
  }

  /**
   * Get current scene theme
   */
  public getCurrentTheme(): string | null {
    const theme = this.sceneManager.getCurrentTheme();
    return theme ? theme.getConfig().name : null;
  }
}
