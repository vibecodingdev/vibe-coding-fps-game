# JSON Demon System Integration Guide

This document details how to use the JSON demon configuration system in the game, including natural language generation, UI management, and localStorage persistence.

## 🎯 System Overview

The JSON Demon System provides a complete solution that allows users to:

1. **Natural Language Generation**: Use any LLM to generate demon configurations
2. **UI Management**: Create, edit and manage demons through built-in interface
3. **Dynamic Loading**: Automatically load custom demons from localStorage
4. **Instant Effect**: Newly added demons are immediately available in-game
5. **Import/Export**: Share and backup demon configurations

## 📋 Complete Usage Workflow

### Method 1: Natural Language Generation (Recommended)

1. **Open LLM Tool** (ChatGPT, Claude, Gemini, etc.)

2. **Use Generation Prompts** (from `JSON_DEMON_GENERATION_PROMPTS.md`):

   ```
   Generate a complete JSON demon configuration for a DOOM-style FPS game. Create a demon that is a fierce fire dragon with wing attacks and flame breath.

   Requirements:
   1. Output ONLY valid JSON format
   2. Use the exact structure provided in the template
   3. All colors must be hex strings with # prefix
   4. Choose appropriate body type: humanoid, quadruped, dragon, small_biped, or floating
   5. Include balanced gameplay statistics
   6. Add theme color variations for all 4 themes
   7. Include relevant visual features and special features

   Generate the complete JSON configuration now.
   ```

3. **Copy Generated JSON Configuration**

4. **Import in Game**:
   - Press ESC to enter pause menu
   - Click "📝 Manage Custom Demons"
   - Switch to "📥 Import" tab
   - Paste JSON configuration (supports single demon, demon collection, or complete data structure)
   - Click "Validate" to check format
   - Click "Import" to add to game

### Method 2: UI Creation

1. **Open Demon Manager**:

   - **In-Game**: Press ESC to enter pause menu → Click "📝 Manage Custom Demons"
   - **Main Menu**: Click "📖 COMBAT MANUAL" → Click "📝 CUSTOM DEMONS" tab

2. **Create New Demon**:

   - In "👹 Individual" tab
   - Click "+ Add New" button
   - Fill all required fields:
     - ID (unique identifier)
     - Name (display name)
     - Emoji (for UI display)
     - Health, speed, size and other numerical values
     - Color configuration
     - Behavior parameters
     - Appearance type and features

3. **Save Configuration**:
   - Click "Save Demon"
   - System will validate configuration
   - Demon immediately available after success

### Method 3: Import Demon Collections

1. **Obtain demon collection** (JSON format)
2. **Paste collection JSON in Import tab**
3. **Validate and import entire collection**

## 📥 Supported Import Formats

The import system supports three different JSON formats:

### Format 1: Single Demon Configuration

Directly paste any single demon's JSON configuration:

```json
{
  "id": "flame_warrior",
  "name": "Flame Warrior",
  "emoji": "🔥",
  "health": 4,
  "speed": 1.3
  // ... other demon attributes
}
```

### Format 2: Demon Collection

Collection containing multiple demons:

```json
{
  "name": "Elemental Pack",
  "description": "Fire and ice demons",
  "demons": [
    {
      /* demon 1 config */
    },
    {
      /* demon 2 config */
    }
  ],
  "metadata": {
    "author": "Player Name",
    "version": "1.0"
  }
}
```

### Format 3: Complete Data Structure

Complete data generated from export function:

```json
{
  "individualDemons": {
    "demon_id": {
      /* demon config */
    }
  },
  "collections": {
    "collection_name": {
      /* collection config */
    }
  },
  "settings": {
    "autoLoad": true,
    "maxDemons": 50
  }
}
```

## 📝 Combat Manual Integration

In the main menu's combat manual, there is now a dedicated "📝 CUSTOM DEMONS" tab that allows you to configure and manage custom demons before entering the game.

### Usage Method

1. **Enter from main menu**: Click "📖 COMBAT MANUAL"
2. **Select Custom Demons tab**: Click "📝 CUSTOM DEMONS"
3. **Manage demons**: Can import, create, edit and delete custom demons
4. **Start game**: Configured demons will automatically take effect in game

### Advantages

- **Pre-configuration**: Prepare desired demons before starting the game
- **Non-disruptive management**: No need to pause during gameplay to manage demons
- **Complete functionality**: Identical features to in-game demon manager
- **Instant preview**: Can view all demon information and statistics

## 🎮 In-Game Usage

### Auto-loading

- All demons in localStorage will be automatically loaded when the game starts
- Appear randomly in wave generation according to configured spawn weight
- Identical behavior and rendering as built-in demons

### Management Interface Features

#### Individual Tab

- View all individual demons
- **👁️ Preview Demons**: Click Preview button to see detailed stats, colors, and theme variants
- Edit existing demons
- Delete unwanted demons
- View demon statistics

#### Collections Tab

- Manage demon collections
- View collection details
- Delete entire collections

#### Import Tab

- Validate JSON format
- Import individual demons or collections
- Display validation errors and warnings

#### Export Tab

- Export all data as JSON
- Copy to clipboard
- Backup or share configurations

## 👁️ Demon Preview Feature

The Demon Manager now includes a comprehensive preview system for each demon card:

### Preview Modal Contents

#### 🎮 3D Model Viewer

- **Interactive 3D Model**: Real-time rendered demon using Three.js
- **Mouse Controls**: Click and drag to rotate the model
- **Auto Rotation**: Toggle automatic rotation with 🔄 button
- **Camera Reset**: Reset view to default position with 📷 button
- **Visual Features**: See wings, horns, claws, and other features in 3D
- **Accurate Colors**: Model reflects actual configured colors

#### 📊 Detailed Statistics

- **Base Stats**: Health, Speed, Scale
- **Combat Stats**: Attack Damage, Attack Range, Detect Range, Chase Range
- **Spawn Info**: Spawn Weight, Attack Type (Melee/Ranged)

#### 👁️ Visual Information

- **Body Type**: humanoid, quadruped, dragon, small_biped, floating
- **Visual Features**: Wings, Tail, Horns, Claws, Spikes, Armor tags
- **Special Features**: Custom feature tags (fire_breath, lightning_bolt, etc.)

#### 🎨 Color Swatches

- **Primary Colors**: Primary, Head, Eyes (always shown)
- **Optional Colors**: Secondary, Accent (shown if configured)
- **Live Color Preview**: Actual hex color swatches

#### 🎪 Theme Variants

- **All Themes**: Hell, Ice, Toxic, Industrial
- **Color Variations**: Shows how demon colors adapt to each theme
- **Theme-Specific Swatches**: Visual representation of theme adaptations

### Usage

1. In Individual tab, click **👁️ Preview** on any demon card
2. **3D Model Interaction**:
   - Click and drag to rotate the 3D model
   - Use 🔄 button to toggle auto-rotation
   - Use 📷 button to reset camera view
3. View comprehensive demon information in information panel
4. Use **Edit Demon** button to jump directly to editing
5. Close with X button, Close button, or click outside modal

## 🔧 Advanced Configuration

### Theme Support

JSON demons support color variants for 4 themes:

- **Hell**: Red, flame tones
- **Ice**: Blue, crystal tones
- **Toxic**: Green, poison tones
- **Industrial**: Gray, metal tones

### Ranged Attack Configuration

For ranged demons, need to set:

```json
{
  "isRanged": true,
  "fireballSpeed": 15.0,
  "fireballRange": 50.0,
  "attackCooldown": 120
}
```

### Body Type Explanation

- **humanoid**: Human-like, two legs and two arms upright
- **quadruped**: Four-legged animal, horizontal body
- **dragon**: Dragon-like, with wings and a tail
- **small_biped**: Small human-like, compact body
- **floating**: Floating, no legs

### Visual Feature Combinations

```json
{
  "visualFeatures": {
    "hasWings": true,
    "hasTail": true,
    "hasClaws": true,
    "hasSpikes": false,
    "hasArmor": true,
    "specialFeatures": ["fire_breath", "lightning_bolt", "crystal_armor"]
  }
}
```

## 📦 Performance and Limitations

### Default Limitations

- Maximum demons loaded: 50
- Auto-load: Enabled by default
- Can be adjusted in settings

### Performance Considerations

- JSON demons have the same performance as built-in demons
- Complex specialFeatures may affect rendering
- It is recommended to reasonably control the number of demons in a single game session

## 🛠️ Troubleshooting

### Common Issues

#### JSON Format Error

**Symptom**: "Invalid JSON format" displayed during import
**Solution**:

- Check JSON syntax (missing commas, brackets, etc.)
- Ensure all strings use double quotes
- Use a JSON validation tool to check format

#### Color Format Error

**Symptom**: Color-related errors displayed during import
**Solution**:

- Ensure all colors start with #
- Use 6-digit hexadecimal format (#ff0000)
- Check if color values are valid

#### Demon Not Appearing

**Symptom**: Demon not visible in the game after successful import
**Solution**:

- Check if auto-load setting is enabled
- Confirm spawnWeight is not 0
- Check the console for loading errors

#### Performance Issues

**Symptom**: Game lag or frame rate drop
**Solution**:

- Reduce the maximum number of demons
- Simplify complex special effects
- Check if there are too many high-poly demons

### Debug Information

The game console will display:

- JSON demon loading status
- Validation error details
- Memory usage
- Performance warnings

## 🎨 Best Practices

### Design Principles

1. **Balance**: Ensure numerical values are balanced, avoiding overpowered or underpowered demons
2. **Theme Consistency**: Colors and features should conform to the game theme
3. **Performance Optimization**: Avoid overly complex feature combinations
4. **Recognizability**: Ensure demons are visually recognizable

### Naming Conventions

- ID uses lowercase_underscore format
- Name uses user-friendly display name
- Description provides a concise description of the demon's features

### Numerical Recommendations

- Health: 1-5 (normal), 6-10 (strong), 11+ (boss)
- Speed: 0.5-1.5 (normal), 1.6-2.5 (fast), 2.6+ (extremely fast)
- AttackDamage: 10-25 (normal), 26-40 (strong), 41+ (boss)
- SpawnWeight: 50-100 (common), 20-49 (rare), 1-19 (unique)

## 🔄 Sharing and Backup

### Exporting Data

1. In the Export tab, click "Export All"
2. Copy the generated JSON to a file
3. Save as a .json file for backup

### Sharing Demons

1. Export the JSON of a specific demon or collection
2. Share the JSON file or text
3. Other players can directly import and use

### Version Control

JSON configuration supports version information:

```json
{
  "metadata": {
    "author": "Player Name",
    "version": "1.2",
    "createdAt": "2024-01-15",
    "tags": ["fire", "boss", "dragon"]
  }
}
```

## 🚀 Future Expansion

This system lays the foundation for future features:

- Community demon marketplace
- Online sharing platform
- Advanced editor
- Animation customization
- Sound effect configuration

Through the JSON Demon System, players can easily expand game content, creating unique gaming experiences while maintaining code cleanliness and maintainability.
