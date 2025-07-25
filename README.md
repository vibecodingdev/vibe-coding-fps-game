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

| Control                   | Action                                  |
| ------------------------- | --------------------------------------- |
| **WASD** / **Arrow Keys** | Movement Matrix                         |
| **Mouse**                 | Neural targeting system                 |
| **Left Click**            | Fire plasma weapon                      |
| **Right Click**           | Switch weapon protocol                  |
| **ESC**                   | Pause neural link / Exit targeting mode |

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
_Experience the future of web-based gaming with NEURAL COMBAT PROTOCOL_

# 🔥 Doom-Style FPS Game

一款基于 Three.js 的多人在线第一人称射击游戏，具有 Doom 经典风格的恶魔战斗和现代化的多媒体体验。

## 🎵 Enhanced Doom-Style Audio System

### 🎼 Background Music System

- **Atmospheric Intro**: `quantum-mystic-unnerving-intro-323481.mp3` - 游戏开始时的氛围渲染
- **Main Gameplay Tracks**:
  - `quantum-mystic-riff-1-323475.mp3` - 主要战斗背景音乐
  - `quantum-mystic-riff-2-323476.mp3` - 替换背景音乐
- **Dynamic Suspense**: `suspense-6002.mp3` - 当附近有 3 个或更多恶魔时自动切换
- **Dramatic Events**: `horn-of-doom-101734.mp3` - 新波次开始时播放

### 🔫 Enhanced Weapon Audio

- **Doom Shotgun**: `doom-shotgun-2017-80549.mp3` - 正宗 Doom 风格霰弹枪音效
- **Single Shot**: `single gun shot.mp3` - 单发射击音效
- **Machine Gun**: `machine gun (rapid fire).mp3` - 连发机枪音效
- **Dynamic Volume**: 武器音效根据类型自动调整音量

### 👹 Diverse Demon Audio System

- **Multiple Growl Sounds**:
  - `monster-growl-6311.mp3` - 恶魔咆哮声 1
  - `monster-growl-376892.mp3` - 恶魔咆哮声 2
- **Variety of Roars**:
  - `low-monster-roar-97413.mp3` - 低沉怒吼
  - `monster-roar-02-102957.mp3` - 标准怒吼
  - `deep-sea-monster-roar-329857.mp3` - 深海怪物咆哮
- **Specialized Combat Audio**:
  - `monster-warrior-roar-195877.mp3` - 战士恶魔（BARON/CACODEMON 专用）
  - `monster-shriek-100292.mp3` - 恶魔尖叫（攻击音效）
  - `monster-bite-44538.mp3` - 恶魔撕咬音效
  - `horror-sound-monster-breath-189934.mp3` - 恐怖呼吸音效

### 💥 Environmental Audio Effects

- **Big Explosion**: `big-explosion-41783.mp3` - 波次完成时的胜利音效
- **Doomed Effect**: `doomed-effect-37231.mp3` - 游戏结束音效
- **Generic Monsters**: `monster-105850.mp3` 和 `zombie.mp3` - 通用恶魔音效

## 🎛️ Dynamic Audio Features

### 🎚️ Intelligent Volume Management

- **Master Volume Control**: 统一控制所有音频
- **Separate Audio Channels**:
  - 音乐音量：主音量的 40%
  - 音效音量：主音量的 80%
- **Auto-balancing**: 不同音效类型自动平衡音量

### 🎮 Context-Aware Music System

- **Dynamic Switching**: 根据战斗情况自动在背景音乐和紧张音乐之间切换
- **Proximity Detection**: 当玩家周围 15 单位内有 3 个或更多恶魔时切换到悬疑音乐
- **Seamless Transitions**: 平滑的音乐过渡效果

### 🎯 Type-Specific Demon Audio

- **IMP**: 使用咆哮声和通用怪物音效
- **DEMON**: 使用更激进的咆哮和怒吼音效
- **CACODEMON**: 使用深海怪物咆哮和呼吸音效
- **BARON**: 使用战士怒吼和深沉的咆哮音效

### 🔄 Game State Audio Integration

- **Game Start**: 自动播放氛围介绍音乐，然后过渡到主要音乐
- **Wave Start**: 新波次开始时播放末日号角
- **Wave Complete**: 波次完成时播放爆炸音效
- **Pause/Resume**: 智能暂停和恢复背景音乐
- **Game Over**: 停止所有音乐并播放末日音效

## 🎧 Audio Technical Features

### 🔊 Advanced Sound Management

- **3D Spatial Audio**: 使用 THREE.js AudioListener 实现空间音效
- **Error Handling**: 完善的音频加载错误处理机制
- **Memory Optimization**: 智能音频资源管理，避免重复播放
- **Cooldown System**: 恶魔音效冷却系统防止音频重叠

### 🎵 Playlist Management

- **Random Track Selection**: 主要音乐随机播放
- **Intro-to-Main Transition**: 介绍音乐到主音乐的无缝过渡
- **Loop Control**: 背景音乐循环播放，音效单次播放

### 📊 Performance Optimized

- **Lazy Loading**: 音频文件按需加载
- **Resource Cleanup**: 自动清理未使用的音频资源
- **Efficient Caching**: 智能音频缓存机制

## 🎮 User Experience Enhancements

### 🎛️ Volume Controls

- **Master Volume Slider**: 主菜单和暂停菜单中的音量控制
- **Real-time Updates**: 音量变化立即生效
- **Persistent Settings**: 音量设置自动保存到 localStorage

### 🔄 Seamless Integration

- **Non-blocking Audio**: 音频加载失败不影响游戏运行
- **Graceful Degradation**: 缺少音频文件时的优雅降级
- **Console Feedback**: 详细的音频状态日志记录

这个全新的音频系统将游戏体验提升到了一个新的层次，提供了丰富的听觉反馈和沉浸式的 Doom 风格氛围！🎵👹🔫
