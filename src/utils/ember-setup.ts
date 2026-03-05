import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { spawn } from 'child_process';

/**
 * Ember Setup 工具函数
 *
 * 用于 Unity CLI 批处理设置的工具函数
 *
 * 架构说明 (2026-03-05 更新):
 * Unity 现在自身启动 HTTP 监听器 (端口 8000-9000)，不再连接外部 MCP 服务器
 *
 * 工作流程:
 * executeUnityBatchSetup()
 *     ├─> precompileUnityProject()      预编译项目（加载包）
 *     ├─> ensureEmberDirectory()        确保 .ember 目录存在
 *     ├─> 清理旧的结果文件
 *     ├─> spawn Unity 批处理进程
 *     │     └─> Unity 内部执行:
 *     │           ├─> WaitForListenerCoroutine()  启动本地 HTTP 监听器
 *     │           ├─> ExecuteGenerateSkills()     生成技能
 *     │           ├─> ExecuteInstallSkills()      安装技能
 *     │           └─> WritePortFile()             写入端口文件
 *     └─> pollSetupResult()             轮询结果文件
 *           └─> 返回 SetupResult
 */

// 超时配置（毫秒）
export const TIMEOUTS = {
  unityBatch: 300000,      // Unity 批处理：5分钟
  resultPolling: 300000,   // 结果轮询：5分钟
  pollingInterval: 2000,   // 轮询间隔：2秒
  compileCheck: 30000,     // 编译检查：30秒
  compileWait: 120000,     // 编译等待：2分钟
};

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

/**
 * 确保 .ember 目录存在
 *
 * @param projectPath - Unity 项目路径
 */
export function ensureEmberDirectory(projectPath: string): void {
  const emberDir = path.join(projectPath, '.ember');
  if (!fs.existsSync(emberDir)) {
    fs.mkdirSync(emberDir, { recursive: true });
  }
}

/**
 * 创建编译检查标记文件
 * Unity 编辑器启动后会检测此文件并执行编译检查
 *
 * @param projectPath - Unity 项目路径
 */
export function createCompileCheckMarker(projectPath: string): void {
  ensureEmberDirectory(projectPath);
  const markerPath = path.join(projectPath, '.ember', 'need-compile-check');
  const timestamp = new Date().toISOString();
  fs.writeFileSync(markerPath, timestamp);
  console.log(`[Ember] Created compile check marker: ${markerPath}`);
}

/**
 * 预编译 Unity 项目（确保包已加载）
 *
 * @param unityPath - Unity 可执行文件路径
 * @param projectPath - Unity 项目路径
 * @param timeoutMs - 超时时间（毫秒）
 */
async function precompileUnityProject(
  unityPath: string,
  projectPath: string,
  timeoutMs: number = 120000
): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`[Ember] Precompiling Unity project to load packages...`);

    // 启动 Unity 进行预编译（导入包后退出）
    const args = [
      '-batchmode',
      '-projectPath', projectPath,
      '-quit'
    ];

    const child = spawn(unityPath, args, {
      stdio: 'inherit'
    });

    const timeout = setTimeout(() => {
      child.kill();
      reject(new EmberSetupError('precompile_timeout', 'Timeout waiting for Unity precompilation'));
    }, timeoutMs);

    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(new EmberSetupError('precompile_start', `Failed to start Unity for precompilation: ${error.message}`));
    });

    child.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        console.log(`[Ember] Precompilation completed`);
        resolve();
      } else {
        // 即使返回非0，也继续尝试（可能是某些警告导致的）
        console.log(`[Ember] Precompilation finished with code ${code}, continuing...`);
        resolve();
      }
    });
  });
}

/**
 * 执行 Unity 批处理设置
 *
 * @param unityPath - Unity 可执行文件路径
 * @param projectPath - Unity 项目路径
 * @returns 设置结果
 */
export async function executeUnityBatchSetup(
  unityPath: string,
  projectPath: string
): Promise<SetupResult> {
  // 确保目录存在
  ensureEmberDirectory(projectPath);

  // 清理旧的结果文件
  const resultPath = path.join(projectPath, '.ember', 'setup-result.json');
  if (fs.existsSync(resultPath)) {
    fs.unlinkSync(resultPath);
  }

  // 步骤1：预编译项目以加载 ember-mcp 包
  try {
    await precompileUnityProject(unityPath, projectPath);
  } catch (error) {
    if (error instanceof EmberSetupError) {
      throw error;
    }
    // 预编译失败，但继续尝试
    console.log(`[Ember] Precompilation warning: ${error}`);
  }

  // 步骤2：执行 EmberCLI 设置
  return new Promise((resolve, reject) => {
    // 构建 Unity 命令参数
    // 注意：不使用 -quit，让 Unity 在协程完成后通过 EditorApplication.Exit() 自行退出
    const args = [
      '-batchmode',
      '-projectPath', projectPath,
      '-executeMethod', 'Ember.Editor.CLI.EmberCLI.SetupForCLI'
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
 *
 * @param projectPath - Unity 项目路径
 * @param timeout - 超时时间（毫秒）
 * @returns 设置结果
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
        } catch {
          // 文件可能还在写入中，继续轮询
          console.log(`[Ember] Waiting for result file to be complete...`);
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
 * Unity 端口信息
 * 从 .ember/mcp-port.json 文件读取
 */
export interface McpPortInfo {
  unityPort: number;
  instanceId: string;
  projectName: string;
}

/**
 * 读取 Unity HTTP 监听器端口
 * Unity 启动监听器后会写入 .ember/mcp-port.json 文件
 *
 * @param projectPath - Unity 项目路径
 * @returns 端口号，如果文件不存在则返回 null
 */
export function readUnityPort(projectPath: string): number | null {
  const portFile = path.join(projectPath, '.ember', 'mcp-port.json');
  if (fs.existsSync(portFile)) {
    try {
      const content = fs.readFileSync(portFile, 'utf-8');
      const info: McpPortInfo = JSON.parse(content);
      return info.unityPort;
    } catch (error) {
      console.log(`[Ember] Failed to read port file: ${error}`);
      return null;
    }
  }
  return null;
}

/**
 * 调用 Compile_Check API
 *
 * @param projectPath - Unity 项目路径，用于读取端口文件
 * @returns 编译检查结果
 */
export async function verifyCompileCheck(projectPath: string): Promise<CompileCheckResult> {
  // 从 .ember/mcp-port.json 读取 Unity 监听端口
  const unityPort = readUnityPort(projectPath);

  if (!unityPort) {
    throw new Error('Unity port file not found. Make sure Unity HTTP listener is running.');
  }

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: unityPort,
      path: '/skill/Compile_Check',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: TIMEOUTS.compileCheck
    };

    const req = http.request(options, (res) => {
      let data = '';

      // 检查 HTTP 状态码
      if (res.statusCode !== 200) {
        reject(new Error(`Compile_Check returned status ${res.statusCode}`));
        return;
      }

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result: CompileCheckResult = JSON.parse(data);
          resolve(result);
        } catch {
          reject(new Error(`Failed to parse Compile_Check response: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Compile_Check request failed: ${error.message}. Make sure Unity HTTP listener is running on port ${unityPort}.`));
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
 *
 * @param projectPath - Unity 项目路径
 * @param maxWaitMs - 最大等待时间（毫秒）
 * @returns 编译检查结果
 */
export async function waitForCompilation(
  projectPath: string,
  maxWaitMs: number = TIMEOUTS.compileWait
): Promise<CompileCheckResult> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const result = await verifyCompileCheck(projectPath);

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
 *
 * @param result - 编译检查结果
 * @returns 格式化的错误字符串
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
