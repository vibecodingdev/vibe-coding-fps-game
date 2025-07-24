# Multiplayer FPS Framework Design Specification

## 1. Project Overview

### 1.1 Objectives

Transform the existing single-player FPS zombie survival game into a real-time multiplayer FPS game that supports cooperative gameplay, while maintaining the original game mechanics and adding multiplayer collaboration features.

### 1.2 Technology Stack

- **Frontend**: Three.js + Socket.IO Client
- **Backend**: Node.js + Express + Socket.IO Server + TypeScript
- **Communication Protocol**: WebSocket (Socket.IO)
- **Data Synchronization**: Client-side Prediction + Server Authority + Interpolation Compensation

## 2. Architecture Design

### 2.1 Overall Architecture Diagram

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

### 2.2 System Component Division

#### 2.2.1 Client-side Components

- **Network Manager**: Socket.IO connection management
- **Player Manager**: Local and remote player state management
- **Input Manager**: Input capture and prediction
- **Render Manager**: Scene rendering and interpolation
- **Audio Manager**: 3D audio processing
- **UI Manager**: Interface updates and status display

#### 2.2.2 Server-side Components

- **Room Manager**: Game room management
- **Player Manager**: Player state validation
- **Game Logic Manager**: Core game logic
- **Collision Detector**: Server-side collision validation
- **Event Broadcaster**: Event distribution and synchronization

## 3. Network Architecture Design

### 3.1 Communication Model

Adopts a **Client-side Prediction + Server Authority + Lag Compensation** hybrid model:

#### 3.1.1 Client-side Prediction

- Player movement executes immediately on local client
- Shooting effects display immediately
- Reduces input lag and improves responsiveness

#### 3.1.2 Server Authority

- Server validates all game state changes
- Collision detection executes on server-side
- Prevents cheating and ensures game fairness

#### 3.1.3 Lag Compensation

- Server rewinds player position history
- Validates hits based on client timestamps
- Interpolates smooth remote player movement

### 3.2 Network Protocol Design

#### 3.2.1 Connection and Room Management

```typescript
// Connection events
GAME_EVENTS.CONNECTION = {
  CONNECT: "connection:connect",
  DISCONNECT: "connection:disconnect",
  RECONNECT: "connection:reconnect",
};

// Room management
GAME_EVENTS.ROOM = {
  CREATE: "room:create",
  JOIN: "room:join",
  LEAVE: "room:leave",
  LIST: "room:list",
  FULL: "room:full",
  STARTED: "room:started",
};
```

#### 3.2.2 Player State Synchronization

```typescript
// Player state
GAME_EVENTS.PLAYER = {
  SPAWN: "player:spawn",
  POSITION: "player:position", // Position updates (high frequency)
  ROTATION: "player:rotation", // View angle updates (high frequency)
  STATUS: "player:status", // Status updates (medium frequency)
  HEALTH: "player:health", // Health updates (event-driven)
  DEATH: "player:death", // Death events
  RESPAWN: "player:respawn", // Respawn events
};
```

#### 3.2.3 Combat System

```typescript
// Weapons and combat
GAME_EVENTS.COMBAT = {
  SHOOT: "combat:shoot", // Shooting events
  HIT: "combat:hit", // Hit confirmation
  DAMAGE: "combat:damage", // Damage confirmation
  KILL: "combat:kill", // Kill confirmation
  WEAPON_SWITCH: "combat:weapon:switch", // Weapon switching
  RELOAD: "combat:reload", // Reloading
};
```

#### 3.2.4 Game World State

```typescript
// Game world
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

### 3.3 Data Packet Structure Design

#### 3.3.1 Player Position Updates (High Frequency - 20Hz)

```typescript
interface PlayerPositionUpdate {
  playerId: string;
  timestamp: number;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  sequence: number; // Used for client-side prediction
}
```

#### 3.3.2 Shooting Events (Event-driven)

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

#### 3.3.3 Game State Snapshots (Low Frequency - 2Hz)

```typescript
interface GameStateSnapshot {
  timestamp: number;
  players: PlayerState[];
  zombies: ZombieState[];
  pickups: PickupState[];
  wave: WaveInfo;
}
```

## 4. Game System Transformation Plan

### 4.1 Player System Transformation

#### 4.1.1 Multiplayer Support

```typescript
// Original single-player state
let playerHealth = 100;
let playerPosition = new THREE.Vector3();

// Transformed to multiplayer state
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

#### 4.1.2 Player Rendering System

- **Local Player**: First-person perspective, only renders weapon model
- **Remote Players**: Third-person model, includes complete character and weapons
- **Player Identification**: Name display, health bars, team identification

### 4.2 Weapon System Transformation

#### 4.2.1 Shooting Authority

```typescript
// Client-side prediction shooting
function clientShoot() {
  // 1. Immediately display shooting effects
  createMuzzleFlash();
  playGunfireSound();

  // 2. Send shooting event to server
  socket.emit(GAME_EVENTS.COMBAT.SHOOT, {
    timestamp: Date.now(),
    origin: gun.position.clone(),
    direction: getShootDirection(),
    weapon: currentWeapon,
  });

  // 3. Client-side prediction hit
  predictHit();
}

// Server validates shooting
function serverValidateShoot(shootData, playerId) {
  // 1. Validate shooting legality
  if (!canPlayerShoot(playerId, shootData.timestamp)) {
    return;
  }

  // 2. Lag compensated hit detection
  const hit = lagCompensatedHitDetection(shootData, playerId);

  // 3. Broadcast shooting event
  io.to(roomId).emit(GAME_EVENTS.COMBAT.SHOOT, {
    playerId,
    ...shootData,
    hit,
  });
}
```

### 4.3 Zombie System Transformation

#### 4.3.1 Server-side Zombie Management

- **Spawn Logic**: Server uniformly manages zombie spawning
- **AI Behavior**: Server calculates zombie behavior and pathfinding
- **Client Rendering**: Interpolated rendering based on server state

```typescript
// Server-side zombie management
class ServerZombieManager {
  private zombies: Map<string, Zombie> = new Map();

  spawnZombie(roomId: string) {
    const zombie = this.createZombie();
    this.zombies.set(zombie.id, zombie);

    // Broadcast zombie spawn
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

    // Periodically broadcast zombie state
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

### 4.4 Wave System Transformation

#### 4.4.1 Cooperative Wave Mechanism

- **Unified Waves**: All players share wave progress
- **Difficulty Adjustment**: Adjust zombie count and strength based on player count
- **Cooperative Rewards**: Team kill reward mechanism

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

## 5. Performance Optimization Strategies

### 5.1 Network Optimization

#### 5.1.1 Update Frequency Layering

- **Critical Data** (position, rotation): 20Hz
- **State Data** (health, weapons): 10Hz
- **World Data** (zombies, pickups): 5Hz
- **UI Data** (scores, waves): 2Hz

#### 5.1.2 Data Compression

- Quantize position data to reasonable precision
- Use delta updates to reduce data volume
- Compress repetitive and predictable data

#### 5.1.3 Network Prediction and Compensation

```typescript
// Client-side prediction movement
class ClientPlayerController {
  private inputBuffer: InputState[] = [];
  private stateBuffer: PlayerState[] = [];

  update(deltaTime: number) {
    // 1. Record input
    const input = this.captureInput();
    input.sequence = this.nextSequence++;
    this.inputBuffer.push(input);

    // 2. Predict movement
    this.predictMovement(input, deltaTime);

    // 3. Send input to server
    this.sendInput(input);

    // 4. Clean up old data
    this.cleanupBuffers();
  }

  onServerStateUpdate(serverState: PlayerState) {
    // 1. Find corresponding local state
    const localState = this.findLocalState(serverState.sequence);

    // 2. Check differences
    if (this.hasSignificantDifference(localState, serverState)) {
      // 3. Rollback and replay
      this.rollbackAndReplay(serverState);
    }
  }
}
```

### 5.2 Rendering Optimization

#### 5.2.1 LOD System

- Use simplified models for distant players
- Dynamically adjust rendering quality
- Frustum culling optimization

#### 5.2.2 Interpolation Smoothing

```typescript
// Remote player position interpolation
class RemotePlayerController {
  private positionBuffer: PositionState[] = [];

  updatePosition(newPosition: PositionState) {
    this.positionBuffer.push(newPosition);

    // Maintain 100ms buffer
    const renderTime = Date.now() - 100;
    this.interpolateToTime(renderTime);
  }

  interpolateToTime(targetTime: number) {
    // Find states before and after the time point
    const [before, after] = this.findSurroundingStates(targetTime);

    if (before && after) {
      // Linear interpolation
      const alpha =
        (targetTime - before.timestamp) / (after.timestamp - before.timestamp);

      this.player.position.lerpVectors(before.position, after.position, alpha);
    }
  }
}
```

## 6. Implementation Phase Planning

### 6.1 Phase 1: Basic Multiplayer Framework (1-2 weeks)

1. **Server-side Infrastructure**

   - Room management system
   - Player connection management
   - Basic event system

2. **Client-side Network Layer**

   - Socket.IO connection management
   - Basic event handling
   - Simple state synchronization

3. **Multiplayer Display**
   - Remote player model rendering
   - Basic position synchronization
   - Player list UI

### 6.2 Phase 2: Combat System Synchronization (2-3 weeks)

1. **Shooting Synchronization**

   - Client-side prediction shooting
   - Server hit validation
   - Damage confirmation system

2. **Weapon System**

   - Multi-weapon support
   - Ammo synchronization
   - Reload system

3. **Audio and Effects**
   - 3D positional audio
   - Multiplayer effect synchronization
   - Hit feedback

### 6.3 Phase 3: Game Logic Synchronization (2-3 weeks)

1. **Zombie System Synchronization**

   - Server-side zombie AI
   - Client interpolation rendering
   - Collision detection synchronization

2. **Wave System**

   - Multiplayer cooperative waves
   - Difficulty balance adjustment
   - Progress synchronization

3. **Pickup System**
   - Pickup spawn synchronization
   - Collection conflict resolution
   - Effect synchronization

### 6.4 Phase 4: Optimization and Refinement (2-3 weeks)

1. **Performance Optimization**

   - Network traffic optimization
   - Rendering performance optimization
   - Memory management

2. **User Experience**

   - Connection status indicators
   - Latency display
   - Reconnection mechanism

3. **Balance Adjustments**
   - Multiplayer game balance
   - Team cooperation mechanics
   - Competitive elements

### 6.5 Phase 5: Advanced Features (2-4 weeks)

1. **Spectator System**

   - Observer mode
   - Replay functionality
   - Statistical data

2. **Social Features**

   - Chat system
   - Friend system
   - Leaderboards

3. **Customization Features**
   - Map editor
   - Mod support
   - Server browser

## 7. Technical Risk Assessment

### 7.1 High Risk Items

- **Network Latency Handling**: Requires precise prediction and compensation algorithms
- **Anti-cheat Protection**: Client-side prediction can be exploited
- **State Synchronization**: Complex game states require precise synchronization

### 7.2 Medium Risk Items

- **Performance Optimization**: Multiplayer games have higher performance requirements
- **User Experience**: Network issues affect game experience
- **Balance**: Multiplayer cooperation requires rebalancing

### 7.3 Mitigation Strategies

- Progressive development with early network functionality testing
- Establish comprehensive logging and monitoring systems
- Reserve adequate time for optimization and debugging

## 8. Deployment and Operations Considerations

### 8.1 Server Architecture

- Horizontally scalable room system
- Load balancing and failover
- Data persistence and backup

### 8.2 Monitoring and Operations

- Real-time performance monitoring
- Error log collection
- Player behavior analysis

### 8.3 Version Management

- Client version checking
- Hot update mechanism
- Rollback strategy

---

This design specification provides a complete technical roadmap for transforming the existing single-player FPS game into a multiplayer game. During implementation, it's recommended to first implement core multiplayer connection and basic synchronization features, then gradually add complex game mechanics.
