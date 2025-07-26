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

export class Game {
  private static instance: Game | null = null;

  private gameState: GameState = "mainMenu";
  private gameInitialized = false;
  private isMultiplayer = false;

  // Core systems
  private sceneManager!: SceneManager;
  private playerController!: PlayerController;
  private weaponSystem!: WeaponSystem;
  private demonSystem!: DemonSystem;
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
    this.sceneManager = new SceneManager();
    this.playerController = new PlayerController(
      this.playerState,
      this.stateManager.getInputState()
    );
    this.weaponSystem = new WeaponSystem();
    this.demonSystem = new DemonSystem();
    this.audioSystem = new AudioSystem();
    this.networkManager = new NetworkManager();
    this.uiManager = new UIManager();
    this.collectibleSystem = new CollectibleSystem();
  }

  public async initialize(): Promise<void> {
    if (this.gameInitialized) return;

    try {
      // Initialize all systems
      await this.sceneManager.initialize();

      // Get scene and camera first
      const scene = this.sceneManager.getScene();
      const camera = this.sceneManager.getCamera();

      // Set camera for player controller BEFORE initializing it
      this.playerController.setCamera(camera as THREE.PerspectiveCamera);
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
      this.demonSystem.setScene(scene);
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

  public startGame(isMultiplayer = false): void {
    this.isMultiplayer = isMultiplayer;
    this.gameState = "playing";
    this.resetGameState();
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
        this.gameState = "mainMenu";
        const pauseMenu = document.getElementById("pauseMenu");
        const mainMenu = document.getElementById("mainMenu");
        const gameUI = document.getElementById("gameUI");

        if (pauseMenu) pauseMenu.style.display = "none";
        if (mainMenu) mainMenu.style.display = "flex";
        if (gameUI) gameUI.style.display = "none";

        // Reset game state
        this.initializeState();
      };
    }
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

    // Reset weapon
    this.weaponSystem.reset();

    console.log("🔄 Wave restarted");
  }

  public endGame(): void {
    this.gameState = "gameOver";
    this.stopGameLoop();
    this.audioSystem.stopBackgroundMusic();

    if (this.isMultiplayer) {
      this.networkManager.leaveGame();
    }
  }

  public resetGameState(): void {
    this.initializeState();
    this.stateManager.resetInputState(); // 重置输入状态但保持引用
    this.weaponSystem.reset();
    this.demonSystem.reset();
    this.playerController.reset();
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

    // 更新雷达 - 只显示活着的怪物
    const aliveDemoms = (this.demonSystem.demons || []).filter(
      (demon) => demon.state !== "dead" && !demon.mesh.userData.markedForRemoval
    );
    const camera = this.sceneManager.getCamera();
    if (camera) {
      // 使用相机的实时位置而不是playerState.position
      this.uiManager.updateRadar(camera.position, aliveDemoms, camera);
    }
  }

  private render(): void {
    this.sceneManager.render();
  }

  private checkCollisions(): void {
    // Check bullet-demon collisions
    this.weaponSystem.getBullets().forEach((bullet) => {
      const hitDemon = this.demonSystem.checkBulletCollision(bullet);
      if (hitDemon) {
        this.weaponSystem.removeBullet(bullet.id);
        this.onDemonHit(hitDemon, bullet.damage);
      }
    });

    // Check player-demon collisions and attacks
    const nearbyDemons = this.demonSystem.getNearbyDemons(
      this.playerState.position,
      2
    );
    nearbyDemons.forEach((demon) => {
      // Only take damage if demon is attacking and we can take damage
      if (
        demon.state === "attacking" &&
        demon.mesh.userData.isAttacking &&
        this.canTakeDamage()
      ) {
        this.takeDamage(demon.type);
        // Reset demon attack state to prevent continuous damage
        demon.mesh.userData.isAttacking = false;
      }
    });

    // Check player-collectible collisions
    const collectibleCollision = this.collectibleSystem.checkPlayerCollision(
      this.playerState.position
    );
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
        // TODO: Add health pack sound to AudioSystem
        // this.audioSystem.playHealthPackSound();
      }
    } else if (collision.type === "ammo") {
      // TODO: Implement ammo refill when weapon system is enhanced
      console.log(`🔋 Collected ${collision.value} ammo!`);
      // TODO: Add ammo pack sound to AudioSystem
      // this.audioSystem.playAmmoPackSound();
    }
  }

  private onDemonHit(demonId: string, damage: number): void {
    const killed = this.demonSystem.damageDemon(demonId, damage);
    if (killed) {
      this.gameStats.demonKills++;
      this.gameStats.score += 100;
      this.audioSystem.playDemonDeathSound();
    } else {
      this.audioSystem.playDemonHitSound();
    }
  }

  private takeDamage(demonType: string): void {
    const damage = this.demonSystem.getDemonDamage(demonType);
    this.playerState.health = Math.max(0, this.playerState.health - damage);
    this.playerState.lastDamageTime = performance.now();

    if (this.playerState.health <= 0) {
      this.playerState.isAlive = false;
      this.endGame();
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

  public getGameState(): GameState {
    return this.gameState;
  }

  public setMultiplayerMode(isMultiplayer: boolean): void {
    this.isMultiplayer = isMultiplayer;
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
    this.demonSystem.demons.push(demon);
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
        if (demon.mesh) {
          scene.remove(demon.mesh);
        } else {
          scene.remove(demon);
        }
      });
    }
    this.demonSystem.demons = [];
  }

  public createDemonModel(demonType: string): THREE.Group | null {
    // Create a basic demon model for multiplayer compatibility
    try {
      const demonGeometry = new THREE.BoxGeometry(1, 2, 1);
      const demonMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
      const demon = new THREE.Mesh(demonGeometry, demonMaterial);

      const demonGroup = new THREE.Group();
      demonGroup.add(demon);

      // Add basic userData structure for compatibility
      demonGroup.userData = {
        demonType: demonType,
        health: 1,
        maxHealth: 1,
        isServerControlled: true,
      };

      return demonGroup;
    } catch (error) {
      console.error("Failed to create demon model:", error);
      return null;
    }
  }

  // Wave management
  public startWave(waveNumber: number, demonCount?: number): void {
    this.gameStats.currentWave = waveNumber;
    this.uiManager.updateGameStats(this.gameStats);
    // Additional wave start logic can be added here
  }

  public completeWave(waveNumber: number): void {
    console.log(`Wave ${waveNumber} completed!`);
    // Additional wave completion logic can be added here
  }

  // Pause and resume functionality
  public pauseGame(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.gameState = "paused";
  }

  public resumeGame(): void {
    if (this.gameState === "paused") {
      this.gameState = "playing";
      this.prevTime = performance.now();
      this.animate();
    }
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
}
