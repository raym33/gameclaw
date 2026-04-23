import type { GenerationResult } from '../../shared/game'

export async function requestGeneration(files: File[], notes: string): Promise<GenerationResult> {
  const payload = new FormData()
  files.forEach((file) => payload.append('files', file))
  payload.append('notes', notes)

  const response = await fetch('/api/generate', {
    method: 'POST',
    body: payload,
  })

  const data = (await response.json()) as GenerationResult | { error: string }

  if (!response.ok || 'error' in data) {
    throw new Error('error' in data ? data.error : 'No se pudo generar el prototipo.')
  }

  return data
}

export async function requestDemo(demoId: 'astral-orchard' | 'guardians-field'): Promise<GenerationResult> {
  const response = await fetch(`/api/demo/${demoId}`)
  const data = (await response.json()) as GenerationResult | { error: string }

  if (!response.ok || 'error' in data) {
    throw new Error('error' in data ? data.error : 'No se pudo cargar la demo.')
  }

  return data
}

export async function requestAstralOrchardDemo(): Promise<GenerationResult> {
  return requestDemo('astral-orchard')
}

export async function requestGuardiansFieldDemo(): Promise<GenerationResult> {
  return requestDemo('guardians-field')
}
