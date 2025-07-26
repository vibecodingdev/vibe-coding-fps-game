# Scene Theme System

The game now features a modular theme system that provides 4 distinct visual styles, each with different color palettes, lighting, and environmental objects.

## Available Themes

### 1. Hell Theme (Dark Red)

- **Colors**: Dark red/brown tones
- **Atmosphere**: Hellish fog, ember particles
- **Environment**: Demon architecture, lava cracks, blood stains, hell portals
- **Lighting**: Warm red/orange lights, flickering fire effects

### 2. Ice Theme (Dark Blue)

- **Colors**: Dark blue/gray tones
- **Atmosphere**: Cold misty fog, snow particles, aurora effects
- **Environment**: Ice citadels, crystal formations, frozen trees, ice portals
- **Lighting**: Cool blue lights, crystal luminescence

### 3. Toxic Theme (Dark Green)

- **Colors**: Dark green tones
- **Atmosphere**: Toxic fog, spore particles, toxic clouds
- **Environment**: Mutated trees, toxic pools, bio-portals, contaminated debris
- **Lighting**: Sickly green bio-luminescent effects

### 4. Industrial Theme (Gray/White)

- **Colors**: Gray/white metallic tones
- **Atmosphere**: Industrial haze, steam particles
- **Environment**: Metal facilities, machinery, energy portals, security barriers
- **Lighting**: Bright white/blue lights, holographic displays

## Usage

### Random Theme Selection (Single Player)

When starting a single player game, a random theme is automatically selected:

```typescript
// Automatic random theme selection
await game.startGame(false);
```

### Manual Theme Selection

For multiplayer or specific theme requirements:

```typescript
// Specify a theme
await game.startGame(false, "ice");
await game.startGame(true, "industrial"); // multiplayer with industrial theme
```

### Switching Themes During Gameplay

```typescript
// Switch theme while game is running
await game.switchSceneTheme("toxic");

// Get available themes
const themes = game.getAvailableThemes(); // ['hell', 'ice', 'toxic', 'industrial']

// Get current theme
const current = game.getCurrentTheme(); // returns theme name or null
```

## Architecture

### Base Theme Class

All themes extend `BaseSceneTheme` which provides:

- Common utility methods for lighting, particles, and ground textures
- Abstract methods that each theme must implement
- Centralized material and object management

### Theme Configuration

Each theme has a `SceneThemeConfig` that defines:

```typescript
interface SceneThemeConfig {
  name: string;
  primaryColor: number;
  secondaryColor: number;
  fogColor: number;
  ambientLightColor: number;
  directionalLightColor: number;
  fillLightColor: number;
  groundColor: number;
  skyColor: number;
  glowColor: number;
  accentColor: number;
}
```

### Modular Design

- **SceneManager**: Orchestrates theme switching and boundary walls
- **Theme Classes**: Individual theme implementations
- **Theme Registry**: Centralized theme access and management

## Performance Features

### Ground Texture Toggle

Ground textures can be disabled for better performance:

```typescript
// Toggle ground textures
sceneManager.toggleGroundTextures(false); // disable
sceneManager.toggleGroundTextures(true); // enable
```

### Resource Management

- Automatic disposal of geometry and materials when switching themes
- Efficient particle systems with controlled counts
- Optimized lighting setups for each theme

## Integration Points

### Multiplayer

- Room creators can specify themes when creating rooms
- Theme synchronization across connected players
- Consistent visual experience for all participants

### UI Integration

The theme system can be integrated with:

- Settings menu for theme selection
- Room creation dialogs
- Debug panels for testing themes

### Future Extensions

The modular design allows for:

- Additional themes (space, underwater, desert, etc.)
- Seasonal variations of existing themes
- Dynamic theme transitions
- Theme-specific gameplay elements

## Technical Implementation

### Theme Files Structure

```
src/themes/
├── index.ts           # Theme registry and exports
├── HellTheme.ts       # Hell theme implementation
├── IceTheme.ts        # Ice theme implementation
├── ToxicTheme.ts      # Toxic theme implementation
└── IndustrialTheme.ts # Industrial theme implementation

src/core/
└── SceneTheme.ts      # Base theme class and interfaces
```

### Memory Management

- Themes automatically clean up resources when switched
- Boundary walls adapt to theme colors
- Lighting systems are rebuilt per theme for optimal performance

This system provides visual variety while maintaining consistent gameplay mechanics and performance.
