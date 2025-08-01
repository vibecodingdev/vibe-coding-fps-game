# JSON Demon Examples

This document contains ready-to-use JSON demon configurations that you can copy and paste directly into the game's Demon Manager.

## 🔥 Fire Demons

### Flame Warrior

A humanoid fire demon with balanced stats, perfect for mid-game encounters.

```json
{
  "id": "flame_warrior",
  "name": "Flame Warrior",
  "emoji": "🔥",
  "description": "A fierce warrior wreathed in flames",
  "health": 4,
  "speed": 1.3,
  "scale": 1.1,
  "colors": {
    "primary": "#ff4500",
    "head": "#ff6600",
    "eyes": "#ffff00",
    "secondary": "#ff0000",
    "accent": "#8b0000"
  },
  "behavior": {
    "detectRange": 80,
    "attackRange": 5,
    "chaseRange": 15,
    "attackDamage": 28,
    "spawnWeight": 40,
    "isRanged": false
  },
  "appearance": {
    "bodyType": "humanoid",
    "visualFeatures": {
      "hasWings": false,
      "hasTail": false,
      "hasHorns": true,
      "hasClaws": true,
      "hasSpikes": true,
      "hasArmor": true,
      "specialFeatures": ["fire_aura", "burning_weapon", "flame_trail"]
    }
  },
  "themes": {
    "hell": {
      "primary": "#ff4500",
      "head": "#ff6600",
      "secondary": "#ff0000"
    },
    "ice": {
      "primary": "#ff8c69",
      "head": "#ffa500",
      "secondary": "#ff7f50"
    },
    "toxic": {
      "primary": "#ff6347",
      "head": "#ff4500",
      "secondary": "#dc143c"
    },
    "industrial": {
      "primary": "#b22222",
      "head": "#cd5c5c",
      "secondary": "#8b0000"
    }
  },
  "metadata": {
    "author": "Game Developer",
    "version": "1.0",
    "createdAt": "2024-01-15",
    "tags": ["fire", "warrior", "humanoid", "balanced"]
  }
}
```

### Inferno Dragon

A powerful dragon-type demon with ranged attacks, suitable for boss encounters.

```json
{
  "id": "inferno_dragon",
  "name": "Inferno Dragon",
  "emoji": "🐲",
  "description": "An ancient dragon wreathed in eternal flames",
  "health": 8,
  "speed": 0.9,
  "scale": 2.2,
  "colors": {
    "primary": "#8b0000",
    "head": "#ff4500",
    "eyes": "#ffd700",
    "secondary": "#ff6600",
    "accent": "#000000"
  },
  "behavior": {
    "detectRange": 120,
    "attackRange": 80,
    "chaseRange": 25,
    "attackDamage": 45,
    "spawnWeight": 8,
    "isRanged": true,
    "fireballSpeed": 12.0,
    "fireballRange": 80.0,
    "attackCooldown": 180
  },
  "appearance": {
    "bodyType": "dragon",
    "visualFeatures": {
      "hasWings": true,
      "hasTail": true,
      "hasHorns": true,
      "hasClaws": true,
      "hasSpikes": true,
      "hasArmor": false,
      "specialFeatures": [
        "fire_breath",
        "wing_flames",
        "molten_scales",
        "ancient_runes"
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
      "primary": "#228b22",
      "head": "#32cd32",
      "secondary": "#9acd32"
    },
    "industrial": {
      "primary": "#2f4f4f",
      "head": "#708090",
      "secondary": "#696969"
    }
  },
  "metadata": {
    "author": "Game Developer",
    "version": "1.0",
    "createdAt": "2024-01-15",
    "tags": ["fire", "dragon", "boss", "ranged"]
  }
}
```

## ❄️ Ice Demons

### Frost Stalker

A fast ice demon that excels at hit-and-run tactics.

```json
{
  "id": "frost_stalker",
  "name": "Frost Stalker",
  "emoji": "🧊",
  "description": "A swift predator from the frozen wastes",
  "health": 3,
  "speed": 2.1,
  "scale": 0.9,
  "colors": {
    "primary": "#4682b4",
    "head": "#87ceeb",
    "eyes": "#00ffff",
    "secondary": "#b0e0e6",
    "accent": "#191970"
  },
  "behavior": {
    "detectRange": 90,
    "attackRange": 4,
    "chaseRange": 20,
    "attackDamage": 22,
    "spawnWeight": 45,
    "isRanged": false
  },
  "appearance": {
    "bodyType": "humanoid",
    "visualFeatures": {
      "hasWings": false,
      "hasTail": true,
      "hasHorns": true,
      "hasClaws": true,
      "hasSpikes": true,
      "hasArmor": false,
      "specialFeatures": ["ice_trail", "frost_breath", "crystal_claws"]
    }
  },
  "themes": {
    "hell": {
      "primary": "#ff6347",
      "head": "#ff4500",
      "secondary": "#dc143c"
    },
    "ice": {
      "primary": "#4682b4",
      "head": "#87ceeb",
      "secondary": "#b0e0e6"
    },
    "toxic": {
      "primary": "#20b2aa",
      "head": "#48d1cc",
      "secondary": "#40e0d0"
    },
    "industrial": {
      "primary": "#708090",
      "head": "#c0c0c0",
      "secondary": "#dcdcdc"
    }
  },
  "metadata": {
    "author": "Game Developer",
    "version": "1.0",
    "createdAt": "2024-01-15",
    "tags": ["ice", "fast", "stalker", "humanoid"]
  }
}
```

## ⚡ Electric Demons

### Thunder Beast

A quadruped demon with electrical attacks and high mobility.

```json
{
  "id": "thunder_beast",
  "name": "Thunder Beast",
  "emoji": "⚡",
  "description": "A lupine creature crackling with electrical energy",
  "health": 5,
  "speed": 1.8,
  "scale": 1.3,
  "colors": {
    "primary": "#483d8b",
    "head": "#6a5acd",
    "eyes": "#ffff00",
    "secondary": "#9370db",
    "accent": "#4b0082"
  },
  "behavior": {
    "detectRange": 85,
    "attackRange": 6,
    "chaseRange": 18,
    "attackDamage": 30,
    "spawnWeight": 25,
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
        "thunder_howl",
        "spark_trail"
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
    "author": "Game Developer",
    "version": "1.0",
    "createdAt": "2024-01-15",
    "tags": ["electric", "beast", "quadruped", "mobile"]
  }
}
```

## 👻 Shadow Demons

### Void Phantom

A floating shadow demon with stealth capabilities.

```json
{
  "id": "void_phantom",
  "name": "Void Phantom",
  "emoji": "👻",
  "description": "A wraith-like entity that emerges from the void",
  "health": 2,
  "speed": 1.6,
  "scale": 1.2,
  "colors": {
    "primary": "#2f2f2f",
    "head": "#1a1a1a",
    "eyes": "#8a2be2",
    "secondary": "#000000",
    "accent": "#4b0082"
  },
  "behavior": {
    "detectRange": 95,
    "attackRange": 8,
    "chaseRange": 12,
    "attackDamage": 18,
    "spawnWeight": 55,
    "isRanged": false
  },
  "appearance": {
    "bodyType": "floating",
    "visualFeatures": {
      "hasWings": false,
      "hasTail": false,
      "hasHorns": false,
      "hasClaws": true,
      "hasSpikes": false,
      "hasArmor": false,
      "specialFeatures": [
        "shadow_cloak",
        "void_teleport",
        "dark_mist",
        "phase_shift"
      ]
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
    "author": "Game Developer",
    "version": "1.0",
    "createdAt": "2024-01-15",
    "tags": ["shadow", "phantom", "floating", "stealth"]
  }
}
```

## 🤖 Mechanical Demons

### War Machine

A heavily armored mechanical demon designed for the industrial theme.

```json
{
  "id": "war_machine",
  "name": "War Machine",
  "emoji": "🤖",
  "description": "A battle-hardened mechanical construct",
  "health": 6,
  "speed": 0.8,
  "scale": 1.8,
  "colors": {
    "primary": "#696969",
    "head": "#808080",
    "eyes": "#00ffff",
    "secondary": "#c0c0c0",
    "accent": "#2f2f2f"
  },
  "behavior": {
    "detectRange": 100,
    "attackRange": 60,
    "chaseRange": 15,
    "attackDamage": 35,
    "spawnWeight": 20,
    "isRanged": true,
    "fireballSpeed": 18.0,
    "fireballRange": 60.0,
    "attackCooldown": 150
  },
  "appearance": {
    "bodyType": "humanoid",
    "visualFeatures": {
      "hasWings": false,
      "hasTail": false,
      "hasHorns": false,
      "hasClaws": false,
      "hasSpikes": false,
      "hasArmor": true,
      "specialFeatures": [
        "plasma_cannon",
        "energy_shield",
        "jetpack",
        "targeting_laser"
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
    "author": "Game Developer",
    "version": "1.0",
    "createdAt": "2024-01-15",
    "tags": ["mechanical", "armor", "ranged", "industrial"]
  }
}
```

## 🦄 Mythical Demons

### Crystal Unicorn

A unique small biped demon with defensive capabilities.

```json
{
  "id": "crystal_unicorn",
  "name": "Crystal Unicorn",
  "emoji": "🦄",
  "description": "A corrupted unicorn transformed by dark magic",
  "health": 4,
  "speed": 1.5,
  "scale": 1.0,
  "colors": {
    "primary": "#da70d6",
    "head": "#dda0dd",
    "eyes": "#ff1493",
    "secondary": "#e6e6fa",
    "accent": "#8b008b"
  },
  "behavior": {
    "detectRange": 75,
    "attackRange": 5,
    "chaseRange": 14,
    "attackDamage": 24,
    "spawnWeight": 30,
    "isRanged": false
  },
  "appearance": {
    "bodyType": "small_biped",
    "visualFeatures": {
      "hasWings": false,
      "hasTail": true,
      "hasHorns": true,
      "hasClaws": false,
      "hasSpikes": false,
      "hasArmor": false,
      "specialFeatures": [
        "crystal_horn",
        "magic_shield",
        "healing_aura",
        "rainbow_trail"
      ]
    }
  },
  "themes": {
    "hell": {
      "primary": "#8b008b",
      "head": "#9932cc",
      "secondary": "#ba55d3"
    },
    "ice": {
      "primary": "#b0c4de",
      "head": "#e6e6fa",
      "secondary": "#f0f8ff"
    },
    "toxic": {
      "primary": "#9acd32",
      "head": "#adff2f",
      "secondary": "#98fb98"
    },
    "industrial": {
      "primary": "#c0c0c0",
      "head": "#dcdcdc",
      "secondary": "#f5f5f5"
    }
  },
  "metadata": {
    "author": "Game Developer",
    "version": "1.0",
    "createdAt": "2024-01-15",
    "tags": ["mythical", "unicorn", "magic", "defensive"]
  }
}
```

## 📦 Collection Example

Here's an example of a demon collection containing multiple related demons:

```json
{
  "name": "Elemental Guardians",
  "description": "A collection of powerful elemental guardians representing different forces of nature",
  "demons": [
    {
      "id": "fire_guardian",
      "name": "Fire Guardian",
      "emoji": "🔥",
      "description": "Guardian of the flame realm",
      "health": 7,
      "speed": 1.0,
      "scale": 1.6,
      "colors": {
        "primary": "#ff4500",
        "head": "#ff6600",
        "eyes": "#ffff00",
        "secondary": "#ff0000",
        "accent": "#8b0000"
      },
      "behavior": {
        "detectRange": 100,
        "attackRange": 70,
        "chaseRange": 20,
        "attackDamage": 40,
        "spawnWeight": 15,
        "isRanged": true,
        "fireballSpeed": 14.0,
        "fireballRange": 70.0,
        "attackCooldown": 200
      },
      "appearance": {
        "bodyType": "humanoid",
        "visualFeatures": {
          "hasWings": false,
          "hasTail": false,
          "hasHorns": true,
          "hasClaws": true,
          "hasSpikes": true,
          "hasArmor": true,
          "specialFeatures": ["fire_aura", "flame_weapon", "lava_ground"]
        }
      }
    },
    {
      "id": "ice_guardian",
      "name": "Ice Guardian",
      "emoji": "❄️",
      "description": "Guardian of the frozen realm",
      "health": 7,
      "speed": 0.8,
      "scale": 1.6,
      "colors": {
        "primary": "#4682b4",
        "head": "#87ceeb",
        "eyes": "#00ffff",
        "secondary": "#b0e0e6",
        "accent": "#191970"
      },
      "behavior": {
        "detectRange": 100,
        "attackRange": 70,
        "chaseRange": 20,
        "attackDamage": 38,
        "spawnWeight": 15,
        "isRanged": true,
        "fireballSpeed": 16.0,
        "fireballRange": 70.0,
        "attackCooldown": 180
      },
      "appearance": {
        "bodyType": "humanoid",
        "visualFeatures": {
          "hasWings": false,
          "hasTail": false,
          "hasHorns": true,
          "hasClaws": true,
          "hasSpikes": true,
          "hasArmor": true,
          "specialFeatures": ["ice_aura", "frost_weapon", "frozen_ground"]
        }
      }
    }
  ],
  "metadata": {
    "author": "Game Developer",
    "version": "1.0",
    "createdAt": "2024-01-15"
  }
}
```

## 🎯 Usage Instructions

### Supported Import Formats

The import system supports **three different JSON formats**:

1. **Single Demon** - Direct demon configuration (most examples above)
2. **Demon Collection** - Multiple demons grouped together
3. **Full Data Structure** - Complete export data with collections and individual demons

### How to Import

1. **Copy any demon JSON** from the examples above
2. **Open the game** and press ESC to enter pause menu
3. **Click "📝 Manage Custom Demons"**
4. **Go to "📥 Import" tab**
5. **Paste the JSON** into the text area
6. **Click "Validate"** to check the configuration
7. **Click "Import"** to add the demon to your game
8. **Resume the game** and the new demons will appear in waves!

### Import Examples

**Single Demon Format** (copy any demon above):

```json
{
  "id": "flame_warrior",
  "name": "Flame Warrior",
  "emoji": "🔥"
  // ... rest of demon config
}
```

**Collection Format** (copy the collection example above):

```json
{
  "name": "Elemental Guardians",
  "description": "A collection of powerful elemental guardians",
  "demons": [
    // ... array of demon configs
  ],
  "metadata": {
    // ... collection metadata
  }
}
```

**Full Data Structure Format**:

```json
{
  "individualDemons": {
    "flame_warrior": {
      /* demon config */
    },
    "ice_guardian": {
      /* demon config */
    }
  },
  "collections": {
    "elementals": {
      /* collection config */
    }
  },
  "settings": {
    "autoLoad": true,
    "maxDemons": 50
  }
}
```

All examples are balanced for different gameplay scenarios and include full theme support for all game environments.
