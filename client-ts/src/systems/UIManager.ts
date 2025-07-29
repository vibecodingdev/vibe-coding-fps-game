import * as THREE from "three";
import { PlayerState, GameStats } from "@/types/game";
import { VoiceChatSystem } from "@/systems/VoiceChatSystem";
import { SceneThemeName } from "@/themes";

export class UIManager {
  private static instance: UIManager | null = null;

  private healthBar: HTMLElement | null = null;
  private healthValue: HTMLElement | null = null;
  private weaponName: HTMLElement | null = null;
  private currentAmmo: HTMLElement | null = null;
  private maxAmmo: HTMLElement | null = null;

  // Helper function to get display name for scene themes
  private getThemeDisplayName(themeName: SceneThemeName): string {
    const themeNames = {
      hell: "🔥 Hell",
      ice: "❄️ Ice",
      toxic: "☢️ Toxic",
      industrial: "🏭 Industrial",
      doomMap: "🏛️ Doom Map",
      bspMap: "🗺️ BSP Map",
    };
    return themeNames[themeName] || themeName;
  }
  private waveNumber: HTMLElement | null = null;
  private killCount: HTMLElement | null = null;
  private scoreValue: HTMLElement | null = null;
  private crosshair: HTMLElement | null = null;

  // FPS tracking
  private fpsValue: HTMLElement | null = null;
  private fpsFrameCount: number = 0;
  private fpsLastTime: number = 0;
  private fpsUpdateInterval: number = 1000; // Update every second

  // 雷达相关
  private radarCanvas: HTMLCanvasElement | null = null;
  private radarContext: CanvasRenderingContext2D | null = null;
  private readonly RADAR_SIZE = 120;
  private readonly RADAR_RANGE = 60; // 增加范围以确保能看到所有怪物

  // Voice chat system
  private voiceChatSystem: VoiceChatSystem | null = null;

  // Preview system for characters, weapons, demons, and scenes
  private previewScene: THREE.Scene | null = null;
  private previewCamera: THREE.PerspectiveCamera | null = null;
  private previewRenderer: THREE.WebGLRenderer | null = null;
  private previewContainer: HTMLElement | null = null;
  private previewObjects: THREE.Object3D[] = [];
  private previewAnimationId: number | null = null;

  private constructor() {
    // Private constructor to prevent direct instantiation
  }

  public static getInstance(): UIManager {
    if (!UIManager.instance) {
      UIManager.instance = new UIManager();
    }
    return UIManager.instance;
  }

  public async initialize(): Promise<void> {
    console.log("🎮 UIManager initializing...");

    this.setupUIElements();
    this.initializeRadar();
    this.setupEventListeners();

    // Initialize voice chat system
    try {
      this.voiceChatSystem = new VoiceChatSystem();
      await this.voiceChatSystem.initialize();

      // Set up voice message callback
      this.voiceChatSystem.setVoiceMessageCallback(
        (message: string, type: string) => {
          this.addGameChatMessage("voice", message, "You");
        }
      );

      console.log("✅ Voice chat system initialized");
    } catch (error) {
      console.warn("Failed to initialize voice chat system:", error);
    }

    console.log("✅ UIManager initialized");
  }

  private setupUIElements(): void {
    console.log("🔧 Setting up UI elements...");

    this.healthBar = document.getElementById("healthBar");
    this.healthValue = document.getElementById("healthValue");
    this.weaponName = document.getElementById("currentWeapon");
    this.currentAmmo = document.getElementById("currentAmmo");
    this.maxAmmo = document.getElementById("maxAmmo");
    this.waveNumber = document.getElementById("waveNumber");
    this.killCount = document.getElementById("killCount");
    this.scoreValue = document.getElementById("scoreValue");
    this.crosshair = document.querySelector(".crosshair");

    // Initialize FPS counter
    this.fpsValue = document.getElementById("fpsValue");
    this.fpsLastTime = performance.now();

    if (!this.healthBar || !this.healthValue) {
      console.warn("⚠️ Health UI elements not found");
    }

    if (!this.weaponName || !this.currentAmmo || !this.maxAmmo) {
      console.warn("⚠️ Weapon UI elements not found");
    }

    if (!this.fpsValue) {
      console.warn("⚠️ FPS counter element not found");
    }

    // Check for missing UI elements and provide warnings
    this.createMissingUIElements();

    console.log("✅ UI elements setup complete");
  }

  private createMissingUIElements(): void {
    // 只检查必要的UI元素，雷达已在HTML中定义
    const gameUI = document.getElementById("gameUI");
    if (!gameUI) {
      console.warn("Game UI container not found");
      return;
    }

    // 检查雷达是否存在
    const radarContainer = document.querySelector(".radar-container");
    if (!radarContainer) {
      console.warn(
        "Radar container not found in HTML, please check index.html"
      );
    }
  }

  private initializeRadar(): void {
    console.log("🔍 Looking for radar canvas...");
    this.radarCanvas = document.getElementById(
      "radarCanvas"
    ) as HTMLCanvasElement;
    if (this.radarCanvas) {
      console.log("✅ Radar canvas found:", this.radarCanvas);
      try {
        this.radarContext = this.radarCanvas.getContext("2d");
        if (this.radarContext) {
          console.log("📡 Mini radar initialized successfully");
        } else {
          console.warn("Failed to get 2D context for radar canvas");
        }
      } catch (error) {
        console.error("Error initializing radar context:", error);
      }
    } else {
      console.warn("❌ Radar canvas element not found - checking DOM...");
      // Debug: list all canvas elements
      const allCanvases = document.querySelectorAll("canvas");
      console.log("Found canvases:", allCanvases);
    }
  }

  private setupEventListeners(): void {
    // 监听窗口大小变化
    window.addEventListener("resize", this.onWindowResize.bind(this));
  }

  private onWindowResize(): void {
    // 重新调整UI元素位置
    this.updateUILayout();
  }

  private updateUILayout(): void {
    // 根据屏幕大小调整UI布局
    // 这里可以添加响应式设计逻辑
  }

  public updateHealth(playerState: PlayerState): void {
    const healthPercentage = (playerState.health / 100) * 100; // 假设最大血量为100

    if (this.healthBar) {
      this.healthBar.style.width = `${healthPercentage}%`;

      // 根据血量改变颜色
      if (healthPercentage <= 25) {
        this.healthBar.style.background = "#ff0000"; // 红色
      } else if (healthPercentage <= 50) {
        this.healthBar.style.background =
          "linear-gradient(90deg, #ff0000 0%, #ffff00 100%)"; // 红到黄
      } else {
        this.healthBar.style.background =
          "linear-gradient(90deg, #ff0000 0%, #ffff00 50%, #00ff00 100%)"; // 完整渐变
      }
    }

    if (this.healthValue) {
      this.healthValue.textContent = Math.round(playerState.health).toString();
    }
  }

  public updateWeaponInfo(weaponData: {
    name: string;
    currentAmmo: number;
    maxAmmo: number;
    emoji: string;
  }): void {
    if (this.weaponName) {
      this.weaponName.textContent = `${weaponData.emoji} ${weaponData.name}`;
    }

    if (this.currentAmmo) {
      this.currentAmmo.textContent = weaponData.currentAmmo.toString();

      // 根据弹药量改变颜色
      if (weaponData.currentAmmo <= 10) {
        this.currentAmmo.style.color = "#ff4444"; // 红色 - 弹药很少
      } else if (weaponData.currentAmmo <= 30) {
        this.currentAmmo.style.color = "#ffaa00"; // 橙色 - 弹药较少
      } else {
        this.currentAmmo.style.color = "#ffffff"; // 白色 - 弹药充足
      }
    }

    if (this.maxAmmo) {
      this.maxAmmo.textContent = weaponData.maxAmmo.toString();
    }
  }

  public updateGameStats(gameStats: GameStats): void {
    if (this.waveNumber) {
      this.waveNumber.textContent = gameStats.currentWave.toString();
    }

    if (this.killCount) {
      this.killCount.textContent = gameStats.demonKills.toString();
    }

    if (this.scoreValue) {
      this.scoreValue.textContent = gameStats.score.toString();
    }
  }

  public updateRadar(
    playerPosition: THREE.Vector3,
    demons: Array<{ position: THREE.Vector3 }>,
    camera: THREE.Camera,
    remotePlayers?: Map<string, any>
  ): void {
    if (!this.radarContext || !this.radarCanvas) {
      console.warn("🔴 Radar not available:", {
        context: !!this.radarContext,
        canvas: !!this.radarCanvas,
      });
      return;
    }

    // 清除画布
    this.radarContext.clearRect(0, 0, this.RADAR_SIZE, this.RADAR_SIZE);

    const centerX = this.RADAR_SIZE / 2;
    const centerY = this.RADAR_SIZE / 2;

    // 绘制雷达网格
    this.drawRadarGrid();

    // 绘制恶魔
    this.drawDemonsOnRadar(playerPosition, demons, centerX, centerY);

    // 绘制远程玩家
    if (remotePlayers) {
      this.drawRemotePlayersOnRadar(
        playerPosition,
        remotePlayers,
        centerX,
        centerY
      );
    }

    // 绘制玩家（中心点）
    this.drawPlayerOnRadar(centerX, centerY, camera);

    // 绘制范围圆圈
    this.drawRadarRangeCircles();
  }

  private drawRadarGrid(): void {
    if (!this.radarContext) return;

    this.radarContext.strokeStyle = "rgba(0, 255, 0, 0.2)";
    this.radarContext.lineWidth = 1;

    // 绘制十字线
    this.radarContext.beginPath();
    this.radarContext.moveTo(this.RADAR_SIZE / 2, 0);
    this.radarContext.lineTo(this.RADAR_SIZE / 2, this.RADAR_SIZE);
    this.radarContext.moveTo(0, this.RADAR_SIZE / 2);
    this.radarContext.lineTo(this.RADAR_SIZE, this.RADAR_SIZE / 2);
    this.radarContext.stroke();
  }

  private drawRadarRangeCircles(): void {
    if (!this.radarContext) return;

    this.radarContext.strokeStyle = "rgba(0, 255, 0, 0.15)";
    this.radarContext.lineWidth = 1;

    const centerX = this.RADAR_SIZE / 2;
    const centerY = this.RADAR_SIZE / 2;

    // 绘制范围圆圈：25%, 50%, 75%
    for (let i = 1; i <= 3; i++) {
      const radius = (this.RADAR_SIZE / 2) * (i / 4);
      this.radarContext.beginPath();
      this.radarContext.arc(centerX, centerY, radius, 0, Math.PI * 2);
      this.radarContext.stroke();
    }
  }

  private drawPlayerOnRadar(
    centerX: number,
    centerY: number,
    camera: THREE.Camera
  ): void {
    if (!this.radarContext) return;

    // 绘制玩家位置（中心绿点）
    this.radarContext.fillStyle = "#00ff00";
    this.radarContext.beginPath();
    this.radarContext.arc(centerX, centerY, 4, 0, Math.PI * 2);
    this.radarContext.fill();

    // 添加外环
    this.radarContext.strokeStyle = "#44ff44";
    this.radarContext.lineWidth = 2;
    this.radarContext.beginPath();
    this.radarContext.arc(centerX, centerY, 6, 0, Math.PI * 2);
    this.radarContext.stroke();

    // 绘制玩家方向指示器
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    const angle = Math.atan2(direction.x, direction.z);
    const lineLength = 8;
    const endX = centerX + Math.sin(angle) * lineLength;
    const endY = centerY - Math.cos(angle) * lineLength; // 反转Y轴以匹配雷达坐标系

    this.radarContext.strokeStyle = "#00ff00";
    this.radarContext.lineWidth = 2;
    this.radarContext.beginPath();
    this.radarContext.moveTo(centerX, centerY);
    this.radarContext.lineTo(endX, endY);
    this.radarContext.stroke();
  }

  private drawDemonsOnRadar(
    playerPos: THREE.Vector3,
    demons: Array<{ position: THREE.Vector3 }>,
    centerX: number,
    centerY: number
  ): void {
    if (!this.radarContext) return;

    demons.forEach((demon, index) => {
      // Additional safety check - skip dead or removed demons
      if ((demon as any).userData) {
        const userData = (demon as any).userData;
        if (
          userData.isDead ||
          userData.markedForRemoval ||
          userData.serverHealth <= 0
        ) {
          return; // Skip dead demons
        }
      }

      const distance = playerPos.distanceTo(demon.position);

      if (distance <= this.RADAR_RANGE) {
        // 计算在雷达上的相对位置
        const relativeX = demon.position.x - playerPos.x;
        const relativeZ = demon.position.z - playerPos.z;

        // 转换到雷达坐标（注意：Z轴方向相反）
        const radarX =
          centerX + (relativeX / this.RADAR_RANGE) * (this.RADAR_SIZE / 2);
        const radarY =
          centerY - (relativeZ / this.RADAR_RANGE) * (this.RADAR_SIZE / 2); // 反转Z轴

        // 确保在雷达范围内
        if (
          radarX >= 0 &&
          radarX <= this.RADAR_SIZE &&
          radarY >= 0 &&
          radarY <= this.RADAR_SIZE &&
          this.radarContext
        ) {
          // 根据demon类型确定颜色和大小
          let demonColor = "#ff0000"; // 默认红色
          let demonSize = 3;
          let strokeColor = "#ff6666";

          // 检查demon类型（支持两种结构）
          const demonType =
            (demon as any).userData?.demonType || (demon as any).demonType;

          if (demonType) {
            switch (demonType) {
              case "DEMON":
                demonColor = "#ff8c00"; // 橙色表示快速demon
                demonSize = 2.5;
                strokeColor = "#ffaa44";
                break;
              case "CACODEMON":
                demonColor = "#ff00ff"; // 紫色表示坦克demon
                demonSize = 4;
                strokeColor = "#ff66ff";
                break;
              case "BARON":
                demonColor = "#ffff00"; // 黄色表示Boss demon
                demonSize = 5;
                strokeColor = "#ffff66";
                break;
              default: // IMP
                demonColor = "#ff0000"; // 红色表示普通demon
                demonSize = 3;
                strokeColor = "#ff6666";
            }
          }

          // 如果demon很接近，增加大小
          if (distance < 10) {
            demonSize += 1;
          }

          this.radarContext.fillStyle = demonColor;
          this.radarContext.beginPath();
          this.radarContext.arc(radarX, radarY, demonSize, 0, Math.PI * 2);
          this.radarContext.fill();

          // 添加外环以便更好地识别
          this.radarContext.strokeStyle = strokeColor;
          this.radarContext.lineWidth = 2;
          this.radarContext.beginPath();
          this.radarContext.arc(radarX, radarY, demonSize + 1, 0, Math.PI * 2);
          this.radarContext.stroke();

          // 为非常接近的demon添加脉冲效果
          if (distance < 5) {
            const pulseAlpha = 0.3 + 0.3 * Math.sin(Date.now() * 0.01);
            this.radarContext.fillStyle = demonColor
              .replace(")", `, ${pulseAlpha})`)
              .replace("#", "rgba(")
              .replace(/(.{2})(.{2})(.{2})/, "$1,$2,$3")
              .replace(/[a-f0-9]{2}/gi, (match) =>
                parseInt(match, 16).toString()
              );
            this.radarContext.beginPath();
            this.radarContext.arc(
              radarX,
              radarY,
              demonSize + 2,
              0,
              Math.PI * 2
            );
            this.radarContext.fill();
          }
        }
      }
    });
  }

  private drawRemotePlayersOnRadar(
    playerPos: THREE.Vector3,
    remotePlayers: Map<string, any>,
    centerX: number,
    centerY: number
  ): void {
    if (!this.radarContext) return;

    if (remotePlayers.size > 0) {
      console.log(`🗺️ Drawing ${remotePlayers.size} remote players on radar`);
    }

    remotePlayers.forEach((player, playerId) => {
      if (!player.mesh || !player.mesh.position) {
        console.warn(`❗️ Remote player ${playerId} missing mesh or position`);
        return;
      }

      // 计算相对位置
      const relativeX = player.mesh.position.x - playerPos.x;
      const relativeZ = player.mesh.position.z - playerPos.z;
      const distance = Math.sqrt(relativeX * relativeX + relativeZ * relativeZ);

      // 只显示雷达范围内的玩家
      if (distance > this.RADAR_RANGE) return;

      // 转换到雷达坐标
      const radarX =
        centerX + (relativeX / this.RADAR_RANGE) * (this.RADAR_SIZE / 2);
      const radarY =
        centerY - (relativeZ / this.RADAR_RANGE) * (this.RADAR_SIZE / 2);

      // 检查是否在雷达圆圈内
      const radarDistance = Math.sqrt(
        (radarX - centerX) ** 2 + (radarY - centerY) ** 2
      );
      if (radarDistance > this.RADAR_SIZE / 2) return;

      console.log(`🎯 Drawing player ${playerId} on radar`);

      // 获取玩家颜色方案（如果有的话）
      const colorScheme = player.colorScheme || {
        body: 0x0088ff,
        eyes: 0x00ffff,
      };
      const playerColor = `#${colorScheme.body.toString(16).padStart(6, "0")}`;
      const eyeColor = `#${colorScheme.eyes.toString(16).padStart(6, "0")}`;

      // 绘制玩家基础圆圈（比demon大）
      if (this.radarContext) {
        this.radarContext.fillStyle = playerColor;
        this.radarContext.beginPath();
        this.radarContext.arc(radarX, radarY, 5, 0, Math.PI * 2);
        this.radarContext.fill();

        // 绘制玩家眼睛发光（内圆）
        this.radarContext.fillStyle = eyeColor;
        this.radarContext.beginPath();
        this.radarContext.arc(radarX, radarY, 2, 0, Math.PI * 2);
        this.radarContext.fill();

        // 绘制玩家轮廓以区分demon
        this.radarContext.strokeStyle = "#ffffff";
        this.radarContext.lineWidth = 1;
        this.radarContext.beginPath();
        this.radarContext.arc(radarX, radarY, 6, 0, Math.PI * 2);
        this.radarContext.stroke();

        // 添加队友标记（小方块）
        const markerSize = 2;
        this.radarContext.fillStyle = eyeColor;
        this.radarContext.fillRect(
          radarX - markerSize / 2,
          radarY - 8,
          markerSize,
          markerSize
        );
      }

      // 为非常接近的玩家添加脉冲效果（友方识别）
      if (distance < 8 && this.radarContext) {
        const pulseAlpha = 0.4 + 0.4 * Math.sin(Date.now() * 0.008);
        this.radarContext.fillStyle = `${eyeColor}${Math.floor(pulseAlpha * 255)
          .toString(16)
          .padStart(2, "0")}`;
        this.radarContext.beginPath();
        this.radarContext.arc(radarX, radarY, 8, 0, Math.PI * 2);
        this.radarContext.fill();
      }

      // 绘制玩家方向指示器（如果有方向信息）
      if ((player.rotation || player.mesh.rotation) && this.radarContext) {
        const rotation = player.rotation || player.mesh.rotation;
        const angle = rotation.y; // 使用Y轴旋转
        const lineLength = 4;
        const endX = radarX + Math.sin(angle) * lineLength;
        const endY = radarY - Math.cos(angle) * lineLength;

        this.radarContext.strokeStyle = eyeColor;
        this.radarContext.lineWidth = 2;
        this.radarContext.beginPath();
        this.radarContext.moveTo(radarX, radarY);
        this.radarContext.lineTo(endX, endY);
        this.radarContext.stroke();
      }
    });
  }

  public updateCrosshair(isTargeting: boolean = false): void {
    if (this.crosshair) {
      if (isTargeting) {
        this.crosshair.style.color = "#ff0000";
        this.crosshair.style.transform = "translate(-50%, -50%) scale(1.2)";
      } else {
        this.crosshair.style.color = "#00ff00";
        this.crosshair.style.transform = "translate(-50%, -50%) scale(1.0)";
      }
    }
  }

  public showDamageEffect(isFireball: boolean = false): void {
    // 创建受伤效果 - 火球攻击使用更强烈的效果
    const damageOverlay = document.createElement("div");

    if (isFireball) {
      // 火球伤害 - 橙红色渐变效果更强烈
      damageOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle, rgba(255, 100, 0, 0.4) 0%, rgba(255, 0, 0, 0.5) 100%);
        pointer-events: none;
        z-index: 9999;
        animation: fireballDamageFlash 0.8s ease-out;
      `;
    } else {
      // 普通伤害效果
      damageOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle, transparent 0%, rgba(255, 0, 0, 0.5) 100%);
        pointer-events: none;
        z-index: 9999;
        animation: damageFlash 0.6s ease-out;
      `;
    }

    // 添加动画样式
    const style = document.createElement("style");
    style.textContent = `
      @keyframes damageFlash {
        0% { opacity: 1; }
        50% { opacity: 0.8; }
        100% { opacity: 0; }
      }
      @keyframes fireballDamageFlash {
        0% { opacity: 1; }
        25% { opacity: 0.9; }
        50% { opacity: 0.7; }
        75% { opacity: 0.4; }
        100% { opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(damageOverlay);

    // 根据攻击类型调整移除时间
    const duration = isFireball ? 800 : 600;
    setTimeout(() => {
      if (document.body.contains(damageOverlay)) {
        document.body.removeChild(damageOverlay);
      }
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    }, duration);
  }

  public showMessage(message: string, duration: number = 3000): void {
    const messageDiv = document.createElement("div");
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
      position: fixed;
      top: 20%;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: #00ff00;
      padding: 10px 20px;
      border-radius: 5px;
      font-family: 'Orbitron', monospace;
      font-size: 16px;
      font-weight: bold;
      z-index: 10000;
      border: 2px solid #00ff00;
    `;

    document.body.appendChild(messageDiv);

    setTimeout(() => {
      if (document.body.contains(messageDiv)) {
        document.body.removeChild(messageDiv);
      }
    }, duration);
  }

  public update(_deltaTime: number): void {
    // 每帧更新UI动画效果
    this.updateAnimations();
  }

  private updateAnimations(): void {
    // 可以在这里添加UI动画逻辑，比如准星动画、血量条动画等
  }

  /**
   * Update FPS counter
   */
  public updateFPS(): void {
    this.fpsFrameCount++;
    const currentTime = performance.now();
    const deltaTime = currentTime - this.fpsLastTime;

    if (deltaTime >= this.fpsUpdateInterval) {
      const fps = Math.round((this.fpsFrameCount * 1000) / deltaTime);

      if (this.fpsValue) {
        this.fpsValue.textContent = fps.toString();

        // Update FPS color based on performance
        this.fpsValue.className = "fps-value";
        if (fps >= 50) {
          this.fpsValue.classList.add("fps-good");
        } else if (fps >= 30) {
          this.fpsValue.classList.add("fps-medium");
        } else {
          this.fpsValue.classList.add("fps-poor");
        }
      }

      this.fpsFrameCount = 0;
      this.fpsLastTime = currentTime;
    }
  }

  /**
   * Setup ground texture toggle functionality
   */
  public setupGroundTextureToggle(sceneManager: any): void {
    const groundTextureToggle = document.getElementById(
      "pauseGroundTextures"
    ) as HTMLInputElement;
    const groundTextureDisplay = document.getElementById(
      "groundTexturesDisplay"
    );

    if (groundTextureToggle && groundTextureDisplay) {
      // Set initial state
      groundTextureToggle.checked = sceneManager.getGroundTexturesEnabled();
      groundTextureDisplay.textContent = groundTextureToggle.checked
        ? "Enabled"
        : "Disabled";

      // Add event listener
      groundTextureToggle.addEventListener("change", () => {
        const enabled = groundTextureToggle.checked;
        sceneManager.toggleGroundTextures(enabled);
        groundTextureDisplay.textContent = enabled ? "Enabled" : "Disabled";

        console.log(
          `Ground textures ${enabled ? "enabled" : "disabled"} via UI`
        );
      });
    }
  }

  public cleanup(): void {
    // Cleanup voice chat system
    if (this.voiceChatSystem) {
      this.voiceChatSystem.cleanup();
      this.voiceChatSystem = null;
    }
  }

  // Multiplayer UI Management Methods

  // Connection status management
  public updateConnectionStatus(status: string): void {
    const connectionStatus = document.getElementById("connectionStatus");
    if (connectionStatus) {
      connectionStatus.textContent = status;

      // Update styling based on status
      if (status.includes("🟢")) {
        connectionStatus.style.borderColor = "#00ff00";
        connectionStatus.style.color = "#00ff00";
      } else if (status.includes("🔴")) {
        connectionStatus.style.borderColor = "#ff0000";
        connectionStatus.style.color = "#ff0000";
      } else if (status.includes("🔄")) {
        connectionStatus.style.borderColor = "#ffaa00";
        connectionStatus.style.color = "#ffaa00";
      }
    }
  }

  // Room list management
  public updateRoomsList(rooms: any[]): void {
    const roomList = document.getElementById("roomList");
    if (!roomList) return;

    if (rooms.length === 0) {
      roomList.innerHTML =
        '<div class="room-item empty">🏜️ No chambers found in Hell</div>';
      return;
    }

    roomList.innerHTML = rooms
      .map(
        (room) => `
      <div class="room-item" onclick="window.networkManager?.joinRoom('${
        room.id
      }')">
        <div class="room-info">
          <div class="room-name">🏰 ${room.name}</div>
          <div class="room-details">
            👹 ${room.players}/${
          room.maxPlayers
        } | 🗺️ ${this.getThemeDisplayName(room.mapType)}
          </div>
        </div>
        <div class="room-status">
          ${room.players < room.maxPlayers ? "🟢 OPEN" : "🔴 FULL"}
        </div>
      </div>
    `
      )
      .join("");
  }

  // Party members management
  public updatePartyMembers(members: any[]): void {
    const partyMembers = document.getElementById("partyMembers");
    if (!partyMembers) return;

    partyMembers.innerHTML = members
      .map(
        (member) => `
      <div class="party-member ${member.isLeader ? "leader" : ""} ${
          member.ready ? "ready" : ""
        }">
        <div class="member-info">
          <div class="member-name">
            ${member.isLeader ? "👑" : "👹"} ${member.name}
          </div>
          <div class="member-status">
            ${member.isLeader ? "Chamber Leader" : "Demon"}
            ${member.ready ? " • Ready" : " • Not Ready"}
          </div>
        </div>
        <div class="member-ready-status">
          ${member.ready ? "✅" : "⏳"}
        </div>
      </div>
    `
      )
      .join("");
  }

  // Chat system management
  public addChatMessage(
    type: "system" | "player" | "voice",
    message: string,
    sender?: string
  ): void {
    const chatMessages = document.getElementById("chatMessages");
    if (!chatMessages) return;

    const messageDiv = document.createElement("div");
    messageDiv.className = `chat-message ${type}`;

    const timestamp = new Date().toLocaleTimeString();

    if (type === "system") {
      messageDiv.innerHTML = `<span style="color: #ffaa66; font-style: italic;">[${timestamp}] ${message}</span>`;
    } else if (type === "voice") {
      messageDiv.innerHTML = `<span style="color: #00ff00;">[${timestamp}] <span class="sender">${sender}:</span> ${message}</span>`;
    } else {
      messageDiv.innerHTML = `<span style="color: #ffffff;">[${timestamp}] <span class="sender">${sender}:</span> ${message}</span>`;
    }

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Limit chat history to prevent memory issues
    while (chatMessages.children.length > 100) {
      chatMessages.removeChild(chatMessages.firstChild!);
    }
  }

  public addGameChatMessage(
    type: "system" | "player" | "voice",
    message: string,
    sender?: string
  ): void {
    // For in-game chat, we could show it in a different location or overlay
    // For now, use the same chat system but with different styling
    this.addChatMessage(type, message, sender);

    // Also show as temporary overlay in game
    if (type === "voice" || type === "player") {
      this.showMessage(`${sender}: ${message}`, 3000);
    }
  }

  // Menu navigation
  public showMainMenu(): void {
    console.log("🎮 UIManager.showMainMenu() called");
    this.hideAllMenus();
    // Set body to menu mode to allow scrolling
    document.body.className = "menu-mode";
    const mainMenu = document.getElementById("mainMenu");
    if (mainMenu) {
      mainMenu.style.display = "flex";
      mainMenu.scrollTop = 0;
      console.log("✅ Main menu display set to flex");
    } else {
      console.error(
        "❌ Main menu element not found in UIManager.showMainMenu()"
      );
    }
  }

  public showMultiplayerLobby(): void {
    this.hideAllMenus();
    // Set body to menu mode to allow scrolling
    document.body.className = "menu-mode";
    const multiplayerLobby = document.getElementById("multiplayerLobby");
    if (multiplayerLobby) {
      multiplayerLobby.style.display = "flex";
      multiplayerLobby.classList.add("scrollable");
      setTimeout(() => {
        multiplayerLobby.scrollTop = 0;
      }, 100);
    }
  }

  public showPartyRoom(): void {
    this.hideAllMenus();
    // Set body to menu mode to allow scrolling
    document.body.className = "menu-mode";
    const partyRoom = document.getElementById("partyRoom");
    if (partyRoom) {
      partyRoom.style.display = "flex";
      partyRoom.classList.add("scrollable");
      setTimeout(() => {
        partyRoom.scrollTop = 0;
      }, 100);
    }
  }

  public showInstructions(): void {
    this.hideAllMenus();
    // Set body to menu mode to allow scrolling
    document.body.className = "menu-mode";
    const instructions = document.getElementById("instructionsScreen");
    if (instructions) {
      instructions.style.display = "flex";
      instructions.classList.add("scrollable");
      setTimeout(() => {
        instructions.scrollTop = 0;
      }, 100);
    }
  }

  public showGameOver(): void {
    this.hideAllMenus();
    // Set body to menu mode to allow scrolling
    document.body.className = "menu-mode";
    const gameOver = document.getElementById("gameOverScreen");
    if (gameOver) {
      gameOver.style.display = "flex";
    }

    // Hide game UI
    const gameUI = document.getElementById("gameUI");
    if (gameUI) {
      gameUI.style.display = "none";
    }
  }

  public updateGameOverStats(gameStats: GameStats): void {
    const finalKillsElement = document.getElementById("finalKills");
    const finalWavesElement = document.getElementById("finalWaves");
    const finalTimeElement = document.getElementById("finalTime");

    if (finalKillsElement) {
      finalKillsElement.textContent = gameStats.demonKills.toString();
    }

    if (finalWavesElement) {
      finalWavesElement.textContent = (gameStats.currentWave - 1).toString();
    }

    if (finalTimeElement) {
      // TODO: Add proper time tracking in the future
      finalTimeElement.textContent = "0:00";
    }
  }

  private hideAllMenus(): void {
    const menus = [
      "mainMenu",
      "multiplayerLobby",
      "partyRoom",
      "instructionsScreen",
      "gameOverScreen",
      "pauseMenu",
    ];

    menus.forEach((menuId) => {
      const menu = document.getElementById(menuId);
      if (menu) {
        menu.style.display = "none";
      }
    });
  }

  // Room management UI helpers
  public updateRoomTitle(roomName: string): void {
    const roomTitle = document.getElementById("roomTitle");
    if (roomTitle) {
      roomTitle.textContent = `🔥 ${roomName} 🔥`;
    }
  }

  public updateReadyButton(isReady: boolean): void {
    const readyButton = document.getElementById("readyButton");
    if (readyButton) {
      if (isReady) {
        readyButton.textContent = "✅ READY";
        readyButton.classList.add("ready");
      } else {
        readyButton.textContent = "⏳ NOT READY";
        readyButton.classList.remove("ready");
      }
    }
  }

  public updateStartGameButton(canStart: boolean, isLeader: boolean): void {
    const startButton = document.getElementById(
      "startGameButton"
    ) as HTMLButtonElement;
    if (startButton) {
      startButton.disabled = !canStart || !isLeader;
      if (!isLeader) {
        startButton.textContent = "🎮 WAITING FOR LEADER";
      } else if (!canStart) {
        startButton.textContent = "🎮 WAITING FOR PLAYERS";
      } else {
        startButton.textContent = "🎮 BEGIN HELLISH COMBAT";
      }
    }
  }

  // Voice chat UI
  public showVoiceIndicator(playerId: string): void {
    // Create or update voice activity indicator
    let indicator = document.getElementById(`voice-${playerId}`);
    if (!indicator) {
      indicator = document.createElement("div");
      indicator.id = `voice-${playerId}`;
      indicator.className = "voice-indicator";
      indicator.textContent = "🎤";
      document.body.appendChild(indicator);
    }

    // Show indicator briefly
    indicator.style.display = "block";
    setTimeout(() => {
      if (indicator) {
        indicator.style.display = "none";
      }
    }, 1000);
  }

  // Room info display during game
  public showRoomInfo(roomName: string): void {
    let roomInfo = document.getElementById("roomInfo");
    if (!roomInfo) {
      roomInfo = document.createElement("div");
      roomInfo.id = "roomInfo";
      roomInfo.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: #ff6600;
        padding: 0.5rem 1rem;
        border: 2px solid #ff6600;
        border-radius: 5px;
        font-weight: 600;
        text-shadow: 0 0 10px #ff6600;
        z-index: 1000;
        font-family: 'Orbitron', monospace;
      `;
      document.body.appendChild(roomInfo);
    }
    roomInfo.textContent = `🏰 Chamber: ${roomName}`;
  }

  public hideRoomInfo(): void {
    const roomInfo = document.getElementById("roomInfo");
    if (roomInfo) {
      roomInfo.remove();
    }
  }

  // Server configuration UI helpers
  public getSelectedServerConfig(): { type: string; url: string } {
    const localServer = document.getElementById(
      "localServer"
    ) as HTMLInputElement;
    const lanServer = document.getElementById("lanServer") as HTMLInputElement;
    const customServer = document.getElementById(
      "customServer"
    ) as HTMLInputElement;
    const lanServerIP = document.getElementById(
      "lanServerIP"
    ) as HTMLInputElement;
    const customServerIP = document.getElementById(
      "customServerIP"
    ) as HTMLInputElement;

    if (localServer?.checked) {
      return { type: "local", url: "http://localhost:3000" };
    } else if (lanServer?.checked) {
      const ip = lanServerIP?.value || "192.168.1.100:3000";
      // Let NetworkManager handle protocol and port normalization
      return { type: "lan", url: ip.startsWith("http") ? ip : `http://${ip}` };
    } else if (customServer?.checked) {
      const ip = customServerIP?.value || "localhost:3000";
      // Let NetworkManager handle protocol and port normalization
      return { type: "custom", url: ip.startsWith("http") ? ip : ip };
    }

    return { type: "local", url: "http://localhost:3000" };
  }

  // Utility method to setup multiplayer event listeners
  public setupMultiplayerEventListeners(networkManager: any): void {
    // Server configuration radio buttons
    const serverRadios = document.querySelectorAll('input[name="serverType"]');
    serverRadios.forEach((radio) => {
      radio.addEventListener("change", () => {
        const lanInput = document.getElementById(
          "lanServerIP"
        ) as HTMLInputElement;
        const customInput = document.getElementById(
          "customServerIP"
        ) as HTMLInputElement;

        if (lanInput)
          lanInput.disabled = !(
            document.getElementById("lanServer") as HTMLInputElement
          )?.checked;
        if (customInput)
          customInput.disabled = !(
            document.getElementById("customServer") as HTMLInputElement
          )?.checked;
      });
    });

    // Connect to server button
    const connectBtn = document.getElementById("connectServerBtn");
    connectBtn?.addEventListener("click", () => {
      const config = this.getSelectedServerConfig();
      networkManager.setServerURL(config.url);
      networkManager.connectToServer();
    });

    // Create room button
    const createRoomBtn = document.getElementById("createRoomBtn");
    createRoomBtn?.addEventListener("click", () => {
      const roomName =
        (document.getElementById("roomName") as HTMLInputElement)?.value ||
        "Hell Chamber";
      const maxPlayers = parseInt(
        (document.getElementById("maxPlayers") as HTMLSelectElement)?.value ||
          "4"
      );
      const mapType =
        (document.getElementById("mapType") as HTMLSelectElement)?.value ||
        "industrial";

      networkManager.createRoom(roomName, maxPlayers, mapType);
    });

    // Refresh rooms button
    const refreshBtn = document.getElementById("refreshRoomsBtn");
    refreshBtn?.addEventListener("click", () => {
      networkManager.refreshRooms();
    });

    // Chat input
    const chatInput = document.getElementById("chatInput") as HTMLInputElement;
    const sendChatBtn = document.getElementById("sendChatBtn");

    const sendMessage = () => {
      const message = chatInput?.value.trim();
      if (message) {
        networkManager.sendChatMessage(message);
        chatInput.value = "";
      }
    };

    sendChatBtn?.addEventListener("click", sendMessage);
    chatInput?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendMessage();
      }
    });

    // Ready button
    const readyBtn = document.getElementById("readyButton");
    readyBtn?.addEventListener("click", () => {
      networkManager.toggleReady();
    });

    // Start game button
    const startBtn = document.getElementById("startGameButton");
    startBtn?.addEventListener("click", () => {
      networkManager.startGame();
    });

    // Leave room button
    const leaveBtn = document.getElementById("leaveRoomBtn");
    leaveBtn?.addEventListener("click", () => {
      networkManager.leaveRoom();
      this.showMultiplayerLobby();
    });

    // Back to menu buttons
    const backBtns = document.querySelectorAll(
      "#backToMenuBtn, #backToMainMenuBtn"
    );
    backBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        // Use the game's proper cleanup method for back to main menu from game
        const game = (window as any).game;
        if (game && game.getGameState() !== "mainMenu") {
          game.returnToMainMenu();
        } else {
          this.showMainMenu();
        }
      });
    });
  }

  public showDamageIndicator(): void {
    // Create a red flash effect on the screen
    const flashOverlay = document.createElement("div");
    flashOverlay.style.position = "fixed";
    flashOverlay.style.top = "0";
    flashOverlay.style.left = "0";
    flashOverlay.style.width = "100%";
    flashOverlay.style.height = "100%";
    flashOverlay.style.backgroundColor = "rgba(255, 0, 0, 0.3)";
    flashOverlay.style.pointerEvents = "none";
    flashOverlay.style.zIndex = "9999";
    flashOverlay.style.transition = "opacity 0.3s";

    document.body.appendChild(flashOverlay);

    // Fade out and remove
    setTimeout(() => {
      flashOverlay.style.opacity = "0";
      setTimeout(() => {
        document.body.removeChild(flashOverlay);
      }, 300);
    }, 100);
  }

  public showDeathScreen(
    killerName: string,
    weaponType: string,
    onQuitToMenu?: () => void
  ): void {
    const deathScreen = document.createElement("div");
    deathScreen.id = "deathScreen";
    deathScreen.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        color: #ff0000;
        font-family: 'Orbitron', monospace;
        text-align: center;
      ">
        <h1 style="font-size: 4em; margin: 0; text-shadow: 0 0 20px #ff0000;">💀 YOU DIED 💀</h1>
        <p style="font-size: 1.5em; margin: 20px 0;">Killed by <span style="color: #ffaa00;">${killerName}</span></p>
        <p style="font-size: 1.2em; margin: 10px 0;">Weapon: <span style="color: #ffaa00;">${weaponType}</span></p>
        <div id="respawnCountdown" style="font-size: 2em; margin: 30px 0; color: #ffff00;">
          Respawn available in: <span id="countdownNumber">5</span>s
        </div>
        <div style="display: flex; gap: 20px; justify-content: center;">
          <button id="respawnButton" style="
            font-size: 1.5em;
            padding: 15px 30px;
            background: #333;
            color: #fff;
            border: 2px solid #666;
            border-radius: 5px;
            cursor: not-allowed;
            opacity: 0.5;
            font-family: 'Orbitron', monospace;
          " disabled>RESPAWN</button>
          <button id="quitToMenuButton" style="
            font-size: 1.5em;
            padding: 15px 30px;
            background: #660000;
            color: #fff;
            border: 2px solid #990000;
            border-radius: 5px;
            cursor: pointer;
            font-family: 'Orbitron', monospace;
          ">QUIT TO MENU</button>
        </div>
      </div>
        `;

    document.body.appendChild(deathScreen);

    // Set up event handler for quit button after DOM is ready
    setTimeout(() => {
      const quitButton = document.getElementById("quitToMenuButton");
      if (quitButton && onQuitToMenu) {
        console.log("🔧 Setting up quit button event handler");
        quitButton.onclick = (e) => {
          e.preventDefault();
          console.log("🚪 Quit button clicked - calling onQuitToMenu");
          onQuitToMenu();
        };
      } else {
        console.warn("❗ Quit button or onQuitToMenu callback not found");
      }
    }, 50);
  }

  public updateRespawnCountdown(seconds: number): void {
    const updateCountdown = () => {
      const countdownElement = document.getElementById("countdownNumber");
      if (countdownElement) {
        countdownElement.textContent = seconds.toString();
        console.log(`🔢 Updated countdown display to: ${seconds}`);
        return true;
      } else {
        console.warn("❗ Countdown element not found! Will retry...");
        return false;
      }
    };

    // Try to update immediately
    if (!updateCountdown()) {
      // If element not found, retry a few times with small delays
      let retries = 0;
      const retryInterval = setInterval(() => {
        if (updateCountdown() || retries >= 5) {
          clearInterval(retryInterval);
        }
        retries++;
      }, 100);
    }
  }

  public enableRespawnButton(onRespawn: () => void): void {
    const button = document.getElementById(
      "respawnButton"
    ) as HTMLButtonElement;
    const countdown = document.getElementById("respawnCountdown");

    if (button && countdown) {
      countdown.style.display = "none";
      button.disabled = false;
      button.style.opacity = "1";
      button.style.cursor = "pointer";
      button.style.background = "#ff4444";
      button.style.borderColor = "#ff6666";
      button.textContent = "RESPAWN NOW";

      button.onclick = onRespawn;
    }
  }

  public hideDeathScreen(): void {
    const deathScreen = document.getElementById("deathScreen");
    if (deathScreen) {
      document.body.removeChild(deathScreen);
    }
  }

  // Preview system for characters, weapons, demons, and scenes
  public setupPreviewSystem(): void {
    console.log("🎨 Setting up 3D preview system");

    // Create preview container if it doesn't exist
    this.previewContainer = document.getElementById("previewContainer");
    if (!this.previewContainer) {
      console.warn("❌ Preview container not found in DOM");
      return;
    }

    console.log("📦 Preview container found:", {
      width: this.previewContainer.clientWidth,
      height: this.previewContainer.clientHeight,
      display: window.getComputedStyle(this.previewContainer).display,
    });

    // Clean up any existing preview system
    if (this.previewRenderer) {
      console.log("🧹 Cleaning up existing preview system");
      this.cleanupPreview();
    }

    // Initialize Three.js components for preview
    this.initializePreviewRenderer();
    this.setupPreviewEventListeners();

    console.log("✅ Preview system ready");
  }

  private initializePreviewRenderer(): void {
    if (!this.previewContainer) return;

    // Create scene
    this.previewScene = new THREE.Scene();
    this.previewScene.background = new THREE.Color(0x1a1a1a);

    // Create camera
    this.previewCamera = new THREE.PerspectiveCamera(
      75,
      this.previewContainer.clientWidth / this.previewContainer.clientHeight,
      0.1,
      1000
    );
    this.previewCamera.position.set(0, 2, 5);

    // Create renderer
    this.previewRenderer = new THREE.WebGLRenderer({ antialias: true });
    this.previewRenderer.setSize(
      this.previewContainer.clientWidth,
      this.previewContainer.clientHeight
    );
    this.previewRenderer.shadowMap.enabled = true;
    this.previewRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Ensure canvas stays within container
    const canvas = this.previewRenderer.domElement;
    canvas.className = "preview-canvas";
    canvas.style.position = "relative";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.maxWidth = "100%";
    canvas.style.maxHeight = "100%";
    canvas.style.display = "block";
    canvas.style.zIndex = "1";

    // Clear loading content and add canvas to container
    this.previewContainer.innerHTML = "";
    this.previewContainer.appendChild(canvas);

    // Add lighting
    this.setupPreviewLighting();

    // Start animation loop
    this.startPreviewAnimation();
  }

  private setupPreviewLighting(): void {
    if (!this.previewScene) return;

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.previewScene.add(ambientLight);

    // Main directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.previewScene.add(directionalLight);

    // Fill light
    const fillLight = new THREE.DirectionalLight(0x4040ff, 0.3);
    fillLight.position.set(-5, 5, -5);
    this.previewScene.add(fillLight);

    // Add a ground plane
    const groundGeometry = new THREE.PlaneGeometry(10, 10);
    const groundMaterial = new THREE.MeshLambertMaterial({
      color: 0x2a2a2a,
      transparent: true,
      opacity: 0.3,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1;
    ground.receiveShadow = true;
    this.previewScene.add(ground);
  }

  private setupPreviewEventListeners(): void {
    // Handle window resize
    window.addEventListener("resize", () => {
      this.handlePreviewResize();
    });

    // Handle container resize
    if (this.previewContainer) {
      const resizeObserver = new ResizeObserver(() => {
        this.handlePreviewResize();
      });
      resizeObserver.observe(this.previewContainer);
    }
  }

  private handlePreviewResize(): void {
    if (!this.previewContainer || !this.previewCamera || !this.previewRenderer)
      return;

    const width = this.previewContainer.clientWidth;
    const height = this.previewContainer.clientHeight;

    if (width > 0 && height > 0) {
      this.previewCamera.aspect = width / height;
      this.previewCamera.updateProjectionMatrix();
      this.previewRenderer.setSize(width, height, false); // false = don't update style

      // Ensure canvas stays constrained
      const canvas = this.previewRenderer.domElement;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
    }
  }

  private startPreviewAnimation(): void {
    const animate = () => {
      this.previewAnimationId = requestAnimationFrame(animate);

      if (this.previewScene && this.previewCamera && this.previewRenderer) {
        // Rotate preview objects slowly
        this.previewObjects.forEach((obj, index) => {
          obj.rotation.y += 0.01 + index * 0.002;
        });

        this.previewRenderer.render(this.previewScene, this.previewCamera);
      }
    };
    animate();
  }

  public stopPreviewAnimation(): void {
    if (this.previewAnimationId) {
      cancelAnimationFrame(this.previewAnimationId);
      this.previewAnimationId = null;
    }
  }

  public clearPreview(): void {
    if (!this.previewScene) return;

    // Remove all preview objects
    this.previewObjects.forEach((obj) => {
      this.previewScene!.remove(obj);
    });
    this.previewObjects = [];
  }

  public previewCharacters(networkManager?: any): void {
    this.clearPreview();
    if (!this.previewScene || !networkManager) return;

    console.log("🎭 Displaying character previews");

    // Get all available character types
    const characterTypes = this.getAllCharacterTypes(networkManager);

    // Display characters in a grid
    characterTypes.forEach((colorScheme, index) => {
      const character = this.createPreviewCharacter(
        colorScheme,
        networkManager
      );
      if (character) {
        // Position in grid
        const row = Math.floor(index / 6);
        const col = index % 6;
        character.position.set((col - 2.5) * 2.5, 0, row * 3);
        character.scale.setScalar(0.8);

        this.previewScene!.add(character);
        this.previewObjects.push(character);
      }
    });

    // Adjust camera to show all characters
    if (this.previewCamera) {
      this.previewCamera.position.set(0, 8, 12);
      this.previewCamera.lookAt(0, 0, 0);
    }
  }

  public previewWeapons(weaponSystem?: any): void {
    this.clearPreview();
    if (!this.previewScene || !weaponSystem) return;

    console.log("🔫 Displaying weapon previews");

    const weaponTypes = ["shotgun", "chaingun", "rocket", "plasma"];

    weaponTypes.forEach((weaponType, index) => {
      const weapon = this.createPreviewWeapon(weaponType, weaponSystem);
      if (weapon) {
        weapon.position.set((index - 1.5) * 3, 0, 0);
        weapon.scale.setScalar(2);

        this.previewScene!.add(weapon);
        this.previewObjects.push(weapon);
      }
    });

    // Adjust camera for weapons
    if (this.previewCamera) {
      this.previewCamera.position.set(0, 3, 8);
      this.previewCamera.lookAt(0, 0, 0);
    }
  }

  public previewDemons(demonSystem?: any): void {
    this.clearPreview();
    if (!this.previewScene || !demonSystem) return;

    console.log("👹 Displaying demon previews");

    const demonTypes = ["IMP", "DEMON", "CACODEMON", "BARON", "ARCHVILE"];

    demonTypes.forEach((demonType, index) => {
      const demon = this.createPreviewDemon(demonType, demonSystem);
      if (demon) {
        demon.position.set((index - 2) * 3, 0, 0);
        demon.scale.setScalar(0.8);

        this.previewScene!.add(demon);
        this.previewObjects.push(demon);
      }
    });

    // Adjust camera for demons
    if (this.previewCamera) {
      this.previewCamera.position.set(0, 4, 10);
      this.previewCamera.lookAt(0, 0, 0);
    }
  }

  public previewScenes(sceneManager?: any): void {
    this.clearPreview();
    if (!this.previewScene || !sceneManager) return;

    console.log("🎪 Displaying scene previews");

    // Create simplified scene representations
    const sceneTypes = [
      { name: "Hell", color: 0x8b0000 },
      { name: "Ice", color: 0x4682b4 },
      { name: "Industrial", color: 0x444444 },
      { name: "Toxic", color: 0x32cd32 },
    ];

    sceneTypes.forEach((sceneType, index) => {
      const scenePreview = this.createScenePreview(sceneType);
      if (scenePreview) {
        scenePreview.position.set((index - 1.5) * 4, 0, 0);

        this.previewScene!.add(scenePreview);
        this.previewObjects.push(scenePreview);
      }
    });

    // Adjust camera for scenes
    if (this.previewCamera) {
      this.previewCamera.position.set(0, 6, 12);
      this.previewCamera.lookAt(0, 0, 0);
    }
  }

  private getAllCharacterTypes(networkManager: any): any[] {
    // Call the private getPlayerColor method for each character index
    const characters = [];
    for (let i = 0; i < 21; i++) {
      // We have 21 character types now
      try {
        const colorScheme = networkManager.getPlayerColor(i);
        characters.push(colorScheme);
      } catch (error) {
        console.warn(`Could not get character ${i}:`, error);
      }
    }
    return characters;
  }

  private createPreviewCharacter(
    colorScheme: any,
    networkManager: any
  ): THREE.Group | null {
    try {
      // Create a character model using the network manager's method
      const character = (networkManager as any).createPlayerModel(
        colorScheme,
        colorScheme.name
      );

      // Add a simple name label
      this.addCharacterLabel(character, colorScheme);

      return character;
    } catch (error) {
      console.warn("Could not create preview character:", error);
      return null;
    }
  }

  private createPreviewWeapon(
    weaponType: string,
    weaponSystem: any
  ): THREE.Group | null {
    try {
      // Create weapon model using the network manager's weapon creation method
      const weapon =
        (weaponSystem as any).createRemotePlayerWeapon?.(weaponType) ||
        this.createSimpleWeaponPreview(weaponType);

      if (weapon) {
        // Add weapon label
        this.addWeaponLabel(weapon, weaponType);
      }

      return weapon;
    } catch (error) {
      console.warn("Could not create preview weapon:", error);
      return this.createSimpleWeaponPreview(weaponType);
    }
  }

  private createPreviewDemon(
    demonType: string,
    demonSystem: any
  ): THREE.Group | null {
    try {
      // Create demon model using the demon system
      const demon =
        demonSystem.createDemonModel?.(demonType as any) ||
        this.createSimpleDemonPreview(demonType);

      if (demon) {
        // Add demon label
        this.addDemonLabel(demon, demonType);
      }

      return demon;
    } catch (error) {
      console.warn("Could not create preview demon:", error);
      return this.createSimpleDemonPreview(demonType);
    }
  }

  private createScenePreview(sceneType: any): THREE.Group {
    const group = new THREE.Group();

    // Create a simple scene representation
    const baseGeometry = new THREE.BoxGeometry(2, 0.2, 2);
    const baseMaterial = new THREE.MeshLambertMaterial({
      color: sceneType.color,
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    group.add(base);

    // Add some decorative elements
    for (let i = 0; i < 3; i++) {
      const decorGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 6);
      const decorMaterial = new THREE.MeshLambertMaterial({
        color: new THREE.Color(sceneType.color).multiplyScalar(1.5),
      });
      const decor = new THREE.Mesh(decorGeometry, decorMaterial);
      decor.position.set(
        (Math.random() - 0.5) * 1.5,
        0.6,
        (Math.random() - 0.5) * 1.5
      );
      group.add(decor);
    }

    // Add scene label
    this.addSceneLabel(group, sceneType.name);

    return group;
  }

  private createSimpleWeaponPreview(weaponType: string): THREE.Group {
    const group = new THREE.Group();

    // Create a simple weapon representation
    const weaponGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.5);
    const weaponMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
    const weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
    group.add(weapon);

    return group;
  }

  private createSimpleDemonPreview(demonType: string): THREE.Group {
    const group = new THREE.Group();

    // Create a simple demon representation
    const bodyGeometry = new THREE.SphereGeometry(0.5, 8, 6);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x8b0000 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(body);

    return group;
  }

  private addCharacterLabel(character: THREE.Group, colorScheme: any): void {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.width = 256;
    canvas.height = 64;

    // Background
    context.fillStyle = `#${colorScheme.body.toString(16).padStart(6, "0")}`;
    context.globalAlpha = 0.8;
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Text
    context.globalAlpha = 1.0;
    context.fillStyle = "#ffffff";
    context.font = "16px Arial";
    context.textAlign = "center";
    context.fillText(`${colorScheme.emoji} ${colorScheme.name}`, 128, 40);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.set(0, 2.5, 0);
    sprite.scale.set(2, 0.5, 1);
    character.add(sprite);
  }

  private addWeaponLabel(weapon: THREE.Group, weaponType: string): void {
    // Similar label creation for weapons
    this.addSimpleLabel(weapon, weaponType.toUpperCase(), 0xff6600);
  }

  private addDemonLabel(demon: THREE.Group, demonType: string): void {
    // Similar label creation for demons
    this.addSimpleLabel(demon, demonType, 0xff0000);
  }

  private addSceneLabel(scene: THREE.Group, sceneName: string): void {
    // Similar label creation for scenes
    this.addSimpleLabel(scene, sceneName, 0x00ff00);
  }

  private addSimpleLabel(
    object: THREE.Group,
    text: string,
    color: number
  ): void {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.width = 256;
    canvas.height = 64;

    // Background
    context.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
    context.globalAlpha = 0.8;
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Text
    context.globalAlpha = 1.0;
    context.fillStyle = "#ffffff";
    context.font = "bold 18px Arial";
    context.textAlign = "center";
    context.fillText(text, 128, 40);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.set(0, 2, 0);
    sprite.scale.set(2, 0.5, 1);
    object.add(sprite);
  }

  public cleanupPreview(): void {
    this.stopPreviewAnimation();
    this.clearPreview();

    if (this.previewRenderer && this.previewContainer) {
      this.previewContainer.removeChild(this.previewRenderer.domElement);
      this.previewRenderer.dispose();
      this.previewRenderer = null;
    }

    this.previewScene = null;
    this.previewCamera = null;
    this.previewContainer = null;
  }

  public showControlsHint(): void {
    const controlsHint = document.createElement("div");
    controlsHint.id = "controls-hint";
    controlsHint.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      color: white;
      font-family: 'Orbitron', monospace;
      font-size: 14px;
      background: rgba(0, 0, 0, 0.7);
      padding: 15px;
      border-radius: 5px;
      z-index: 1000;
      max-width: 300px;
      line-height: 1.4;
      border: 1px solid #00ffff;
    `;

    controlsHint.innerHTML = `
      <div style="color: #00ffff; font-weight: bold; margin-bottom: 10px;">CONTROLS</div>
      <div>WASD / Arrows: Move</div>
      <div>Mouse: Look around</div>
      <div>Click: Shoot</div>
      <div>Space: Jump</div>
      <div>R: Reload</div>
      <div style="color: #ffff00;">T: Reset position (if stuck)</div>
      <div>1-4: Switch weapons</div>
      <div>ESC: Pause</div>
    `;

    document.body.appendChild(controlsHint);

    // Auto-hide after 8 seconds
    setTimeout(() => {
      if (controlsHint.parentNode) {
        controlsHint.style.opacity = "0";
        controlsHint.style.transition = "opacity 1s";
        setTimeout(() => {
          controlsHint.remove();
        }, 1000);
      }
    }, 8000);
  }
}
