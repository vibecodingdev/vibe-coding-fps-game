import * as THREE from "three";

export type WeaponType = "shotgun" | "chaingun" | "rocket" | "plasma";

export interface WeaponConfig {
  readonly name: string;
  readonly fireRate: number; // ms between shots
  readonly damage: number;
  readonly recoil: number;
  readonly emoji: string;
  readonly maxAmmo: number;
  readonly spread: number;
  readonly pellets?: number; // for shotgun
  readonly splash?: number; // for rocket launcher
}

export interface WeaponState {
  currentAmmo: number;
  lastShotTime: number;
  isReloading: boolean;
}

export interface Bullet {
  readonly id: string;
  readonly mesh: THREE.Mesh;
  readonly velocity: THREE.Vector3;
  readonly damage: number;
  readonly createdAt: number;
  readonly weaponType: WeaponType;
}

export interface WeaponSystem {
  currentWeapon: WeaponType;
  weapons: Record<WeaponType, WeaponConfig>;
  weaponStates: Record<WeaponType, WeaponState>;
  isAutoFiring: boolean;
  mouseHeld: boolean;
}
