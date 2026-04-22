# Gameclaw

Gameclaw turns rough game references into playable browser prototypes.

Upload sketches, sprite sheets, screenshots, handwritten notes or moodboards. Gameclaw reads the idea, builds a structured game blueprint, chooses a stable runtime profile, and renders a vertical slice in Phaser.

## What It Can Build

- Arcade survivor
- Lane runner
- Relic hunt
- Platformer expedition
- Slingshot destruction with Matter physics

The system favors stable playable slices over pretending it can generate any full game from scratch.

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

## Build

```bash
npm run lint
npm run build
npm run start
```

Production URL:

```text
http://localhost:3001
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
Use $gameclaw to turn these sketches, sprites and notes into a playable browser prototype.
```

The skill teaches Codex how to work with this repo, including runtime profiles, local AI backends, the Astral Orchard demo, Phaser/Matter validation, and when to use original sprites instead of procedural placeholders.

## License

MIT
