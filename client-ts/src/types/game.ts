import * as THREE from "three";

export type GameState =
  | "mainMenu"
  | "multiplayerLobby"
  | "partyRoom"
  | "instructions"
  | "playing"
  | "paused"
  | "gameOver";

export interface GameConfig {
  readonly DEMON_COUNT: number;
  readonly MAX_HEALTH: number;
  readonly BULLET_SPEED: number;
  readonly BULLET_LIFETIME: number;
  readonly RADAR_RANGE: number;
  readonly RADAR_SIZE: number;
  readonly DAMAGE_INVULNERABILITY_TIME: number;
}

export interface PlayerState {
  health: number;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  isAlive: boolean;
  lastDamageTime: number;
}

export interface GameStats {
  demonKills: number;
  currentWave: number;
  score: number;
  accuracy: number;
  startTime: number;
}

export interface InputState {
  moveForward: boolean;
  moveBackward: boolean;
  moveLeft: boolean;
  moveRight: boolean;
  isMouseLocked: boolean;
}

export interface CollectibleItem {
  readonly id: string;
  readonly type: "health" | "ammo";
  mesh: THREE.Group;
  position: THREE.Vector3;
  readonly value: number;
  creationTime: number;
  rotationSpeed: number;
  bobSpeed: number;
  bobOffset: number;
}

export interface CollectibleSystem {
  healthPacks: CollectibleItem[];
  ammoPacks: CollectibleItem[];
  lastHealthPackSpawn: number;
  lastAmmoPackSpawn: number;
  healthPacksCollected: number;
  ammoPacksCollected: number;
}
