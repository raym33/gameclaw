---
name: gameclaw
description: Use when working with the Gameclaw repo or when a user wants Codex to turn game sketches, sprites, screenshots, handwritten notes, moodboards, or rough mechanics into a playable browser prototype. Covers Gameclaw architecture, blueprint generation, Phaser/Matter runtimes, Astral Orchard, local Ollama/LM Studio or OpenAI-compatible backends, sprite fidelity, validation, and publishing changes to raym33/gameclaw.
---

# Gameclaw

Use this skill to work on Gameclaw end to end: multimodal game idea intake, blueprint generation, stable runtime selection, playable Phaser prototypes, and Codex skill packaging.

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
4. Implement the smallest stable playable slice. Do not generate broad, unbounded game architecture.
5. Validate with `npm run lint` and `npm run build` unless the change is documentation-only.

## Operating Rules

- Prefer stable systems over freeform generated code.
- Let AI choose intent, systems, parameters, and backlog; let code and engines execute gameplay.
- Keep physics real: use Phaser arcade-style logic for simple profiles and Matter for rigid-body destruction.
- Keep visuals honest: use user-provided or curated sprites when visual fidelity is requested.
- Do not use procedural character rigs unless the user explicitly requests them.
- If a concept cannot be fully generated, return a playable vertical slice plus clear approximation/backlog.

## Reference Loading

Load only what is needed:

- For runtime/profile decisions, read [runtime-profiles.md](references/runtime-profiles.md).
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
- Sprite/physics changes are visually checked, not only type-checked.

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
Use $gameclaw to turn these uploaded sketches and sprites into a playable prototype.
```

## Publishing

When the user asks to publish changes:

1. Commit only relevant files.
2. Use a focused message, e.g. `Improve Gameclaw skill`.
3. Push to `origin main` for `raym33/gameclaw`.
