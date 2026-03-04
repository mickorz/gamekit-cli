import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';

/**
 * Ember Setup 工具函数
 *
 * 用于 Unity CLI 批处理设置和编译检查的工具函数
 *
 * 工作流程:
 * executeUnityBatchSetup()
 *     ├─> ensureEmberDirectory()        确保 .ember 目录存在
 *     ├─> 清理旧的结果文件
 *     ├─> spawn Unity 批处理进程
 *     └─> pollSetupResult()             轮询结果文件
 *           └─> 返回 SetupResult
 *
 * verifyCompileCheck()
 *     └─> HTTP POST -> localhost:8513/skill/Compile_Check
 *           └─> 返回 CompileCheckResult
 */

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

    // 动态导入 spawn 以保持一致性
    import('child_process').then(({ spawn }) => {
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
    }).catch(reject);
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
 *
 * @returns 编译检查结果
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
        } catch {
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
 *
 * @param maxWaitMs - 最大等待时间（毫秒）
 * @returns 编译检查结果
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
