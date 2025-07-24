# Quick Refactoring Scripts

## Automated Refactoring Tools

### 1. Directory Structure Creation Script

Create `scripts/setup-structure.js`:

```javascript
#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Directory structure definition
const DIRECTORY_STRUCTURE = {
  "client/src": {
    core: ["Engine.js", "GameState.js", "EventBus.js", "ResourceManager.js"],
    systems: {
      audio: ["AudioManager.js", "SoundEffects.js", "VoiceChat.js"],
      rendering: ["SceneManager.js", "LightingManager.js", "EffectsManager.js"],
      physics: ["CollisionManager.js", "MovementController.js"],
      ai: ["DemonAI.js", "PathFinding.js", "BehaviorTree.js"],
      weapons: ["WeaponManager.js", "BulletSystem.js", "WeaponTypes.js"],
      ui: ["UIManager.js", "MenuSystem.js", "HUD.js", "RadarSystem.js"],
      network: ["NetworkManager.js", "RoomManager.js", "PlayerSync.js"],
    },
    entities: [
      "Player.js",
      "Demon.js",
      "Bullet.js",
      "AmmoPack.js",
      "HealthPack.js",
    ],
    utils: [
      "MathUtils.js",
      "GeometryUtils.js",
      "ColorUtils.js",
      "PerformanceUtils.js",
    ],
    config: [
      "GameConfig.js",
      "WeaponConfig.js",
      "DemonConfig.js",
      "UIConfig.js",
    ],
  },
};

/**
 * Recursively create directory structure
 */
function createDirectoryStructure(basePath, structure) {
  Object.keys(structure).forEach((key) => {
    const currentPath = path.join(basePath, key);

    if (Array.isArray(structure[key])) {
      // Create directory
      if (!fs.existsSync(currentPath)) {
        fs.mkdirSync(currentPath, { recursive: true });
        console.log(`📁 Created directory: ${currentPath}`);
      }

      // Create file templates
      structure[key].forEach((fileName) => {
        const filePath = path.join(currentPath, fileName);
        if (!fs.existsSync(filePath)) {
          createFileTemplate(filePath, fileName);
        }
      });
    } else {
      // Recursively handle subdirectories
      if (!fs.existsSync(currentPath)) {
        fs.mkdirSync(currentPath, { recursive: true });
      }
      createDirectoryStructure(currentPath, structure[key]);
    }
  });
}

/**
 * Create file template
 */
function createFileTemplate(filePath, fileName) {
  const moduleName = path.basename(fileName, ".js");
  const category = path.basename(path.dirname(filePath));

  const template = `/**
 * @module ${moduleName}
 * @description ${getModuleDescription(moduleName, category)}
 * @aiModifiable true
 * @aiTags [${getModuleTags(moduleName, category).join(", ")}]
 * @created ${new Date().toISOString().split("T")[0]}
 */

class ${moduleName} {
    constructor() {
        console.log('🔧 ${moduleName} initialized');
    }
    
    /**
     * Initialize ${moduleName}
     */
    init() {
        // TODO: Implement initialization logic
    }
    
    /**
     * Update ${moduleName}
     * @param {number} deltaTime - Time delta
     */
    update(deltaTime) {
        // TODO: Implement update logic
    }
    
    /**
     * Destroy ${moduleName}
     */
    destroy() {
        // TODO: Implement cleanup logic
    }
}

export default ${moduleName};
`;

  fs.writeFileSync(filePath, template);
  console.log(`📄 Created file template: ${filePath}`);
}

/**
 * Get module description
 */
function getModuleDescription(moduleName, category) {
  const descriptions = {
    // Core
    Engine: "Game engine core",
    GameState: "Game state management",
    EventBus: "Event bus system",
    ResourceManager: "Resource manager",

    // Audio
    AudioManager: "Audio manager",
    SoundEffects: "Sound effects system",
    VoiceChat: "Voice chat system",

    // Weapons
    WeaponManager: "Weapon manager",
    BulletSystem: "Bullet system",
    WeaponTypes: "Weapon type definitions",

    // AI
    DemonAI: "Demon AI system",
    PathFinding: "Pathfinding algorithm",
    BehaviorTree: "Behavior tree system",

    // Utils
    MathUtils: "Mathematical utility functions",
    GeometryUtils: "Geometric utility functions",
    ColorUtils: "Color utility functions",
    PerformanceUtils: "Performance utility functions",
  };

  return descriptions[moduleName] || `${moduleName} module`;
}

/**
 * Get module tags
 */
function getModuleTags(moduleName, category) {
  const tagMap = {
    Engine: ["core", "engine", "system"],
    GameState: ["state", "management", "core"],
    EventBus: ["events", "communication", "core"],
    WeaponManager: ["weapons", "combat", "manager"],
    DemonAI: ["ai", "demons", "behavior"],
    AudioManager: ["audio", "sound", "manager"],
    MathUtils: ["math", "utils", "calculations"],
  };

  return (
    tagMap[moduleName] || [category.toLowerCase(), moduleName.toLowerCase()]
  );
}

// Execute script
console.log("🚀 Creating modular structure for DOOM Protocol...");
createDirectoryStructure(".", DIRECTORY_STRUCTURE);
console.log("✅ Directory structure created successfully!");
```

### 2. Configuration Extraction Script

Create `scripts/extract-configs.js`:

```javascript
#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

/**
 * Tool for extracting configurations from script.js
 */
class ConfigExtractor {
  constructor(sourceFile) {
    this.sourceFile = sourceFile;
    this.sourceCode = fs.readFileSync(sourceFile, "utf8");
    this.extractedConfigs = {};
  }

  /**
   * Extract demon types configuration
   */
  extractDemonTypes() {
    const demonTypesRegex = /const DEMON_TYPES = \{([\s\S]*?)\};/;
    const match = this.sourceCode.match(demonTypesRegex);

    if (match) {
      const configContent = `/**
 * @module DemonConfig
 * @description Demon types and AI configuration
 * @aiModifiable true
 * @aiTags [demons, ai, balance, enemies]
 */

export const DEMON_TYPES_CONFIG = {${match[1]}};

// AI behavior configuration
export const AI_CONFIG = {
    UPDATE_FREQUENCY: 2,
    MAX_UPDATE_DISTANCE: 100,
    PATHFINDING: {
        OBSTACLE_AVOIDANCE: true,
        NODE_SIZE: 2,
        MAX_PATH_LENGTH: 50
    },
    BEHAVIOR_STATES: {
        IDLE: 'idle',
        WANDERING: 'wandering',
        CHASING: 'chasing',
        ATTACKING: 'attacking',
        FALLING: 'falling',
        DEAD: 'dead'
    }
};
`;
      this.saveConfig("client/src/config/DemonConfig.js", configContent);
      return true;
    }
    return false;
  }

  /**
   * Extract weapon configuration
   */
  extractWeaponConfig() {
    const weaponsRegex = /const WEAPONS = \{([\s\S]*?)\};/;
    const match = this.sourceCode.match(weaponsRegex);

    if (match) {
      const configContent = `/**
 * @module WeaponConfig
 * @description Weapon configuration and balance parameters
 * @aiModifiable true
 * @aiTags [weapons, balance, combat]
 */

export const WEAPONS_CONFIG = {${match[1]}};

// Bullet configuration
export const BULLET_CONFIG = {
    SPEED: 50,
    LIFETIME: 3000,
    SIZE: 0.02,
    COLOR: 0xffff00,
    EMISSIVE_COLOR: 0xffaa00,
    EMISSIVE_INTENSITY: 0.5
};
`;
      this.saveConfig("client/src/config/WeaponConfig.js", configContent);
      return true;
    }
    return false;
  }

  /**
   * Extract game configuration
   */
  extractGameConfig() {
    // Extract various game constants
    const configs = this.extractVariables([
      "DEMON_COUNT",
      "BULLET_SPEED",
      "BULLET_LIFETIME",
      "MAX_HEALTH_PACKS",
      "HEALTH_PACK_HEAL_AMOUNT",
      "AMMO_PACK_REFILL_AMOUNT",
      "RADAR_RANGE",
      "RADAR_SIZE",
    ]);

    const configContent = `/**
 * @module GameConfig
 * @description Core game configuration
 * @aiModifiable true
 * @aiTags [config, game-balance, settings]
 */

export const GAME_CONFIG = {
    SCENE: {
        BOUNDARY: 45,
        GROUND_SIZE: 100,
        SKY_COLOR: 0x87ceeb,
        FOG_DENSITY: 0.002
    },
    
    PERFORMANCE: {
        MAX_DEMONS: ${configs.DEMON_COUNT || 50},
        MAX_BULLETS: 100,
        TARGET_FPS: 60,
        UPDATE_FREQUENCY: 16.67
    },
    
    PLAYER: {
        HEIGHT: 1.8,
        MOVE_SPEED: 400,
        MAX_HEALTH: 100,
        INVULNERABILITY_TIME: 1000
    },
    
    RADAR: {
        RANGE: ${configs.RADAR_RANGE || 50},
        SIZE: ${configs.RADAR_SIZE || 120}
    },
    
    ITEMS: {
        MAX_HEALTH_PACKS: ${configs.MAX_HEALTH_PACKS || 3},
        MAX_AMMO_PACKS: 2,
        HEALTH_HEAL_AMOUNT: ${configs.HEALTH_PACK_HEAL_AMOUNT || 25},
        AMMO_REFILL_AMOUNT: ${configs.AMMO_PACK_REFILL_AMOUNT || 60}
    }
};

export const WAVE_CONFIG = {
    INITIAL_DEMONS: 5,
    DEMONS_PER_WAVE_INCREASE: 2,
    MAX_DEMONS_PER_WAVE: 20,
    TIME_BETWEEN_WAVES: 5000,
    SPAWN_INTERVAL: 1000
};
`;

    this.saveConfig("client/src/config/GameConfig.js", configContent);
    return true;
  }

  /**
   * Extract variable values
   */
  extractVariables(varNames) {
    const result = {};

    varNames.forEach((varName) => {
      const regex = new RegExp(`const ${varName}\\s*=\\s*([^;]+);`, "g");
      const match = regex.exec(this.sourceCode);
      if (match) {
        result[varName] = match[1].trim();
      }
    });

    return result;
  }

  /**
   * Save configuration file
   */
  saveConfig(filePath, content) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, content);
    console.log(`✅ Config extracted to: ${filePath}`);
  }

  /**
   * Execute all extraction operations
   */
  extractAll() {
    console.log("🔧 Extracting configurations from script.js...");

    const results = {
      demonTypes: this.extractDemonTypes(),
      weapons: this.extractWeaponConfig(),
      game: this.extractGameConfig(),
    };

    console.log("📊 Extraction results:", results);
    return results;
  }
}

// Execute extraction
if (require.main === module) {
  const extractor = new ConfigExtractor("client/script.js");
  extractor.extractAll();
}

module.exports = ConfigExtractor;
```

### 3. Function Extraction Script

Create `scripts/extract-functions.js`:

```javascript
#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

/**
 * Function extraction tool
 */
class FunctionExtractor {
  constructor(sourceFile) {
    this.sourceFile = sourceFile;
    this.sourceCode = fs.readFileSync(sourceFile, "utf8");
  }

  /**
   * Extract math utility functions
   */
  extractMathUtils() {
    const mathFunctions = [
      "calculateDistance",
      "clamp",
      "lerp",
      "random",
      "degToRad",
      "radToDeg",
    ];

    const extractedFunctions = this.extractFunctionsByNames(mathFunctions);

    const utilsContent = `/**
 * @module MathUtils
 * @description Mathematical utility functions
 * @aiModifiable true
 * @aiTags [math, utils, calculations]
 */

export class MathUtils {
    ${extractedFunctions
      .map((func) => this.convertToStaticMethod(func))
      .join("\n    ")}
    
    /**
     * Calculate distance between two points
     */
    static distance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    /**
     * Clamp value to range
     */
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    /**
     * Linear interpolation
     */
    static lerp(a, b, t) {
        return a + (b - a) * this.clamp(t, 0, 1);
    }
}

export default MathUtils;
`;

    this.saveFile("client/src/utils/MathUtils.js", utilsContent);
  }

  /**
   * Extract weapon-related functions
   */
  extractWeaponFunctions() {
    const weaponFunctions = [
      "createGun",
      "createMachineGun",
      "shoot",
      "createBullet",
      "updateBullets",
      "switchWeapon",
      "triggerGunRecoil",
      "updateGunPosition",
    ];

    const extractedFunctions = this.extractFunctionsByNames(weaponFunctions);

    // Can generate initial version of WeaponManager here
    console.log(
      `📦 Found ${extractedFunctions.length} weapon-related functions`
    );
  }

  /**
   * Extract functions by names
   */
  extractFunctionsByNames(functionNames) {
    const functions = [];

    functionNames.forEach((funcName) => {
      const regex = new RegExp(
        `function\\s+${funcName}\\s*\\([^)]*\\)\\s*\\{`,
        "g"
      );
      const match = regex.exec(this.sourceCode);

      if (match) {
        const funcStart = match.index;
        const funcBody = this.extractFunctionBody(funcStart);

        functions.push({
          name: funcName,
          body: funcBody,
          startIndex: funcStart,
        });
      }
    });

    return functions;
  }

  /**
   * Extract function body
   */
  extractFunctionBody(startIndex) {
    let braceCount = 0;
    let i = startIndex;
    let started = false;

    while (i < this.sourceCode.length) {
      const char = this.sourceCode[i];

      if (char === "{") {
        braceCount++;
        started = true;
      } else if (char === "}") {
        braceCount--;

        if (started && braceCount === 0) {
          return this.sourceCode.substring(startIndex, i + 1);
        }
      }

      i++;
    }

    return "";
  }

  /**
   * Convert function to static method
   */
  convertToStaticMethod(func) {
    return func.body.replace(/^function\s+(\w+)/, "static $1");
  }

  /**
   * Save file
   */
  saveFile(filePath, content) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, content);
    console.log(`✅ Functions extracted to: ${filePath}`);
  }

  /**
   * Execute all extractions
   */
  extractAll() {
    console.log("🔧 Extracting functions from script.js...");

    this.extractMathUtils();
    this.extractWeaponFunctions();

    console.log("✅ Function extraction completed");
  }
}

// Execute extraction
if (require.main === module) {
  const extractor = new FunctionExtractor("client/script.js");
  extractor.extractAll();
}

module.exports = FunctionExtractor;
```

### 4. One-Click Refactoring Script

Create `scripts/refactor.js`:

```javascript
#!/usr/bin/env node

const ConfigExtractor = require("./extract-configs");
const FunctionExtractor = require("./extract-functions");
const { execSync } = require("child_process");
const fs = require("fs");

/**
 * Main refactoring script
 */
class MainRefactor {
  constructor() {
    this.steps = [
      "Create directory structure",
      "Extract configurations",
      "Extract utility functions",
      "Create main entry point",
      "Update HTML imports",
      "Create build script",
    ];
    this.currentStep = 0;
  }

  /**
   * Show progress
   */
  showProgress(step) {
    this.currentStep++;
    console.log(`\n📋 Step ${this.currentStep}/${this.steps.length}: ${step}`);
    console.log("=".repeat(50));
  }

  /**
   * Execute complete refactoring
   */
  async refactor() {
    console.log("🚀 Starting complete refactoring process...");
    console.log(`📝 Total steps: ${this.steps.length}\n`);

    try {
      // Step 1: Create directory structure
      this.showProgress("Create directory structure");
      execSync("node scripts/setup-structure.js", { stdio: "inherit" });

      // Step 2: Extract configurations
      this.showProgress("Extract configurations");
      const configExtractor = new ConfigExtractor("client/script.js");
      configExtractor.extractAll();

      // Step 3: Extract functions
      this.showProgress("Extract utility functions");
      const functionExtractor = new FunctionExtractor("client/script.js");
      functionExtractor.extractAll();

      // Step 4: Create main entry
      this.showProgress("Create main entry point");
      this.createMainEntryPoint();

      // Step 5: Update HTML
      this.showProgress("Update HTML imports");
      this.updateHTMLImports();

      // Step 6: Create build script
      this.showProgress("Create build script");
      this.createBuildScript();

      console.log("\n🎉 Refactoring completed successfully!");
      this.showNextSteps();
    } catch (error) {
      console.error("\n❌ Refactoring failed:", error.message);
      process.exit(1);
    }
  }

  /**
   * Create main entry file
   */
  createMainEntryPoint() {
    const mainContent = `/**
 * @module Main
 * @description Game main entry file - Refactored version
 */

// Import configurations
import { GAME_CONFIG } from './src/config/GameConfig.js';
import { WEAPONS_CONFIG } from './src/config/WeaponConfig.js';
import { DEMON_TYPES_CONFIG } from './src/config/DemonConfig.js';

// Import core systems
import EventBus from './src/core/EventBus.js';
import GameState from './src/core/GameState.js';

// Import utilities
import MathUtils from './src/utils/MathUtils.js';

// Global variables (compatibility)
window.GAME_CONFIG = GAME_CONFIG;
window.WEAPONS_CONFIG = WEAPONS_CONFIG;
window.DEMON_TYPES_CONFIG = DEMON_TYPES_CONFIG;
window.MathUtils = MathUtils;

// Game instance
let gameInstance = null;

/**
 * Initialize game
 */
async function initGame() {
    console.log('🎮 Initializing modular DOOM Protocol...');
    
    try {
        // Create core systems
        const eventBus = new EventBus();
        const gameState = new GameState();
        
        // TODO: Initialize other systems
        
        gameInstance = {
            eventBus,
            gameState,
            // ... other systems
        };
        
        console.log('✅ Modular game initialized');
        return gameInstance;
        
    } catch (error) {
        console.error('❌ Game initialization failed:', error);
        throw error;
    }
}

// Compatibility functions
window.startGame = () => {
    if (gameInstance) {
        gameInstance.gameState.setState('playing');
    }
};

window.pauseGame = () => {
    if (gameInstance) {
        gameInstance.gameState.setState('paused');
    }
};

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    initGame().catch(console.error);
});
`;

    fs.writeFileSync("client/main-modular.js", mainContent);
    console.log("✅ Main entry point created: client/main-modular.js");
  }

  /**
   * Update HTML imports
   */
  updateHTMLImports() {
    const htmlFile = "client/index.html";

    if (fs.existsSync(htmlFile)) {
      let htmlContent = fs.readFileSync(htmlFile, "utf8");

      // Add modular version comment before script.js
      const scriptTag = '<script src="script.js?v=20250724"></script>';
      const newScriptSection = `
    <!-- Original version -->
    <script src="script.js?v=20250724"></script>
    
    <!-- Modular version (in development) -->
    <!-- <script type="module" src="main-modular.js"></script> -->`;

      htmlContent = htmlContent.replace(scriptTag, newScriptSection);

      fs.writeFileSync(htmlFile, htmlContent);
      console.log("✅ HTML imports updated");
    }
  }

  /**
   * Create build script
   */
  createBuildScript() {
    const buildScript = `#!/usr/bin/env node

/**
 * Simple module bundling tool
 */

const fs = require('fs');
const path = require('path');

class SimpleBundler {
    constructor() {
        this.modules = new Map();
        this.dependencies = new Map();
    }
    
    /**
     * Build single bundle file
     */
    async build() {
        console.log('🔨 Building modular bundle...');
        
        const entryPoint = 'client/main-modular.js';
        const outputFile = 'client/bundle.js';
        
        // Read entry file
        const mainContent = fs.readFileSync(entryPoint, 'utf8');
        
        // Simple module merging (recommend webpack or rollup for production)
        let bundleContent = \`
// DOOM Protocol - Modular Bundle
// Generated on \${new Date().toISOString()}

\${mainContent}
\`;
        
        fs.writeFileSync(outputFile, bundleContent);
        console.log(\`✅ Bundle created: \${outputFile}\`);
    }
}

// Execute build
if (require.main === module) {
    const bundler = new SimpleBundler();
    bundler.build().catch(console.error);
}

module.exports = SimpleBundler;
`;

    fs.writeFileSync("scripts/build.js", buildScript);
    fs.chmodSync("scripts/build.js", "755");
    console.log("✅ Build script created: scripts/build.js");
  }

  /**
   * Show next steps
   */
  showNextSteps() {
    console.log(`
📚 Next Steps:

1. 📁 Review the generated modular structure in client/src/
2. 🔧 Implement the TODO items in the generated module templates
3. 🧪 Test the modular version by uncommenting the import in index.html
4. 📝 Gradually move functions from script.js to appropriate modules
5. 🚀 Use the build script when ready: node scripts/build.js

📖 Documentation:
- Architecture guide: docs/js-code-organization-schemes-en.md
- Implementation guide: docs/refactoring-implementation-guide-en.md

🎯 Priority modules to implement first:
1. WeaponManager (most critical for gameplay)
2. GameState (needed for state management)  
3. AudioManager (for sound effects)
4. DemonAI (for enemy behavior)

💡 Tips:
- Start by moving configuration objects first
- Test each module independently
- Keep the original script.js as backup
- Use the AI-friendly annotations for future development
        `);
  }
}

// Execute main refactoring
if (require.main === module) {
  const refactor = new MainRefactor();
  refactor.refactor();
}

module.exports = MainRefactor;
```

### 5. Usage

#### Create scripts directory and run:

```bash
# 1. Create scripts directory
mkdir scripts

# 2. Save script files to scripts directory

# 3. Give scripts execution permissions
chmod +x scripts/*.js

# 4. Run complete refactoring
node scripts/refactor.js
```

#### Or execute step by step:

```bash
# Create directory structure
node scripts/setup-structure.js

# Extract configurations
node scripts/extract-configs.js

# Extract functions
node scripts/extract-functions.js
```

### 6. Verify Refactoring Results

```bash
# Check directory structure
tree client/src

# Verify configuration files
node -e "
const config = require('./client/src/config/GameConfig.js');
console.log('Game config loaded:', Object.keys(config));
"

# Test modular version
# (Switch to modular version in index.html)
```

This set of scripts can automate most of the refactoring work, helping you quickly migrate from single-file architecture to modular architecture.
