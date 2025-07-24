# 快速重构脚本

## 自动化重构工具

### 1. 创建目录结构脚本

创建 `scripts/setup-structure.js`:

```javascript
#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// 目录结构定义
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
 * 递归创建目录结构
 */
function createDirectoryStructure(basePath, structure) {
  Object.keys(structure).forEach((key) => {
    const currentPath = path.join(basePath, key);

    if (Array.isArray(structure[key])) {
      // 创建目录
      if (!fs.existsSync(currentPath)) {
        fs.mkdirSync(currentPath, { recursive: true });
        console.log(`📁 Created directory: ${currentPath}`);
      }

      // 创建文件模板
      structure[key].forEach((fileName) => {
        const filePath = path.join(currentPath, fileName);
        if (!fs.existsSync(filePath)) {
          createFileTemplate(filePath, fileName);
        }
      });
    } else {
      // 递归处理子目录
      if (!fs.existsSync(currentPath)) {
        fs.mkdirSync(currentPath, { recursive: true });
      }
      createDirectoryStructure(currentPath, structure[key]);
    }
  });
}

/**
 * 创建文件模板
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
     * 初始化${moduleName}
     */
    init() {
        // TODO: 实现初始化逻辑
    }
    
    /**
     * 更新${moduleName}
     * @param {number} deltaTime - 时间增量
     */
    update(deltaTime) {
        // TODO: 实现更新逻辑
    }
    
    /**
     * 销毁${moduleName}
     */
    destroy() {
        // TODO: 实现清理逻辑
    }
}

export default ${moduleName};
`;

  fs.writeFileSync(filePath, template);
  console.log(`📄 Created file template: ${filePath}`);
}

/**
 * 获取模块描述
 */
function getModuleDescription(moduleName, category) {
  const descriptions = {
    // Core
    Engine: "游戏引擎核心",
    GameState: "游戏状态管理",
    EventBus: "事件总线系统",
    ResourceManager: "资源管理器",

    // Audio
    AudioManager: "音频管理器",
    SoundEffects: "音效系统",
    VoiceChat: "语音聊天系统",

    // Weapons
    WeaponManager: "武器管理器",
    BulletSystem: "子弹系统",
    WeaponTypes: "武器类型定义",

    // AI
    DemonAI: "恶魔AI系统",
    PathFinding: "路径寻找算法",
    BehaviorTree: "行为树系统",

    // Utils
    MathUtils: "数学工具函数",
    GeometryUtils: "几何工具函数",
    ColorUtils: "颜色工具函数",
    PerformanceUtils: "性能工具函数",
  };

  return descriptions[moduleName] || `${moduleName}模块`;
}

/**
 * 获取模块标签
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

// 执行脚本
console.log("🚀 Creating modular structure for DOOM Protocol...");
createDirectoryStructure(".", DIRECTORY_STRUCTURE);
console.log("✅ Directory structure created successfully!");
```

### 2. 配置提取脚本

创建 `scripts/extract-configs.js`:

```javascript
#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

/**
 * 从script.js提取配置的工具
 */
class ConfigExtractor {
  constructor(sourceFile) {
    this.sourceFile = sourceFile;
    this.sourceCode = fs.readFileSync(sourceFile, "utf8");
    this.extractedConfigs = {};
  }

  /**
   * 提取恶魔类型配置
   */
  extractDemonTypes() {
    const demonTypesRegex = /const DEMON_TYPES = \{([\s\S]*?)\};/;
    const match = this.sourceCode.match(demonTypesRegex);

    if (match) {
      const configContent = `/**
 * @module DemonConfig
 * @description 恶魔类型和AI配置
 * @aiModifiable true
 * @aiTags [demons, ai, balance, enemies]
 */

export const DEMON_TYPES_CONFIG = {${match[1]}};

// AI行为配置
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
   * 提取武器配置
   */
  extractWeaponConfig() {
    const weaponsRegex = /const WEAPONS = \{([\s\S]*?)\};/;
    const match = this.sourceCode.match(weaponsRegex);

    if (match) {
      const configContent = `/**
 * @module WeaponConfig
 * @description 武器配置和平衡参数
 * @aiModifiable true
 * @aiTags [weapons, balance, combat]
 */

export const WEAPONS_CONFIG = {${match[1]}};

// 子弹配置
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
   * 提取游戏配置
   */
  extractGameConfig() {
    // 提取各种游戏常量
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
 * @description 游戏核心配置
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
   * 提取变量值
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
   * 保存配置文件
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
   * 执行所有提取操作
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

// 执行提取
if (require.main === module) {
  const extractor = new ConfigExtractor("client/script.js");
  extractor.extractAll();
}

module.exports = ConfigExtractor;
```

### 3. 函数提取脚本

创建 `scripts/extract-functions.js`:

```javascript
#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

/**
 * 函数提取工具
 */
class FunctionExtractor {
  constructor(sourceFile) {
    this.sourceFile = sourceFile;
    this.sourceCode = fs.readFileSync(sourceFile, "utf8");
  }

  /**
   * 提取数学工具函数
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
 * @description 数学工具函数
 * @aiModifiable true
 * @aiTags [math, utils, calculations]
 */

export class MathUtils {
    ${extractedFunctions
      .map((func) => this.convertToStaticMethod(func))
      .join("\n    ")}
    
    /**
     * 计算两点之间的距离
     */
    static distance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    /**
     * 限制数值范围
     */
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    /**
     * 线性插值
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
   * 提取武器相关函数
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

    // 这里可以生成WeaponManager的初始版本
    console.log(
      `📦 Found ${extractedFunctions.length} weapon-related functions`
    );
  }

  /**
   * 根据函数名提取函数
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
   * 提取函数体
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
   * 将函数转换为静态方法
   */
  convertToStaticMethod(func) {
    return func.body.replace(/^function\s+(\w+)/, "static $1");
  }

  /**
   * 保存文件
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
   * 执行所有提取
   */
  extractAll() {
    console.log("🔧 Extracting functions from script.js...");

    this.extractMathUtils();
    this.extractWeaponFunctions();

    console.log("✅ Function extraction completed");
  }
}

// 执行提取
if (require.main === module) {
  const extractor = new FunctionExtractor("client/script.js");
  extractor.extractAll();
}

module.exports = FunctionExtractor;
```

### 4. 一键重构脚本

创建 `scripts/refactor.js`:

```javascript
#!/usr/bin/env node

const ConfigExtractor = require("./extract-configs");
const FunctionExtractor = require("./extract-functions");
const { execSync } = require("child_process");
const fs = require("fs");

/**
 * 主重构脚本
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
   * 显示进度
   */
  showProgress(step) {
    this.currentStep++;
    console.log(`\n📋 Step ${this.currentStep}/${this.steps.length}: ${step}`);
    console.log("=".repeat(50));
  }

  /**
   * 执行完整重构
   */
  async refactor() {
    console.log("🚀 Starting complete refactoring process...");
    console.log(`📝 Total steps: ${this.steps.length}\n`);

    try {
      // Step 1: 创建目录结构
      this.showProgress("Create directory structure");
      execSync("node scripts/setup-structure.js", { stdio: "inherit" });

      // Step 2: 提取配置
      this.showProgress("Extract configurations");
      const configExtractor = new ConfigExtractor("client/script.js");
      configExtractor.extractAll();

      // Step 3: 提取函数
      this.showProgress("Extract utility functions");
      const functionExtractor = new FunctionExtractor("client/script.js");
      functionExtractor.extractAll();

      // Step 4: 创建主入口
      this.showProgress("Create main entry point");
      this.createMainEntryPoint();

      // Step 5: 更新HTML
      this.showProgress("Update HTML imports");
      this.updateHTMLImports();

      // Step 6: 创建构建脚本
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
   * 创建主入口文件
   */
  createMainEntryPoint() {
    const mainContent = `/**
 * @module Main
 * @description 游戏主入口文件 - 重构版本
 */

// 导入配置
import { GAME_CONFIG } from './src/config/GameConfig.js';
import { WEAPONS_CONFIG } from './src/config/WeaponConfig.js';
import { DEMON_TYPES_CONFIG } from './src/config/DemonConfig.js';

// 导入核心系统
import EventBus from './src/core/EventBus.js';
import GameState from './src/core/GameState.js';

// 导入工具
import MathUtils from './src/utils/MathUtils.js';

// 全局变量 (兼容性)
window.GAME_CONFIG = GAME_CONFIG;
window.WEAPONS_CONFIG = WEAPONS_CONFIG;
window.DEMON_TYPES_CONFIG = DEMON_TYPES_CONFIG;
window.MathUtils = MathUtils;

// 游戏实例
let gameInstance = null;

/**
 * 初始化游戏
 */
async function initGame() {
    console.log('🎮 Initializing modular DOOM Protocol...');
    
    try {
        // 创建核心系统
        const eventBus = new EventBus();
        const gameState = new GameState();
        
        // TODO: 初始化其他系统
        
        gameInstance = {
            eventBus,
            gameState,
            // ... 其他系统
        };
        
        console.log('✅ Modular game initialized');
        return gameInstance;
        
    } catch (error) {
        console.error('❌ Game initialization failed:', error);
        throw error;
    }
}

// 兼容性函数
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

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    initGame().catch(console.error);
});
`;

    fs.writeFileSync("client/main-modular.js", mainContent);
    console.log("✅ Main entry point created: client/main-modular.js");
  }

  /**
   * 更新HTML导入
   */
  updateHTMLImports() {
    const htmlFile = "client/index.html";

    if (fs.existsSync(htmlFile)) {
      let htmlContent = fs.readFileSync(htmlFile, "utf8");

      // 在script.js之前添加模块化版本的注释
      const scriptTag = '<script src="script.js?v=20250724"></script>';
      const newScriptSection = `
    <!-- 原始版本 -->
    <script src="script.js?v=20250724"></script>
    
    <!-- 模块化版本 (开发中) -->
    <!-- <script type="module" src="main-modular.js"></script> -->`;

      htmlContent = htmlContent.replace(scriptTag, newScriptSection);

      fs.writeFileSync(htmlFile, htmlContent);
      console.log("✅ HTML imports updated");
    }
  }

  /**
   * 创建构建脚本
   */
  createBuildScript() {
    const buildScript = `#!/usr/bin/env node

/**
 * 简单的模块打包工具
 */

const fs = require('fs');
const path = require('path');

class SimpleBundler {
    constructor() {
        this.modules = new Map();
        this.dependencies = new Map();
    }
    
    /**
     * 构建单个bundle文件
     */
    async build() {
        console.log('🔨 Building modular bundle...');
        
        const entryPoint = 'client/main-modular.js';
        const outputFile = 'client/bundle.js';
        
        // 读取入口文件
        const mainContent = fs.readFileSync(entryPoint, 'utf8');
        
        // 简单的模块合并 (生产环境建议使用webpack或rollup)
        let bundleContent = \`
// DOOM Protocol - Modular Bundle
// Generated on \${new Date().toISOString()}

\${mainContent}
\`;
        
        fs.writeFileSync(outputFile, bundleContent);
        console.log(\`✅ Bundle created: \${outputFile}\`);
    }
}

// 执行构建
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
   * 显示后续步骤
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
- Architecture guide: docs/js-code-organization-schemes.md
- Implementation guide: docs/refactoring-implementation-guide.md

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

// 执行主重构
if (require.main === module) {
  const refactor = new MainRefactor();
  refactor.refactor();
}

module.exports = MainRefactor;
```

### 5. 使用方法

#### 创建 scripts 目录并运行：

```bash
# 1. 创建scripts目录
mkdir scripts

# 2. 将脚本文件保存到scripts目录

# 3. 给脚本执行权限
chmod +x scripts/*.js

# 4. 运行完整重构
node scripts/refactor.js
```

#### 或者分步执行：

```bash
# 创建目录结构
node scripts/setup-structure.js

# 提取配置
node scripts/extract-configs.js

# 提取函数
node scripts/extract-functions.js
```

### 6. 验证重构结果

```bash
# 检查目录结构
tree client/src

# 验证配置文件
node -e "
const config = require('./client/src/config/GameConfig.js');
console.log('Game config loaded:', Object.keys(config));
"

# 测试模块化版本
# (在index.html中切换到模块化版本)
```

这套脚本可以自动化大部分重构工作，帮助您快速从单文件架构迁移到模块化架构。
