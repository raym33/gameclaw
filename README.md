# Gameclaw

Gameclaw helps Codex turn rough game references into polished playable browser slices.

Upload sketches, sprite sheets, screenshots, handwritten notes or moodboards. Gameclaw turns that material into a structured game blueprint, picks a stable runtime profile, and builds a browser game in Phaser.

The goal is not “any game”. The goal is getting to a small game that already feels intentional: coherent art direction, clean controls, reliable physics, readable motion, and enough final art coverage that the slice does not look like a prototype.

## What This Repo Is

- A browser game generator built around stable runtime profiles.
- A Codex skill that teaches how to use this repo fast.
- A quality bar for movement, physics, sprites, asset coverage, and game feel.

For polished or sellable requests, the repo is meant to push Codex to generate and integrate all missing images, sprite states, props, and feedback art needed for the loop to read well in motion.

## What It Can Build

- Arcade survivor
- Lane runner
- Relic hunt
- Platformer expedition
- Slingshot destruction with Matter physics

The system favors stable playable slices over pretending it can generate any full game from scratch.

## Quality Direction

- Prefer one strong loop over a broad but unfinished game.
- Use real raster assets instead of leaving the final layer on primitives.
- Add more sprites when motion reads badly.
- Keep trajectory previews, collisions, and launches on the same motion model.
- Treat game feel and visual integration as implementation work, not polish-afterthoughts.

## Stack

- React + Vite
- Express
- Phaser 3
- Phaser Matter
- Ollama, LM Studio or OpenAI-compatible AI backends

## Run

```bash
npm install
cp .env.example .env
npm run dev
```

Open:

```text
http://localhost:5173
```

Direct demo:

```text
http://localhost:5173/?demo=astral-orchard
```

Production build:

```text
http://localhost:3001/?demo=astral-orchard
```

## Local AI Backends

Gameclaw can use local or OpenAI-compatible models.

Ollama example:

```bash
AI_PROVIDER=ollama
AI_BASE_URL=http://127.0.0.1:11434
AI_MODEL=gemma3:4b
```

LM Studio example:

```bash
AI_PROVIDER=lmstudio
AI_BASE_URL=http://192.168.1.50:1234/v1
AI_MODEL=qwen2.5-vl-7b-instruct
AI_API_KEY=lm-studio
```

If no AI backend is available, the app falls back to a local demo blueprint.

## Validate

```bash
npm run lint
npm run build
npm run start
```

## Codex Skill

This repo includes a Codex skill in:

```text
skill/
```

To use it in Codex, install or copy the `skill/` folder into your Codex skills directory, then invoke:

```text
$gameclaw
```

Example prompt:

```text
Use $gameclaw to turn these sketches, sprites and notes into a polished playable browser vertical slice with professional movement, sprites, physics, and all missing images generated and integrated.
```

The skill teaches Codex how to work with this repo, including runtime profiles, local AI backends, Phaser/Matter validation, sprite fidelity, asset coverage, and the quality bar for movement and physics.

Install from the repo root:

```bash
./skill/scripts/install.sh
```

Then invoke:

```text
$gameclaw
```

## License

MIT
