# Adding New Demons to the Enhanced System

The demon system has been enhanced with a modular architecture that makes adding new demons much easier. Here's how to add new demons in just a few steps:

## 🔧 Enhanced Features

- **Modular Body Types**: `humanoid`, `quadruped`, `dragon`, `small_biped`, `floating`
- **Visual Features System**: Wings, tails, claws, special features
- **Theme Support**: Automatic color variations for Hell, Ice, Toxic, Industrial themes
- **Easy Configuration**: JSON-like data structure for demon properties

## 📝 Step-by-Step Guide

### 1. Define the Demon Type

Add your new demon type to the `DemonType` union in `client-ts/src/types/demons.ts`:

```typescript
export type DemonType =
  | "IMP"
  | "DEMON"
  | "CACODEMON"
  | "BARON"
  | "ARCHVILE"
  | "CHARIZARD"
  | "PIKACHU"
  | "SQUIRTLE"
  | "EEVEE"
  | "YOUR_NEW_DEMON"; // Add here
```

### 2. Configure Demon Properties

Add your demon configuration to `client-ts/src/config/demons.ts`:

```typescript
YOUR_NEW_DEMON: {
  name: "Your Demon Name",
  emoji: "🔥", // Choose an appropriate emoji
  health: 5,
  speed: 1.5,
  scale: 1.2,
  color: 0xff0000, // Primary color (hex)
  headColor: 0xffff00, // Head color
  eyeColor: 0x00ff00, // Eye glow color
  secondaryColor: 0x0000ff, // Optional: accent colors
  accentColor: 0x8b4513, // Optional: detail colors
  detectRange: 80,
  attackRange: 6.0,
  chaseRange: 12,
  attackDamage: 25,
  spawnWeight: 40, // Higher = more common in waves
  isRanged: false, // Set to true for ranged attackers
  bodyType: "humanoid", // Choose: humanoid, quadruped, dragon, small_biped, floating
  visualFeatures: {
    hasWings: false,
    hasTail: true,
    hasClaws: true,
    hasSpikes: false,
    hasArmor: false,
    specialFeatures: ["custom_feature_1", "custom_feature_2"], // Optional
  },
},
```

### 3. Add Theme Variations

Add theme-specific color variations for each theme in the `THEME_DEMON_CONFIGS`:

```typescript
// In each theme section (hell, ice, toxic, industrial)
YOUR_NEW_DEMON: {
  ...DEMON_CONFIGS.YOUR_NEW_DEMON,
  color: 0x8b0000, // Theme-specific color
  headColor: 0xff0000,
  secondaryColor: 0xff4500,
},
```

### 4. Update Wave Generation

Add your demon to the wave generation weights in `getDemonTypesForWave()`:

```typescript
case "YOUR_NEW_DEMON":
  return wave >= 8 ? 30 : wave >= 5 ? 20 : 10; // Adjust spawn weights
```

### 5. Add to Demon Counts

Update the `demonTypeCounts` initializations in `DemonSystem.ts`:

```typescript
public demonTypeCounts = {
  // ... existing demons
  YOUR_NEW_DEMON: 0,
} as Record<DemonType, number>;
```

### 6. Custom Features (Optional)

If your demon needs unique features not covered by the modular system, add custom logic in the appropriate body type method or create a new method:

```typescript
// In DemonSystem.ts
private addYourDemonFeatures(demonGroup: THREE.Group, typeData: any): void {
  // Add custom geometries, materials, animations, etc.
  if (typeData.visualFeatures?.specialFeatures?.includes("your_special_feature")) {
    // Custom feature implementation
  }
}
```

## 🎨 Body Type Examples

### Humanoid (Default)

- Two legs, two arms, upright posture
- Examples: IMP, DEMON, BARON, ARCHVILE
- Features: Arms, legs, weapons, armor

### Quadruped

- Four legs, horizontal body orientation
- Examples: EEVEE
- Features: Four legs, tail, ears, collar

### Dragon

- Wings, tail, can be bipedal or quadrupedal
- Examples: CHARIZARD
- Features: Wings, tail, claws, fire effects

### Small Biped

- Smaller humanoid, compact proportions
- Examples: PIKACHU, SQUIRTLE
- Features: Small arms/legs, special abilities

### Floating

- No legs, hovers in air
- Examples: CACODEMON
- Features: Tentacles, spikes, floating appendages

## 🌈 Visual Features System

The visual features system allows for modular construction:

```typescript
visualFeatures: {
  hasWings: true,        // Adds wing geometry
  hasTail: true,         // Adds tail (varies by body type)
  hasClaws: true,        // Adds claw details to arms
  hasSpikes: true,       // Adds spike decorations
  hasArmor: true,        // Adds armor plating
  specialFeatures: [     // Custom features array
    "fire_breath",       // Custom fire effects
    "lightning_bolt",    // Custom lightning
    "water_cannon",      // Custom water effects
    "your_custom_feature" // Your own features
  ]
}
```

## 🎯 Example: Adding a "DRAGON" Demon

Here's a complete example of adding a new dragon-type demon:

1. **Add to types**: `"DRAGON"` in DemonType union
2. **Configure properties**:

```typescript
DRAGON: {
  name: "Ancient Dragon",
  emoji: "🐉",
  health: 10,
  speed: 0.7,
  scale: 2.5,
  color: 0x8b0000,
  headColor: 0xff4500,
  eyeColor: 0xffd700,
  secondaryColor: 0x228b22,
  accentColor: 0x000000,
  detectRange: 120,
  attackRange: 15.0,
  chaseRange: 25,
  attackDamage: 40,
  spawnWeight: 10,
  isRanged: true,
  fireballSpeed: 12.0,
  fireballRange: 40.0,
  bodyType: "dragon",
  visualFeatures: {
    hasWings: true,
    hasTail: true,
    hasClaws: true,
    hasSpikes: true,
    specialFeatures: ["fire_breath", "ancient_runes"]
  },
},
```

3. **Add theme variants** for all four themes
4. **Update wave generation** with appropriate spawn weights
5. **Test** using the test file: `client-ts/public/tests/new-demons-test.html`

## 🧪 Testing Your New Demon

1. Open `client-ts/public/tests/new-demons-test.html`
2. Add a button for your new demon type
3. Test spawning and visual appearance
4. Verify theme variations work correctly
5. Test in actual gameplay waves

## 💡 Best Practices

1. **Balanced Stats**: Ensure health, speed, and damage are balanced
2. **Appropriate Spawn Weights**: Stronger demons should be rarer
3. **Theme Consistency**: Color variations should fit theme aesthetics
4. **Visual Clarity**: Demons should be visually distinct and recognizable
5. **Performance**: Avoid overly complex geometry for common demons

## 🐛 Troubleshooting

- **Demon not spawning**: Check if it's added to all required arrays and objects
- **Visual issues**: Verify body type is correct and features are properly defined
- **Theme colors wrong**: Ensure all themes have color definitions
- **Wave issues**: Check spawn weights and wave generation logic

This enhanced system makes adding new demons as simple as filling out a configuration object! 🎮
