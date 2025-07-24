# JavaScript 代码组织方案设计

## 项目现状分析

当前项目特点：

- **文件规模**: `script.js` 约 7074 行，单文件包含所有逻辑
- **功能复杂度**: 包含游戏引擎、AI 系统、网络、音频、UI 等多个子系统
- **维护难度**: 大单文件导致代码定位、调试、测试困难
- **AI 开发友好性**: 需要更好的模块化以支持 AI Agent 精确定位和修改代码

## 方案一：模块化分层架构 (推荐主方案)

### 1.1 目录结构

```
client/
├── src/
│   ├── core/                 # 核心系统
│   │   ├── Engine.js         # 游戏引擎核心
│   │   ├── GameState.js      # 游戏状态管理
│   │   ├── EventBus.js       # 事件总线
│   │   └── ResourceManager.js # 资源管理
│   ├── systems/              # 游戏系统
│   │   ├── audio/            # 音频系统
│   │   │   ├── AudioManager.js
│   │   │   ├── SoundEffects.js
│   │   │   └── VoiceChat.js
│   │   ├── rendering/        # 渲染系统
│   │   │   ├── SceneManager.js
│   │   │   ├── LightingManager.js
│   │   │   └── EffectsManager.js
│   │   ├── physics/          # 物理系统
│   │   │   ├── CollisionManager.js
│   │   │   └── MovementController.js
│   │   ├── ai/               # AI系统
│   │   │   ├── DemonAI.js
│   │   │   ├── PathFinding.js
│   │   │   └── BehaviorTree.js
│   │   ├── weapons/          # 武器系统
│   │   │   ├── WeaponManager.js
│   │   │   ├── BulletSystem.js
│   │   │   └── WeaponTypes.js
│   │   ├── ui/               # UI系统
│   │   │   ├── UIManager.js
│   │   │   ├── MenuSystem.js
│   │   │   ├── HUD.js
│   │   │   └── RadarSystem.js
│   │   └── network/          # 网络系统
│   │       ├── NetworkManager.js
│   │       ├── RoomManager.js
│   │       └── PlayerSync.js
│   ├── entities/             # 游戏实体
│   │   ├── Player.js
│   │   ├── Demon.js
│   │   ├── Bullet.js
│   │   ├── AmmoPack.js
│   │   └── HealthPack.js
│   ├── utils/                # 工具函数
│   │   ├── MathUtils.js
│   │   ├── GeometryUtils.js
│   │   ├── ColorUtils.js
│   │   └── PerformanceUtils.js
│   ├── config/               # 配置文件
│   │   ├── GameConfig.js     # 游戏配置
│   │   ├── WeaponConfig.js   # 武器配置
│   │   ├── DemonConfig.js    # 恶魔配置
│   │   └── UIConfig.js       # UI配置
│   └── main.js              # 主入口文件
├── assets/                   # 资源文件
├── tests/                    # 测试文件 (保持现有结构)
├── index.html               # 主页面
└── build.js                 # 构建脚本 (可选)
```

### 1.2 核心架构原则

#### 事件驱动架构

```javascript
// core/EventBus.js
class EventBus {
  constructor() {
    this.events = new Map();
  }

  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(callback);
  }

  emit(event, data) {
    if (this.events.has(event)) {
      this.events.get(event).forEach((callback) => callback(data));
    }
  }
}
```

#### 系统管理器模式

```javascript
// core/Engine.js
class GameEngine {
  constructor() {
    this.systems = new Map();
    this.eventBus = new EventBus();
    this.running = false;
  }

  registerSystem(name, system) {
    system.eventBus = this.eventBus;
    this.systems.set(name, system);
  }

  update(deltaTime) {
    this.systems.forEach((system) => {
      if (system.update) {
        system.update(deltaTime);
      }
    });
  }
}
```

### 1.3 AI Agent 开发优化

#### 模块元数据系统

```javascript
// 每个模块包含AI友好的元数据
/**
 * @module WeaponManager
 * @description 管理所有武器相关逻辑，包括发射、换弹、伤害计算
 * @dependencies [BulletSystem, AudioManager, UIManager]
 * @aiTags [weapons, shooting, combat, bullets]
 * @lastModified 2024-01-15
 */
class WeaponManager {
  /**
   * @aiMethod shootWeapon
   * @description 发射当前武器
   * @params {string} weaponType - 武器类型
   * @aiModifiable true
   */
  shootWeapon(weaponType) {
    // 实现代码
  }
}
```

#### 智能注释系统

```javascript
// 标准化的AI可读注释格式
/*
 * AI_CONTEXT: 这个函数处理恶魔的移动逻辑
 * AI_DEPENDENCIES: DemonConfig, PathFinding, CollisionManager
 * AI_MODIFIABLE: 可以修改移动速度和AI行为
 * AI_TESTABLE: 有对应的单元测试在 tests/ai/demon-movement.test.js
 */
function updateDemonMovement(demon, player) {
  // 实现代码
}
```

## 方案二：功能域驱动架构

### 2.1 按功能域组织

```
client/src/
├── domains/
│   ├── gameplay/             # 游戏玩法域
│   │   ├── wave-system/
│   │   ├── scoring/
│   │   └── player-progression/
│   ├── combat/               # 战斗域
│   │   ├── weapons/
│   │   ├── projectiles/
│   │   └── damage-system/
│   ├── entities/             # 实体域
│   │   ├── demons/
│   │   ├── player/
│   │   └── environment/
│   ├── presentation/         # 表现层域
│   │   ├── ui/
│   │   ├── effects/
│   │   └── audio/
│   └── infrastructure/       # 基础设施域
│       ├── networking/
│       ├── persistence/
│       └── configuration/
└── shared/                   # 共享工具
    ├── utils/
    ├── constants/
    └── types/
```

### 2.2 域间通信接口

```javascript
// domains/combat/CombatDomain.js
class CombatDomain {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.weaponSystem = new WeaponSystem();
    this.damageSystem = new DamageSystem();
  }

  // 对外提供的接口
  playerShoot(weaponType, direction) {
    return this.weaponSystem.fire(weaponType, direction);
  }

  applyDamage(entity, damage) {
    return this.damageSystem.apply(entity, damage);
  }
}
```

## 方案三：微服务式架构

### 3.1 服务化组织

```
client/src/
├── services/
│   ├── GameService.js        # 游戏核心服务
│   ├── AudioService.js       # 音频服务
│   ├── RenderService.js      # 渲染服务
│   ├── NetworkService.js     # 网络服务
│   ├── AIService.js          # AI服务
│   ├── UIService.js          # UI服务
│   └── PhysicsService.js     # 物理服务
├── registry/
│   └── ServiceRegistry.js    # 服务注册中心
├── interfaces/
│   ├── IGameService.js       # 服务接口定义
│   ├── IAudioService.js
│   └── ...
└── main.js
```

### 3.2 服务注册机制

```javascript
// registry/ServiceRegistry.js
class ServiceRegistry {
  constructor() {
    this.services = new Map();
    this.dependencies = new Map();
  }

  register(name, service, dependencies = []) {
    this.services.set(name, service);
    this.dependencies.set(name, dependencies);

    // 自动依赖注入
    this.injectDependencies(name, service);
  }

  get(name) {
    return this.services.get(name);
  }
}
```

## 方案四：组件化实体系统 (ECS)

### 4.1 ECS 架构

```
client/src/
├── ecs/
│   ├── Entity.js             # 实体基类
│   ├── Component.js          # 组件基类
│   ├── System.js             # 系统基类
│   └── World.js              # ECS世界管理器
├── components/               # 组件定义
│   ├── Position.js
│   ├── Velocity.js
│   ├── Health.js
│   ├── Weapon.js
│   ├── AI.js
│   └── Render.js
├── systems/                  # 系统实现
│   ├── MovementSystem.js
│   ├── RenderSystem.js
│   ├── AISystem.js
│   ├── WeaponSystem.js
│   └── CollisionSystem.js
└── entities/                 # 实体工厂
    ├── PlayerFactory.js
    ├── DemonFactory.js
    └── BulletFactory.js
```

### 4.2 ECS 实现示例

```javascript
// ecs/Entity.js
class Entity {
  constructor(id) {
    this.id = id;
    this.components = new Map();
  }

  addComponent(component) {
    this.components.set(component.constructor.name, component);
    return this;
  }

  getComponent(componentType) {
    return this.components.get(componentType.name);
  }
}

// systems/MovementSystem.js
class MovementSystem extends System {
  update(entities, deltaTime) {
    entities.forEach((entity) => {
      const position = entity.getComponent(Position);
      const velocity = entity.getComponent(Velocity);

      if (position && velocity) {
        position.x += velocity.x * deltaTime;
        position.y += velocity.y * deltaTime;
        position.z += velocity.z * deltaTime;
      }
    });
  }
}
```

## AI Agent 开发最佳实践

### 1. 智能代码标注系统

```javascript
// 为AI Agent提供语义化标注
/**
 * @aiFunction
 * @purpose "处理玩家与恶魔的碰撞检测"
 * @modificationRisk "低"
 * @testCoverage "100%"
 * @dependencies ["CollisionManager", "PlayerEntity", "DemonEntity"]
 * @aiSuggestions ["可以优化空间分割算法", "考虑添加碰撞预测"]
 */
function checkPlayerDemonCollision() {
  // AI_SAFE_ZONE_START - 核心逻辑，修改需谨慎
  const playerPos = player.getPosition();
  const demons = DemonManager.getNearbyDemons(playerPos, 5);
  // AI_SAFE_ZONE_END

  // AI_MODIFIABLE_ZONE_START - 可以安全修改的区域
  demons.forEach((demon) => {
    const distance = calculateDistance(playerPos, demon.position);
    if (distance < COLLISION_THRESHOLD) {
      handleCollision(player, demon);
    }
  });
  // AI_MODIFIABLE_ZONE_END
}
```

### 2. 配置驱动开发

```javascript
// config/AIModifiableConfig.js
export const AI_MODIFIABLE_CONFIG = {
  // AI可以安全修改的配置项
  DEMON_STATS: {
    IMP: { health: 1, speed: 1.0, damage: 10 },
    DEMON: { health: 2, speed: 1.8, damage: 15 },
    // AI_MODIFY_SAFE: 可以调整数值
  },

  WEAPON_BALANCE: {
    SHOTGUN: { damage: 7, fireRate: 800, spread: 0.3 },
    // AI_MODIFY_SAFE: 可以调整武器平衡
  },

  // AI不应修改的核心配置
  CORE_SYSTEMS: {
    // AI_MODIFY_RESTRICTED
    MAX_DEMONS: 50,
    SCENE_BOUNDS: 100,
    FIXED_TIMESTEP: 16.67,
  },
};
```

### 3. 测试驱动的模块化

```javascript
// 每个模块都有对应的测试文件
// systems/weapons/WeaponManager.test.js
import { WeaponManager } from "./WeaponManager.js";

describe("WeaponManager", () => {
  test("AI_TEST: 武器发射应该消耗弹药", () => {
    const weaponManager = new WeaponManager();
    weaponManager.equipWeapon("shotgun");

    const initialAmmo = weaponManager.getCurrentAmmo();
    weaponManager.fire();
    const afterAmmo = weaponManager.getCurrentAmmo();

    expect(afterAmmo).toBe(initialAmmo - 1);
  });
});
```

## 迁移策略

### 阶段 1: 配置提取 (第 1 周)

1. 提取所有配置到独立文件
2. 创建`config/`目录结构
3. 更新引用关系

### 阶段 2: 工具函数分离 (第 2 周)

1. 提取通用工具函数到`utils/`
2. 创建数学、几何、性能相关工具类
3. 建立单元测试

### 阶段 3: 系统模块化 (第 3-4 周)

1. 按优先级分离各个系统
2. 优先级: Audio → UI → Weapons → AI → Network
3. 建立系统间通信接口

### 阶段 4: 实体组件化 (第 5-6 周)

1. 重构游戏实体为组件结构
2. 实现 ECS 或者简化的组件系统
3. 优化性能和内存使用

### 阶段 5: 测试和优化 (第 7 周)

1. 补充自动化测试
2. 性能优化和调试
3. AI Agent 开发工具完善

## 构建工具推荐

### 简单构建脚本

```javascript
// build.js
const fs = require("fs");
const path = require("path");

class SimpleBundler {
  constructor(config) {
    this.config = config;
    this.modules = new Map();
  }

  async bundle() {
    // 读取所有模块
    await this.loadModules();

    // 解析依赖关系
    const sorted = this.topologicalSort();

    // 生成bundle文件
    this.generateBundle(sorted);
  }

  // AI友好的构建过程，支持增量构建
  incrementalBuild(changedFiles) {
    // 只重新构建有变化的模块及其依赖项
  }
}
```

## 开发工具集成

### VS Code 配置

```json
{
  "ai-code-assistant.moduleDetection": true,
  "ai-code-assistant.semanticAnnotations": true,
  "ai-code-assistant.testCoverage": true,
  "files.associations": {
    "*.config.js": "javascript"
  }
}
```

### ESLint 规则 (AI 友好)

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    "ai-friendly/require-module-docs": "error",
    "ai-friendly/require-function-purpose": "warn",
    "ai-friendly/limit-function-complexity": "error",
    "ai-friendly/require-test-coverage": "warn",
  },
};
```

## 总结与推荐

**推荐方案**: **模块化分层架构 (方案一)**

**理由**:

1. **渐进式迁移**: 可以逐步从现有代码迁移
2. **AI 友好**: 清晰的模块边界便于 AI 理解和修改
3. **可维护性**: 职责分离，易于定位和修复问题
4. **可测试性**: 每个模块都可以独立测试
5. **性能优化**: 支持按需加载和代码分割

**次要推荐**: **功能域驱动架构 (方案二)** - 适合更大规模的团队开发

通过这些方案，我们可以将 7000 行的单文件重构为结构清晰、易于维护、AI Agent 友好的模块化架构。
