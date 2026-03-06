# Unity + Claude Code 项目

本项目已配置为使用 Claude Code 和 Ember MCP 进行 AI 驱动的游戏开发。

## 项目结构

```
.
├── Assets/                    # Unity 项目资源
├── .claude/                  # Claude Code 配置
│   ├── CLAUDE.md            # Claude 的 Unity 专家身份
│   ├── commands/           # 用户命令 (/new-game, /playtest 等)
│   ├── skills/              # 游戏开发技能 (自动触发)
│   ├── agents/             # 专业工作代理
│   └── settings.local.json   # 权限和钩子
├── .ember/                   # Ember MCP 配置
│   ├── mcp-port.json        # Unity HTTP 监听端口
│   └── setup-result.json    # 设置状态
└── Packages/               # Unity 包 (Ember 等)
```

## 快速开始

1. **初始化项目**
   ```bash
   emberai init
   ```
   此命令会：
   - 检测 Unity 版本
   - 设置 Ember MCP 连接
   - 生成并安装技能
   - 打开 Unity 编辑器

2. **开始开发**
   - 在此目录中打开 Claude Code
   - 说"我想做一个 [游戏类型]" 或使用 `/new-game`

## 可用命令

| 命令 | 用途 |
|---------|---------|
| `/super-game [想法]` | 使用完整 superpowers 工作流开始新游戏 |
| `/new-game [想法]` | 带规划的开始新游戏 |
| `/playtest` | 测试游戏并捕获错误 |
| `/auto-test` | 无需手动干预的自动化测试 |
| `/build [平台]` | 构建 Windows、Mac、WebGL 等 |
| `/find-asset [东西]` | 搜索免费资源 |
| `/preview-assets [东西]` | 下载前预览资源 |
| `/explain [主题]` | 学习游戏概念 |
| `/fix [问题]` | 修复特定问题 |
| `/snapshot` | 捕获完整场景状态用于调试 |
| `/screenshot` | 捕获游戏画面用于视觉验证 |
| `/rollback` | 撤销 Claude 做的最近更改 |
| `/convert-models` | 将 FBX/OBJ 转换为运行时预制件 |

## Ember MCP 技能

本项目包含 37 个由 Ember MCP 驱动的 Unity 技能：

### 核心技能
| 技能 | 描述 |
|------|-------------|
| `ember-gameobject` | GameObject 创建、查找、操作 |
| `ember-component` | 组件操作和管理 |
| `ember-prefab` | 预制件创建和实例化 |
| `ember-asset` | 资源导入、删除、移动、查找 |
| `ember-scene` | 场景管理和操作 |
| `ember-script` | 脚本创建和修改 |

### 视觉技能
| 技能 | 描述 |
|------|-------------|
| `ember-material` | 材质创建和修改 |
| `ember-texture` | 纹理操作 |
| `ember-shader` | 着色器操作 |
| `ember-light` | 灯光设置和控制 |
| `ember-camera` | 相机操作 |
| `ember-ui` | UI 元素创建 |

### 动画技能
| 技能 | 描述 |
|------|-------------|
| `ember-animator` | 动画控制器操作 |
| `ember-timeline` | Timeline 和 Playables 操作 |
| `ember-vfx` | 视觉效果和粒子 |
| `ember-vfxgraph` | VFX Graph 操作 |

### 物理技能
| 技能 | 描述 |
|------|-------------|
| `ember-physics` | 物理组件和碰撞 |
| `ember-navmesh` | 导航网格操作 |

### 编辑器技能
| 技能 | 描述 |
|------|-------------|
| `ember-editor` | 编辑器操作和播放控制 |
| `ember-project` | 项目设置和操作 |
| `ember-console` | 控制台日志操作 |
| `ember-debug` | 调试和诊断 |
| `ember-profiler` | 性能分析 |

### 构建技能
| 技能 | 描述 |
|------|-------------|
| `ember-compile` | 编译检查和错误 |
| `ember-refresh` | 资源数据库刷新 |
| `ember-validation` | 验证检查 |
| `ember-optimization` | 性能优化 |
| `ember-test` | 测试操作 |

### 专项技能
| 技能 | 描述 |
|------|-------------|
| `ember-model` | 3D 模型操作 |
| `ember-audio` | 音频和声音操作 |
| `ember-cinemachine` | Cinemachine 相机操作 |
| `ember-screenshot` | 截图捕获 |
| `ember-probuilder` | ProBuilder 网格操作 |
| `ember-scriptableobject` | ScriptableObject 操作 |
| `ember-batchexecute` | 批量命令执行 |
| `ember-event` | 事件系统操作 |
| `ember-sample` | 示例技能模板 |

## 游戏构建技能

### 添加游戏元素
- `adding-player` - 玩家移动和控制
- `adding-enemies` - 敌人 AI 和行为
- `adding-collectibles` - 收集品和奖励
- `adding-audio` - 音效和音乐
- `adding-ui` - 血条、分数、菜单
- `adding-juice` - 屏幕震动、粒子、打磨

### 技术设置
- `setting-up-physics` - 碰撞和刚体
- `setting-up-triggers` - 触发器检测
- `setting-up-cameras` - 相机跟随和设置
- `creating-animations` - 动画控制器
- `creating-materials` - 颜色和纹理
- `using-3d-models` - FBX 转预制件

### 进度系统
- `level-progression` - 场景、存档、检查点
- `multiplayer-setup` - Normcore 集成
- `quick-tweaks` - 速度、大小、颜色调整

### 质量保证
- `scene-awareness` - 状态捕获用于回滚
- `verify-changes` - 自动测试修复循环
- `quality-gate` - 完成前的质量检查清单
- `screenshot` - 视觉验证捕获

## 自主质量功能

### 自动触发技能
- **scene-awareness** - 在更改前后捕获状态
- **verify-changes** - 修改后自动测试和修复
- **quality-gate** - 在展示工作前检查质量
- **using-3d-models** - 自动将 FBX 转换为预制件

### 迭代代理
`iterator` 代理编排构建-测试-修复循环：
1. 构建功能
2. 自动测试
3. 修复问题
4. 重复直到质量门通过

### 视觉验证
Claude 可以截取游戏画面来验证：
- UI 看起来正确
- 材质已应用
- 位置正确
- 整体视觉质量

## 可用代理

| 代理 | 用途 |
|-------|---------|
| `game-planner` | 创建游戏设计文档 |
| `asset-finder` | 搜索免费资源 |
| `level-designer` | 构建游戏关卡 |
| `code-debugger` | 查找并修复错误 |
| `optimizer` | 提高性能 |
| `iterator` | 编排质量迭代 |

## 工作原理

只需描述你想要的游戏。Claude 处理所有 Unity 实现并验证自己的工作。

**示例：**
> "我想做一个收集硬币的平台游戏"

Claude 会构建它、测试它、修复问题，只展示给你工作的结果。

## 可选：多人游戏 ([Normcore](https://normcore.io/))

游戏默认支持使用 Normcore 的多人游戏。对于单人游戏，只需说"将此设为单人模式"。

## 系统要求

- Unity 2022.3+ 或 Unity 6
- Node.js 18+
- Claude Code CLI

---

模板由 [gamekit-cli](https://github.com/gamekit-agent/gamekit-cli) 创建。
