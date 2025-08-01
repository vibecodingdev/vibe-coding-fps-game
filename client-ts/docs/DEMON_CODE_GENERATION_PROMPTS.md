# Demon Code Generation Prompts for LLMs

This document provides comprehensive prompts, rules, and examples for using any LLM to generate complete demon code that can be directly integrated into the DOOM-style game. The generated code follows the established patterns and integrates seamlessly with the existing demon system.

## 🎯 Core System Architecture

The game uses a modular demon system built on THREE.js with the following key components:

- **DemonConfig**: Configuration object defining all demon properties
- **DemonType**: Union type for demon identification
- **Body Types**: `humanoid`, `quadruped`, `dragon`, `small_biped`, `floating`
- **Visual Features**: Modular system for wings, claws, tails, special effects
- **Theme Support**: Automatic color variations for different game environments
- **Animation System**: State-based animations (idle, walking, attacking, death)
- **AI Behaviors**: Distance-based behavior (wander, chase, attack, ranged positioning)

## 📋 Generation Rules

### 1. Mandatory Requirements

- All demons MUST have a unique `DemonType` string (UPPERCASE_UNDERSCORE format)
- All numerical values MUST be balanced for gameplay
- All colors MUST be in hexadecimal format (0x123456)
- All demon names MUST use English only
- Body type MUST be one of the 5 supported types
- Configuration MUST be complete and valid TypeScript

### 2. Balance Guidelines

- **Health**: 1-10 (1=weak, 10=boss-level)
- **Speed**: 0.5-3.0 (0.5=slow, 3.0=very fast)
- **Scale**: 0.5-3.0 (0.5=small, 3.0=large)
- **Detect Range**: 50-150 units
- **Attack Range**: 3-120 units (120 for ranged)
- **Attack Damage**: 10-50 points
- **Spawn Weight**: 5-100 (higher = more common)

### 3. Code Structure Requirements

- Use exact TypeScript interfaces from the codebase
- Follow existing naming conventions exactly
- Include all required properties
- Use readonly modifiers where specified
- Include proper type annotations

## 🎨 Body Type Templates

### Humanoid Template

```typescript
bodyType: "humanoid",
visualFeatures: {
  hasClaws: true,
  hasSpikes: false,
  hasArmor: true,
  specialFeatures: ["battle_scars", "helmet"]
}
```

### Quadruped Template

```typescript
bodyType: "quadruped",
visualFeatures: {
  hasTail: true,
  specialFeatures: ["fluffy_collar", "big_ears", "bushy_tail"]
}
```

### Dragon Template

```typescript
bodyType: "dragon",
visualFeatures: {
  hasWings: true,
  hasTail: true,
  hasClaws: true,
  specialFeatures: ["fire_breath", "flame_tail", "ancient_runes"]
}
```

### Small Biped Template

```typescript
bodyType: "small_biped",
visualFeatures: {
  hasTail: true,
  specialFeatures: ["long_ears", "cheek_pouches", "lightning_tail"]
}
```

### Floating Template

```typescript
bodyType: "floating",
visualFeatures: {
  hasSpikes: true,
  specialFeatures: ["large_mouth", "tentacles", "energy_core"]
}
```

## 🔥 Complete Generation Prompt

### Primary Prompt

````
Generate a complete demon configuration for a DOOM-style FPS game. Create a demon that is [DESCRIBE_DEMON_CONCEPT].

Requirements:
1. Generate ONLY the TypeScript demon configuration object
2. Follow the exact DemonConfig interface structure
3. Use balanced gameplay statistics
4. Include theme variations for all 4 themes (hell, ice, toxic, industrial)
5. Choose appropriate body type and visual features
6. Include unique special features if relevant
7. Use creative but appropriate naming
8. Ensure all numerical values are gameplay-balanced

Template to follow:
```typescript
// Add to DemonType union:
| "YOUR_DEMON_NAME"

// Add to DEMON_CONFIGS:
YOUR_DEMON_NAME: {
  name: "Demon Display Name",
  emoji: "🔥",
  health: 3,
  speed: 1.2,
  scale: 1.0,
  color: 0x8b0000,
  headColor: 0xff4500,
  eyeColor: 0xff0000,
  secondaryColor: 0x228b22, // Optional
  accentColor: 0x444444,   // Optional
  detectRange: 75,
  attackRange: 5.0,
  chaseRange: 12,
  attackDamage: 20,
  spawnWeight: 35,
  isRanged: false, // or true with fireballSpeed/fireballRange
  bodyType: "humanoid", // Choose appropriate type
  visualFeatures: {
    hasWings: false,
    hasTail: true,
    hasClaws: true,
    hasSpikes: false,
    hasArmor: false,
    specialFeatures: ["feature1", "feature2"] // Optional
  },
},

// Theme variations:
[Include complete theme objects for hell, ice, toxic, industrial]
````

Generate the complete code now.

````

### Few-Shot Examples

#### Example 1: Shadow Stalker (Humanoid)
```typescript
// Input: "Create a stealthy shadow demon that moves quickly and strikes from darkness"

// Output:
| "SHADOW_STALKER"

SHADOW_STALKER: {
  name: "Shadow Stalker",
  emoji: "👤",
  health: 2,
  speed: 2.5,
  scale: 0.9,
  color: 0x2c2c2c,
  headColor: 0x1a1a1a,
  eyeColor: 0x8a2be2,
  accentColor: 0x000000,
  detectRange: 90,
  attackRange: 3.5,
  chaseRange: 8,
  attackDamage: 15,
  spawnWeight: 45,
  bodyType: "humanoid",
  visualFeatures: {
    hasClaws: true,
    specialFeatures: ["shadow_cloak", "stealth_mode"]
  },
},
````

#### Example 2: Crystal Golem (Floating)

```typescript
// Input: "Design a floating crystal demon that shoots energy beams"

// Output:
| "CRYSTAL_GOLEM"

CRYSTAL_GOLEM: {
  name: "Crystal Golem",
  emoji: "💎",
  health: 6,
  speed: 0.8,
  scale: 1.5,
  color: 0x4169e1,
  headColor: 0x6495ed,
  eyeColor: 0x00ffff,
  secondaryColor: 0x87ceeb,
  accentColor: 0x191970,
  detectRange: 100,
  attackRange: 80.0,
  chaseRange: 15,
  attackDamage: 30,
  spawnWeight: 20,
  isRanged: true,
  fireballSpeed: 20.0,
  fireballRange: 80.0,
  attackCooldown: 150,
  bodyType: "floating",
  visualFeatures: {
    hasSpikes: true,
    specialFeatures: ["energy_core", "crystal_shards", "light_beam"]
  },
},
```

#### Example 3: Thunder Wolf (Quadruped)

```typescript
// Input: "Create an electric wolf demon that can pounce and has lightning attacks"

// Output:
| "THUNDER_WOLF"

THUNDER_WOLF: {
  name: "Thunder Wolf",
  emoji: "🐺",
  health: 4,
  speed: 2.0,
  scale: 1.1,
  color: 0x483d8b,
  headColor: 0x6a5acd,
  eyeColor: 0xffff00,
  secondaryColor: 0x9370db,
  accentColor: 0x4b0082,
  detectRange: 85,
  attackRange: 4.5,
  chaseRange: 15,
  attackDamage: 25,
  spawnWeight: 30,
  bodyType: "quadruped",
  visualFeatures: {
    hasTail: true,
    hasClaws: true,
    specialFeatures: ["lightning_fur", "electric_eyes", "thunder_howl"]
  },
},
```

## 🌈 Theme Variation Prompt

````
Generate theme variations for the demon you just created. For each theme (hell, ice, toxic, industrial), modify the colors to fit the theme aesthetic while maintaining the demon's core identity.

Theme Guidelines:
- Hell: Reds, dark oranges, blacks, fire colors
- Ice: Blues, whites, silvers, crystal colors
- Toxic: Greens, yellows, sickly colors, glow effects
- Industrial: Grays, metals, blacks, tech colors

Template:
```typescript
// Theme variations in THEME_DEMON_CONFIGS:
hell: {
  YOUR_DEMON: {
    ...DEMON_CONFIGS.YOUR_DEMON,
    color: 0x8b0000,
    headColor: 0xff4500,
    secondaryColor: 0xff6600,
  },
},
ice: {
  YOUR_DEMON: {
    ...DEMON_CONFIGS.YOUR_DEMON,
    color: 0x4682b4,
    headColor: 0x87ceeb,
    secondaryColor: 0xb0e0e6,
  },
},
toxic: {
  YOUR_DEMON: {
    ...DEMON_CONFIGS.YOUR_DEMON,
    color: 0x228b22,
    headColor: 0x32cd32,
    secondaryColor: 0x9acd32,
  },
},
industrial: {
  YOUR_DEMON: {
    ...DEMON_CONFIGS.YOUR_DEMON,
    color: 0x696969,
    headColor: 0x808080,
    secondaryColor: 0xc0c0c0,
  },
},
````

```

## 🔧 Advanced Features Prompt

```

For advanced demon designs, you can include special behaviors and visual effects:

Special Features Available:

- "fire_breath", "flame_tail", "fire_aura"
- "lightning_bolt", "electric_eyes", "thunder_strike"
- "ice_shards", "frost_breath", "crystal_armor"
- "poison_spit", "toxic_cloud", "acid_drip"
- "metal_plating", "cyber_eye", "energy_beam"
- "shadow_cloak", "stealth_mode", "dark_energy"
- "ancient_runes", "magic_circle", "spell_cast"

Ranged Attack Configuration:
For ranged demons, include:

```typescript
isRanged: true,
fireballSpeed: 15.0,    // Speed of projectile
fireballRange: 50.0,    // Maximum range
attackCooldown: 120,    // Frames between attacks (60fps)
```

Custom Animation Hints:
Use specialFeatures to suggest custom animations:

- "pounce_attack" - Special leap attack
- "ground_slam" - AOE ground attack
- "teleport" - Instant movement ability
- "shield_bash" - Defensive counter-attack

```

## 🎮 One-Shot Demon Generation

For rapid demon creation, use this condensed prompt:

```

Create a [DEMON_CONCEPT] demon for a DOOM-style game. Generate complete TypeScript configuration with:

- Unique DemonType name (UPPERCASE_UNDERSCORE)
- Balanced stats (health 1-10, speed 0.5-3.0, damage 10-50)
- Appropriate body type and visual features
- Theme color variations for hell/ice/toxic/industrial
- Include all required DemonConfig properties
- Use proper TypeScript syntax and interfaces

Output only the code, starting with the DemonType addition.

```

## 🚀 Integration Validation

After generation, validate the demon code:

1. **Syntax Check**: Ensure valid TypeScript
2. **Balance Check**: Verify stats are within guidelines
3. **Theme Check**: Confirm all 4 theme variations exist
4. **Feature Check**: Verify visual features are implemented
5. **Name Check**: Ensure unique demon type name

## 💡 Pro Tips for LLM Usage

1. **Be Specific**: Describe the demon's personality, abilities, and appearance
2. **Mention Balance**: Include difficulty level (weak/medium/strong/boss)
3. **Theme Considerations**: Mention if the demon should fit specific environments
4. **Unique Features**: Request special visual or behavioral characteristics
5. **Cultural Elements**: Safe to reference mythology, fantasy, or sci-fi concepts

This system enables rapid creation of diverse, balanced demons that integrate seamlessly into the game's existing architecture while maintaining code quality and gameplay balance.
```
