import { DemonType, DemonConfig } from "@/types/demons";
import { SceneThemeName } from "@/themes";

// Base demon configurations with enhanced structure
export const DEMON_CONFIGS: Record<DemonType, DemonConfig> = {
  // Original DOOM-style demons with updated structure
  IMP: {
    name: "Imp",
    emoji: "👹",
    health: 1,
    speed: 5.0,
    scale: 1.0,
    color: 0x8b4513, // Brown
    headColor: 0x654321, // Dark brown
    eyeColor: 0xff0000, // Red
    detectRange: 60,
    attackRange: 3.5,
    chaseRange: 8,
    attackDamage: 10,
    spawnWeight: 100,
    bodyType: "humanoid",
    visualFeatures: {
      hasHorns: true,
      hasClaws: true,
    },
  },
  DEMON: {
    name: "Demon",
    emoji: "🐺",
    health: 2,
    speed: 5.8,
    scale: 0.9,
    color: 0x4b0000, // Dark red
    headColor: 0x8b0000, // Red
    eyeColor: 0xff4400, // Orange-red
    detectRange: 70,
    attackRange: 4.0,
    chaseRange: 10,
    attackDamage: 15,
    spawnWeight: 60,
    bodyType: "humanoid",
    visualFeatures: {
      hasArmor: true,
      hasClaws: true,
      hasSpikes: true,
    },
  },
  CACODEMON: {
    name: "Cacodemon",
    emoji: "👁️",
    health: 4,
    speed: 0.8,
    scale: 1.6,
    color: 0x800080, // Purple
    headColor: 0x4b0082, // Indigo
    eyeColor: 0xff0000, // Red
    detectRange: 80,
    attackRange: 6.0,
    chaseRange: 12,
    attackDamage: 20,
    spawnWeight: 30,
    bodyType: "floating",
    visualFeatures: {
      hasSpikes: true,
      specialFeatures: ["large_mouth", "tentacles"],
    },
  },
  BARON: {
    name: "Baron of Hell",
    emoji: "👑",
    health: 8,
    speed: 0.6,
    scale: 2.2,
    color: 0x006400, // Dark green
    headColor: 0x228b22, // Forest green
    eyeColor: 0xff6600, // Bright orange
    detectRange: 100,
    attackRange: 8.0,
    chaseRange: 15,
    attackDamage: 35,
    spawnWeight: 5,
    bodyType: "humanoid",
    visualFeatures: {
      hasHorns: true,
      hasClaws: true,
      hasArmor: true,
      specialFeatures: ["crown", "shoulder_armor"],
    },
  },
  ARCHVILE: {
    name: "Archvile",
    emoji: "🔥",
    health: 6,
    speed: 0.5,
    scale: 1.8,
    color: 0x8b0000, // Dark red
    headColor: 0xff4500, // Orange red
    eyeColor: 0xffd700, // Gold
    detectRange: 120,
    attackRange: 120.0,
    chaseRange: 20,
    attackDamage: 15,
    spawnWeight: 15,
    isRanged: true,
    fireballSpeed: 200.0,
    fireballRange: 120.0,
    attackCooldown: 180, // 3 seconds at 60fps
    bodyType: "humanoid",
    visualFeatures: {
      specialFeatures: ["fire_aura", "staff", "robe", "fire_crown"],
    },
  },

  // New Pokemon-inspired demons
  CHARIZARD: {
    name: "Charizard",
    emoji: "🐲",
    health: 6,
    speed: 0.9,
    scale: 1.8,
    color: 0xff4500, // Orange
    headColor: 0xff6347, // Tomato red
    eyeColor: 0x00ffff, // Cyan
    secondaryColor: 0xffff00, // Yellow belly
    accentColor: 0x8b0000, // Dark red details
    detectRange: 90,
    attackRange: 35.0, // Match fireball range
    chaseRange: 40,
    attackDamage: 30,
    spawnWeight: 20,
    isRanged: true,
    fireballSpeed: 18.0,
    fireballRange: 35.0,
    attackCooldown: 120, // 2 seconds at 60fps - faster than Archvile
    bodyType: "dragon",
    visualFeatures: {
      hasWings: true,
      hasTail: true,
      hasClaws: true,
      specialFeatures: ["fire_breath", "flame_tail"],
    },
  },
  PIKACHU: {
    name: "Pikachu",
    emoji: "⚡",
    health: 3,
    speed: 2.2,
    scale: 0.8,
    color: 0xffff00, // Yellow
    headColor: 0xffff00, // Yellow
    eyeColor: 0x000000, // Black
    secondaryColor: 0xff0000, // Red cheeks
    accentColor: 0x8b4513, // Brown stripes
    detectRange: 70,
    attackRange: 4.0, // Melee attack range
    chaseRange: 30,
    attackDamage: 18,
    spawnWeight: 40,
    bodyType: "small_biped",
    visualFeatures: {
      hasTail: true,
      specialFeatures: ["long_ears", "cheek_pouches", "lightning_tail"],
    },
  },
  SQUIRTLE: {
    name: "Squirtle",
    emoji: "🐢",
    health: 4,
    speed: 1.1,
    scale: 1.0,
    color: 0x4682b4, // Steel blue
    headColor: 0x87ceeb, // Sky blue
    eyeColor: 0x000080, // Navy
    secondaryColor: 0xf5deb3, // Wheat (shell)
    accentColor: 0x8b4513, // Brown shell pattern
    detectRange: 75,
    attackRange: 4.5, // Melee attack range
    chaseRange: 35,
    attackDamage: 22,
    spawnWeight: 35,
    bodyType: "small_biped",
    visualFeatures: {
      hasTail: true,
      specialFeatures: ["shell", "water_cannon"],
    },
  },
  EEVEE: {
    name: "Eevee",
    emoji: "🦊",
    health: 2,
    speed: 1.6,
    scale: 0.9,
    color: 0xd2b48c, // Tan
    headColor: 0xf5deb3, // Wheat
    eyeColor: 0x8b4513, // Saddle brown
    secondaryColor: 0xfffaf0, // Floral white (fluffy parts)
    accentColor: 0x654321, // Dark brown details
    detectRange: 65,
    attackRange: 4.5,
    chaseRange: 10,
    attackDamage: 12,
    spawnWeight: 50,
    bodyType: "quadruped",
    visualFeatures: {
      hasTail: true,
      specialFeatures: ["fluffy_collar", "big_ears", "bushy_tail"],
    },
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
    CHARIZARD: {
      ...DEMON_CONFIGS.CHARIZARD,
      color: 0x8b0000, // Darker red for hell
      headColor: 0xff0000, // Bright red
      secondaryColor: 0xff4500, // Orange flames
    },
    PIKACHU: {
      ...DEMON_CONFIGS.PIKACHU,
      color: 0xffa500, // Orange-yellow for hell
      secondaryColor: 0xff0000, // Red lightning
    },
    SQUIRTLE: {
      ...DEMON_CONFIGS.SQUIRTLE,
      color: 0x800080, // Purple for hell lava
      headColor: 0x8b0000, // Dark red
      secondaryColor: 0x2f1b14, // Dark shell
    },
    EEVEE: {
      ...DEMON_CONFIGS.EEVEE,
      color: 0x8b4513, // Darker brown for hell
      headColor: 0x654321, // Dark brown
      secondaryColor: 0x2f1b14, // Dark accents
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
    CHARIZARD: {
      ...DEMON_CONFIGS.CHARIZARD,
      color: 0x4682b4, // Steel blue
      headColor: 0x87ceeb, // Sky blue
      secondaryColor: 0xb0e0e6, // Powder blue
    },
    PIKACHU: {
      ...DEMON_CONFIGS.PIKACHU,
      color: 0xe6e6fa, // Lavender (frostbitten)
      secondaryColor: 0x87ceeb, // Sky blue cheeks
    },
    SQUIRTLE: {
      ...DEMON_CONFIGS.SQUIRTLE,
      color: 0x191970, // Midnight blue
      headColor: 0x4169e1, // Royal blue
      secondaryColor: 0xe6e6fa, // Lavender shell
    },
    EEVEE: {
      ...DEMON_CONFIGS.EEVEE,
      color: 0xd3d3d3, // Light gray (frosty)
      headColor: 0xf0f8ff, // Alice blue
      secondaryColor: 0xe6e6fa, // Lavender
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
    CHARIZARD: {
      ...DEMON_CONFIGS.CHARIZARD,
      color: 0x228b22, // Forest green
      headColor: 0x32cd32, // Lime green
      secondaryColor: 0x9acd32, // Yellow green
    },
    PIKACHU: {
      ...DEMON_CONFIGS.PIKACHU,
      color: 0x9acd32, // Yellow green
      secondaryColor: 0x00ff00, // Lime cheeks
    },
    SQUIRTLE: {
      ...DEMON_CONFIGS.SQUIRTLE,
      color: 0x2e8b57, // Sea green
      headColor: 0x3cb371, // Medium sea green
      secondaryColor: 0x228b22, // Forest green shell
    },
    EEVEE: {
      ...DEMON_CONFIGS.EEVEE,
      color: 0x556b2f, // Dark olive green
      headColor: 0x6b8e23, // Olive drab
      secondaryColor: 0x9acd32, // Yellow green
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
    CHARIZARD: {
      ...DEMON_CONFIGS.CHARIZARD,
      color: 0x696969, // Dim gray
      headColor: 0x808080, // Gray
      secondaryColor: 0xc0c0c0, // Silver
    },
    PIKACHU: {
      ...DEMON_CONFIGS.PIKACHU,
      color: 0xffd700, // Gold (metallic)
      secondaryColor: 0xff0000, // Red warning lights
    },
    SQUIRTLE: {
      ...DEMON_CONFIGS.SQUIRTLE,
      color: 0x36454f, // Charcoal
      headColor: 0x708090, // Slate gray
      secondaryColor: 0x2f2f2f, // Dark gray shell
    },
    EEVEE: {
      ...DEMON_CONFIGS.EEVEE,
      color: 0x2f2f2f, // Dark gray
      headColor: 0x4a4a4a, // Medium dark gray
      secondaryColor: 0x696969, // Dim gray
    },
  },
  doomMap: {
    // Use base configs for doom map theme
    ...(Object.fromEntries(Object.entries(DEMON_CONFIGS)) as Record<
      DemonType,
      DemonConfig
    >),
  },
  bspMap: {
    // Use base configs for BSP map theme
    ...(Object.fromEntries(Object.entries(DEMON_CONFIGS)) as Record<
      DemonType,
      DemonConfig
    >),
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
          return 35;
        case "CHARIZARD":
          return 30; // Strong dragon demon
        case "PIKACHU":
          return 45; // Fast electric attacker
        case "SQUIRTLE":
          return 40; // Balanced water demon
        case "EEVEE":
          return 55; // Agile quadruped
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
          return 25;
        case "CHARIZARD":
          return 25; // Start appearing at wave 5
        case "PIKACHU":
          return 35;
        case "SQUIRTLE":
          return 30;
        case "EEVEE":
          return 40;
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
          return 10;
        case "CHARIZARD":
          return 15; // Rare early appearance
        case "PIKACHU":
          return 25; // More common early
        case "SQUIRTLE":
          return 20;
        case "EEVEE":
          return 30; // Common early
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
    CHARIZARD: getSpawnWeight("CHARIZARD", waveNumber),
    PIKACHU: getSpawnWeight("PIKACHU", waveNumber),
    SQUIRTLE: getSpawnWeight("SQUIRTLE", waveNumber),
    EEVEE: getSpawnWeight("EEVEE", waveNumber),
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
        t === "DEMON" ||
        t === "CACODEMON" ||
        t === "BARON" ||
        t === "ARCHVILE" ||
        t === "CHARIZARD" ||
        t === "PIKACHU" ||
        t === "SQUIRTLE"
    );
    if (strongTypes.length === 0) {
      // Replace a random imp or eevee with a stronger demon
      const weakIndex = types.findIndex((t) => t === "IMP" || t === "EEVEE");
      if (weakIndex !== -1) {
        const strongDemonTypes: DemonType[] =
          waveNumber >= 5
            ? ["CACODEMON", "CHARIZARD", "SQUIRTLE"]
            : ["DEMON", "PIKACHU"];
        const selectedDemon =
          strongDemonTypes[Math.floor(Math.random() * strongDemonTypes.length)];
        if (selectedDemon) {
          types[weakIndex] = selectedDemon;
        }
      }
    }
  }

  console.log(
    `🌊 Wave ${waveNumber}: ${waveCount} demons (${types.join(", ")})`
  );
  return types;
}
