# 单人模式地图选择功能

## 功能概述

新增的地图选择功能允许玩家在单人模式下选择不同的地图环境进行游戏测试。该功能提供了直观的图形界面，支持多种地图类型和主题。

## 功能特点

### 🎨 **生成环境地图**

- **Hell Theme** (🔥) - 经典地狱景观，充满熔岩和恶魔
- **Ice Theme** (❄️) - 冰冻荒原，有冰洞穴
- **Toxic Theme** (☢️) - 受污染的工业废土
- **Industrial Theme** (🏭) - 高科技机械设施
- **Doom Map** (🏛️) - 经典 E1M1 迷宫重制版

### 🗺️ **经典 BSP 地图**

- **de_dust2** (🏜️) - Counter-Strike 最经典的地图
- **quake_start** (⚡) - Quake 经典起始关卡

### 🎲 **随机选择**

- **Random Map** (🎲) - 让命运决定你的战场

## 使用方法

### 1. 访问地图选择菜单

1. 从主菜单点击 **"👤 SINGLE PLAYER TRAINING"**
2. 进入地图选择界面

### 2. 选择地图

1. 浏览不同分类的地图
2. 点击任意地图卡片进行选择
3. 查看地图详细信息和难度
4. 点击 **"🎮 BEGIN TRAINING"** 开始游戏

### 3. 地图信息

每个地图卡片显示：

- **主题图标**和名称
- **简要描述**
- **难度等级**（1-5 星）
- **动态预览**效果

## 界面设计

### 视觉特效

- **动态渐变**背景预览
- **悬停效果**和选择高亮
- **响应式设计**适配不同屏幕
- **平滑过渡**动画

### 交互功能

- **点击选择**地图
- **实时反馈**选择状态
- **详细信息**显示
- **一键返回**主菜单

## 技术实现

### HTML 结构

```html
<!-- 地图选择菜单 -->
<div id="mapSelectionMenu" class="menu-screen">
  <div class="map-selection-grid">
    <div class="map-category">
      <div class="map-grid">
        <div class="map-card" data-theme="hell" data-type="theme">
          <div class="map-preview hell-preview"></div>
          <div class="map-info">
            <h4>🔥 Hell Theme</h4>
            <p>Classic infernal landscape</p>
            <div class="map-difficulty">★★★☆☆</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

### CSS 样式

```css
.map-card {
  background: linear-gradient(135deg, #2a2a2a, #1a1a1a);
  border: 2px solid #444;
  cursor: pointer;
  transition: all 0.3s ease;
}

.map-card:hover {
  transform: translateY(-8px);
  border-color: #ff6600;
  box-shadow: 0 12px 30px rgba(255, 102, 0, 0.3);
}

.map-card.selected {
  border-color: #00ff00;
  background: linear-gradient(135deg, #003300, #001a00);
}
```

### JavaScript 逻辑

```typescript
function setupMapSelectionEventListeners(): void {
  const mapCards = document.querySelectorAll(".map-card");
  mapCards.forEach((card) => {
    card.addEventListener("click", () => {
      // 选择地图逻辑
      selectMap(card);
    });
  });
}

async function startSinglePlayerWithMap(
  theme: string,
  type: string,
  mapPath?: string
): Promise<void> {
  if (type === "bsp" && mapPath) {
    // BSP地图
    await game.initialize(theme, mapPath);
  } else if (theme === "random") {
    // 随机主题
    const randomTheme = getRandomTheme();
    await game.startGame(false, randomTheme);
  } else {
    // 常规主题
    await game.startGame(false, theme);
  }
}
```

## 地图难度说明

### ★★☆☆☆ (简单)

- **Ice Theme** - 相对开阔的环境，视野良好

### ★★★☆☆ (中等)

- **Hell Theme** - 经典地狱环境，平衡的挑战
- **Industrial Theme** - 机械设施，适中的复杂度
- **quake_start** - Quake 经典关卡，熟悉的布局
- **Random Map** - 难度取决于随机选择

### ★★★★☆ (困难)

- **Toxic Theme** - 危险的污染环境，需要谨慎
- **Doom Map** - 复杂的迷宫结构，导航挑战

### ★★★★★ (专家)

- **de_dust2** - 专业竞技地图，最高挑战

## 扩展功能

### 未来计划

1. **自定义地图**上传功能
2. **地图编辑器**集成
3. **更多 BSP 地图**支持
4. **地图评分**系统
5. **玩家创建地图**分享

### 开发者接口

```typescript
// 添加新地图
function addCustomMap(mapData: MapDefinition): void {
  // 实现自定义地图添加逻辑
}

// 获取可用地图列表
function getAvailableMaps(): MapInfo[] {
  return [...themeBasedMaps, ...bspMaps];
}
```

## 最佳实践

### 性能优化

- **延迟加载**大型 BSP 文件
- **缓存机制**避免重复加载
- **预览优化**使用轻量级效果

### 用户体验

- **清晰分类**便于选择
- **视觉反馈**确认选择
- **错误处理**优雅降级

### 测试建议

1. **逐个测试**每种地图类型
2. **验证 BSP**地图加载正常
3. **确认随机**功能工作
4. **检查响应式**设计

## 故障排除

### 常见问题

#### BSP 地图无法加载

**症状**: 点击 BSP 地图后显示 fallback 几何体
**解决**: 确保 BSP 文件在 `public/maps/bsp/` 目录下

#### 地图选择无响应

**症状**: 点击地图卡片没有反应
**解决**: 检查浏览器控制台错误，确认事件监听器正确绑定

#### 样式显示异常

**症状**: 地图预览或布局错误
**解决**: 清除浏览器缓存，确认 CSS 文件正确加载

### 调试命令

```javascript
// 在浏览器控制台中
console.log(window.game.getSceneManager().getAvailableThemes());
console.log(window.game.getSceneManager().getAvailableBSPMaps());
```

## 总结

地图选择功能显著提升了单人模式的可玩性和测试便利性。通过直观的界面设计和完善的功能实现，玩家可以轻松体验游戏中的各种环境和地图类型。

该功能为游戏提供了：

- ✅ **更好的用户体验** - 直观的地图选择界面
- ✅ **测试便利性** - 快速切换不同环境
- ✅ **视觉吸引力** - 精美的预览效果
- ✅ **扩展性** - 易于添加新地图类型

这一实现为后续的地图生态系统发展奠定了坚实基础。
