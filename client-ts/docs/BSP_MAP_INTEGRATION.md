# BSP 地图集成系统

## 概述

本项目已成功集成 BSP（Binary Space Partitioning）地图系统，可以加载和渲染经典 FPS 游戏（如 Quake、Half-Life、Counter-Strike）的地图格式。BSP 格式专为 FPS 游戏设计，具有高效的空间分区和渲染性能。

## 技术架构

### 1. 核心组件

#### BSPMapTheme (`src/themes/BSPMapTheme.ts`)

- **功能**: 新的场景主题类，专门处理 BSP 地图
- **特点**:
  - 支持 BSP30 格式（Quake/GoldSrc 引擎）
  - 内置 BSP 文件解析器
  - 优化的渲染管线
  - 工业级照明系统

#### 主要数据结构

```typescript
interface BSPLump {
  name: string;
  offset: number;
  size: number;
}

interface BSPFace {
  plane: number;
  side: number;
  firstEdge: number;
  edges: number;
  textureInfo: number;
  lightmapOffset: number;
}
```

### 2. 集成到现有系统

#### SceneManager 更新

- 新增 `loadBSPMap()` 方法
- 支持 BSP 地图的特殊初始化流程
- 禁用边界墙（BSP 地图自带几何体）

#### Game 类增强

- 支持 BSP 地图 URL 参数
- 新增 `loadBSPMap()` 和 `getAvailableBSPMaps()` 方法

#### 主题注册

- 添加到 `SCENE_THEMES` 注册表
- 主题名称: `bspMap`
- 显示名称: "🗺️ BSP Map"

## 可用地图

项目包含以下经典 FPS 地图：

- `maps/bsp/de_dust2.bsp` - Counter-Strike 经典地图
- `maps/bsp/quake_start.bsp` - Quake 起始地图

## 使用方法

### 1. 浏览器控制台测试

```javascript
// 加载默认BSP地图 (de_dust2)
await testBSPMap();

// 加载指定BSP地图
await testBSPMap("maps/bsp/quake_start.bsp");

// 列出可用地图
listBSPMaps();
```

### 2. 编程方式使用

```typescript
// 通过SceneManager
const sceneManager = SceneManager.getInstance();
await sceneManager.loadBSPMap("maps/bsp/de_dust2.bsp");

// 通过Game实例
const game = Game.getInstance();
await game.loadBSPMap("maps/bsp/quake_start.bsp");

// 初始化时指定BSP主题
await game.initialize("bspMap", "maps/bsp/de_dust2.bsp");
```

### 3. 多人游戏集成

BSP 地图支持多人游戏模式，地图选择会同步到所有玩家：

```typescript
// 创建房间时指定BSP地图
networkManager.createRoom("BSP Arena", 4, "bspMap");
```

## 性能优化

### 1. 渲染优化

- **空间分区**: 使用 BSP 树进行高效的可见性剔除
- **顶点合并**: 减少 draw call 数量
- **材质优化**: 智能材质管理和纹理复用

### 2. 内存管理

- **流式加载**: 按需加载地图数据
- **垃圾回收**: 自动清理不用的资源
- **缓存策略**: 智能缓存常用地图数据

### 3. 与原有系统的兼容性

- **无边界墙**: BSP 地图提供自己的边界
- **自适应照明**: 根据地图特点调整光照
- **碰撞检测**: 复用现有的 CollisionSystem

## 技术特点

### 优势

1. **成熟格式**: BSP 是 FPS 游戏的工业标准
2. **高性能**: 内置空间分区优化
3. **丰富内容**: 大量现成的经典地图
4. **完整实现**: 基于成熟的 bspview 项目

### 当前限制

1. **简化解析**: 当前实现为基础版本，支持核心功能
2. **纹理支持**: 暂不支持 WAD 纹理文件
3. **版本限制**: 仅支持 BSP30 格式

## 扩展计划

### 第一阶段 (已完成)

- ✅ 基础 BSP 解析器
- ✅ 几何体渲染
- ✅ 场景集成
- ✅ 多人游戏支持

### 第二阶段 (规划中)

- 🔄 完整纹理支持
- 🔄 Lightmap 渲染
- 🔄 实体解析
- 🔄 音效定位

### 第三阶段 (未来)

- 📋 Source 引擎支持
- 📋 地图编辑器
- 📋 自定义地图上传

## 故障排除

### 常见问题

#### 1. 地图加载失败

```
❌ Failed to load BSP map: Failed to fetch BSP map: 404
```

**解决方案**: 确保 BSP 文件在正确路径 (`client-ts/public/maps/bsp/`)

#### 2. 版本不兼容

```
❌ Unsupported BSP version: 31
```

**解决方案**: 当前仅支持 BSP30 格式，请使用 Quake/GoldSrc 地图

#### 3. 渲染异常

```
🔄 Created fallback geometry for BSP map
```

**解决方案**: 地图解析失败，会自动创建简单的 fallback 几何体

### 调试信息

启用调试模式查看详细信息：

```javascript
// 在浏览器控制台中
localStorage.setItem("debug", "true");
```

## API 参考

### BSPMapTheme

```typescript
class BSPMapTheme extends BaseSceneTheme {
  // 加载BSP地图
  async loadBSPMap(mapUrl: string): Promise<void>;

  // 获取地图信息
  getMapInfo(): string;

  // 检查是否已加载地图
  hasMapLoaded(): boolean;
}
```

### SceneManager

```typescript
class SceneManager {
  // 加载BSP地图
  async loadBSPMap(mapUrl: string): Promise<void>;

  // 获取可用BSP地图列表
  getAvailableBSPMaps(): string[];

  // 初始化时指定BSP地图
  async initialize(
    themeName?: SceneThemeName,
    bspMapUrl?: string
  ): Promise<void>;
}
```

### Game

```typescript
class Game {
  // 加载BSP地图
  async loadBSPMap(mapUrl: string): Promise<void>;

  // 获取可用BSP地图
  getAvailableBSPMaps(): string[];

  // 初始化时指定BSP地图
  async initialize(
    themeName?: SceneThemeName,
    bspMapUrl?: string
  ): Promise<void>;
}
```

## 实现细节

### BSP 文件结构

```
BSP Header (4 bytes) - 版本号
Lump Directory (15 * 8 bytes) - 数据块索引
├── ENTITIES - 游戏实体
├── PLANES - 分割平面
├── TEXTURES - 纹理信息
├── VERTICES - 顶点数据
├── VISIBILITY - 可见性数据
├── NODES - BSP树节点
├── TEXINFO - 纹理映射
├── FACES - 面数据
├── LIGHTING - 光照数据
├── CLIPNODES - 碰撞节点
├── LEAVES - BSP叶子
├── MARKSURFACES - 表面标记
├── EDGES - 边数据
├── SURFEDGES - 表面边
└── MODELS - 模型数据
```

### 坐标系转换

```typescript
// Quake坐标 → Three.js坐标
new THREE.Vector3(y, z, x);
```

### 材质系统

```typescript
// 基础材质创建
const material = new THREE.MeshLambertMaterial({
  color: this.config.primaryColor,
  wireframe: false,
});
```

## 结论

BSP 地图集成提供了一个高性能、可扩展的解决方案，使游戏能够使用经典 FPS 地图格式。该实现在保持与现有系统兼容性的同时，显著提升了地图的多样性和视觉质量。

通过渐进式的功能扩展，这个系统将为游戏提供完整的地图生态系统支持。
