import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { ensureTemplate, writeCommandsVersion, writeHashes } from '../utils/template.js';
import { isUnityProject } from '../utils/unity.js';
import { getCurrentVersion } from '../utils/updater.js';

/**
 * Recursively copy a directory
 */
function copyDirectory(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    // Skip symlinks for security
    if (entry.isSymbolicLink()) {
      continue;
    }

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
  } else {
    fs.copyFileSync(srcPath, destPath);
  }
  }
}

/**
 * Sync the latest commands, skills, and agents to a project
 */
export async function sync(projectPath?: string): Promise<void> {
  // Handle case where Commander.js passes an empty object
  const destPath = (typeof projectPath === 'string' && projectPath) ? projectPath : process.cwd();

  // Validate we're in a Unity project
  if (!isUnityProject(destPath)) {
    console.log(chalk.red('Error: Not a Unity project.'));
    console.log(chalk.gray('Run this command in a Unity project directory.'));
    process.exit(1);
  }

  const claudeDir = path.join(destPath, '.claude');

  // Check if .claude directory exists
  if (!fs.existsSync(claudeDir)) {
    console.log(chalk.yellow('No .claude directory found.'));
    console.log(chalk.gray('Run "emberai init" first to install Claude commands.'));
    process.exit(0);
  }

  console.log(chalk.cyan('Syncing latest commands and skills...\n'));

  const spinner = ora('Downloading latest template...').start();

  try {
    // Get template path (downloads if needed)
    const templatePath = await ensureTemplate();
    spinner.text = 'Copying files...';

    // Copy template/.claude to project/.claude
    const templateClaudeDir = path.join(templatePath, '.claude');
    copyDirectory(templateClaudeDir, claudeDir);

    // Update version file
    writeCommandsVersion(destPath);

    // Update hashes file
    writeHashes(destPath);

    spinner.succeed('Sync complete!');

    // Show summary
    console.log(chalk.green(`\n  Updated to v${getCurrentVersion()}`));
    console.log(chalk.gray('\n  Files updated:'));

    // List key directories
    const dirs = ['commands', 'skills', 'agents'];
    for (const dir of dirs) {
      const dirPath = path.join(claudeDir, dir);
      if (fs.existsSync(dirPath)) {
        const count = fs.readdirSync(dirPath).length;
        console.log(chalk.white(`    - ${dir}: ${count} items`));
      }
    }

    console.log(chalk.gray('\n  Tip: Use git to review changes or revert if needed.'));

  } catch (error) {
    spinner.fail('Sync failed');
    if (error instanceof Error) {
      console.log(chalk.red(`Error: ${error.message}`));
    }
    process.exit(1);
  }
}
