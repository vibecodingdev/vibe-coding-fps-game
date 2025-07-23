## Vibe Coding FPS Starter

A modern **cyberpunk-themed 3D zombie survival FPS game** built with Three.js, featuring professional UI design, authentic weapon sounds, advanced tactical systems, and immersive cyberpunk aesthetics.

## 🎮 Game Overview

**NEURAL COMBAT PROTOCOL** is a first-person shooter survival game where players fight endless waves of combat units (zombies) in a cyberpunk world. The game combines classic FPS mechanics with modern web technologies and a stunning neon-lit visual design.

### 🚀 Key Features

#### **Core Gameplay**
- **Wave Survival System**: Endless zombie waves with progressively increasing difficulty
- **Dual Weapon System**: 
  - **Plasma Rifle** (🔫): Unlimited ammo, precision single-shot weapon
  - **Neural Cannon** (⚡): 150-round limited ammo, rapid-fire weapon
- **4 Combat Unit Types**:
  - **Standard Unit** (🤖): Basic combat drones (Wave 1+)
  - **Speed Unit** (🏃‍♂️): Fast attack drones (Wave 2+) 
  - **Tank Unit** (🦾): Heavy armored drones (Wave 4+)
  - **Boss Unit** (👹): Elite combat systems (Wave 6+)

#### **Advanced Systems**
- **Neural Integrity System**: 100 HP with damage visualization
- **Bio-Enhancement Packs**: Auto-spawning health restoration items (+25 HP)
- **Energy Cell System**: Collectible ammo packs for machine gun
- **Mini Radar**: Real-time enemy tracking with cyberpunk styling
- **Smart Crosshair**: Dynamic targeting system with enemy lock indication

#### **Cyberpunk UI & Aesthetics**
- **Complete Visual Theme**: Neon colors (cyan, purple, pink), dark backgrounds
- **Modern Typography**: Orbitron, Rajdhani, Space Mono fonts
- **Glow Effects**: All UI elements feature neon glowing borders and shadows
- **Animated Elements**: Matrix grid background, color-cycling animations
- **Social Media Integration**: Developer handles displayed on in-game building advertisements

## 🛠️ Technical Architecture

### **Frontend Technologies**
- **Three.js**: 3D graphics and WebGL rendering
- **Web Audio API**: 3D positional audio system
- **Pointer Lock API**: First-person camera controls
- **Modern CSS3**: Cyberpunk styling with animations
- **ES6+ JavaScript**: Modern JavaScript features

### **Game Systems**

#### **3D Engine & Graphics**
```javascript
// Scene setup with professional lighting
- DirectionalLight: Dynamic shadows
- PointLight: Environmental illumination  
- PBR Materials: Realistic surface rendering
- Shadow Mapping: PCF soft shadows
- LOD System: Performance optimization
```

#### **Audio System**
- **3D Positional Audio**: Distance-based audio falloff
- **Multi-format Support**: MP3 audio loading
- **Dynamic Audio**: Weapon-specific sound effects
- **Volume Controls**: Master volume slider

#### **AI & Game Logic**
- **Smart Enemy AI**: Multiple behavior states (wander, chase, attack)
- **Pathfinding**: Direct player pursuit with obstacle avoidance
- **Wave Management**: Dynamic difficulty scaling
- **Collision Detection**: Bullet-enemy intersection testing

## 📁 Project Structure

```
vibe-coding-fps-game/
├── client/                    # Frontend game client
│   ├── assets/               # Game assets
│   │   ├── favicon.png       # Game icon
│   │   ├── single gun shot.mp3
│   │   ├── machine gun (rapid fire).mp3
│   │   └── zombie.mp3
│   ├── index.html           # Main game page
│   ├── script.js            # Core game logic (4,482 lines)
│   ├── styles.css           # Cyberpunk UI styling (1,068 lines)
│   └── README.md            # Client-specific documentation
├── docs/                    # Project documentation
│   ├── doc-en.md           # English documentation
│   ├── doc.md              # Chinese documentation  
│   ├── multiplayer-fps-framework-design-en.md
│   └── multiplayer-fps-framework-design.md
└── README.md               # Main project documentation
```

## 🎯 Game Controls

| Control | Action |
|---------|--------|
| **WASD** / **Arrow Keys** | Movement Matrix |
| **Mouse** | Neural targeting system |
| **Left Click** | Fire plasma weapon |
| **Right Click** | Switch weapon protocol |
| **ESC** | Pause neural link / Exit targeting mode |

## 🔧 Setup & Installation

### **Prerequisites**
- Modern web browser with WebGL support
- HTTP/HTTPS server (required for audio loading)
- Supported browsers: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### **Quick Start**

```bash
# Clone the repository
git clone <repository-url>
cd vibe-coding-fps-game

# Start local HTTP server
python -m http.server 8000
# or
npx http-server -p 8000

# Open in browser
http://localhost:8000/client/
```

**⚠️ Important**: The game must be served via HTTP/HTTPS (not file://) due to audio loading security restrictions.

## 🎨 Visual Design

### **Cyberpunk Theme Elements**
- **Color Palette**: Neon cyan (#00ffff), purple (#ff00ff), green (#00ff00)
- **Visual Effects**: Glowing borders, pulsing animations, matrix grid background
- **Typography**: Tech-style fonts with letter spacing and glow effects
- **UI Components**: Angular designs with diagonal clip paths
- **Interactive Elements**: Hover effects with color transitions

### **3D Environment**
- **Apocalyptic Setting**: Burned buildings, abandoned vehicles, graveyards
- **Urban Elements**: Street lights, barricades, hospitals, schools
- **Atmospheric Objects**: Dead trees, debris, playground equipment
- **Social Media Billboard**: In-game advertising displays

## 📊 Game Statistics & Features

- **Lines of Code**: 5,550+ total
- **Audio Files**: 4 professional sound effects
- **Enemy Types**: 4 with unique behaviors and scaling
- **Weapon Systems**: 2 with distinct mechanics
- **UI Components**: 10+ interactive elements
- **Animation Systems**: Multiple smooth transitions

## 🚧 Future Development Plans

### **Phase 1: Multiplayer Framework**
- Socket.IO server implementation
- Real-time player synchronization
- Cooperative wave survival

### **Phase 2: Enhanced Features**
- Additional weapon types
- Map editor functionality
- Custom game modes

### **Phase 3: Advanced Systems**
- Leaderboard integration
- Replay system
- Mod support

## 🌐 Social Media Integration

The game features in-world advertising that displays developer social media handles on building billboards, creating an immersive way to promote social media presence.

## 🔧 Technical Requirements

- **WebGL**: Hardware-accelerated 3D graphics
- **Web Audio API**: Spatial audio processing
- **Pointer Lock API**: First-person camera control
- **ES6+ Support**: Modern JavaScript features
- **HTTP/HTTPS Server**: Asset loading requirements

## 📝 Development Notes

This project demonstrates advanced web game development techniques including:
- **3D Scene Management**: Complex object hierarchies and transformations
- **Real-time Physics**: Collision detection and response systems
- **State Management**: Game state transitions and persistence
- **Performance Optimization**: Efficient rendering and audio processing
- **Modern Web APIs**: Integration of cutting-edge browser features

## 🏆 Project Highlights

- **Professional Quality**: Production-ready game mechanics and visual design
- **Modern Web Technologies**: Showcase of latest web development capabilities  
- **Extensible Architecture**: Clean, modular code structure for future enhancements
- **Cross-platform Compatibility**: Runs on all modern browsers and devices
- **Educational Value**: Excellent reference for 3D web game development

---

**Created with ❤️ using Three.js and modern web technologies**  
*Experience the future of web-based gaming with NEURAL COMBAT PROTOCOL*
