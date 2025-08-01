# Demon Integration Quick Guide

This guide provides a streamlined process for quickly integrating LLM-generated demon code into the game. Follow these steps to add new demons in minutes.

## 🚀 Quick Integration Steps

### Step 1: Generate Demon Code

Use the `DEMON_CODE_GENERATION_PROMPTS.md` with any LLM to generate your demon configuration.

### Step 2: Add Demon Type

Open `client-ts/src/types/demons.ts` and add your demon to the `DemonType` union:

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
  | "YOUR_NEW_DEMON"; // ← Add here
```

### Step 3: Add Demon Configuration

Open `client-ts/src/config/demons.ts` and add your demon configuration:

1. **Add to main DEMON_CONFIGS** (around line 209):

```typescript
// Add before the closing brace of DEMON_CONFIGS
YOUR_NEW_DEMON: {
  // Paste your generated configuration here
},
```

2. **Add to all theme configurations** (lines 216-436):

```typescript
// Add to hell theme (around line 270)
YOUR_NEW_DEMON: {
  ...DEMON_CONFIGS.YOUR_NEW_DEMON,
  color: 0x8b0000, // Hell colors
  headColor: 0xff4500,
  // ... other theme-specific colors
},

// Repeat for ice, toxic, and industrial themes
```

3. **Add to wave generation function** (around line 460):

```typescript
// In getDemonTypesForWave function, add cases:
case "YOUR_NEW_DEMON":
  return wave >= 8 ? 25 : wave >= 5 ? 15 : 5; // Adjust spawn weights
```

### Step 4: Update DemonSystem

Open `client-ts/src/systems/DemonSystem.ts` and add to `demonTypeCounts` (around line 35):

```typescript
public demonTypeCounts = {
  IMP: 0,
  DEMON: 0,
  CACODEMON: 0,
  BARON: 0,
  ARCHVILE: 0,
  CHARIZARD: 0,
  PIKACHU: 0,
  SQUIRTLE: 0,
  EEVEE: 0,
  YOUR_NEW_DEMON: 0, // ← Add here
} as Record<DemonType, number>;
```

Also update the reset method (around line 2125):

```typescript
this.demonTypeCounts = {
  IMP: 0,
  DEMON: 0,
  CACODEMON: 0,
  BARON: 0,
  ARCHVILE: 0,
  CHARIZARD: 0,
  PIKACHU: 0,
  SQUIRTLE: 0,
  EEVEE: 0,
  YOUR_NEW_DEMON: 0, // ← Add here
};
```

### Step 5: Test Your Demon

1. Start the development server: `npm run dev`
2. Open the game and start a wave
3. Verify your demon spawns correctly
4. Test in different themes to see color variations

## 📁 File Locations Reference

```
client-ts/
├── src/
│   ├── types/
│   │   └── demons.ts           # Add DemonType here
│   ├── config/
│   │   └── demons.ts           # Add configuration here
│   └── systems/
│       └── DemonSystem.ts      # Add to demonTypeCounts
└── docs/
    ├── DEMON_CODE_GENERATION_PROMPTS.md
    └── DEMON_INTEGRATION_QUICK_GUIDE.md
```

## 🎯 Integration Checklist

- [ ] DemonType added to union type
- [ ] Main demon configuration added to DEMON_CONFIGS
- [ ] Theme variations added to all 4 themes (hell, ice, toxic, industrial)
- [ ] Wave generation weights configured
- [ ] DemonTypeCounts updated in two locations
- [ ] Game tested with new demon spawning
- [ ] Theme color variations verified

## 🔧 Common Integration Issues

### Issue: Demon not spawning

**Solution**: Check that the demon is added to:

- `DemonType` union
- `demonTypeCounts` object (in two places)
- Wave generation function with appropriate weights

### Issue: TypeScript errors

**Solution**: Ensure:

- Demon name matches exactly across all files
- All required properties are included in configuration
- Proper TypeScript syntax is used

### Issue: Visual problems

**Solution**: Verify:

- Body type is correctly specified
- Visual features are properly configured
- Theme color variations are defined

### Issue: Theme colors not working

**Solution**: Check that theme variations are added to all 4 theme objects in THEME_DEMON_CONFIGS

## 💡 Pro Integration Tips

1. **Start Simple**: Begin with basic demon configurations before adding complex features
2. **Test Incrementally**: Test after each major addition to catch issues early
3. **Copy Patterns**: Use existing demons as templates for similar types
4. **Balance First**: Ensure gameplay balance before fine-tuning visuals
5. **Theme Consistency**: Make sure theme colors fit the overall aesthetic

## 🎨 Visual Feature Examples

### Humanoid Demons

- Good for: Warriors, soldiers, classic demons
- Features: Arms, legs, weapons, armor
- Examples: IMP, DEMON, BARON, ARCHVILE

### Quadruped Demons

- Good for: Beast-like creatures, animals
- Features: Four legs, tails, natural movement
- Examples: EEVEE

### Dragon Demons

- Good for: Powerful flying enemies, bosses
- Features: Wings, breath attacks, imposing presence
- Examples: CHARIZARD

### Small Biped Demons

- Good for: Fast, agile enemies, swarm units
- Features: Compact size, quick movement, special abilities
- Examples: PIKACHU, SQUIRTLE

### Floating Demons

- Good for: Magical enemies, unique movement patterns
- Features: No legs, hovering, tentacles/appendages
- Examples: CACODEMON

## 🚀 Advanced Customization

For demons requiring unique features beyond the standard body types, you can:

1. **Add Custom Features**: Use the `specialFeatures` array to define unique characteristics
2. **Custom Animation Hints**: Include feature names that suggest specific animations
3. **Ranged Capabilities**: Configure `isRanged`, `fireballSpeed`, and `fireballRange`
4. **Special Behaviors**: The system automatically handles different body types

## 📊 Spawn Weight Guidelines

- **5-15**: Rare, powerful demons (bosses, mini-bosses)
- **20-40**: Uncommon, moderate strength demons
- **50-70**: Common, balanced demons
- **80-100**: Very common, weaker demons (fodder)

## 🎮 Testing Your Integration

1. **Single Spawn Test**: Spawn one demon to check basic functionality
2. **Wave Test**: Let natural wave spawning include your demon
3. **Theme Test**: Switch themes to verify color variations
4. **Animation Test**: Observe idle, walking, and attack animations
5. **Combat Test**: Verify damage values and attack patterns

With this streamlined process, you can integrate new demons into the game in under 5 minutes! 🎯
