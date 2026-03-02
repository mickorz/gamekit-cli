# new-game 命令执行流程分析文档

## 一、命令概述

### 1.1 命令定义

`/new-game` 是 gamekit-cli 中用于创建新游戏项目的核心命令，它是一个完整的游戏开发启动流程，从概念到可玩原型的全流程自动化。

**命令格式**：`/new-game [游戏描述]`

**示例**：
- `/new-game space shooter where you dodge asteroids`
- `/new-game 3D platformer with coins and enemies`
- `/new-game Create a mini golf game with 3 holes`

### 1.2 核心能力

| 能力 | 描述 |
|------|------|
| 游戏设计 | 自动生成结构化的游戏设计文档 |
| 资源获取 | 并行搜索并下载免费游戏资源 |
| 项目构建 | 创建标准化的 Unity 项目结构 |
| 代码实现 | 使用专用技能自动实现游戏功能 |
| 质量保证 | 自动测试和质量检查 |

---

## 二、执行流程总览

### 2.1 整体流程图

```mermaid
flowchart TD
    A[用户输入 /new-game] --> B[接收游戏描述参数]
    B --> C{启动 game-planner 代理}
    C --> D[生成 GAME_DESIGN.md]
    D --> E{解析资源需求}

    E --> F[并行启动 asset-finder 代理]
    F --> G1[搜索角色模型]
    F --> G2[搜索环境资源]
    F --> G3[搜索音效]
    F --> G4[搜索背景音乐]

    G1 --> H[汇总资源结果]
    G2 --> H
    G3 --> H
    G4 --> H

    H --> I[创建项目目录结构]
    I --> J[开始里程碑 M1 实现]

    J --> K1[创建主场景]
    K1 --> K2[构建玩家控制器]
    K2 --> K3[设置相机]
    K3 --> K4[基础游戏循环]

    K4 --> L[质量门检查]
    L --> M{是否通过?}
    M -->|否| N[修复问题]
    N --> L
    M -->|是| O[输出完成报告]

    O --> P[通知用户可以测试]
```

### 2.2 时间线流程

```mermaid
timeline
    title new-game 命令执行时间线
    section 规划阶段
        接收用户描述 : 解析游戏概念
        启动 game-planner : 生成设计文档 (约30-60秒)
    section 资源阶段
        启动多个 asset-finder : 并行搜索资源
        下载验证资源 : 导入到项目中
    section 构建阶段
        创建项目结构 : _Game/, Resources/ 等
        实现 M1 里程碑 : 玩家+场景+基础循环
    section 质量阶段
        运行质量门检查 : 功能+可玩性+视觉
        自动修复问题 : 迭代直到通过
    section 完成
        生成报告 : 告知用户可以测试
```

---

## 三、阶段一：游戏规划（game-planner）

### 3.1 game-planner 代理配置

```mermaid
graph LR
    A[game-planner 代理] --> B[模型: Sonnet]
    A --> C[工具集]
    C --> C1[Read]
    C --> C2[Write]
    C --> C3[Glob]
    C --> C4[Grep]
```

### 3.2 设计文档结构

game-planner 生成的设计文档（GAME_DESIGN.md）包含以下内容：

```mermaid
graph TB
    A[GAME_DESIGN.md] --> B[游戏概览]
    A --> C[核心循环]
    A --> D[玩家设计]
    A --> E[游戏元素]
    A --> F[里程碑]
    A --> G[资源清单]

    B --> B1[类型/视角/玩家数]
    B --> B2[目标体验]

    C --> C1[主要动作]
    C --> C2[挑战]
    C --> C3[奖励]
    C --> C4[进展]

    D --> D1[控制方式]
    D --> D2[能力]
    D --> D3[约束]

    E --> E1[敌人表格]
    E --> E2[收集品表格]
    E --> E3[危险物品]

    F --> F1[M1: 核心机制]
    F --> F2[M2: 游戏循环]
    F --> F3[M3: 精修]
    F --> F4[M4: 内容]

    G --> G1[3D模型/精灵]
    G --> G2[音频资源]
```

### 3.3 设计文档模板

```markdown
# [游戏标题]

## Overview
**Genre:** [类型]
**Perspective:** [视角]
**Players:** Multiplayer (Normcore)
**Target Feel:** [目标体验]

## Core Loop
1. [主要动作]
2. [挑战]
3. [奖励]
4. [进展]

## Player
- **Controls:** [控制方式]
- **Abilities:** [能力]
- **Constraints:** [约束]

## Game Elements

### Enemies
| Type | Behavior | Threat |
|------|----------|--------|
| [敌人1] | [行为模式] | [伤害类型] |

### Collectibles
| Item | Effect | Visual |
|------|--------|--------|
| [物品1] | [效果] | [视觉效果] |

## Milestones

### M1: Core Mechanics
- [ ] Player movement
- [ ] Basic camera
- [ ] Test scene

### M2: Gameplay Loop
- [ ] Core enemy/challenge
- [ ] Core collectible/goal
- [ ] Win/lose conditions

## Assets Needed
[资源清单]
```

### 3.4 类比理解

**game-planner 就像是"建筑设计师"**：
- 用户说"我想建一个游泳池的房子"
- 设计师画出完整的建筑图纸
- 包括房间布局、材料清单、施工步骤
- 后续工人（Claude）按图纸施工

---

## 四、阶段二：资源获取（asset-finder）

### 4.1 并行搜索架构

```mermaid
graph TB
    subgraph "主进程 (Claude)"
        A[解析资源需求] --> B[启动多个 asset-finder]
    end

    subgraph "asset-finder 1"
        C1[搜索角色模型] --> C2[Polyhaven API]
        C2 --> C3[OpenGameArt]
    end

    subgraph "asset-finder 2"
        D1[搜索环境资源] --> D2[Kenney镜像]
        D2 --> D3[其他来源]
    end

    subgraph "asset-finder 3"
        E1[搜索音效] --> E2[Freesound]
    end

    subgraph "asset-finder 4"
        F1[搜索音乐] --> F2[OpenGameArt]
    end

    C3 --> G[汇总结果]
    D3 --> G
    E2 --> G
    F2 --> G

    G --> H[验证并导入Unity]
```

### 4.2 资源来源优先级

| 优先级 | 来源 | 资源类型 | 许可证 | 自动下载 |
|--------|------|----------|--------|----------|
| 1 | Polyhaven | 纹理/HDRI/3D模型 | CC0 | 是 |
| 2 | OpenGameArt | 2D/3D/音频 | 多种 | 是 |
| 3 | Kenney镜像 | 3D/2D/UI/音频 | CC0 | 是 |
| 4 | itch.io | 各类 | 多种 | 部分可 |
| 5 | Freesound | 音效 | 多种 | 需账户 |
| 6 | Mixamo | 角色动画 | 免费 | 需账户 |

### 4.3 资源下载流程

```mermaid
flowchart TD
    A[发现资源] --> B[获取直接链接]
    B --> C[执行下载]
    C --> D{验证文件类型}
    D -->|HTML/错误| E[提供手动下载指引]
    D -->|正确格式| F[解压ZIP]
    F --> G[组织到正确目录]
    G --> H{是否为3D模型?}
    H -->|是| I[标记需预制体转换]
    H -->|否| J[刷新Unity资源库]
    I --> K[返回主进程处理]
    J --> L[完成]
```

### 4.4 目录结构规则

```
Assets/
├── Downloaded/              # 下载的外部资源
│   ├── Models/             # 3D模型 (FBX/OBJ)
│   ├── Textures/           # 纹理图片
│   ├── Sprites/            # 2D精灵
│   ├── Audio/              # 音频文件
│   │   ├── Music/          # 背景音乐
│   │   └── SFX/            # 音效
│   └── UI/                 # UI素材
│
├── Resources/              # 运行时加载资源
│   ├── Prefabs/            # 预制体 (运行时生成)
│   └── [AudioFolders]/     # 需运行时加载的音频
│
└── _Game/                  # 游戏核心文件
    ├── Scenes/
    ├── Scripts/
    └── Prefabs/
```

### 4.5 3D模型特殊处理

**重要**：FBX/OBJ 文件不能直接通过 `Resources.Load()` 在运行时加载！

```mermaid
flowchart LR
    A[下载 FBX 文件] --> B[放到 Downloaded/Models/]
    B --> C[创建临时GameObject]
    C --> D[保存为预制体到 Resources/Prefabs/]
    D --> E[删除临时对象]
    E --> F[刷新资源库]
    F --> G[代码中使用预制体路径]

    style C fill:#f96,stroke:#333
    style D fill:#6c9,stroke:#333
```

### 4.6 asset-finder 代理配置

```mermaid
graph LR
    A[asset-finder 代理] --> B[模型: Haiku - 快速]
    A --> C[工具集]
    C --> C1[WebSearch]
    C --> C2[WebFetch]
    C --> C3[Bash]
    C --> C4[Write]
```

### 4.7 类比理解

**asset-finder 就像是"采购部门"**：
- 设计师开出材料清单
- 采购部门同时联系多个供应商
- 货到后验收质量
- 把材料分类放到仓库指定位置
- 特殊材料（3D模型）需要二次加工

---

## 五、阶段三：项目结构创建

### 5.1 目录创建流程

```mermaid
flowchart TD
    A[开始创建结构] --> B[创建 _Game/ 目录]
    B --> C[创建子目录]
    C --> C1[Scenes/]
    C --> C2[Scripts/]
    C --> C3[Prefabs/]
    C --> C4[Materials/]

    A --> D[创建 Resources/ 目录]
    D --> E[创建子目录]
    E --> E1[Prefabs/ - 运行时生成]

    A --> F[创建 Downloaded/ 目录]
    F --> G[创建子目录]
    G --> G1[Models/]
    G --> G2[Audio/]
    G --> G3[Textures/]

    A --> H[创建 Screenshots/ 目录]
```

### 5.2 完整项目结构

```
Assets/
├── _Game/                      # 游戏核心文件
│   ├── Scenes/                 # 场景文件
│   │   ├── Main.unity         # 主场景
│   │   └── [其他场景]
│   ├── Scripts/                # C# 脚本
│   │   ├── Player/            # 玩家相关脚本
│   │   ├── Enemies/           # 敌人脚本
│   │   ├── Collectibles/      # 收集品脚本
│   │   ├── UI/                # UI脚本
│   │   └── Managers/          # 管理器脚本
│   ├── Prefabs/               # 编辑时预制体
│   ├── Materials/             # 材质
│   └── Animations/            # 动画控制器
│
├── Resources/                  # 运行时加载资源
│   ├── Prefabs/               # 运行时生成的预制体
│   └── [运行时音频文件夹]
│
├── Downloaded/                 # 导入的外部资源
│   ├── Models/
│   ├── Textures/
│   ├── Audio/
│   │   ├── Music/
│   │   └── SFX/
│   └── Sprites/
│
├── Screenshots/                # 截图验证
├── Normal/                     # Normcore SDK
└── [第三方包]
```

### 5.3 类比理解

**项目结构就像是"房屋施工图纸"**：
- _Game/ 是"主居住区"（核心功能）
- Resources/ 是"应急储藏室"（随时取用）
- Downloaded/ 是"材料仓库"（外部采购）
- Screenshots/ 是"施工照片"（质量检查记录）

---

## 六、阶段四：里程碑M1实现

### 6.1 M1核心任务

根据设计文档，M1（里程碑1）通常包含：

```mermaid
graph TB
    A[M1: 核心机制] --> B[创建主场景]
    A --> C[构建玩家控制器]
    A --> D[设置相机]
    A --> E[基础游戏循环]

    B --> B1[新建场景]
    B --> B2[添加地面/环境]
    B --> B3[设置光照]

    C --> C1[玩家对象]
    C --> C2[移动脚本]
    C --> C3[输入处理]

    D --> D1[相机跟随]
    D --> D2[视角设置]

    E --> E1[基本状态管理]
    E --> E2[暂停/开始]
```

### 6.2 自动使用的技能

在实现过程中，Claude 会自动调用以下技能：

| 技能 | 功能 | 触发时机 |
|------|------|----------|
| adding-player | 添加玩家角色 | 创建玩家对象时 |
| setting-up-cameras | 设置相机 | 需要相机跟随时 |
| setting-up-physics | 设置物理 | 需要碰撞/重力时 |
| adding-ui | 添加UI元素 | 需要显示信息时 |
| multiplayer-setup | 多人设置 | 默认启用Normcore |

### 6.3 技能调用流程

```mermaid
sequenceDiagram
    participant Main as 主进程
    participant Player as adding-player
    participant Camera as setting-up-cameras
    participant Physics as setting-up-physics
    participant UI as adding-ui
    participant Multiplayer as multiplayer-setup

    Main->>Player: 需要玩家角色
    Player->>Main: 返回玩家配置

    Main->>Camera: 需要相机
    Camera->>Main: 返回相机设置

    Main->>Physics: 需要物理/碰撞
    Physics->>Main: 返回物理组件

    Main->>UI: 需要UI
    UI->>Main: 返回UI元素

    Main->>Multiplayer: 启用多人
    Multiplayer->>Main: 配置完成
```

### 6.4 类比理解

**M1实现就像是"房屋主体结构施工"**：
- 主场景 = 地基和框架
- 玩家控制器 = 门和窗户（用户交互）
- 相机 = 照明系统（用户视角）
- 基础循环 = 水电系统（维持运转）

---

## 七、阶段五：质量保证

### 7.1 质量门检查流程

```mermaid
flowchart TD
    A[M1实现完成] --> B[启动 quality-gate]
    B --> C{Gate 1: 功能性}

    C -->|检查| C1[无错误运行]
    C -->|检查| C2[无编译错误]
    C -->|检查| C3[核心循环正常]
    C -->|检查| C4[30秒测试通过]

    C1 --> E{全部通过?}
    C2 --> E
    C3 --> E
    C4 --> E

    E -->|否| F[修复问题]
    F --> C

    E -->|是| G{Gate 2: 可玩性}

    G -->|检查| G1[控制响应]
    G -->|检查| G2[碰撞正确]
    G -->|检查| G3[状态清晰]
    G -->|检查| G4[难度合理]

    G1 --> H{基本通过?}
    G2 --> H
    G3 --> H
    G4 --> H

    H -->|是| I{Gate 3: 视觉质量}
    H -->|否| J[记录改进建议]

    I -->|截图| I1[场景不空]
    I -->|截图| I2[颜色合理]
    I -->|截图| I3[UI可读]
    I -->|截图| I4[相机正确]

    I1 --> K[视觉检查通过]
    I2 --> K
    I3 --> K
    I4 --> K

    K --> L{Gate 4: 精修}
    J --> L

    L -->|检查| L1[音频反馈]
    L -->|检查| L2[视觉反馈]
    L -->|检查| L3[游戏手感]
    L -->|检查| L4[边缘情况]

    L1 --> M[生成质量报告]
    L2 --> M
    L3 --> M
    L4 --> M

    M --> N[输出给用户]
```

### 7.2 质量门四道关卡

```mermaid
graph TB
    subgraph "Gate 1: 功能性 (必须通过)"
        A1[无错误运行]
        A2[无编译错误]
        A3[核心循环工作]
        A4[30秒测试通过]
    end

    subgraph "Gate 2: 可玩性 (应该通过)"
        B1[控制响应]
        B2[碰撞正确]
        B3[状态清晰]
        B4[难度合理]
    end

    subgraph "Gate 3: 视觉质量 (应该检查)"
        C1[场景不空]
        C2[颜色合理]
        C3[UI可读]
        C4[相机正确]
    end

    subgraph "Gate 4: 精修 (最好有)"
        D1[音频反馈]
        D2[视觉反馈]
        D3[游戏手感]
        D4[边缘处理]
    end

    A1 --> E[通过]
    A2 --> E
    A3 --> E
    A4 --> E

    E --> F{继续评估}
    B1 --> F
    B2 --> F
    B3 --> F
    B4 --> F

    F --> G[完成]
```

### 7.3 质量报告格式

```
## Quality Gate: [PASS/PASS WITH NOTES/NEEDS WORK]

### Functional (Gate 1): [状态]
- 无错误在30秒测试中
- 核心循环已验证
- 性能稳定

### Playability (Gate 2): [状态]
- 控制响应
- 碰撞工作正常
- 目标清晰

### Visual (Gate 3): [状态]
- 场景看起来不错
- UI可读
- 注意: [改进建议]

### Polish (Gate 4): [状态]
- 音效: [状态]
- 粒子: [状态]
- 可添加: [建议]

### Ready for User: [YES/NO]
```

### 7.4 类比理解

**质量门就像是"房屋验收标准"**：
- Gate 1 = 结构安全（不能倒塌）
- Gate 2 = 功能可用（门能开关、水能流）
- Gate 3 = 美观度（装修协调、采光良好）
- Gate 4 = 舒适度（隔音、恒温、细节）

---

## 八、完整执行时序图

### 8.1 详细交互流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant Claude as Claude
    participant Planner as game-planner
    participant Finder1 as asset-finder 1
    participant Finder2 as asset-finder 2
    participant Finder3 as asset-finder 3
    participant Unity as Unity Editor
    participant Quality as quality-gate

    User->>Claude: /new-game 太空射击游戏
    Claude->>User: 我正在规划您的太空射击游戏...

    par 启动规划
        Claude->>Planner: 创建游戏设计文档
        Planner-->>Claude: GAME_DESIGN.md 已生成
    and 解析资源需求
        Claude->>Claude: 解析需要: 飞船、小行星、爆炸效果
    end

    Claude->>User: 正在搜索飞船和小行星模型...

    par 并行搜索资源
        Claude->>Finder1: 搜索飞船模型
        Claude->>Finder2: 搜索小行星模型
        Claude->>Finder3: 搜索爆炸音效
    end

    Finder1-->>Claude: 找到飞船，已下载
    Finder2-->>Claude: 找到小行星，已下载
    Finder3-->>Claude: 找到音效，已下载

    Claude->>Unity: 创建项目结构
    Unity-->>Claude: 目录已创建

    Claude->>User: 正在构建您的飞船...

    Claude->>Unity: 创建玩家飞船
    Unity-->>Claude: 飞船已创建

    Claude->>User: 正在添加漂浮的小行星...

    Claude->>Unity: 添加小行星生成
    Unity-->>Claude: 小行星系统已添加

    Claude->>User: 正在设置射击机制...

    Claude->>Unity: 添加射击系统
    Unity-->>Claude: 射击系统已添加

    Claude->>User: 正在添加分数UI...

    Claude->>Unity: 添加UI
    Unity-->>Claude: UI已添加

    Claude->>Quality: 运行质量检查

    Quality->>Unity: 检查控制台错误
    Unity-->>Quality: 无错误

    Quality->>Unity: 运行30秒测试
    Unity-->>Quality: 测试通过

    Quality->>Unity: 截图验证
    Unity-->>Quality: 截图已保存

    Quality-->>Claude: 质量门通过

    Claude->>User: 您的游戏准备好了！
    Claude->>User: 使用WASD移动，空格键射击
    Claude->>User: 在Unity中按Play键测试
```

### 8.2 状态转换图

```mermaid
stateDiagram-v2
    [*] --> 接收描述: 用户输入命令
    接收描述 --> 游戏规划: 启动game-planner
    游戏规划 --> 资源搜索: 设计文档完成
    资源搜索 --> 资源下载: 找到资源
    资源下载 --> 结构创建: 资源就位
    结构创建 --> M1实现: 项目就绪
    M1实现 --> 质量检查: 实现完成
    质量检查 --> 修复问题: 检查失败
    修复问题 --> 质量检查: 重新检查
    质量检查 --> 生成报告: 检查通过
    生成报告 --> [*]: 完成
```

---

## 九、关键技术要点

### 9.1 代理模型选择

| 代理 | 模型 | 原因 |
|------|------|------|
| game-planner | Sonnet | 需要深度思考和结构化输出 |
| asset-finder | Haiku | 简单搜索任务，追求速度 |
| 主进程 | Opus/Sonnet | 复杂协调和代码生成 |

### 9.2 并行处理策略

```mermaid
graph TB
    A[主进程] --> B[识别可并行任务]
    B --> C{任务类型?}

    C -->|资源搜索| D[启动多个asset-finder]
    D --> E[等待所有完成]
    E --> F[汇总结果]

    C -->|代码生成| G[顺序执行]
    G --> H[确保依赖关系]
```

### 9.3 错误处理策略

| 错误类型 | 处理方式 |
|----------|----------|
| 资源下载失败 | 提供手动下载指引 |
| Unity API 错误 | 重试或替代方案 |
| 质量门失败 | 自动修复直到通过 |
| 代理超时 | 使用更简单方案 |

---

## 十、输出示例

### 10.1 成功输出

```
您的太空射击游戏准备好了！

我为您完成了：
- 创建了自上而下的太空场景
- 飞船使用 WASD 移动，空格键射击
- 小行星从顶部随机生成并下落
- 击中小行星得分
- 添加了分数UI和基本的爆炸效果

控制方式：
- W/A/S/D - 移动飞船
- 空格键 - 发射激光
- 击毁小行星获得分数

质量检查结果：
- 功能测试通过（30秒无错误）
- 控制响应灵敏
- 视觉效果良好

在Unity中按Play键即可开始测试！
```

### 10.2 带改进建议的输出

```
您的太空射击游戏基本完成！

质量检查结果：
- 功能测试通过
- 控制正常工作
- 视觉: 使用基本几何图形，可稍后添加模型

改进建议：
- 小行星可以更快以增加挑战
- 可以添加不同类型的小行星
- 可以添加背景音乐和音效

您现在可以测试，或告诉我想要改进的地方！
```

---

## 十一、类比总结

如果将 **new-game 命令**比作**"房屋建造项目"**：

| 阶段 | 房屋建造 | new-game 命令 |
|------|----------|---------------|
| 规划 | 建筑设计师画图纸 | game-planner 生成设计文档 |
| 采购 | 采购部门买材料 | asset-finder 搜索下载资源 |
| 施工 | 施工队按图纸建造 | Claude 使用技能实现功能 |
| 验收 | 质检部门检查 | quality-gate 质量检查 |
| 交付 | 钥匙交给业主 | 输出报告给用户 |

---

## 十二、参考资源

### 相关文档
- [game-planner 代理配置](../template/.claude/agents/game-planner.md)
- [asset-finder 代理配置](../template/.claude/agents/asset-finder.md)
- [quality-gate 技能](../template/.claude/skills/quality-gate/SKILL.md)
- [CLAUDE.md 配置](../template/.claude/CLAUDE.md)

### 相关技能
- adding-player - 玩家角色创建
- setting-up-cameras - 相机设置
- setting-up-physics - 物理系统
- adding-ui - UI元素
- multiplayer-setup - 多人设置

### 外部资源
- [Polyhaven - 免费3D资源](https://polyhaven.com)
- [OpenGameArt - 游戏艺术资源](https://opengameart.org)
- [Kenney Assets - 游戏素材](https://kenney.nl/assets)

---

**文档生成时间**：2026-02-02
**分析版本**：gamekit-cli v0.0.2
