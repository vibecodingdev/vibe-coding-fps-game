import { WeaponType, WeaponConfig } from "@/types/weapons";

export const WEAPON_CONFIGS: Record<WeaponType, WeaponConfig> = {
  shotgun: {
    name: "Shotgun",
    fireRate: 800, // ms between shots
    damage: 7, // Per pellet
    pellets: 8, // Shotgun pellets
    recoil: 0.6,
    emoji: "🔫",
    maxAmmo: 50,
    spread: 0.3, // Shotgun spread
  },
  chaingun: {
    name: "Chaingun",
    fireRate: 100, // Very fast
    damage: 1,
    recoil: 0.2,
    emoji: "⚡",
    maxAmmo: 200,
    spread: 0.1,
  },
  rocket: {
    name: "Rocket Launcher",
    fireRate: 1200, // Slow but powerful
    damage: 50,
    recoil: 1.0,
    emoji: "🚀",
    maxAmmo: 20,
    splash: 10, // Splash damage radius
    spread: 0.02,
  },
  plasma: {
    name: "Plasma Rifle",
    fireRate: 200,
    damage: 4,
    recoil: 0.3,
    emoji: "🔥",
    maxAmmo: 100,
    spread: 0.05,
  },
};

export const BULLET_SPEED = 50;
export const BULLET_LIFETIME = 3000;

export const DEFAULT_WEAPON: WeaponType = "shotgun";
