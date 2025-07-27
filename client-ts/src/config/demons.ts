import { DemonType, DemonConfig } from "@/types/demons";
import { SceneThemeName } from "@/themes";

// Base demon configurations remain unchanged
export const DEMON_CONFIGS: Record<DemonType, DemonConfig> = {
  IMP: {
    name: "Imp",
    emoji: "👹",
    health: 1,
    speed: 1.0, // Base speed multiplier - matches original
    scale: 1.0,
    color: 0x8b4513, // Brown
    headColor: 0x654321, // Dark brown
    eyeColor: 0xff0000, // Red
    detectRange: 60,
    attackRange: 3.5, // Reduced to match original
    chaseRange: 8,
    attackDamage: 10,
    spawnWeight: 100,
  },
  DEMON: {
    name: "Demon",
    emoji: "🐺",
    health: 2,
    speed: 1.8, // Faster than Imp - matches original
    scale: 0.9,
    color: 0x4b0000, // Dark red
    headColor: 0x8b0000, // Red
    eyeColor: 0xff4400, // Orange-red
    detectRange: 70,
    attackRange: 4.0, // Matches original
    chaseRange: 10,
    attackDamage: 15,
    spawnWeight: 60,
  },
  CACODEMON: {
    name: "Cacodemon",
    emoji: "👁️",
    health: 4,
    speed: 0.8, // Slower but tanky - matches original
    scale: 1.6,
    color: 0x800080, // Purple
    headColor: 0x4b0082, // Indigo
    eyeColor: 0xff0000, // Red
    detectRange: 80,
    attackRange: 6.0, // Matches original
    chaseRange: 12,
    attackDamage: 20,
    spawnWeight: 30,
  },
  BARON: {
    name: "Baron of Hell",
    emoji: "👑",
    health: 8,
    speed: 0.6, // Slowest but strongest - matches original
    scale: 2.2,
    color: 0x006400, // Dark green
    headColor: 0x228b22, // Forest green
    eyeColor: 0xff6600, // Bright orange
    detectRange: 100,
    attackRange: 8.0, // Matches original
    chaseRange: 15,
    attackDamage: 35,
    spawnWeight: 5,
  },
  ARCHVILE: {
    name: "Archvile",
    emoji: "🔥",
    health: 6,
    speed: 0.5, // Slow but dangerous ranged attacker
    scale: 1.8,
    color: 0x8b0000, // Dark red
    headColor: 0xff4500, // Orange red
    eyeColor: 0xffd700, // Gold
    detectRange: 120, // Long range detection
    attackRange: 25.0, // Long range attack
    chaseRange: 20, // Prefers to keep distance
    attackDamage: 25,
    spawnWeight: 15,
    isRanged: true,
    fireballSpeed: 15.0, // Fast fireball
    fireballRange: 30.0, // Maximum fireball range
  },
};

// Theme-specific demon visual configurations
export const THEME_DEMON_CONFIGS: Record<
  SceneThemeName,
  Record<DemonType, DemonConfig>
> = {
  hell: {
    IMP: {
      ...DEMON_CONFIGS.IMP,
      color: 0x8b0000, // Dark red for hell theme
      headColor: 0xcd5c5c, // Indian red
      eyeColor: 0xff4500, // Orange red
    },
    DEMON: {
      ...DEMON_CONFIGS.DEMON,
      color: 0x2f1b14, // Dark brown with fire tones
      headColor: 0x8b0000, // Dark red
      eyeColor: 0xff6347, // Tomato red
    },
    CACODEMON: {
      ...DEMON_CONFIGS.CACODEMON,
      color: 0x800000, // Maroon
      headColor: 0x8b0000, // Dark red
      eyeColor: 0xff0000, // Pure red
    },
    BARON: {
      ...DEMON_CONFIGS.BARON,
      color: 0x8b0000, // Dark red - classic hell baron
      headColor: 0xcd5c5c, // Indian red
      eyeColor: 0xff4500, // Orange red
    },
    ARCHVILE: {
      ...DEMON_CONFIGS.ARCHVILE,
      color: 0x2f1b14, // Dark charcoal
      headColor: 0xff4500, // Orange red
      eyeColor: 0xffd700, // Gold
    },
  },
  ice: {
    IMP: {
      ...DEMON_CONFIGS.IMP,
      color: 0x4682b4, // Steel blue
      headColor: 0x708090, // Slate gray
      eyeColor: 0x87ceeb, // Sky blue
    },
    DEMON: {
      ...DEMON_CONFIGS.DEMON,
      color: 0x2f4f4f, // Dark slate gray
      headColor: 0x6495ed, // Cornflower blue
      eyeColor: 0x00ffff, // Cyan
    },
    CACODEMON: {
      ...DEMON_CONFIGS.CACODEMON,
      color: 0x191970, // Midnight blue
      headColor: 0x4169e1, // Royal blue
      eyeColor: 0x87cefa, // Light sky blue
    },
    BARON: {
      ...DEMON_CONFIGS.BARON,
      color: 0x1e90ff, // Dodger blue
      headColor: 0x4682b4, // Steel blue
      eyeColor: 0x00bfff, // Deep sky blue
    },
    ARCHVILE: {
      ...DEMON_CONFIGS.ARCHVILE,
      color: 0x2f4f4f, // Dark slate gray
      headColor: 0x87ceeb, // Sky blue
      eyeColor: 0xe0ffff, // Light cyan
    },
  },
  toxic: {
    IMP: {
      ...DEMON_CONFIGS.IMP,
      color: 0x228b22, // Forest green
      headColor: 0x32cd32, // Lime green
      eyeColor: 0x00ff00, // Lime
    },
    DEMON: {
      ...DEMON_CONFIGS.DEMON,
      color: 0x006400, // Dark green
      headColor: 0x9acd32, // Yellow green
      eyeColor: 0xadff2f, // Green yellow
    },
    CACODEMON: {
      ...DEMON_CONFIGS.CACODEMON,
      color: 0x2e8b57, // Sea green
      headColor: 0x3cb371, // Medium sea green
      eyeColor: 0x00ff7f, // Spring green
    },
    BARON: {
      ...DEMON_CONFIGS.BARON,
      color: 0x556b2f, // Dark olive green
      headColor: 0x6b8e23, // Olive drab
      eyeColor: 0x32cd32, // Lime green
    },
    ARCHVILE: {
      ...DEMON_CONFIGS.ARCHVILE,
      color: 0x2f4f2f, // Dark sea green
      headColor: 0x66cdaa, // Medium aquamarine
      eyeColor: 0x00ff00, // Lime
    },
  },
  industrial: {
    IMP: {
      ...DEMON_CONFIGS.IMP,
      color: 0x696969, // Dim gray
      headColor: 0x808080, // Gray
      eyeColor: 0xff0000, // Red (classic contrast)
    },
    DEMON: {
      ...DEMON_CONFIGS.DEMON,
      color: 0x2f2f2f, // Dark gray
      headColor: 0x4a4a4a, // Medium dark gray
      eyeColor: 0xff4500, // Orange red
    },
    CACODEMON: {
      ...DEMON_CONFIGS.CACODEMON,
      color: 0x36454f, // Charcoal
      headColor: 0x708090, // Slate gray
      eyeColor: 0x00ffff, // Cyan (tech glow)
    },
    BARON: {
      ...DEMON_CONFIGS.BARON,
      color: 0x2f4f4f, // Dark slate gray
      headColor: 0x696969, // Dim gray
      eyeColor: 0x00ff00, // Green (industrial warning)
    },
    ARCHVILE: {
      ...DEMON_CONFIGS.ARCHVILE,
      color: 0x1c1c1c, // Almost black
      headColor: 0x4a4a4a, // Medium dark gray
      eyeColor: 0x00bfff, // Deep sky blue (tech)
    },
  },
};

// Helper function to get theme-specific demon config
export function getThemeDemonConfig(
  demonType: DemonType,
  themeName?: SceneThemeName
): DemonConfig {
  if (themeName && THEME_DEMON_CONFIGS[themeName]) {
    return (
      THEME_DEMON_CONFIGS[themeName][demonType] || DEMON_CONFIGS[demonType]
    );
  }
  return DEMON_CONFIGS[demonType];
}

export const DEMON_COUNT = 10;

// Wave generation function with progressive difficulty
export function getDemonTypesForWave(waveNumber: number): DemonType[] {
  const types: DemonType[] = [];

  // Base count increases with wave number
  const baseCount = Math.min(5 + Math.floor(waveNumber / 2), 15);
  const waveCount = Math.floor(baseCount * (1 + waveNumber * 0.1));

  // Create adjustable weights based on wave number
  const getSpawnWeight = (type: DemonType, wave: number): number => {
    const baseWeight = DEMON_CONFIGS[type].spawnWeight;

    if (wave >= 8) {
      switch (type) {
        case "IMP":
          return 40;
        case "DEMON":
          return 80;
        case "CACODEMON":
          return 70;
        case "BARON":
          return 40;
        case "ARCHVILE":
          return 35; // Dangerous ranged attackers
      }
    } else if (wave >= 5) {
      switch (type) {
        case "IMP":
          return 60;
        case "DEMON":
          return 80;
        case "CACODEMON":
          return 50;
        case "BARON":
          return 20;
        case "ARCHVILE":
          return 25; // Start appearing at wave 5
      }
    } else if (wave >= 3) {
      switch (type) {
        case "IMP":
          return baseWeight;
        case "DEMON":
          return 80;
        case "CACODEMON":
          return 50;
        case "BARON":
          return baseWeight;
        case "ARCHVILE":
          return 10; // Rare early appearance
      }
    }

    return baseWeight;
  };

  const adjustedWeights = {
    IMP: getSpawnWeight("IMP", waveNumber),
    DEMON: getSpawnWeight("DEMON", waveNumber),
    CACODEMON: getSpawnWeight("CACODEMON", waveNumber),
    BARON: getSpawnWeight("BARON", waveNumber),
    ARCHVILE: getSpawnWeight("ARCHVILE", waveNumber),
  };

  // Calculate total adjusted weights
  const totalWeight = Object.values(adjustedWeights).reduce(
    (sum, weight) => sum + weight,
    0
  );

  // Generate demons based on adjusted spawn weights
  for (let i = 0; i < waveCount; i++) {
    let random = Math.random() * totalWeight;

    for (const [type, weight] of Object.entries(adjustedWeights) as [
      DemonType,
      number
    ][]) {
      random -= weight;
      if (random <= 0) {
        types.push(type);
        break;
      }
    }
  }

  // Ensure at least one stronger demon per wave after wave 2
  if (waveNumber >= 3) {
    const strongTypes = types.filter(
      (t) =>
        t === "DEMON" || t === "CACODEMON" || t === "BARON" || t === "ARCHVILE"
    );
    if (strongTypes.length === 0) {
      // Replace a random imp with a demon
      const impIndex = types.findIndex((t) => t === "IMP");
      if (impIndex !== -1) {
        types[impIndex] = waveNumber >= 5 ? "CACODEMON" : "DEMON";
      }
    }
  }

  console.log(
    `🌊 Wave ${waveNumber}: ${waveCount} demons (${types.join(", ")})`
  );
  return types;
}
