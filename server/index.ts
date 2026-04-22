import { fileURLToPath } from 'node:url'
import path from 'node:path'

import express from 'express'
import multer from 'multer'

import { buildFallbackBlueprint } from './blueprint'
import { generateBlueprintWithOpenAI, hasOpenAIConfig } from './openai'
import { persistRun } from './storage'
import type { GenerationResult, StoredGeneration } from '../shared/game'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CLIENT_DIST = path.resolve(__dirname, '../client')

const app = express()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 12,
    fileSize: 10 * 1024 * 1024,
  },
})

app.use(express.json())

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    openaiConfigured: hasOpenAIConfig(),
  })
})

app.post('/api/generate', upload.array('files', 12), async (request, response) => {
  const files = Array.isArray(request.files) ? request.files : []
  const notes = typeof request.body.notes === 'string' ? request.body.notes.trim() : ''

  if (files.length === 0) {
    response.status(400).json({ error: 'Sube al menos una imagen.' })
    return
  }

  const invalidFile = files.find((file) => !file.mimetype.startsWith('image/'))
  if (invalidFile) {
    response.status(400).json({ error: `El archivo ${invalidFile.originalname} no es una imagen válida.` })
    return
  }

  try {
    const images = files.map((file) => ({
      name: file.originalname,
      mimeType: file.mimetype,
      base64Data: file.buffer.toString('base64'),
    }))

    const generationSource = hasOpenAIConfig() ? 'openai' : 'fallback'
    const warnings: string[] = []

    const blueprint =
      generationSource === 'openai'
        ? await generateBlueprintWithOpenAI(notes, images)
        : buildFallbackBlueprint(
            notes,
            images.map((image) => image.name),
            images.length,
          )

    if (generationSource === 'fallback') {
      warnings.push(
        'OPENAI_API_KEY no está configurada. Se generó un prototipo local de demostración sin análisis multimodal real.',
      )
    }

    const result: GenerationResult = {
      blueprint,
      generationSource,
      warnings,
      createdAt: new Date().toISOString(),
    }

    const storedRun: StoredGeneration = {
      ...result,
      notes,
      files: files.map((file) => ({
        name: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      })),
    }

    await persistRun(storedRun)
    response.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    response.status(500).json({
      error: `No se pudo generar el prototipo. ${message}`,
    })
  }
})

app.use(express.static(CLIENT_DIST))
app.use((_request, response) => {
  response.sendFile(path.join(CLIENT_DIST, 'index.html'))
})

const port = Number(process.env.PORT || 3001)
app.listen(port, () => {
  console.log(`Gameclaw server listening on http://localhost:${port}`)
})
