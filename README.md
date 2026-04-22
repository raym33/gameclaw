# Gameclaw

Gameclaw is a sketch-to-game prototype repo: the user uploads photos of videogame sketches, sprite sheets, screenshots, handwritten mechanic notes, or rough moodboards, and the app turns that material into:

- an AI-generated game blueprint
- a playable browser prototype rendered immediately in Phaser
- reusable asset prompts and production notes

The goal is not to promise infinite autonomous game generation. The goal is a reliable first playable version that preserves the user's original intent.

## What It Does

1. Upload multiple visual references.
2. Add optional notes about genre, controls, tone, or mechanics.
3. The backend analyzes the images with the OpenAI Responses API.
4. The app maps that analysis to a stable gameplay template.
5. A playable prototype appears in the browser together with the generated brief.

Current templates:

- `arena-survivor`
- `lane-runner`
- `relic-sprint`

That constraint is deliberate. It makes the output much more stable than open-ended code synthesis.

## Stack

- React + Vite for the UI
- Express for uploads and orchestration
- OpenAI Responses API for multimodal analysis and structured output
- Phaser 3 for the playable prototype runtime

## Why Not Reuse OpenGame Directly

`OpenGame` is interesting as research and reference, but this repo solves a different product problem:

- input is multimodal visual material, not only a text prompt
- output must be dependable for real users, not only impressive in demos
- the first version should optimize for consistency and iteration speed

So this repo starts from scratch around a template-driven architecture.

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
