# 🔥 ARCHVILE Demon - Ranged Attack Implementation

## Overview

Added a new ranged demon type called **ARCHVILE** that can launch fireball projectiles at the player from a distance. This demon features unique AI behavior, visual design, and attack mechanics that differentiate it from existing melee demons.

## Features Implemented

### 1. New Demon Type

- **Type**: `ARCHVILE` added to `DemonType` enum
- **Classification**: Ranged attacker with fire-based abilities
- **Spawn Behavior**: Appears starting from wave 3 (rare), more common in waves 5+

### 2. Configuration

```typescript
ARCHVILE: {
  name: "Archvile",
  emoji: "🔥",
  health: 6,
  speed: 0.5,              // Slow but dangerous
  scale: 1.8,              // Tall and imposing
  detectRange: 120,        // Long-range detection
  attackRange: 25.0,       // Long-range attack
  chaseRange: 20,          // Prefers to keep distance
  attackDamage: 25,        // High damage fireballs
  spawnWeight: 15,         // Moderate spawn rate
  isRanged: true,          // NEW: Marks as ranged attacker
  fireballSpeed: 15.0,     // NEW: Fireball projectile speed
  fireballRange: 30.0      // NEW: Maximum fireball range
}
```

### 3. Fireball Projectile System

#### Fireball Interface

```typescript
interface Fireball {
  id: string;
  mesh: THREE.Group;
  velocity: THREE.Vector3;
  damage: number;
  createdAt: number;
  demonId: string;
  targetPosition: THREE.Vector3;
}
```

#### Visual Effects

- **Core**: Glowing orange sphere with emissive materials
- **Glow**: Outer transparent orange glow effect
- **Particles**: Trailing fire particles with animation
- **Explosion**: Dramatic explosion effect on impact

#### Physics

- **Movement**: Projectile physics with velocity-based movement
- **Collision**: Player collision detection with 2.0 unit threshold
- **Lifetime**: Auto-removal after 5 seconds or when out of range
- **Range**: Maximum travel distance of 50 units

### 4. Unique AI Behavior

#### Ranged Positioning

- **Optimal Distance**: Maintains ~80% of attack range from player
- **Retreat Logic**: Backs away if player gets too close (<70% optimal)
- **Advance Logic**: Moves closer if player is too far (>130% optimal)
- **Strafing**: Circles around player when at optimal distance
- **Always Facing**: Constantly faces player while positioning

#### Attack Pattern

- **Cooldown**: 3-second attack cooldown (matches other demons)
- **Targeting**: Calculates projectile trajectory to player position
- **No Lunge**: Unlike melee demons, doesn't lunge forward
- **Sound Effects**: Plays demon-specific attack sounds

### 5. Visual Design

#### Body Structure

- **Body**: Tall, imposing cylindrical torso with dark red coloring
- **Head**: Angular head with gold glowing eyes
- **Arms**: Long, thin arms positioned for spellcasting
- **Legs**: Tall, thin legs for imposing stature

#### Magical Elements

- **Staff**: Wooden staff held in right hand
- **Orb**: Glowing golden orb at staff tip with fire emissive
- **Robe**: Dark red magical robe around lower body
- **Fire Crown**: Flaming crown with animated fire spikes
- **Aura**: Floating fire particles around the demon

#### Materials

- **Emissive**: Fire-based materials with glow effects
- **Colors**: Dark red body, orange-red head, gold eyes
- **Transparency**: Semi-transparent fire effects
- **Animation**: Animated particle effects and material properties

### 6. Wave Integration

#### Spawn Weights by Wave

- **Wave 1-2**: Not available (0 weight)
- **Wave 3-4**: Rare appearance (10 weight)
- **Wave 5-7**: Moderate appearance (25 weight)
- **Wave 8+**: Common appearance (35 weight)

#### Wave Balance

- **Early Waves**: Focuses on basic demons (IMP, DEMON)
- **Mid Waves**: Introduces ranged threats (ARCHVILE, CACODEMON)
- **Late Waves**: High mix including multiple ARCHVILEs

### 7. Game Integration

#### DemonSystem Updates

- **Fireball Tracking**: Added `fireballs: Fireball[]` array
- **Update Loop**: Integrated fireball physics in main update
- **Collision**: New collision detection for fireballs
- **Cleanup**: Proper removal of fireballs on reset

#### Player Interaction

- **Damage**: Fireballs deal 25 damage on impact
- **Collision**: Easy to implement - check `checkFireballCollision()`
- **Visual Feedback**: Explosion effects on impact
- **Audio**: Explosion sound effects on fireball impact

## Usage Examples

### Detecting Fireball Hits

```typescript
const hitFireball = demonSystem.checkFireballCollision(playerPosition);
if (hitFireball) {
  // Player hit by fireball
  playerHealth -= hitFireball.damage;
  demonSystem.removeFireball(hitFireball);
}
```

### Checking Demon Type

```typescript
if (config.isRanged && demonType === "ARCHVILE") {
  // Handle ranged demon differently
  this.executeRangedPositioning(demon, playerPosition, deltaTime);
}
```

## Technical Benefits

### 1. Gameplay Variety

- **Range Threat**: Players must deal with long-range attacks
- **Positioning**: Creates tactical positioning challenges
- **Visual Spectacle**: Dramatic fireball effects enhance gameplay

### 2. Scalable System

- **Easy Extension**: Framework supports adding more ranged demons
- **Configurable**: All parameters easily adjustable
- **Modular**: Fireball system reusable for other features

### 3. Performance

- **Efficient**: Minimal performance impact with proper cleanup
- **Batched**: Fireball updates batched in single loop
- **Memory Safe**: Automatic cleanup prevents memory leaks

## Future Enhancements

### Potential Additions

1. **Homing Fireballs**: Fireballs that track player movement
2. **Area Damage**: Fireball explosions damage nearby objects
3. **Multiple Projectiles**: Burst fire or shotgun-style attacks
4. **Spell Variety**: Different magical attack types
5. **Summoning**: ARCHVILE summons other demons

### Balance Adjustments

- **Damage Scaling**: Adjust damage based on wave number
- **Cooldown Variation**: Different cooldowns for different situations
- **Speed Tuning**: Fine-tune fireball speed and demon movement
- **Range Adjustment**: Modify attack ranges for balance

## Testing

A comprehensive test file (`archvile-test.html`) is included that validates:

- ✅ Type definitions
- ✅ Configuration completeness
- ✅ Spawn weight integration
- ✅ Fireball system interfaces
- ✅ Visual model creation
- ✅ Wave generation logic

Run the test to verify implementation before integration.

## Conclusion

The ARCHVILE demon adds a significant new gameplay element with its ranged fireball attacks, unique AI positioning, and distinctive visual design. The implementation is robust, performant, and provides a solid foundation for additional ranged enemies and magical effects.

The demon successfully differentiates itself from existing melee demons while maintaining consistency with the existing demon system architecture and DOOM-style aesthetic.
