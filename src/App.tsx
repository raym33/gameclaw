import { startTransition, useEffect, useMemo, useState } from 'react'

import {
  CAMERA_LABELS,
  COMBAT_LABELS,
  MOVEMENT_LABELS,
  OBJECTIVE_LABELS,
  PHYSICS_LABELS,
  RUNTIME_LABELS,
  SPECIAL_LABELS,
  SUPPORT_LEVEL_LABELS,
  WORLD_LAYOUT_LABELS,
  deriveRuntimeProfile,
  type GenerationResult,
} from '../shared/game'
import { GameCanvas } from './components/GameCanvas'
import { requestAstralOrchardDemo, requestGeneration } from './lib/api'

type UploadItem = {
  file: File
  id: string
  previewUrl: string
}

const PROMPT_SEEDS = [
  'Sube bocetos de personajes, mapas, HUDs, sprites o fotos de libreta.',
  'Pide algo concreto o raro: runner, metroidvania, slingshot physics, ideas temporales.',
  'Gameclaw lo colapsa a un vertical slice estable en vez de inventar un proyecto roto.',
]

const EXAMPLE_NOTES = `Quiero una mezcla rara: plataformas laterales con reliquias antiguas y una habilidad de rebobinado corto cuando fallas un salto. Si pido algo estilo Angry Birds o destrucción física, quiero que el sistema cambie de runtime y use cuerpos rígidos de verdad.`

export default function App() {
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [notes, setNotes] = useState(EXAMPLE_NOTES)
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    const demo = new URLSearchParams(window.location.search).get('demo')
    if (demo !== 'astral-orchard') {
      return
    }

    let cancelled = false
    void Promise.resolve()
      .then(() => {
        if (cancelled) {
          return
        }

        setBusy(true)
        setError(null)

        return requestAstralOrchardDemo()
      })
      .then((generation) => {
        if (cancelled || !generation) {
          return
        }

        startTransition(() => {
          setResult(generation)
        })
      })
      .catch((caughtError: unknown) => {
        if (cancelled) {
          return
        }

        setError(caughtError instanceof Error ? caughtError.message : 'No se pudo cargar la demo.')
      })
      .finally(() => {
        if (!cancelled) {
          setBusy(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

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

  const systemEntries = useMemo(() => {
    if (!result) {
      return []
    }

    const { systems } = result.blueprint
    return [
      ['Camera', CAMERA_LABELS[systems.camera]],
      ['Movement', MOVEMENT_LABELS[systems.movement]],
      ['Physics', PHYSICS_LABELS[systems.physics]],
      ['Combat', COMBAT_LABELS[systems.combat]],
      ['Objective', OBJECTIVE_LABELS[systems.objective]],
      ['Layout', WORLD_LAYOUT_LABELS[systems.worldLayout]],
      ['Special', SPECIAL_LABELS[systems.specialMechanic]],
    ] as const
  }, [result])

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

  async function handleLoadDemo() {
    if (busy) {
      return
    }

    setBusy(true)
    setError(null)

    try {
      const generation = await requestAstralOrchardDemo()
      startTransition(() => {
        setResult(generation)
      })
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'No se pudo cargar la demo.')
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
          <span className="eyebrow">GAMECLAW / system-driven prototyping</span>
          <h1>De ideas raras a vertical slices estables.</h1>
          <p className="hero-lede">
            Gameclaw ya no depende de tres templates cerrados. Ahora convierte las referencias en un
            stack de sistemas jugables, decide el runtime adecuado y, si la idea es demasiado rara,
            la aproxima con honestidad en vez de prometer magia.
          </p>
          <div className="hero-list">
            {PROMPT_SEEDS.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>

        <div className="hero-stats">
          <div className="stat-card">
            <span>Arquitectura</span>
            <strong>Composable systems</strong>
          </div>
          <div className="stat-card">
            <span>Physics</span>
            <strong>Scripted + Matter runtime</strong>
          </div>
          <div className="stat-card">
            <span>Modo raro</span>
            <strong>Hybrid / approximate support</strong>
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
              JPG, PNG, WEBP o GIF. Hasta 12 referencias. Cuanta más mezcla haya entre boceto,
              sprites, UI y libreta, mejor sale la lectura del sistema.
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
              placeholder="Ej: runner con destrucción física, roguelite musical, plataforma temporal..."
            />
          </label>

          <div className="action-row">
            <button
              className="primary-button"
              disabled={uploads.length === 0 || busy}
              onClick={() => void handleGenerate()}
            >
              {busy ? 'Generando vertical slice...' : 'Generar videojuego'}
            </button>
            <button className="secondary-button" disabled={busy} onClick={() => void handleLoadDemo()}>
              Cargar demo Astral Orchard
            </button>
            <p className="microcopy">
              Gameclaw puede usar `Ollama` local o un backend `OpenAI-compatible` como `LM Studio`.
              Si ninguno responde, cae en fallback y sigue generando un slice local.
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
                {result.providerLabel}
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
                <div className="result-badges">
                  <div className="template-pill">
                    {RUNTIME_LABELS[deriveRuntimeProfile(result.blueprint.systems)]}
                  </div>
                  <div className="template-pill secondary">
                    {SUPPORT_LEVEL_LABELS[result.blueprint.supportLevel]}
                  </div>
                </div>
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
                  <span>Novelty Hook</span>
                  <strong>{result.blueprint.noveltyHook}</strong>
                </article>
              </div>

              <div className="detail-card single-card">
                <span className="detail-kicker">Approximation Strategy</span>
                <p>{result.blueprint.approximationStrategy}</p>
              </div>

              <div className="system-grid">
                {systemEntries.map(([label, value]) => (
                  <article className="system-card" key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </article>
                ))}
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
                  <span className="detail-kicker">Implementation Notes</span>
                  <ul>
                    {result.blueprint.implementationNotes.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>

                <article className="detail-card">
                  <span className="detail-kicker">Production Backlog</span>
                  <ul>
                    {result.blueprint.productionBacklog.map((item) => (
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
                Verás el runtime elegido, el stack de sistemas, el nivel de soporte y el vertical
                slice jugable.
              </p>
              <button className="secondary-button" disabled={busy} onClick={() => void handleLoadDemo()}>
                Probar Astral Orchard
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
