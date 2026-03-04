# Init Ember Setup 集成实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在 `emberai init` 流程中集成 Ember MCP 设置步骤，实现连接 MCP、生成 Skills、安装到 Claude Code、以及编译验证的自动化。

**Architecture:** CLI 通过 Unity 的 `-executeMethod` 调用 Unity 端的静态方法，Unity 执行完成后通过文件标记法（`.ember/setup-result.json`）返回结果，CLI 轮询读取结果并调用 Compile_Check API 验证。

**Tech Stack:** TypeScript (CLI), C# (Unity), HTTP API (MCP 通信), JSON (结果文件)

---

## Task 1: 创建 Unity 端 CLI 入口

**Files:**
- Create: `D:/NodejsP/ember-mcp/UnityPackage/Editor/CLI/EmberCLI.cs`

**Step 1: 创建 CLI 目录和基础类文件**

在 `D:/NodejsP/ember-mcp/UnityPackage/Editor/` 下创建 `CLI` 目录，然后创建 `EmberCLI.cs` 文件：

```csharp
using UnityEngine;
using UnityEditor;
using System;
using System.IO;
using System.Threading;

namespace Ember.Editor.CLI
{
    /// <summary>
    /// CLI 调用的入口类
    /// 执行方式: Unity.exe -batchmode -executeMethod EmberCLI.SetupForCLI -projectPath "xxx" -quit
    /// </summary>
    public static class EmberCLI
    {
        // 步骤名称常量
        private const string STEP_CONNECT = "connect";
        private const string STEP_GENERATE_SKILLS = "generate_skills";
        private const string STEP_INSTALL_SKILLS = "install_skills";
        private const string STEP_COMPLETED = "completed";

        // 项目根目录
        private static string ProjectRoot => Directory.GetParent(Application.dataPath).FullName;

        // 结果文件路径
        private static string ResultFilePath => Path.Combine(ProjectRoot, ".ember", "setup-result.json");

        /// <summary>
        /// CLI 调用的主入口方法
        /// </summary>
        public static void SetupForCLI()
        {
            Debug.Log("[EmberCLI] Starting setup process...");

            try
            {
                // 0. 确保 .ember 目录存在
                EnsureEmberDirectory();

                // 写入开始状态
                WriteResult(false, STEP_CONNECT, "Connecting to MCP server...", null);

                // 1. 连接 MCP
                ExecuteConnect();

                // 2. 生成 Skills
                WriteResult(false, STEP_GENERATE_SKILLS, "Generating skills...", null);
                ExecuteGenerateSkills();

                // 3. 安装到 Claude Code
                WriteResult(false, STEP_INSTALL_SKILLS, "Installing skills to Claude Code...", null);
                ExecuteInstallSkills();

                // 4. 完成
                WriteResult(true, STEP_COMPLETED, "Ember setup completed successfully", null);
                Debug.Log("[EmberCLI] Setup completed successfully!");
            }
            catch (Exception ex)
            {
                string currentStep = GetCurrentStepFromLastWrite();
                WriteResult(false, currentStep, "Setup failed", ex.Message);
                Debug.LogError($"[EmberCLI] Setup failed at step '{currentStep}': {ex.Message}");

                // 即使失败也要退出，让 CLI 读取结果文件
            }

            // 退出 Unity
            EditorApplication.Exit(0);
        }

        /// <summary>
        /// 确保 .ember 目录存在
        /// </summary>
        private static void EnsureEmberDirectory()
        {
            string emberDir = Path.Combine(ProjectRoot, ".ember");
            if (!Directory.Exists(emberDir))
            {
                Directory.CreateDirectory(emberDir);
                Debug.Log($"[EmberCLI] Created .ember directory: {emberDir}");
            }
        }

        /// <summary>
        /// 连接 MCP 服务
        /// </summary>
        private static void ExecuteConnect()
        {
            Debug.Log("[EmberCLI] Connecting to MCP server...");

            // 加载配置
            var config = EmberConfig.Load();

            // 获取控制器实例
            var controller = EmberRegistryController.Instance;

            // 同步等待连接完成
            bool connected = false;
            int maxRetries = 30; // 30 秒超时
            int retryCount = 0;

            controller.InitializeAsync(config, success =>
            {
                connected = success;
            });

            // 等待连接完成
            while (!connected && retryCount < maxRetries)
            {
                Thread.Sleep(1000);
                retryCount++;

                // 检查是否已注册
                if (controller.IsRegistered)
                {
                    connected = true;
                    break;
                }
            }

            if (!connected)
            {
                throw new Exception("Failed to connect to MCP server after 30 seconds. Make sure ember-mcp is running (npm start)");
            }

            Debug.Log("[EmberCLI] Connected to MCP server successfully");
        }

        /// <summary>
        /// 生成 Skills
        /// </summary>
        private static void ExecuteGenerateSkills()
        {
            Debug.Log("[EmberCLI] Generating skills...");

            string packageRoot = GetUnityPackageRoot();
            if (string.IsNullOrEmpty(packageRoot))
            {
                throw new Exception("Cannot locate UnityPackage directory");
            }

            string scriptPath = Path.Combine(packageRoot, "scripts", "skill-generator.js");

            if (!File.Exists(scriptPath))
            {
                throw new Exception($"skill-generator.js not found at: {scriptPath}");
            }

            var startInfo = new System.Diagnostics.ProcessStartInfo
            {
                FileName = "node",
                Arguments = $"\"{scriptPath}\"",
                WorkingDirectory = packageRoot,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using (var process = System.Diagnostics.Process.Start(startInfo))
            {
                string output = process.StandardOutput.ReadToEnd();
                string error = process.StandardError.ReadToEnd();
                process.WaitForExit(60000); // 60 秒超时

                if (process.ExitCode != 0)
                {
                    throw new Exception($"Skill generation failed: {error}");
                }
            }

            Debug.Log("[EmberCLI] Skills generated successfully");
        }

        /// <summary>
        /// 安装到 Claude Code
        /// </summary>
        private static void ExecuteInstallSkills()
        {
            Debug.Log("[EmberCLI] Installing skills to Claude Code...");

            string packageRoot = GetUnityPackageRoot();
            if (string.IsNullOrEmpty(packageRoot))
            {
                throw new Exception("Cannot locate UnityPackage directory");
            }

            string sourceDir = Path.Combine(packageRoot, "Skill-Generate");
            if (!Directory.Exists(sourceDir))
            {
                throw new Exception($"Source directory not found: {sourceDir}");
            }

            // 扫描所有 ember-* 目录
            var skillDirs = Directory.GetDirectories(sourceDir, "ember-*");
            if (skillDirs.Length == 0)
            {
                throw new Exception("No skill directories found (ember-*)");
            }

            // Claude Code 目标路径
            string targetDir = Path.Combine(ProjectRoot, ".claude", "skills");
            Directory.CreateDirectory(targetDir);

            int installedCount = 0;
            foreach (var skillDir in skillDirs)
            {
                string skillName = Path.GetFileName(skillDir);
                string targetSkillDir = Path.Combine(targetDir, skillName);
                CopyDirectory(skillDir, targetSkillDir);
                installedCount++;
            }

            Debug.Log($"[EmberCLI] Installed {installedCount} skills to Claude Code");
        }

        /// <summary>
        /// 写入结果文件
        /// </summary>
        private static void WriteResult(bool success, string step, string message, string error)
        {
            var result = new SetupResult
            {
                success = success,
                step = step,
                message = message,
                error = error,
                timestamp = DateTime.UtcNow.ToString("o")
            };

            string json = JsonUtility.ToJson(result, true);
            File.WriteAllText(ResultFilePath, json);

            Debug.Log($"[EmberCLI] Result written: success={success}, step={step}");
        }

        /// <summary>
        /// 获取 UnityPackage 根目录
        /// </summary>
        private static string GetUnityPackageRoot()
        {
            // 从当前脚本位置向上查找
            var currentDir = new DirectoryInfo(Path.GetDirectoryName(new Uri(typeof(EmberCLI).Assembly.CodeBase).LocalPath));

            while (currentDir != null)
            {
                if (currentDir.Name == "Editor" && currentDir.Parent != null && currentDir.Parent.Name == "UnityPackage")
                {
                    return currentDir.Parent.FullName;
                }
                currentDir = currentDir.Parent;
            }

            return null;
        }

        /// <summary>
        /// 复制目录（递归）
        /// </summary>
        private static void CopyDirectory(string sourceDir, string targetDir)
        {
            Directory.CreateDirectory(targetDir);

            foreach (var file in Directory.GetFiles(sourceDir))
            {
                string fileName = Path.GetFileName(file);
                string targetFile = Path.Combine(targetDir, fileName);
                File.Copy(file, targetFile, overwrite: true);
            }

            foreach (var dir in Directory.GetDirectories(sourceDir))
            {
                string dirName = Path.GetFileName(dir);
                string targetSubDir = Path.Combine(targetDir, dirName);
                CopyDirectory(dir, targetSubDir);
            }
        }

        /// <summary>
        /// 获取上次写入的步骤（用于错误报告）
        /// </summary>
        private static string GetCurrentStepFromLastWrite()
        {
            // 简单实现：返回最后写入的步骤
            // 实际可以从文件读取
            return "unknown";
        }

        // 结果数据结构
        [Serializable]
        private class SetupResult
        {
            public bool success;
            public string step;
            public string message;
            public string error;
            public string timestamp;
        }
    }
}
```

**Step 2: 验证 Unity 可以编译该文件**

```bash
# 在 Unity 中检查是否有编译错误
# 或者通过 CLI 测试
```

**Step 3: 提交**

```bash
cd D:/NodejsP/ember-mcp
git add UnityPackage/Editor/CLI/EmberCLI.cs
git commit -m "feat: add CLI entry point for ember setup

- Add SetupForCLI method for batch mode execution
- Implement Connect, GenerateSkills, InstallSkills steps
- Use file-based result communication (.ember/setup-result.json)

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: 创建 CLI 端 ember-setup.ts 工具函数

**Files:**
- Create: `src/utils/ember-setup.ts`

**Step 1: 创建类型定义和常量**

```typescript
// src/utils/ember-setup.ts

import * as fs from 'fs';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
import http from 'http';

// 超时配置（毫秒）
export const TIMEOUTS = {
  unityBatch: 300000,      // Unity 批处理：5分钟
  resultPolling: 300000,   // 结果轮询：5分钟
  pollingInterval: 2000,   // 轮询间隔：2秒
  compileCheck: 30000,     // 编译检查：30秒
  compileWait: 120000,     // 编译等待：2分钟
};

// MCP 服务端口
const MCP_PORT = 8513;

/**
 * 设置结果
 */
export interface SetupResult {
  success: boolean;
  step: string;
  message: string;
  error?: string;
  timestamp?: string;
}

/**
 * 编译检查结果
 */
export interface CompileCheckResult {
  isCompiling: boolean;
  success: boolean;
  errorCount: number;
  errors: CompileMessage[];
  warningCount: number;
  warnings: CompileMessage[];
}

/**
 * 编译消息
 */
export interface CompileMessage {
  message: string;
  file: string;
  line: number;
  column: number;
}

/**
 * Ember 设置错误
 */
export class EmberSetupError extends Error {
  constructor(
    public step: string,
    message: string,
    public details?: string
  ) {
    super(message);
    this.name = 'EmberSetupError';
  }
}
```

**Step 2: 实现核心函数**

```typescript
/**
 * 确保 .ember 目录存在
 */
export function ensureEmberDirectory(projectPath: string): void {
  const emberDir = path.join(projectPath, '.ember');
  if (!fs.existsSync(emberDir)) {
    fs.mkdirSync(emberDir, { recursive: true });
  }
}

/**
 * 执行 Unity 批处理设置
 */
export async function executeUnityBatchSetup(
  unityPath: string,
  projectPath: string
): Promise<SetupResult> {
  return new Promise((resolve, reject) => {
    // 确保目录存在
    ensureEmberDirectory(projectPath);

    // 清理旧的结果文件
    const resultPath = path.join(projectPath, '.ember', 'setup-result.json');
    if (fs.existsSync(resultPath)) {
      fs.unlinkSync(resultPath);
    }

    // 构建 Unity 命令参数
    const args = [
      '-batchmode',
      '-projectPath', projectPath,
      '-executeMethod', 'EmberCLI.SetupForCLI',
      '-quit'
    ];

    console.log(`[Ember] Starting Unity batch setup...`);
    console.log(`[Ember] Unity: ${unityPath}`);
    console.log(`[Ember] Project: ${projectPath}`);

    // 启动 Unity
    const child = spawn(unityPath, args, {
      stdio: 'inherit'
    });

    child.on('error', (error) => {
      reject(new EmberSetupError('unity_start', `Failed to start Unity: ${error.message}`));
    });

    // 开始轮询结果文件
    pollSetupResult(projectPath, TIMEOUTS.resultPolling)
      .then(resolve)
      .catch(reject);
  });
}

/**
 * 轮询读取结果文件
 */
function pollSetupResult(
  projectPath: string,
  timeout: number
): Promise<SetupResult> {
  return new Promise((resolve, reject) => {
    const resultPath = path.join(projectPath, '.ember', 'setup-result.json');
    const startTime = Date.now();

    const poll = () => {
      if (Date.now() - startTime > timeout) {
        reject(new EmberSetupError('timeout', 'Timeout waiting for Unity setup result'));
        return;
      }

      if (fs.existsSync(resultPath)) {
        try {
          const content = fs.readFileSync(resultPath, 'utf-8');
          const result: SetupResult = JSON.parse(content);
          resolve(result);
        } catch (error) {
          // 文件可能还在写入中，继续轮询
          setTimeout(poll, TIMEOUTS.pollingInterval);
        }
      } else {
        setTimeout(poll, TIMEOUTS.pollingInterval);
      }
    };

    // 开始轮询
    setTimeout(poll, TIMEOUTS.pollingInterval);
  });
}

/**
 * 调用 Compile_Check API
 */
export async function verifyCompileCheck(): Promise<CompileCheckResult> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: MCP_PORT,
      path: '/skill/Compile_Check',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: TIMEOUTS.compileCheck
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result: CompileCheckResult = JSON.parse(data);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse Compile_Check response: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Compile_Check request failed: ${error.message}. Make sure ember-mcp is running.`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Compile_Check request timeout'));
    });

    req.write('{}');
    req.end();
  });
}

/**
 * 等待编译完成
 */
export async function waitForCompilation(maxWaitMs: number = TIMEOUTS.compileWait): Promise<CompileCheckResult> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const result = await verifyCompileCheck();

    if (!result.isCompiling) {
      return result;
    }

    // 等待 2 秒后重试
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error('Timeout waiting for compilation to complete');
}

/**
 * 格式化编译错误用于显示
 */
export function formatCompileErrors(result: CompileCheckResult): string {
  const lines: string[] = [];

  if (result.errorCount > 0) {
    lines.push(`Errors found: ${result.errorCount}`);
    result.errors.forEach((err, i) => {
      lines.push(`  ${i + 1}. ${err.file}(${err.line},${err.column}): ${err.message}`);
    });
  }

  if (result.warningCount > 0) {
    lines.push(`Warnings: ${result.warningCount}`);
  }

  return lines.join('\n');
}
```

**Step 3: 提交**

```bash
cd D:/UnityP/AllUnityMCP/gamekit-cli
git add src/utils/ember-setup.ts
git commit -m "feat: add ember-setup utility functions

- Add executeUnityBatchSetup for Unity CLI execution
- Add verifyCompileCheck for compilation verification
- Add waitForCompilation for async compile wait
- Add file-based result polling with timeout

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: 修改 init.ts 集成新功能

**Files:**
- Modify: `src/commands/init.ts`

**Step 1: 添加导入语句**

在文件顶部添加导入：

```typescript
// 在现有导入后添加
import {
  executeUnityBatchSetup,
  verifyCompileCheck,
  waitForCompilation,
  formatCompileErrors,
  EmberSetupError,
  TIMEOUTS
} from '../utils/ember-setup.js';
```

**Step 2: 创建通用设置函数**

在 `init.ts` 中添加新的辅助函数（在 `isValidProjectName` 函数后）：

```typescript
/**
 * 执行 Ember 设置步骤（连接、生成、安装、验证）
 */
async function executeEmberSetupSteps(
  unityPath: string,
  projectPath: string,
  spinner: ora.Ora
): Promise<void> {
  // Step 1: 执行 Unity 批处理设置
  spinner.start('Setting up Ember MCP...');
  try {
    const result = await executeUnityBatchSetup(unityPath, projectPath);

    if (!result.success) {
      spinner.fail(`Setup failed at step: ${result.step}`);
      console.log(chalk.red(`Error: ${result.error || result.message}`));
      showSetupErrorHelp(result.step);
      process.exit(1);
    }

    spinner.succeed('Ember MCP setup completed');
  } catch (error) {
    spinner.fail('Failed to execute Ember setup');
    if (error instanceof EmberSetupError) {
      console.log(chalk.red(`Error at ${error.step}: ${error.message}`));
      if (error.details) {
        console.log(chalk.gray(error.details));
      }
    } else if (error instanceof Error) {
      console.log(chalk.red(`Error: ${error.message}`));
    }
    process.exit(1);
  }

  // Step 2: 验证编译
  spinner.start('Verifying compilation...');
  try {
    // 先检查编译状态
    let checkResult = await verifyCompileCheck();

    // 如果正在编译，等待完成
    if (checkResult.isCompiling) {
      spinner.text = 'Unity is compiling, waiting...';
      checkResult = await waitForCompilation();
    }

    if (!checkResult.success || checkResult.errorCount > 0) {
      spinner.fail('Compilation check failed');
      console.log(chalk.red(`\n${formatCompileErrors(checkResult)}`));
      console.log(chalk.yellow('\nPlease fix these errors and run: emberai init'));
      process.exit(1);
    }

    spinner.succeed('Compilation verified');
  } catch (error) {
    spinner.fail('Compilation check failed');
    if (error instanceof Error) {
      console.log(chalk.red(`Error: ${error.message}`));
      console.log(chalk.gray('\nMake sure ember-mcp service is running.'));
      console.log(chalk.gray('Run: cd D:/NodejsP/ember-mcp && npm start'));
    }
    process.exit(1);
  }
}

/**
 * 显示设置错误帮助信息
 */
function showSetupErrorHelp(step: string): void {
  console.log(chalk.yellow('\nPlease check:'));

  switch (step) {
    case 'connect':
      console.log(chalk.gray('  1. ember-mcp service is running'));
      console.log(chalk.gray('     cd D:/NodejsP/ember-mcp && npm start'));
      console.log(chalk.gray('  2. Port 8513 is not blocked by firewall'));
      console.log(chalk.gray('  3. Unity project is valid'));
      break;
    case 'generate_skills':
      console.log(chalk.gray('  1. Node.js is installed and accessible'));
      console.log(chalk.gray('  2. skill-generator.js exists in UnityPackage/scripts/'));
      break;
    case 'install_skills':
      console.log(chalk.gray('  1. .claude/skills directory is writable'));
      console.log(chalk.gray('  2. Skills were generated successfully'));
      break;
    default:
      console.log(chalk.gray('  Check the .ember/setup-result.json file for details'));
  }

  console.log(chalk.yellow('\nThen run: emberai init'));
}
```

**Step 3: 修改 initExistingProject 函数**

在 `initExistingProject` 函数末尾（Step 3: Generate .mcp.json 之后）添加新步骤：

```typescript
// 在 Step 3: Generate .mcp.json 块之后添加

// Step 4: Execute Ember setup (connect, generate, install)
await executeEmberSetupSteps(
  installs.find((i: UnityInstall) => i.version === unityVersion)!.path,
  projectPath,
  spinner
);

// Step 5: Open Unity editor
spinner.start('Opening Unity...');
try {
  const selectedInstall = installs.find((i: UnityInstall) => i.version === unityVersion)!;
  openUnityProject(selectedInstall.path, projectPath);
  spinner.succeed('Unity is opening');
} catch (error) {
  spinner.warn('Could not open Unity automatically');
  console.log(chalk.gray('  Please open the project manually in Unity Hub.\n'));
}

// 更新完成提示
console.log(chalk.green(`
+------------------------------------------+
|       ✓ Project Initialized!            |
+------------------------------------------+
`));
console.log(chalk.blue('Next steps:\n'));
console.log(chalk.white(`  1. ${chalk.cyan('Wait for Unity to finish loading')}`));
console.log(chalk.gray('     ember-mcp Unity package will auto-register\n'));
console.log(chalk.white(`  2. ${chalk.cyan('claude')}`));
console.log(chalk.gray('     Start building with AI!\n'));

console.log(chalk.gray('─'.repeat(44)));
console.log(chalk.gray('\nTip: Use /new-game to start building!'));
console.log(chalk.gray('Example: /new-game space shooter where you dodge asteroids\n'));
```

**Step 4: 修改 createNewProject 函数**

类似地，在 `createNewProject` 函数末尾（Step 6: Generate .mcp.json 之后）修改：

```typescript
// 替换原来的 Step 7: Open Unity 部分

// Step 7: Execute Ember setup (connect, generate, install)
await executeEmberSetupSteps(selectedInstall.path, projectPath, spinner);

// Step 8: Open Unity editor
spinner.start('Opening Unity...');
try {
  openUnityProject(selectedInstall.path, projectPath);
  spinner.succeed('Unity is opening');
} catch (error) {
  spinner.warn('Could not open Unity automatically');
  console.log(chalk.gray('  Please open the project manually in Unity Hub.\n'));
}

// Step 9: Check ember-mcp gateway and show final instructions
const gatewayExists = emberMcpExists();

// Success!
console.log(chalk.green(`
+------------------------------------------+
|         ✓ Project Created!              |
+------------------------------------------+
`));

const cdCmd = `cd ${projectName}`;

console.log(chalk.blue('Next steps:\n'));
console.log(chalk.white(`  1. ${chalk.cyan(cdCmd)}`));
console.log(chalk.gray('     Navigate to your project\n'));

if (gatewayExists) {
  console.log(chalk.white(`  2. ${chalk.green('✓')} ${chalk.cyan('ember-mcp gateway is ready')}`));
  console.log(chalk.gray('     Gateway found at configured location\n'));
} else {
  console.log(chalk.white(`  2. ${chalk.cyan('Build and start ember-mcp gateway')}`));
  console.log(chalk.gray('     cd D:/NodejsP/ember-mcp && npm run build && npm start\n'));
}

console.log(chalk.white(`  3. ${chalk.cyan('Wait for Unity to finish loading')}`));
console.log(chalk.gray('     Skills are already installed and verified\n'));
console.log(chalk.white(`  4. ${chalk.cyan('claude')}`));
console.log(chalk.gray('     Start building with AI!\n'));

console.log(chalk.gray('─'.repeat(44)));
console.log(chalk.gray('\nTip: Use /new-game to start building!'));
console.log(chalk.gray('Example: /new-game space shooter where you dodge asteroids\n'));
```

**Step 5: 提交**

```bash
cd D:/UnityP/AllUnityMCP/gamekit-cli
git add src/commands/init.ts
git commit -m "feat: integrate Ember setup steps into init command

- Add executeEmberSetupSteps for unified setup flow
- Add Compile_Check verification after setup
- Update both initExistingProject and createNewProject
- Improve error messages with helpful suggestions

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 4: 验证与测试

**Files:**
- Test: 手动测试完整流程

**Step 1: 编译 TypeScript**

```bash
cd D:/UnityP/AllUnityMCP/gamekit-cli
npm run build
```

Expected: 编译成功，无错误

**Step 2: 测试 Unity 端 CLI 入口**

```bash
# 在 Unity 项目目录下测试
"C:\Program Files\Unity\Hub\Editor\2022.3.x\Editor\Unity.exe" -batchmode -projectPath "D:\TestProject" -executeMethod EmberCLI.SetupForCLI -quit

# 检查结果文件
cat D:\TestProject\.ember\setup-result.json
```

Expected: 生成 setup-result.json，内容包含 success 字段

**Step 3: 测试 CLI init 流程**

```bash
cd D:/UnityP/AllUnityMCP/gamekit-cli
node dist/index.js init
```

Expected:
1. 正常创建/初始化项目
2. 执行 Ember 设置步骤
3. 验证编译成功
4. 打开 Unity 编辑器

**Step 4: 提交测试结果**

```bash
cd D:/UnityP/AllUnityMCP/gamekit-cli
git add -A
git commit -m "test: verify init ember setup integration

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## 文件变更清单

### 新增文件

| 文件路径 | 说明 |
|---------|------|
| `D:/NodejsP/ember-mcp/UnityPackage/Editor/CLI/EmberCLI.cs` | Unity 端 CLI 入口 |
| `src/utils/ember-setup.ts` | CLI 端 Ember 设置工具 |

### 修改文件

| 文件路径 | 说明 |
|---------|------|
| `src/commands/init.ts` | 集成 Ember 设置步骤 |

---

## 回滚方案

如果出现问题，可以：

1. **回滚 CLI 更改**:
```bash
cd D:/UnityP/AllUnityMCP/gamekit-cli
git revert HEAD~2  # 回滚 init.ts 和 ember-setup.ts 的更改
```

2. **回滚 Unity 更改**:
```bash
cd D:/NodejsP/ember-mcp
git revert HEAD  # 回滚 EmberCLI.cs
```

3. **跳过 Ember 设置**: 在 init.ts 中注释掉 `executeEmberSetupSteps` 调用，保留原有流程

---

*实施计划版本: 1.0*
*创建日期: 2026-03-04*
