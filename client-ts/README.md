# DOOM PROTOCOL - TypeScript Client

🔥 **Hellish Combat Arena** - Advanced TypeScript Edition

A modern, TypeScript-based first-person shooter game built with **Three.js** and **Vite**, featuring multiple demon types, diverse weapon systems, immersive themes, and robust multiplayer capabilities.

## 🌟 Key Features

### 🎯 **Core Gameplay**

- **First-Person Shooter**: Smooth 3D movement and shooting mechanics
- **Wave-Based Survival**: Progressive difficulty with endless demon waves
- **Multiple Game Modes**: Single-player and multiplayer combat
- **Dynamic Environments**: 6 unique themed battlegrounds

### 👹 **Enhanced Demon Bestiary**

- **5 Classic DOOM Demons**: IMP, DEMON, CACODEMON, BARON, ARCHVILE
- **4 Pokemon-Inspired Creatures**: CHARIZARD, PIKACHU, SQUIRTLE, EEVEE
- **Advanced AI Systems**: Smart pathfinding, attack patterns, and behaviors
- **Ranged Combat**: Fireball-shooting demons with projectile physics

### 🔫 **Weapon Arsenal**

- **Shotgun** 🔫: High damage, spread pattern (8 pellets)
- **Chaingun** ⚡: Rapid-fire, high rate of fire (100ms intervals)
- **Rocket Launcher** 🚀: Explosive damage with splash radius
- **Plasma Rifle** 🔥: Energy-based precision weapon

### 🎪 **Battle Arenas & Themes**

- **🔥 Hell Theme**: Classic infernal environment
- **❄️ Ice Theme**: Frozen wasteland battlefield
- **☢️ Toxic Theme**: Radioactive industrial complex
- **🏭 Industrial Theme**: Modern facility environment
- **🏛️ Doom Map Theme**: Procedural maze-like levels
- **🗺️ BSP Map Theme**: Real Quake/Half-Life BSP map support

## ⚡ Development Environment (Vite)

This project uses **Vite** for lightning-fast development experience!

### 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server (super fast!)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### 🛠️ Available Commands

- `npm run dev` - Start Vite development server (recommended)
- `npm run dev:webpack` - Start webpack development server (fallback)
- `npm run build` - Vite production build
- `npm run build:webpack` - webpack production build (fallback)
- `npm run preview` - Preview production build
- `npm run test` - Run Jest tests
- `npm run type-check` - TypeScript type checking
- `npm run lint` - ESLint code analysis
- `npm run lint:fix` - Auto-fix ESLint issues

### ✨ Vite Advantages

- **🚀 Ultra-fast startup**: ~1-3 seconds vs webpack's 10-30 seconds
- **⚡ Instant HMR**: File changes reflect immediately
- **🎯 On-demand compilation**: Only compile changed files
- **📦 Smaller bundles**: Better tree shaking
- **🔧 Zero configuration**: TypeScript works out of the box

## 🏗️ Project Architecture

### 📁 Source Structure

```
src/
├── core/                   # Core game engine
│   ├── Game.ts            # Main game controller (singleton)
│   ├── SceneManager.ts    # 3D scene management
│   ├── PlayerController.ts # First-person controls
│   ├── StateManager.ts    # Global state management
│   └── SceneTheme.ts      # Theme abstraction layer
├── systems/               # Game systems
│   ├── WeaponSystem.ts    # Weapon mechanics & ballistics
│   ├── DemonSystem.ts     # AI and demon management
│   ├── AudioSystem.ts     # 3D spatial audio
│   ├── NetworkManager.ts  # Multiplayer networking
│   ├── UIManager.ts       # User interface management
│   ├── CollisionSystem.ts # Physics collision detection
│   ├── CollectibleSystem.ts # Power-ups and items
│   └── VoiceChatSystem.ts # Voice communication
├── themes/                # Environment themes
│   ├── HellTheme.ts       # Infernal environment
│   ├── IceTheme.ts        # Frozen battlefield
│   ├── ToxicTheme.ts      # Radioactive facility
│   ├── IndustrialTheme.ts # Modern complex
│   ├── DoomMapTheme.ts    # Procedural maze
│   └── BSPMapTheme.ts     # BSP map loader
├── config/                # Game configuration
│   ├── weapons.ts         # Weapon specifications
│   ├── demons.ts          # Demon types & stats
│   ├── audio.ts           # Audio asset definitions
│   └── game.ts            # Core game settings
├── types/                 # TypeScript definitions
│   ├── game.ts            # Game state types
│   ├── weapons.ts         # Weapon system types
│   ├── demons.ts          # Demon system types
│   ├── audio.ts           # Audio system types
│   ├── network.ts         # Networking types
│   └── global.d.ts        # Global type declarations
├── styles/                # CSS styling
│   └── main.css           # Game UI styles
├── main.ts                # Application entry point
└── index.html             # HTML template
```

### 🔧 Technical Stack

- **Core Engine**: Three.js (3D graphics and WebGL)
- **Language**: TypeScript (type-safe JavaScript)
- **Build Tool**: Vite (fast development and building)
- **Audio**: Web Audio API (3D spatial sound)
- **Networking**: Socket.IO (real-time multiplayer)
- **Testing**: Jest (unit testing framework)
- **Linting**: ESLint + TypeScript (code quality)

## 🎮 Game Features

### 🔫 Advanced Weapon System

- **Realistic Ballistics**: Bullet physics with gravity and air resistance
- **Recoil Mechanics**: Weapon-specific recoil patterns
- **Ammo Management**: Limited ammunition with reload mechanics
- **Visual Effects**: Muzzle flashes, impact particles, and shell casings
- **3D Weapon Models**: First-person weapon positioning

### 👹 Intelligent Demon AI

- **State-Based Behavior**: Idle, patrol, chase, attack, and flee states
- **Dynamic Pathfinding**: Smart navigation around obstacles
- **Attack Patterns**: Varied combat behaviors per demon type
- **Ranged Attacks**: Fireball projectiles with physics
- **Visual Diversity**: Unique models and animations for each demon type

### 🎵 Immersive Audio System

- **3D Spatial Audio**: Distance-based audio falloff
- **Dynamic Music**: Context-aware background music switching
- **Weapon Audio**: Authentic weapon sound effects
- **Demon Sounds**: Varied creature audio (roars, growls, attacks)
- **Environmental Audio**: Atmospheric soundscapes per theme

### 🌐 Multiplayer Features

- **Real-time Networking**: Socket.IO-based synchronization
- **Voice Chat**: Push-to-talk voice communication
- **Player Models**: 3D character representations
- **Synchronized Combat**: Shared demon spawning and elimination
- **Chat System**: Text-based in-game communication
- **Room Management**: Create and join multiplayer lobbies

### 🗺️ Map System

- **BSP Map Support**: Load real Quake/Half-Life BSP maps
- **Procedural Generation**: Dynamic maze-like level creation
- **Themed Environments**: 6 distinct visual themes
- **Interactive Elements**: Doors, switches, and environmental hazards
- **Boundary System**: Intelligent player boundary enforcement

## 🔧 Development Setup

### 📋 Prerequisites

- **Node.js** 16+ (LTS recommended)
- **npm** 8+ or **yarn** 1.22+
- Modern web browser with WebGL 2.0 support
- **Optional**: Git for version control

### 🔄 Development Workflow

```bash
# Clone the repository
git clone <repository-url>
cd game-fps/client-ts

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:5173
```

### 🏗️ Build Process

```bash
# Development build
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Run tests
npm run test
```

### 🔧 Troubleshooting

If you encounter cache issues:

```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 🎯 Controls

| Control                   | Action                         |
| ------------------------- | ------------------------------ |
| **WASD** / **Arrow Keys** | Player movement                |
| **Mouse**                 | Look around / Aim              |
| **Left Click**            | Fire weapon                    |
| **Right Click**           | Switch weapon                  |
| **1-4 Keys**              | Select specific weapon         |
| **ESC**                   | Pause game / Exit pointer lock |
| **T** (Multiplayer)       | Push-to-talk voice chat        |
| **Enter** (Multiplayer)   | Text chat                      |

## 🧪 Testing

### 🔬 Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test -- --coverage
```

### 🎮 Manual Testing

Access these testing utilities in the browser console:

```javascript
// Test BSP map loading
await testBSPMap("maps/bsp/de_dust2.bsp");

// List available BSP maps
listBSPMaps();

// Access game instance
window.game.getGameState();

// Access network manager
window.networkManager.isConnected;
```

## 🚀 Deployment

### 📦 Production Build

```bash
# Create production build
npm run build

# Build artifacts will be in ./dist/
```

### 🌐 Deployment Options

- **Static Hosting**: Vercel, Netlify, GitHub Pages
- **CDN**: AWS CloudFront, Cloudflare
- **Self-hosted**: Nginx, Apache
- **Container**: Docker deployment

## 🔗 Related Projects

- **Server**: `../server/` - Node.js multiplayer server
- **Original Client**: `../client/` - JavaScript version
- **BSP Viewer**: `../bspview/` - BSP map visualization tool
- **Website**: `../website/` - Project website and documentation

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🔮 Future Roadmap

- [ ] Advanced physics engine integration
- [ ] Procedural weapon generation
- [ ] Enhanced AI behavior trees
- [ ] Real-time map editor
- [ ] VR support
- [ ] Mobile platform support
- [ ] Achievement system
- [ ] Player progression and unlocks

---

**Created with ❤️ using TypeScript, Three.js, and modern web technologies**  
_Experience the future of web-based FPS gaming_
