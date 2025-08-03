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
  | "humanoid" // Traditional bipedal demons with arms
  | "quadruped" // Four-legged beasts
  | "dragon" // Large winged creatures
  | "small_biped" // Small agile bipeds
  | "floating" // Levitating entities
  | "serpentine" // Snake-like, elongated bodies
  | "arachnid" // Spider-like, multiple legs
  | "tentacled" // Octopus-like, flexible appendages
  | "insectoid" // Bug-like, segmented bodies
  | "amorphous" // Shapeless, blob-like forms
  | "centauroid" // Horse-like lower body, humanoid upper
  | "multi_headed" // Multiple heads on one body
  | "elemental" // Energy/fire/ice/rock form beings
  | "mechanical" // Robotic/cybernetic constructs
  | "plant_like" // Vine/tree-like organic forms
  | "crystalline" // Gem/crystal-based structures
  | "swarm" // Multiple small entities as one
  | "giant_humanoid" // Massive bipedal titans
  | "winged_humanoid" // Humanoid with prominent wings
  | "aquatic";

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
