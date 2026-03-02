# game-planner 代理实现详解

## 一、代理概述

### 1.1 基本信息

| 属性 | 值 |
|------|-----|
| **名称** | game-planner |
| **描述** | 创建详细的游戏设计文档，规划功能，将实现分解为里程碑 |
| **模型** | Sonnet（需要深度思考和结构化输出） |
| **触发场景** | 开始新游戏或规划主要功能时 |
| **输出文件** | `GAME_DESIGN.md`（项目根目录） |

### 1.2 核心职责

```mermaid
mindmap
  root((game-planner))
    理解愿景
      解析用户描述
      识别核心机制
      确定游戏类型
    创建文档
      结构化设计文档
      限制300行以内
      具体而非模糊
    分解里程碑
      M1: 核心机制
      M2: 游戏循环
      M3: 精修
      M4: 内容
    识别资源
      3D模型/精灵
      音频资源
      环境素材
```

---

## 二、代理配置

### 2.1 YAML 配置结构

```mermaid
graph TB
    A[game-planner 配置] --> B[name: game-planner]
    A --> C[description]
    A --> D[model: sonnet]
    A --> E[tools]

    E --> E1[Read]
    E --> E2[Write]
    E --> E3[Glob]
    E --> E4[Grep]

    style D fill:#6c9,stroke:#333
```

### 2.2 配置详解

```yaml
---
name: game-planner
description: Creates detailed game design documents, plans features, and breaks down implementation into milestones. Use when starting a new game or planning major features.
model: sonnet
tools:
  - Read      # 读取现有文件
  - Write     # 写入 GAME_DESIGN.md
  - Glob      # 查找项目文件
  - Grep      # 搜索特定内容
---
```

### 2.3 为什么选择 Sonnet 模型

```mermaid
graph LR
    A[任务特性] --> B[需要深度推理]
    A --> C[需要结构化输出]
    A --> D[需要创造性规划]

    B --> E[Sonnet 最适合]
    C --> E
    D --> E

    F[Haiku] --> G[太轻量]
    H[Opus] --> I[可能过度]
```

**选择理由**：
- 需要**理解用户的模糊描述**并做出合理推断
- 需要**创建结构化的长文档**（300行）
- 需要**规划可执行的里程碑**
- 需要**平衡创造性和实用性**

---

## 三、工作流程

### 3.1 整体流程

```mermaid
flowchart TD
    A[接收用户描述] --> B[解析游戏概念]
    B --> C{描述是否清晰?}

    C -->|否| D[应用默认假设]
    C -->|是| E[直接使用描述]

    D --> F[推断游戏类型]
    D --> G[推断控制方式]
    D --> H[推断视觉风格]

    F --> I[确定视角]
    G --> J[设计控制方案]
    H --> K[规划美术风格]

    E --> L[填充设计模板]
    I --> L
    J --> L
    K --> L

    L --> M[识别所需资源]
    M --> N[定义里程碑]

    N --> O[写入 GAME_DESIGN.md]
    O --> P[生成报告]

    P --> Q[返回主进程]
```

### 3.2 输入处理流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant Main as 主进程
    participant Planner as game-planner

    User->>Main: /new-game 创建一个太空射击游戏
    Main->>Planner: 委托创建设计文档

    Planner->>Planner: 解析关键信息
    Note over Planner: 类型: 射击游戏<br/>视角: 自上而下<br/>核心: 射击+躲避

    Planner->>Planner: 应用默认假设
    Note over Planner: 控制: WASD+空格<br/>多人: 是（Normcore）<br/>难度: 中等

    Planner->>Planner: 生成设计文档
    Planner-->>Main: GAME_DESIGN.md 已创建
```

---

## 四、设计文档结构

### 4.1 完整文档模板

```mermaid
graph TB
    A[GAME_DESIGN.md] --> B[游戏标题]
    A --> C[概览 Overview]
    A --> D[核心循环 Core Loop]
    A --> E[玩家设计 Player]
    A --> F[目标 Objectives]
    A --> G[游戏元素 Game Elements]
    A --> H[关卡/场景 Levels/Scenes]
    A --> I[UI元素 UI Elements]
    A --> J[所需资源 Assets Needed]
    A --> K[里程碑 Milestones]
    A --> L[技术笔记 Technical Notes]

    C --> C1[类型]
    C --> C2[视角]
    C --> C3[玩家数]
    C --> C4[目标体验]

    G --> G1[敌人表格]
    G --> G2[收集品表格]
    G --> G3[危险物品]

    J --> J1[3D模型/精灵]
    J --> J2[音频]

    K --> K1[M1: 核心机制]
    K --> K2[M2: 游戏循环]
    K --> K3[M3: 精修]
    K --> K4[M4: 内容]
```

### 4.2 文档各部分详解

#### 概览 (Overview)

```markdown
## Overview
**Genre:** [类型 - 如 Platformer, Shooter, Puzzle]
**Perspective:** [视角 - Top-down, Side-view, First-person]
**Players:** Multiplayer (Normcore)
**Target Feel:** [目标体验 - 如 Fast-paced action, Relaxing exploration]
```

**设计要点**：
- **Genre**：确定游戏核心类型
- **Perspective**：决定相机和输入方式
- **Players**：默认多人（可后续改为单人）
- **Target Feel**：指导后续设计的整体基调

#### 核心循环 (Core Loop)

```markdown
## Core Loop
1. [主要动作 - 如 Navigate platforms]
2. [挑战 - 如 Avoid enemies and hazards]
3. [奖励 - 如 Collect coins, reach goal]
4. [进展 - 如 Unlock new levels]
```

**核心循环的重要性**：

```mermaid
graph LR
    A[主要动作] --> B[面对挑战]
    B --> C{成功?}
    C -->|是| D[获得奖励]
    C -->|否| E[失败/重试]
    D --> F[取得进展]
    E --> A
    F --> A
```

#### 玩家设计 (Player)

```markdown
## Player
- **Controls:** [控制方式 - WASD, Space to jump, etc.]
- **Abilities:** [能力 - Jump, Shoot, Dash, etc.]
- **Constraints:** [约束 - Health, lives, etc.]
```

#### 游戏元素 (Game Elements)

**敌人表格**：
| Type | Behavior | Threat |
|------|----------|--------|
| [敌人名称] | [行为模式] | [伤害类型] |

**收集品表格**：
| Item | Effect | Visual |
|------|--------|--------|
| [物品名称] | [效果] | [视觉描述] |

**危险物品表格**：
| Hazard | Effect |
|--------|--------|
| [危险名称] | [效果] |

---

## 五、里程碑系统

### 5.1 四阶段里程碑

```mermaid
graph TB
    subgraph "M1: 核心机制"
        A1[玩家移动]
        A2[基础相机]
        A3[测试场景]
    end

    subgraph "M2: 游戏循环"
        B1[核心敌人/挑战]
        B2[核心收集品/目标]
        B3[胜利/失败条件]
    end

    subgraph "M3: 精修"
        C1[UI实现]
        C2[音频]
        C3[视觉效果]
    end

    subgraph "M4: 内容"
        D1[关卡设计]
        D2[数值平衡]
        D3[最终资源]
    end

    A1 --> B1
    A2 --> B2
    A3 --> B3
    B1 --> C1
    B2 --> C2
    B3 --> C3
    C1 --> D1
    C2 --> D2
    C3 --> D3
```

### 5.2 里程碑详细说明

#### M1: Core Mechanics（核心机制）

**目标**：创建可玩的基础框架

```
- [ ] Player movement        玩家能够移动
- [ ] Basic camera           相机正确跟随
- [ ] Test scene             有一个测试场景
```

**验收标准**：
- 玩家可以用输入控制角色
- 相机显示游戏区域
- 没有崩溃或错误

**预期时间**：首次迭代的基础

#### M2: Gameplay Loop（游戏循环）

**目标**：完整的游戏体验

```
- [ ] [Core enemy/challenge]    核心挑战机制
- [ ] [Core collectible/goal]   核心目标/奖励
- [ ] Win/lose conditions       胜利和失败条件
```

**验收标准**：
- 有明确的障碍需要克服
- 有明确的目标需要达成
- 玩家可以赢或输
- 游戏循环完整可玩

#### M3: Polish（精修）

**目标**：提升游戏质量

```
- [ ] UI implementation        用户界面
- [ ] Audio                    音效和音乐
- [ ] Visual effects           视觉效果
```

**验收标准**：
- UI 显示必要信息
- 音频反馈存在
- 视觉效果增强体验

#### M4: Content（内容）

**目标**：扩展游戏内容

```
- [ ] Level design             多个关卡/区域
- [ ] Balancing                数值平衡调整
- [ ] Final assets             最终美术资源
```

**验收标准**：
- 有可玩的内容量
- 难度曲线合理
- 美术风格统一

### 5.3 里程碑优先级原则

```mermaid
graph TB
    A[优先级排序] --> B{可玩性优先}
    B --> C[M1 必须先完成]
    C --> D{核心循环可用?}
    D -->|否| C
    D -->|是| E[M2 可以开始]
    E --> F{游戏体验完整?}
    F -->|否| E
    F -->|是| G[M3 精修]
    G --> H[M4 内容扩展]
```

---

## 六、默认假设系统

### 6.1 模糊输入处理

当用户描述不够具体时，game-planner 会应用合理的默认假设：

```mermaid
flowchart TD
    A[接收用户输入] --> B{游戏类型明确?}
    B -->|否| C[从关键词推断]

    C --> D{包含 "shoot"?}
    D -->|是| E[类型 = 射击游戏]
    D -->|否| F{包含 "jump" 或 "platform"?}

    F -->|是| G[类型 = 平台跳跃]
    F -->|否| H[使用通用类型]

    A --> I{视角明确?}
    I -->|否| J[根据类型推断]

    J --> K{射击游戏?}
    K -->|是| L[视角 = 自上而下]
    K -->|否| M{平台游戏?}

    M -->|是| N[视角 = 侧视图]
    M -->|否| O[视角 = 第一/第三人称]

    A --> P{控制方式明确?}
    P -->|否| Q[默认 WASD]
```

### 6.2 默认假设规则表

| 假设维度 | 默认值 | 推理依据 |
|----------|--------|----------|
| **游戏视角** | 射击游戏→自上而下<br/>平台游戏→侧视图 | 行业标准 |
| **控制方式** | WASD + 空格 | PC 游戏标准 |
| **视觉风格** | 简单几何图形（除非指定） | 快速原型 |
| **多人模式** | 启用（Normcore） | gamekit 默认 |
| **难度设置** | 中等、公平 | 可体验可调整 |

### 6.3 推断示例

```mermaid
graph LR
    A[用户说: 太空射击游戏] --> B[推断]
    B --> C1[类型 = Shooter]
    B --> C2[视角 = Top-down]
    B --> C3[控制 = WASD移动 + 空格射击]
    B --> C4[敌人 = 小行星/敌机]
    B --> C5[目标 = 获得高分]
```

---

## 七、资源识别

### 7.1 资源分类

```mermaid
mindmap
  root((所需资源))
    3D模型/精灵
      玩家角色
      敌人/NPC
      环境物体
      道具/收集品
    音频
      背景音乐
      音效SFX
      语音台词可选
    纹理/材质
      地面纹理
      物体材质
      特效纹理
    动画可选
      角色动画
      物体动画
    UI素材
      图标
      字体
      界面元素
```

### 7.2 资源列表生成

game-planner 会为 asset-finder 生成清晰的资源需求清单：

```markdown
## Assets Needed

### 3D Models / Sprites
- [ ] Spaceship player model
- [ ] Asteroid models (3-5 variations)
- [ ] Laser projectile
- [ ] Explosion effect sprites
- [ ] Star background texture

### Audio
- [ ] Background music (space theme, loopable)
- [ ] Laser shooting sound
- [ ] Explosion sound effects
- [ ] Engine hum/thruster sound
- [ ] Power-up collection sound
```

### 7.3 资源优先级

```mermaid
graph TB
    A[资源需求] --> B[必需资源 M1]
    A --> C[重要资源 M2]
    A --> D[增强资源 M3+]

    B --> B1[玩家表示]
    B --> B2[基础环境]

    C --> C1[敌人表示]
    C --> C2[收集品表示]

    D --> D1[音效]
    D --> D2[特效]
    D --> D3[UI美术]
```

---

## 八、输出格式

### 8.1 报告模板

game-planner 完成后会生成以下报告：

```
CREATED: GAME_DESIGN.md
MILESTONES: 4 milestones identified
ASSETS NEEDED:
  - Spaceship model
  - Asteroid models (5 variations)
  - Laser and explosion effects
  - Space-themed music
  - SFX for shooting and explosions
READY TO BUILD:
  - Create main scene with space background
  - Build player spaceship with WASD movement
  - Add laser shooting with spacebar
  - Implement asteroid spawning system
  - Set up collision and scoring
```

### 8.2 与其他代理的协作

```mermaid
sequenceDiagram
    participant Main as 主进程
    participant Planner as game-planner
    participant Finder as asset-finder
    participant Iterator as iterator

    Main->>Planner: 创建游戏设计文档
    Planner-->>Main: GAME_DESIGN.md + 资源清单

    par 并行启动
        Main->>Finder: 搜索 3D 模型
        Main->>Finder: 搜索音频资源
    end

    Finder-->>Main: 资源已下载

    Main->>Iterator: 实现 M1 里程碑
    Iterator-->>Main: M1 完成

    Main->>Iterator: 实现 M2 里程碑
    Iterator-->>Main: M2 完成
```

---

## 九、设计原则

### 9.1 五大核心原则

```mermaid
graph TB
    A[设计原则] --> B1[简洁性<br/>300行以内]
    A --> B2[具体性<br/>避免模糊]
    A --> B3[优先级<br/>可玩性优先]
    A --> B4[早期识别<br/>资源先行]
    A --> B5[多人友好<br/>默认支持]

    B1 --> C[不 overwhelming]
    B2 --> D[明确实现]
    B3 --> E[快速迭代]
    B4 --> F[并行搜索]
    B5 --> G[可扩展性]
```

### 9.2 原则详解

#### 1. Keep it under 300 lines（简洁性）

**原因**：
- 太长难以阅读和执行
- 关键信息可能被淹没
- 快速原型不需要过度设计

**实现**：
- 使用表格代替长段落
- 使用要点列表
- 删除冗余描述

#### 2. Be specific（具体性）

**避免**：
```
"Add some enemies"  模糊
```

**推荐**：
```
"Red cube enemy that patrols back and forth,
damaging player on contact"  具体
```

#### 3. Prioritize milestones（优先级）

**原则**：
- M1 必须首先完成才能测试
- M2 完成后游戏可玩
- M3+ 是锦上添花

#### 4. Identify assets early（资源识别）

**原因**：
- asset-finder 可以并行工作
- 在实现前就知道需要什么
- 避免实现等待资源

#### 5. Assume multiplayer（多人友好）

**技术影响**：
- 预制体必须放在 Resources/
- 需要考虑所有权和同步
- 状态管理需要网络支持

---

## 十、技术笔记

### 10.1 技术规范

设计文档包含的技术规范部分：

```markdown
## Technical Notes
- Multiplayer: Normcore (assumed)
- Prefabs in Resources/ for networking
- [其他技术决策]
```

### 10.2 Normcore 多人规范

```mermaid
graph TB
    A[多人游戏考虑] --> B[预制体位置]
    A --> C[状态同步]
    A --> D[所有权]

    B --> B1[运行时生成的对象<br/>必须放在 Resources/]

    C --> C1[RealtimeView<br/>同步组件]
    C --> C2[RealtimeTransform<br/>同步位置]

    D --> D1[RealtimeRequestOwnership<br/>获取控制权]
```

---

## 十一、完整示例

### 11.1 输入示例

**用户输入**：
```
/new-game 太空射击游戏，玩家控制飞船躲避小行星并射击得分
```

### 11.2 输出示例

```markdown
# Space Shooter Game

## Overview
**Genre:** Shooter
**Perspective:** Top-down
**Players:** Multiplayer (Normcore)
**Target Feel:** Fast-paced action with increasing difficulty

## Core Loop
1. Fly spaceship and dodge incoming asteroids
2. Shoot asteroids to destroy them
3. Earn points for each asteroid destroyed
4. Difficulty increases over time (faster asteroids, more frequent)

## Player
- **Controls:** WASD to move, Spacebar to shoot
- **Abilities:** Shoot laser projectiles
- **Constraints:** Limited ship health (3 hits = game over)

## Objectives
- **Win Condition:** Survival mode - achieve highest score
- **Lose Condition:** Health reaches zero
- **Scoring:** 10 points per asteroid destroyed

## Game Elements

### Enemies
| Type | Behavior | Threat |
|------|----------|--------|
| Asteroid | Drifts toward player, random rotation | Contact damage |
| Asteroid Large | Slower, splits into 2 medium asteroids | Contact damage |

### Collectibles
| Item | Effect | Visual |
|------|--------|--------|
| Health Pack | Restores 1 health | Green cross |

### Hazards
| Hazard | Effect |
|--------|--------|
| Asteroid Collision | -1 health on contact |

## Levels/Scenes
1. **Main Space Scene:** Infinite space with starfield background

## UI Elements
- [ ] Health display (3 hearts or bar)
- [ ] Score counter
- [ ] Game over screen with final score

## Assets Needed

### 3D Models / Sprites
- [ ] Spaceship player model
- [ ] Asteroid models (3-5 variations)
- [ ] Laser projectile sprite/beam
- [ ] Explosion particle effect
- [ ] Health pickup sprite
- [ ] Star background texture

### Audio
- [ ] Background music (upbeat space theme, loopable)
- [ ] Laser shooting sound
- [ ] Explosion sound effects
- [ ] Impact/damage sound
- [ ] Health pickup sound
- [ ] Game over sound

## Milestones

### M1: Core Mechanics
- [ ] Player spaceship with WASD movement
- [ ] Camera following player (top-down view)
- [ ] Basic space background scene
- [ ] Laser shooting with spacebar

### M2: Gameplay Loop
- [ ] Asteroid spawning system
- [ ] Collision detection (lasers destroy asteroids)
- [ ] Player health system
- [ ] Score tracking
- [ ] Game over state

### M3: Polish
- [ ] Health UI display
- [ ] Score UI counter
- [ ] Explosion visual effects
- [ ] Audio integration (music + SFX)
- [ ] Screen shake on damage

### M4: Content
- [ ] Difficulty progression (asteroids faster/more frequent)
- [ ] Health pickup spawning
- [ ] High score saving
- [ ] Final asset polish

## Technical Notes
- Multiplayer: Normcore (assumed)
- Prefabs in Resources/ for networking (asteroids, lasers, pickups)
- Asteroid spawning uses object pooling for performance
- Background music should loop seamlessly
```

---

## 十二、与其他代理的协作

### 12.1 代理协作图

```mermaid
graph TB
    A[new-game 命令] --> B[game-planner]
    B --> C[GAME_DESIGN.md]

    C --> D[asset-finder xN]
    C --> E[iterator]
    C --> F[level-designer]

    D --> D1[并行搜索模型]
    D --> D2[并行搜索音频]

    E --> E1[实现 M1]
    E --> E2[实现 M2]

    F --> F1[构建关卡]

    E1 --> G[quality-gate]
    E2 --> G
    F1 --> G

    G --> H{通过?}
    H -->|否| E1
    H -->|是| I[完成]
```

### 12.2 代理职责分工

| 代理 | 职责 | 调用时机 |
|------|------|----------|
| **game-planner** | 规划游戏，生成设计文档 | `/new-game` 开始 |
| **asset-finder** | 搜索和下载资源 | 规划完成后，并行启动 |
| **iterator** | 迭代实现里程碑 | 资源就位后 |
| **level-designer** | 设计和构建关卡 | M2+ 阶段 |
| **code-debugger** | 调试和修复 | 出现问题时 |
| **optimizer** | 性能优化 | M3+ 阶段 |

---

## 十三、最佳实践

### 13.1 输入建议

**好的输入**：
```
✅ "太空射击游戏，躲避小行星并射击"
✅ "平台跳跃游戏，收集金币到达终点"
```

**不够清晰的输入**：
```
❌ "做一个游戏"                    太模糊
❌ "好玩的游戏"                    缺少类型
```

### 13.2 文档审查清单

game-planner 应该自检：

```
文档完整性检查：
□ 游戏类型明确
□ 视角确定
□ 核心循环清晰
□ 玩家能力列出
□ 目标条件说明
□ 游戏元素表格完整
□ 资源清单具体
□ 里程碑可执行
□ 技术规范包含
□ 总行数 < 300
```

---

## 十四、类比总结

### 14.1 类比理解

**game-planner 就像是"建筑设计师"**：

| 建筑设计师 | game-planner |
|-----------|--------------|
| 客户说"我要一栋房子" | 用户说"我要一个射击游戏" |
| 询问需求、偏好 | 理解游戏概念 |
| 画出设计图纸 | 生成 GAME_DESIGN.md |
| 列出材料清单 | 识别所需资源 |
| 规划施工阶段 | 分解里程碑 |
| 考虑技术规范 | 标注技术笔记 |

### 14.2 工作流程类比

```mermaid
graph LR
    A[客户需求] --> B[设计师理解]
    B --> C[设计图纸]
    C --> D[材料清单]
    D --> E[施工计划]

    F[用户描述] --> G[game-planner 理解]
    G --> H[GAME_DESIGN.md]
    H --> I[资源清单]
    I --> J[里程碑计划]
```

---

## 十五、总结

### 15.1 核心价值

game-planner 代理是整个游戏开发流程的"大脑"：

```mermaid
mindmap
  root((game-planner 价值))
    结构化思考
      将模糊想法转化为具体计划
      提供清晰的实施路线
    资源协调
      提前识别需求
      支持并行搜索
    质量保证
      设定可执行的里程碑
      定义验收标准
    协作中枢
      连接其他代理
      统一开发方向
```

### 15.2 关键文件位置

| 文件 | 路径 | 说明 |
|------|------|------|
| 代理配置 | `template/.claude/agents/game-planner.md` | 代理定义 |
| 输出文档 | `GAME_DESIGN.md`（项目根目录） | 游戏设计文档 |
| 相关命令 | `template/.claude/commands/new-game.md` | 调用入口 |

### 15.3 参考资源

### 相关代理
- [asset-finder 代理](../agents/asset-finder.md) - 资源搜索
- [iterator 代理](../agents/iterator.md) - 迭代实现
- [level-designer 代理](../agents/level-designer.md) - 关卡设计
- [code-debugger 代理](../agents/code-debugger.md) - 调试修复

### 相关技能
- adding-player - 玩家创建
- adding-enemies - 敌人创建
- adding-collectibles - 收集品创建
- multiplayer-setup - 多人设置

---

**文档生成时间**：2026-02-02
**分析版本**：gamekit-cli v0.0.2
