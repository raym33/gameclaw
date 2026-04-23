import { useEffect, useRef, useState } from 'react'

import type { GameBlueprint } from '../../shared/game'

type GameCanvasProps = {
  blueprint: GameBlueprint
}

export function GameCanvas({ blueprint }: GameCanvasProps) {
  const targetRef = useRef<HTMLDivElement | null>(null)
  const gameRef = useRef<{ destroy(removeCanvas?: boolean): void } | null>(null)
  const [runtimeError, setRuntimeError] = useState<string | null>(null)

  useEffect(() => {
    if (!targetRef.current) {
      return
    }

    let cancelled = false
    setRuntimeError(null)

    void (async () => {
      try {
        const [{ default: Phaser }, { createGameConfig }] = await Promise.all([
          import('phaser'),
          import('../game/createGame'),
        ])

        if (cancelled || !targetRef.current) {
          return
        }

        gameRef.current?.destroy(true)
        gameRef.current = new Phaser.Game(createGameConfig(targetRef.current, blueprint))
      } catch (caughtError) {
        if (!cancelled) {
          setRuntimeError(caughtError instanceof Error ? caughtError.message : 'No se pudo arrancar el runtime del juego.')
        }
      }
    })()

    return () => {
      cancelled = true
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [blueprint])

  return (
    <>
      <div className="game-shell" ref={targetRef} />
      {runtimeError ? <div className="demo-runtime-error">Error del juego: {runtimeError}</div> : null}
    </>
  )
}
