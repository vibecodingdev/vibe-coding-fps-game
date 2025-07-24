# JavaScript Refactoring Implementation Guide

## Quick Start: Progressive Refactoring

### Step 1: Create Basic Directory Structure

```bash
mkdir -p client/src/{core,systems/{audio,ui,weapons,ai,network},entities,utils,config}
```

### Step 2: Configuration Extraction Example

#### Create `client/src/config/GameConfig.js`

```javascript
/**
 * @module GameConfig
 * @description Core game configuration
 * @aiModifiable true
 * @aiTags [config, game-balance, settings]
 */

// Basic game configuration
export const GAME_CONFIG = {
  // Scene configuration
  SCENE: {
    BOUNDARY: 45,
    GROUND_SIZE: 100,
    SKY_COLOR: 0x87ceeb,
    FOG_DENSITY: 0.002,
  },

  // Performance configuration
  PERFORMANCE: {
    MAX_DEMONS: 50,
    MAX_BULLETS: 100,
    TARGET_FPS: 60,
    UPDATE_FREQUENCY: 16.67, // ms
  },

  // Player configuration
  PLAYER: {
    HEIGHT: 1.8,
    MOVE_SPEED: 400,
    MAX_HEALTH: 100,
    INVULNERABILITY_TIME: 1000, // ms
  },
};

// Wave system configuration
export const WAVE_CONFIG = {
  INITIAL_DEMONS: 5,
  DEMONS_PER_WAVE_INCREASE: 2,
  MAX_DEMONS_PER_WAVE: 20,
  TIME_BETWEEN_WAVES: 5000, // ms
  SPAWN_INTERVAL: 1000, // ms between demon spawns
};
```

#### Create `client/src/config/WeaponConfig.js`

```javascript
/**
 * @module WeaponConfig
 * @description Weapon configuration and balance parameters
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

// Bullet configuration
export const BULLET_CONFIG = {
  SPEED: 50,
  LIFETIME: 3000, // ms
  SIZE: 0.02,
  COLOR: 0xffff00,
  EMISSIVE_COLOR: 0xffaa00,
  EMISSIVE_INTENSITY: 0.5,
};
```

#### Create `client/src/config/DemonConfig.js`

```javascript
/**
 * @module DemonConfig
 * @description Demon types and AI configuration
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

// AI behavior configuration
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

### Step 3: Core System Extraction

#### Create `client/src/core/EventBus.js`

```javascript
/**
 * @module EventBus
 * @description Game event bus, handles inter-system communication
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
   * Subscribe to event
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   * @param {object} context - Callback context
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
   * Subscribe to one-time event
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
   * Emit event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data = null) {
    if (this.debugMode) {
      console.log(`📡 Event emitted: ${event}`, data);
    }

    // Handle regular events
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

    // Handle one-time events
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
      // Clear one-time events
      this.onceEvents.delete(event);
    }
  }

  /**
   * Unsubscribe
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
   * Clear all event listeners
   */
  clear() {
    this.events.clear();
    this.onceEvents.clear();
  }

  /**
   * Enable/disable debug mode
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }
}

export default EventBus;
```

#### Create `client/src/core/GameState.js`

```javascript
/**
 * @module GameState
 * @description Game state management
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

    // Define valid states
    this.validStates = [
      "mainMenu",
      "multiplayerLobby",
      "partyRoom",
      "instructions",
      "playing",
      "paused",
      "gameOver",
    ];

    // Initialize state data
    this.initializeStateData();
  }

  /**
   * Initialize data for each state
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
   * Change game state
   * @param {string} newState - New state
   * @param {object} data - Data passed during state transition
   */
  setState(newState, data = {}) {
    if (!this.validStates.includes(newState)) {
      console.error(`❌ Invalid state: ${newState}`);
      return false;
    }

    const oldState = this.currentState;

    // Trigger state exit event
    this.eventBus.emit("state:exit", {
      state: oldState,
      newState: newState,
    });

    // Update state
    this.previousState = oldState;
    this.currentState = newState;

    // Update state data
    if (data && Object.keys(data).length > 0) {
      const existingData = this.stateData.get(newState) || {};
      this.stateData.set(newState, { ...existingData, ...data });
    }

    // Trigger state enter event
    this.eventBus.emit("state:enter", {
      state: newState,
      previousState: oldState,
      data: this.stateData.get(newState),
    });

    // Trigger state change event
    this.eventBus.emit("state:change", {
      from: oldState,
      to: newState,
      data: this.stateData.get(newState),
    });

    console.log(`🎮 State changed: ${oldState} → ${newState}`);
    return true;
  }

  /**
   * Get current state
   */
  getCurrentState() {
    return this.currentState;
  }

  /**
   * Get previous state
   */
  getPreviousState() {
    return this.previousState;
  }

  /**
   * Check if in certain state
   */
  isState(state) {
    return this.currentState === state;
  }

  /**
   * Get state data
   */
  getStateData(state = null) {
    const targetState = state || this.currentState;
    return this.stateData.get(targetState) || {};
  }

  /**
   * Update state data
   */
  updateStateData(key, value, state = null) {
    const targetState = state || this.currentState;
    const currentData = this.stateData.get(targetState) || {};
    currentData[key] = value;
    this.stateData.set(targetState, currentData);

    // Trigger data update event
    this.eventBus.emit("state:dataUpdate", {
      state: targetState,
      key,
      value,
      allData: currentData,
    });
  }

  /**
   * Reset state data
   */
  resetStateData(state = null) {
    const targetState = state || this.currentState;
    this.stateData.delete(targetState);
    this.initializeStateData();
  }
}

export default GameState;
```

### Step 4: Utility Function Modularization

#### Create `client/src/utils/MathUtils.js`

```javascript
/**
 * @module MathUtils
 * @description Mathematical utility functions
 * @aiModifiable true
 * @aiTags [math, utils, calculations]
 */

export class MathUtils {
  /**
   * Calculate distance between two points
   * @param {Object} pos1 - First point {x, y, z}
   * @param {Object} pos2 - Second point {x, y, z}
   * @returns {number} Distance
   */
  static distance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Calculate distance between two points (ignoring Y axis)
   */
  static distance2D(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  /**
   * Clamp value to range
   * @param {number} value - Value to clamp
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Clamped value
   */
  static clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * Linear interpolation
   * @param {number} a - Start value
   * @param {number} b - End value
   * @param {number} t - Interpolation parameter (0-1)
   * @returns {number} Interpolated result
   */
  static lerp(a, b, t) {
    return a + (b - a) * this.clamp(t, 0, 1);
  }

  /**
   * Generate random number within range
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Random number
   */
  static random(min, max) {
    return Math.random() * (max - min) + min;
  }

  /**
   * Generate random integer
   */
  static randomInt(min, max) {
    return Math.floor(this.random(min, max + 1));
  }

  /**
   * Degrees to radians
   */
  static degToRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Radians to degrees
   */
  static radToDeg(radians) {
    return radians * (180 / Math.PI);
  }

  /**
   * Normalize vector
   * @param {Object} vector - Vector {x, y, z}
   * @returns {Object} Normalized vector
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
   * Vector dot product
   */
  static dot(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  }

  /**
   * Vector cross product
   */
  static cross(v1, v2) {
    return {
      x: v1.y * v2.z - v1.z * v2.y,
      y: v1.z * v2.x - v1.x * v2.z,
      z: v1.x * v2.y - v1.y * v2.x,
    };
  }

  /**
   * Check if point is within bounds
   * @param {Object} point - Point {x, z}
   * @param {number} boundary - Boundary size
   * @returns {boolean} Whether within bounds
   */
  static isWithinBounds(point, boundary) {
    return Math.abs(point.x) <= boundary && Math.abs(point.z) <= boundary;
  }

  /**
   * Constrain point to bounds
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

### Step 5: System Modularization Example

#### Create `client/src/systems/weapons/WeaponManager.js`

```javascript
/**
 * @module WeaponManager
 * @description Weapon system manager
 * @aiModifiable true
 * @aiTags [weapons, combat, shooting, manager]
 */

import { WEAPONS_CONFIG, BULLET_CONFIG } from "../../config/WeaponConfig.js";
import EventBus from "../../core/EventBus.js";

class WeaponManager {
  constructor(scene, eventBus) {
    this.scene = scene;
    this.eventBus = eventBus || new EventBus();

    // Current weapon state
    this.currentWeapon = "shotgun";
    this.weapons = this.initializeWeapons();
    this.lastShotTime = 0;
    this.isAutoFiring = false;
    this.mouseHeld = false;

    // Recoil system
    this.recoilOffset = 0;
    this.recoilVelocity = 0;
    this.basePosition = { x: 0, y: -3, z: -5 };

    // Subscribe to events
    this.setupEventListeners();

    console.log("🔫 WeaponManager initialized");
  }

  /**
   * Initialize weapon data
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
   * Set up event listeners
   */
  setupEventListeners() {
    this.eventBus.on("player:mouseDown", this.handleMouseDown.bind(this));
    this.eventBus.on("player:mouseUp", this.handleMouseUp.bind(this));
    this.eventBus.on("player:switchWeapon", this.switchWeapon.bind(this));
    this.eventBus.on("player:reload", this.reload.bind(this));
    this.eventBus.on("ammo:pickup", this.addAmmo.bind(this));
  }

  /**
   * Handle mouse down
   */
  handleMouseDown(event) {
    if (event.button === 0) {
      // Left click
      this.mouseHeld = true;
      this.shoot();
    } else if (event.button === 2) {
      // Right click
      this.switchWeapon();
    }
  }

  /**
   * Handle mouse up
   */
  handleMouseUp(event) {
    if (event.button === 0) {
      this.mouseHeld = false;
      this.isAutoFiring = false;
    }
  }

  /**
   * Fire weapon
   * @returns {boolean} Whether firing was successful
   */
  shoot() {
    const weapon = this.weapons[this.currentWeapon];
    const currentTime = Date.now();

    // Check fire rate limit
    if (currentTime - this.lastShotTime < weapon.fireRate) {
      return false;
    }

    // Check ammunition
    if (weapon.currentAmmo <= 0) {
      this.eventBus.emit("weapon:outOfAmmo", { weapon: this.currentWeapon });
      return false;
    }

    // Consume ammunition
    weapon.currentAmmo--;
    this.lastShotTime = currentTime;

    // Fire bullets
    this.createBullets(weapon);

    // Apply recoil
    this.applyRecoil(weapon.recoil);

    // Trigger events
    this.eventBus.emit("weapon:fire", {
      weapon: this.currentWeapon,
      ammoRemaining: weapon.currentAmmo,
      damage: weapon.damage,
    });

    // Start auto-fire (if full-auto weapon)
    if (weapon.name === "Chaingun" && this.mouseHeld) {
      this.isAutoFiring = true;
    }

    return true;
  }

  /**
   * Create bullets
   * @param {Object} weapon - Weapon configuration
   */
  createBullets(weapon) {
    const pellets = weapon.pellets || 1;

    for (let i = 0; i < pellets; i++) {
      this.createSingleBullet(weapon);
    }
  }

  /**
   * Create single bullet
   * @param {Object} weapon - Weapon configuration
   */
  createSingleBullet(weapon) {
    // Get camera position and direction
    const camera = this.scene.getObjectByName("player-camera");
    if (!camera) return;

    const cameraPosition = camera.position.clone();
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);

    // Apply weapon spread
    if (weapon.spread && weapon.spread > 0) {
      cameraDirection.x += (Math.random() - 0.5) * weapon.spread;
      cameraDirection.y += (Math.random() - 0.5) * weapon.spread;
      cameraDirection.z += (Math.random() - 0.5) * weapon.spread;
      cameraDirection.normalize();
    }

    // Create bullet geometry
    const bulletGeometry = new THREE.SphereGeometry(BULLET_CONFIG.SIZE, 8, 8);
    const bulletMaterial = new THREE.MeshBasicMaterial({
      color: BULLET_CONFIG.COLOR,
      emissive: BULLET_CONFIG.EMISSIVE_COLOR,
      emissiveIntensity: BULLET_CONFIG.EMISSIVE_INTENSITY,
    });

    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);

    // Set bullet position
    bullet.position.copy(cameraPosition);
    bullet.position.add(cameraDirection.clone().multiplyScalar(2));

    // Set bullet data
    bullet.userData = {
      velocity: cameraDirection.clone().multiplyScalar(BULLET_CONFIG.SPEED),
      damage: weapon.damage,
      weapon: this.currentWeapon,
      creationTime: Date.now(),
      lifetime: BULLET_CONFIG.LIFETIME,
    };

    this.scene.add(bullet);

    // Trigger bullet creation event
    this.eventBus.emit("bullet:created", {
      bullet,
      weapon: this.currentWeapon,
      damage: weapon.damage,
    });
  }

  /**
   * Apply weapon recoil
   * @param {number} recoilAmount - Recoil intensity
   */
  applyRecoil(recoilAmount) {
    this.recoilVelocity += recoilAmount;
    this.eventBus.emit("weapon:recoil", { amount: recoilAmount });
  }

  /**
   * Update weapon position (handle recoil animation)
   * @param {number} deltaTime - Time delta
   */
  update(deltaTime) {
    // Update recoil animation
    this.updateRecoil(deltaTime);

    // Handle auto-fire
    if (this.isAutoFiring && this.mouseHeld) {
      this.shoot();
    }
  }

  /**
   * Update recoil animation
   * @param {number} deltaTime - Time delta
   */
  updateRecoil(deltaTime) {
    // Recoil recovery
    this.recoilVelocity *= 0.9; // Damping
    this.recoilOffset += this.recoilVelocity * deltaTime * 60;

    // Return to original position
    this.recoilOffset = THREE.MathUtils.lerp(
      this.recoilOffset,
      0,
      deltaTime * 10
    );

    // Update weapon position
    this.eventBus.emit("weapon:positionUpdate", {
      offset: this.recoilOffset,
      basePosition: this.basePosition,
    });
  }

  /**
   * Switch weapon
   */
  switchWeapon() {
    const weaponKeys = Object.keys(this.weapons);
    const currentIndex = weaponKeys.indexOf(this.currentWeapon);
    const nextIndex = (currentIndex + 1) % weaponKeys.length;

    const oldWeapon = this.currentWeapon;
    this.currentWeapon = weaponKeys[nextIndex];

    // Reset auto-fire state
    this.isAutoFiring = false;

    this.eventBus.emit("weapon:switched", {
      from: oldWeapon,
      to: this.currentWeapon,
      weaponData: this.weapons[this.currentWeapon],
    });

    console.log(`🔄 Switched weapon: ${oldWeapon} → ${this.currentWeapon}`);
  }

  /**
   * Add ammunition
   * @param {Object} data - Ammo data {weaponType, amount}
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
   * Reload
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
   * Get current weapon info
   */
  getCurrentWeaponInfo() {
    return {
      name: this.currentWeapon,
      ...this.weapons[this.currentWeapon],
    };
  }

  /**
   * Get all weapons info
   */
  getAllWeaponsInfo() {
    return { ...this.weapons };
  }

  /**
   * Reset weapon system
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
   * Destroy weapon manager
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

### Main Entry File Refactoring

#### Create `client/src/main.js`

```javascript
/**
 * @module Main
 * @description Game main entry file
 * @aiModifiable true
 * @aiTags [main, initialization, bootstrap]
 */

// Import core modules
import EventBus from "./core/EventBus.js";
import GameState from "./core/GameState.js";

// Import configurations
import { GAME_CONFIG } from "./config/GameConfig.js";
import { WEAPONS_CONFIG } from "./config/WeaponConfig.js";
import { DEMON_TYPES_CONFIG } from "./config/DemonConfig.js";

// Import systems
import WeaponManager from "./systems/weapons/WeaponManager.js";

// Import utilities
import MathUtils from "./utils/MathUtils.js";

/**
 * Main game class
 */
class Game {
  constructor() {
    console.log("🎮 Initializing DOOM Protocol...");

    // Core systems
    this.eventBus = new EventBus();
    this.gameState = new GameState();

    // Three.js objects
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;

    // Game systems
    this.systems = new Map();

    // Game state
    this.isRunning = false;
    this.lastTime = 0;

    // Bind methods
    this.animate = this.animate.bind(this);

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Game state events
    this.gameState.eventBus.on(
      "state:change",
      this.handleStateChange.bind(this)
    );

    // Window events
    window.addEventListener("resize", this.handleResize.bind(this));
    window.addEventListener("beforeunload", this.cleanup.bind(this));
  }

  /**
   * Initialize game
   */
  async init() {
    try {
      console.log("🔧 Initializing game systems...");

      // Initialize Three.js
      await this.initThreeJS();

      // Initialize game systems
      await this.initSystems();

      // Set up scene
      await this.setupScene();

      // Set up controls
      await this.setupControls();

      // Start animation loop
      this.start();

      console.log("✅ Game initialized successfully");
    } catch (error) {
      console.error("❌ Game initialization failed:", error);
      throw error;
    }
  }

  /**
   * Initialize Three.js
   */
  async initThreeJS() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.name = "main-scene";

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.name = "player-camera";
    this.camera.position.set(0, GAME_CONFIG.PLAYER.HEIGHT, 20);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(GAME_CONFIG.SCENE.SKY_COLOR);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Add to DOM
    document.body.appendChild(this.renderer.domElement);

    console.log("✅ Three.js initialized");
  }

  /**
   * Initialize game systems
   */
  async initSystems() {
    // Weapon system
    const weaponManager = new WeaponManager(this.scene, this.eventBus);
    this.systems.set("weapons", weaponManager);

    // TODO: Add other systems
    // const audioManager = new AudioManager(this.eventBus);
    // this.systems.set('audio', audioManager);

    console.log("✅ Game systems initialized");
  }

  /**
   * Set up scene
   */
  async setupScene() {
    // Create ground
    this.createGround();

    // Add lighting
    this.addLighting();

    // TODO: Add other scene objects

    console.log("✅ Scene setup complete");
  }

  /**
   * Create ground
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
   * Add lighting
   */
  addLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    this.scene.add(ambientLight);

    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);
  }

  /**
   * Set up controls
   */
  async setupControls() {
    // TODO: Set up PointerLockControls
    console.log("✅ Controls setup complete");
  }

  /**
   * Start game loop
   */
  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animate();
    console.log("🚀 Game loop started");
  }

  /**
   * Stop game loop
   */
  stop() {
    this.isRunning = false;
    console.log("⏹️ Game loop stopped");
  }

  /**
   * Main game loop
   */
  animate() {
    if (!this.isRunning) return;

    requestAnimationFrame(this.animate);

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Update game systems
    this.update(deltaTime);

    // Render scene
    this.render();
  }

  /**
   * Update game logic
   */
  update(deltaTime) {
    // Only update when game is playing
    if (this.gameState.isState("playing")) {
      // Update all systems
      this.systems.forEach((system) => {
        if (system.update) {
          system.update(deltaTime);
        }
      });
    }
  }

  /**
   * Render scene
   */
  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Handle state change
   */
  handleStateChange(data) {
    console.log(`🎮 Game state changed: ${data.from} → ${data.to}`);

    // Execute corresponding logic based on state
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
   * Handle game start
   */
  handleGameStart() {
    console.log("🎮 Game started");
    // TODO: Initialize game entities
  }

  /**
   * Handle game pause
   */
  handleGamePause() {
    console.log("⏸️ Game paused");
  }

  /**
   * Handle game over
   */
  handleGameOver() {
    console.log("💀 Game over");
  }

  /**
   * Handle window resize
   */
  handleResize() {
    if (this.camera && this.renderer) {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.stop();

    // Clean up systems
    this.systems.forEach((system) => {
      if (system.destroy) {
        system.destroy();
      }
    });

    // Clean up Three.js resources
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

// Global game instance
let gameInstance = null;

/**
 * Initialize game
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
 * Get game instance
 */
export function getGameInstance() {
  return gameInstance;
}

// Auto-initialize after DOM loads
document.addEventListener("DOMContentLoaded", () => {
  console.log("📄 DOM loaded, initializing game...");
  initGame().catch((error) => {
    console.error("❌ Game initialization error:", error);
  });
});

// Export global functions for legacy code
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

// Make all configurations globally available (compatibility)
window.GAME_CONFIG = GAME_CONFIG;
window.WEAPONS_CONFIG = WEAPONS_CONFIG;
window.DEMON_TYPES_CONFIG = DEMON_TYPES_CONFIG;
window.MathUtils = MathUtils;
```

## Migration Checklist

### ✅ Phase 1: Configuration Extraction

- [ ] Create `config/` directory
- [ ] Extract game configuration to `GameConfig.js`
- [ ] Extract weapon configuration to `WeaponConfig.js`
- [ ] Extract demon configuration to `DemonConfig.js`
- [ ] Update configuration references in original file

### ✅ Phase 2: Core Systems

- [ ] Create `core/EventBus.js`
- [ ] Create `core/GameState.js`
- [ ] Create main entry `main.js`
- [ ] Test event system works properly

### ✅ Phase 3: Utility Modules

- [ ] Create `utils/MathUtils.js`
- [ ] Extract other utility functions
- [ ] Update reference relationships

### ✅ Phase 4: System Modularization

- [ ] Refactor weapon system `systems/weapons/WeaponManager.js`
- [ ] Refactor UI system
- [ ] Refactor audio system
- [ ] Refactor AI system
- [ ] Refactor network system

### ✅ Phase 5: Testing and Optimization

- [ ] Create unit tests
- [ ] Performance testing
- [ ] Compatibility testing
- [ ] Documentation improvement

This implementation guide provides specific code examples and steps to help you gradually refactor the existing large single file into a modular architecture.
