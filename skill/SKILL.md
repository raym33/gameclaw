---
name: gameclaw
description: Use when working with the Gameclaw repo or when a user wants Codex to turn game sketches, sprites, screenshots, handwritten notes, moodboards, or rough mechanics into a polished playable browser vertical slice faster than a generic Codex workflow. Covers Gameclaw architecture, blueprint generation, Phaser/Matter runtimes, production-quality movement and physics, pixel-perfect visual rules, sprite fidelity, local Ollama/LM Studio or OpenAI-compatible backends, validation, and publishing changes to raym33/gameclaw.
---

# Gameclaw

Use this skill to get from messy references to a small game that already feels intentional: coherent art direction, clean controls, reliable physics, readable HUD, and motion that does not scream prototype.

The point of this skill is speed with quality. If using `$gameclaw` does not help Codex reach a stronger playable slice faster than an unstructured workflow, the skill is failing.

## Start Here

1. Find or clone the repo: `https://github.com/raym33/gameclaw`.
2. Run `git status --short` before editing and preserve unrelated user changes.
3. Classify the request:
   - **Blueprint/AI**: `server/blueprint.ts`, `server/openai.ts`, `shared/game.ts`
   - **API/upload**: `server/index.ts`, `src/lib/api.ts`
   - **UI/demo shell**: `src/App.tsx`, `src/index.css`
   - **Playable runtime**: `src/game/createGame.ts`
   - **Curated demo/assets**: `server/demo.ts`, `demo-inputs/sample-user`, `src/assets/astral-orchard`
   - **Skill packaging**: `skill/SKILL.md`, `skill/agents/openai.yaml`, `skill/references/*`
4. Choose the target output:
   - **Playable slice**: fast, stable, readable.
   - **Premium slice**: default when the user asks for polished, smooth, sellable, professional, studio-quality, or pixel-perfect results.
5. Implement the smallest stable playable slice first, then reserve time for feel and polish. Do not generate broad, unbounded game architecture.
6. Validate with `npm run lint` and `npm run build` unless the change is documentation-only.

## Operating Rules

- Prefer stable systems over freeform generated code.
- Let AI choose intent, systems, parameters, and backlog; let code and engines execute gameplay.
- Default to one polished room, encounter, or loop over a wide but generic game.
- Keep physics real: use Phaser arcade-style logic for simple profiles and Matter for rigid-body destruction.
- Keep visuals honest: use user-provided, curated, or generated raster sprites before procedural placeholders when visual fidelity matters.
- Do not use procedural character rigs unless the user explicitly requests them.
- Do not stop at “it compiles.” Movement, collisions, timing, trajectory preview, camera, and animation readability must all be checked.
- If the user asks for pixel art or pixel-perfect visuals, lock the rendering decisions to that mode and keep sprite scale, filtering, and motion crisp.
- If the user asks for professional quality, spend time on the polish pass: anticipation, recovery, camera readability, VFX, impact feedback, and input edge cases.
- Trajectory previews and live launches must use the same motion model.
- Pointer release outside the canvas should still resolve the action cleanly when the mechanic depends on drag-and-release.
- If a concept cannot be fully generated, return a playable vertical slice plus clear approximation/backlog.

## Fast Workflow

1. Reduce the request to `fantasy + core loop + camera + movement + physics + win state`.
2. Pick the nearest runtime profile instead of inventing a new architecture.
3. Make the loop playable with the minimum stable systems.
4. Run a polish pass:
   - movement and acceleration/deceleration
   - jump, dash, slingshot, or attack feel
   - sprite readability and scale consistency
   - camera, HUD, particles, recoil, hit response
   - collision edge cases and failure states
5. Leave a short backlog only after the slice is already worth playing.

## Reference Loading

Load only what is needed:

- For runtime/profile decisions, read [runtime-profiles.md](references/runtime-profiles.md).
- For production standards and what “good enough” means, read [quality-bar.md](references/quality-bar.md).
- For movement, camera, input, and physics feel, read [game-feel.md](references/game-feel.md).
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
```

Production build URL after `npm run start`:

```text
http://localhost:3001/?demo=astral-orchard
```

## Validation Checklist

- `npm run lint` passes.
- `npm run build` passes.
- `/api/health` returns the active backend or fallback state.
- `/api/demo/astral-orchard` returns a valid generation result.
- The canvas appears.
- The requested control loop works in browser.
- Sprite, camera, and physics changes are visually checked, not only type-checked.
- Mouse, keyboard, and drag-release edge cases are checked if the game depends on them.
- Trajectory preview matches real launch behavior when a projectile mechanic exists.
- There are no placeholder circles/rectangles left in a slice that is supposed to look polished.
- If the style is pixel art, sprite filtering and scale are visually crisp in browser.
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
Use $gameclaw to turn these uploaded sketches and sprites into a polished playable browser vertical slice with studio-quality movement, sprites, and physics.
```

## Publishing

When the user asks to publish changes:

1. Commit only relevant files.
2. Use a focused message, e.g. `Improve Gameclaw skill`.
3. Push to `origin main` for `raym33/gameclaw`.
