import { fileURLToPath } from 'node:url'
import path from 'node:path'

import express from 'express'
import multer from 'multer'

import { buildFallbackBlueprint } from './blueprint'
import { collectAIInputWarnings, generateBlueprintWithAI, hasAIConfig, resolveAIProvider } from './openai'
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
  const provider = resolveAIProvider()
  response.json({
    ok: true,
    aiConfigured: hasAIConfig(),
    provider: {
      kind: provider.kind,
      label: provider.label,
      model: provider.model ?? null,
    },
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

    const configuredProvider = resolveAIProvider()
    const warnings: string[] = []
    warnings.push(...collectAIInputWarnings(images))
    let generationSource: GenerationResult['generationSource'] = 'fallback'
    let providerKind: GenerationResult['providerKind'] = 'fallback'
    let providerLabel = 'Fallback'

    const buildLocalFallback = () =>
      buildFallbackBlueprint(
        notes,
        images.map((image) => image.name),
        images.length,
      )

    const blueprint =
      configuredProvider.kind === 'fallback'
        ? buildLocalFallback()
        : await generateBlueprintWithAI(notes, images)
            .then((value) => {
              generationSource = 'ai'
              providerKind = configuredProvider.kind
              providerLabel = configuredProvider.label
              return value
            })
            .catch((error) => {
              const message = error instanceof Error ? error.message : 'Unknown AI error.'
              warnings.push(
                `${configuredProvider.label} no respondió bien. Se usó el fallback local. Detalle: ${message}`,
              )
              return buildLocalFallback()
            })

    if (configuredProvider.kind === 'fallback') {
      warnings.push(
        'No hay proveedor AI configurado. Gameclaw cayó en el blueprint local de demostración sin análisis multimodal real.',
      )
    }

    const result: GenerationResult = {
      blueprint,
      generationSource,
      providerKind,
      providerLabel,
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
