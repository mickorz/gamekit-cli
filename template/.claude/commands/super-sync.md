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
