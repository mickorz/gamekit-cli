# super-sync Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create CLI command `emberai sync` and slash command `/super-sync` to sync latest commands/skills/agents to existing projects.

**Architecture:** CLI command in `src/commands/sync.ts` uses existing template.ts utilities to copy template files. Slash command calls the CLI. Force overwrite without backup.

**Tech Stack:** TypeScript, Node.js, Commander.js, chalk, ora

---

## Task 1: Create CLI sync Command

**Files:**
- Create: `src/commands/sync.ts`

**Step 1: Create sync.ts file**

Create file at `src/commands/sync.ts`:

```typescript
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { ensureTemplate, copyDirectorySync, writeCommandsVersion, writeHashes } from '../utils/template.js';
import { isUnityProject } from '../utils/unity.js';
import { getCurrentVersion } from '../utils/updater.js';

/**
 * Sync the latest commands, skills, and agents to a project
 */
export async function sync(projectPath?: string): Promise<void> {
  const destPath = projectPath || process.cwd();

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

    // Copy template to project (overwrite existing)
    const templateClaudeDir = path.join(templatePath, '.claude');
    copyDirectorySync(templateClaudeDir, claudeDir);

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
```

**Step 2: Verify file syntax**

Run: `cd "D:/UnityP/AllUnityMCP/gamekit-cli" && npx tsc --noEmit src/commands/sync.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add src/commands/sync.ts
git commit -m "feat: add emberai sync command"
```

---

## Task 2: Register sync Command in CLI

**Files:**
- Modify: `src/index.ts:5-6,42-43`

**Step 1: Add import for sync command**

Modify line 5-6 in `src/index.ts`:

```typescript
import { init } from './commands/init.js';
import { runDoctor } from './commands/doctor.js';
import { sync } from './commands/sync.js';
```

**Step 2: Add sync command registration**

Add after the doctor command (after line 42):

```typescript
// Sync - update commands and skills
program
  .command('sync')
  .description('Sync latest commands and skills from emberai-cli')
  .action(sync);
```

**Step 3: Verify build**

Run: `cd "D:/UnityP/AllUnityMCP/gamekit-cli" && npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/index.ts
git commit -m "feat: register sync command in CLI"
```

---

## Task 3: Create super-sync Slash Command

**Files:**
- Create: `template/.claude/commands/super-sync.md`

**Step 1: Create super-sync.md file**

Create file at `template/.claude/commands/super-sync.md`:

```markdown
---
description: Sync latest commands and skills from emberai-cli to the current project
---

# /super-sync

Sync the latest commands, skills, and agents from your installed emberai-cli to the current project.

## What This Command Does

This command updates your project's `.claude/` directory with the latest:
- Commands (like `/super-game`, `/new-game`, etc.)
- Skills (like `adding-player`, `quality-gate`, etc.)
- Agents (like `game-planner`, `asset-finder`, etc.)
- CLAUDE.md configuration

## Usage

/super-sync

## Process

1. Run `emberai sync` command in the project directory
2. This will:
   - Download latest template if needed
   - Copy all files from template to project
   - Update version tracking

## Important Notes

**This command will overwrite existing files.** Make sure you have committed your changes to git before running this.

## Recovery

If you accidentally overwrite important changes:

```bash
# Use git to recover previous versions
git checkout HEAD -- .claude/commands/my-custom-command.md
```
```

**Step 2: Commit**

```bash
git add template/.claude/commands/super-sync.md
git commit -m "feat: add /super-sync slash command"
```

---

## Task 4: Update CLAUDE.md Commands Table

**Files:**
- Modify: `template/.claude/CLAUDE.md:88-100`

**Step 1: Add super-sync to commands table**

Find the commands table and add `/super-sync` entry:

```markdown
| Command | What It Does |
|---------|--------------|
| `/super-game [description]` | Start a new game with full superpowers workflow (interactive brainstorming, two-stage reviews) |
| `/super-sync` | Sync latest commands and skills from emberai-cli |
| `/new-game [description]` | Start a new game with full planning |
```

**Step 2: Commit**

```bash
git add template/.claude/CLAUDE.md
git commit -m "docs: add /super-sync to commands table"
```

---

## Task 5: Verification

**Files:**
- None (verification task)

**Step 1: Build the project**

Run: `cd "D:/UnityP/AllUnityMCP/gamekit-cli" && npm run build`
Expected: Build succeeds without errors

**Step 2: Verify CLI command is registered**

Run: `cd "D:/UnityP/AllUnityMCP/gamekit-cli" && node dist/index.js --help`
Expected: Output includes `sync` command

**Step 3: Verify slash command file exists**

Run: `ls -la template/.claude/commands/super-sync.md`
Expected: File exists

**Step 4: Final status check**

Run: `git status`
Expected: Clean working tree

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Create sync.ts command | `src/commands/sync.ts` |
| 2 | Register in CLI | `src/index.ts` |
| 3 | Create slash command | `template/.claude/commands/super-sync.md` |
| 4 | Update CLAUDE.md | `template/.claude/CLAUDE.md` |
| 5 | Verification | Build and test |

**Total estimated time:** 10-15 minutes
