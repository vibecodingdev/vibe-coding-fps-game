# Doom Map Theme Implementation

## Overview

The **DoomMapTheme** is a custom 3D environment that recreates the classic Doom E1M1 map from its original 2D schematic. This theme transforms the iconic 2D level design into a fully navigable 3D space with authentic Doom-style aesthetics, sector-based lighting, and interconnected rooms and hallways.

## Features

### 🏛️ **3D Map Recreation**
- **Faithful Conversion**: Transforms the 2D schematic into a fully realized 3D environment
- **Room-Based Architecture**: Multiple interconnected rooms with distinct purposes
- **Hallway System**: Connecting corridors that mirror the original map layout
- **Elevation Changes**: Different floor heights for visual interest and gameplay variety

### 🎨 **Visual Design**
- **Classic Doom Aesthetics**: Dark concrete textures and industrial styling
- **Sector-Based Lighting**: Each room has unique colored lighting like classic Doom
- **Atmospheric Fog**: Creates depth and classic Doom ambiance
- **Room-Specific Themes**: Different visual treatments for different room types

### 🚪 **Room Types**

#### **Starting Area**
- **Purpose**: Player spawn point
- **Features**: Blue sector lighting, spawn indicator
- **Connections**: Leads to courtyard and main hallways
- **Size**: 12x8 units with standard height

#### **Main Courtyard**
- **Purpose**: Central hub area
- **Features**: Multiple connections, neutral gray lighting
- **Connections**: Links to start, north corridor, west wing, and secret areas
- **Size**: 20x15 units, largest standard room

#### **Boss Chamber**
- **Purpose**: Epic boss encounters
- **Features**: 
  - Elevated platform (2 units higher than other rooms)
  - Four decorative pillars arranged in corners
  - Dramatic red lighting
  - Increased ceiling height (12 units vs 8)
- **Size**: 16x16 units with elevated design

#### **Secret Areas**
- **Purpose**: Hidden rooms with rewards
- **Features**:
  - Slightly lowered floor (-1 unit)
  - Green treasure indicator with pulsing animation
  - Special lighting effects
  - Reduced ceiling height for intimacy
- **Size**: 8x6 units, compact design

#### **North Corridor**
- **Purpose**: Main connecting hallway
- **Features**: Red accent lighting, extended length
- **Size**: 25x8 units, corridor-shaped

#### **West Wing Complex**
- **Purpose**: Multi-room area with connections
- **Features**: Yellow lighting, connects to boss chamber
- **Size**: 18x20 units

#### **Exit Area**
- **Purpose**: Level completion zone
- **Features**:
  - Blue portal effect
  - Elevated position (+1 unit)
  - Special exit lighting
- **Size**: 10x10 units

### 🔗 **Connectivity System**

The map uses a sophisticated hallway system that connects rooms based on the original 2D schematic:

```typescript
interface HallwayData {
  id: string;
  start: THREE.Vector3;
  end: THREE.Vector3;
  width: number;
  height: number;
  doors: boolean;
}
```

**Key Connections**:
- Start → Courtyard (with doors)
- Courtyard → North Corridor (open)
- Courtyard → West Wing (with doors)
- West Wing → Boss Chamber (with doors)
- West Complex → Exit Area (with doors)

### 💡 **Lighting System**

#### **Sector-Based Lighting**
Each room has unique lighting that reflects its purpose:

- **Start Room**: Blue (`0x4040ff`) - Welcoming spawn area
- **Courtyard**: Gray (`0x606060`) - Neutral hub area
- **Boss Chamber**: Red (`0xff0040`) - Dramatic and dangerous
- **Secret Room**: Green (`0x00ff80`) - Mysterious and rewarding
- **North Corridor**: Red (`0xff4040`) - Warning/danger area
- **West Wing**: Yellow (`0xffff40`) - Caution area
- **Exit Area**: Blue (`0x4080ff`) - Goal indication

#### **Atmospheric Lighting**
- **Ambient Light**: Low-level illumination (`0x404040`)
- **Directional Light**: Main scene lighting with shadows
- **Point Lights**: Room-specific colored lighting
- **Flickering Lights**: Hallway atmosphere with random intensity variation

### 🎯 **Interactive Elements**

#### **Computer Terminals**
- **Appearance**: Dark gray boxes with glowing green screens
- **Locations**: Courtyard, North Rooms, West Complex
- **Features**: Interactive collision detection, screen glow effects

#### **Explosive Barrels**
- **Appearance**: Brown cylindrical barrels
- **Locations**: Randomly distributed throughout rooms
- **Features**: Interactive objects, cast shadows

#### **Tech Panels**
- **Appearance**: Wall-mounted panels with blinking lights
- **Features**: RGB LED indicators, mounted on room walls
- **Purpose**: Environmental storytelling and atmosphere

### 🗺️ **Map Layout**

The map is organized around a central courtyard with branching areas:

```
    [North Rooms]
         |
    [North Corridor] ← [Zigzag Hall]
         |
[West Complex] ← [Courtyard] → [Secret Area]
    |              |
[Exit Area]    [Start Room]
    |
[Boss Chamber]
```

### 🏗️ **Technical Implementation**

#### **Room Generation**
```typescript
private createRoom(id: string, position: Vector3, size: Vector3, type: RoomType): void {
  // Floor creation with elevation support
  // Wall generation (4 walls per room)
  // Room-specific lighting
  // Special features based on room type
}
```

#### **Hallway System**
```typescript
private createHallway(start: Vector3, end: Vector3, width: number, height: number): void {
  // Calculate length and direction
  // Create floor plane with proper orientation
  // Generate parallel walls
  // Add connecting lighting
}
```

#### **Collision System Integration**
All walls, objects, and interactive elements are registered with the collision system:
```typescript
this.addCollidableObject(wall, "static");
this.addCollidableObject(terminal, "interactive");
```

### 🎮 **Usage**

#### **Theme Selection**
```typescript
import { SceneManager } from './core/SceneManager';

const sceneManager = SceneManager.getInstance();
await sceneManager.initialize('doomMap');
```

#### **Testing**
Use the test file at `client-ts/public/tests/doom-map-test.html` to:
- Explore the 3D map with WASD + Mouse controls
- Navigate between rooms using quick-travel buttons
- View the minimap showing room layout
- Toggle wireframe mode to see the structure
- Get room information and connections

### 🔧 **Configuration**

The theme uses these configuration values:

```typescript
const config: SceneThemeConfig = {
  name: "Doom Map",
  primaryColor: 0x2a2a2a,      // Dark gray concrete
  secondaryColor: 0x4a4a4a,    // Lighter gray walls
  fogColor: 0x1a1a1a,          // Dark fog
  ambientLightColor: 0x404040, // Low ambient light
  directionalLightColor: 0x808080, // Main lighting
  groundColor: 0x333333,       // Dark concrete floor
  skyColor: 0x0a0a0a,         // Very dark sky
  glowColor: 0x00ff00,        // Green for terminals
  accentColor: 0xff4400,      // Orange/red for danger
};
```

### 📐 **Dimensions**

- **Map Scale**: 2.5x multiplier from 2D to 3D
- **Wall Height**: 8 units (standard), 12 units (boss chamber)
- **Door Dimensions**: 3 units wide, 6 units high
- **Boundary Size**: 90 units total playable area
- **Room Elevations**: -1 to +2 units variation

### 🎨 **Visual Effects**

#### **Ground Details**
- **Floor Textures**: Varied concrete patterns
- **Scuff Marks**: Battle damage indicators
- **Metal Grating**: Industrial areas
- **Room-Specific Flooring**: Different colors for different room types

#### **Atmospheric Elements**
- **Particle System**: Subtle dust/debris particles
- **Fog System**: Distance-based atmospheric fog
- **Shadow Mapping**: PCF soft shadows for all objects
- **Glow Effects**: Terminal screens and special objects

### 🚀 **Performance Considerations**

- **LOD System**: Objects are culled at distance
- **Efficient Geometry**: Minimal polygon count while maintaining detail
- **Texture Optimization**: Shared materials where possible
- **Shadow Optimization**: 2048x2048 shadow maps for quality/performance balance

### 🔮 **Future Enhancements**

Potential improvements for the Doom map theme:

1. **Animated Elements**: Moving platforms, rotating doors
2. **Sound Integration**: Positional audio for different rooms
3. **Dynamic Lighting**: Flickering lights, emergency lighting
4. **Interactive Doors**: Proper door opening/closing mechanics
5. **Multiple Map Variants**: Different classic Doom levels
6. **Texture Mapping**: Authentic Doom wall textures
7. **Ceiling Details**: Varied ceiling heights and designs

### 📝 **Notes**

- The theme extends `BaseSceneTheme` for consistency with other themes
- All objects are properly integrated with the collision system
- Room data is stored in a Map for efficient lookup
- Hallway generation uses vector mathematics for proper orientation
- The design prioritizes authenticity to the original Doom aesthetic while leveraging modern 3D capabilities

This implementation successfully transforms the classic 2D Doom map schematic into an immersive 3D environment that maintains the spirit and layout of the original while adding modern visual enhancements. 