# 🔥 DOOM PROTOCOL - TypeScript Client 🔥

一个使用 TypeScript 重构的现代化 FPS 游戏客户端，基于 Three.js 构建的地狱战斗竞技场。

## ✨ 特性

- 🎯 **完全类型安全**：使用 TypeScript 确保代码质量和可维护性
- 🎮 **模块化架构**：清晰的系统分离，便于扩展和维护
- 🔫 **多种武器系统**：霰弹枪、链枪、火箭发射器、等离子步枪
- 👹 **智能敌人 AI**：多种恶魔类型，具有不同的行为模式
- 🎵 **动态音频系统**：背景音乐和音效随游戏状态变化
- 🌐 **多人游戏支持**：实时网络对战功能
- 🎨 **现代化 UI**：响应式设计，支持移动设备
- 🧪 **完整测试**：单元测试和集成测试覆盖

## 🏗️ 项目结构

```
client-ts/
├── src/
│   ├── core/                 # 核心游戏系统
│   │   ├── Game.ts          # 主游戏管理器
│   │   ├── SceneManager.ts  # 3D场景管理
│   │   └── PlayerController.ts # 玩家控制
│   ├── systems/             # 游戏子系统
│   │   ├── WeaponSystem.ts  # 武器系统
│   │   ├── DemonSystem.ts   # 敌人AI系统
│   │   ├── AudioSystem.ts   # 音频管理
│   │   ├── NetworkManager.ts # 网络通信
│   │   └── UIManager.ts     # UI管理
│   ├── types/               # TypeScript 类型定义
│   │   ├── game.ts         # 游戏核心类型
│   │   ├── weapons.ts      # 武器系统类型
│   │   ├── demons.ts       # 敌人系统类型
│   │   ├── audio.ts        # 音频系统类型
│   │   ├── network.ts      # 网络类型
│   │   └── global.d.ts     # 全局类型声明
│   ├── config/             # 游戏配置
│   │   ├── game.ts         # 游戏常量配置
│   │   └── audio.ts        # 音频配置
│   ├── styles/             # 样式文件
│   │   └── main.css        # 主样式
│   ├── main.ts             # 程序入口
│   └── index.html          # HTML模板
├── tests/                  # 测试文件
│   ├── core/               # 核心系统测试
│   ├── systems/            # 子系统测试
│   └── setup.ts            # 测试环境设置
├── dist/                   # 构建输出目录
├── package.json            # 项目依赖
├── tsconfig.json           # TypeScript配置
├── webpack.config.js       # Webpack配置
├── jest.config.js          # Jest测试配置
└── .eslintrc.js           # ESLint配置
```

## 🚀 快速开始

### 前置要求

- Node.js (v16.0.0 或更高版本)
- npm 或 yarn

### 安装依赖

```bash
cd client-ts
npm install
```

### 开发模式

```bash
npm run dev
```

这将启动开发服务器，默认在 `http://localhost:3000` 访问。

### 构建生产版本

```bash
npm run build
```

构建文件将输出到 `dist/` 目录。

### 运行测试

```bash
# 运行所有测试
npm test

# 监视模式运行测试
npm run test:watch

# 生成测试覆盖率报告
npm test -- --coverage
```

### 代码质量检查

```bash
# TypeScript 类型检查
npm run type-check

# ESLint 代码检查
npm run lint

# 自动修复 ESLint 问题
npm run lint:fix
```

## 🎮 游戏控制

### 基本控制

- **W/A/S/D**: 移动
- **鼠标**: 视角控制和瞄准
- **左键/空格**: 射击
- **R**: 重新装弹
- **1-4**: 切换武器
- **ESC**: 暂停/设置

### 武器系统

- **🔫 霰弹枪**: 近距离高伤害，子弹散射
- **⚡ 链枪**: 高射速自动武器
- **🚀 火箭发射器**: 爆炸范围伤害
- **🔥 等离子步枪**: 高精度能量武器

## 🏛️ 架构设计

### 设计原则

1. **单一职责原则**: 每个类和模块只负责一个特定功能
2. **依赖注入**: 通过接口和依赖注入实现松耦合
3. **类型安全**: 全面的 TypeScript 类型定义
4. **可测试性**: 所有组件都易于单元测试
5. **可扩展性**: 模块化设计便于添加新功能

### 核心系统

- **Game**: 主游戏循环和状态管理
- **SceneManager**: Three.js 场景和渲染管理
- **PlayerController**: 玩家输入和移动控制
- **WeaponSystem**: 武器逻辑和子弹系统
- **DemonSystem**: 敌人 AI 和行为管理
- **AudioSystem**: 音频播放和管理
- **NetworkManager**: 多人游戏网络通信
- **UIManager**: 用户界面更新和交互

## 🧪 测试策略

### 测试类型

1. **单元测试**: 测试单个类和函数
2. **集成测试**: 测试系统间的交互
3. **端到端测试**: 测试完整的游戏流程

### 测试覆盖

- 核心游戏逻辑: 95%+
- 系统组件: 90%+
- 配置和类型: 100%

## 📈 性能优化

### 已实现优化

- **对象池**: 重用子弹和敌人对象
- **LOD 系统**: 距离基础的细节层次
- **音频优化**: 按需加载和预缓存
- **代码分割**: Webpack 自动代码分割
- **Tree Shaking**: 移除未使用的代码

### 性能监控

使用浏览器开发者工具监控：

- FPS (目标: 60fps)
- 内存使用
- 网络传输
- 渲染性能

## 🔧 开发工具

### 推荐的 VS Code 扩展

- TypeScript 和 JavaScript 支持
- ESLint
- Prettier
- Auto Rename Tag
- GitLens

### 调试

游戏实例暴露在全局 `window.game` 对象上，便于调试：

```javascript
// 在浏览器控制台中
game.getGameState(); // 获取当前游戏状态
game.getPlayerState(); // 获取玩家状态
game.getGameStats(); // 获取游戏统计
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/new-feature`)
3. 提交更改 (`git commit -am 'Add new feature'`)
4. 推送到分支 (`git push origin feature/new-feature`)
5. 创建 Pull Request

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 编写测试覆盖新功能
- 更新文档

## 📄 许可证

MIT License - 详见 LICENSE 文件

## 🙋 支持和反馈

如有问题或建议，请：

1. 创建 Issue
2. 参与 Discussions
3. 联系开发团队

---

**🔥 欢迎来到地狱战斗竞技场！准备好面对恶魔军团了吗？🔥**
