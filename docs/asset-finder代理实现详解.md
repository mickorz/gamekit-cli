# asset-finder 代理实现详解

## 一、代理概述

### 1.1 基本信息

| 属性 | 值 |
|------|-----|
| **名称** | asset-finder |
| **描述** | 在线搜索免费游戏资源并下载/导入到 Unity 项目中 |
| **模型** | Haiku（快速处理简单搜索任务） |
| **触发场景** | 需要模型、纹理、声音或任何游戏资源时 |
| **核心能力** | 自动化资源获取和导入 |

### 1.2 核心职责

```mermaid
mindmap
  root((asset-finder))
    搜索资源
      在线免费资源
      合法许可证
      多来源搜索
    验证下载
      文件类型检查
      许可证确认
      直接链接验证
    导入项目
      正确目录结构
      Unity资源库刷新
      3D模型特殊处理
    报告结果
      下载状态
      文件位置
      使用说明
```

---

## 二、代理配置

### 2.1 YAML 配置结构

```mermaid
graph TB
    A[asset-finder 配置] --> B[name: asset-finder]
    A --> C[description]
    A --> D[model: haiku]
    A --> E[tools]

    E --> E1[WebSearch]
    E --> E2[WebFetch]
    E --> E3[Bash]
    E --> E4[Write]

    style D fill:#fc9,stroke:#333
    style E fill:#6c9,stroke:#333
```

### 2.2 配置详解

```yaml
---
name: asset-finder
description: Searches for free game assets online and downloads/imports them into the Unity project. Use when user needs models, textures, sounds, or any game assets.
model: haiku
tools:
  - WebSearch    # 搜索在线资源
  - WebFetch     # 获取资源页面内容
  - Bash         # 执行下载和文件操作
  - Write        # 创建说明文件
---
```

### 2.3 为什么选择 Haiku 模型

```mermaid
graph LR
    A[任务特性] --> B[重复性搜索]
    A --> C[简单模式匹配]
    A --> D[速度优先]

    B --> E[Haiku 最适合]
    C --> E
    D --> E

    F[Sonnet] --> G[可能过度]
    H[Opus] --> I[浪费资源]
```

**选择理由**：
- 任务主要是**模式匹配和URL处理**
- 需要**快速响应**（可以多个并行）
- 不需要**深度推理或创造性**
- 成本**效率优先**

---

## 三、资源来源系统

### 3.1 资源来源优先级

```mermaid
graph TB
    A[资源搜索] --> B1[优先级 1<br/>Polyhaven]
    A --> B2[优先级 2<br/>OpenGameArt]
    A --> B3[优先级 3<br/>Kenney 镜像]
    A --> B4[优先级 4<br/>itch.io]
    A --> B5[优先级 5<br/>Freesound]
    A --> B6[优先级 6+<br/>需手动下载]

    B1 --> C1[CC0 许可<br/>直接API下载]
    B2 --> C2[多种许可<br/>可靠下载]
    B3 --> C3[CC0 许可<br/>镜像下载]
    B4 --> C4[部分可自动]
    B5 --> C5[需账户]
    B6 --> C6[需手动操作]

    style B1 fill:#6c9,stroke:#333
    style B2 fill:#6c9,stroke:#333
    style B6 fill:#f96,stroke:#333
```

### 3.2 各来源详解

#### Polyhaven（最佳纹理/HDRI）

```mermaid
graph TB
    A[Polyhaven] --> B[特点]
    A --> C[API支持]
    A --> D[下载流程]

    B --> B1[高质量纹理]
    B --> B2[HDRI 环境贴图]
    B --> B3[3D 模型]
    B --> B4[全部 CC0]

    C --> C1[资产列表API]
    C --> C2[下载URL API]
    C --> C3[直接下载链接]

    D --> D1[调用API获取资产]
    D --> D2[解析下载URL]
    D --> D3[curl直接下载]

    style A fill:#6c9,stroke:#333
```

**API 使用示例**：

```bash
# 1. 获取资产列表
curl https://api.polyhaven.com/assets

# 2. 获取特定资产的下载链接
curl https://api.polyhaven.com/files/rock_ground_02

# 3. 直接下载（返回直接URL）
curl -L -o rock_ground_02.jpg "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/rock_ground_02/rock_ground_02_diff_1k.jpg"
```

**分辨率支持**：
- 1K (1024px)
- 2K (2048px)
- 4K (4096px)
- 8K (8192px)

#### OpenGameArt（可靠的 2D/3D/音频）

```mermaid
graph TB
    A[OpenGameArt] --> B[资源类型]
    A --> C[许可证]
    A --> D[下载方式]

    B --> B1[2D 精灵]
    B --> B2[3D 模型]
    B --> B3[音效/音乐]

    C --> C1[CC0]
    C --> C2[CC-BY]
    C --> C3[多种许可证]

    D --> D1[直接文件链接]
    D --> D2[/sites/default/files/]

    style A fill:#6c9,stroke:#333
```

**直接下载模式**：

```bash
# 可靠的直接链接格式
https://opengameart.org/sites/default/files/asset_name.zip

# 示例
curl -L -o zombies.zip "https://opengameart.org/sites/default/files/zombies.zip"
```

#### Kenney 镜像（CC0 资源）

```mermaid
graph TB
    A[Kenney 资源] --> B[原始来源问题]
    B --> C[返回 HTML 重定向]
    B --> D[无法自动下载]

    A --> E[OpenGameArt 镜像解决方案]
    E --> F[搜索 kenney + 资源名]
    F --> G[使用镜像链接]

    G --> H[可靠下载]

    H --> I["https://opengameart.org/sites/default/files/kenney_asset-name.zip"]

    style E fill:#6c9,stroke:#333
    style H fill:#6c9,stroke:#333
```

**重要模式**：
```
搜索: "kenney food-kit"
下载: https://opengameart.org/sites/default/files/kenney_food-kit.zip
```

**已知镜像资源**：
- food-kit
- platformer-kit
- nature-kit
- ui-pack
- 以及更多...

#### 其他来源（需手动）

| 来源 | 资源类型 | 自动下载 | 原因 |
|------|----------|----------|------|
| Freesound.org | 音效 | 需账户 | 需要登录 |
| Mixamo.com | 角色动画 | 需账户 | 需要 Adobe 账户 |
| Sketchfab | 3D 模型 | 需手动 | 大多数需要登录 |
| Unity Asset Store | 各类 | 通过 Package Manager | 必须使用 Unity |

---

## 四、下载流程详解

### 4.1 完整下载流程

```mermaid
flowchart TD
    A[接收资源请求] --> B[搜索资源]
    B --> C{找到资源?}

    C -->|否| D[尝试下一个来源]
    D --> B

    C -->|是| E[获取直接链接]
    E --> F[执行下载]

    F --> G[验证文件类型]
    G --> H{类型正确?}

    H -->|HTML/错误| I[下载失败]
    I --> J[提供手动指引]

    H -->|正确格式| K[解压 ZIP]
    K --> L[清理元数据]
    L --> M[组织到目录]

    M --> N{3D模型?}
    N -->|是| O[标记需预制体转换]
    N -->|否| P[刷新Unity资源库]

    O --> Q[返回主进程处理]
    P --> R[完成]
```

### 4.2 下载验证

**关键验证步骤**：

```bash
# 下载后必须验证文件类型
file /path/to/downloaded/file
```

**可能的输出**：

```
# 正确
asset.zip:         Zip archive data
sound.wav:         RIFF (little-endian) data, WAVE audio
model.fbx:         Autodesk FBX Binary

# 错误（下载失败）
asset.zip:         HTML document, ASCII text
```

### 4.3 ZIP 文件处理

```bash
# 创建目标目录
mkdir -p /path/to/project/Assets/Downloaded/ASSET_TYPE/

# 下载（使用 -L 跟随重定向）
cd /path/to/project/Assets/Downloaded/ASSET_TYPE/
curl -L -o asset.zip "DIRECT_URL"

# 验证是否真的是 ZIP
file asset.zip

# 如果有效，解压
unzip -o asset.zip
rm asset.zip

# 清理 Mac 元数据（如果存在）
rm -rf __MACOSX
```

---

## 五、目录结构规则

### 5.1 标准目录结构

```mermaid
graph TB
    A[Assets/] --> B[Downloaded/]
    A --> C[Resources/]
    A --> D[_Game/]

    B --> B1[Models/]
    B --> B2[Textures/]
    B --> B3[Audio/]
    B --> B4[Sprites/]
    B --> B5[UI/]

    B3 --> B31[Music/]
    B3 --> B32[SFX/]

    C --> C1[Prefabs/]
    C --> C2[运行时音频/]

    D --> D1[Scenes/]
    D --> D2[Scripts/]
    D --> D3[Prefabs/]
    D --> D4[Materials/]
```

### 5.2 目录用途说明

| 目录 | 用途 | 运行时加载 |
|------|------|-----------|
| `Assets/Downloaded/Models/` | 下载的 3D 模型源文件 (FBX/OBJ) | 否 |
| `Assets/Downloaded/Textures/` | 下载的纹理图片 | 否 |
| `Assets/Downloaded/Audio/` | 下载的音频文件 | 部分 |
| `Assets/Downloaded/Sprites/` | 2D 精灵 | 否 |
| `Assets/Resources/Prefabs/` | 预制体 | 是 |
| `Assets/Resources/*/` | 需要运行时加载的音频 | 是 |

### 5.3 放置规则

```
下载资源 → Assets/Downloaded/[类型]/
  ├── Models/      → FBX/OBJ 源文件
  ├── Textures/    → PNG/JPG 纹理
  ├── Sprites/     → 2D 精灵图
  ├── Audio/
  │   ├── Music/   → 背景音乐
  │   └── SFX/     → 音效
  └── UI/          → UI 素材

运行时资源 → Assets/Resources/
  ├── Prefabs/     → 运行时生成的预制体
  └── [音频文件夹] → 需 Resources.Load 的音频
```

---

## 六、3D 模型特殊处理

### 6.1 FBX/OBJ 限制

```mermaid
graph TB
    A[下载 FBX/OBJ] --> B[问题]
    B --> C["Resources.Load<GameObject>
        ('Models/zombie') 返回 NULL"]

    C --> D[原因]
    D --> D1[FBX 是源资产]
    D --> D2[不是可实例化的预制体]
    D --> D3[只有 .prefab 文件可运行时加载]

    D --> E[解决方案]
    E --> F[转换为预制体]

    F --> G[转换流程]
```

### 6.2 自动转换流程

```mermaid
sequenceDiagram
    participant Finder as asset-finder
    participant Main as 主进程
    participant Unity as Unity MCP

    Finder->>Finder: 下载 FBX 文件
    Finder->>Finder: 验证文件类型

    Finder->>Main: 报告下载完成
    Note over Finder,Main: FBX_LOCATION: Assets/Downloaded/.../file.fbx<br/>NEEDS_PREFAB_CONVERSION: true<br/>SUGGESTED_PREFAB: Assets/Resources/Prefabs/Name.prefab

    Main->>Unity: 创建临时 GameObject
    Note over Main,Unity: manage_gameobject action="create"<br/>name="TempModel"<br/>prefab_path="Assets/Downloaded/.../file.fbx"

    Unity-->>Main: 临时对象已创建

    Main->>Unity: 保存为预制体
    Note over Main,Unity: manage_gameobject action="save_as_prefab"<br/>target="TempModel"<br/>prefab_path="Assets/Resources/Prefabs/Name.prefab"

    Unity-->>Main: 预制体已保存

    Main->>Unity: 删除临时对象
    Note over Main,Unity: manage_gameobject action="delete"<br/>target="TempModel"

    Main->>Unity: 刷新资源库
    Note over Main,Unity: manage_asset action="refresh"

    Unity-->>Main: 完成
```

### 6.3 转换步骤

```bash
# 1. 下载 FBX 到 Downloaded/Models/
curl -L -o model.fbx "URL"

# 2. 返回主进程以下信息：
#    FBX_PATH: Assets/Downloaded/Models/model.fbx
#    NEEDS_PREFAB_CONVERSION: true
#    SUGGESTED_PREFAB_PATH: Assets/Resources/Prefabs/Model.prefab

# 3. 主进程执行：
manage_gameobject action="create" name="TempModel" prefab_path="Assets/Downloaded/Models/model.fbx"
manage_gameobject action="save_as_prefab" target="TempModel" prefab_path="Assets/Resources/Prefabs/Model.prefab"
manage_gameobject action="delete" target="TempModel"
manage_asset action="refresh"

# 4. 代码中使用：
Resources.Load<GameObject>("Prefabs/Model")
```

### 6.4 报告格式（3D 模型）

```
FOUND: Zombie Character
SOURCE: OpenGameArt.org
LICENSE: CC-BY 3.0
DOWNLOAD STATUS: Success
FBX LOCATION: Assets/Downloaded/Models/zombie.fbx
⚠️ NEEDS PREFAB CONVERSION: Yes
SUGGESTED PREFAB: Assets/Resources/Prefabs/Zombie.prefab
RUNTIME LOADING: Use Resources.Load<GameObject>("Prefabs/Zombie")
```

---

## 七、并行搜索架构

### 7.1 并行搜索模式

```mermaid
graph TB
    subgraph "主进程"
        A[解析资源需求]
        B[启动多个 asset-finder]
    end

    subgraph "asset-finder 1"
        C1[搜索: 飞船模型]
        C2[Polyhaven API]
        C3[OpenGameArt]
    end

    subgraph "asset-finder 2"
        D1[搜索: 小行星模型]
        D2[Kenney 镜像]
        D3[其他来源]
    end

    subgraph "asset-finder 3"
        E1[搜索: 射击音效]
        E2[Freesound]
    end

    subgraph "asset-finder 4"
        F1[搜索: 背景音乐]
        F2[OpenGameArt]
    end

    C3 --> G[汇总结果]
    D3 --> G
    E2 --> G
    F2 --> G

    G --> H[验证并导入 Unity]
```

### 7.2 并行优势

```mermaid
graph LR
    A[串行搜索] --> B[时间: 4x]
    C[并行搜索] --> D[时间: 1x]

    B --> B1[资源1: 30秒]
    B1 --> B2[资源2: 30秒]
    B2 --> B3[资源3: 30秒]
    B3 --> B4[资源4: 30秒]
    B4 --> B5[总计: 120秒]

    D --> D1[同时搜索 4 个资源]
    D1 --> D2[总计: 30秒]
```

**加速比**：4 倍（取决于资源数量）

---

## 八、报告格式

### 8.1 成功报告

```
FOUND: Spaceship Player Model
SOURCE: Polyhaven
LICENSE: CC0 (No attribution required)
DOWNLOAD STATUS: Success
LOCATION: Assets/Downloaded/Models/spaceship.fbx
CONTENTS:
  - spaceship.fbx (main model)
  - texture_diffuse.png (1024x1024)
  - texture_normal.png (1024x1024)
FILE COUNT: 3 files imported
```

### 8.2 需要预制体转换报告

```
FOUND: Zombie Character
SOURCE: OpenGameArt.org
LICENSE: CC-BY 3.0 (Attribution required)
DOWNLOAD STATUS: Success
FBX LOCATION: Assets/Downloaded/Models/zombie.fbx
⚠️ NEEDS PREFAB CONVERSION: Yes
SUGGESTED PREFAB: Assets/Resources/Prefabs/Zombie.prefab
RUNTIME LOADING: Use Resources.Load<GameObject>("Prefabs/Zombie")
CONTENTS:
  - zombie.fbx (character model)
  - zombie_walk.fbx (walk animation)
  - zombie_attack.fbx (attack animation)
FILE COUNT: 3 files imported
```

### 8.3 下载失败报告

```
FOUND: Animated Character Pack
SOURCE: Mixamo.com
LICENSE: Free (requires Adobe account)
DOWNLOAD STATUS: Failed - Account required
SOURCE URL: https://www.mixamo.com/search?q=zombie

MANUAL DOWNLOAD INSTRUCTIONS:
1. Visit https://www.mixamo.com
2. Sign in with Adobe account (free)
3. Search for "zombie"
4. Download desired character (FBX format)
5. Place in: Assets/Downloaded/Models/
6. The main agent will convert to prefab
```

---

## 九、错误处理

### 9.1 错误类型

```mermaid
graph TB
    A[可能的错误] --> B[下载失败]
    A --> C[许可证不明确]
    A --> D[文件格式错误]
    A --> E[目录权限问题]

    B --> B1[HTML 而非文件]
    B --> B2[网络超时]
    B --> B3[404 错误]

    C --> C1[未找到许可证信息]
    C --> C2[许可证限制商业使用]

    D --> D1[损坏的 ZIP]
    D --> D2[不支持格式]

    E --> E1[无法创建目录]
    E --> E2[无法写入文件]
```

### 9.2 处理策略

| 错误类型 | 处理方式 |
|----------|----------|
| 下载返回 HTML | 提供手动下载指引 |
| 网络超时 | 重试一次，失败则提供指引 |
| 许可证不明确 | 标注"需验证许可证" |
| ZIP 损坏 | 报告错误，提供源链接 |
| 权限问题 | 报告错误，建议检查权限 |

---

## 十、重要规则

### 10.1 五条黄金规则

```mermaid
mindmap
  root((重要规则))
    只下载免费资源
      CC0 最佳
      CC-BY 可接受
      禁止商业的需标注
    验证许可证
      允许商业使用
      记录许可证类型
      提醒用户署名要求
    优先 CC0
      无需署名
      可自由使用
      法律风险最低
    验证文件类型
      下载后检查
      HTML=失败
      提供手动指引
    创建目录
      不存在则创建
      使用标准结构
      便于后续使用
```

### 10.2 规则详解

#### 规则 1：只下载免费资源

**可接受的许可证**：
- CC0 (Creative Commons Zero) - 最佳
- CC-BY (需要署名)
- Free for commercial use
- Public Domain

**需要谨慎的许可证**：
- CC-BY-SA (需要署名，相同方式共享)
- CC-BY-NC (非商业使用)

#### 规则 2：验证许可证允许商业使用

```
许可证验证检查表：
□ 许可证类型已识别
□ 允许商业使用
□ 署名要求已记录
□ 特殊限制已标注
```

#### 规则 3：优先 CC0

**原因**：
- 无需署名（简化项目）
- 可自由使用和修改
- 无法律风险

#### 规则 4：验证文件类型

```bash
# 下载后立即验证
file downloaded_file

# 检查输出
# ✅ Zip archive data
# ❌ HTML document
```

#### 规则 5：创建目录

```bash
# 总是先创建目录
mkdir -p /path/to/Assets/Downloaded/TYPE/

# 然后下载到该目录
cd /path/to/Assets/Downloaded/TYPE/
curl -L -o asset.zip "URL"
```

---

## 十一、音频处理

### 11.1 音频分类

```mermaid
graph TB
    A[音频资源] --> B[背景音乐 Music]
    A --> C[音效 SFX]

    B --> B1[循环播放]
    B --> B2[较长时长]
    B --> B3[可运行时加载]

    C --> C1[短促触发]
    C --> C2[即时播放]
    C --> C3[可能需要运行时加载]
```

### 11.2 音频放置规则

```
背景音乐 → Assets/Resources/Audio/Music/
  - 需要 Resources.Load("Audio/Music/track_name")
  - 循环播放的较长音频

音效 → Assets/Resources/Audio/SFX/
  - 需要 Resources.Load("Audio/SFX/sound_name")
  - 运行时触发的短音频

其他音频 → Assets/Downloaded/Audio/
  - 不需要运行时加载
  - 编辑时使用
```

---

## 十二、完整工作流示例

### 12.1 搜索并下载飞船模型

```mermaid
sequenceDiagram
    participant Main as 主进程
    participant Finder as asset-finder
    participant Web as Web Search/Fetch
    participant FS as 文件系统

    Main->>Finder: 搜索 "spaceship 3D model"

    Finder->>Web: WebSearch "free spaceship 3D model cc0"
    Web-->>Finder: 搜索结果

    Finder->>Finder: 分析结果
    Note over Finder: 找到 Polyhaven 飞船模型<br/>许可证: CC0<br/>直接下载链接可用

    Finder->>FS: 创建目录
    Note over Finder,FS: mkdir -p Assets/Downloaded/Models/

    Finder->>Web: curl -L -o spaceship.fbx "DIRECT_URL"
    Web-->>Finder: 文件内容

    Finder->>FS: 验证文件
    Note over Finder,FS: file spaceship.fbx

    FS-->>Finder: Autodesk FBX Binary

    Finder->>Finder: 生成报告
    Note over Finder: FOUND: Spaceship<br/>SOURCE: Polyhaven<br/>LICENSE: CC0<br/>LOCATION: Assets/Downloaded/Models/spaceship.fbx<br/>⚠️ NEEDS PREFAB CONVERSION: Yes

    Finder-->>Main: 返回报告

    Main->>Main: 转换为预制体
    Note over Main: manage_gameobject create/save_as_prefab/delete
```

---

## 十三、与其他代理的协作

### 13.1 协作流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant Main as 主进程
    participant Planner as game-planner
    participant Finders as asset-finders (N个)
    participant Iterator as iterator

    User->>Main: /new-game 太空射击游戏
    Main->>Planner: 创建设计文档

    Planner-->>Main: GAME_DESIGN.md<br/>资源清单

    par 并行启动资源搜索
        Main->>Finders: 搜索 飞船模型
        Main->>Finders: 搜索 小行星模型
        Main->>Finders: 搜索 音效
        Main->>Finders: 搜索 音乐
    end

    Finders-->>Main: 所有资源下载完成

    Main->>Main: 转换 3D 模型为预制体

    Main->>Iterator: 开始实现 M1

    Iterator-->>Main: M1 完成
```

### 13.2 代理职责对比

| 代理 | 输入 | 输出 | 并行 |
|------|------|------|------|
| game-planner | 游戏描述 | GAME_DESIGN.md | 否 |
| asset-finder | 资源需求 | 已下载资源 | 是（多个） |
| iterator | 里程碑任务 | 已实现功能 | 否 |

---

## 十四、最佳实践

### 14.1 搜索建议

**好的搜索词**：
```
✅ "spaceship 3D model cc0"
✅ "zombie character fbx free"
✅ "explosion sound effect"
```

**不够清晰的搜索词**：
```
❌ "game assets"          太宽泛
❌ "cool stuff"           不明确
```

### 14.2 下载后检查

```
下载后检查清单：
□ 文件类型正确
□ 文件大小合理
□ ZIP 可解压
□ 许可证已记录
□ 放置在正确目录
□ Unity 资源库已刷新
□ 3D 模型标记转换需求
```

---

## 十五、类比总结

### 15.1 类比理解

**asset-finder 就像是"采购部门"**：

| 采购部门 | asset-finder |
|---------|--------------|
| 设计师开出材料清单 | game-planner 识别资源需求 |
| 联系多个供应商 | 搜索多个资源网站 |
| 比较价格和质量 | 检查许可证和质量 |
| 下订单并收货 | 下载并验证文件 |
| 分类入库 | 放到正确目录 |
| 特殊材料需加工 | 3D 模型需预制体转换 |

### 15.2 工作流程类比

```mermaid
graph LR
    A[设计图纸] --> B[材料清单]
    B --> C[采购部门]

    C --> D[联系供应商]
    D --> E[比价订购]
    E --> F[收货验收]
    F --> G[分类入库]

    H[设计文档] --> I[资源清单]
    I --> J[asset-finder]

    J --> K[搜索网站]
    K --> L[下载验证]
    L --> M[组织目录]
```

---

## 十六、总结

### 16.1 核心价值

asset-finder 代理是资源获取的"自动化采购员"：

```mermaid
mindmap
  root((asset-finder 价值))
    效率提升
      并行搜索多个资源
      自动化下载流程
      节省开发者时间
    质量保证
      验证许可证合法性
      检查文件完整性
      确保正确格式
    标准化
      统一目录结构
      一致报告格式
      可预测的结果
    成本优化
      使用免费资源
      CC0 优先
      无版权风险
```

### 16.2 关键文件位置

| 文件 | 路径 | 说明 |
|------|------|------|
| 代理配置 | `template/.claude/agents/asset-finder.md` | 代理定义 |
| 资源目录 | `Assets/Downloaded/` | 下载的资源 |
| 预制体目录 | `Assets/Resources/Prefabs/` | 运行时预制体 |

### 16.3 参考资源

### 资源网站
- [Polyhaven - 免费 3D 资源](https://polyhaven.com)
- [OpenGameArt - 游戏艺术资源](https://opengameart.org)
- [Kenney Assets - 游戏素材](https://kenney.nl/assets)

### API 文档
- [Polyhaven API](https://polyhaven.com/api)

### 相关代理
- [game-planner 代理](../agents/game-planner.md) - 识别资源需求
- [iterator 代理](../agents/iterator.md) - 使用资源实现功能

---

**文档生成时间**：2026-02-02
**分析版本**：gamekit-cli v0.0.2
