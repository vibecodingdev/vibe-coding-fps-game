# 服务端测试文档

这个测试套件为 Doom Protocol 游戏服务器提供了全面的测试覆盖。

## 测试结构

```
tests/
├── setup.ts                 # 全局测试设置
├── utils/
│   └── test-helpers.ts      # 测试工具函数
├── unit/
│   └── helpers.test.ts      # 单元测试
├── integration/
│   ├── server.test.ts       # 模拟服务器集成测试
│   └── server-instance.test.ts # 真实服务器实例测试
├── load/
│   └── performance.test.ts  # 性能和负载测试
└── README.md
```

## 运行测试

### 前置条件

确保已安装所有依赖：

```bash
npm install
```

### 测试命令

```bash
# 运行所有测试
npm test

# 运行并监视文件变化
npm run test:watch

# 运行测试并生成覆盖率报告
npm run test:coverage

# 只运行单元测试
npm run test:unit

# 只运行集成测试
npm run test:integration
```

## 测试类型说明

### 单元测试 (Unit Tests)

- 测试单独的函数和组件
- 位于 `tests/unit/` 目录
- 测试辅助函数、事件常量等
- 快速执行，不需要网络连接

### 集成测试 (Integration Tests)

- 测试组件之间的交互
- 位于 `tests/integration/` 目录
- 包含两种类型：
  - **模拟服务器测试**: 创建测试专用的服务器实例
  - **真实服务器测试**: 连接到运行中的服务器实例

### 性能/负载测试 (Load Tests)

- 测试服务器在高负载下的表现
- 位于 `tests/load/` 目录
- 测试多客户端连接、消息处理性能等

## 测试覆盖的功能

### 🔌 连接管理

- [x] WebSocket 连接和断开
- [x] 多客户端同时连接
- [x] 连接错误处理

### 👤 用户管理

- [x] 用户加入和离开
- [x] 用户广播消息
- [x] 排行榜更新

### 🏠 房间管理

- [x] 房间创建和删除
- [x] 房间加入和离开
- [x] 房间列表获取
- [x] 房间满员处理
- [x] 领导权转移

### 💬 聊天系统

- [x] 大厅消息
- [x] 游戏内消息
- [x] 消息广播

### 🎮 游戏状态

- [x] 玩家准备状态
- [x] 游戏开始
- [x] 位置同步
- [x] 武器射击
- [x] 战斗命中

### 📊 性能测试

- [x] 多客户端负载
- [x] 快速消息处理
- [x] 内存清理
- [x] 连接性能

## 运行真实服务器测试

要运行针对真实服务器实例的测试：

1. 在一个终端启动服务器：

```bash
npm run dev
```

2. 在另一个终端运行测试：

```bash
npm run test:integration
```

## 测试工具

### createTestServer()

创建一个测试专用的服务器实例，运行在随机端口上。

### createTestClient(url)

创建一个测试客户端，连接到指定的服务器。

### waitForEvent(socket, event, timeout)

等待指定的 Socket.IO 事件，带超时机制。

### sleep(ms)

异步等待指定毫秒数。

## 测试配置

测试配置位于 `jest.config.js` 文件中：

- **TypeScript 支持**: 使用 `ts-jest` 预设
- **测试环境**: Node.js 环境
- **覆盖率报告**: 生成 text、lcov 和 html 格式的报告
- **超时设置**: 每个测试最大运行 10 秒

## 故障排除

### 测试超时

如果测试频繁超时，可能是因为：

- 网络延迟
- 服务器响应慢
- 并发测试过多

解决方案：

- 增加测试超时时间
- 减少并发测试数量
- 检查网络连接

### 端口冲突

如果出现端口冲突错误：

- 确保没有其他服务占用 3000 端口
- 或者修改测试配置使用其他端口

### 内存泄漏

运行大量测试后如果出现内存问题：

- 确保在测试后正确断开所有客户端连接
- 检查 `afterEach` 和 `afterAll` 钩子是否正确清理资源

## 持续集成

这些测试可以集成到 CI/CD 流水线中：

```yaml
# .github/workflows/test.yml 示例
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: "18"
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## 贡献指南

添加新测试时请遵循以下规范：

1. **命名规范**: 使用描述性的测试名称
2. **清理资源**: 在 `afterEach`/`afterAll` 中清理连接和资源
3. **错误处理**: 使用 try-finally 确保资源清理
4. **超时设置**: 为异步操作设置合理的超时时间
5. **文档更新**: 更新此文档以反映新的测试覆盖

## 性能基准

当前测试环境下的性能基准：

- **连接时间**: 10 个并发连接 < 5 秒
- **消息处理**: 60fps 位置更新 < 2 秒
- **房间操作**: 5 个房间同时创建 < 1 秒
- **聊天消息**: 10 条连续消息 < 500ms
