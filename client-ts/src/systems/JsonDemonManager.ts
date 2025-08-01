import {
  JsonDemonConfig,
  JsonDemonCollection,
  DemonStorageData,
  ValidationResult,
} from "@/types/demonJson";
import { DemonConfig, DemonType } from "@/types/demons";
import { DEMON_CONFIGS } from "@/config/demons";

/**
 * Manages JSON-based demon configurations with localStorage persistence
 */
export class JsonDemonManager {
  private static readonly STORAGE_KEY = "doom-game-custom-demons";
  private static readonly MAX_DEMONS_DEFAULT = 50;

  private storageData: DemonStorageData;
  private loadedJsonDemons: Map<string, DemonConfig> = new Map();

  constructor() {
    console.log("🏗️ JsonDemonManager constructor called");
    this.storageData = this.loadFromStorage();
    console.log("📦 Storage data loaded, initializing demons...");
    this.initializeJsonDemons();
    console.log("✅ JsonDemonManager construction complete");
  }

  /**
   * Initialize and load all JSON demons into the game system
   */
  private initializeJsonDemons(): void {
    console.log("🔄 Initializing JSON demons...");
    console.log(`📋 Storage data:`, {
      autoLoad: this.storageData.settings.autoLoad,
      maxDemons: this.storageData.settings.maxDemons,
      individualCount: Object.keys(this.storageData.individualDemons).length,
      collectionCount: Object.keys(this.storageData.collections).length,
    });

    if (!this.storageData.settings.autoLoad) {
      console.log("📝 JSON demon auto-load is disabled");
      return;
    }

    let loadedCount = 0;
    const maxDemons = this.storageData.settings.maxDemons;

    // Load individual demons
    console.log(
      `🔍 Processing ${
        Object.keys(this.storageData.individualDemons).length
      } individual demons...`
    );
    Object.values(this.storageData.individualDemons).forEach((jsonDemon) => {
      if (loadedCount >= maxDemons) {
        console.log(
          `⚠️ Reached max demons limit (${maxDemons}), skipping ${jsonDemon.name}`
        );
        return;
      }

      console.log(`🔍 Validating demon: ${jsonDemon.name} (${jsonDemon.id})`);
      const validation = this.validateJsonDemon(jsonDemon);
      if (validation.isValid) {
        const demonConfig = this.convertJsonToDemonConfig(jsonDemon);
        this.loadedJsonDemons.set(jsonDemon.id, demonConfig);
        loadedCount++;
        console.log(
          `✅ Loaded JSON demon: ${jsonDemon.name} (${jsonDemon.id})`
        );
      } else {
        console.warn(
          `❌ Invalid JSON demon: ${jsonDemon.name}`,
          validation.errors
        );
      }
    });

    // Load demons from collections
    Object.values(this.storageData.collections).forEach((collection) => {
      collection.demons.forEach((jsonDemon) => {
        if (loadedCount >= maxDemons) return;

        const validation = this.validateJsonDemon(jsonDemon);
        if (validation.isValid) {
          const demonConfig = this.convertJsonToDemonConfig(jsonDemon);
          this.loadedJsonDemons.set(jsonDemon.id, demonConfig);
          loadedCount++;
          console.log(
            `👹 Loaded JSON demon from collection: ${jsonDemon.name} (${jsonDemon.id})`
          );
        } else {
          console.warn(
            `❌ Invalid JSON demon in collection: ${jsonDemon.name}`,
            validation.errors
          );
        }
      });
    });

    console.log(`🎮 Loaded ${loadedCount} custom JSON demons`);
  }

  /**
   * Convert JSON demon config to internal DemonConfig format
   */
  private convertJsonToDemonConfig(jsonDemon: JsonDemonConfig): DemonConfig {
    return {
      name: jsonDemon.name,
      emoji: jsonDemon.emoji,
      health: jsonDemon.health,
      speed: jsonDemon.speed,
      scale: jsonDemon.scale,
      color: this.hexToNumber(jsonDemon.colors.primary),
      headColor: this.hexToNumber(jsonDemon.colors.head),
      eyeColor: this.hexToNumber(jsonDemon.colors.eyes),
      secondaryColor: jsonDemon.colors.secondary
        ? this.hexToNumber(jsonDemon.colors.secondary)
        : undefined,
      accentColor: jsonDemon.colors.accent
        ? this.hexToNumber(jsonDemon.colors.accent)
        : undefined,
      detectRange: jsonDemon.behavior.detectRange,
      attackRange: jsonDemon.behavior.attackRange,
      chaseRange: jsonDemon.behavior.chaseRange,
      attackDamage: jsonDemon.behavior.attackDamage,
      spawnWeight: jsonDemon.behavior.spawnWeight,
      isRanged: jsonDemon.behavior.isRanged,
      fireballSpeed: jsonDemon.behavior.fireballSpeed,
      fireballRange: jsonDemon.behavior.fireballRange,
      attackCooldown: jsonDemon.behavior.attackCooldown,
      bodyType: jsonDemon.appearance.bodyType,
      visualFeatures: jsonDemon.appearance.visualFeatures,
    };
  }

  /**
   * Convert hex color string to number
   */
  private hexToNumber(hexColor: string): number {
    return parseInt(hexColor.replace("#", ""), 16);
  }

  /**
   * Convert number color to hex string
   */
  private numberToHex(color: number): string {
    return `#${color.toString(16).padStart(6, "0")}`;
  }

  /**
   * Validate JSON demon configuration
   */
  public validateJsonDemon(jsonDemon: JsonDemonConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!jsonDemon.id || jsonDemon.id.trim().length === 0) {
      errors.push("Demon ID is required");
    }
    if (!jsonDemon.name || jsonDemon.name.trim().length === 0) {
      errors.push("Demon name is required");
    }
    if (!jsonDemon.emoji || jsonDemon.emoji.trim().length === 0) {
      errors.push("Demon emoji is required");
    }

    // Numeric validation
    if (jsonDemon.health < 1 || jsonDemon.health > 20) {
      errors.push("Health must be between 1 and 20");
    }
    if (jsonDemon.speed < 0.1 || jsonDemon.speed > 5.0) {
      errors.push("Speed must be between 0.1 and 5.0");
    }
    if (jsonDemon.scale < 0.1 || jsonDemon.scale > 5.0) {
      errors.push("Scale must be between 0.1 and 5.0");
    }

    // Color validation
    const colorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!colorRegex.test(jsonDemon.colors.primary)) {
      errors.push("Primary color must be a valid hex color (e.g., #ff0000)");
    }
    if (!colorRegex.test(jsonDemon.colors.head)) {
      errors.push("Head color must be a valid hex color");
    }
    if (!colorRegex.test(jsonDemon.colors.eyes)) {
      errors.push("Eye color must be a valid hex color");
    }

    // Behavior validation
    if (
      jsonDemon.behavior.detectRange < 10 ||
      jsonDemon.behavior.detectRange > 200
    ) {
      warnings.push(
        "Detect range should be between 10 and 200 for optimal gameplay"
      );
    }
    if (
      jsonDemon.behavior.attackRange < 1 ||
      jsonDemon.behavior.attackRange > 150
    ) {
      errors.push("Attack range must be between 1 and 150");
    }
    if (
      jsonDemon.behavior.attackDamage < 1 ||
      jsonDemon.behavior.attackDamage > 100
    ) {
      warnings.push("Attack damage should be between 1 and 100 for balance");
    }

    // Body type validation
    const validBodyTypes = [
      "humanoid",
      "quadruped",
      "dragon",
      "small_biped",
      "floating",
    ];
    if (!validBodyTypes.includes(jsonDemon.appearance.bodyType)) {
      errors.push(`Body type must be one of: ${validBodyTypes.join(", ")}`);
    }

    // ID conflict check
    if (this.isDemonIdExists(jsonDemon.id)) {
      warnings.push("Demon ID already exists, will overwrite existing demon");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Check if demon ID already exists
   */
  private isDemonIdExists(id: string): boolean {
    return (
      this.loadedJsonDemons.has(id) ||
      this.storageData.individualDemons[id] !== undefined ||
      Object.values(this.storageData.collections).some((collection) =>
        collection.demons.some((demon) => demon.id === id)
      )
    );
  }

  /**
   * Add individual demon to storage
   */
  public addIndividualDemon(jsonDemon: JsonDemonConfig): ValidationResult {
    const validation = this.validateJsonDemon(jsonDemon);

    if (validation.isValid) {
      this.storageData.individualDemons[jsonDemon.id] = jsonDemon;
      this.saveToStorage();

      // Load into game if auto-load is enabled
      if (this.storageData.settings.autoLoad) {
        const demonConfig = this.convertJsonToDemonConfig(jsonDemon);
        this.loadedJsonDemons.set(jsonDemon.id, demonConfig);
        console.log(`👹 Added and loaded JSON demon: ${jsonDemon.name}`);
      }
    }

    return validation;
  }

  /**
   * Remove individual demon from storage
   */
  public removeIndividualDemon(demonId: string): boolean {
    if (this.storageData.individualDemons[demonId]) {
      delete this.storageData.individualDemons[demonId];
      this.loadedJsonDemons.delete(demonId);
      this.saveToStorage();
      console.log(`🗑️ Removed JSON demon: ${demonId}`);
      return true;
    }
    return false;
  }

  /**
   * Add demon collection to storage
   */
  public addCollection(collection: JsonDemonCollection): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate collection
    if (!collection.name || collection.name.trim().length === 0) {
      errors.push("Collection name is required");
    }

    // Validate all demons in collection
    collection.demons.forEach((demon, index) => {
      const demonValidation = this.validateJsonDemon(demon);
      if (!demonValidation.isValid) {
        errors.push(
          `Demon ${index + 1} (${
            demon.name || "unnamed"
          }): ${demonValidation.errors.join(", ")}`
        );
      }
      warnings.push(
        ...demonValidation.warnings.map((w) => `Demon ${demon.name}: ${w}`)
      );
    });

    const validation: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings,
    };

    if (validation.isValid) {
      this.storageData.collections[collection.name] = collection;
      this.saveToStorage();

      // Load demons if auto-load is enabled
      if (this.storageData.settings.autoLoad) {
        collection.demons.forEach((jsonDemon) => {
          const demonConfig = this.convertJsonToDemonConfig(jsonDemon);
          this.loadedJsonDemons.set(jsonDemon.id, demonConfig);
        });
        console.log(
          `📚 Added and loaded demon collection: ${collection.name} (${collection.demons.length} demons)`
        );
      }
    }

    return validation;
  }

  /**
   * Get all loaded JSON demons as DemonConfig objects
   */
  public getLoadedDemons(): Map<string, DemonConfig> {
    return new Map(this.loadedJsonDemons);
  }

  /**
   * Get JSON demon configs for UI display
   */
  public getAllJsonDemons(): JsonDemonConfig[] {
    const demons: JsonDemonConfig[] = [];

    // Add individual demons
    demons.push(...Object.values(this.storageData.individualDemons));

    // Add demons from collections
    Object.values(this.storageData.collections).forEach((collection) => {
      demons.push(...collection.demons);
    });

    return demons;
  }

  /**
   * Get all collections
   */
  public getCollections(): JsonDemonCollection[] {
    return Object.values(this.storageData.collections);
  }

  /**
   * Load storage data from localStorage
   */
  private loadFromStorage(): DemonStorageData {
    console.log(
      `📦 Loading from localStorage key: ${JsonDemonManager.STORAGE_KEY}`
    );
    try {
      const stored = localStorage.getItem(JsonDemonManager.STORAGE_KEY);
      console.log(`📦 Raw storage data length: ${stored?.length || 0}`);

      if (stored) {
        console.log("📦 Parsing stored data...");
        const parsed = JSON.parse(stored);
        console.log(`📦 Parsed data structure:`, {
          hasCollections: !!parsed.collections,
          hasIndividualDemons: !!parsed.individualDemons,
          hasSettings: !!parsed.settings,
          collectionsCount: Object.keys(parsed.collections || {}).length,
          individualsCount: Object.keys(parsed.individualDemons || {}).length,
        });
        return {
          collections: parsed.collections || {},
          individualDemons: parsed.individualDemons || {},
          settings: {
            autoLoad: parsed.settings?.autoLoad ?? true,
            maxDemons:
              parsed.settings?.maxDemons ?? JsonDemonManager.MAX_DEMONS_DEFAULT,
          },
        };
      } else {
        console.log("📦 No stored data found, using defaults");
      }
    } catch (error) {
      console.error("Failed to load demon storage data:", error);
    }

    // Return default structure
    console.log("📦 Returning default storage structure");
    return {
      collections: {},
      individualDemons: {},
      settings: {
        autoLoad: true,
        maxDemons: JsonDemonManager.MAX_DEMONS_DEFAULT,
      },
    };
  }

  /**
   * Save storage data to localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(
        JsonDemonManager.STORAGE_KEY,
        JSON.stringify(this.storageData)
      );
    } catch (error) {
      console.error("Failed to save demon storage data:", error);
    }
  }

  /**
   * Export all data as JSON string
   */
  public exportData(): string {
    return JSON.stringify(this.storageData, null, 2);
  }

  /**
   * Import data from JSON string
   */
  public importData(jsonString: string): ValidationResult {
    try {
      const importedData = JSON.parse(jsonString);

      // Check if this is a single demon configuration
      if (
        importedData.id &&
        importedData.name &&
        importedData.colors &&
        importedData.behavior &&
        importedData.appearance
      ) {
        // This is a single demon configuration
        const validation = this.addIndividualDemon(
          importedData as JsonDemonConfig
        );
        return validation;
      }

      // Check if this is a collection
      if (
        importedData.name &&
        importedData.demons &&
        Array.isArray(importedData.demons)
      ) {
        // This is a demon collection
        const validation = this.addCollection(
          importedData as JsonDemonCollection
        );
        return validation;
      }

      // Check if this is a full data structure
      if (!importedData.collections && !importedData.individualDemons) {
        return {
          isValid: false,
          errors: [
            "Invalid data structure. Expected either a single demon config, demon collection, or full data structure with 'collections' and/or 'individualDemons' fields.",
          ],
          warnings: [],
        };
      }

      // Validate all demons in imported data
      const errors: string[] = [];
      const warnings: string[] = [];

      if (importedData.individualDemons) {
        Object.values(importedData.individualDemons).forEach((demon: any) => {
          const validation = this.validateJsonDemon(demon);
          errors.push(...validation.errors);
          warnings.push(...validation.warnings);
        });
      }

      if (importedData.collections) {
        Object.values(importedData.collections).forEach((collection: any) => {
          if (collection.demons) {
            collection.demons.forEach((demon: any) => {
              const validation = this.validateJsonDemon(demon);
              errors.push(...validation.errors);
              warnings.push(...validation.warnings);
            });
          }
        });
      }

      if (errors.length === 0) {
        // Merge with existing data
        this.storageData = {
          collections: {
            ...this.storageData.collections,
            ...importedData.collections,
          },
          individualDemons: {
            ...this.storageData.individualDemons,
            ...importedData.individualDemons,
          },
          settings: importedData.settings || this.storageData.settings,
        };
        this.saveToStorage();
        this.initializeJsonDemons(); // Reload demons
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Invalid JSON format: ${error}`],
        warnings: [],
      };
    }
  }

  /**
   * Update settings
   */
  public updateSettings(settings: Partial<DemonStorageData["settings"]>): void {
    this.storageData.settings = { ...this.storageData.settings, ...settings };
    this.saveToStorage();

    if (settings.autoLoad !== undefined) {
      if (settings.autoLoad) {
        this.initializeJsonDemons();
      } else {
        this.loadedJsonDemons.clear();
      }
    }
  }

  /**
   * Clear all data
   */
  public clearAllData(): void {
    this.storageData = {
      collections: {},
      individualDemons: {},
      settings: {
        autoLoad: true,
        maxDemons: JsonDemonManager.MAX_DEMONS_DEFAULT,
      },
    };
    this.loadedJsonDemons.clear();
    this.saveToStorage();
    console.log("🗑️ Cleared all JSON demon data");
  }
}
