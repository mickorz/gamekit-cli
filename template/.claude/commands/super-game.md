---
description: Start a new game with full superpowers workflow integration
---

# /super-game

Create a new game using the complete superpowers development workflow.

**User's game idea:** $ARGUMENTS

## Workflow Overview

This command integrates superpowers skills for a rigorous development process:

1. **brainstorming** - Interactive requirements exploration
2. **game-planner** - Professional game design document
3. **writing-plans** - Convert design to implementation plan
4. **asset-finder** - Parallel resource search
5. **subagent-driven-development** - Task execution with two-stage review
6. **finishing-a-development-branch** - Final verification and delivery

## Process

### Phase 1: Requirements Exploration (brainstorming)

Invoke **superpowers:brainstorming** skill to explore the game idea:

1. **Explore project context** - Check existing files, docs, recent commits
2. **Ask clarifying questions** - One at a time, understand purpose/constraints/success criteria
3. **Propose 2-3 approaches** - With trade-offs and your recommendation
4. **Present design** - In sections, get user approval after each section
5. **Write design summary** - Document the approved direction

**Key questions to explore:**
- Game genre and perspective (2D/3D, top-down/side-scroller/FPS etc.)
- Single-player or multiplayer?
- Core mechanic - what makes it fun?
- Target complexity - quick prototype or full game?
- Visual style - realistic/stylized/pixel art?

**Output:** Clear understanding of game vision with user approval

### Phase 2: Game Design (game-planner)

Invoke **game-planner** agent with the clarified requirements:

The agent will create `Assets/_Game/Docs/GAME_DESIGN.md` with:
- Core concept and mechanics
- Player abilities and controls
- Enemies, collectibles, hazards (in tables)
- Implementation milestones (M1, M2, M3, M4)
- Asset requirements list

**Output:** `Assets/_Game/Docs/GAME_DESIGN.md`

### Phase 3: Implementation Plan (writing-plans)

Invoke **superpowers:writing-plans** skill to convert the game design:

1. Parse GAME_DESIGN.md milestones
2. Break each milestone into bite-sized tasks (2-5 min each)
3. Classify tasks:
   - **Core (Sequential):** Player controller, camera system, base scene
   - **Independent (Parallel):** Enemies, collectibles, UI, audio
4. Save plan to `docs/plans/YYYY-MM-DD-<game-name>.md`

**Output:** Detailed implementation plan with task classification

### Phase 4: Asset Acquisition (asset-finder)

Spawn multiple **asset-finder** agents in parallel based on asset list:

- **Agent 1:** Search for character/player models or sprites
- **Agent 2:** Search for environment assets
- **Agent 3:** Search for sound effects
- **Agent 4:** Search for music (if needed)

**After parallel search completes:**

Create a single Task for download/import with review:
1. Download all found assets
2. Verify file types
3. Organize into `Assets/Downloaded/`
4. Convert 3D models to prefabs (if any)
5. Run spec compliance review on imported assets

**Output:** Assets organized in `Assets/Downloaded/` and prefabs in `Resources/Prefabs/`

### Phase 5: Implementation (subagent-driven-development)

Invoke **superpowers:subagent-driven-development** skill:

**Execution Order:**

1. **Sequential Tasks (Core):**
   - Task: Player controller with input handling
   - Task: Camera system with follow behavior
   - Task: Base scene with ground/environment

2. **Parallel Tasks (Independent) - after core complete:**
   - Task: Enemy system with AI behavior
   - Task: Collectible system with pickup logic
   - Task: UI system (score, health, etc.)
   - Task: Audio system (music, sound effects)

**Each task follows two-stage review:**

| Stage | Reviewer | Focus |
|-------|----------|-------|
| Stage 1 | spec-reviewer | Matches GAME_DESIGN.md spec? No missing/extra features? |
| Stage 2 | code-quality-reviewer | Code quality, no smells, maintainable? |

**If review fails:** Implementer fixes -> Reviewer re-reviews -> Loop until pass

**Output:** Fully implemented game matching the design

### Phase 6: Completion (finishing-a-development-branch)

Invoke **superpowers:finishing-a-development-branch** skill:

1. Verify all tests pass
2. Run quality-gate checks:
   - Functional: No errors in 30-second play test
   - Playability: Controls responsive, collisions correct
   - Visual: Scene not empty, UI readable
3. Generate final report
4. Ask user about merge/PR preferences

**Output:** Ready-to-play game with quality report

## What Claude Does Automatically

During implementation, Claude will automatically use gamekit skills:
- `adding-player` - Player character creation
- `setting-up-cameras` - Camera setup
- `setting-up-physics` - Physics and collisions
- `adding-enemies` - Enemy AI
- `adding-collectibles` - Pickups and items
- `adding-ui` - UI elements
- `multiplayer-setup` - Normcore sync (if multiplayer)
- `quality-gate` - Quality verification

## Output to User

Keep user informed at each phase:

- **Phase 1:** "I'm exploring your game idea... [asks question]"
- **Phase 2:** "Creating the game design document..."
- **Phase 3:** "Breaking down the implementation plan..."
- **Phase 4:** "Searching for assets in parallel..."
- **Phase 5:** "Building your game with quality reviews..."
- **Phase 6:** "Your game is ready! [control instructions]"

## Example Usage

User types: `/super-game space shooter where I dodge asteroids`

**Phase 1 - Brainstorming:**
```
I'm exploring your space shooter idea...

Q: What perspective should the game have?
   1. Top-down (looking down at the action)
   2. Side-scrolling
   3. First-person cockpit view

A: 1

Q: Single-player or multiplayer?
   1. Single-player
   2. Multiplayer (Normcore)

A: 2

[... more questions until design is clear]

Based on our discussion, here's the design direction:
- Top-down space shooter
- Multiplayer with Normcore
- Player dodges and shoots asteroids
- Score points for destruction
[User approves]
```

**Phase 2 - Game Design:**
```
Creating the game design document...
-> GAME_DESIGN.md created with:
  - Core loop: Dodge -> Shoot -> Score -> Repeat
  - M1: Player movement, camera, basic scene
  - M2: Asteroid spawning, shooting, collision
  - M3: Score UI, multiplayer sync
  - M4: Polish (effects, sounds)
```

**Phase 3 - Implementation Plan:**
```
Breaking down into tasks...
-> docs/plans/2026-03-03-space-shooter.md created

Core Tasks (Sequential):
  1. PlayerController - WASD movement
  2. CameraFollow - Top-down tracking
  3. SpaceScene - Starfield background

Independent Tasks (Parallel):
  4. AsteroidSpawner - Random asteroid generation
  5. ShootingSystem - Laser spawning
  6. ScoreUI - Points display
  7. AudioSystem - Explosion sounds
```

**Phase 4 - Asset Search:**
```
Searching for assets in parallel...
-> Spaceship model found (OpenGameArt)
-> Asteroid model found (Kenney)
-> Explosion sound found (Freesound)
-> All assets downloaded and imported
```

**Phase 5 - Implementation:**
```
Building your game...

[Sequential] Task 1: PlayerController
  -> Implemented [OK]
  -> Spec review: PASS [OK]
  -> Quality review: PASS [OK]

[Sequential] Task 2: CameraFollow
  -> Implemented [OK]
  -> Spec review: PASS [OK]
  -> Quality review: PASS [OK]

[Parallel] Task 4-7: All running...
  -> All complete, all reviews passed [OK]
```

**Phase 6 - Completion:**
```
Running final quality check...
-> Functional: PASS (30s test, no errors)
-> Playability: PASS (controls responsive)
-> Visual: PASS (scene looks good)

Your space shooter is ready!
- WASD to move your ship
- SPACE to shoot
- Destroy asteroids to score points
- Works in multiplayer!

Press Play in Unity to test!
```

## Difference from /new-game

| Aspect | /new-game | /super-game |
|--------|-----------|-------------|
| Requirements | Direct to planner | Interactive brainstorming first |
| Implementation | Direct execution | Subagent-driven with reviews |
| Quality | Single quality-gate | Two-stage review per task |
| Plan | Milestones in design doc | Detailed task plan |
| Best for | Quick prototypes | Polished, production-quality games |
