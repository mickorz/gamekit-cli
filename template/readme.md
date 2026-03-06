# Unity + Claude Code Project

This project is configured for AI-powered game development with Claude Code and Ember MCP.

## Project Structure

```
.
├── Assets/                    # Unity project assets
├── .claude/                  # Claude Code configuration
│   ├── CLAUDE.md            # Claude's identity as Unity expert
│   ├── commands/           # User-facing commands (/new-game, /playtest, etc.)
│   ├── skills/              # Game dev skills (auto-invoked)
│   ├── agents/             # Specialized worker agents
│   └── settings.local.json   # Permissions and hooks
├── .ember/                   # Ember MCP configuration
│   ├── mcp-port.json        # Unity HTTP listener port
│   └── setup-result.json    # Setup status
└── Packages/               # Unity packages (Ember, etc.)
```

## Quick Start

1. **Initialize Project**
   ```bash
   emberai init
   ```
   This command will:
   - Detect Unity version
   - Setup Ember MCP connection
   - Generate and install skills
   - Open Unity Editor

2. **Start Building**
   - Open Claude Code in this folder
   - Say "I want to make a [game type]" or use `/new-game`

## Commands Available

| Command | Purpose |
|---------|---------|
| `/super-game [idea]` | Start a new game with full superpowers workflow |
| `/new-game [idea]` | Start a new game with planning |
| `/playtest` | Test the game and catch errors |
| `/auto-test` | Automated testing without manual intervention |
| `/build [platform]` | Build for Windows, Mac, WebGL, etc. |
| `/find-asset [thing]` | Search for free assets |
| `/preview-assets [thing]` | Preview assets before downloading |
| `/explain [topic]` | Learn about game concepts |
| `/fix [problem]` | Fix something specific |
| `/snapshot` | Capture full scene state for debugging |
| `/screenshot` | Capture game view for visual verification |
| `/rollback` | Undo recent changes made by Claude |
| `/convert-models` | Convert FBX/OBJ to runtime-ready prefabs |

## Ember MCP Skills

This project includes 37 Unity skills powered by Ember MCP:

### Core Skills
| Skill | Description |
|------|-------------|
| `ember-gameobject` | GameObject creation, finding, manipulation |
| `ember-component` | Component operations and management |
| `ember-prefab` | Prefab creation and instantiation |
| `ember-asset` | Asset import, delete, move, find |
| `ember-scene` | Scene management and operations |
| `ember-script` | Script creation and modification |

### Visual Skills
| Skill | Description |
|------|-------------|
| `ember-material` | Material creation and modification |
| `ember-texture` | Texture operations |
| `ember-shader` | Shader operations |
| `ember-light` | Lighting setup and control |
| `ember-camera` | Camera operations |
| `ember-ui` | UI element creation |

### Animation Skills
| Skill | Description |
|------|-------------|
| `ember-animator` | Animation controller operations |
| `ember-timeline` | Timeline and Playables operations |
| `ember-vfx` | Visual effects and particles |
| `ember-vfxgraph` | VFX Graph operations |

### Physics Skills
| Skill | Description |
|------|-------------|
| `ember-physics` | Physics components and collisions |
| `ember-navmesh` | Navigation mesh operations |

### Editor Skills
| Skill | Description |
|------|-------------|
| `ember-editor` | Editor operations and playback control |
| `ember-project` | Project settings and operations |
| `ember-console` | Console log operations |
| `ember-debug` | Debugging and diagnostics |
| `ember-profiler` | Performance profiling |

### Build Skills
| Skill | Description |
|------|-------------|
| `ember-compile` | Compilation check and errors |
| `ember-refresh` | Asset database refresh |
| `ember-validation` | Validation checks |
| `ember-optimization` | Performance optimization |
| `ember-test` | Testing operations |

### Specialized Skills
| Skill | Description |
|------|-------------|
| `ember-model` | 3D model operations |
| `ember-audio` | Audio and sound operations |
| `ember-cinemachine` | Cinemachine camera operations |
| `ember-screenshot` | Screenshot capture |
| `ember-probuilder` | ProBuilder mesh operations |
| `ember-scriptableobject` | ScriptableObject operations |
| `ember-batchexecute` | Batch command execution |
| `ember-event` | Event system operations |
| `ember-sample` | Sample skill templates |

## Game Building Skills

### Adding Game Elements
- `adding-player` - Player movement and controls
- `adding-enemies` - Enemy AI and behavior
- `adding-collectibles` - Pickups and rewards
- `adding-audio` - Sound effects and music
- `adding-ui` - Health bars, scores, menus
- `adding-juice` - Screen shake, particles, polish

### Technical Setup
- `setting-up-physics` - Collisions and rigidbodies
- `setting-up-triggers` - Trigger detection
- `setting-up-cameras` - Camera follow and setup
- `creating-animations` - Animation controllers
- `creating-materials` - Colors and textures
- `using-3d-models` - FBX to prefab conversion

### Progression
- `level-progression` - Scenes, saves, checkpoints
- `multiplayer-setup` - Normcore integration
- `quick-tweaks` - Speed, size, color adjustments

### Quality Assurance
- `scene-awareness` - State capture for rollback
- `verify-changes` - Auto test-fix loop
- `quality-gate` - Quality checklist before done
- `screenshot` - Visual verification captures

## Autonomous Quality Features

### Auto-Triggered Skills
- **scene-awareness** - Captures state before/after changes
- **verify-changes** - Automatically tests and fixes after modifications
- **quality-gate** - Checks quality before presenting work as "done"
- **using-3d-models** - Auto-converts FBX to prefabs

### Iteration Agent
The `iterator` agent orchestrates build-test-fix cycles:
1. Build the feature
2. Test automatically
3. Fix any issues
4. Repeat until quality gate passes

### Visual Verification
Claude can take screenshots of the game to verify:
- UI looks correct
- Materials are applied
- Positions are right
- Overall visual quality

## Agents Available

| Agent | Purpose |
|-------|---------|
| `game-planner` | Creates game design documents |
| `asset-finder` | Searches for free assets |
| `level-designer` | Builds game levels |
| `code-debugger` | Finds and fixes bugs |
| `optimizer` | Improves performance |
| `iterator` | Orchestrates quality iteration |

## How It Works

Just describe the game you want. Claude handles all Unity implementation AND verifies its own work.

**Example:**
> "I want a platformer where you collect coins"

Claude builds it, tests it, fixes issues, and only shows you the working result.

## Optional: Multiplayer ([Normcore](https://normcore.io/))

Games support multiplayer by default using Normcore. For single-player games, just say "make this single-player only".

## Requirements

- Unity 2022.3+ or Unity 6
- Node.js 18+
- Claude Code CLI

---

Template created by [gamekit-cli](https://github.com/gamekit-agent/gamekit-cli).
