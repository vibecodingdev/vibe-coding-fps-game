// Type definitions for monster configuration based on the JSON demon system

export interface MonsterConfig {
  id: string;
  name: string;
  emoji: string;
  description?: string;
  health: number;
  speed: number;
  scale: number;
  colors: {
    primary: string;
    head: string;
    eyes: string;
    secondary?: string;
    accent?: string;
  };
  behavior: {
    detectRange: number;
    attackRange: number;
    chaseRange: number;
    attackDamage: number;
    spawnWeight: number;
    isRanged?: boolean;
    fireballSpeed?: number;
    fireballRange?: number;
    attackCooldown?: number;
  };
  appearance: {
    bodyType: BodyType;
    visualFeatures?: {
      hasWings?: boolean;
      hasTail?: boolean;
      hasHorns?: boolean;
      hasClaws?: boolean;
      hasSpikes?: boolean;
      hasArmor?: boolean;
      specialFeatures?: string[];
    };
  };
  themes?: {
    hell?: Partial<MonsterConfig["colors"]>;
    ice?: Partial<MonsterConfig["colors"]>;
    toxic?: Partial<MonsterConfig["colors"]>;
    industrial?: Partial<MonsterConfig["colors"]>;
  };
  metadata?: {
    author?: string;
    version?: string;
    createdAt?: string;
    tags?: string[];
  };
}

export type BodyType =
  | "humanoid"
  | "quadruped"
  | "dragon"
  | "small_biped"
  | "floating";

export interface GenerationRequest {
  prompt: string;
  type?: "individual" | "collection";
  count?: number;
}

export interface GenerationResponse {
  success: boolean;
  data?: MonsterConfig | MonsterConfig[];
  error?: string;
}
