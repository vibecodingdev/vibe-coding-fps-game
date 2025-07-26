import * as THREE from "three";

export interface NetworkState {
  socket: any;
  isConnected: boolean;
  currentRoom: RoomData | null;
  localPlayer: PlayerData | null;
  remotePlayers: Map<string, any>;
  isRoomLeader: boolean;
  isMultiplayer: boolean;
}

export interface PlayerData {
  id: string;
  name: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    x: number;
    y: number;
    z: number;
  };
  ready?: boolean;
  isLeader?: boolean;
}

export interface RoomData {
  id: string;
  name: string;
  maxPlayers: number;
  players: number;
  mapType: string;
  status: "waiting" | "playing" | "full";
  createdAt: number;
}

export interface ChatMessage {
  type: "system" | "player" | "voice";
  message: string;
  playerName?: string;
  timestamp: number;
}

export interface VoiceData {
  type: "voice-transmission" | "voice-message";
  audioData?: ArrayBuffer;
  message?: string;
  playerId: string;
  playerName: string;
  timestamp: number;
}

export interface GameData {
  players: PlayerData[];
  roomId: string;
  mapType: string;
  gameSettings: {
    maxWaves: number;
    difficulty: number;
  };
}

export interface RemotePlayer {
  id: string;
  name: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  health: number;
  weapon: string;
  mesh?: THREE.Group;
  lastUpdate: number;
}

export interface NetworkMessage {
  type: string;
  playerId: string;
  timestamp: number;
  data: unknown;
}

export interface PlayerUpdateMessage extends NetworkMessage {
  type: "playerUpdate";
  data: {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    health: number;
    weapon: string;
  };
}

export interface GameActionMessage extends NetworkMessage {
  type: "gameAction";
  data: {
    action: "shoot" | "reload" | "takeDamage" | "killDemon";
    target?: string;
    damage?: number;
    position?: { x: number; y: number; z: number };
  };
}

export interface VoiceMessage extends NetworkMessage {
  type: "voice";
  data: {
    audioData?: ArrayBuffer;
    text?: string;
    mode: "audio" | "text";
  };
}

export interface RoomInfo {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  gameState: string;
  isPrivate: boolean;
}
