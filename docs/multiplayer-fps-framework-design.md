# 多人 FPS 框架设计方案

## 1. 项目概述

### 1.1 目标

将现有的单人 FPS 僵尸生存游戏改造为支持多人实时对战的 FPS 游戏，保持原有的游戏机制并增加多人协作功能。

### 1.2 技术栈

- **前端**: Three.js + Socket.IO Client
- **后端**: Node.js + Express + Socket.IO Server + TypeScript
- **通信协议**: WebSocket (Socket.IO)
- **数据同步**: 客户端预测 + 服务器权威 + 插值补偿

## 2. 架构设计

### 2.1 总体架构图

```
┌─────────────────┐    WebSocket     ┌─────────────────┐
│   Client 1      │◄────────────────►│                 │
│   (Three.js)    │                  │   Socket.IO     │
└─────────────────┘                  │    Server       │
                                     │                 │
┌─────────────────┐    WebSocket     │  Game State     │
│   Client 2      │◄────────────────►│   Authority     │
│   (Three.js)    │                  │                 │
└─────────────────┘                  └─────────────────┘
                                              │
┌─────────────────┐    WebSocket              │
│   Client N      │◄─────────────────────────┘
│   (Three.js)    │
└─────────────────┘
```

### 2.2 系统组件划分

#### 2.2.1 客户端组件

- **网络管理器 (NetworkManager)**: Socket.IO 连接管理
- **玩家管理器 (PlayerManager)**: 本地和远程玩家状态管理
- **输入管理器 (InputManager)**: 输入捕获和预测
- **渲染管理器 (RenderManager)**: 场景渲染和插值
- **音效管理器 (AudioManager)**: 3D 音效处理
- **UI 管理器 (UIManager)**: 界面更新和状态显示

#### 2.2.2 服务器端组件

- **房间管理器 (RoomManager)**: 游戏房间管理
- **玩家管理器 (PlayerManager)**: 玩家状态验证
- **游戏逻辑管理器 (GameLogicManager)**: 核心游戏逻辑
- **碰撞检测器 (CollisionDetector)**: 服务器端碰撞验证
- **事件广播器 (EventBroadcaster)**: 事件分发和同步

## 3. 网络架构设计

### 3.1 通信模式

采用 **客户端预测 + 服务器权威 + 延迟补偿** 的混合模式：

#### 3.1.1 客户端预测 (Client-side Prediction)

- 玩家移动立即在本地执行
- 射击效果立即显示
- 减少输入延迟，提升响应性

#### 3.1.2 服务器权威 (Server Authority)

- 服务器验证所有游戏状态变更
- 碰撞检测在服务器端执行
- 防止作弊和确保游戏公平性

#### 3.1.3 延迟补偿 (Lag Compensation)

- 服务器回溯玩家位置历史
- 基于客户端时间戳验证命中
- 插值平滑远程玩家移动

### 3.2 网络协议设计

#### 3.2.1 连接和房间管理

```typescript
// 连接事件
GAME_EVENTS.CONNECTION = {
  CONNECT: "connection:connect",
  DISCONNECT: "connection:disconnect",
  RECONNECT: "connection:reconnect",
};

// 房间管理
GAME_EVENTS.ROOM = {
  CREATE: "room:create",
  JOIN: "room:join",
  LEAVE: "room:leave",
  LIST: "room:list",
  FULL: "room:full",
  STARTED: "room:started",
};
```

#### 3.2.2 玩家状态同步

```typescript
// 玩家状态
GAME_EVENTS.PLAYER = {
  SPAWN: "player:spawn",
  POSITION: "player:position", // 位置更新 (高频)
  ROTATION: "player:rotation", // 视角更新 (高频)
  STATUS: "player:status", // 状态更新 (中频)
  HEALTH: "player:health", // 血量更新 (事件驱动)
  DEATH: "player:death", // 死亡事件
  RESPAWN: "player:respawn", // 重生事件
};
```

#### 3.2.3 战斗系统

```typescript
// 武器和战斗
GAME_EVENTS.COMBAT = {
  SHOOT: "combat:shoot", // 射击事件
  HIT: "combat:hit", // 命中确认
  DAMAGE: "combat:damage", // 伤害确认
  KILL: "combat:kill", // 击杀确认
  WEAPON_SWITCH: "combat:weapon:switch", // 武器切换
  RELOAD: "combat:reload", // 重新装弹
};
```

#### 3.2.4 游戏世界状态

```typescript
// 游戏世界
GAME_EVENTS.WORLD = {
  ZOMBIE_SPAWN: "world:zombie:spawn",
  ZOMBIE_DEATH: "world:zombie:death",
  ZOMBIE_UPDATE: "world:zombie:update",
  WAVE_START: "world:wave:start",
  WAVE_COMPLETE: "world:wave:complete",
  PICKUP_SPAWN: "world:pickup:spawn",
  PICKUP_COLLECT: "world:pickup:collect",
};
```

### 3.3 数据包结构设计

#### 3.3.1 玩家位置更新 (高频 - 20Hz)

```typescript
interface PlayerPositionUpdate {
  playerId: string;
  timestamp: number;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  sequence: number; // 用于客户端预测
}
```

#### 3.3.2 射击事件 (事件驱动)

```typescript
interface ShootEvent {
  playerId: string;
  timestamp: number;
  weaponType: string;
  origin: { x: number; y: number; z: number };
  direction: { x: number; y: number; z: number };
  sequence: number;
}
```

#### 3.3.3 游戏状态快照 (低频 - 2Hz)

```typescript
interface GameStateSnapshot {
  timestamp: number;
  players: PlayerState[];
  zombies: ZombieState[];
  pickups: PickupState[];
  wave: WaveInfo;
}
```

## 4. 游戏系统改造方案

### 4.1 玩家系统改造

#### 4.1.1 多玩家支持

```typescript
// 原有单玩家状态
let playerHealth = 100;
let playerPosition = new THREE.Vector3();

// 改造为多玩家状态
interface Player {
  id: string;
  name: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  health: number;
  maxHealth: number;
  weapon: string;
  ammo: number;
  kills: number;
  deaths: number;
  isLocal: boolean;
  lastUpdate: number;
  model: THREE.Group;
}

let localPlayer: Player;
let remotePlayers: Map<string, Player> = new Map();
```

#### 4.1.2 玩家渲染系统

- **本地玩家**: 第一人称视角，只渲染武器模型
- **远程玩家**: 第三人称模型，包含完整角色和武器
- **玩家标识**: 名字显示、血条、队伍标识

### 4.2 武器系统改造

#### 4.2.1 射击权威性

```typescript
// 客户端预测射击
function clientShoot() {
  // 1. 立即显示射击效果
  createMuzzleFlash();
  playGunfireSound();

  // 2. 发送射击事件到服务器
  socket.emit(GAME_EVENTS.COMBAT.SHOOT, {
    timestamp: Date.now(),
    origin: gun.position.clone(),
    direction: getShootDirection(),
    weapon: currentWeapon,
  });

  // 3. 客户端预测命中
  predictHit();
}

// 服务器验证射击
function serverValidateShoot(shootData, playerId) {
  // 1. 验证射击合法性
  if (!canPlayerShoot(playerId, shootData.timestamp)) {
    return;
  }

  // 2. 延迟补偿命中检测
  const hit = lagCompensatedHitDetection(shootData, playerId);

  // 3. 广播射击事件
  io.to(roomId).emit(GAME_EVENTS.COMBAT.SHOOT, {
    playerId,
    ...shootData,
    hit,
  });
}
```

### 4.3 僵尸系统改造

#### 4.3.1 服务器端僵尸管理

- **生成逻辑**: 服务器统一管理僵尸生成
- **AI 行为**: 服务器计算僵尸行为和路径
- **客户端渲染**: 基于服务器状态插值渲染

```typescript
// 服务器端僵尸管理
class ServerZombieManager {
  private zombies: Map<string, Zombie> = new Map();

  spawnZombie(roomId: string) {
    const zombie = this.createZombie();
    this.zombies.set(zombie.id, zombie);

    // 广播僵尸生成
    io.to(roomId).emit(GAME_EVENTS.WORLD.ZOMBIE_SPAWN, {
      id: zombie.id,
      type: zombie.type,
      position: zombie.position,
      health: zombie.health,
    });
  }

  updateZombies(roomId: string, deltaTime: number) {
    for (const zombie of this.zombies.values()) {
      this.updateZombieAI(zombie, deltaTime);
    }

    // 定期广播僵尸状态
    const zombieStates = Array.from(this.zombies.values()).map((z) => ({
      id: z.id,
      position: z.position,
      rotation: z.rotation,
      state: z.aiState,
      targetPlayerId: z.targetPlayerId,
    }));

    io.to(roomId).emit(GAME_EVENTS.WORLD.ZOMBIE_UPDATE, zombieStates);
  }
}
```

### 4.4 波次系统改造

#### 4.4.1 协作波次机制

- **统一波次**: 所有玩家共享波次进度
- **难度调节**: 根据玩家数量调整僵尸数量和强度
- **协作奖励**: 团队击杀奖励机制

```typescript
interface WaveInfo {
  number: number;
  totalZombies: number;
  remainingZombies: number;
  playerCount: number;
  difficultyMultiplier: number;
  timeRemaining: number;
  isActive: boolean;
}
```

## 5. 性能优化策略

### 5.1 网络优化

#### 5.1.1 更新频率分层

- **关键数据** (位置、旋转): 20Hz
- **状态数据** (血量、武器): 10Hz
- **世界数据** (僵尸、道具): 5Hz
- **UI 数据** (分数、波次): 2Hz

#### 5.1.2 数据压缩

- 位置数据量化到合理精度
- 使用增量更新减少数据量
- 压缩重复和可预测的数据

#### 5.1.3 网络预测和补偿

```typescript
// 客户端预测移动
class ClientPlayerController {
  private inputBuffer: InputState[] = [];
  private stateBuffer: PlayerState[] = [];

  update(deltaTime: number) {
    // 1. 记录输入
    const input = this.captureInput();
    input.sequence = this.nextSequence++;
    this.inputBuffer.push(input);

    // 2. 预测移动
    this.predictMovement(input, deltaTime);

    // 3. 发送输入到服务器
    this.sendInput(input);

    // 4. 清理旧数据
    this.cleanupBuffers();
  }

  onServerStateUpdate(serverState: PlayerState) {
    // 1. 找到对应的本地状态
    const localState = this.findLocalState(serverState.sequence);

    // 2. 检查差异
    if (this.hasSignificantDifference(localState, serverState)) {
      // 3. 回滚并重放
      this.rollbackAndReplay(serverState);
    }
  }
}
```

### 5.2 渲染优化

#### 5.2.1 LOD 系统

- 远距离玩家使用简化模型
- 动态调整渲染质量
- 视锥剔除优化

#### 5.2.2 插值平滑

```typescript
// 远程玩家位置插值
class RemotePlayerController {
  private positionBuffer: PositionState[] = [];

  updatePosition(newPosition: PositionState) {
    this.positionBuffer.push(newPosition);

    // 保持100ms的缓冲区
    const renderTime = Date.now() - 100;
    this.interpolateToTime(renderTime);
  }

  interpolateToTime(targetTime: number) {
    // 找到时间点前后的状态
    const [before, after] = this.findSurroundingStates(targetTime);

    if (before && after) {
      // 线性插值
      const alpha =
        (targetTime - before.timestamp) / (after.timestamp - before.timestamp);

      this.player.position.lerpVectors(before.position, after.position, alpha);
    }
  }
}
```

## 6. 实现阶段规划

### 6.1 第一阶段：基础多人框架 (1-2 周)

1. **服务器端基础设施**

   - 房间管理系统
   - 玩家连接管理
   - 基础事件系统

2. **客户端网络层**

   - Socket.IO 连接管理
   - 基础事件处理
   - 简单状态同步

3. **多玩家显示**
   - 远程玩家模型渲染
   - 基础位置同步
   - 玩家列表 UI

### 6.2 第二阶段：战斗系统同步 (2-3 周)

1. **射击同步**

   - 客户端预测射击
   - 服务器验证命中
   - 伤害确认系统

2. **武器系统**

   - 多武器支持
   - 弹药同步
   - 重装系统

3. **音效和特效**
   - 3D 位置音效
   - 多玩家特效同步
   - 命中反馈

### 6.3 第三阶段：游戏逻辑同步 (2-3 周)

1. **僵尸系统同步**

   - 服务器端僵尸 AI
   - 客户端插值渲染
   - 碰撞检测同步

2. **波次系统**

   - 多人协作波次
   - 难度平衡调整
   - 进度同步

3. **道具系统**
   - 道具生成同步
   - 拾取冲突解决
   - 效果同步

### 6.4 第四阶段：优化和完善 (2-3 周)

1. **性能优化**

   - 网络流量优化
   - 渲染性能优化
   - 内存管理

2. **用户体验**

   - 连接状态提示
   - 延迟显示
   - 重连机制

3. **平衡性调整**
   - 多人游戏平衡
   - 团队合作机制
   - 竞技元素

### 6.5 第五阶段：高级功能 (2-4 周)

1. **观战系统**

   - 观察者模式
   - 回放功能
   - 统计数据

2. **社交功能**

   - 聊天系统
   - 好友系统
   - 排行榜

3. **自定义功能**
   - 地图编辑器
   - 模组支持
   - 服务器浏览器

## 7. 技术风险评估

### 7.1 高风险项

- **网络延迟处理**: 需要精细的预测和补偿算法
- **作弊防护**: 客户端预测容易被利用
- **状态同步**: 复杂的游戏状态需要精确同步

### 7.2 中风险项

- **性能优化**: 多人游戏对性能要求更高
- **用户体验**: 网络问题影响游戏体验
- **平衡性**: 多人协作需要重新平衡

### 7.3 应对策略

- 渐进式开发，及早测试网络功能
- 建立完善的日志和监控系统
- 预留充足的优化和调试时间

## 8. 部署和运维考虑

### 8.1 服务器架构

- 支持水平扩展的房间系统
- 负载均衡和故障转移
- 数据持久化和备份

### 8.2 监控和运维

- 实时性能监控
- 错误日志收集
- 玩家行为分析

### 8.3 版本管理

- 客户端版本检查
- 热更新机制
- 回滚策略

---

这个设计方案为将现有单人 FPS 游戏改造为多人游戏提供了完整的技术路线图。在实施过程中，建议先实现核心的多人连接和基础同步功能，然后逐步添加复杂的游戏机制。
