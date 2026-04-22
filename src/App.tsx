import { startTransition, useEffect, useMemo, useState } from 'react'

import type { GenerationResult } from '../shared/game'
import { TEMPLATE_LABELS } from '../shared/game'
import { GameCanvas } from './components/GameCanvas'
import { requestGeneration } from './lib/api'

type UploadItem = {
  file: File
  id: string
  previewUrl: string
}

const PROMPT_SEEDS = [
  'Sube bocetos de personajes, mapas, HUDs, sprites o fotos de libreta.',
  'Añade notas como loop principal, tono, referencias o mecánicas clave.',
  'Gameclaw analiza el material y te devuelve un prototipo jugable inmediato.',
]

const EXAMPLE_NOTES = `Action roguelite con vista cenital. Quiero sensación de reliquias antiguas, ritmo rápido y una habilidad especial tipo pulso que limpie espacio cuando te rodean.`

export default function App() {
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [notes, setNotes] = useState(EXAMPLE_NOTES)
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    return () => {
      uploads.forEach((item) => URL.revokeObjectURL(item.previewUrl))
    }
  }, [uploads])

  const fileCountLabel = useMemo(() => {
    if (uploads.length === 0) {
      return 'Sin referencias todavía'
    }

    return `${uploads.length} referencia${uploads.length === 1 ? '' : 's'} lista${uploads.length === 1 ? '' : 's'}`
  }, [uploads.length])

  async function handleGenerate() {
    if (uploads.length === 0 || busy) {
      return
    }

    setBusy(true)
    setError(null)

    try {
      const generation = await requestGeneration(
        uploads.map((item) => item.file),
        notes,
      )

      startTransition(() => {
        setResult(generation)
      })
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'No se pudo generar el prototipo.')
    } finally {
      setBusy(false)
    }
  }

  function appendFiles(list: FileList | File[]) {
    const nextFiles = Array.from(list).filter((file) => file.type.startsWith('image/'))
    if (nextFiles.length === 0) {
      return
    }

    setUploads((current) => {
      const known = new Set(current.map((item) => `${item.file.name}:${item.file.size}`))
      const additions = nextFiles
        .filter((file) => !known.has(`${file.name}:${file.size}`))
        .map((file) => ({
          file,
          id: crypto.randomUUID(),
          previewUrl: URL.createObjectURL(file),
        }))

      return [...current, ...additions].slice(0, 12)
    })
  }

  function removeUpload(id: string) {
    setUploads((current) => {
      const target = current.find((item) => item.id === id)
      if (target) {
        URL.revokeObjectURL(target.previewUrl)
      }
      return current.filter((item) => item.id !== id)
    })
  }

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">GAMECLAW / sketch-to-prototype</span>
          <h1>Sube el caos visual. Baja un videojuego jugable.</h1>
          <p className="hero-lede">
            Este repo convierte fotos de bocetos, capturas, sprites y notas sueltas en un blueprint
            estructurado y un prototipo en Phaser. La primera versión es deliberadamente fiable:
            usa plantillas de juego estables en vez de prometer generación infinita y rota.
          </p>
          <div className="hero-list">
            {PROMPT_SEEDS.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>

        <div className="hero-stats">
          <div className="stat-card">
            <span>Motor</span>
            <strong>OpenAI Responses API</strong>
          </div>
          <div className="stat-card">
            <span>Salida</span>
            <strong>Blueprint + prototipo</strong>
          </div>
          <div className="stat-card">
            <span>Runtime</span>
            <strong>React + Phaser + Express</strong>
          </div>
        </div>
      </section>

      <section className="workspace-grid">
        <div className="panel panel-input">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Input</span>
              <h2>Brief multimodal</h2>
            </div>
            <span className="hint-chip">{fileCountLabel}</span>
          </div>

          <label
            className={`dropzone ${dragging ? 'is-dragging' : ''}`}
            onDragEnter={() => setDragging(true)}
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault()
              setDragging(false)
              appendFiles(event.dataTransfer.files)
            }}
          >
            <input
              accept="image/*"
              multiple
              type="file"
              onChange={(event) => appendFiles(event.target.files ?? [])}
            />
            <span className="dropzone-title">Arrastra imágenes o pulsa para subir</span>
            <span className="dropzone-copy">
              JPG, PNG, WEBP o GIF. Hasta 12 referencias. Cuanto más mezcladas estén, mejor sale el
              concepto.
            </span>
          </label>

          <div className="upload-grid">
            {uploads.map((item) => (
              <article className="upload-card" key={item.id}>
                <img alt={item.file.name} src={item.previewUrl} />
                <div className="upload-meta">
                  <strong>{item.file.name}</strong>
                  <span>{Math.round(item.file.size / 1024)} KB</span>
                </div>
                <button type="button" onClick={() => removeUpload(item.id)}>
                  Quitar
                </button>
              </article>
            ))}
          </div>

          <label className="notes-block">
            <span>Notas de dirección</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ej: metroidvania con cámara lateral, protagonista hacker, estética industrial..."
            />
          </label>

          <div className="action-row">
            <button className="primary-button" disabled={uploads.length === 0 || busy} onClick={() => void handleGenerate()}>
              {busy ? 'Generando prototipo...' : 'Generar videojuego'}
            </button>
            <p className="microcopy">
              Si no configuras `OPENAI_API_KEY`, la app cae en modo local de demostración para que el
              repo siga siendo arrancable.
            </p>
          </div>

          {error ? <p className="error-box">{error}</p> : null}
        </div>

        <div className="panel panel-output">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Output</span>
              <h2>Juego generado</h2>
            </div>
            {result ? (
              <span className={`hint-chip ${result.generationSource}`}>
                {result.generationSource === 'openai' ? 'OpenAI' : 'Fallback'}
              </span>
            ) : null}
          </div>

          {result ? (
            <>
              <div className="result-header">
                <div>
                  <h3>{result.blueprint.title}</h3>
                  <p>{result.blueprint.tagline}</p>
                </div>
                <div className="template-pill">{TEMPLATE_LABELS[result.blueprint.template]}</div>
              </div>

              <div className="game-frame">
                <GameCanvas blueprint={result.blueprint} />
              </div>

              <div className="insight-grid">
                <article className="insight-card">
                  <span>Fantasy</span>
                  <strong>{result.blueprint.playerFantasy}</strong>
                </article>
                <article className="insight-card">
                  <span>World</span>
                  <strong>{result.blueprint.worldSummary}</strong>
                </article>
                <article className="insight-card">
                  <span>Style</span>
                  <strong>{result.blueprint.visualStyle}</strong>
                </article>
              </div>

              <div className="two-column">
                <article className="detail-card">
                  <span className="detail-kicker">Core loop</span>
                  <ul>
                    {result.blueprint.coreLoop.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>

                <article className="detail-card">
                  <span className="detail-kicker">Mechanics</span>
                  <ul>
                    {result.blueprint.mechanicHighlights.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              </div>

              <div className="two-column">
                <article className="detail-card">
                  <span className="detail-kicker">Image insights</span>
                  <ul>
                    {result.blueprint.imageInsights.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>

                <article className="detail-card">
                  <span className="detail-kicker">Asset prompts</span>
                  <ul>
                    {result.blueprint.assetPrompts.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              </div>

              {result.warnings.length > 0 ? (
                <div className="warning-stack">
                  {result.warnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div className="empty-state">
              <h3>El prototipo aparecerá aquí</h3>
              <p>
                Cuando generes una partida, verás el canvas jugable, el template elegido, los
                momentos de nivel y los prompts de assets.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
