# Singleton Pattern Implementation Guide

## Overview

To prevent state inconsistency issues caused by multiple instances of core system classes, we have implemented the singleton pattern for several key system classes.

## Singleton Classes

The following classes MUST be accessed via `getInstance()` method and CANNOT be instantiated with `new`:

### 🎮 Core Systems

1. **Game** - Main game controller

   ```typescript
   // ✅ Correct
   const game = Game.getInstance();

   // ❌ Wrong - will cause TypeScript error
   const game = new Game(); // Constructor is private
   ```

2. **StateManager** - Global input state management

   ```typescript
   // ✅ Correct
   const stateManager = StateManager.getInstance();

   // ❌ Wrong - will cause TypeScript error
   const stateManager = new StateManager(); // Constructor is private
   ```

### 🖥️ System Managers

3. **NetworkManager** - Network communication

   ```typescript
   // ✅ Correct
   const networkManager = NetworkManager.getInstance();

   // ❌ Wrong - will cause multiple connection instances
   const networkManager = new NetworkManager(); // Constructor is private
   ```

4. **AudioSystem** - Audio management

   ```typescript
   // ✅ Correct
   const audioSystem = AudioSystem.getInstance();

   // ❌ Wrong - will cause audio conflicts
   const audioSystem = new AudioSystem(); // Constructor is private
   ```

5. **UIManager** - User interface management

   ```typescript
   // ✅ Correct
   const uiManager = UIManager.getInstance();

   // ❌ Wrong - will cause UI conflicts
   const uiManager = new UIManager(); // Constructor is private
   ```

6. **SceneManager** - 3D scene management

   ```typescript
   // ✅ Correct
   const sceneManager = SceneManager.getInstance();

   // ❌ Wrong - will cause multiple scenes
   const sceneManager = new SceneManager(); // Constructor is private
   ```

## Non-Singleton Classes

The following classes can still be instantiated with `new` as they may need multiple instances:

- **WeaponSystem** - Each player may have their own weapon state
- **DemonSystem** - May need separate instances for different contexts
- **CollectibleSystem** - May need separate instances for different areas
- **PlayerController** - Each player needs their own controller
- **VoiceChatSystem** - May need separate instances for different UI components

## Migration Guide

### Before (Old Code)

```typescript
// main.ts
const game = Game.getInstance();
const networkManager = new NetworkManager(); // Creates separate instance

// Game.ts
private initializeSystems(): void {
  this.networkManager = new NetworkManager(); // Creates another instance
}
```

### After (New Code)

```typescript
// main.ts
const game = Game.getInstance();
const networkManager = NetworkManager.getInstance(); // Same instance

// Game.ts
private initializeSystems(): void {
  this.networkManager = NetworkManager.getInstance(); // Same instance
}
```

## Benefits

1. **State Consistency** - All parts of the application use the same instance
2. **Resource Efficiency** - No duplicate system instances
3. **Easier Debugging** - Single source of truth for each system
4. **Prevent Connection Issues** - Single network connection instead of multiple

## Common Patterns

### Global Access

```typescript
// All singletons are available globally
window.game = Game.getInstance();
window.networkManager = NetworkManager.getInstance();
```

### Initialization Order

```typescript
async function initializeGame(): Promise<void> {
  const game = Game.getInstance();
  const networkManager = NetworkManager.getInstance();

  // Initialize in proper order
  await game.initialize();
  await networkManager.initialize();
}
```

### Accessing from Components

```typescript
// In any component that needs network access
const networkManager = NetworkManager.getInstance();
networkManager.sendMessage("Hello");
```

## Testing

When writing tests, you may need to reset singleton instances:

```typescript
// For testing only - reset singleton state
// Note: This should only be used in test environments
(NetworkManager as any).instance = null;
const freshInstance = NetworkManager.getInstance();
```

## Error Prevention

The TypeScript compiler will prevent accidental instantiation:

```typescript
// This will show a TypeScript error
const networkManager = new NetworkManager();
// Error: Constructor of class 'NetworkManager' is private and only accessible within the class declaration
```

## Rules to Follow

1. **Always use `getInstance()`** for singleton classes
2. **Never use `new`** with singleton classes
3. **Check this guide** when adding new system classes to determine if they should be singletons
4. **Update this document** when adding new singleton classes
