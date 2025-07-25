import { Socket } from "socket.io-client";
import * as THREE from "three";

export interface NetworkState {
  socket: Socket | null;
  isConnected: boolean;
  currentRoom: string | null;
  localPlayer: RemotePlayer | null;
  remotePlayers: Map<string, RemotePlayer>;
  isRoomLeader: boolean;
  isMultiplayer: boolean;
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
