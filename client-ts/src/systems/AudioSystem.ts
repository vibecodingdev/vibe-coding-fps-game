import * as THREE from "three";
import { AudioSystem as IAudioSystem } from "@/types/audio";

export class AudioSystem implements IAudioSystem {
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

  public async initialize(): Promise<void> {
    try {
      this.listener = new THREE.AudioListener();
      this.context = this.listener.context;
      await this.loadBasicSounds();
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

  private async loadBasicSounds(): Promise<void> {
    const sounds = [
      {
        key: "bg-music",
        url: "assets/quantum-mystic-riff-1-323475.mp3",
        volume: 0.3,
        loop: true,
      },
      {
        key: "weapon-shotgun",
        url: "assets/doom-shotgun-2017-80549.mp3",
        volume: 0.6,
        loop: false,
      },
      {
        key: "demon-growl",
        url: "assets/monster-growl-6311.mp3",
        volume: 0.5,
        loop: false,
      },
    ];

    for (const sound of sounds) {
      try {
        await this.loadSound(sound.key, sound.url, sound.volume, sound.loop);
      } catch (error) {
        console.warn(`Failed to load ${sound.key}:`, error);
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

    const track = this.backgroundTracks[0];
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

    const soundKey =
      weaponType === "shotgun" ? "weapon-shotgun" : "weapon-shotgun";
    this.playSound(soundKey);
  }

  public playDemonDeathSound(): void {
    this.playDemonGrowlSound();
  }

  public playDemonHitSound(): void {
    this.playDemonGrowlSound();
  }

  public playDemonGrowlSound(): void {
    if (!this.isInitialized || this.isMuted) return;

    const now = Date.now();
    if (now - this.lastGrowlTime < this.growlCooldownTime) {
      return;
    }

    this.playSound("demon-growl");
    this.lastGrowlTime = now;
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
