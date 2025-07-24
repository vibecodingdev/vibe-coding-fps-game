# JavaScript 重构实施指南

## 快速开始：渐进式重构

### 第一步：创建基础目录结构

```bash
mkdir -p client/src/{core,systems/{audio,ui,weapons,ai,network},entities,utils,config}
```

### 第二步：配置提取示例

#### 创建 `client/src/config/GameConfig.js`

```javascript
/**
 * @module GameConfig
 * @description 游戏核心配置
 * @aiModifiable true
 * @aiTags [config, game-balance, settings]
 */

// 游戏基础配置
export const GAME_CONFIG = {
  // 场景配置
  SCENE: {
    BOUNDARY: 45,
    GROUND_SIZE: 100,
    SKY_COLOR: 0x87ceeb,
    FOG_DENSITY: 0.002,
  },

  // 性能配置
  PERFORMANCE: {
    MAX_DEMONS: 50,
    MAX_BULLETS: 100,
    TARGET_FPS: 60,
    UPDATE_FREQUENCY: 16.67, // ms
  },

  // 玩家配置
  PLAYER: {
    HEIGHT: 1.8,
    MOVE_SPEED: 400,
    MAX_HEALTH: 100,
    INVULNERABILITY_TIME: 1000, // ms
  },
};

// 波次系统配置
export const WAVE_CONFIG = {
  INITIAL_DEMONS: 5,
  DEMONS_PER_WAVE_INCREASE: 2,
  MAX_DEMONS_PER_WAVE: 20,
  TIME_BETWEEN_WAVES: 5000, // ms
  SPAWN_INTERVAL: 1000, // ms between demon spawns
};
```

#### 创建 `client/src/config/WeaponConfig.js`

```javascript
/**
 * @module WeaponConfig
 * @description 武器配置和平衡参数
 * @aiModifiable true
 * @aiTags [weapons, balance, combat]
 */

export const WEAPONS_CONFIG = {
  shotgun: {
    name: "Shotgun",
    emoji: "🔫",
    fireRate: 800, // ms between shots
    damage: 7, // Per pellet
    pellets: 8, // Number of pellets per shot
    maxAmmo: 50,
    defaultAmmo: 50,
    recoil: 0.6,
    spread: 0.3, // Shotgun spread
    soundFile: "single gun shot.mp3",
  },

  chaingun: {
    name: "Chaingun",
    emoji: "⚡",
    fireRate: 100, // Very fast
    damage: 1,
    maxAmmo: 200,
    defaultAmmo: 200,
    recoil: 0.2,
    spread: 0.1,
    soundFile: "machine gun (rapid fire).mp3",
  },

  rocket: {
    name: "Rocket Launcher",
    emoji: "🚀",
    fireRate: 1200, // Slow but powerful
    damage: 50,
    maxAmmo: 20,
    defaultAmmo: 20,
    recoil: 1.0,
    splash: 10, // Splash damage radius
    spread: 0.02,
    soundFile: "rocket_launch.mp3",
  },

  plasma: {
    name: "Plasma Rifle",
    emoji: "🔥",
    fireRate: 200,
    damage: 4,
    maxAmmo: 100,
    defaultAmmo: 100,
    recoil: 0.3,
    spread: 0.05,
    soundFile: "plasma_fire.mp3",
  },
};

// 子弹配置
export const BULLET_CONFIG = {
  SPEED: 50,
  LIFETIME: 3000, // ms
  SIZE: 0.02,
  COLOR: 0xffff00,
  EMISSIVE_COLOR: 0xffaa00,
  EMISSIVE_INTENSITY: 0.5,
};
```

#### 创建 `client/src/config/DemonConfig.js`

```javascript
/**
 * @module DemonConfig
 * @description 恶魔类型和AI配置
 * @aiModifiable true
 * @aiTags [demons, ai, balance, enemies]
 */

export const DEMON_TYPES_CONFIG = {
  IMP: {
    name: "Imp",
    emoji: "👹",
    health: 1,
    speed: 1.0,
    scale: 1.0,
    color: 0x8b4513, // Brown
    headColor: 0x654321, // Dark brown
    eyeColor: 0xff0000, // Red
    detectRange: 60,
    attackRange: 3.5,
    chaseRange: 8,
    attackDamage: 10,
    spawnWeight: 100, // Probability weight for spawning
    attackCooldown: 180, // frames
    wanderSpeed: 0.5,
  },

  DEMON: {
    name: "Demon",
    emoji: "🐺",
    health: 2,
    speed: 1.8,
    scale: 0.9,
    color: 0x4b0000, // Dark red
    headColor: 0x8b0000, // Red
    eyeColor: 0xff4400, // Orange-red
    detectRange: 70,
    attackRange: 4.0,
    chaseRange: 10,
    attackDamage: 15,
    spawnWeight: 60,
    attackCooldown: 150,
    wanderSpeed: 0.8,
  },

  CACODEMON: {
    name: "Cacodemon",
    emoji: "👁️",
    health: 4,
    speed: 0.8,
    scale: 1.6,
    color: 0x800080, // Purple
    headColor: 0x4b0082, // Indigo
    eyeColor: 0xff0000, // Red
    detectRange: 80,
    attackRange: 6.0,
    chaseRange: 12,
    attackDamage: 20,
    spawnWeight: 30,
    attackCooldown: 120,
    wanderSpeed: 0.3,
  },

  BARON: {
    name: "Baron of Hell",
    emoji: "👑",
    health: 8,
    speed: 0.6,
    scale: 2.2,
    color: 0x006400, // Dark green
    headColor: 0x228b22, // Forest green
    eyeColor: 0xff6600, // Bright orange
    detectRange: 100,
    attackRange: 8.0,
    chaseRange: 15,
    attackDamage: 35,
    spawnWeight: 5,
    attackCooldown: 90,
    wanderSpeed: 0.2,
  },
};

// AI行为配置
export const AI_CONFIG = {
  UPDATE_FREQUENCY: 2, // Update every N frames for performance
  MAX_UPDATE_DISTANCE: 100, // Only update demons within this range
  PATHFINDING: {
    OBSTACLE_AVOIDANCE: true,
    NODE_SIZE: 2,
    MAX_PATH_LENGTH: 50,
  },
  BEHAVIOR_STATES: {
    IDLE: "idle",
    WANDERING: "wandering",
    CHASING: "chasing",
    ATTACKING: "attacking",
    FALLING: "falling",
    DEAD: "dead",
  },
};
```

### 第三步：核心系统提取

#### 创建 `client/src/core/EventBus.js`

```javascript
/**
 * @module EventBus
 * @description 游戏事件总线，处理系统间通信
 * @aiModifiable false
 * @aiTags [core, events, communication]
 */

class EventBus {
  constructor() {
    this.events = new Map();
    this.onceEvents = new Map();
    this.debugMode = false;
  }

  /**
   * 订阅事件
   * @param {string} event - 事件名称
   * @param {function} callback - 回调函数
   * @param {object} context - 回调上下文
   */
  on(event, callback, context = null) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    this.events.get(event).push({
      callback,
      context,
    });

    if (this.debugMode) {
      console.log(`📡 Event subscribed: ${event}`);
    }
  }

  /**
   * 订阅一次性事件
   */
  once(event, callback, context = null) {
    if (!this.onceEvents.has(event)) {
      this.onceEvents.set(event, []);
    }

    this.onceEvents.get(event).push({
      callback,
      context,
    });
  }

  /**
   * 发射事件
   * @param {string} event - 事件名称
   * @param {*} data - 事件数据
   */
  emit(event, data = null) {
    if (this.debugMode) {
      console.log(`📡 Event emitted: ${event}`, data);
    }

    // 处理普通事件
    if (this.events.has(event)) {
      this.events.get(event).forEach(({ callback, context }) => {
        try {
          if (context) {
            callback.call(context, data);
          } else {
            callback(data);
          }
        } catch (error) {
          console.error(`❌ Error in event handler for ${event}:`, error);
        }
      });
    }

    // 处理一次性事件
    if (this.onceEvents.has(event)) {
      const handlers = this.onceEvents.get(event);
      handlers.forEach(({ callback, context }) => {
        try {
          if (context) {
            callback.call(context, data);
          } else {
            callback(data);
          }
        } catch (error) {
          console.error(`❌ Error in once event handler for ${event}:`, error);
        }
      });
      // 清除一次性事件
      this.onceEvents.delete(event);
    }
  }

  /**
   * 取消订阅
   */
  off(event, callback) {
    if (this.events.has(event)) {
      const handlers = this.events.get(event);
      const index = handlers.findIndex(
        (handler) => handler.callback === callback
      );
      if (index > -1) {
        handlers.splice(index, 1);
        if (handlers.length === 0) {
          this.events.delete(event);
        }
      }
    }
  }

  /**
   * 清除所有事件监听器
   */
  clear() {
    this.events.clear();
    this.onceEvents.clear();
  }

  /**
   * 开启/关闭调试模式
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }
}

export default EventBus;
```

#### 创建 `client/src/core/GameState.js`

```javascript
/**
 * @module GameState
 * @description 游戏状态管理
 * @aiModifiable true
 * @aiTags [state, game-flow, management]
 */

import EventBus from "./EventBus.js";

class GameState {
  constructor() {
    this.eventBus = new EventBus();
    this.currentState = "mainMenu";
    this.previousState = null;
    this.stateData = new Map();

    // 定义有效状态
    this.validStates = [
      "mainMenu",
      "multiplayerLobby",
      "partyRoom",
      "instructions",
      "playing",
      "paused",
      "gameOver",
    ];

    // 初始化状态数据
    this.initializeStateData();
  }

  /**
   * 初始化各状态的数据
   */
  initializeStateData() {
    this.stateData.set("playing", {
      gameInitialized: false,
      isMultiplayer: false,
      playerHealth: 100,
      currentWave: 1,
      demonKills: 0,
      score: 0,
      startTime: null,
    });

    this.stateData.set("paused", {
      pausedAt: null,
      totalPausedTime: 0,
    });

    this.stateData.set("gameOver", {
      finalScore: 0,
      finalWave: 1,
      finalKills: 0,
      gameEndTime: null,
    });
  }

  /**
   * 切换游戏状态
   * @param {string} newState - 新状态
   * @param {object} data - 状态切换时传递的数据
   */
  setState(newState, data = {}) {
    if (!this.validStates.includes(newState)) {
      console.error(`❌ Invalid state: ${newState}`);
      return false;
    }

    const oldState = this.currentState;

    // 触发状态退出事件
    this.eventBus.emit("state:exit", {
      state: oldState,
      newState: newState,
    });

    // 更新状态
    this.previousState = oldState;
    this.currentState = newState;

    // 更新状态数据
    if (data && Object.keys(data).length > 0) {
      const existingData = this.stateData.get(newState) || {};
      this.stateData.set(newState, { ...existingData, ...data });
    }

    // 触发状态进入事件
    this.eventBus.emit("state:enter", {
      state: newState,
      previousState: oldState,
      data: this.stateData.get(newState),
    });

    // 触发状态改变事件
    this.eventBus.emit("state:change", {
      from: oldState,
      to: newState,
      data: this.stateData.get(newState),
    });

    console.log(`🎮 State changed: ${oldState} → ${newState}`);
    return true;
  }

  /**
   * 获取当前状态
   */
  getCurrentState() {
    return this.currentState;
  }

  /**
   * 获取上一个状态
   */
  getPreviousState() {
    return this.previousState;
  }

  /**
   * 检查是否处于某个状态
   */
  isState(state) {
    return this.currentState === state;
  }

  /**
   * 获取状态数据
   */
  getStateData(state = null) {
    const targetState = state || this.currentState;
    return this.stateData.get(targetState) || {};
  }

  /**
   * 更新状态数据
   */
  updateStateData(key, value, state = null) {
    const targetState = state || this.currentState;
    const currentData = this.stateData.get(targetState) || {};
    currentData[key] = value;
    this.stateData.set(targetState, currentData);

    // 触发数据更新事件
    this.eventBus.emit("state:dataUpdate", {
      state: targetState,
      key,
      value,
      allData: currentData,
    });
  }

  /**
   * 重置状态数据
   */
  resetStateData(state = null) {
    const targetState = state || this.currentState;
    this.stateData.delete(targetState);
    this.initializeStateData();
  }
}

export default GameState;
```

### 第四步：工具函数模块化

#### 创建 `client/src/utils/MathUtils.js`

```javascript
/**
 * @module MathUtils
 * @description 数学工具函数
 * @aiModifiable true
 * @aiTags [math, utils, calculations]
 */

export class MathUtils {
  /**
   * 计算两点之间的距离
   * @param {Object} pos1 - 第一个点 {x, y, z}
   * @param {Object} pos2 - 第二个点 {x, y, z}
   * @returns {number} 距离
   */
  static distance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * 计算两点之间的距离（忽略Y轴）
   */
  static distance2D(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  /**
   * 限制数值范围
   * @param {number} value - 要限制的值
   * @param {number} min - 最小值
   * @param {number} max - 最大值
   * @returns {number} 限制后的值
   */
  static clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * 线性插值
   * @param {number} a - 起始值
   * @param {number} b - 结束值
   * @param {number} t - 插值参数 (0-1)
   * @returns {number} 插值结果
   */
  static lerp(a, b, t) {
    return a + (b - a) * this.clamp(t, 0, 1);
  }

  /**
   * 生成指定范围内的随机数
   * @param {number} min - 最小值
   * @param {number} max - 最大值
   * @returns {number} 随机数
   */
  static random(min, max) {
    return Math.random() * (max - min) + min;
  }

  /**
   * 生成随机整数
   */
  static randomInt(min, max) {
    return Math.floor(this.random(min, max + 1));
  }

  /**
   * 角度转弧度
   */
  static degToRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * 弧度转角度
   */
  static radToDeg(radians) {
    return radians * (180 / Math.PI);
  }

  /**
   * 归一化向量
   * @param {Object} vector - 向量 {x, y, z}
   * @returns {Object} 归一化后的向量
   */
  static normalize(vector) {
    const length = Math.sqrt(
      vector.x * vector.x + vector.y * vector.y + vector.z * vector.z
    );
    if (length === 0) return { x: 0, y: 0, z: 0 };

    return {
      x: vector.x / length,
      y: vector.y / length,
      z: vector.z / length,
    };
  }

  /**
   * 向量点积
   */
  static dot(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  }

  /**
   * 向量叉积
   */
  static cross(v1, v2) {
    return {
      x: v1.y * v2.z - v1.z * v2.y,
      y: v1.z * v2.x - v1.x * v2.z,
      z: v1.x * v2.y - v1.y * v2.x,
    };
  }

  /**
   * 检查点是否在边界内
   * @param {Object} point - 点 {x, z}
   * @param {number} boundary - 边界大小
   * @returns {boolean} 是否在边界内
   */
  static isWithinBounds(point, boundary) {
    return Math.abs(point.x) <= boundary && Math.abs(point.z) <= boundary;
  }

  /**
   * 将点限制在边界内
   */
  static constrainToBounds(point, boundary) {
    return {
      x: this.clamp(point.x, -boundary, boundary),
      y: point.y,
      z: this.clamp(point.z, -boundary, boundary),
    };
  }
}

export default MathUtils;
```

### 第五步：系统模块化示例

#### 创建 `client/src/systems/weapons/WeaponManager.js`

```javascript
/**
 * @module WeaponManager
 * @description 武器系统管理器
 * @aiModifiable true
 * @aiTags [weapons, combat, shooting, manager]
 */

import { WEAPONS_CONFIG, BULLET_CONFIG } from "../../config/WeaponConfig.js";
import EventBus from "../../core/EventBus.js";

class WeaponManager {
  constructor(scene, eventBus) {
    this.scene = scene;
    this.eventBus = eventBus || new EventBus();

    // 当前武器状态
    this.currentWeapon = "shotgun";
    this.weapons = this.initializeWeapons();
    this.lastShotTime = 0;
    this.isAutoFiring = false;
    this.mouseHeld = false;

    // 后坐力系统
    this.recoilOffset = 0;
    this.recoilVelocity = 0;
    this.basePosition = { x: 0, y: -3, z: -5 };

    // 订阅事件
    this.setupEventListeners();

    console.log("🔫 WeaponManager initialized");
  }

  /**
   * 初始化武器数据
   */
  initializeWeapons() {
    const weapons = {};

    Object.keys(WEAPONS_CONFIG).forEach((weaponKey) => {
      weapons[weaponKey] = {
        ...WEAPONS_CONFIG[weaponKey],
        currentAmmo: WEAPONS_CONFIG[weaponKey].defaultAmmo,
      };
    });

    return weapons;
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    this.eventBus.on("player:mouseDown", this.handleMouseDown.bind(this));
    this.eventBus.on("player:mouseUp", this.handleMouseUp.bind(this));
    this.eventBus.on("player:switchWeapon", this.switchWeapon.bind(this));
    this.eventBus.on("player:reload", this.reload.bind(this));
    this.eventBus.on("ammo:pickup", this.addAmmo.bind(this));
  }

  /**
   * 处理鼠标按下
   */
  handleMouseDown(event) {
    if (event.button === 0) {
      // 左键
      this.mouseHeld = true;
      this.shoot();
    } else if (event.button === 2) {
      // 右键
      this.switchWeapon();
    }
  }

  /**
   * 处理鼠标释放
   */
  handleMouseUp(event) {
    if (event.button === 0) {
      this.mouseHeld = false;
      this.isAutoFiring = false;
    }
  }

  /**
   * 发射武器
   * @returns {boolean} 是否成功发射
   */
  shoot() {
    const weapon = this.weapons[this.currentWeapon];
    const currentTime = Date.now();

    // 检查射速限制
    if (currentTime - this.lastShotTime < weapon.fireRate) {
      return false;
    }

    // 检查弹药
    if (weapon.currentAmmo <= 0) {
      this.eventBus.emit("weapon:outOfAmmo", { weapon: this.currentWeapon });
      return false;
    }

    // 消耗弹药
    weapon.currentAmmo--;
    this.lastShotTime = currentTime;

    // 发射子弹
    this.createBullets(weapon);

    // 应用后坐力
    this.applyRecoil(weapon.recoil);

    // 触发事件
    this.eventBus.emit("weapon:fire", {
      weapon: this.currentWeapon,
      ammoRemaining: weapon.currentAmmo,
      damage: weapon.damage,
    });

    // 启动自动射击（如果是连发武器）
    if (weapon.name === "Chaingun" && this.mouseHeld) {
      this.isAutoFiring = true;
    }

    return true;
  }

  /**
   * 创建子弹
   * @param {Object} weapon - 武器配置
   */
  createBullets(weapon) {
    const pellets = weapon.pellets || 1;

    for (let i = 0; i < pellets; i++) {
      this.createSingleBullet(weapon);
    }
  }

  /**
   * 创建单个子弹
   * @param {Object} weapon - 武器配置
   */
  createSingleBullet(weapon) {
    // 获取相机位置和方向
    const camera = this.scene.getObjectByName("player-camera");
    if (!camera) return;

    const cameraPosition = camera.position.clone();
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);

    // 应用武器散布
    if (weapon.spread && weapon.spread > 0) {
      cameraDirection.x += (Math.random() - 0.5) * weapon.spread;
      cameraDirection.y += (Math.random() - 0.5) * weapon.spread;
      cameraDirection.z += (Math.random() - 0.5) * weapon.spread;
      cameraDirection.normalize();
    }

    // 创建子弹几何体
    const bulletGeometry = new THREE.SphereGeometry(BULLET_CONFIG.SIZE, 8, 8);
    const bulletMaterial = new THREE.MeshBasicMaterial({
      color: BULLET_CONFIG.COLOR,
      emissive: BULLET_CONFIG.EMISSIVE_COLOR,
      emissiveIntensity: BULLET_CONFIG.EMISSIVE_INTENSITY,
    });

    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);

    // 设置子弹位置
    bullet.position.copy(cameraPosition);
    bullet.position.add(cameraDirection.clone().multiplyScalar(2));

    // 设置子弹数据
    bullet.userData = {
      velocity: cameraDirection.clone().multiplyScalar(BULLET_CONFIG.SPEED),
      damage: weapon.damage,
      weapon: this.currentWeapon,
      creationTime: Date.now(),
      lifetime: BULLET_CONFIG.LIFETIME,
    };

    this.scene.add(bullet);

    // 触发子弹创建事件
    this.eventBus.emit("bullet:created", {
      bullet,
      weapon: this.currentWeapon,
      damage: weapon.damage,
    });
  }

  /**
   * 应用武器后坐力
   * @param {number} recoilAmount - 后坐力强度
   */
  applyRecoil(recoilAmount) {
    this.recoilVelocity += recoilAmount;
    this.eventBus.emit("weapon:recoil", { amount: recoilAmount });
  }

  /**
   * 更新武器位置（处理后坐力动画）
   * @param {number} deltaTime - 时间增量
   */
  update(deltaTime) {
    // 更新后坐力动画
    this.updateRecoil(deltaTime);

    // 处理自动射击
    if (this.isAutoFiring && this.mouseHeld) {
      this.shoot();
    }
  }

  /**
   * 更新后坐力动画
   * @param {number} deltaTime - 时间增量
   */
  updateRecoil(deltaTime) {
    // 后坐力恢复
    this.recoilVelocity *= 0.9; // 阻尼
    this.recoilOffset += this.recoilVelocity * deltaTime * 60;

    // 回到原位
    this.recoilOffset = THREE.MathUtils.lerp(
      this.recoilOffset,
      0,
      deltaTime * 10
    );

    // 更新武器位置
    this.eventBus.emit("weapon:positionUpdate", {
      offset: this.recoilOffset,
      basePosition: this.basePosition,
    });
  }

  /**
   * 切换武器
   */
  switchWeapon() {
    const weaponKeys = Object.keys(this.weapons);
    const currentIndex = weaponKeys.indexOf(this.currentWeapon);
    const nextIndex = (currentIndex + 1) % weaponKeys.length;

    const oldWeapon = this.currentWeapon;
    this.currentWeapon = weaponKeys[nextIndex];

    // 重置自动射击状态
    this.isAutoFiring = false;

    this.eventBus.emit("weapon:switched", {
      from: oldWeapon,
      to: this.currentWeapon,
      weaponData: this.weapons[this.currentWeapon],
    });

    console.log(`🔄 Switched weapon: ${oldWeapon} → ${this.currentWeapon}`);
  }

  /**
   * 添加弹药
   * @param {Object} data - 弹药数据 {weaponType, amount}
   */
  addAmmo(data) {
    const { weaponType, amount } = data;

    if (this.weapons[weaponType]) {
      const weapon = this.weapons[weaponType];
      const oldAmmo = weapon.currentAmmo;

      weapon.currentAmmo = Math.min(
        weapon.currentAmmo + amount,
        weapon.maxAmmo
      );

      const ammoAdded = weapon.currentAmmo - oldAmmo;

      this.eventBus.emit("weapon:ammoAdded", {
        weapon: weaponType,
        ammoAdded,
        currentAmmo: weapon.currentAmmo,
        maxAmmo: weapon.maxAmmo,
      });
    }
  }

  /**
   * 重新装弹
   */
  reload() {
    const weapon = this.weapons[this.currentWeapon];

    if (weapon.currentAmmo < weapon.maxAmmo) {
      weapon.currentAmmo = weapon.maxAmmo;

      this.eventBus.emit("weapon:reloaded", {
        weapon: this.currentWeapon,
        ammo: weapon.currentAmmo,
      });
    }
  }

  /**
   * 获取当前武器信息
   */
  getCurrentWeaponInfo() {
    return {
      name: this.currentWeapon,
      ...this.weapons[this.currentWeapon],
    };
  }

  /**
   * 获取所有武器信息
   */
  getAllWeaponsInfo() {
    return { ...this.weapons };
  }

  /**
   * 重置武器系统
   */
  reset() {
    this.currentWeapon = "shotgun";
    this.weapons = this.initializeWeapons();
    this.lastShotTime = 0;
    this.isAutoFiring = false;
    this.mouseHeld = false;
    this.recoilOffset = 0;
    this.recoilVelocity = 0;

    this.eventBus.emit("weapon:reset");
  }

  /**
   * 销毁武器管理器
   */
  destroy() {
    this.eventBus.off("player:mouseDown", this.handleMouseDown);
    this.eventBus.off("player:mouseUp", this.handleMouseUp);
    this.eventBus.off("player:switchWeapon", this.switchWeapon);
    this.eventBus.off("player:reload", this.reload);
    this.eventBus.off("ammo:pickup", this.addAmmo);
  }
}

export default WeaponManager;
```

### 主入口文件重构

#### 创建 `client/src/main.js`

```javascript
/**
 * @module Main
 * @description 游戏主入口文件
 * @aiModifiable true
 * @aiTags [main, initialization, bootstrap]
 */

// 导入核心模块
import EventBus from "./core/EventBus.js";
import GameState from "./core/GameState.js";

// 导入配置
import { GAME_CONFIG } from "./config/GameConfig.js";
import { WEAPONS_CONFIG } from "./config/WeaponConfig.js";
import { DEMON_TYPES_CONFIG } from "./config/DemonConfig.js";

// 导入系统
import WeaponManager from "./systems/weapons/WeaponManager.js";

// 导入工具
import MathUtils from "./utils/MathUtils.js";

/**
 * 游戏主类
 */
class Game {
  constructor() {
    console.log("🎮 Initializing DOOM Protocol...");

    // 核心系统
    this.eventBus = new EventBus();
    this.gameState = new GameState();

    // Three.js 对象
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;

    // 游戏系统
    this.systems = new Map();

    // 游戏状态
    this.isRunning = false;
    this.lastTime = 0;

    // 绑定方法
    this.animate = this.animate.bind(this);

    // 设置事件监听器
    this.setupEventListeners();
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 游戏状态事件
    this.gameState.eventBus.on(
      "state:change",
      this.handleStateChange.bind(this)
    );

    // 窗口事件
    window.addEventListener("resize", this.handleResize.bind(this));
    window.addEventListener("beforeunload", this.cleanup.bind(this));
  }

  /**
   * 初始化游戏
   */
  async init() {
    try {
      console.log("🔧 Initializing game systems...");

      // 初始化 Three.js
      await this.initThreeJS();

      // 初始化游戏系统
      await this.initSystems();

      // 设置场景
      await this.setupScene();

      // 设置控制器
      await this.setupControls();

      // 启动动画循环
      this.start();

      console.log("✅ Game initialized successfully");
    } catch (error) {
      console.error("❌ Game initialization failed:", error);
      throw error;
    }
  }

  /**
   * 初始化 Three.js
   */
  async initThreeJS() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.name = "main-scene";

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.name = "player-camera";
    this.camera.position.set(0, GAME_CONFIG.PLAYER.HEIGHT, 20);

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(GAME_CONFIG.SCENE.SKY_COLOR);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 添加到DOM
    document.body.appendChild(this.renderer.domElement);

    console.log("✅ Three.js initialized");
  }

  /**
   * 初始化游戏系统
   */
  async initSystems() {
    // 武器系统
    const weaponManager = new WeaponManager(this.scene, this.eventBus);
    this.systems.set("weapons", weaponManager);

    // TODO: 添加其他系统
    // const audioManager = new AudioManager(this.eventBus);
    // this.systems.set('audio', audioManager);

    console.log("✅ Game systems initialized");
  }

  /**
   * 设置场景
   */
  async setupScene() {
    // 创建地面
    this.createGround();

    // 添加光照
    this.addLighting();

    // TODO: 添加其他场景对象

    console.log("✅ Scene setup complete");
  }

  /**
   * 创建地面
   */
  createGround() {
    const groundGeometry = new THREE.PlaneGeometry(
      GAME_CONFIG.SCENE.GROUND_SIZE,
      GAME_CONFIG.SCENE.GROUND_SIZE
    );

    const groundMaterial = new THREE.MeshLambertMaterial({
      color: 0x654321,
    });

    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.name = "ground";

    this.scene.add(ground);
  }

  /**
   * 添加光照
   */
  addLighting() {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    this.scene.add(ambientLight);

    // 方向光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);
  }

  /**
   * 设置控制器
   */
  async setupControls() {
    // TODO: 设置 PointerLockControls
    console.log("✅ Controls setup complete");
  }

  /**
   * 启动游戏循环
   */
  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animate();
    console.log("🚀 Game loop started");
  }

  /**
   * 停止游戏循环
   */
  stop() {
    this.isRunning = false;
    console.log("⏹️ Game loop stopped");
  }

  /**
   * 主游戏循环
   */
  animate() {
    if (!this.isRunning) return;

    requestAnimationFrame(this.animate);

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // 更新游戏系统
    this.update(deltaTime);

    // 渲染场景
    this.render();
  }

  /**
   * 更新游戏逻辑
   */
  update(deltaTime) {
    // 只在游戏进行时更新
    if (this.gameState.isState("playing")) {
      // 更新所有系统
      this.systems.forEach((system) => {
        if (system.update) {
          system.update(deltaTime);
        }
      });
    }
  }

  /**
   * 渲染场景
   */
  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * 处理状态改变
   */
  handleStateChange(data) {
    console.log(`🎮 Game state changed: ${data.from} → ${data.to}`);

    // 根据状态执行相应逻辑
    switch (data.to) {
      case "playing":
        this.handleGameStart();
        break;
      case "paused":
        this.handleGamePause();
        break;
      case "gameOver":
        this.handleGameOver();
        break;
    }
  }

  /**
   * 处理游戏开始
   */
  handleGameStart() {
    console.log("🎮 Game started");
    // TODO: 初始化游戏实体
  }

  /**
   * 处理游戏暂停
   */
  handleGamePause() {
    console.log("⏸️ Game paused");
  }

  /**
   * 处理游戏结束
   */
  handleGameOver() {
    console.log("💀 Game over");
  }

  /**
   * 处理窗口大小改变
   */
  handleResize() {
    if (this.camera && this.renderer) {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  /**
   * 清理资源
   */
  cleanup() {
    this.stop();

    // 清理系统
    this.systems.forEach((system) => {
      if (system.destroy) {
        system.destroy();
      }
    });

    // 清理 Three.js 资源
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(
          this.renderer.domElement
        );
      }
    }

    console.log("🧹 Game cleanup complete");
  }
}

// 全局游戏实例
let gameInstance = null;

/**
 * 初始化游戏
 */
export async function initGame() {
  try {
    gameInstance = new Game();
    await gameInstance.init();
    return gameInstance;
  } catch (error) {
    console.error("❌ Failed to initialize game:", error);
    throw error;
  }
}

/**
 * 获取游戏实例
 */
export function getGameInstance() {
  return gameInstance;
}

// 在 DOM 加载完成后自动初始化
document.addEventListener("DOMContentLoaded", () => {
  console.log("📄 DOM loaded, initializing game...");
  initGame().catch((error) => {
    console.error("❌ Game initialization error:", error);
  });
});

// 导出给旧代码使用的全局函数
window.startGame = () => {
  if (gameInstance) {
    gameInstance.gameState.setState("playing");
  }
};

window.pauseGame = () => {
  if (gameInstance) {
    gameInstance.gameState.setState("paused");
  }
};

// 使所有配置在全局可用（兼容性）
window.GAME_CONFIG = GAME_CONFIG;
window.WEAPONS_CONFIG = WEAPONS_CONFIG;
window.DEMON_TYPES_CONFIG = DEMON_TYPES_CONFIG;
window.MathUtils = MathUtils;
```

## 迁移检查清单

### ✅ 阶段 1: 配置提取

- [ ] 创建 `config/` 目录
- [ ] 提取游戏配置到 `GameConfig.js`
- [ ] 提取武器配置到 `WeaponConfig.js`
- [ ] 提取恶魔配置到 `DemonConfig.js`
- [ ] 更新原始文件中的配置引用

### ✅ 阶段 2: 核心系统

- [ ] 创建 `core/EventBus.js`
- [ ] 创建 `core/GameState.js`
- [ ] 创建主入口 `main.js`
- [ ] 测试事件系统工作正常

### ✅ 阶段 3: 工具模块

- [ ] 创建 `utils/MathUtils.js`
- [ ] 提取其他工具函数
- [ ] 更新引用关系

### ✅ 阶段 4: 系统模块化

- [ ] 重构武器系统 `systems/weapons/WeaponManager.js`
- [ ] 重构 UI 系统
- [ ] 重构音频系统
- [ ] 重构 AI 系统
- [ ] 重构网络系统

### ✅ 阶段 5: 测试和优化

- [ ] 创建单元测试
- [ ] 性能测试
- [ ] 兼容性测试
- [ ] 文档完善

这个实施指南提供了具体的代码示例和步骤，可以帮助您逐步将现有的大型单文件重构为模块化架构。
