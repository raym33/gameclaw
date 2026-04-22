import OpenAI from 'openai'

import { GAME_BLUEPRINT_JSON_SCHEMA, normalizeBlueprint } from './blueprint'
import type { GameBlueprint, GenerationProviderKind } from '../shared/game'

type UploadedImage = {
  name: string
  mimeType: string
  base64Data: string
}

type ResolvedAIProvider = {
  kind: GenerationProviderKind
  label: string
  model?: string
  baseURL?: string
  apiKey?: string
}

type OllamaChatResponse = {
  error?: string
  message?: {
    content?: string
  }
}

const DEFAULT_OPENAI_MODEL = 'gpt-5.4-mini'
const DEFAULT_OLLAMA_MODEL = 'gemma3:4b'
const DEFAULT_OLLAMA_BASE_URL = 'http://127.0.0.1:11434'
const DEFAULT_LM_STUDIO_BASE_URL = 'http://127.0.0.1:1234/v1'
const LOCAL_API_KEY = 'gameclaw-local'
const MAX_MULTIMODAL_IMAGES = 4

const cachedClients = new Map<string, OpenAI>()

function getClient(baseURL: string | undefined, apiKey: string): OpenAI {
  const cacheKey = `${baseURL ?? 'openai'}::${apiKey}`
  const cached = cachedClients.get(cacheKey)
  if (cached) {
    return cached
  }

  const client = new OpenAI({
    apiKey,
    baseURL,
  })

  cachedClients.set(cacheKey, client)
  return client
}

export function resolveAIProvider(): ResolvedAIProvider {
  const provider = normalizeProvider(process.env.AI_PROVIDER)
  const genericBaseURL = trim(process.env.AI_BASE_URL)
  const genericApiKey = trim(process.env.AI_API_KEY)
  const genericModel = trim(process.env.AI_MODEL)

  if (provider === 'ollama') {
    return {
      kind: 'ollama',
      label: process.env.AI_PROVIDER_LABEL || `Ollama / ${resolveOllamaModel()}`,
      model: resolveOllamaModel(),
      baseURL: trim(process.env.AI_BASE_URL) || trim(process.env.OLLAMA_BASE_URL) || DEFAULT_OLLAMA_BASE_URL,
    }
  }

  if (provider === 'lmstudio') {
    return {
      kind: 'openai-compatible',
      label: process.env.AI_PROVIDER_LABEL || `LM Studio / ${resolveOpenAICompatibleModel()}`,
      model: resolveOpenAICompatibleModel(),
      baseURL: trim(process.env.AI_BASE_URL) || trim(process.env.OPENAI_BASE_URL) || DEFAULT_LM_STUDIO_BASE_URL,
      apiKey: trim(process.env.AI_API_KEY) || trim(process.env.OPENAI_API_KEY) || LOCAL_API_KEY,
    }
  }

  if (provider === 'openai-compatible') {
    return {
      kind: 'openai-compatible',
      label: process.env.AI_PROVIDER_LABEL || `OpenAI-compatible / ${resolveOpenAICompatibleModel()}`,
      model: resolveOpenAICompatibleModel(),
      baseURL: trim(process.env.AI_BASE_URL) || trim(process.env.OPENAI_BASE_URL) || undefined,
      apiKey: trim(process.env.AI_API_KEY) || trim(process.env.OPENAI_API_KEY) || LOCAL_API_KEY,
    }
  }

  if (provider === 'openai') {
    return {
      kind: 'openai-compatible',
      label: process.env.AI_PROVIDER_LABEL || `OpenAI / ${resolveOpenAICompatibleModel()}`,
      model: resolveOpenAICompatibleModel(),
      baseURL: trim(process.env.AI_BASE_URL) || trim(process.env.OPENAI_BASE_URL) || undefined,
      apiKey: trim(process.env.AI_API_KEY) || trim(process.env.OPENAI_API_KEY) || LOCAL_API_KEY,
    }
  }

  if (genericBaseURL || genericApiKey) {
    return {
      kind: 'openai-compatible',
      label: process.env.AI_PROVIDER_LABEL || `OpenAI-compatible / ${genericModel || DEFAULT_OPENAI_MODEL}`,
      model: genericModel || DEFAULT_OPENAI_MODEL,
      baseURL: genericBaseURL || undefined,
      apiKey: genericApiKey || LOCAL_API_KEY,
    }
  }

  const legacyBaseURL = trim(process.env.OPENAI_BASE_URL)
  const legacyKey = trim(process.env.OPENAI_API_KEY)
  const legacyModel = trim(process.env.OPENAI_MODEL)

  if (legacyBaseURL || legacyKey || legacyModel) {
    return {
      kind: 'openai-compatible',
      label:
        process.env.AI_PROVIDER_LABEL ||
        (legacyBaseURL ? `OpenAI-compatible / ${resolveOpenAICompatibleModel()}` : `OpenAI / ${resolveOpenAICompatibleModel()}`),
      model: resolveOpenAICompatibleModel(),
      baseURL: legacyBaseURL || undefined,
      apiKey: legacyKey || LOCAL_API_KEY,
    }
  }

  if (process.env.AUTO_LOCAL_AI === '0') {
    return {
      kind: 'fallback',
      label: 'Fallback',
    }
  }

  return {
    kind: 'ollama',
    label: process.env.AI_PROVIDER_LABEL || `Ollama / ${resolveOllamaModel()}`,
    model: resolveOllamaModel(),
    baseURL: trim(process.env.AI_BASE_URL) || trim(process.env.OLLAMA_BASE_URL) || DEFAULT_OLLAMA_BASE_URL,
  }
}

export function hasAIConfig(): boolean {
  return resolveAIProvider().kind !== 'fallback'
}

export function collectAIInputWarnings(images: UploadedImage[]): string[] {
  const warnings: string[] = []
  const rasterImages = images.filter(isVisionAttachableImage)

  if (rasterImages.length < images.length) {
    warnings.push(
      'Algunas referencias vectoriales o no raster se resumieron por nombre y no se enviaron como imagen al backend AI local.',
    )
  }

  if (rasterImages.length > MAX_MULTIMODAL_IMAGES) {
    warnings.push(
      `Se enviaron ${MAX_MULTIMODAL_IMAGES} imágenes raster al backend AI. El resto se mantuvo como contexto textual para no bloquear el modelo local.`,
    )
  }

  return warnings
}

export async function generateBlueprintWithAI(
  notes: string,
  images: UploadedImage[],
): Promise<GameBlueprint> {
  const provider = resolveAIProvider()

  if (provider.kind === 'fallback') {
    throw new Error('No AI provider configured.')
  }

  if (provider.kind === 'ollama') {
    return generateBlueprintWithOllama(provider, notes, images)
  }

  return generateBlueprintWithOpenAICompatible(provider, notes, images)
}

async function generateBlueprintWithOpenAICompatible(
  provider: ResolvedAIProvider,
  notes: string,
  images: UploadedImage[],
): Promise<GameBlueprint> {
  const client = getClient(provider.baseURL, provider.apiKey || LOCAL_API_KEY)
  const attachedImages = selectVisionImages(images)
  const response = await client.responses.create({
    model: provider.model || DEFAULT_OPENAI_MODEL,
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: buildCreativeDirectionPrompt(notes, images),
          },
          ...attachedImages.map((image) => ({
            type: 'input_image' as const,
            image_url: `data:${image.mimeType};base64,${image.base64Data}`,
            detail: 'high' as const,
          })),
        ],
      },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'game_blueprint',
        strict: true,
        schema: GAME_BLUEPRINT_JSON_SCHEMA,
      },
    },
  })

  return normalizeBlueprint(parseStructuredJSON(response.output_text), {
    notes,
    fileNames: images.map((image) => image.name),
    sourceImageCount: images.length,
  })
}

async function generateBlueprintWithOllama(
  provider: ResolvedAIProvider,
  notes: string,
  images: UploadedImage[],
): Promise<GameBlueprint> {
  const attachedImages = selectVisionImages(images)
  const response = await fetch(`${provider.baseURL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: provider.model || DEFAULT_OLLAMA_MODEL,
      stream: false,
      format: 'json',
      messages: [
        {
          role: 'user',
          content: buildCreativeDirectionPrompt(notes, images),
          images: attachedImages.map((image) => image.base64Data),
        },
      ],
      options: {
        temperature: 0.2,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Ollama responded with ${response.status}.`)
  }

  const payload = (await response.json()) as OllamaChatResponse

  if (payload.error) {
    throw new Error(payload.error)
  }

  const content = payload.message?.content?.trim()
  if (!content) {
    throw new Error('Ollama returned an empty structured response.')
  }

  return normalizeBlueprint(parseStructuredJSON(content), {
    notes,
    fileNames: images.map((image) => image.name),
    sourceImageCount: images.length,
  })
}

function buildCreativeDirectionPrompt(notes: string, images: UploadedImage[]): string {
  const fileSummary =
    images.length > 0
      ? images.map((image, index) => `${index + 1}. ${image.name} (${image.mimeType})`).join('\n')
      : 'No images uploaded.'

  return [
    'You are Gameclaw, an AI creative director and gameplay prototyper.',
    'Turn rough image references into a playable web-game blueprint that fits a short Phaser prototype.',
    'You must think in composable systems, not one-off freeform game descriptions.',
    'Use the images as the primary source of truth. Notes refine the idea but should not override strong visual evidence.',
    'The current runtime supports these stable profile families through systems: arena survivor, lane runner, relic hunt, platformer expedition, and slingshot destruction.',
    'Choose system values that collapse the concept into one of those stable profiles while preserving the most original hook.',
    'If the requested idea is unusual, set supportLevel to hybrid or approximate and explain the approximationStrategy honestly.',
    'Use matter-rigid-body only for slingshot or destruction-driven concepts.',
    'Prefer stable vertical slices over overpromising.',
    'Do not copy trademarked names or existing IP verbatim even if the references resemble them. Abstract the inspiration into original names and descriptions.',
    'Prioritize clear player fantasy, readable controls, a distinctive palette, concise asset prompts, and implementationNotes that help engineers ship the prototype.',
    'Output only JSON matching the provided schema.',
    '',
    `User notes:\n${notes.trim() || 'No notes provided.'}`,
    '',
    `Uploaded files:\n${fileSummary}`,
  ].join('\n')
}

function parseStructuredJSON(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    const fenced = value.match(/```json\s*([\s\S]*?)```/i)
    if (fenced?.[1]) {
      return JSON.parse(fenced[1].trim())
    }

    const objectMatch = value.match(/\{[\s\S]*\}/)
    if (objectMatch?.[0]) {
      return JSON.parse(objectMatch[0])
    }

    throw new Error('The model response was not valid JSON.')
  }
}

function normalizeProvider(value: string | undefined): 'openai' | 'openai-compatible' | 'lmstudio' | 'ollama' | null {
  const normalized = trim(value)?.toLowerCase()

  switch (normalized) {
    case 'openai':
      return 'openai'
    case 'openai-compatible':
    case 'openai_compatible':
    case 'compatible':
      return 'openai-compatible'
    case 'lmstudio':
    case 'lm-studio':
      return 'lmstudio'
    case 'ollama':
      return 'ollama'
    default:
      return null
  }
}

function resolveOpenAICompatibleModel(): string {
  return trim(process.env.AI_MODEL) || trim(process.env.OPENAI_MODEL) || DEFAULT_OPENAI_MODEL
}

function resolveOllamaModel(): string {
  return trim(process.env.AI_MODEL) || trim(process.env.OLLAMA_MODEL) || DEFAULT_OLLAMA_MODEL
}

function trim(value: string | undefined): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed || null
}

function selectVisionImages(images: UploadedImage[]): UploadedImage[] {
  return images.filter(isVisionAttachableImage).slice(0, MAX_MULTIMODAL_IMAGES)
}

function isVisionAttachableImage(image: UploadedImage): boolean {
  return !image.mimeType.includes('svg')
}
