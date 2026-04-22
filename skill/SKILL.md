---
name: gameclaw
description: Use when working with the Gameclaw repository to turn sketches, sprites, screenshots, handwritten notes, or rough game concepts into playable browser vertical slices using React, Express, Phaser, Matter physics, and local or OpenAI-compatible multimodal AI backends. Use for implementing or improving Gameclaw runtimes, blueprints, generated game prototypes, Astral Orchard demo behavior, upload-to-game flows, local Ollama/LM Studio configuration, and repo validation.
---

# Gameclaw

Gameclaw is a sketch-to-game prototyping repo. Use this skill when the user wants Codex to generate, improve, debug, or run a playable game prototype from visual references and mechanics.

## Core Workflow

1. Work from the Gameclaw repo root. If the repo is missing, clone `https://github.com/raym33/gameclaw`.
2. Inspect current state with `git status --short`; do not overwrite unrelated user changes.
3. Identify whether the request concerns:
   - blueprint generation: `server/blueprint.ts`, `server/openai.ts`, `shared/game.ts`
   - API/upload flow: `server/index.ts`, `src/lib/api.ts`
   - UI: `src/App.tsx`, `src/index.css`
   - playable runtime: `src/game/createGame.ts`
   - curated demo: `server/demo.ts`, `demo-inputs/sample-user`, `src/assets/astral-orchard`
4. Implement the smallest stable vertical slice. Favor known systems and runtime profiles over freeform generated code.
5. Validate with `npm run lint` and `npm run build`.
6. For local testing, use `npm run dev` and open `http://localhost:5173/?demo=astral-orchard` for the curated demo.

## Runtime Model

Gameclaw maps concepts to a composable system stack, then derives a stable runtime profile.

Supported runtime profiles:

- `arena-survivor`
- `lane-runner`
- `relic-hunt`
- `platformer-expedition`
- `slingshot-destruction`

Supported system dimensions live in `shared/game.ts`:

- camera
- movement
- physics
- combat
- objective
- world layout
- special mechanic

When adding a new mechanic, first decide whether it is:

- `native`: fits an existing runtime directly
- `hybrid`: fits an existing runtime with a custom twist
- `approximate`: too broad for current engine; preserve the strongest hook in a stable slice

Do not let the AI invent arbitrary physics or arbitrary game architecture. The model should select systems and parameters; Phaser/Matter should execute the game.

## AI Backends

Gameclaw supports local and OpenAI-compatible backends:

- `AI_PROVIDER=ollama`
- `AI_PROVIDER=lmstudio`
- `AI_PROVIDER=openai-compatible`
- legacy `OPENAI_*` variables

Useful health check:

```bash
curl -sS http://localhost:3001/api/health
```

If no backend is configured, Gameclaw should fall back to a local blueprint/demo rather than crash.

## Visual And Sprite Rules

- Prefer original uploaded or curated sprites over procedural placeholder art when the user asks for visual fidelity.
- For `Astral Orchard`, the original character source is `src/assets/astral-orchard/original-sprite-sheet.png`.
- Avoid procedural character rigs unless the user explicitly asks for them.
- If sprites contain baked backgrounds, use runtime cutout/cropping or prepare transparent assets.
- Keep physics bodies separate from visuals: Matter shapes can be invisible while sprites follow them.
- For slingshot games, the elastic band should be dynamic and visually tied to the projectile, while trajectory prediction should use the same launch vector as the real shot.

## Slingshot / Angry Birds Style

For concepts similar to Angry Birds:

- Use `systems.movement = "slingshot"`.
- Use `systems.physics = "matter-rigid-body"`.
- Use `systems.objective = "destroy-targets"`.
- Runtime profile should derive to `slingshot-destruction`.
- The player interaction should be: drag projectile backward, show elastic tension, release, then let Matter handle collision/collapse.
- Preserve authored level readability over random debris.

Key file: `src/game/createGame.ts`.

## Direct Demo

The curated playable demo is Astral Orchard.

Run:

```bash
npm run dev
```

Open:

```text
http://localhost:5173/?demo=astral-orchard
```

If using a production build:

```bash
npm run build
npm run start
```

Open:

```text
http://localhost:3001/?demo=astral-orchard
```

## Validation

Before finishing code changes:

```bash
npm run lint
npm run build
```

If browser behavior matters, do a real browser smoke test. Verify:

- the app loads
- `/api/health` works
- `/api/demo/astral-orchard` returns a blueprint
- the canvas appears
- the relevant control loop works

## GitHub

If the user asks to publish the work, commit focused changes and push to `origin main` for `raym33/gameclaw`.

Use concise commit messages, for example:

- `Add Gameclaw Codex skill`
- `Improve slingshot sprite animation`
- `Add runtime profile for stealth prototype`
