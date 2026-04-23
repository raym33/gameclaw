---
name: gameclaw
description: Use when working with the Gameclaw repo or when a user wants Codex to turn game sketches, sprites, screenshots, handwritten notes, moodboards, or rough mechanics into a polished playable browser vertical slice faster than a generic Codex workflow. Covers Gameclaw architecture, blueprint generation, Phaser/Matter runtimes, production-quality movement and physics, pixel-perfect visual rules, sprite fidelity, complete asset coverage, genre playbooks, local Ollama/LM Studio or OpenAI-compatible backends, validation, and publishing changes to raym33/gameclaw.
---

# Gameclaw

Use this skill when the user wants a game that is not only playable, but presentable: coherent art direction, smooth controls, readable feedback, reliable physics, and enough visual finish that the slice does not look like a prototype.

The point of `$gameclaw` is speed with quality. If using it does not get Codex to a stronger vertical slice faster than an unstructured workflow, the skill is failing.

For polished, sellable, or app-store-style requests, treat art production as core implementation work. Missing sprites, weak effects, sparse screens, bad transitions, or placeholder HUD surfaces are product bugs.

## Target Output

Default to one of these:

- **Playable slice**: fast, stable, readable.
- **Premium slice**: polished, smooth, professional, studio-quality, pixel-perfect.
- **Commercial-looking slice**: app-store-style detail density, stronger presentation, richer asset families, better screenshot and trailer survival.

Default to a small, excellent slice over a broad, unfinished game.

## Work Areas

Classify the request before editing:

- **Blueprint/AI**: `server/blueprint.ts`, `server/openai.ts`, `shared/game.ts`
- **Game type catalog**: `shared/gameTypeKits.ts`
- **API/upload**: `server/index.ts`, `src/lib/api.ts`
- **UI/demo shell**: `src/App.tsx`, `src/index.css`
- **Playable runtime**: `src/game/createGame.ts`
- **Runtime templates**: `src/game/runtimeTemplates.ts`
- **Runtime scaffolds**: `src/game/runtimeSceneScaffold.ts`
- **Stage layout kits**: `src/game/gameTypeStageLayouts.ts`
- **Reusable templates**: `skill/assets/templates/*`
- **Curated demo/assets**: `server/demo.ts`, `demo-inputs/sample-user`, `src/assets/astral-orchard`
- **Skill packaging**: `skill/SKILL.md`, `skill/agents/openai.yaml`, `skill/references/*`

## Operating Rules

- Prefer stable systems over freeform generated code.
- Let AI choose intent, systems, tuning targets, art direction, and backlog. Let code and the engine execute gameplay.
- Pick the nearest runtime profile instead of inventing a broad new architecture.
- After choosing the runtime profile, pick the nearest executable game type kit so the slice does not fall back to the same generic tuning and layout every time.
- For educational or gamified asks, load the education template and bias toward mastery, streaks, soft retries, and readable content surfaces instead of combat-first loops.
- For platformer-first asks, load the platformer template and bias toward movement quality, landing readability, route composition, and sprite coverage before chasing breadth.
- Reuse and extend the existing runtime templates and scene scaffolds before adding new one-off scene wiring to `createGame.ts`.
- Keep physics honest: use Matter when rigid-body interaction is the feature, not as decoration.
- Use user-provided, curated, or generated raster assets before procedural placeholders when final visual quality matters.
- For polished or commercial-looking output, generate and integrate the missing image set required for the loop: character states, props, projectiles, impacts, HUD surfaces, and effects.
- Do not ration image generation effort if thin visual coverage is the reason the slice still looks cheap.
- Do not use procedural character rigs unless the user explicitly asks for them.
- If motion reads badly because sprite coverage is too thin, add or regenerate sprites instead of tweening incompatible poses.
- Trajectory previews and live launches must share the same motion model.
- Pointer release outside the canvas should still resolve cleanly when the mechanic depends on drag-and-release.
- Do not stop at “it compiles.” Movement, collisions, timing, camera, animation readability, and feedback must be checked.

## Production Workflow

1. Reduce the ask to `fantasy + core loop + camera + movement + physics + win state`.
2. Choose the runtime profile, the nearest executable game type kit, the nearest genre playbook, and the nearest preset kit.
3. Build the smallest stable playable loop.
4. Create the asset shot list for what is visible during the core minute of play.
5. Generate or refine the asset family so the screen reads as one coherent product.
6. Integrate assets into gameplay bodies and UI surfaces.
7. Tune game feel: anticipation, recovery, hit response, timing, camera, particles, readable failure states.
8. Validate with browser playtest checks, `npm run lint`, and `npm run build` unless the change is docs-only.
9. Leave backlog only after the slice is already worth showing.

## Mandatory Deliverables

Before calling the task done, the slice should have:

- one stable, readable core loop
- one clear art direction
- enough asset coverage for the visible gameplay to feel intentional in motion
- controls and failure states that make sense without hand-holding from the developer
- a main screen that looks composed on purpose
- a short backlog of real remaining gaps, not hidden problems

## Reference Loading

Load only what is needed:

- For runtime/profile decisions, read [runtime-profiles.md](references/runtime-profiles.md).
- For choosing a narrower playable product direction inside a runtime, read [game-type-kits.md](references/game-type-kits.md).
- For educational or gamified products, read [education-gamification.md](references/education-gamification.md) and load `skill/assets/templates/education-gamification.json`.
- For platformer-heavy products, read [platformer-production.md](references/platformer-production.md) and load `skill/assets/templates/platformer-production.json`.
- For production standards and what “good enough” means, read [quality-bar.md](references/quality-bar.md).
- For minimum final asset coverage and when to generate more art, read [asset-coverage.md](references/asset-coverage.md).
- For store-facing visual density and commercial presentation, read [app-store-quality.md](references/app-store-quality.md).
- For movement, camera, input, and physics feel, read [game-feel.md](references/game-feel.md).
- For genre-specific implementation priorities, read [genre-playbooks.md](references/genre-playbooks.md).
- For reusable runtime defaults and asset shot lists, read [preset-kits.md](references/preset-kits.md).
- For turning references into final asset families, read [production-loop.md](references/production-loop.md).
- For browser playtest gates, read [playtest-matrix.md](references/playtest-matrix.md).
- For Ollama, LM Studio, OpenAI-compatible setup, read [local-ai.md](references/local-ai.md).
- For sprites, cutouts, animation, and Astral Orchard visual rules, read [visual-fidelity.md](references/visual-fidelity.md).

## Common Commands

```bash
npm install
npm run dev
npm run lint
npm run build
npm run start
```

Useful URLs:

```text
http://localhost:5173
http://localhost:5173/?demo=astral-orchard
http://localhost:3001/api/health
http://localhost:3001/api/demo/astral-orchard
http://localhost:3001/?demo=astral-orchard
```

## Validation Checklist

- `npm run lint` passes.
- `npm run build` passes.
- `/api/health` returns the active backend or fallback state.
- `/api/demo/astral-orchard` returns a valid generation result.
- The canvas appears and the loop works in browser.
- Sprite, camera, and physics changes are visually checked, not only type-checked.
- The core loop no longer depends on placeholder presentation.
- Frequently seen states have dedicated visual coverage.
- If the target is commercial-looking, the main playable screen can survive a store screenshot or a short trailer clip.
- Mouse, keyboard, and drag-release edge cases are checked when relevant.
- Remaining quality gaps are called out as backlog, not hidden.

## Installing This Skill

From the repo root:

```bash
./skill/scripts/install.sh
```

Then invoke it in Codex with:

```text
$gameclaw
```

Example:

```text
Use $gameclaw to turn these uploaded sketches, sprites, and mechanics into a polished playable browser vertical slice with commercial-looking visuals, professional movement, reliable physics, and all missing assets generated and integrated.
```

## Publishing

When the user asks to publish changes:

1. Commit only relevant files.
2. Use a focused message.
3. Push to `origin main` for `raym33/gameclaw`.
