# Gameclaw

Gameclaw is a sketch-to-game prototype repo: the user uploads photos of videogame sketches, sprite sheets, screenshots, handwritten mechanic notes, or rough moodboards, and the app turns that material into:

- an AI-generated game blueprint
- a composable gameplay system stack
- a playable browser prototype rendered immediately in Phaser
- reusable asset prompts, implementation notes, and production backlog

The important change is architectural: Gameclaw no longer depends on three fixed templates. It now maps inputs to a stable runtime profile through systems like movement, physics, combat, objective, layout, and special mechanic.

## What It Does

1. Upload multiple visual references.
2. Add optional notes about genre, controls, tone, or mechanics.
3. The backend analyzes the images with a multimodal AI backend.
4. The app emits a structured blueprint with:
   - `systems`
   - `physics`
   - `supportLevel`
   - `approximationStrategy`
5. The frontend executes a runtime profile that fits those systems.

## Runtime Profiles

Gameclaw currently supports these stable profiles:

- `arena-survivor`
- `lane-runner`
- `relic-hunt`
- `platformer-expedition`
- `slingshot-destruction`

Those are not user-facing templates anymore. They are implementation targets chosen from the system stack.

## Supported Systems

- Camera: `top-down`, `side-view`
- Movement: `free-8dir`, `lane-switch`, `platformer`, `slingshot`
- Physics: `scripted-arcade`, `matter-rigid-body`
- Combat: `auto-shoot`, `pulse-burst`, `projectile-shot`, `none`
- Objective: `survive`, `collect`, `finish-run`, `destroy-targets`
- Layout: `arena`, `lanes`, `relic-field`, `platform-route`, `fortress-stack`
- Special: `combo-chain`, `rewind-dash`, `destructible-structures`

## Weird Or Original Games

This repo now handles unusual requests more honestly:

- If the idea fits a stable runtime, support is `native`.
- If the idea needs one unusual twist on top of a stable runtime, support is `hybrid`.
- If the idea is broader than the current engine can faithfully execute, support is `approximate`.

That means the system can now say:

- “this becomes a platformer with rewind”
- “this becomes a slingshot destruction game with real rigid bodies”
- “this becomes an arena slice preserving the strongest hook”

instead of pretending it can generate any game architecture from scratch.

## Physics

Physics are not invented by the model. The model only chooses the runtime and parameters.

- Most profiles use scripted arcade motion for readability and reliability.
- `slingshot-destruction` uses Phaser Matter rigid bodies for projectile launch, stacking, and collapse.

That is the path for ideas like `Angry Birds`: use a real physics runtime, not freeform code generation.

## Stack

- React + Vite for the UI
- Express for uploads and orchestration
- Ollama or OpenAI-compatible backends for multimodal analysis and structured output
- Phaser 3 for the playable prototype runtime
- Phaser Matter for rigid-body destruction prototypes

## Setup

```bash
npm install
cp .env.example .env
```

Run:

```bash
npm run dev
```

Frontend: [http://localhost:5173](http://localhost:5173)  
Backend: [http://localhost:3001](http://localhost:3001)

## AI Backends

Gameclaw no longer depends on OpenAI specifically. It supports:

- `ollama` for local models on this Mac or another machine
- `lmstudio` for a Mac mini running LM Studio
- generic `openai-compatible` endpoints
- the old `OPENAI_*` env vars as a legacy compatibility path

If you do not configure anything, Gameclaw tries local Ollama first through `http://127.0.0.1:11434` with `gemma3:4b`. If that fails, it falls back to the built-in demo blueprint mode so the repo still works.

### Ollama Example

```bash
AI_PROVIDER=ollama
AI_BASE_URL=http://127.0.0.1:11434
AI_MODEL=gemma3:4b
AI_PROVIDER_LABEL=MacBook Ollama
```

### LM Studio Example

```bash
AI_PROVIDER=lmstudio
AI_BASE_URL=http://192.168.1.50:1234/v1
AI_MODEL=qwen2.5-vl-7b-instruct
AI_API_KEY=lm-studio
AI_PROVIDER_LABEL=Mac mini LM Studio
```

### Legacy OpenAI-Compatible Example

```bash
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5.4-mini
OPENAI_BASE_URL=
```

Use `/api/health` to confirm which backend is active.

## Build

```bash
npm run lint
npm run build
npm run start
```

## Notes

- `lmstudio` uses the OpenAI-compatible `Responses` shape, so it works well for multimodal structured output.
- `ollama` uses `/api/chat` with image attachments and a JSON schema response format.
- If the configured AI backend fails at runtime, the server falls back to the local demo blueprint and adds a warning to the response instead of crashing the prototype flow.
