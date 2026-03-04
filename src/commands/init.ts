import inquirer from 'inquirer';
import chalk from 'chalk';
import ora, { Ora } from 'ora';
import * as fs from 'fs';
import * as path from 'path';
import {
  findUnityInstalls,
  createUnityProject,
  openUnityProject,
  isUnityProject,
  UnityInstall,
  enableNewInputSystem
} from '../utils/unity.js';
import { copyTemplateAsync } from '../utils/template.js';
import { addMcpToManifest } from '../utils/manifest.js';
import { generateMcpConfig, emberMcpExists } from '../utils/mcp.js';
import { EMBER_MCP_PATH } from '../utils/platform.js';

// 提取 ember-mcp 目录路径，用于错误提示
const EMBER_MCP_DIR = path.dirname(EMBER_MCP_PATH);
import { createEditorScripts } from '../utils/assets.js';
import {
  executeUnityBatchSetup,
  verifyCompileCheck,
  waitForCompilation,
  formatCompileErrors,
  EmberSetupError
} from '../utils/ember-setup.js';

/**
 * Validate project name to prevent path traversal
 */
export function isValidProjectName(name: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(name);
}

/**
 * 执行 Ember 设置步骤（连接、生成、安装、验证）
 *
 * @param unityPath - Unity 可执行文件路径
 * @param projectPath - Unity 项目路径
 * @param spinner - ora spinner 实例
 */
async function executeEmberSetupSteps(
  unityPath: string,
  projectPath: string,
  spinner: Ora
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
      console.log(chalk.gray(`Run: cd ${EMBER_MCP_DIR} && npm start`));
    }
    process.exit(1);
  }
}

/**
 * 显示设置错误帮助信息
 *
 * @param step - 失败的步骤名称
 */
function showSetupErrorHelp(step: string): void {
  console.log(chalk.yellow('\nPlease check:'));

  switch (step) {
    case 'connect':
      console.log(chalk.gray('  1. ember-mcp service is running'));
      console.log(chalk.gray(`     cd ${EMBER_MCP_DIR} && npm start`));
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

/**
 * Initialize an existing Unity project with Claude Code support
 */
async function initExistingProject(projectPath: string): Promise<void> {
  console.log(chalk.blue(`
╔════════════════════════════════════════╗
║    🎮 EmberAI - Initialize Project     ║
║   Adding Claude Code to your project   ║
╚════════════════════════════════════════╝
`));

  console.log(chalk.green(`✓ Found existing Unity project\n`));

  // Find Unity installations to get version choices
  const installs = findUnityInstalls();

  if (installs.length === 0) {
    console.log(chalk.red('❌ No Unity installations found.\n'));
    console.log(chalk.gray('Unity Hub installs Unity to:'));
    console.log(chalk.gray('  Mac: /Applications/Unity/Hub/Editor/'));
    console.log(chalk.gray('  Windows: C:\\Program Files\\Unity\\Hub\\Editor\\\n'));
    console.log(chalk.gray('Please install Unity via Unity Hub and try again.\n'));
    process.exit(1);
  }

  // Check for existing .claude directory
  const claudeDir = path.join(projectPath, '.claude');
  let shouldOverwrite = true;

  if (fs.existsSync(claudeDir)) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: 'Found existing .claude directory. Overwrite?',
        default: false
      }
    ]);
    shouldOverwrite = overwrite;
    if (!shouldOverwrite) {
      console.log(chalk.yellow('\nSkipping Claude commands installation.\n'));
    }
  }

  // Ask for Unity version
  const { unityVersion } = await inquirer.prompt([
    {
      type: 'list',
      name: 'unityVersion',
      message: 'Which Unity version is this project using?',
      choices: installs.map((install: UnityInstall) => ({
        name: `${install.version}${install.isUnity6 ? chalk.green(' (Unity 6 - recommended)') : ''}`,
        value: install.version
      }))
    }
  ]);

  const spinner = ora();

  // Step 1: Copy template files (if not skipped)
  if (shouldOverwrite) {
    spinner.start('Installing Claude commands, skills, and agents...');
    try {
      await copyTemplateAsync(projectPath);
      createEditorScripts(projectPath);
      spinner.succeed('Claude commands installed');
    } catch (error) {
      spinner.fail('Failed to install Claude commands');
      if (error instanceof Error) {
        console.log(chalk.red(`Error: ${error.message}`));
      }
      process.exit(1);
    }
  }

  // Step 2: Add MCP package to manifest.json
  spinner.start('Adding ember-mcp package to project...');
  try {
    const manifestPath = path.join(projectPath, 'Packages', 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      addMcpToManifest(manifestPath, unityVersion);
      spinner.succeed('ember-mcp package added');
    } else {
      spinner.warn('manifest.json not found');
    }
  } catch (error) {
    spinner.fail('Failed to add ember-mcp package');
    if (error instanceof Error) {
      console.log(chalk.red(`Error: ${error.message}`));
    }
    process.exit(1);
  }

  // Step 2.5: Enable new Input System
  enableNewInputSystem(projectPath);

  // Step 3: Generate .mcp.json
  spinner.start('Configuring MCP for Claude Code...');
  try {
    generateMcpConfig(projectPath);
    spinner.succeed('MCP configured');
  } catch (error) {
    spinner.fail('Failed to configure MCP');
    if (error instanceof Error) {
      console.log(chalk.red(`Error: ${error.message}`));
    }
    process.exit(1);
  }

  // Step 4: Extract selected Unity install (used in multiple steps)
  const selectedInstall = installs.find((i: UnityInstall) => i.version === unityVersion)!;

  // Step 5: Execute Ember setup (connect, generate, install)
  await executeEmberSetupSteps(selectedInstall.path, projectPath, spinner);

  // Step 6: Open Unity editor
  spinner.start('Opening Unity...');
  try {
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
}

/**
 * Create a new Unity project with Claude Code support
 */
async function createNewProject(): Promise<void> {
  console.log(chalk.blue(`
╔════════════════════════════════════════╗
║       🎮 EmberAI - Create Game         ║
║   AI-powered Unity game development    ║
╚════════════════════════════════════════╝
`));

  // Step 1: Find Unity installations
  console.log(chalk.gray('Finding Unity installations...\n'));
  const installs = findUnityInstalls();

  if (installs.length === 0) {
    console.log(chalk.red('❌ No Unity installations found.\n'));
    console.log(chalk.gray('Unity Hub installs Unity to:'));
    console.log(chalk.gray('  Mac: /Applications/Unity/Hub/Editor/'));
    console.log(chalk.gray('  Windows: C:\\Program Files\\Unity\\Hub\\Editor\\\n'));
    console.log(chalk.gray('Please install Unity via Unity Hub and try again.\n'));
    process.exit(1);
  }

  console.log(chalk.green(`✓ Found ${installs.length} Unity installation${installs.length > 1 ? 's' : ''}\n`));

  // Step 2: Get project details
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'What\'s your game called?',
      validate: (input: string) => {
        const trimmed = input.trim();
        if (!trimmed) return 'Project name is required';
        if (!isValidProjectName(trimmed)) {
          return 'Use only letters, numbers, hyphens, and underscores';
        }
        if (fs.existsSync(path.resolve(trimmed))) {
          return `Folder "${trimmed}" already exists`;
        }
        return true;
      }
    },
    {
      type: 'list',
      name: 'unityVersion',
      message: 'Select Unity version:',
      choices: installs.map((install: UnityInstall) => ({
        name: `${install.version}${install.isUnity6 ? chalk.green(' (Unity 6 - recommended)') : ''}`,
        value: install.version
      }))
    }
  ]);

  const projectName = answers.projectName.trim();
  const projectPath = path.resolve(projectName);
  const selectedInstall = installs.find((i: UnityInstall) => i.version === answers.unityVersion)!;

  console.log(chalk.blue(`\n📁 Creating "${projectName}"...\n`));

  // Step 3: Create Unity project
  const spinner = ora('Creating Unity project (this may take a minute)...').start();

  try {
    await createUnityProject(selectedInstall.path, projectPath);
    spinner.succeed('Unity project created');

    // Enable new Input System (Both mode)
    enableNewInputSystem(projectPath);
  } catch (error) {
    spinner.fail('Failed to create Unity project');
    if (error instanceof Error) {
      console.log(chalk.red(`\nError: ${error.message}`));
      console.log(chalk.gray('\nMake sure Unity is installed correctly and try again.\n'));
    }
    process.exit(1);
  }

  // Step 4: Copy template files and create editor scripts
  spinner.start('Installing Claude commands, skills, and agents...');
  try {
    await copyTemplateAsync(projectPath);
    createEditorScripts(projectPath);
    spinner.succeed('Claude commands installed');
  } catch (error) {
    spinner.fail('Failed to install Claude commands');
    if (error instanceof Error) {
      console.log(chalk.red(`Error: ${error.message}`));
    }
    process.exit(1);
  }

  // Step 5: Add MCP package to Unity's manifest.json
  spinner.start('Adding ember-mcp package to project...');
  try {
    const manifestPath = path.join(projectPath, 'Packages', 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      addMcpToManifest(manifestPath, answers.unityVersion);
      spinner.succeed('ember-mcp package added');
    } else {
      spinner.warn('manifest.json not found');
    }
  } catch (error) {
    spinner.fail('Failed to add ember-mcp package');
    if (error instanceof Error) {
      console.log(chalk.red(`Error: ${error.message}`));
    }
    process.exit(1);
  }

  // Step 6: Generate .mcp.json
  spinner.start('Configuring MCP for Claude Code...');
  try {
    generateMcpConfig(projectPath);
    spinner.succeed('MCP configured');
  } catch (error) {
    spinner.fail('Failed to configure MCP');
    if (error instanceof Error) {
      console.log(chalk.red(`Error: ${error.message}`));
    }
    process.exit(1);
  }

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
    console.log(chalk.gray(`     cd ${EMBER_MCP_DIR} && npm run build && npm start\n`));
  }

  console.log(chalk.white(`  3. ${chalk.cyan('Wait for Unity to finish loading')}`));
  console.log(chalk.gray('     Skills are already installed and verified\n'));
  console.log(chalk.white(`  4. ${chalk.cyan('claude')}`));
  console.log(chalk.gray('     Start building with AI!\n'));

  console.log(chalk.gray('─'.repeat(44)));
  console.log(chalk.gray('\nTip: Use /new-game to start building!'));
  console.log(chalk.gray('Example: /new-game space shooter where you dodge asteroids\n'));
}

/**
 * Main interactive wizard for setting up a game project
 * Detects if running in an existing Unity project and handles accordingly
 */
export async function init(): Promise<void> {
  const cwd = process.cwd();

  // Check if we're in an existing Unity project
  if (isUnityProject(cwd)) {
    await initExistingProject(cwd);
  } else {
    await createNewProject();
  }
}
