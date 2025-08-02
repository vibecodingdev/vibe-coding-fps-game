# 🎮 DOOM PROTOCOL - FPS Game Collection

A comprehensive **multi-platform FPS game ecosystem** featuring both classic JavaScript and modern TypeScript implementations, complete with multiplayer server infrastructure, BSP map support, and professional web deployment tools.

## 🌟 Project Overview

**DOOM PROTOCOL** is a complete first-person shooter game platform that combines classic DOOM-style gameplay with modern web technologies. The project includes multiple client implementations, a real-time multiplayer server, BSP map viewer, and a professional website with user authentication and subscription management.

## 🚀 Key Highlights

- **🎯 Dual Client Architecture**: Both JavaScript (classic) and TypeScript (modern) implementations
- **👹 Enhanced Demon AI**: 9 unique demon types including Pokemon-inspired creatures
- **🔫 Advanced Weapon Systems**: 4 distinct weapon types with realistic ballistics
- **🎪 Multiple Themes**: 6 immersive battle environments including BSP map support
- **🌐 Real-time Multiplayer**: Socket.IO-based networking with voice chat
- **📱 Professional Website**: Next.js-based platform with Stripe integration
- **🗺️ BSP Map Viewer**: Dedicated tool for Quake/Half-Life map visualization
- **🤖 AI Demon Generator**: OpenSota AI-powered custom monster creation tool

## 📁 Project Architecture

### 🎮 **Client Implementations**

#### 🔥 **TypeScript Client** (`client-ts/`) - _Recommended_

- **Modern Architecture**: Modular TypeScript with Vite build system
- **Enhanced Features**: 9 demon types, 4 weapons, 6 themes, BSP map support
- **Development Tools**: Hot reload, type checking, Jest testing, ESLint
- **Multiplayer Ready**: Real-time networking with voice chat support
- **Performance**: Optimized with tree shaking and code splitting

#### ⚡ **JavaScript Client** (`client/`) - _Legacy_

- **Classic Implementation**: Single-file architecture with cyberpunk aesthetics
- **Proven Stability**: Battle-tested codebase with neural combat theme
- **Rapid Deployment**: Direct browser execution without build process
- **Cyberpunk UI**: Neon styling with matrix backgrounds and glow effects

### 🌐 **Backend Infrastructure**

#### 🖥️ **Multiplayer Server** (`server/`)

- **Technology**: Node.js + TypeScript + Socket.IO
- **Features**: Real-time multiplayer, room management, voice chat relay
- **Deployment**: PM2 process management with Google App Engine support
- **Testing**: Comprehensive Jest test suite with integration tests
- **Scalability**: Horizontal scaling support with load balancing

#### 🌍 **Professional Website** (`website/`)

- **Framework**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Supabase (PostgreSQL) for user management
- **Payments**: Stripe integration for subscription management
- **Authentication**: Social login with OAuth providers
- **Deployment**: Vercel-optimized with edge functions

### 🛠️ **Development Tools**

#### 🗺️ **BSP Map Viewer** (`bspview/`)

- **Purpose**: Visualization and debugging of Quake/Half-Life BSP maps
- **Technology**: Three.js with Parcel build system
- **Features**: Real-time map loading, texture visualization, geometry analysis
- **Integration**: Direct BSP file support for game client testing

#### 👹 **AI Demon Generator** (`demon-gen/`)

- **Purpose**: AI-powered tool for creating custom demon configurations
- **Technology**: Next.js 14 + OpenSota AI (GLM-4.5-Air model)
- **Features**: Natural language to JSON conversion, visual preview, export functionality
- **Integration**: Direct JSON import into game's demon management system

### 📚 **Documentation** (`docs/`)

- **Comprehensive Guides**: Setup, development, and deployment instructions
- **Architecture Documents**: Technical design patterns and system diagrams
- **Multilingual Support**: English and Chinese documentation
- **Code Examples**: Working examples and integration guides

## 🎯 Game Features

### 👹 **Enhanced Demon Bestiary**

- **5 Classic DOOM Demons**: IMP, DEMON, CACODEMON, BARON, ARCHVILE
- **4 Pokemon-Inspired Creatures**: CHARIZARD, PIKACHU, SQUIRTLE, EEVEE
- **Advanced AI Systems**: State-based behavior with smart pathfinding
- **Ranged Combat**: Fireball projectiles with realistic physics
- **Dynamic Scaling**: Progressive difficulty across wave progression

### 🔫 **Advanced Weapon Arsenal**

- **Shotgun** 🔫: High damage, spread pattern (8 pellets per shot)
- **Chaingun** ⚡: Rapid-fire with 100ms intervals between shots
- **Rocket Launcher** 🚀: Explosive damage with splash radius
- **Plasma Rifle** 🔥: Energy-based precision weapon system
- **Realistic Ballistics**: Bullet physics with recoil and trajectory

### 🎪 **Immersive Battle Environments**

- **🔥 Hell Theme**: Classic infernal environment with lava and brimstone
- **❄️ Ice Theme**: Frozen wasteland battlefield with dynamic weather
- **☢️ Toxic Theme**: Radioactive industrial complex with hazards
- **🏭 Industrial Theme**: Modern facility with metallic structures
- **🏛️ Doom Map Theme**: Procedural maze-like level generation
- **🗺️ BSP Map Theme**: Real Quake/Half-Life BSP map support

### 🌐 **Multiplayer & Networking**

- **Real-time Synchronization**: Socket.IO-based networking architecture
- **Voice Chat System**: Push-to-talk communication with WebRTC
- **Room Management**: Create, join, and manage multiplayer lobbies
- **Player Models**: 3D character representations with animations
- **Cross-platform**: Browser-based with mobile device support

### 🎵 **Advanced Audio System**

- **3D Spatial Audio**: Distance-based audio falloff and positioning
- **Dynamic Music**: Context-aware background music switching
- **Weapon Sound Effects**: Authentic audio for each weapon type
- **Demon Audio**: Varied creature sounds (roars, growls, attacks)
- **Environmental Audio**: Atmospheric soundscapes per theme

### 🤖 **AI-Powered Demon Creation**

- **Natural Language Processing**: Describe monsters in plain English for AI generation
- **OpenSota AI Integration**: Powered by GLM-4.5-Air model for intelligent content creation
- **JSON Configuration Output**: Generate complete demon configs ready for game import
- **Visual Preview System**: Review monster stats, colors, and abilities before export
- **Multi-Theme Support**: Automatic color variations for all 6 game environments
- **Direct Game Integration**: One-click import into the demon management system

## 📁 Complete Project Structure

```
doom-protocol/
├── client-ts/                    # 🔥 Modern TypeScript Client (Recommended)
│   ├── src/
│   │   ├── core/                # Core game engine
│   │   │   ├── Game.ts         # Main game controller (singleton)
│   │   │   ├── SceneManager.ts # 3D scene management
│   │   │   ├── PlayerController.ts # First-person controls
│   │   │   └── StateManager.ts # Global state management
│   │   ├── systems/            # Game systems
│   │   │   ├── WeaponSystem.ts # Weapon mechanics & ballistics
│   │   │   ├── DemonSystem.ts  # AI and demon management
│   │   │   ├── AudioSystem.ts  # 3D spatial audio
│   │   │   ├── NetworkManager.ts # Multiplayer networking
│   │   │   ├── UIManager.ts    # User interface management
│   │   │   └── VoiceChatSystem.ts # Voice communication
│   │   ├── themes/             # Environment themes (6 types)
│   │   ├── config/             # Game configuration
│   │   ├── types/              # TypeScript definitions
│   │   └── styles/             # CSS styling
│   ├── public/                 # Static assets & BSP maps
│   ├── package.json           # Vite + TypeScript toolchain
│   ├── vite.config.ts         # Build configuration
│   └── README.md              # TypeScript client documentation
├── client/                       # ⚡ Classic JavaScript Client
│   ├── assets/                # Game assets (audio files)
│   ├── index.html            # Cyberpunk-themed main page
│   ├── script.js             # Monolithic game logic (7,748 lines)
│   ├── styles.css            # Cyberpunk UI styling (1,744 lines)
│   └── README.md             # JavaScript client documentation
├── server/                       # 🖥️ Multiplayer Server
│   ├── src/
│   │   ├── index.ts          # Express + Socket.IO server
│   │   └── events.ts         # Real-time event handling
│   ├── tests/                # Jest test suite
│   ├── package.json          # Node.js + TypeScript dependencies
│   ├── ecosystem.config.js   # PM2 configuration
│   └── README.md             # Server documentation
├── website/                      # 🌍 Professional Website
│   ├── app/                  # Next.js 14 app router
│   ├── components/           # React components
│   ├── utils/                # Authentication & payment utilities
│   ├── supabase/             # Database migrations & config
│   ├── package.json          # Next.js + Supabase + Stripe
│   └── README.md             # Website documentation
├── bspview/                      # 🗺️ BSP Map Viewer
│   ├── src/                  # Three.js BSP loader
│   ├── docs/                 # Built viewer application
│   ├── package.json          # Parcel build system
│   └── readme.md             # BSP viewer documentation
├── demon-gen/                    # 👹 AI Demon Generator
│   ├── app/                  # Next.js 14 app router
│   │   ├── api/generate/    # OpenSota AI integration
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Main generator interface
│   ├── components/ui/        # Gaming-themed React components
│   ├── types/                # Monster configuration types
│   ├── utils/                # Helper functions
│   ├── package.json          # Next.js + AI dependencies
│   └── README.md             # Generator documentation
├── docs/                         # 📚 Project Documentation
│   ├── doc-en.md            # English documentation
│   ├── doc.md               # Chinese documentation
│   ├── multiplayer-fps-framework-design-en.md
│   ├── LAN_MULTIPLAYER_SETUP.md
│   └── [various guides]     # Setup and development guides
└── README.md                     # 📋 Main project documentation
```

## 🎯 Universal Game Controls

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

## 🚀 Quick Start Guide

### 📋 **Prerequisites**

- **Node.js** 16+ (LTS recommended for all components)
- **npm** 8+ or **yarn** 1.22+ (package management)
- **Modern Web Browser** with WebGL 2.0 support
- **Git** for version control

### ⚡ **Recommended Setup (TypeScript Client)**

```bash
# Clone the repository
git clone <repository-url>
cd doom-protocol

# Setup TypeScript client (recommended)
cd client-ts
npm install
npm run dev
# 🎮 Game available at http://localhost:5173

# Setup multiplayer server (optional)
cd ../server
npm install
npm run dev
# 🌐 Server running at http://localhost:3000

# Setup AI demon generator (optional)
cd ../demon-gen
npm install
npm run dev
# 🤖 AI Generator available at http://localhost:3001
```

### 🔥 **Classic Setup (JavaScript Client)**

```bash
# Clone the repository
git clone <repository-url>
cd doom-protocol

# Serve JavaScript client directly
npx http-server client -p 8080
# 🎮 Game available at http://localhost:8080
```

### 🌐 **Full Platform Setup**

```bash
# Setup all components
cd doom-protocol

# 1. TypeScript Game Client
cd client-ts && npm install && cd ..

# 2. Multiplayer Server
cd server && npm install && cd ..

# 3. Professional Website
cd website && npm install && cd ..

# 4. BSP Map Viewer
cd bspview && npm install && cd ..

# 5. AI Demon Generator
cd demon-gen && npm install && cd ..

# Start development servers
npm run dev:all  # If available, or start each individually
```

**⚠️ Important Notes**:

- Games must be served via HTTP/HTTPS (not file://) for audio and multiplayer features
- TypeScript client requires Node.js build process, JavaScript client can run directly
- Multiplayer requires server setup for real-time features
- AI Demon Generator requires OpenSota API key for AI functionality

### 🤖 **Using the AI Demon Generator**

```bash
# 1. Setup the generator
cd demon-gen
npm install

# 2. Configure API key
cp .env.example .env.local
# Edit .env.local and add: OPENSOTA_API_KEY=your_api_key_here

# 3. Start the generator
npm run dev
# Available at http://localhost:3001

# 4. Create custom demons
# - Enter natural language description
# - Generate JSON configuration
# - Copy or export the result
# - Import into game via demon manager
```

## 🎨 Visual Design & Technical Architecture

### 🔧 **Technology Stack**

#### **Frontend Technologies**

- **Core Engine**: Three.js (3D graphics and WebGL rendering)
- **Language**: TypeScript (type-safe development) / JavaScript (classic)
- **Build Tools**: Vite (modern) / Parcel (BSP viewer) / Direct serving (classic)
- **UI Framework**: Custom CSS with cyberpunk/modern themes
- **Audio**: Web Audio API (3D spatial sound)

#### **Backend Technologies**

- **Server**: Node.js + Express + TypeScript
- **Real-time**: Socket.IO (WebSocket-based networking)
- **Database**: Supabase (PostgreSQL) for website
- **Authentication**: Supabase Auth with OAuth providers
- **Payments**: Stripe integration for subscriptions
- **Deployment**: PM2 (server) + Vercel (website) + GAE support

#### **Development Tools**

- **Testing**: Jest (unit/integration testing)
- **Code Quality**: ESLint + Prettier
- **Type Checking**: TypeScript strict mode
- **Hot Reload**: Vite HMR / Nodemon
- **Process Management**: PM2 for production

### 🎨 **Visual Themes**

#### **TypeScript Client** (Modern)

- **Material Design**: Clean, professional interface
- **Theme Variety**: 6 distinct environmental themes
- **Responsive UI**: Adaptive layouts for all screen sizes
- **Modern Typography**: System fonts with accessibility focus

#### **JavaScript Client** (Classic Cyberpunk)

- **Neon Aesthetics**: Cyan, purple, pink color schemes
- **Glow Effects**: Animated borders and shadow effects
- **Matrix Elements**: Grid backgrounds and tech styling
- **Retro-Future**: 80s cyberpunk visual language

## 📊 Project Statistics & Scale

### 📈 **Codebase Metrics**

- **Total Lines of Code**: 26,000+ across all components
- **TypeScript Client**: 15,000+ lines (modular architecture)
- **JavaScript Client**: 7,500+ lines (monolithic structure)
- **Multiplayer Server**: 2,000+ lines (Node.js + Socket.IO)
- **Website Platform**: 3,000+ lines (Next.js + React)
- **BSP Map Viewer**: 1,500+ lines (Three.js + utilities)
- **AI Demon Generator**: 1,000+ lines (Next.js + OpenSota AI)

### 🎮 **Game Content**

- **Demon Types**: 9 unique creatures with distinct AI behaviors
- **Weapon Systems**: 4 weapons with realistic ballistics
- **Battle Themes**: 6 immersive environments
- **Audio Assets**: 20+ professional sound effects and music tracks
- **Map Support**: BSP map loader for Quake/Half-Life maps
- **UI Components**: 50+ interactive elements across all clients

### 🛠️ **Technical Features**

- **Real-time Multiplayer**: Socket.IO-based networking
- **Voice Communication**: WebRTC push-to-talk system
- **3D Audio**: Spatial sound with distance-based falloff
- **Advanced AI**: State machines with pathfinding
- **Physics**: Bullet trajectories and collision detection
- **Performance**: Optimized rendering with LOD systems

## 🚧 Development Roadmap

### ✅ **Completed Features**

- **Full TypeScript Migration**: Modern codebase with type safety
- **Multiplayer Infrastructure**: Real-time server with voice chat
- **Enhanced Game Content**: 9 demons, 4 weapons, 6 themes
- **BSP Map Support**: Quake/Half-Life map loading
- **Professional Website**: Next.js platform with authentication
- **AI Demon Generator**: OpenSota AI-powered custom monster creation
- **Development Tools**: Comprehensive testing and build systems

### 🔄 **Current Development**

- **Performance Optimization**: Advanced rendering techniques
- **Mobile Support**: Touch controls and responsive design
- **Enhanced Networking**: Improved synchronization algorithms
- **Content Expansion**: Additional weapons and demon types
- **Map Editor**: In-browser level creation tools
- **Enhanced AI Generation**: Advanced demon creation with more AI models

### 🎯 **Future Phases**

#### **Phase 1: Platform Enhancement**

- **VR Support**: WebXR integration for immersive gameplay
- **Advanced Physics**: Enhanced bullet physics and destructible environments
- **AI Improvements**: Machine learning-based demon behavior
- **Cloud Saves**: Progress synchronization across devices

#### **Phase 2: Community Features**

- **User-Generated Content**: Community map sharing
- **Tournament System**: Competitive multiplayer events
- **Mod Support**: Plugin architecture for community extensions
- **Leaderboards**: Global and local ranking systems

#### **Phase 3: Expansion**

- **Mobile Apps**: Native iOS/Android implementations
- **Desktop Clients**: Electron-based standalone applications
- **Blockchain Integration**: NFT weapons and achievements
- **Metaverse Support**: Virtual world integration

## 🛠️ Technical Requirements

### 💻 **Client Requirements**

- **Modern Web Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **WebGL 2.0**: Hardware-accelerated 3D graphics support
- **Web Audio API**: Spatial audio processing capabilities
- **WebRTC**: For voice chat functionality (multiplayer)
- **Local Storage**: For settings and progress persistence

### 🖥️ **Development Requirements**

- **Node.js**: 16+ LTS for build processes and server
- **npm/yarn**: Package management for dependencies
- **TypeScript**: 5.0+ for type-safe development
- **Modern IDE**: VSCode recommended with TypeScript extensions

### 🌐 **Server Requirements**

- **Node.js Runtime**: 16+ for multiplayer server
- **WebSocket Support**: Socket.IO for real-time features
- **Process Manager**: PM2 for production deployment
- **Database**: PostgreSQL (via Supabase) for website features

### 🤖 **AI Tool Requirements**

- **OpenSota API Key**: For demon generator AI functionality
- **GLM-4.5-Air Model**: Access via OpenSota platform
- **Environment Variables**: Secure API key storage
- **HTTPS/SSL**: Required for API calls in production

## 🏆 Project Achievements

### 🎮 **Game Development Excellence**

- **Comprehensive FPS Framework**: Complete game engine with modular architecture
- **Advanced AI Systems**: Sophisticated demon behavior with state machines
- **Real-time Multiplayer**: Robust networking with voice communication
- **Cross-platform Compatibility**: Runs on desktop, mobile, and tablet devices

### 🔧 **Technical Innovation**

- **TypeScript Architecture**: Type-safe game development with modern tooling
- **BSP Map Integration**: Support for classic Quake/Half-Life map formats
- **3D Audio System**: Immersive spatial sound with distance-based effects
- **Performance Optimization**: Efficient rendering with LOD and culling systems

### 📚 **Educational Value**

- **Code Quality**: Clean, well-documented, and maintainable codebase
- **Modern Practices**: Demonstrates current web development best practices
- **Comprehensive Testing**: Unit, integration, and performance test suites
- **Documentation**: Extensive guides for development and deployment

### 🌐 **Professional Platform**

- **Production Ready**: Scalable infrastructure with monitoring and logging
- **User Management**: Authentication, authorization, and subscription systems
- **Developer Tools**: Comprehensive development and debugging utilities
- **Community Features**: Support for user-generated content and modding

## 🔗 Component Links

### 🎮 **Game Clients**

- **[TypeScript Client](./client-ts/)** - Modern implementation with Vite + TypeScript
- **[JavaScript Client](./client/)** - Classic cyberpunk-themed version

### 🌐 **Infrastructure**

- **[Multiplayer Server](./server/)** - Node.js + Socket.IO real-time server
- **[Professional Website](./website/)** - Next.js platform with authentication
- **[BSP Map Viewer](./bspview/)** - Three.js-based map visualization tool
- **[AI Demon Generator](./demon-gen/)** - OpenSota AI-powered monster creation tool

### 📚 **Documentation**

- **[Project Documentation](./docs/)** - Comprehensive setup and development guides
- **[API Documentation](./docs/api/)** - Technical API references (if available)

## 🤝 Contributing

We welcome contributions to the DOOM PROTOCOL project! Please see our contributing guidelines:

1. **Fork the Repository**: Create your own fork of the project
2. **Create Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Follow Code Standards**: Use ESLint and Prettier for consistency
4. **Add Tests**: Include tests for new features
5. **Update Documentation**: Keep README and docs current
6. **Submit Pull Request**: Create a PR with clear description

### 🐛 **Bug Reports**

- Use GitHub Issues with detailed reproduction steps
- Include browser version, OS, and error messages
- Provide screenshots or video for visual bugs

### 💡 **Feature Requests**

- Check existing issues to avoid duplicates
- Provide clear use cases and benefits
- Consider implementation complexity

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 📞 Support & Community

- **GitHub Issues**: Bug reports and feature requests
- **Documentation**: Comprehensive guides in the `/docs` folder
- **Code Examples**: Working samples in each component directory

## 🙏 Acknowledgments

- **Three.js Community**: For the excellent 3D graphics library
- **Socket.IO Team**: For real-time communication infrastructure
- **Open Source Contributors**: For libraries and tools used throughout the project
- **Game Development Community**: For inspiration and technical guidance
- **Beta Testers**: For feedback and bug reporting during development

---

**🎮 Created with ❤️ using TypeScript, Three.js, and modern web technologies**  
_Experience the ultimate web-based FPS gaming platform with DOOM PROTOCOL_

**🚀 Ready to play? Start with the [TypeScript Client](./client-ts/) for the best experience!**
