import { DemonBodyType, DemonVisualFeatures } from "./demons";

/**
 * JSON-compatible demon configuration interface
 * Designed for easy serialization/deserialization and user editing
 */
export interface JsonDemonConfig {
  // Basic identification
  readonly id: string; // Unique identifier for JSON demons
  readonly name: string;
  readonly emoji: string;
  readonly description?: string; // Optional description for UI display

  // Core stats
  readonly health: number;
  readonly speed: number;
  readonly scale: number;

  // Visual properties
  readonly colors: {
    readonly primary: string; // Hex color as string (e.g., "#8b0000")
    readonly head: string;
    readonly eyes: string;
    readonly secondary?: string;
    readonly accent?: string;
  };

  // Behavior properties
  readonly behavior: {
    readonly detectRange: number;
    readonly attackRange: number;
    readonly chaseRange: number;
    readonly attackDamage: number;
    readonly spawnWeight: number;
    readonly isRanged?: boolean;
    readonly fireballSpeed?: number;
    readonly fireballRange?: number;
    readonly attackCooldown?: number;
  };

  // Visual structure
  readonly appearance: {
    readonly bodyType: DemonBodyType;
    readonly visualFeatures?: {
      readonly hasWings?: boolean;
      readonly hasTail?: boolean;
      readonly hasHorns?: boolean;
      readonly hasClaws?: boolean;
      readonly hasSpikes?: boolean;
      readonly hasArmor?: boolean;
      readonly specialFeatures?: string[];
    };
  };

  // Theme variations (optional - will use base colors if not specified)
  readonly themes?: {
    readonly hell?: Partial<JsonDemonConfig["colors"]>;
    readonly ice?: Partial<JsonDemonConfig["colors"]>;
    readonly toxic?: Partial<JsonDemonConfig["colors"]>;
    readonly industrial?: Partial<JsonDemonConfig["colors"]>;
  };

  // Metadata
  readonly metadata?: {
    readonly author?: string;
    readonly version?: string;
    readonly createdAt?: string;
    readonly tags?: string[];
  };
}

/**
 * JSON demon collection for organizing multiple demons
 */
export interface JsonDemonCollection {
  readonly name: string;
  readonly description?: string;
  readonly demons: JsonDemonConfig[];
  readonly metadata?: {
    readonly author?: string;
    readonly version?: string;
    readonly createdAt?: string;
  };
}

/**
 * LocalStorage structure for demon management
 */
export interface DemonStorageData {
  readonly collections: Record<string, JsonDemonCollection>;
  readonly individualDemons: Record<string, JsonDemonConfig>;
  readonly settings: {
    readonly autoLoad: boolean;
    readonly maxDemons: number;
  };
}

/**
 * Validation result for JSON demon configs
 */
export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: string[];
  readonly warnings: string[];
}

/**
 * UI state for demon manager
 */
export interface DemonManagerState {
  readonly activeTab: "individual" | "collections" | "import" | "export";
  readonly selectedDemon?: string;
  readonly selectedCollection?: string;
  readonly editMode: boolean;
  readonly showPreview: boolean;
}
