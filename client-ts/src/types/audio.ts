import * as THREE from "three";

export type AudioType =
  | "background"
  | "weapon"
  | "demon"
  | "environment"
  | "ui";

export interface AudioConfig {
  url: string;
  volume: number;
  loop: boolean;
  preload: boolean;
}

// Alias for consistency with config
export type AudioClip = AudioConfig;

export interface AudioSource {
  buffer: AudioBuffer | null;
  source: AudioBufferSourceNode | null;
  gainNode: GainNode | null;
  isPlaying: boolean;
  isPaused: boolean;
  startTime: number;
  pauseTime: number;
}

export interface AudioSystem {
  context: AudioContext | null;
  listener: THREE.AudioListener | null;
  masterVolume: number;
  volumes: Record<AudioType, number>;
  sources: Map<string, THREE.Audio>;
  isInitialized: boolean;
  isMuted: boolean;
}

export type VoiceChatMode =
  | "speech-to-text"
  | "voice-transmission"
  | "disabled";

export interface VoiceChatSettings {
  mode: VoiceChatMode;
  pushToTalkKey: string;
  voiceVolume: number;
}

export interface VoiceChatState {
  mediaRecorder: MediaRecorder | null;
  audioStream: MediaStream | null;
  isRecording: boolean;
  isPushToTalkPressed: boolean;
  recognition: any | null; // SpeechRecognition
  audioContext: AudioContext | null;
  audioChunks: Blob[];
  remoteAudios: Map<string, HTMLAudioElement>;
  lastKeyPress: number;
  settings: VoiceChatSettings;
}
