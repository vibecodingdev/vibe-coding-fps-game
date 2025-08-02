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
      for (const monster of monstersToImport) {
        if (this.validateMonster(monster)) {
          validMonsters.push(monster);
        }
      }

      if (validMonsters.length === 0) {
        return {
          success: false,
          imported: 0,
          error: "No valid monsters found",
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
   * Basic monster validation
   */
  private static validateMonster(monster: any): monster is MonsterConfig {
    return (
      monster &&
      typeof monster.id === "string" &&
      typeof monster.name === "string" &&
      typeof monster.emoji === "string" &&
      typeof monster.health === "number" &&
      typeof monster.speed === "number" &&
      typeof monster.scale === "number" &&
      monster.colors &&
      typeof monster.colors.primary === "string" &&
      typeof monster.colors.head === "string" &&
      typeof monster.colors.eyes === "string" &&
      monster.behavior &&
      typeof monster.behavior.detectRange === "number" &&
      typeof monster.behavior.attackRange === "number" &&
      typeof monster.behavior.chaseRange === "number" &&
      typeof monster.behavior.attackDamage === "number" &&
      typeof monster.behavior.spawnWeight === "number" &&
      monster.appearance &&
      typeof monster.appearance.bodyType === "string"
    );
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
