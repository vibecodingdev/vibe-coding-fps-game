import { AudioConfig } from "@/types/audio";

export const AUDIO_CONFIGS: Record<string, AudioConfig> = {
  // Background Music
  "bg-mystic-1": {
    url: "assets/quantum-mystic-riff-1-323475.mp3",
    volume: 0.3,
    loop: true,
    preload: true,
  },
  "bg-mystic-2": {
    url: "assets/quantum-mystic-riff-2-323476.mp3",
    volume: 0.3,
    loop: true,
    preload: true,
  },
  "bg-mystic-intro": {
    url: "assets/quantum-mystic-unnerving-intro-323481.mp3",
    volume: 0.4,
    loop: true,
    preload: true,
  },
  "bg-suspense": {
    url: "assets/suspense-6002.mp3",
    volume: 0.25,
    loop: true,
    preload: true,
  },

  // Weapon Sounds
  "weapon-shotgun": {
    url: "assets/doom-shotgun-2017-80549.mp3",
    volume: 0.6,
    loop: false,
    preload: true,
  },
  "weapon-machinegun": {
    url: "assets/machine gun (rapid fire).mp3",
    volume: 0.5,
    loop: false,
    preload: true,
  },
  "weapon-single-shot": {
    url: "assets/single gun shot.mp3",
    volume: 0.7,
    loop: false,
    preload: true,
  },

  // Demon Sounds
  "demon-roar-1": {
    url: "assets/deep-sea-monster-roar-329857.mp3",
    volume: 0.6,
    loop: false,
    preload: true,
  },
  "demon-roar-2": {
    url: "assets/low-monster-roar-97413.mp3",
    volume: 0.6,
    loop: false,
    preload: true,
  },
  "demon-growl-1": {
    url: "assets/monster-growl-376892.mp3",
    volume: 0.5,
    loop: false,
    preload: true,
  },
  "demon-growl-2": {
    url: "assets/monster-growl-6311.mp3",
    volume: 0.5,
    loop: false,
    preload: true,
  },
  "demon-bite": {
    url: "assets/monster-bite-44538.mp3",
    volume: 0.7,
    loop: false,
    preload: true,
  },
  "demon-shriek": {
    url: "assets/monster-shriek-100292.mp3",
    volume: 0.6,
    loop: false,
    preload: true,
  },
  "demon-warrior": {
    url: "assets/monster-warrior-roar-195877.mp3",
    volume: 0.6,
    loop: false,
    preload: true,
  },
  "demon-breath": {
    url: "assets/horror-sound-monster-breath-189934.mp3",
    volume: 0.4,
    loop: false,
    preload: true,
  },
  "demon-generic-1": {
    url: "assets/monster-105850.mp3",
    volume: 0.5,
    loop: false,
    preload: true,
  },
  "demon-generic-2": {
    url: "assets/monster-40316.mp3",
    volume: 0.5,
    loop: false,
    preload: true,
  },
  zombie: {
    url: "assets/zombie.mp3",
    volume: 0.5,
    loop: false,
    preload: true,
  },

  // Environment Sounds
  explosion: {
    url: "assets/big-explosion-41783.mp3",
    volume: 0.8,
    loop: false,
    preload: true,
  },
  "doom-effect": {
    url: "assets/doomed-effect-37231.mp3",
    volume: 0.7,
    loop: false,
    preload: true,
  },
  "horn-doom": {
    url: "assets/horn-of-doom-101734.mp3",
    volume: 0.6,
    loop: false,
    preload: true,
  },
} as const;

export const DEFAULT_VOLUMES = {
  background: 0.3,
  weapon: 0.6,
  demon: 0.5,
  environment: 0.7,
  ui: 0.5,
} as const;
