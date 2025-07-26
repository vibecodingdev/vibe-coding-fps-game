import * as THREE from "three";
import { PlayerState, GameStats } from "@/types/game";

export class UIManager {
  private healthBar: HTMLElement | null = null;
  private healthValue: HTMLElement | null = null;
  private weaponName: HTMLElement | null = null;
  private currentAmmo: HTMLElement | null = null;
  private maxAmmo: HTMLElement | null = null;
  private waveNumber: HTMLElement | null = null;
  private killCount: HTMLElement | null = null;
  private scoreValue: HTMLElement | null = null;
  private crosshair: HTMLElement | null = null;

  // 雷达相关
  private radarCanvas: HTMLCanvasElement | null = null;
  private radarContext: CanvasRenderingContext2D | null = null;
  private readonly RADAR_SIZE = 120;
  private readonly RADAR_RANGE = 60; // 增加范围以确保能看到所有怪物

  public async initialize(): Promise<void> {
    console.log("🎮 UIManager initializing...");

    this.setupUIElements();
    this.initializeRadar();
    this.setupEventListeners();

    console.log("✅ UIManager initialized");
  }

  private setupUIElements(): void {
    // 获取UI元素引用
    this.healthBar = document.getElementById("healthBar");
    this.healthValue = document.getElementById("healthValue");
    this.weaponName = document.getElementById("currentWeapon");
    this.currentAmmo = document.getElementById("currentAmmo");
    this.maxAmmo = document.getElementById("maxAmmo");
    this.waveNumber = document.getElementById("waveNumber");
    this.killCount = document.getElementById("killCount");
    this.scoreValue = document.getElementById("scoreValue");
    this.crosshair = document.querySelector(".crosshair");

    // 如果UI元素不存在，创建它们
    this.createMissingUIElements();
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
    camera: THREE.Camera
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
          this.radarContext.fillStyle = "#ff0000"; // 红色表示恶魔
          this.radarContext.beginPath();
          this.radarContext.arc(radarX, radarY, 4, 0, Math.PI * 2); // 更大更明显
          this.radarContext.fill();

          // 添加外环以便更好地识别
          this.radarContext.strokeStyle = "#ff6666";
          this.radarContext.lineWidth = 2;
          this.radarContext.beginPath();
          this.radarContext.arc(radarX, radarY, 6, 0, Math.PI * 2);
          this.radarContext.stroke();
        }
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

  public showDamageEffect(): void {
    // 创建受伤效果
    const damageOverlay = document.createElement("div");
    damageOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle, transparent 0%, rgba(255, 0, 0, 0.3) 100%);
      pointer-events: none;
      z-index: 9999;
      animation: damageFlash 0.5s ease-out;
    `;

    // 添加动画样式
    const style = document.createElement("style");
    style.textContent = `
      @keyframes damageFlash {
        0% { opacity: 1; }
        100% { opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(damageOverlay);

    // 500ms后移除效果
    setTimeout(() => {
      if (document.body.contains(damageOverlay)) {
        document.body.removeChild(damageOverlay);
      }
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    }, 500);
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
}
