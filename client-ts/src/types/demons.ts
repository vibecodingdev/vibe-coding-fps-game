import * as THREE from "three";

// Expanded demon types to include Pokemon-inspired creatures
export type DemonType =
  | "IMP"
  | "DEMON"
  | "CACODEMON"
  | "BARON"
  | "ARCHVILE"
  | "CHARIZARD"
  | "PIKACHU"
  | "SQUIRTLE"
  | "EEVEE";

// Body type categories for easier model creation - EXPANDED for maximum diversity
export type DemonBodyType =
  | "humanoid" // Two legs, two arms, upright posture
  | "quadruped" // Four legs, horizontal body
  | "floating" // No legs, floats in air
  | "dragon" // Wings, tail, four legs or bipedal
  | "small_biped" // Small, two legs, compact body
  | "serpentine" // Snake-like, long sinuous body
  | "arachnid" // Spider-like, 6-8 legs, segmented
  | "tentacled" // Octopus-like, flexible appendages
  | "insectoid" // Bug-like, segmented body, antennae
  | "amorphous" // Shapeless, blob-like, fluid form
  | "centauroid" // Horse/beast lower, humanoid upper
  | "multi_headed" // Multiple heads, shared body
  | "elemental" // Pure energy/fire/ice/earth form
  | "mechanical" // Robotic, cybernetic constructs
  | "plant_like" // Vine/tree-like organic growth
  | "crystalline" // Gem/crystal-based structure
  | "swarm" // Multiple small entities as one
  | "giant_humanoid" // Massive bipedal titans
  | "winged_humanoid" // Humanoid with prominent wings
  | "aquatic"; // Fish/sea creature adaptations

// Visual feature types for modular construction
export interface DemonVisualFeatures {
  readonly hasWings?: boolean;
  readonly hasTail?: boolean;
  readonly hasHorns?: boolean;
  readonly hasClaws?: boolean;
  readonly hasSpikes?: boolean;
  readonly hasArmor?: boolean;
  readonly specialFeatures?: string[]; // Array of special feature names
}

export interface DemonConfig {
  readonly name: string;
  readonly emoji: string;
  readonly health: number;
  readonly speed: number;
  readonly scale: number;
  readonly color: number;
  readonly headColor: number;
  readonly eyeColor: number;
  readonly detectRange: number;
  readonly attackRange: number;
  readonly chaseRange: number;
  readonly attackDamage: number;
  readonly spawnWeight: number;
  readonly isRanged?: boolean;
  readonly fireballSpeed?: number;
  readonly fireballRange?: number;
  readonly attackCooldown?: number; // Attack cooldown in frames (60fps)
  readonly bodyType: DemonBodyType; // New: defines overall body structure
  readonly visualFeatures?: DemonVisualFeatures; // New: modular visual features
  readonly secondaryColor?: number; // New: for accent colors, stripes, etc.
  readonly accentColor?: number; // New: for special details like belly, ears
}

// New interface for fireball projectiles
export interface Fireball {
  readonly id: string;
  readonly mesh: THREE.Group;
  readonly velocity: THREE.Vector3;
  readonly damage: number;
  readonly createdAt: number;
  readonly demonId: string;
  readonly targetPosition: THREE.Vector3;
}

export type DemonState =
  | "idle"
  | "patrolling"
  | "chasing"
  | "attacking"
  | "dead";

export interface DemonInstance {
  readonly id: string;
  readonly type: DemonType;
  readonly mesh: THREE.Group;
  state: DemonState;
  health: number;
  position: THREE.Vector3;
  targetPosition: THREE.Vector3;
  patrolCenter: THREE.Vector3;
  patrolRadius: number;
  lastAttackTime: number;
  lastStateChange: number;
  movementSpeed: number;
}

export interface WaveConfig {
  waveNumber: number;
  demonCount: number;
  demonTypes: Partial<Record<DemonType, number>>;
  spawnDelay: number;
  difficultyMultiplier: number;
}

export interface DemonSystem {
  demons: DemonInstance[];
  currentWave: number;
  demonsThisWave: number;
  demonsSpawnedThisWave: number;
  waveInProgress: boolean;
  demonTypeCounts: Record<DemonType, number>;
}
