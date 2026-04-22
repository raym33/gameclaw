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
3. The backend analyzes the images with the OpenAI Responses API.
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
- OpenAI Responses API for multimodal analysis and structured output
- Phaser 3 for the playable prototype runtime
- Phaser Matter for rigid-body destruction prototypes

## Setup

```bash
npm install
cp .env.example .env
```

Optional but recommended:

```bash
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5.4-mini
```

Then run:

```bash
npm run dev
```

Frontend: [http://localhost:5173](http://localhost:5173)  
Backend: [http://localhost:3001](http://localhost:3001)

If `OPENAI_API_KEY` is missing, Gameclaw still runs in a local fallback mode so the repo remains demoable.

## Build

```bash
npm run lint
npm run build
npm run start
```

## OpenAI Notes

This repo uses the current OpenAI `Responses` API shape for:

- image input via `input_image`
- structured output via `text.format` with `json_schema`

Relevant docs:

- [Images and vision](https://developers.openai.com/api/docs/guides/images-vision)
- [Migrate to Responses](https://developers.openai.com/api/docs/guides/migrate-to-responses)
- [GPT-5.4 mini model page](https://developers.openai.com/api/docs/models/gpt-5.4-mini/)
