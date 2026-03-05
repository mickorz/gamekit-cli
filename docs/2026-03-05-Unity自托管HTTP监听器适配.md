# Unity 自托管 HTTP 监听器架构适配

## 2026-03-05 更新摘要

### 核心变更

本次更新适配 Unity Package 的架构变更：**Unity 现在自身启动 HTTP 监听器，不再连接外部 MCP 服务器**。

---

## 架构变更对比

### 变更前

```
Unity Editor                    外部 MCP 服务器 (localhost:4000)
      |                                |
      +-- 初始化连接 ----------------->|
      |                                |
      +-- 注册实例 ------------------->|
      |                                |
      +-- 定期心跳 ------------------->|
      |                                |
      +-- 注销 ----------------------->|
```

### 变更后

```
Unity Editor (自身作为 HTTP 服务器)
      |
      +-- 启动 UnityHttpListener (端口 8000-9000)
      |
      +-- 直接处理 MCP 请求
      |
      v
http://localhost:端口/skill/{name}
```

---

## 关键变更点

| 对比项 | 变更前 | 变更后 |
|--------|--------|--------|
| **通信模式** | Unity 连接外部服务器 | Unity 自身启动监听器 |
| **端口** | 固定 4000 | 动态 8000-9000 |
| **注册流程** | 向外部服务器注册 + 心跳 | 直接进入 Registered 状态 |
| **端口文件** | 无 | `.ember/mcp-port.json` |
| **CLI 依赖** | 需要启动 ember-mcp 服务器 | 不再需要 |

---

## 修改的文件

### src/utils/ember-setup.ts

#### 移除的内容

| 项目 | 说明 |
|------|------|
| `MCP_REGISTRY_PORT = 4000` | 不再需要固定端口 |
| `isEmberMcpRunning()` | 不再需要检查外部服务器 |
| `startEmberMcpServer()` | 不再需要启动外部服务器 |

#### 新增的内容

```typescript
// Unity 端口信息接口
export interface McpPortInfo {
  unityPort: number;
  instanceId: string;
  projectName: string;
}

// 读取 Unity HTTP 监听器端口
export function readUnityPort(projectPath: string): number | null {
  const portFile = path.join(projectPath, '.ember', 'mcp-port.json');
  if (fs.existsSync(portFile)) {
    const content = fs.readFileSync(portFile, 'utf-8');
    const info: McpPortInfo = JSON.parse(content);
    return info.unityPort;
  }
  return null;
}
```

#### 修改的内容

**1. `executeUnityBatchSetup()` - 移除 `-quit` 参数**

```typescript
// 变更前
const args = [
  '-batchmode',
  '-projectPath', projectPath,
  '-executeMethod', 'Ember.Editor.CLI.EmberCLI.SetupForCLI',
  '-quit'  // 这会导致 Unity 在协程执行前退出
];

// 变更后
const args = [
  '-batchmode',
  '-projectPath', projectPath,
  '-executeMethod', 'Ember.Editor.CLI.EmberCLI.SetupForCLI'
  // 移除 -quit，让 Unity 在协程完成后通过 EditorApplication.Exit() 自行退出
];
```

**2. `verifyCompileCheck()` - 使用动态端口**

```typescript
// 变更前
const options = {
  hostname: 'localhost',
  port: MCP_REGISTRY_PORT,  // 固定端口 4000
  path: '/skill/Compile_Check',
  ...
};

// 变更后
export async function verifyCompileCheck(projectPath: string): Promise<CompileCheckResult> {
  const unityPort = readUnityPort(projectPath);  // 动态读取端口

  if (!unityPort) {
    throw new Error('Unity port file not found...');
  }

  const options = {
    hostname: 'localhost',
    port: unityPort,  // 动态端口
    path: '/skill/Compile_Check',
    ...
  };
}
```

### src/commands/init.ts

#### 移除的内容

| 项目 | 说明 |
|------|------|
| `EMBER_MCP_PATH` 导入 | 不再需要 |
| `EMBER_MCP_DIR` 变量 | 不再需要 |
| 编译验证逻辑 | 移到 Unity 编辑器启动后执行 |

#### 更新的错误提示

```typescript
// 变更前
case 'connect':
  console.log('  1. ember-mcp service is running');
  console.log('     cd ${EMBER_MCP_DIR} && npm start');
  console.log('  2. Port 4000 is not blocked by firewall');
  break;

// 变更后
case 'connect':
  console.log('  1. Unity project is valid');
  console.log('  2. Ports 8000-9000 are not blocked by firewall');
  console.log('  3. Check .ember/mcp-port.json for listener port');
  break;
```

---

## 执行流程对比

### 变更前

```
init()
  -> executeEmberSetupSteps()
     -> executeUnityBatchSetup()
        -> Unity 连接 localhost:4000
        -> 向外部服务器注册
     -> verifyCompileCheck() -> localhost:4000/skill/Compile_Check
```

### 变更后

```
init()
  -> executeEmberSetupSteps()
     -> executeUnityBatchSetup()
        -> Unity 启动本地 HTTP 监听器 (8000-9000)
        -> 直接进入 Registered 状态
        -> 写入 .ember/mcp-port.json
  -> verifyCompileCheck(projectPath) -> localhost:{unityPort}/skill/Compile_Check
```

---

## 端口文件格式

Unity 启动监听器后会写入 `.ember/mcp-port.json`:

```json
{
  "unityPort": 8409,
  "instanceId": "TestInit-2492307c",
  "projectName": "TestInit",
  "timestamp": "2026-03-05T06:27:21.0371478Z"
}
```

---

## 关键修复

### 问题：Unity 批处理模式下协程不执行

**原因：** `-quit` 参数导致 Unity 在 `SetupForCLI()` 方法返回后立即退出，而协程 `SetupCoroutine()` 还没有机会执行。

**解决方案：** 移除 `-quit` 参数，让 Unity 通过 `EditorApplication.Exit(0)` 在协程完成后自行退出。

---

## 测试验证

```bash
# 编译 CLI
npm run build

# 创建测试项目
cd D:/TestGameKit
emberai init -n TestInit -u 2022.3.62f3

# 验证结果
cat D:/TestGameKit/TestInit/.ember/setup-result.json
# {"success":true,"step":"completed",...}

cat D:/TestGameKit/TestInit/.ember/mcp-port.json
# {"unityPort":8409,...}
```

---

## Git 提交记录

```
fd76c33 refactor: adapt to Unity self-hosted HTTP listener architecture
```

---

## 相关文档

- [移除外部MCP服务器连接-修改记录](D:/NodejsP/ember-mcp/UnityPackage/Docs/移除外部MCP服务器连接-修改记录.md) - Unity Package 端的修改记录
