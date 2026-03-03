import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import * as path from 'path';
import {
  findUnityInstalls,
  createUnityProject,
  openUnityProject,
  isUnityProject,
  UnityInstall
} from '../utils/unity.js';
import { copyTemplateAsync } from '../utils/template.js';
import { addMcpToManifest } from '../utils/manifest.js';
import { generateMcpConfig, emberMcpExists } from '../utils/mcp.js';
import { EMBER_MCP_PATH } from '../utils/platform.js';
import { createEditorScripts } from '../utils/assets.js';

/**
 * Validate project name to prevent path traversal
 */
export function isValidProjectName(name: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(name);
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

  console.log(chalk.green(`
+------------------------------------------+
|       ✓ Project Initialized!            |
+------------------------------------------+
`));
  console.log(chalk.blue('Next steps:\n'));
  console.log(chalk.white(`  1. ${chalk.cyan('Ensure ember-mcp gateway is running')}`));
  console.log(chalk.gray('     cd D:/NodejsP/ember-mcp && npm start\n'));
  console.log(chalk.white(`  2. ${chalk.cyan('Restart Unity')}`));
  console.log(chalk.gray('     To load the ember-mcp package\n'));
  console.log(chalk.white(`  3. ${chalk.cyan('claude')}`));
  console.log(chalk.gray('     Start building with AI!\n'));

  if (!emberMcpExists()) {
    console.log(chalk.yellow('Warning: ember-mcp gateway not found at ' + EMBER_MCP_PATH));
    console.log(chalk.gray('  Run "npm run build" in ember-mcp directory first.\n'));
  }

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

  // Step 7: Open Unity
  spinner.start('Opening Unity...');
  try {
    openUnityProject(selectedInstall.path, projectPath);
    spinner.succeed('Unity is opening');
  } catch (error) {
    spinner.warn('Could not open Unity automatically');
    console.log(chalk.gray('  Please open the project manually in Unity Hub.\n'));
  }

  // Step 8: Check ember-mcp gateway and show final instructions
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
  console.log(chalk.gray('     ember-mcp Unity package will auto-register\n'));
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
