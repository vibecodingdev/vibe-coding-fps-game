import * as THREE from "three";
import { AudioSystem as IAudioSystem } from "@/types/audio";
import { AUDIO_CONFIGS } from "@/config/audio";

export class AudioSystem implements IAudioSystem {
  private static instance: AudioSystem | null = null;

  public context: AudioContext | null = null;
  public listener: THREE.AudioListener | null = null;
  public masterVolume = 1.0;
  public volumes = {
    background: 0.3,
    weapon: 0.6,
    demon: 0.5,
    environment: 0.7,
    ui: 0.5,
  };
  public sources: Map<string, THREE.Audio> = new Map();
  public isInitialized = false;
  public isMuted = false;

  private audioLoader = new THREE.AudioLoader();
  private currentBackgroundTrack: THREE.Audio | null = null;
  private backgroundTracks: THREE.Audio[] = [];
  private lastGrowlTime = 0;
  private readonly growlCooldownTime = 1500;

  private constructor() {
    // Private constructor to prevent direct instantiation
  }

  public static getInstance(): AudioSystem {
    if (!AudioSystem.instance) {
      AudioSystem.instance = new AudioSystem();
    }
    return AudioSystem.instance;
  }

  public async initialize(): Promise<void> {
    try {
      this.listener = new THREE.AudioListener();
      this.context = this.listener.context;
      await this.loadAllSounds();
      this.isInitialized = true;
      console.log("🎵 AudioSystem initialized");
    } catch (error) {
      console.error("❌ Failed to initialize AudioSystem:", error);
    }
  }

  public setCamera(camera: THREE.Camera): void {
    if (this.listener) {
      camera.add(this.listener);
    }
  }

  private async loadAllSounds(): Promise<void> {
    // Load essential sounds first
    const essentialSounds = [
      "bg-mystic-1",
      "weapon-shotgun",
      "weapon-machinegun",
      "weapon-single-shot",
      "demon-growl-2",
      "demon-roar-1",
    ];

    // Load essential sounds
    for (const soundKey of essentialSounds) {
      const config = AUDIO_CONFIGS[soundKey];
      if (config) {
        try {
          await this.loadSound(
            soundKey,
            config.url,
            config.volume,
            config.loop
          );
        } catch (error) {
          console.warn(`Failed to load essential sound ${soundKey}:`, error);
        }
      }
    }

    // Load remaining sounds in background
    this.loadRemainingsSounds();
  }

  private async loadRemainingsSounds(): Promise<void> {
    const essentialSounds = new Set([
      "bg-mystic-1",
      "weapon-shotgun",
      "weapon-machinegun",
      "weapon-single-shot",
      "demon-growl-2",
      "demon-roar-1",
    ]);

    for (const [soundKey, config] of Object.entries(AUDIO_CONFIGS)) {
      if (!essentialSounds.has(soundKey) && !this.sources.has(soundKey)) {
        try {
          await this.loadSound(
            soundKey,
            config.url,
            config.volume,
            config.loop
          );
        } catch (error) {
          console.warn(`Failed to load ${soundKey}:`, error);
        }
      }
    }
  }

  private loadSound(
    key: string,
    url: string,
    volume: number,
    loop: boolean
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.audioLoader.load(
        url,
        (buffer) => {
          const audio = new THREE.Audio(this.listener!);
          audio.setBuffer(buffer);
          audio.setVolume(volume);
          audio.setLoop(loop);

          this.sources.set(key, audio);

          if (key.startsWith("bg-")) {
            this.backgroundTracks.push(audio);
          }

          console.log(`🎵 Loaded: ${key}`);
          resolve();
        },
        undefined,
        (error) => {
          console.error(`❌ Failed to load ${key}:`, error);
          reject(error);
        }
      );
    });
  }

  public update(_deltaTime: number): void {
    // Basic update logic
  }

  public startBackgroundMusic(): void {
    if (
      !this.isInitialized ||
      this.isMuted ||
      this.backgroundTracks.length === 0
    ) {
      return;
    }

    // Use the first available background track (bg-mystic-1)
    const track = this.sources.get("bg-mystic-1") || this.backgroundTracks[0];
    if (track) {
      this.currentBackgroundTrack = track;
      try {
        this.currentBackgroundTrack.play();
        console.log("🎵 Background music started");
      } catch (error) {
        console.error("❌ Failed to start background music:", error);
      }
    }
  }

  public playBackgroundMusic(): void {
    this.startBackgroundMusic();
  }

  public pauseBackgroundMusic(): void {
    if (this.currentBackgroundTrack?.isPlaying) {
      this.currentBackgroundTrack.pause();
      console.log("🎵 Background music paused");
    }
  }

  public resumeBackgroundMusic(): void {
    if (this.currentBackgroundTrack && !this.currentBackgroundTrack.isPlaying) {
      try {
        this.currentBackgroundTrack.play();
        console.log("🎵 Background music resumed");
      } catch (error) {
        console.error("❌ Failed to resume background music:", error);
      }
    }
  }

  public stopBackgroundMusic(): void {
    if (this.currentBackgroundTrack?.isPlaying) {
      this.currentBackgroundTrack.stop();
      console.log("🎵 Background music stopped");
    }
    this.currentBackgroundTrack = null;
  }

  public playWeaponSound(weaponType: string): void {
    if (!this.isInitialized || this.isMuted) return;

    // Map weapon types to sound keys
    const weaponSoundMap: Record<string, string> = {
      shotgun: "weapon-shotgun",
      machinegun: "weapon-machinegun",
      rifle: "weapon-single-shot",
      pistol: "weapon-single-shot",
    };

    const soundKey = weaponSoundMap[weaponType] || "weapon-shotgun";
    this.playSound(soundKey);
  }

  public playDemonDeathSound(): void {
    if (!this.isInitialized || this.isMuted) return;

    // Play more dramatic death sounds
    const deathSounds = ["demon-roar-1", "demon-roar-2", "demon-shriek"];
    const randomDeath =
      deathSounds[Math.floor(Math.random() * deathSounds.length)] ||
      "demon-roar-1";
    this.playSound(randomDeath);
  }

  public playDemonHitSound(): void {
    if (!this.isInitialized || this.isMuted) return;

    // Play hit/damage sounds
    const hitSounds = ["demon-bite", "demon-growl-1", "demon-growl-2"];
    const randomHit =
      hitSounds[Math.floor(Math.random() * hitSounds.length)] || "demon-bite";
    this.playSound(randomHit);
  }

  public playDemonGrowlSound(): void {
    if (!this.isInitialized || this.isMuted) return;

    const now = Date.now();
    if (now - this.lastGrowlTime < this.growlCooldownTime) {
      return;
    }

    // Randomly choose between available demon growl sounds
    const growlSounds = ["demon-growl-1", "demon-growl-2"];
    const randomGrowl =
      growlSounds[Math.floor(Math.random() * growlSounds.length)] ||
      "demon-growl-2";
    this.playSound(randomGrowl);
    this.lastGrowlTime = now;
  }

  public playDemonAttackSound(demonType: string): void {
    if (!this.isInitialized || this.isMuted) return;

    // Different attack sounds based on demon type
    let attackSound: string;
    switch (demonType) {
      case "BARON":
        attackSound = "demon-warrior";
        break;
      case "CACODEMON":
        attackSound = "demon-roar-1";
        break;
      case "DEMON":
        attackSound = "demon-bite";
        break;
      case "IMP":
      default:
        attackSound = "demon-growl-1";
        break;
    }
    this.playSound(attackSound);
  }

  public playDemonChaseSound(demonType: string): void {
    if (!this.isInitialized || this.isMuted) return;

    // Different chase sounds based on demon type
    let chaseSound: string;
    switch (demonType) {
      case "BARON":
        chaseSound = "demon-roar-2";
        break;
      case "CACODEMON":
        chaseSound = "demon-breath";
        break;
      case "DEMON":
        chaseSound = "demon-growl-2";
        break;
      case "IMP":
      default:
        chaseSound = "demon-generic-1";
        break;
    }
    this.playSound(chaseSound);
  }

  public playDemonSpawnSound(demonType: string): void {
    if (!this.isInitialized || this.isMuted) return;

    // Different spawn sounds based on demon type
    let spawnSound: string;
    switch (demonType) {
      case "BARON":
        spawnSound = "demon-warrior";
        break;
      case "CACODEMON":
        spawnSound = "demon-roar-1";
        break;
      case "DEMON":
        spawnSound = "demon-generic-2";
        break;
      case "IMP":
      default:
        spawnSound = "demon-growl-1";
        break;
    }
    this.playSound(spawnSound);
  }

  public playExplosionSound(): void {
    if (!this.isInitialized || this.isMuted) return;
    this.playSound("explosion");
  }

  public playHealthPackSound(): void {
    if (!this.isInitialized || this.isMuted || !this.context) return;

    // Create a pleasant chime sound for health pack collection - matches original
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    // Configure healing sound - matches original frequencies
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(523, this.context.currentTime); // C5
    oscillator.frequency.exponentialRampToValueAtTime(
      784,
      this.context.currentTime + 0.3
    ); // G5

    // Envelope for chime - matches original timing
    gainNode.gain.setValueAtTime(0, this.context.currentTime);
    gainNode.gain.linearRampToValueAtTime(
      this.volumes.environment * 0.5,
      this.context.currentTime + 0.1
    );
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      this.context.currentTime + 0.6
    );

    // Connect and play
    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);

    oscillator.start();
    oscillator.stop(this.context.currentTime + 0.6);

    console.log("🔊 Playing health pack collection sound");
  }

  public playAmmoPackSound(): void {
    if (!this.isInitialized || this.isMuted || !this.context) return;

    // Create a distinctive electric/power sound for ammo pack collection - matches original
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    // Configure electric power sound - matches original frequencies
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(220, this.context.currentTime); // A3
    oscillator.frequency.exponentialRampToValueAtTime(
      440,
      this.context.currentTime + 0.2
    ); // A4
    oscillator.frequency.exponentialRampToValueAtTime(
      330,
      this.context.currentTime + 0.4
    ); // E4

    // Envelope for electric sound - matches original timing
    gainNode.gain.setValueAtTime(0, this.context.currentTime);
    gainNode.gain.linearRampToValueAtTime(
      this.volumes.environment * 0.6,
      this.context.currentTime + 0.05
    );
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      this.context.currentTime + 0.5
    );

    // Connect and play
    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);

    oscillator.start();
    oscillator.stop(this.context.currentTime + 0.5);

    console.log("🔊 Playing ammo pack collection sound");
  }

  public playEnvironmentSound(soundType: string): void {
    if (!this.isInitialized || this.isMuted) return;

    const envSoundMap: Record<string, string> = {
      doom: "doom-effect",
      horn: "horn-doom",
      explosion: "explosion",
    };

    const soundKey = envSoundMap[soundType];
    if (soundKey) {
      this.playSound(soundKey);
    }
  }

  private playSound(key: string): void {
    const audio = this.sources.get(key);
    if (audio) {
      if (audio.isPlaying) {
        audio.stop();
      }

      try {
        audio.play();
        console.log(`🔊 Playing: ${key}`);
      } catch (error) {
        console.error(`❌ Failed to play ${key}:`, error);
      }
    } else {
      console.warn(`⚠️ Audio not found: ${key}`);
    }
  }

  public setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    console.log(`🔊 Master volume set to ${this.masterVolume}`);
  }

  public toggleMute(): void {
    this.isMuted = !this.isMuted;

    if (this.isMuted) {
      this.pauseBackgroundMusic();
      console.log("🔇 Audio muted");
    } else {
      this.resumeBackgroundMusic();
      console.log("🔊 Audio unmuted");
    }
  }

  public reset(): void {
    this.stopBackgroundMusic();

    this.sources.forEach((audio) => {
      if (audio.isPlaying) {
        audio.stop();
      }
    });

    this.currentBackgroundTrack = null;
    this.lastGrowlTime = 0;

    console.log("🎵 AudioSystem reset");
  }
}
