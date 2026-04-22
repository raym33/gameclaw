import { useEffect, useRef } from 'react'

import type { GameBlueprint } from '../../shared/game'

type GameCanvasProps = {
  blueprint: GameBlueprint
}

export function GameCanvas({ blueprint }: GameCanvasProps) {
  const targetRef = useRef<HTMLDivElement | null>(null)
  const gameRef = useRef<{ destroy(removeCanvas?: boolean): void } | null>(null)

  useEffect(() => {
    if (!targetRef.current) {
      return
    }

    let cancelled = false

    void (async () => {
      const [{ default: Phaser }, { createGameConfig }] = await Promise.all([
        import('phaser'),
        import('../game/createGame'),
      ])

      if (cancelled || !targetRef.current) {
        return
      }

      gameRef.current?.destroy(true)
      gameRef.current = new Phaser.Game(createGameConfig(targetRef.current, blueprint))
    })()

    return () => {
      cancelled = true
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [blueprint])

  return <div className="game-shell" ref={targetRef} />
}
