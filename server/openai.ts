import OpenAI from 'openai'

import { GAME_BLUEPRINT_JSON_SCHEMA, normalizeBlueprint } from './blueprint'
import type { GameBlueprint } from '../shared/game'

type UploadedImage = {
  name: string
  mimeType: string
  base64Data: string
}

let cachedClient: OpenAI | null = null

function getClient(): OpenAI {
  if (cachedClient) {
    return cachedClient
  }

  cachedClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  })

  return cachedClient
}

export function hasOpenAIConfig(): boolean {
  return Boolean(process.env.OPENAI_API_KEY)
}

export async function generateBlueprintWithOpenAI(
  notes: string,
  images: UploadedImage[],
): Promise<GameBlueprint> {
  const client = getClient()
  const model = process.env.OPENAI_MODEL || 'gpt-5.4-mini'

  const response = await client.responses.create({
    model,
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: buildCreativeDirectionPrompt(notes, images),
          },
          ...images.map((image) => ({
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

  return normalizeBlueprint(JSON.parse(response.output_text), {
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
    'Use the images as the primary source of truth. Notes refine the idea but should not override strong visual evidence.',
    'Choose exactly one template from the allowed enum and adapt the concept so it becomes realistically playable.',
    'Do not copy trademarked names or existing IP verbatim even if the references resemble them. Abstract the inspiration into original names and descriptions.',
    'Prioritize clear player fantasy, readable controls, three strong gameplay beats, a distinctive palette, and concise asset prompts.',
    'Output only JSON matching the schema.',
    '',
    `User notes:\n${notes.trim() || 'No notes provided.'}`,
    '',
    `Uploaded files:\n${fileSummary}`,
  ].join('\n')
}
