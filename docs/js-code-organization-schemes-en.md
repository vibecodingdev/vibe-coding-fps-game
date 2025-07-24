# JavaScript Code Organization Schemes Design

## Current Project Analysis

Current project characteristics:

- **File Scale**: `script.js` approximately 7074 lines, single file containing all logic
- **Functional Complexity**: Includes game engine, AI systems, networking, audio, UI and other subsystems
- **Maintenance Difficulty**: Large single file leads to difficulties in code location, debugging, and testing
- **AI Development Friendliness**: Requires better modularization to support AI Agent precise location and code modification

## Scheme 1: Modular Layered Architecture (Recommended Primary Scheme)

### 1.1 Directory Structure

```
client/
├── src/
│   ├── core/                 # Core systems
│   │   ├── Engine.js         # Game engine core
│   │   ├── GameState.js      # Game state management
│   │   ├── EventBus.js       # Event bus
│   │   └── ResourceManager.js # Resource management
│   ├── systems/              # Game systems
│   │   ├── audio/            # Audio system
│   │   │   ├── AudioManager.js
│   │   │   ├── SoundEffects.js
│   │   │   └── VoiceChat.js
│   │   ├── rendering/        # Rendering system
│   │   │   ├── SceneManager.js
│   │   │   ├── LightingManager.js
│   │   │   └── EffectsManager.js
│   │   ├── physics/          # Physics system
│   │   │   ├── CollisionManager.js
│   │   │   └── MovementController.js
│   │   ├── ai/               # AI system
│   │   │   ├── DemonAI.js
│   │   │   ├── PathFinding.js
│   │   │   └── BehaviorTree.js
│   │   ├── weapons/          # Weapon system
│   │   │   ├── WeaponManager.js
│   │   │   ├── BulletSystem.js
│   │   │   └── WeaponTypes.js
│   │   ├── ui/               # UI system
│   │   │   ├── UIManager.js
│   │   │   ├── MenuSystem.js
│   │   │   ├── HUD.js
│   │   │   └── RadarSystem.js
│   │   └── network/          # Network system
│   │       ├── NetworkManager.js
│   │       ├── RoomManager.js
│   │       └── PlayerSync.js
│   ├── entities/             # Game entities
│   │   ├── Player.js
│   │   ├── Demon.js
│   │   ├── Bullet.js
│   │   ├── AmmoPack.js
│   │   └── HealthPack.js
│   ├── utils/                # Utility functions
│   │   ├── MathUtils.js
│   │   ├── GeometryUtils.js
│   │   ├── ColorUtils.js
│   │   └── PerformanceUtils.js
│   ├── config/               # Configuration files
│   │   ├── GameConfig.js     # Game configuration
│   │   ├── WeaponConfig.js   # Weapon configuration
│   │   ├── DemonConfig.js    # Demon configuration
│   │   └── UIConfig.js       # UI configuration
│   └── main.js              # Main entry file
├── assets/                   # Asset files
├── tests/                    # Test files (maintain existing structure)
├── index.html               # Main page
└── build.js                 # Build script (optional)
```

### 1.2 Core Architecture Principles

#### Event-Driven Architecture

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

#### System Manager Pattern

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

### 1.3 AI Agent Development Optimization

#### Module Metadata System

```javascript
// Each module contains AI-friendly metadata
/**
 * @module WeaponManager
 * @description Manages all weapon-related logic including firing, reloading, damage calculation
 * @dependencies [BulletSystem, AudioManager, UIManager]
 * @aiTags [weapons, shooting, combat, bullets]
 * @lastModified 2024-01-15
 */
class WeaponManager {
  /**
   * @aiMethod shootWeapon
   * @description Fire current weapon
   * @params {string} weaponType - Weapon type
   * @aiModifiable true
   */
  shootWeapon(weaponType) {
    // Implementation code
  }
}
```

#### Smart Annotation System

```javascript
// Standardized AI-readable comment format
/*
 * AI_CONTEXT: This function handles demon movement logic
 * AI_DEPENDENCIES: DemonConfig, PathFinding, CollisionManager
 * AI_MODIFIABLE: Can modify movement speed and AI behavior
 * AI_TESTABLE: Has corresponding unit tests in tests/ai/demon-movement.test.js
 */
function updateDemonMovement(demon, player) {
  // Implementation code
}
```

## Scheme 2: Domain-Driven Architecture

### 2.1 Organize by Functional Domains

```
client/src/
├── domains/
│   ├── gameplay/             # Gameplay domain
│   │   ├── wave-system/
│   │   ├── scoring/
│   │   └── player-progression/
│   ├── combat/               # Combat domain
│   │   ├── weapons/
│   │   ├── projectiles/
│   │   └── damage-system/
│   ├── entities/             # Entity domain
│   │   ├── demons/
│   │   ├── player/
│   │   └── environment/
│   ├── presentation/         # Presentation layer domain
│   │   ├── ui/
│   │   ├── effects/
│   │   └── audio/
│   └── infrastructure/       # Infrastructure domain
│       ├── networking/
│       ├── persistence/
│       └── configuration/
└── shared/                   # Shared utilities
    ├── utils/
    ├── constants/
    └── types/
```

### 2.2 Inter-Domain Communication Interface

```javascript
// domains/combat/CombatDomain.js
class CombatDomain {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.weaponSystem = new WeaponSystem();
    this.damageSystem = new DamageSystem();
  }

  // External interface
  playerShoot(weaponType, direction) {
    return this.weaponSystem.fire(weaponType, direction);
  }

  applyDamage(entity, damage) {
    return this.damageSystem.apply(entity, damage);
  }
}
```

## Scheme 3: Microservice-style Architecture

### 3.1 Service-based Organization

```
client/src/
├── services/
│   ├── GameService.js        # Core game service
│   ├── AudioService.js       # Audio service
│   ├── RenderService.js      # Render service
│   ├── NetworkService.js     # Network service
│   ├── AIService.js          # AI service
│   ├── UIService.js          # UI service
│   └── PhysicsService.js     # Physics service
├── registry/
│   └── ServiceRegistry.js    # Service registry
├── interfaces/
│   ├── IGameService.js       # Service interface definitions
│   ├── IAudioService.js
│   └── ...
└── main.js
```

### 3.2 Service Registration Mechanism

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

    // Automatic dependency injection
    this.injectDependencies(name, service);
  }

  get(name) {
    return this.services.get(name);
  }
}
```

## Scheme 4: Component-based Entity System (ECS)

### 4.1 ECS Architecture

```
client/src/
├── ecs/
│   ├── Entity.js             # Entity base class
│   ├── Component.js          # Component base class
│   ├── System.js             # System base class
│   └── World.js              # ECS world manager
├── components/               # Component definitions
│   ├── Position.js
│   ├── Velocity.js
│   ├── Health.js
│   ├── Weapon.js
│   ├── AI.js
│   └── Render.js
├── systems/                  # System implementations
│   ├── MovementSystem.js
│   ├── RenderSystem.js
│   ├── AISystem.js
│   ├── WeaponSystem.js
│   └── CollisionSystem.js
└── entities/                 # Entity factories
    ├── PlayerFactory.js
    ├── DemonFactory.js
    └── BulletFactory.js
```

### 4.2 ECS Implementation Example

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

## AI Agent Development Best Practices

### 1. Smart Code Annotation System

```javascript
// Provide semantic annotations for AI Agent
/**
 * @aiFunction
 * @purpose "Handle collision detection between player and demons"
 * @modificationRisk "low"
 * @testCoverage "100%"
 * @dependencies ["CollisionManager", "PlayerEntity", "DemonEntity"]
 * @aiSuggestions ["Can optimize spatial partitioning algorithm", "Consider adding collision prediction"]
 */
function checkPlayerDemonCollision() {
  // AI_SAFE_ZONE_START - Core logic, modify with caution
  const playerPos = player.getPosition();
  const demons = DemonManager.getNearbyDemons(playerPos, 5);
  // AI_SAFE_ZONE_END

  // AI_MODIFIABLE_ZONE_START - Safe area for modification
  demons.forEach((demon) => {
    const distance = calculateDistance(playerPos, demon.position);
    if (distance < COLLISION_THRESHOLD) {
      handleCollision(player, demon);
    }
  });
  // AI_MODIFIABLE_ZONE_END
}
```

### 2. Configuration-Driven Development

```javascript
// config/AIModifiableConfig.js
export const AI_MODIFIABLE_CONFIG = {
  // Configuration items that AI can safely modify
  DEMON_STATS: {
    IMP: { health: 1, speed: 1.0, damage: 10 },
    DEMON: { health: 2, speed: 1.8, damage: 15 },
    // AI_MODIFY_SAFE: Can adjust numerical values
  },

  WEAPON_BALANCE: {
    SHOTGUN: { damage: 7, fireRate: 800, spread: 0.3 },
    // AI_MODIFY_SAFE: Can adjust weapon balance
  },

  // Core configuration that AI should not modify
  CORE_SYSTEMS: {
    // AI_MODIFY_RESTRICTED
    MAX_DEMONS: 50,
    SCENE_BOUNDS: 100,
    FIXED_TIMESTEP: 16.67,
  },
};
```

### 3. Test-Driven Modularization

```javascript
// Each module has corresponding test files
// systems/weapons/WeaponManager.test.js
import { WeaponManager } from "./WeaponManager.js";

describe("WeaponManager", () => {
  test("AI_TEST: Weapon firing should consume ammunition", () => {
    const weaponManager = new WeaponManager();
    weaponManager.equipWeapon("shotgun");

    const initialAmmo = weaponManager.getCurrentAmmo();
    weaponManager.fire();
    const afterAmmo = weaponManager.getCurrentAmmo();

    expect(afterAmmo).toBe(initialAmmo - 1);
  });
});
```

## Migration Strategy

### Phase 1: Configuration Extraction (Week 1)

1. Extract all configurations to separate files
2. Create `config/` directory structure
3. Update reference relationships

### Phase 2: Utility Function Separation (Week 2)

1. Extract common utility functions to `utils/`
2. Create math, geometry, performance-related utility classes
3. Establish unit tests

### Phase 3: System Modularization (Weeks 3-4)

1. Separate systems by priority
2. Priority: Audio → UI → Weapons → AI → Network
3. Establish inter-system communication interfaces

### Phase 4: Entity Componentization (Weeks 5-6)

1. Refactor game entities into component structure
2. Implement ECS or simplified component system
3. Optimize performance and memory usage

### Phase 5: Testing and Optimization (Week 7)

1. Supplement automated testing
2. Performance optimization and debugging
3. AI Agent development tool improvement

## Recommended Build Tools

### Simple Build Script

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
    // Read all modules
    await this.loadModules();

    // Parse dependency relationships
    const sorted = this.topologicalSort();

    // Generate bundle file
    this.generateBundle(sorted);
  }

  // AI-friendly build process, supports incremental building
  incrementalBuild(changedFiles) {
    // Only rebuild changed modules and their dependencies
  }
}
```

## Development Tool Integration

### VS Code Configuration

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

### ESLint Rules (AI-friendly)

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

## Summary and Recommendations

**Recommended Scheme**: **Modular Layered Architecture (Scheme 1)**

**Reasons**:

1. **Progressive Migration**: Can gradually migrate from existing code
2. **AI-Friendly**: Clear module boundaries facilitate AI understanding and modification
3. **Maintainability**: Separation of concerns, easy to locate and fix issues
4. **Testability**: Each module can be tested independently
5. **Performance Optimization**: Supports lazy loading and code splitting

**Secondary Recommendation**: **Domain-Driven Architecture (Scheme 2)** - Suitable for larger scale team development

Through these schemes, we can refactor the 7000-line single file into a well-structured, easily maintainable, AI Agent-friendly modular architecture.
