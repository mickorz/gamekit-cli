# init 命令集成 Ember MCP 设置 - 设计文档

## 概述

在 `emberai init` 流程中集成 Ember MCP 设置步骤，包括连接 MCP、生成 Skills、安装到 Claude Code、以及编译验证。

---

## 需求背景

### 当前流程

```
1. 检测/创建 Unity 项目
2. 复制模板文件
3. 添加 MCP 包到 manifest.json
4. 启用新输入系统
5. 生成 .mcp.json 配置
6. 显示完成提示
```

### 问题

用户需要在 init 完成后手动执行：
1. 打开 EmberWindow 执行 ConnectAsync
2. 执行 GenerateSkills
3. 执行 InstallSkillsToSelectedPlatforms
4. 验证编译是否成功

### 目标

将这些手动步骤自动化，集成到 init 流程中。

---

## 整体流程设计

### 新增的 init 流程

```
原有步骤（不变）
├── 1. 检测/创建 Unity 项目
├── 2. 复制模板文件
├── 3. 添加 MCP 包到 manifest.json
├── 4. 启用新输入系统
├── 5. 生成 .mcp.json 配置
│
新增步骤
├── 6. 创建 .ember/ 目录
├── 7. 调用 Unity 执行 EmberCLI.SetupForCLI()
│       ├── ConnectAsync（连接 MCP）
│       ├── GenerateSkills（生成技能）
│       └── InstallSkillsToSelectedPlatforms（安装到 Claude Code）
├── 8. 轮询读取 .ember/setup-result.json
├── 9. 调用 Compile_Check API 验证
├── 10. 打开 Unity 编辑器（非批处理模式）
└── 11. 显示完成提示
```

### 条件判断

- **新项目**：执行完整流程（1-11）
- **现有项目**：跳过步骤 1-5，直接从步骤 6 开始

---

## Unity 端设计

### 新建文件

**路径**: `D:/NodejsP/ember-mcp/UnityPackage/Editor/CLI/EmberCLI.cs`

### 代码结构

```csharp
namespace Ember.Editor.CLI
{
    public static class EmberCLI
    {
        /// <summary>
        /// CLI 调用的入口方法
        /// 执行方式: Unity.exe -batchmode -executeMethod EmberCLI.SetupForCLI -quit
        /// </summary>
        public static void SetupForCLI()
        {
            // 1. 创建 .ember 目录
            // 2. 执行连接 → 生成 → 安装
            // 3. 写入结果文件
        }

        /// <summary>
        /// 连接 MCP 服务
        /// </summary>
        private static void ExecuteConnect() { }

        /// <summary>
        /// 生成 Skills
        /// </summary>
        private static void ExecuteGenerateSkills() { }

        /// <summary>
        /// 安装到 Claude Code
        /// </summary>
        private static void ExecuteInstallSkills() { }

        /// <summary>
        /// 写入结果文件
        /// </summary>
        private static void WriteResult(bool success, string step, string message, string error) { }
    }
}
```

### 结果文件格式

**路径**: `<项目根目录>/.ember/setup-result.json`

**成功时**:
```json
{
    "success": true,
    "step": "completed",
    "message": "Ember setup completed successfully",
    "error": null,
    "timestamp": "2026-03-04T10:30:00Z"
}
```

**失败时**:
```json
{
    "success": false,
    "step": "generate_skills",
    "message": "Failed to generate skills",
    "error": "详细错误信息...",
    "timestamp": "2026-03-04T10:30:00Z"
}
```

---

## CLI 端设计

### 新建文件

**路径**: `src/utils/ember-setup.ts`

### 代码结构

```typescript
// ember-setup.ts

import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import http from 'http';

// 超时配置
const TIMEOUTS = {
    unityBatch: 300000,     // Unity 批处理：5分钟
    resultPolling: 300000,  // 结果轮询：5分钟
    pollingInterval: 2000,  // 轮询间隔：2秒
    compileCheck: 30000,    // 编译检查：30秒
};

// 类型定义
interface SetupResult {
    success: boolean;
    step: string;
    message: string;
    error?: string;
    timestamp?: string;
}

interface CompileCheckResult {
    isCompiling: boolean;
    success: boolean;
    errorCount: number;
    errors: CompileMessage[];
    warningCount: number;
    warnings: CompileMessage[];
}

interface CompileMessage {
    message: string;
    file: string;
    line: number;
    column: number;
}

/**
 * 执行 Unity 批处理命令
 */
export async function executeUnityBatchSetup(
    unityPath: string,
    projectPath: string
): Promise<SetupResult>

/**
 * 轮询读取结果文件
 */
function pollSetupResult(
    projectPath: string,
    timeout: number
): Promise<SetupResult>

/**
 * 调用 Compile_Check API
 */
export async function verifyCompileCheck(): Promise<CompileCheckResult>

/**
 * 解析结果文件
 */
function parseSetupResult(filePath: string): SetupResult

/**
 * 确保 .ember 目录存在
 */
function ensureEmberDirectory(projectPath: string): void
```

### 修改 init.ts

在 `initExistingProject` 和 `createNewProject` 函数末尾添加新步骤：

```typescript
// 新增：执行 Ember 设置
spinner.start('Setting up Ember MCP...');
try {
    const result = await executeUnityBatchSetup(selectedInstall.path, projectPath);
    if (!result.success) {
        spinner.fail(`Setup failed at step: ${result.step}`);
        console.log(chalk.red(`Error: ${result.error}`));
        console.log(chalk.yellow('\nPlease check and fix the issue, then run emberai init again.'));
        process.exit(1);
    }
    spinner.succeed('Ember MCP setup completed');
} catch (error) {
    spinner.fail('Failed to execute Ember setup');
    if (error instanceof Error) {
        console.log(chalk.red(`Error: ${error.message}`));
    }
    process.exit(1);
}

// 新增：验证编译
spinner.start('Verifying compilation...');
try {
    const checkResult = await verifyCompileCheck();
    if (checkResult.isCompiling) {
        spinner.text = 'Unity is compiling, waiting...';
        // 等待编译完成
        await waitForCompilation();
    }
    if (!checkResult.success || checkResult.errorCount > 0) {
        spinner.fail('Compilation check failed');
        console.log(chalk.red(`\nErrors found: ${checkResult.errorCount}`));
        checkResult.errors.forEach((err, i) => {
            console.log(chalk.red(`  ${i + 1}. ${err.file}(${err.line},${err.column}): ${err.message}`));
        });
        console.log(chalk.yellow('\nPlease fix these errors and run: emberai init'));
        process.exit(1);
    }
    spinner.succeed('Compilation verified');
} catch (error) {
    spinner.fail('Compilation check failed');
    if (error instanceof Error) {
        console.log(chalk.red(`Error: ${error.message}`));
        console.log(chalk.gray('\nMake sure ember-mcp service is running.'));
    }
    process.exit(1);
}

// 新增：打开 Unity 编辑器（非批处理模式）
spinner.start('Opening Unity...');
try {
    openUnityProject(selectedInstall.path, projectPath);
    spinner.succeed('Unity is opening');
} catch (error) {
    spinner.warn('Could not open Unity automatically');
    console.log(chalk.gray('  Please open the project manually in Unity Hub.\n'));
}
```

---

## 错误处理与超时

### 超时配置

```typescript
const TIMEOUTS = {
    unityBatch: 300000,     // Unity 批处理：5分钟
    resultPolling: 300000,  // 结果轮询：5分钟
    pollingInterval: 2000,  // 轮询间隔：2秒
    compileCheck: 30000,    // 编译检查：30秒
};
```

### 错误场景处理

| 错误场景 | CLI 行为 |
|---------|---------|
| Unity 启动失败 | 显示错误，提示检查 Unity 安装 |
| 批处理超时 | 提示超时，建议手动检查 `.ember/setup-result.json` |
| 结果文件不存在 | 提示 Unity 可能未正常退出 |
| JSON 解析失败 | 提示文件格式错误，显示原始内容 |
| `success: false` | 显示失败步骤和错误信息，停止流程 |
| Compile_Check 失败 | 显示编译错误详情，停止流程 |
| Compile_Check 超时 | 提示 MCP 服务可能未启动 |

---

## 执行示例

### 成功场景

```
> emberai init

╔════════════════════════════════════════╗
║       🎮 EmberAI - Create Game         ║
╚════════════════════════════════════════╝

✓ Found 2 Unity installations

? What's your game called? MyAwesomeGame
? Select Unity version: 6000.1.12f1 (Unity 6 - recommended)

📁 Creating "MyAwesomeGame"...

✓ Unity project created
✓ Claude commands installed
✓ ember-mcp package added
✓ MCP configured
⠋ Setting up Ember MCP...
✓ Ember MCP setup completed
✓ Compilation verified
✓ Unity is opening

+------------------------------------------+
|         ✓ Project Created!              |
+------------------------------------------+

Next steps:
  1. cd MyAwesomeGame
  2. ✓ ember-mcp gateway is ready
  3. Wait for Unity to finish loading
  4. claude

Tip: Use /new-game to start building!
```

### 失败场景

```
> emberai init

...

✓ Unity project created
✓ Claude commands installed
✓ ember-mcp package added
✓ MCP configured
⠋ Setting up Ember MCP...
✗ Setup failed at step: connect

Error: Failed to connect to MCP server

Please check:
  1. ember-mcp service is running (cd D:/NodejsP/ember-mcp && npm start)
  2. Port 8513 is not blocked by firewall
  3. Unity project is valid

Then run: emberai init
```

---

## 文件变更清单

### 新增文件

| 文件路径 | 说明 |
|---------|------|
| `src/utils/ember-setup.ts` | CLI 端 Ember 设置工具函数 |
| `D:/NodejsP/ember-mcp/UnityPackage/Editor/CLI/EmberCLI.cs` | Unity 端 CLI 入口方法 |

### 修改文件

| 文件路径 | 说明 |
|---------|------|
| `src/commands/init.ts` | 添加 Ember 设置步骤 |
| `src/commands/init.ts` (initExistingProject) | 添加 Ember 设置步骤 |
| `src/commands/init.ts` (createNewProject) | 添加 Ember 设置步骤 |

---

## 实现优先级

1. **Unity 端** - 创建 `EmberCLI.cs` 入口方法
2. **CLI 端** - 创建 `ember-setup.ts` 工具函数
3. **集成** - 修改 `init.ts` 添加新步骤
4. **测试** - 验证完整流程

---

*设计文档版本: 1.0*
*创建日期: 2026-03-04*
