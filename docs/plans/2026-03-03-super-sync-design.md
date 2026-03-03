# super-sync 命令设计文档

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to create the implementation plan.

**Goal:** 创建 CLI 命令 `emberai sync` 和斜杠命令 `/super-sync`，用于将最新的 commands/skills/agents 同步到已有项目

**Design Date:** 2026-03-03

**Decision Summary:**
- 两个入口：CLI (`emberai sync`) + 斜杠命令 (`/super-sync`)
- 强制覆盖所有文件
- 不备份，依赖 git 恢复

---

## 一、整体架构

```mermaid
flowchart TD
    subgraph UserEntry [用户入口]
        A[emberai sync]
        B[/super-sync 斜杠命令]
    end

    subgraph CLI [CLI 命令]
        C[commands/sync.ts]
        D[template.ts 工具函数]
    end

    subgraph Template [模板系统]
        E[template/.claude/]
        F[本地缓存 ~/.emberai/template/]
    end

    A --> C
    B -->|调用| A
    C --> D
    D --> E
    D --> F
```

### 执行流程

```
1. 确定项目路径
    ↓
2. 验证是 Unity 项目
    ↓
3. 获取模板路径
    ↓
4. 复制模板到项目
    ↓
5. 更新版本文件
    ↓
6. 更新哈希文件
    ↓
7. 输出同步结果
```

---

## 二、CLI 命令实现

### 新增文件: `src/commands/sync.ts`

```typescript
#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { ensureTemplate, copyDirectorySync, writeCommandsVersion, writeHashes } from '../utils/template.js';

export async function sync(projectPath?: string): Promise<void> {
  // 确定目标项目路径
  const destPath = projectPath || process.cwd();
  const claudeDir = path.join(destPath, '.claude');

  // 检查是否在 Unity 项目中
  if (!fs.existsSync(path.join(destPath, 'Assets', 'ProjectSettings'))) {
    console.log(chalk.red('Error: Not a Unity project. Run this command in a Unity project.'));
    process.exit(1);
  }

  // 检查 .claude 目录是否存在
  if (!fs.existsSync(claudeDir)) {
    console.log(chalk.yellow('No .claude directory found. Run "emberai init" first.'));
    process.exit(0);
  }

  console.log(chalk.cyan('Syncing latest commands and skills...'));

  // 获取模板路径
  const templatePath = await ensureTemplate();
  const templateClaudeDir = path.join(templatePath, '.claude');

  // 统计文件数量
  let fileCount = 0;
  const countFiles = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        countFiles(path.join(dir, entry.name));
      } else {
        fileCount++;
      }
    }
  };
  countFiles(templateClaudeDir);

  // 复制模板到项目（覆盖现有文件）
  copyDirectorySync(templateClaudeDir, claudeDir);

  // 更新版本文件
  writeCommandsVersion(destPath);

  // 更新哈希文件
  writeHashes(destPath);

  console.log(chalk.green(`Done! Synced ${fileCount} files.`));
}
```

### 修改文件: `src/index.ts`

在 Commander 程序中添加 sync 命令:

```typescript
import { sync } from './commands/sync.js';

// 在 program 定义中添加
program
  .command('sync')
  .description('Sync latest commands and skills to the current project')
  .action(sync);
```

---

## 三、斜杠命令实现

### 新增文件: `template/.claude/commands/super-sync.md`

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

---

## 四、文件清单

### 需要创建的文件

| 文件路径 | 说明 |
|----------|------|
| `src/commands/sync.ts` | CLI sync 命令实现 |
| `template/.claude/commands/super-sync.md` | 斜杠命令定义 |

### 需要修改的文件

| 文件路径 | 修改内容 |
|----------|----------|
| `src/index.ts` | 添加 `sync` 命令注册 |
| `template/.claude/CLAUDE.md` | 添加 `/super-sync` 到命令表格 |

---

## 五、设计决策记录

| 决策点 | 选项 | 选择 | 原因 |
|--------|------|------|------|
| 入口方式 | A/B/C | A: CLI + 斜杠 | 两个入口，斜杠调用 CLI |
| 覆盖行为 | 1/2/3 | 3: 强制覆盖 | 简单直接 |
| 备份策略 | 1/2/3 | 3: 不备份 | 依赖 git 恢复 |
