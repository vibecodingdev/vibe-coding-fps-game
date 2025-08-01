# JSON Demon Generation Prompts for Natural Language

This document provides comprehensive prompts for generating JSON-format demon configurations using natural language descriptions with any LLM. The generated JSON can be directly imported into the game's Demon Manager UI and loaded from localStorage.

## 🎯 JSON Configuration Overview

The JSON demon system allows for:

- **Runtime Loading**: Demons loaded dynamically from localStorage
- **UI Management**: Built-in interface for creating, editing, and managing demons
- **Easy Sharing**: Export/import demon configurations as JSON files
- **Hot Reloading**: Add new demons without modifying source code
- **User-Friendly**: No TypeScript knowledge required

## 📋 JSON Structure Rules

### 1. Required Fields

- `id`: Unique identifier (string, lowercase_underscore format)
- `name`: Display name for the demon
- `emoji`: Single emoji for UI representation
- `health`, `speed`, `scale`: Numeric stats
- `colors`: Primary, head, and eye colors (hex format with #)
- `behavior`: All combat and AI properties
- `appearance.bodyType`: One of 5 supported body types

### 2. Color Format

- All colors MUST be hex strings with # prefix
- Example: `"#ff0000"` for red, `"#00ff00"` for green
- Use uppercase or lowercase hex digits

### 3. Balance Guidelines

- **Health**: 1-20 (recommended 1-10 for balance)
- **Speed**: 0.1-5.0 (recommended 0.5-3.0)
- **Scale**: 0.1-5.0 (recommended 0.5-2.5)
- **Attack Damage**: 1-100 (recommended 10-50)
- **Spawn Weight**: 1-100 (higher = more common)

## 🎨 Complete JSON Template

```json
{
  "id": "unique_demon_id",
  "name": "Demon Display Name",
  "emoji": "👹",
  "description": "Optional description for UI display",
  "health": 3,
  "speed": 1.2,
  "scale": 1.0,
  "colors": {
    "primary": "#8b0000",
    "head": "#ff4500",
    "eyes": "#ff0000",
    "secondary": "#228b22",
    "accent": "#444444"
  },
  "behavior": {
    "detectRange": 75,
    "attackRange": 5,
    "chaseRange": 12,
    "attackDamage": 20,
    "spawnWeight": 50,
    "isRanged": false,
    "fireballSpeed": 15.0,
    "fireballRange": 50.0,
    "attackCooldown": 120
  },
  "appearance": {
    "bodyType": "humanoid",
    "visualFeatures": {
      "hasWings": false,
      "hasTail": true,
      "hasHorns": true,
      "hasClaws": true,
      "hasSpikes": false,
      "hasArmor": false,
      "specialFeatures": ["fire_breath", "glowing_eyes"]
    }
  },
  "themes": {
    "hell": {
      "primary": "#8b0000",
      "head": "#ff4500",
      "secondary": "#ff6600"
    },
    "ice": {
      "primary": "#4682b4",
      "head": "#87ceeb",
      "secondary": "#b0e0e6"
    },
    "toxic": {
      "primary": "#228b22",
      "head": "#32cd32",
      "secondary": "#9acd32"
    },
    "industrial": {
      "primary": "#696969",
      "head": "#808080",
      "secondary": "#c0c0c0"
    }
  },
  "metadata": {
    "author": "Player Name",
    "version": "1.0",
    "createdAt": "2024-01-15",
    "tags": ["fire", "humanoid", "melee"]
  }
}
```

## 🚀 Primary Generation Prompt

````
Generate a complete JSON demon configuration for a DOOM-style FPS game. Create a demon that is [DESCRIBE_DEMON_CONCEPT].

REQUIREMENTS:
1. Output ONLY valid JSON format
2. Use the exact structure provided in the template
3. All colors must be hex strings with # prefix
4. Choose appropriate body type: humanoid, quadruped, dragon, small_biped, or floating
5. Include balanced gameplay statistics
6. Add theme color variations for all 4 themes
7. Include relevant visual features and special features

JSON Template Structure:
```json
{
  "id": "unique_identifier_here",
  "name": "Demon Name Here",
  "emoji": "🔥",
  "description": "Brief description of the demon",
  "health": 3,
  "speed": 1.2,
  "scale": 1.0,
  "colors": {
    "primary": "#color_hex",
    "head": "#color_hex",
    "eyes": "#color_hex",
    "secondary": "#color_hex",
    "accent": "#color_hex"
  },
  "behavior": {
    "detectRange": 75,
    "attackRange": 5,
    "chaseRange": 12,
    "attackDamage": 20,
    "spawnWeight": 50,
    "isRanged": false
  },
  "appearance": {
    "bodyType": "choose_body_type",
    "visualFeatures": {
      "hasWings": false,
      "hasTail": true,
      "hasHorns": true,
      "hasClaws": true,
      "hasSpikes": false,
      "hasArmor": false,
      "specialFeatures": ["feature1", "feature2"]
    }
  },
  "themes": {
    "hell": { "primary": "#red_theme", "head": "#red_theme", "secondary": "#red_theme" },
    "ice": { "primary": "#blue_theme", "head": "#blue_theme", "secondary": "#blue_theme" },
    "toxic": { "primary": "#green_theme", "head": "#green_theme", "secondary": "#green_theme" },
    "industrial": { "primary": "#gray_theme", "head": "#gray_theme", "secondary": "#gray_theme" }
  },
  "metadata": {
    "author": "AI Generated",
    "version": "1.0",
    "createdAt": "2024-01-15",
    "tags": ["relevant", "tags", "here"]
  }
}
```

Generate the complete JSON configuration now. Ensure all hex colors include the # prefix and all required fields are present.
````

## 💡 Few-Shot Examples

### Example 1: Shadow Assassin

**Input**: "Create a stealthy shadow demon that moves quickly and strikes from darkness"

**Output**:

```json
{
  "id": "shadow_assassin",
  "name": "Shadow Assassin",
  "emoji": "🥷",
  "description": "A swift and deadly demon that emerges from the shadows to strike",
  "health": 2,
  "speed": 2.8,
  "scale": 0.9,
  "colors": {
    "primary": "#2c2c2c",
    "head": "#1a1a1a",
    "eyes": "#8a2be2",
    "secondary": "#000000",
    "accent": "#4b0082"
  },
  "behavior": {
    "detectRange": 90,
    "attackRange": 3,
    "chaseRange": 8,
    "attackDamage": 25,
    "spawnWeight": 35,
    "isRanged": false
  },
  "appearance": {
    "bodyType": "humanoid",
    "visualFeatures": {
      "hasWings": false,
      "hasTail": false,
      "hasHorns": false,
      "hasClaws": true,
      "hasSpikes": false,
      "hasArmor": false,
      "specialFeatures": ["shadow_cloak", "stealth_mode", "swift_strike"]
    }
  },
  "themes": {
    "hell": {
      "primary": "#8b0000",
      "head": "#2f1b14",
      "secondary": "#ff4500"
    },
    "ice": {
      "primary": "#2f4f4f",
      "head": "#191970",
      "secondary": "#4682b4"
    },
    "toxic": {
      "primary": "#2f4f2f",
      "head": "#556b2f",
      "secondary": "#228b22"
    },
    "industrial": {
      "primary": "#1c1c1c",
      "head": "#2f2f2f",
      "secondary": "#696969"
    }
  },
  "metadata": {
    "author": "AI Generated",
    "version": "1.0",
    "createdAt": "2024-01-15",
    "tags": ["stealth", "fast", "assassin", "humanoid"]
  }
}
```

### Example 2: Crystal Sentinel

**Input**: "Design a floating crystal guardian that shoots energy beams and has a protective aura"

**Output**:

```json
{
  "id": "crystal_sentinel",
  "name": "Crystal Sentinel",
  "emoji": "💎",
  "description": "A mystical floating guardian composed of living crystal energy",
  "health": 6,
  "speed": 0.8,
  "scale": 1.5,
  "colors": {
    "primary": "#4169e1",
    "head": "#6495ed",
    "eyes": "#00ffff",
    "secondary": "#87ceeb",
    "accent": "#191970"
  },
  "behavior": {
    "detectRange": 100,
    "attackRange": 80,
    "chaseRange": 15,
    "attackDamage": 30,
    "spawnWeight": 20,
    "isRanged": true,
    "fireballSpeed": 20.0,
    "fireballRange": 80.0,
    "attackCooldown": 150
  },
  "appearance": {
    "bodyType": "floating",
    "visualFeatures": {
      "hasWings": false,
      "hasTail": false,
      "hasHorns": false,
      "hasClaws": false,
      "hasSpikes": true,
      "hasArmor": false,
      "specialFeatures": [
        "crystal_shards",
        "energy_core",
        "protective_aura",
        "light_beam"
      ]
    }
  },
  "themes": {
    "hell": {
      "primary": "#8b0000",
      "head": "#ff4500",
      "secondary": "#ff6600"
    },
    "ice": {
      "primary": "#4169e1",
      "head": "#6495ed",
      "secondary": "#87ceeb"
    },
    "toxic": {
      "primary": "#2e8b57",
      "head": "#3cb371",
      "secondary": "#00ff7f"
    },
    "industrial": {
      "primary": "#36454f",
      "head": "#708090",
      "secondary": "#c0c0c0"
    }
  },
  "metadata": {
    "author": "AI Generated",
    "version": "1.0",
    "createdAt": "2024-01-15",
    "tags": ["crystal", "floating", "ranged", "guardian"]
  }
}
```

### Example 3: Thunder Wolf

**Input**: "Create an electric wolf demon that can leap great distances and has lightning attacks"

**Output**:

```json
{
  "id": "thunder_wolf",
  "name": "Thunder Wolf",
  "emoji": "🐺",
  "description": "A fierce lupine demon crackling with electrical energy",
  "health": 4,
  "speed": 2.2,
  "scale": 1.1,
  "colors": {
    "primary": "#483d8b",
    "head": "#6a5acd",
    "eyes": "#ffff00",
    "secondary": "#9370db",
    "accent": "#4b0082"
  },
  "behavior": {
    "detectRange": 85,
    "attackRange": 4,
    "chaseRange": 18,
    "attackDamage": 28,
    "spawnWeight": 30,
    "isRanged": false
  },
  "appearance": {
    "bodyType": "quadruped",
    "visualFeatures": {
      "hasWings": false,
      "hasTail": true,
      "hasHorns": false,
      "hasClaws": true,
      "hasSpikes": false,
      "hasArmor": false,
      "specialFeatures": [
        "lightning_fur",
        "electric_bite",
        "leap_attack",
        "thunder_howl"
      ]
    }
  },
  "themes": {
    "hell": {
      "primary": "#8b0000",
      "head": "#ff4500",
      "secondary": "#ff6600"
    },
    "ice": {
      "primary": "#4682b4",
      "head": "#87ceeb",
      "secondary": "#b0e0e6"
    },
    "toxic": {
      "primary": "#556b2f",
      "head": "#6b8e23",
      "secondary": "#9acd32"
    },
    "industrial": {
      "primary": "#696969",
      "head": "#808080",
      "secondary": "#c0c0c0"
    }
  },
  "metadata": {
    "author": "AI Generated",
    "version": "1.0",
    "createdAt": "2024-01-15",
    "tags": ["electric", "wolf", "quadruped", "fast"]
  }
}
```

## 🔧 Specialized Prompts

### Ranged Demon Prompt

```
Create a JSON demon configuration for a ranged attacker demon that is [DESCRIPTION].

Additional Requirements for Ranged Demons:
- Set "isRanged": true
- Include "fireballSpeed" (10-30 recommended)
- Include "fireballRange" (30-120 recommended)
- Include "attackCooldown" (60-300 frames recommended)
- Set appropriate attack range (should match fireballRange)
- Consider body types that suit ranged combat (floating, dragon, humanoid)

Generate the complete JSON now.
```

### Boss Demon Prompt

```
Create a JSON demon configuration for a powerful boss-level demon that is [DESCRIPTION].

Boss Demon Guidelines:
- Health: 8-15 (very high)
- Scale: 1.5-3.0 (large and imposing)
- Attack Damage: 40-80 (devastating)
- Spawn Weight: 1-10 (very rare)
- Include multiple special features
- Consider ranged capabilities for variety
- Use dramatic colors and visual features

Generate the complete JSON now.
```

### Collection Prompt

````
Create a JSON demon collection containing 3-5 related demons based on the theme: [THEME_DESCRIPTION].

Format as:
```json
{
  "name": "Collection Name",
  "description": "Collection description",
  "demons": [
    { /* demon 1 JSON */ },
    { /* demon 2 JSON */ },
    { /* demon 3 JSON */ }
  ],
  "metadata": {
    "author": "AI Generated",
    "version": "1.0",
    "createdAt": "2024-01-15"
  }
}
````

Ensure all demons in the collection:

- Share thematic elements
- Have unique IDs
- Are balanced as a group
- Represent different difficulty levels

```

## 🎨 Theme Color Guidelines

### Hell Theme Colors
- Primary: Reds, dark oranges, maroons (#8b0000, #ff4500, #800000)
- Secondary: Fire colors, blacks (#ff6600, #2f1b14, #cd5c5c)
- Use warm, aggressive colors

### Ice Theme Colors
- Primary: Blues, cyans, whites (#4682b4, #87ceeb, #191970)
- Secondary: Cool metallics, silvers (#b0e0e6, #708090, #e6e6fa)
- Use cool, crystalline colors

### Toxic Theme Colors
- Primary: Greens, yellow-greens (#228b22, #32cd32, #556b2f)
- Secondary: Sickly yellows, lime (#9acd32, #adff2f, #00ff7f)
- Use unnatural, glowing colors

### Industrial Theme Colors
- Primary: Grays, dark metals (#696969, #2f2f2f, #36454f)
- Secondary: Chrome, steel colors (#808080, #c0c0c0, #708090)
- Use metallic, technological colors

## 📝 Quick Generation Templates

### 1. Single Demon Generation
```

Create a [ADJECTIVE] [CREATURE_TYPE] demon with [SPECIAL_ABILITY] that [BEHAVIOR_DESCRIPTION].
Format as complete JSON demon configuration.

```

### 2. Themed Demon Generation
```

Create a demon inspired by [THEME/MYTHOLOGY] with [VISUAL_DESCRIPTION] and [COMBAT_STYLE].
Format as complete JSON demon configuration.

```

### 3. Boss Demon Generation
```

Create a powerful boss demon that [UNIQUE_MECHANIC] and serves as [ROLE_IN_GAME].
Make it challenging but fair. Format as complete JSON demon configuration.

```

## ✅ Validation Checklist

Before using generated JSON:

- [ ] Valid JSON format (no syntax errors)
- [ ] Unique `id` field (lowercase_underscore)
- [ ] All required fields present
- [ ] Colors in hex format with # prefix
- [ ] Numeric values within recommended ranges
- [ ] Body type is one of the 5 supported types
- [ ] Theme colors defined for all 4 themes
- [ ] Visual features array contains valid strings
- [ ] Ranged configuration complete if `isRanged: true`

## 🎮 Usage Instructions

1. **Generate JSON** using any of the prompts above
2. **Copy the JSON** output from your LLM
3. **Open the game** and access the Demon Manager UI
4. **Navigate to Import tab** and paste the JSON
5. **Validate** the configuration to check for errors
6. **Import** to add the demon to your game
7. **Test** the demon in gameplay

The JSON demon system makes it incredibly easy to create, share, and iterate on custom demon designs without any programming knowledge required!
```
