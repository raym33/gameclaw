import Phaser from 'phaser'

import { RUNTIME_LABELS, type GameBlueprint, type RuntimeProfile } from '../../shared/game'
import type { RuntimeSceneTemplate } from './runtimeTemplates'

export type RuntimeHudElements = {
  statusText: Phaser.GameObjects.Text
  objectiveText: Phaser.GameObjects.Text
  supportText: Phaser.GameObjects.Text
}

export type RuntimePlayerElements = {
  player: Phaser.GameObjects.Shape
  halfWidth: number
  halfHeight: number
}

export function createRuntimeHud(
  scene: Phaser.Scene,
  template: RuntimeSceneTemplate,
  blueprint: GameBlueprint,
  runtimeProfile: RuntimeProfile,
  gameHeight: number,
): RuntimeHudElements {
  const hud = template.hud

  scene.add
    .rectangle(20, 18, hud.panelWidth, hud.panelHeight, 0x081014, 0.5)
    .setOrigin(0, 0)
    .setDepth(28)
    .setStrokeStyle(1, parseColor(blueprint.palette.accentAlt), 0.12)

  scene.add
    .text(28, 24, blueprint.title.toUpperCase(), {
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: hud.titleFontSize,
      color: blueprint.palette.accent,
    })
    .setAlpha(0.95)
    .setDepth(30)

  const statusText = scene.add.text(28, 50, '', {
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: hud.statusFontSize,
    color: blueprint.palette.text,
  })
  statusText.setDepth(30)

  const objectiveText = scene.add.text(28, 84, '', {
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: hud.objectiveFontSize,
    color: '#d7d0c5',
    wordWrap: { width: hud.objectiveWrapWidth },
  })
  objectiveText.setDepth(30)

  const supportText = scene.add.text(28, gameHeight - 26, '', {
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: '11px',
    color: blueprint.palette.accentAlt,
  })
  supportText.setDepth(30)
  supportText.setText(resolveHudSupportText(template, blueprint, runtimeProfile))

  return {
    statusText,
    objectiveText,
    supportText,
  }
}

export function createRuntimePlayer(
  scene: Phaser.Scene,
  template: RuntimeSceneTemplate,
  blueprint: GameBlueprint,
): RuntimePlayerElements | null {
  const playerPreset = template.player
  if (!playerPreset) {
    return null
  }

  if (playerPreset.shape === 'rectangle') {
    const player = scene.add.rectangle(
      playerPreset.spawn.x,
      playerPreset.spawn.y,
      playerPreset.width,
      playerPreset.height,
      parseColor(blueprint.palette.accent),
    )
    player.setStrokeStyle(3, parseColor(blueprint.palette.text), 0.8)

    return {
      player,
      halfWidth: playerPreset.width / 2,
      halfHeight: playerPreset.height / 2,
    }
  }

  const player = scene.add.circle(
    playerPreset.spawn.x,
    playerPreset.spawn.y,
    playerPreset.radius,
    parseColor(blueprint.palette.accent),
  )
  player.setStrokeStyle(3, parseColor(blueprint.palette.text), 0.8)

  return {
    player,
    halfWidth: playerPreset.radius,
    halfHeight: playerPreset.radius,
  }
}

export function createRuntimeFinishOverlay(
  scene: Phaser.Scene,
  template: RuntimeSceneTemplate,
  palette: GameBlueprint['palette'],
  won: boolean,
  summary: string,
  gameWidth: number,
  gameHeight: number,
): void {
  const overlayDepth = 40

  scene.add
    .rectangle(gameWidth / 2, gameHeight / 2, 460, 140, parseColor(palette.surface), 0.92)
    .setStrokeStyle(2, parseColor(won ? palette.accentAlt : palette.danger), 0.95)
    .setDepth(overlayDepth)

  scene.add
    .text(gameWidth / 2, gameHeight / 2 - 24, won ? template.finishOverlay.winTitle : template.finishOverlay.loseTitle, {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '28px',
      color: palette.text,
    })
    .setOrigin(0.5)
    .setDepth(overlayDepth + 1)

  scene.add
    .text(gameWidth / 2, gameHeight / 2 + 22, summary, {
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: '13px',
      color: '#d7d0c5',
      align: 'center',
      wordWrap: { width: 380 },
    })
    .setOrigin(0.5)
    .setDepth(overlayDepth + 1)
}

export function resolveFinishStatus(template: RuntimeSceneTemplate, won: boolean): string {
  return won ? template.finishOverlay.winStatus : template.finishOverlay.loseStatus
}

function resolveHudSupportText(
  template: RuntimeSceneTemplate,
  blueprint: GameBlueprint,
  runtimeProfile: RuntimeProfile,
): string {
  if (template.hud.supportMode === 'restart-fullscreen') {
    return template.hud.restartText ?? 'R reinicia la run · F alterna pantalla completa'
  }

  return `${RUNTIME_LABELS[runtimeProfile]} / ${blueprint.supportLevel.toUpperCase()} / ${blueprint.noveltyHook}`
}

function parseColor(color: string): number {
  return Number.parseInt(color.replace('#', ''), 16)
}
