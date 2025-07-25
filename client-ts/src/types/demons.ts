import * as THREE from "three";

export type DemonType = "IMP" | "DEMON" | "CACODEMON" | "BARON";

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
