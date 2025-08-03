import { MonsterConfig } from "@/types/monster";

interface MonsterStorageData {
  monsters: Record<string, MonsterConfig>;
  settings: {
    autoLoad: boolean;
    maxMonsters: number;
  };
  metadata: {
    lastModified: string;
    version: string;
  };
}

export class MonsterStorage {
  private static readonly STORAGE_KEY = "monster-generator-data";
  private static readonly MAX_MONSTERS_DEFAULT = 50;
  private static readonly VERSION = "1.0.0";

  /**
   * Load all monsters from localStorage
   */
  static loadMonsters(): MonsterConfig[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        console.log("📦 No stored monster data found");
        return [];
      }

      const parsed = JSON.parse(stored) as MonsterStorageData;
      const monsters = Object.values(parsed.monsters || {});

      console.log(`📦 Loaded ${monsters.length} monsters from localStorage`);
      return monsters;
    } catch (error) {
      console.error("❌ Failed to load monsters from localStorage:", error);
      return [];
    }
  }

  /**
   * Save monsters to localStorage
   */
  static saveMonsters(monsters: MonsterConfig[]): void {
    try {
      // Convert array to record for efficient lookup
      const monstersRecord: Record<string, MonsterConfig> = {};
      monsters.forEach((monster) => {
        monstersRecord[monster.id] = monster;
      });

      const storageData: MonsterStorageData = {
        monsters: monstersRecord,
        settings: {
          autoLoad: true,
          maxMonsters: this.MAX_MONSTERS_DEFAULT,
        },
        metadata: {
          lastModified: new Date().toISOString(),
          version: this.VERSION,
        },
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storageData));
      console.log(`💾 Saved ${monsters.length} monsters to localStorage`);
    } catch (error) {
      console.error("❌ Failed to save monsters to localStorage:", error);
    }
  }

  /**
   * Add a single monster
   */
  static addMonster(monster: MonsterConfig): void {
    const existingMonsters = this.loadMonsters();

    // Check if monster already exists (by ID)
    const existingIndex = existingMonsters.findIndex(
      (m) => m.id === monster.id
    );

    if (existingIndex >= 0) {
      // Update existing monster
      existingMonsters[existingIndex] = monster;
      console.log(`🔄 Updated existing monster: ${monster.name}`);
    } else {
      // Add new monster
      existingMonsters.unshift(monster); // Add to beginning
      console.log(`➕ Added new monster: ${monster.name}`);
    }

    // Enforce max monsters limit
    if (existingMonsters.length > this.MAX_MONSTERS_DEFAULT) {
      const removed = existingMonsters.splice(this.MAX_MONSTERS_DEFAULT);
      console.log(
        `🗑️ Removed ${removed.length} old monsters (max limit: ${this.MAX_MONSTERS_DEFAULT})`
      );
    }

    this.saveMonsters(existingMonsters);
  }

  /**
   * Remove a monster by ID
   */
  static removeMonster(monsterId: string): void {
    const existingMonsters = this.loadMonsters();
    const filteredMonsters = existingMonsters.filter((m) => m.id !== monsterId);

    if (filteredMonsters.length < existingMonsters.length) {
      this.saveMonsters(filteredMonsters);
      console.log(`🗑️ Removed monster: ${monsterId}`);
    }
  }

  /**
   * Clear all monsters
   */
  static clearAllMonsters(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log("🧹 Cleared all monsters from localStorage");
    } catch (error) {
      console.error("❌ Failed to clear monsters:", error);
    }
  }

  /**
   * Export all data as JSON string
   */
  static exportData(): string {
    const monsters = this.loadMonsters();
    return JSON.stringify(
      {
        monsters,
        exportedAt: new Date().toISOString(),
        version: this.VERSION,
      },
      null,
      2
    );
  }

  /**
   * Import data from JSON string
   */
  static importData(jsonData: string): {
    success: boolean;
    imported: number;
    error?: string;
  } {
    try {
      const parsed = JSON.parse(jsonData);

      // Handle different import formats
      let monstersToImport: MonsterConfig[] = [];

      if (Array.isArray(parsed)) {
        // Direct array of monsters
        monstersToImport = parsed;
      } else if (parsed.monsters && Array.isArray(parsed.monsters)) {
        // Export format with metadata
        monstersToImport = parsed.monsters;
      } else if (parsed.id && parsed.name) {
        // Single monster object
        monstersToImport = [parsed];
      } else {
        return { success: false, imported: 0, error: "Invalid import format" };
      }

      // Validate each monster
      const validMonsters: MonsterConfig[] = [];
      const invalidMonsters: { index: number; reason: string }[] = [];

      for (let i = 0; i < monstersToImport.length; i++) {
        const monster = monstersToImport[i];
        const validationResult = this.validateMonsterWithDetails(monster);

        if (validationResult.isValid) {
          validMonsters.push(monster);
        } else {
          invalidMonsters.push({
            index: i,
            reason: validationResult.error || "Unknown validation error",
          });
        }
      }

      if (validMonsters.length === 0) {
        const errorDetails =
          invalidMonsters.length > 0
            ? `Validation errors: ${invalidMonsters.map((inv) => `Monster ${inv.index + 1}: ${inv.reason}`).join("; ")}`
            : "No valid monsters found";

        return {
          success: false,
          imported: 0,
          error: errorDetails,
        };
      }

      // Add all valid monsters
      const existingMonsters = this.loadMonsters();
      const allMonsters = [...validMonsters, ...existingMonsters];

      // Remove duplicates (keep newest)
      const uniqueMonsters = allMonsters.filter(
        (monster, index, array) =>
          array.findIndex((m) => m.id === monster.id) === index
      );

      this.saveMonsters(uniqueMonsters);

      return {
        success: true,
        imported: validMonsters.length,
      };
    } catch (error) {
      return {
        success: false,
        imported: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Basic monster validation (legacy)
   */
  private static validateMonster(monster: any): monster is MonsterConfig {
    return this.validateMonsterWithDetails(monster).isValid;
  }

  /**
   * Detailed monster validation with error messages
   */
  private static validateMonsterWithDetails(monster: any): {
    isValid: boolean;
    error?: string;
  } {
    const validBodyTypes = [
      "humanoid",
      "quadruped",
      "dragon",
      "small_biped",
      "floating",
      "serpentine",
      "arachnid",
      "tentacled",
      "insectoid",
      "amorphous",
      "centauroid",
      "multi_headed",
      "elemental",
      "mechanical",
      "plant_like",
      "crystalline",
      "swarm",
      "giant_humanoid",
      "winged_humanoid",
      "aquatic",
    ];

    if (!monster) {
      return { isValid: false, error: "Monster data is null or undefined" };
    }

    if (typeof monster.id !== "string") {
      return { isValid: false, error: "Missing or invalid id field" };
    }

    if (typeof monster.name !== "string") {
      return { isValid: false, error: "Missing or invalid name field" };
    }

    if (typeof monster.emoji !== "string") {
      return { isValid: false, error: "Missing or invalid emoji field" };
    }

    if (typeof monster.health !== "number") {
      return { isValid: false, error: "Missing or invalid health field" };
    }

    if (typeof monster.speed !== "number") {
      return { isValid: false, error: "Missing or invalid speed field" };
    }

    if (typeof monster.scale !== "number") {
      return { isValid: false, error: "Missing or invalid scale field" };
    }

    if (!monster.colors) {
      return { isValid: false, error: "Missing colors object" };
    }

    if (typeof monster.colors.primary !== "string") {
      return {
        isValid: false,
        error: "Missing or invalid colors.primary field",
      };
    }

    if (typeof monster.colors.head !== "string") {
      return { isValid: false, error: "Missing or invalid colors.head field" };
    }

    if (typeof monster.colors.eyes !== "string") {
      return { isValid: false, error: "Missing or invalid colors.eyes field" };
    }

    if (!monster.behavior) {
      return { isValid: false, error: "Missing behavior object" };
    }

    if (typeof monster.behavior.detectRange !== "number") {
      return {
        isValid: false,
        error: "Missing or invalid behavior.detectRange field",
      };
    }

    if (typeof monster.behavior.attackRange !== "number") {
      return {
        isValid: false,
        error: "Missing or invalid behavior.attackRange field",
      };
    }

    if (typeof monster.behavior.chaseRange !== "number") {
      return {
        isValid: false,
        error: "Missing or invalid behavior.chaseRange field",
      };
    }

    if (typeof monster.behavior.attackDamage !== "number") {
      return {
        isValid: false,
        error: "Missing or invalid behavior.attackDamage field",
      };
    }

    if (typeof monster.behavior.spawnWeight !== "number") {
      return {
        isValid: false,
        error: "Missing or invalid behavior.spawnWeight field",
      };
    }

    if (!monster.appearance) {
      return { isValid: false, error: "Missing appearance object" };
    }

    if (typeof monster.appearance.bodyType !== "string") {
      return {
        isValid: false,
        error: "Missing or invalid appearance.bodyType field",
      };
    }

    if (!validBodyTypes.includes(monster.appearance.bodyType)) {
      return {
        isValid: false,
        error: `Body type must be one of: ${validBodyTypes.join(", ")}. Found: "${monster.appearance.bodyType}"`,
      };
    }

    return { isValid: true };
  }

  /**
   * Get storage info
   */
  static getStorageInfo(): {
    count: number;
    size: string;
    lastModified?: string;
  } {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return { count: 0, size: "0 B" };
      }

      const parsed = JSON.parse(stored) as MonsterStorageData;
      const count = Object.keys(parsed.monsters || {}).length;
      const size = new Blob([stored]).size;
      const sizeStr =
        size < 1024
          ? `${size} B`
          : size < 1024 * 1024
            ? `${(size / 1024).toFixed(1)} KB`
            : `${(size / (1024 * 1024)).toFixed(1)} MB`;

      return {
        count,
        size: sizeStr,
        lastModified: parsed.metadata?.lastModified,
      };
    } catch (error) {
      console.error("❌ Failed to get storage info:", error);
      return { count: 0, size: "0 B" };
    }
  }
}
