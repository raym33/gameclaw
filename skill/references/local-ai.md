# Local AI Backends

Gameclaw supports local and OpenAI-compatible providers. Keep fallback behavior intact: backend failure should not crash prototype generation.

## Health Check

```bash
curl -sS http://localhost:3001/api/health
```

## Ollama

```bash
AI_PROVIDER=ollama
AI_BASE_URL=http://127.0.0.1:11434
AI_MODEL=gemma3:4b
AI_PROVIDER_LABEL=MacBook Ollama
```

Uses Ollama `/api/chat` with image attachments and JSON schema response formatting.

## LM Studio

```bash
AI_PROVIDER=lmstudio
AI_BASE_URL=http://192.168.1.50:1234/v1
AI_MODEL=qwen2.5-vl-7b-instruct
AI_API_KEY=lm-studio
AI_PROVIDER_LABEL=Mac mini LM Studio
```

LM Studio is treated as OpenAI-compatible.

## Generic OpenAI-Compatible

```bash
AI_PROVIDER=openai-compatible
AI_BASE_URL=http://127.0.0.1:8000/v1
AI_MODEL=your-model
AI_API_KEY=local-key-if-required
```

## Legacy OpenAI Variables

```bash
OPENAI_API_KEY=...
OPENAI_MODEL=...
OPENAI_BASE_URL=
```

## Backend Files

- Provider resolution: `server/openai.ts`
- API health and generation endpoints: `server/index.ts`
- Fallback blueprint: `server/blueprint.ts`
