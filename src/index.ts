#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { init } from './commands/init.js';
import { runDoctor } from './commands/doctor.js';
import { sync } from './commands/sync.js';
import { sync } from './commands/sync.js';
import { sync } from './commands/sync.js';
import { sync } from './commands/sync.js';
import { sync } from './commands/sync.js';
import { maybeCheckForUpdates, getCurrentVersion, checkForAppliedUpdate } from './utils/updater.js';

// Check if an update was applied in the background
const updatedVersion = checkForAppliedUpdate();
if (updatedVersion) {
  console.log(chalk.green(`Updated to emberai v${updatedVersion}\n`));
}

// Check for updates in background (non-blocking)
maybeCheckForUpdates();

const program = new Command();

program
  .name('emberai')
  .description('AI-powered Unity game development with Claude');

// Version command
program
  .command('version')
  .description('Show the current version')
  .action(() => {
    console.log(getCurrentVersion());
  });

// Main command - interactive wizard
program
  .command('init')
  .description('Set up a Unity project for AI-powered game development')
  .action(init);

// Doctor - diagnose issues
program
  .command('doctor')
  .description('Diagnose setup issues and check configuration')
  .action(runDoctor);

// Sync - update commands and skills
program
  .command('sync')
  .description('Sync latest commands and skills from emberai-cli')
  .action(sync);

// Sync - update commands and skills
program
  .command('sync')
  .description('Sync latest commands and skills from emberai-cli')
  .action(sync);

// Show error for unknown commands
program.on('command:*', (operands) => {
  console.error(chalk.red(`Unknown command: ${operands[0]}`));
  console.error(`Run ${chalk.cyan('emberai --help')} to see available commands.`);
  console.error(`Run ${chalk.cyan('emberai init')} to initialize a new project or add emberai to an existing one.`);
  process.exit(1);
});

// Default to init if no command specified
if (process.argv.length === 2) {
  init();
} else {
  program.parse();
}
