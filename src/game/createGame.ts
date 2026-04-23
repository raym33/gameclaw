import Phaser from 'phaser'
import astralBackgroundUrl from '../assets/astral-orchard/background-concept.png'
import astralBrassBeamUrl from '../assets/astral-orchard/brass-beam.png'
import astralGlassPillarUrl from '../assets/astral-orchard/glass-pillar.png'
import astralOrbitCoreUrl from '../assets/astral-orchard/orbit-core.png'
import astralOriginalSpriteSheetUrl from '../assets/astral-orchard/original-sprite-sheet.png'
import astralStarSeedUrl from '../assets/astral-orchard/star-seed.png'
import astralWoodBeamUrl from '../assets/astral-orchard/wood-beam.png'
import astralWoodSupportUrl from '../assets/astral-orchard/wood-support.png'

import {
  RUNTIME_LABELS,
  deriveRuntimeProfile,
  type GameBlueprint,
  type GamePalette,
  type RuntimeProfile,
} from '../../shared/game'

const GAME_WIDTH = 960
const GAME_HEIGHT = 540

type ShapeObject = Phaser.GameObjects.Shape

type MovingShape = {
  shape: ShapeObject
  vx: number
  vy: number
  minX?: number
  maxX?: number
}

type LaneObject = MovingShape & {
  kind: 'hazard' | 'pickup'
}

type PlatformData = {
  shape: Phaser.GameObjects.Rectangle
  x: number
  y: number
  width: number
  height: number
}

type MatterShape = ShapeObject & {
  body: MatterJS.BodyType
  art?: Phaser.GameObjects.Image
  shadow?: Phaser.GameObjects.Ellipse
  glow?: Phaser.GameObjects.Shape
}

const ASTRAL_TEXTURES = {
  background: 'astral-bg',
  spriteSheet: 'astral-original-sprite-sheet',
  projectile: 'astral-projectile',
  target: 'astral-target',
  woodBeam: 'astral-wood-beam',
  woodSupport: 'astral-wood-support',
  glassPillar: 'astral-glass-pillar',
  brassBeam: 'astral-brass-beam',
} as const

const ASTRAL_CUTOUT_TEXTURES = {
  projectile: 'astral-projectile-cutout',
  target: 'astral-target-cutout',
  woodBeam: 'astral-wood-beam-cutout',
  woodSupport: 'astral-wood-support-cutout',
  glassPillar: 'astral-glass-pillar-cutout',
  brassBeam: 'astral-brass-beam-cutout',
} as const

const ASTRAL_HERO_SPRITES = {
  idle: 'astral-hero-sprite-idle',
  walk: 'astral-hero-sprite-walk',
  pull: 'astral-hero-sprite-pull',
  release: 'astral-hero-sprite-release',
} as const

type AstralHeroPose = keyof typeof ASTRAL_HERO_SPRITES

const ASTRAL_HERO_SOURCE_RECTS: Record<AstralHeroPose, TextureCrop> = {
  idle: { x: 54, y: 86, width: 242, height: 346 },
  walk: { x: 362, y: 106, width: 220, height: 336 },
  pull: { x: 842, y: 146, width: 302, height: 286 },
  release: { x: 1138, y: 150, width: 350, height: 282 },
}

const ASTRAL_HERO_DISPLAY: Record<AstralHeroPose, { width: number; height: number; originX: number }> = {
  idle: { width: 94, height: 134, originX: 0.5 },
  walk: { width: 90, height: 132, originX: 0.48 },
  pull: { width: 168, height: 126, originX: 0.34 },
  release: { width: 196, height: 124, originX: 0.34 },
}

type TextureCrop = {
  x: number
  y: number
  width: number
  height: number
}

type SlingshotMaterial = 'wood' | 'glass' | 'brass'

type SlingshotBlock = {
  shape: MatterShape
  material: SlingshotMaterial
  integrity: number
  maxIntegrity: number
  fractureLevel: number
  lastImpactAt: number
  collapseLeft: number
  collapseRight: number
  collapseBottom: number
}

type SlingshotTarget = {
  shape: MatterShape
  integrity: number
  maxIntegrity: number
  lastImpactAt: number
}

type SlingshotBlockDefinition = {
  x: number
  y: number
  width: number
  height: number
  material: SlingshotMaterial
}

type SlingshotTargetDefinition = {
  x: number
  y: number
  radius?: number
  integrity?: number
}

type SlingshotLevel = {
  name: string
  shots: number
  note: string
  blocks: SlingshotBlockDefinition[]
  targets: SlingshotTargetDefinition[]
}

type SlingshotState = {
  anchor: { x: number; y: number }
  dragGuide: Phaser.GameObjects.Graphics
  projectile: MatterShape | null
  projectileLaunched: boolean
  dragging: boolean
  shotsRemaining: number
  blocks: SlingshotBlock[]
  targets: SlingshotTarget[]
  lastReleaseAt: number
  levelIndex: number
  levels: SlingshotLevel[]
  transitioning: boolean
  levelBadge: Phaser.GameObjects.Text
  controlHint: Phaser.GameObjects.Text
  heroSprite?: Phaser.GameObjects.Image
  heroPose: AstralHeroPose
  heroBase: { x: number; y: number }
  elasticSnap: { startedAt: number; pullX: number; pullY: number } | null
  lastTrailAt: number
  lastStepAt: number
}

const SLINGSHOT_MATERIAL_STATS: Record<
  SlingshotMaterial,
  { density: number; integrity: number; damageScale: number; particleColor: string }
> = {
  wood: { density: 0.0016, integrity: 7.2, damageScale: 0.72, particleColor: '#f3bf63' },
  glass: { density: 0.0011, integrity: 4.8, damageScale: 1.35, particleColor: '#82d8d0' },
  brass: { density: 0.0028, integrity: 11.8, damageScale: 0.42, particleColor: '#f0a949' },
}

const SLINGSHOT_LEVELS: SlingshotLevel[] = [
  {
    name: 'Lantern Nursery',
    shots: 5,
    note: 'Open the glass canopy and release the first orbit cores.',
    blocks: [
      { x: 650, y: GAME_HEIGHT - 96, width: 64, height: 24, material: 'wood' },
      { x: 720, y: GAME_HEIGHT - 96, width: 64, height: 24, material: 'wood' },
      { x: 650, y: GAME_HEIGHT - 134, width: 22, height: 68, material: 'glass' },
      { x: 720, y: GAME_HEIGHT - 134, width: 22, height: 68, material: 'glass' },
      { x: 685, y: GAME_HEIGHT - 178, width: 118, height: 20, material: 'brass' },
      { x: 756, y: GAME_HEIGHT - 166, width: 26, height: 110, material: 'wood' },
    ],
    targets: [
      { x: 682, y: GAME_HEIGHT - 210, integrity: 3.7 },
      { x: 725, y: GAME_HEIGHT - 210, integrity: 3.7 },
    ],
  },
  {
    name: 'Observatory Bridge',
    shots: 4,
    note: 'Kick the support legs and let the bridge twist itself apart.',
    blocks: [
      { x: 618, y: GAME_HEIGHT - 100, width: 72, height: 22, material: 'glass' },
      { x: 706, y: GAME_HEIGHT - 100, width: 72, height: 22, material: 'glass' },
      { x: 794, y: GAME_HEIGHT - 100, width: 72, height: 22, material: 'glass' },
      { x: 650, y: GAME_HEIGHT - 144, width: 22, height: 86, material: 'wood' },
      { x: 734, y: GAME_HEIGHT - 144, width: 22, height: 86, material: 'wood' },
      { x: 696, y: GAME_HEIGHT - 188, width: 134, height: 20, material: 'brass' },
      { x: 776, y: GAME_HEIGHT - 164, width: 22, height: 112, material: 'wood' },
      { x: 610, y: GAME_HEIGHT - 162, width: 22, height: 112, material: 'wood' },
    ],
    targets: [
      { x: 698, y: GAME_HEIGHT - 218, integrity: 4.2 },
      { x: 775, y: GAME_HEIGHT - 130, integrity: 4.8 },
    ],
  },
  {
    name: 'Celestial Harvest',
    shots: 5,
    note: 'The brass cage is tougher. Create a chain reaction instead of brute force.',
    blocks: [
      { x: 650, y: GAME_HEIGHT - 94, width: 70, height: 22, material: 'brass' },
      { x: 728, y: GAME_HEIGHT - 94, width: 70, height: 22, material: 'brass' },
      { x: 806, y: GAME_HEIGHT - 94, width: 70, height: 22, material: 'brass' },
      { x: 686, y: GAME_HEIGHT - 138, width: 24, height: 82, material: 'glass' },
      { x: 770, y: GAME_HEIGHT - 138, width: 24, height: 82, material: 'glass' },
      { x: 728, y: GAME_HEIGHT - 182, width: 158, height: 20, material: 'wood' },
      { x: 728, y: GAME_HEIGHT - 228, width: 24, height: 72, material: 'brass' },
      { x: 688, y: GAME_HEIGHT - 266, width: 118, height: 18, material: 'glass' },
      { x: 808, y: GAME_HEIGHT - 218, width: 22, height: 104, material: 'wood' },
    ],
    targets: [
      { x: 690, y: GAME_HEIGHT - 292, integrity: 3.9 },
      { x: 770, y: GAME_HEIGHT - 202, integrity: 5.1 },
      { x: 812, y: GAME_HEIGHT - 250, integrity: 4.9 },
    ],
  },
]

export function createGameConfig(
  target: HTMLDivElement,
  blueprint: GameBlueprint,
): Phaser.Types.Core.GameConfig {
  const runtimeProfile = deriveRuntimeProfile(blueprint.systems)

  return {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: target,
    backgroundColor: blueprint.palette.bg,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics:
      runtimeProfile === 'slingshot-destruction'
        ? {
            default: 'matter',
            matter: {
              gravity: { x: 0, y: blueprint.physics.gravity },
            },
          }
        : undefined,
    scene: new GeneratedGameScene(blueprint, runtimeProfile),
  }
}

class GeneratedGameScene extends Phaser.Scene {
  private readonly blueprint: GameBlueprint
  private readonly runtimeProfile: RuntimeProfile
  private keys?: Record<string, Phaser.Input.Keyboard.Key>
  private player?: ShapeObject
  private playerHalfWidth = 14
  private playerHalfHeight = 14
  private readonly playerVelocity = new Phaser.Math.Vector2()
  private readonly playerHistory: Array<{ x: number; y: number }> = []
  private readonly enemies: MovingShape[] = []
  private readonly projectiles: MovingShape[] = []
  private readonly shards: MovingShape[] = []
  private readonly laneObjects: LaneObject[] = []
  private readonly platforms: PlatformData[] = []
  private slingshot?: SlingshotState
  private statusText!: Phaser.GameObjects.Text
  private objectiveText!: Phaser.GameObjects.Text
  private supportText!: Phaser.GameObjects.Text
  private health = 100
  private score = 0
  private timeLeft = 0
  private combo = 1
  private comboTimer = 0
  private burstCooldown = 0
  private spawnAccumulator = 0
  private shotAccumulator = 0
  private laneSwitchCooldown = 0
  private laneIndex = 1
  private relicsRemaining = 0
  private onGround = false
  private facing = 1
  private gameEnded = false

  constructor(blueprint: GameBlueprint, runtimeProfile: RuntimeProfile) {
    super('generated-game')
    this.blueprint = blueprint
    this.runtimeProfile = runtimeProfile
  }

  preload(): void {
    if (this.runtimeProfile !== 'slingshot-destruction') {
      return
    }

    this.load.image(ASTRAL_TEXTURES.background, astralBackgroundUrl)
    this.load.image(ASTRAL_TEXTURES.spriteSheet, astralOriginalSpriteSheetUrl)
    this.load.image(ASTRAL_TEXTURES.projectile, astralStarSeedUrl)
    this.load.image(ASTRAL_TEXTURES.target, astralOrbitCoreUrl)
    this.load.image(ASTRAL_TEXTURES.woodBeam, astralWoodBeamUrl)
    this.load.image(ASTRAL_TEXTURES.woodSupport, astralWoodSupportUrl)
    this.load.image(ASTRAL_TEXTURES.glassPillar, astralGlassPillarUrl)
    this.load.image(ASTRAL_TEXTURES.brassBeam, astralBrassBeamUrl)
  }

  create(): void {
    this.resetSessionState()
    this.timeLeft = defaultTimerForProfile(this.runtimeProfile)

    this.prepareAstralCutoutTextures()
    this.drawBackdrop(this.blueprint.palette)
    this.createHud()
    this.createControls()

    if (this.runtimeProfile !== 'slingshot-destruction') {
      this.createPlayer()
    }

    switch (this.runtimeProfile) {
      case 'slingshot-destruction':
        this.createSlingshotDestruction()
        break
      case 'platformer-expedition':
        this.createPlatformerExpedition()
        break
      case 'lane-runner':
        this.createLaneRunner()
        break
      case 'relic-hunt':
        this.createRelicHunt()
        break
      default:
        this.createArenaSurvivor()
        break
    }

    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.gameEnded || this.timeLeft <= 0) {
          return
        }

        this.timeLeft -= 1
        this.refreshHud()

        if (this.timeLeft <= 0) {
          if (this.runtimeProfile === 'platformer-expedition') {
            this.finishGame(this.relicsRemaining <= 0, this.blueprint.loseCondition)
            return
          }

          this.finishGame(true, this.blueprint.winCondition)
        }
      },
    })

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointerdown', this.handlePointerDown, this)
      this.input.off('pointermove', this.handlePointerMove, this)
      this.input.off('pointerup', this.handlePointerUp, this)
      if (this.runtimeProfile === 'slingshot-destruction') {
        this.matter.world.off('collisionstart', this.handleSlingshotCollision, this)
      }
    })
  }

  update(_time: number, deltaMs: number): void {
    this.handleGlobalShortcuts()

    if (this.gameEnded) {
      return
    }

    const delta = deltaMs / 1000
    this.spawnAccumulator += delta
    this.shotAccumulator += delta
    this.burstCooldown = Math.max(0, this.burstCooldown - delta)
    this.laneSwitchCooldown = Math.max(0, this.laneSwitchCooldown - delta)

    if (this.comboTimer > 0) {
      this.comboTimer = Math.max(0, this.comboTimer - delta)
      if (this.comboTimer === 0) {
        this.combo = 1
      }
    }

    if (this.runtimeProfile !== 'slingshot-destruction' && this.player) {
      this.recordPlayerHistory()
      this.handleSpecialInput()
    }

    switch (this.runtimeProfile) {
      case 'slingshot-destruction':
        this.updateSlingshotDestruction()
        break
      case 'platformer-expedition':
        this.updatePlatformerExpedition(delta)
        break
      case 'lane-runner':
        this.updateLaneRunner(delta)
        break
      case 'relic-hunt':
        this.updateRelicHunt(delta)
        break
      default:
        this.updateArenaSurvivor(delta)
        break
    }

    this.refreshHud()
  }

  private createControls(): void {
    const keyboard = this.input.keyboard
    if (!keyboard) {
      return
    }

    this.keys = keyboard.addKeys(
      'W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,SHIFT,R,F',
    ) as Record<string, Phaser.Input.Keyboard.Key>
  }

  private resetSessionState(): void {
    this.player = undefined
    this.playerVelocity.set(0, 0)
    this.playerHistory.length = 0
    this.enemies.length = 0
    this.projectiles.length = 0
    this.shards.length = 0
    this.laneObjects.length = 0
    this.platforms.length = 0
    this.slingshot = undefined
    this.health = 100
    this.score = 0
    this.combo = 1
    this.comboTimer = 0
    this.burstCooldown = 0
    this.spawnAccumulator = 0
    this.shotAccumulator = 0
    this.laneSwitchCooldown = 0
    this.laneIndex = 1
    this.relicsRemaining = 0
    this.onGround = false
    this.facing = 1
    this.gameEnded = false
  }

  private handleGlobalShortcuts(): void {
    if (!this.keys) {
      return
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.F)) {
      const fullscreenTarget = document.documentElement
      if (!document.fullscreenElement) {
        void fullscreenTarget.requestFullscreen?.()
      } else {
        void document.exitFullscreen?.()
      }
    }

    if (this.gameEnded && Phaser.Input.Keyboard.JustDown(this.keys.R)) {
      this.scene.restart()
    }
  }

  private createHud(): void {
    this.add
      .rectangle(20, 18, this.runtimeProfile === 'slingshot-destruction' ? 398 : 470, 100, 0x081014, 0.5)
      .setOrigin(0, 0)
      .setDepth(28)
      .setStrokeStyle(1, parseColor(this.blueprint.palette.accentAlt), 0.12)

    this.add
      .text(28, 24, this.blueprint.title.toUpperCase(), {
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: '13px',
        color: this.blueprint.palette.accent,
      })
      .setAlpha(0.95)
      .setDepth(30)

    this.statusText = this.add.text(28, 50, '', {
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: this.runtimeProfile === 'slingshot-destruction' ? '13px' : '15px',
      color: this.blueprint.palette.text,
    })
    this.statusText.setDepth(30)

    this.objectiveText = this.add.text(28, 84, '', {
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: this.runtimeProfile === 'slingshot-destruction' ? '10px' : '12px',
      color: '#d7d0c5',
      wordWrap: { width: this.runtimeProfile === 'slingshot-destruction' ? 346 : 440 },
    })
    this.objectiveText.setDepth(30)

    this.supportText = this.add.text(28, GAME_HEIGHT - 26, '', {
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: '11px',
      color: this.blueprint.palette.accentAlt,
    })
    this.supportText.setDepth(30)
    this.supportText.setText(
      this.runtimeProfile === 'slingshot-destruction'
        ? 'R reinicia la run · F alterna pantalla completa'
        : `${RUNTIME_LABELS[this.runtimeProfile]} / ${this.blueprint.supportLevel.toUpperCase()} / ${this.blueprint.noveltyHook}`,
    )
  }

  private drawBackdrop(palette: GamePalette): void {
    if (this.runtimeProfile === 'slingshot-destruction') {
      this.drawAstralBackdrop(palette)
      return
    }

    const graphics = this.add.graphics()
    graphics.fillStyle(parseColor(palette.bg), 1)
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    graphics.fillStyle(parseColor(palette.surface), 0.45)
    for (let i = 0; i < 9; i += 1) {
      graphics.fillRoundedRect(70 + i * 90, 40 + (i % 2) * 36, 120, 340, 18)
    }

    graphics.lineStyle(1, parseColor(palette.accentAlt), 0.12)
    for (let x = 0; x <= GAME_WIDTH; x += 48) {
      graphics.lineBetween(x, 0, x, GAME_HEIGHT)
    }
    for (let y = 0; y <= GAME_HEIGHT; y += 48) {
      graphics.lineBetween(0, y, GAME_WIDTH, y)
    }

    if (this.runtimeProfile === 'platformer-expedition' || this.runtimeProfile === 'slingshot-destruction') {
      graphics.fillStyle(parseColor(palette.surface), 0.8)
      graphics.fillRect(0, GAME_HEIGHT - 72, GAME_WIDTH, 72)
      graphics.lineStyle(3, parseColor(palette.accent), 0.25)
      graphics.lineBetween(0, GAME_HEIGHT - 72, GAME_WIDTH, GAME_HEIGHT - 72)
    }
  }

  private drawAstralBackdrop(palette: GamePalette): void {
    if (this.textures.exists(ASTRAL_TEXTURES.background)) {
      const image = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, ASTRAL_TEXTURES.background).setDepth(-60)
      const scale = Math.max(GAME_WIDTH / image.width, GAME_HEIGHT / image.height)
      image.setScale(scale)
    }

    const atmosphere = this.add.graphics().setDepth(-50)
    atmosphere.fillStyle(parseColor('#031016'), 0.16)
    atmosphere.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    atmosphere.fillStyle(parseColor(palette.bg), 0.18)
    atmosphere.fillRect(0, 0, GAME_WIDTH, 120)
    atmosphere.fillStyle(parseColor('#020507'), 0.32)
    atmosphere.fillRect(0, GAME_HEIGHT - 74, GAME_WIDTH, 74)

    atmosphere.fillStyle(parseColor(palette.accentAlt), 0.1)
    atmosphere.fillCircle(516, 128, 96)
    atmosphere.fillStyle(parseColor(palette.accent), 0.11)
    atmosphere.fillCircle(82, 430, 54)
    atmosphere.fillCircle(868, 428, 72)

    for (let i = 0; i < 26; i += 1) {
      const x = 70 + ((i * 157) % 840)
      const y = 36 + ((i * 71) % 210)
      const radius = 0.8 + (i % 3) * 0.45
      atmosphere.fillStyle(parseColor(i % 4 === 0 ? palette.accent : '#f7f1e8'), 0.34 + (i % 5) * 0.05)
      atmosphere.fillCircle(x, y, radius)
    }

    const foreground = this.add.graphics().setDepth(2)
    foreground.fillStyle(parseColor('#061017'), 0.5)
    foreground.fillEllipse(150, GAME_HEIGHT - 28, 460, 84)
    foreground.fillEllipse(774, GAME_HEIGHT - 22, 530, 88)
    foreground.lineStyle(2, parseColor(palette.accent), 0.24)
    foreground.lineBetween(0, GAME_HEIGHT - 73, GAME_WIDTH, GAME_HEIGHT - 73)
  }

  private createPlayer(): void {
    if (this.runtimeProfile === 'platformer-expedition') {
      const player = this.add.rectangle(120, GAME_HEIGHT - 120, 26, 32, parseColor(this.blueprint.palette.accent))
      player.setStrokeStyle(3, parseColor(this.blueprint.palette.text), 0.8)
      this.player = player
      this.playerHalfWidth = 13
      this.playerHalfHeight = 16
      return
    }

    const player = this.add.circle(
      GAME_WIDTH * 0.5,
      GAME_HEIGHT * 0.6,
      14,
      parseColor(this.blueprint.palette.accent),
    )
    player.setStrokeStyle(3, parseColor(this.blueprint.palette.text), 0.8)
    this.player = player
    this.playerHalfWidth = 14
    this.playerHalfHeight = 14
  }

  private createArenaSurvivor(): void {
    this.objectiveText.setText([
      `${this.blueprint.hero.name}: ${this.blueprint.hero.abilities.join(' • ')}`,
      this.blueprint.winCondition,
    ])
  }

  private updateArenaSurvivor(delta: number): void {
    this.movePlayerFree(delta)

    if (this.spawnAccumulator >= 1.05) {
      this.spawnAccumulator = 0
      this.spawnEnemyAtEdge(72 + Math.min(this.score * 1.2, 100))
    }

    this.handleCombatInput()
    this.updateProjectiles(delta)
    this.updateChasingEnemies(delta, 0.95)
    this.collectNearbyShards(18, 5)
  }

  private createLaneRunner(): void {
    if (!this.player) {
      return
    }

    this.player.setPosition(GAME_WIDTH * 0.5, GAME_HEIGHT - 90)
    this.objectiveText.setText([
      `${this.blueprint.hero.name}: ${this.blueprint.noveltyHook}`,
      this.blueprint.winCondition,
    ])
  }

  private updateLaneRunner(delta: number): void {
    if (!this.player || !this.keys) {
      return
    }

    const lanes = [GAME_WIDTH * 0.32, GAME_WIDTH * 0.5, GAME_WIDTH * 0.68]

    if (this.laneSwitchCooldown <= 0 && Phaser.Input.Keyboard.JustDown(this.keys.LEFT)) {
      this.laneIndex = Math.max(0, this.laneIndex - 1)
      this.laneSwitchCooldown = 0.12
    }
    if (this.laneSwitchCooldown <= 0 && Phaser.Input.Keyboard.JustDown(this.keys.RIGHT)) {
      this.laneIndex = Math.min(2, this.laneIndex + 1)
      this.laneSwitchCooldown = 0.12
    }

    this.player.x = Phaser.Math.Linear(this.player.x, lanes[this.laneIndex], 0.24)

    if (this.spawnAccumulator >= 0.55) {
      this.spawnAccumulator = 0
      this.spawnLaneWave()
    }

    const moveSpeed = 290 + this.score * 1.4
    for (const item of [...this.laneObjects]) {
      item.shape.y += moveSpeed * delta

      if (item.shape.y > GAME_HEIGHT + 40) {
        this.removeLaneObject(item)
        continue
      }

      if (Phaser.Math.Distance.Between(item.shape.x, item.shape.y, this.player.x, this.player.y) < 28) {
        if (item.kind === 'pickup') {
          this.addScore(3)
          this.bumpCombo()
          this.cameras.main.flash(120, 102, 210, 199, false)
        } else {
          this.health -= 18
          this.combo = 1
          this.comboTimer = 0
          this.cameras.main.shake(90, 0.005)
        }
        this.removeLaneObject(item)
      }
    }

    if (this.health <= 0) {
      this.finishGame(false, this.blueprint.loseCondition)
    }
  }

  private createRelicHunt(): void {
    this.objectiveText.setText([
      `${this.blueprint.hero.name}: ${this.blueprint.noveltyHook}`,
      this.blueprint.winCondition,
    ])

    for (let i = 0; i < 8; i += 1) {
      const relic = this.add.circle(
        Phaser.Math.Between(100, GAME_WIDTH - 100),
        Phaser.Math.Between(120, GAME_HEIGHT - 80),
        8,
        parseColor(this.blueprint.palette.accentAlt),
      )
      relic.setStrokeStyle(2, parseColor(this.blueprint.palette.text), 0.7)
      this.shards.push({ shape: relic, vx: 0, vy: 0 })
    }

    this.relicsRemaining = this.shards.length
  }

  private updateRelicHunt(delta: number): void {
    this.movePlayerFree(delta)

    if (this.spawnAccumulator >= 1.35 && this.enemies.length < 10) {
      this.spawnAccumulator = 0
      this.spawnEnemyAtEdge(96)
    }

    this.handleCombatInput()
    this.updateProjectiles(delta)
    this.updateChasingEnemies(delta, 0.8)

    for (const relic of [...this.shards]) {
      if (!this.player) {
        continue
      }

      if (Phaser.Math.Distance.Between(relic.shape.x, relic.shape.y, this.player.x, this.player.y) < 24) {
        relic.shape.destroy()
        this.shards.splice(this.shards.indexOf(relic), 1)
        this.relicsRemaining -= 1
        this.addScore(8)
        this.bumpCombo()
        this.cameras.main.flash(160, 243, 185, 95, false)
      }
    }

    if (this.health <= 0) {
      this.finishGame(false, this.blueprint.loseCondition)
      return
    }

    if (this.relicsRemaining <= 0) {
      this.finishGame(true, this.blueprint.winCondition)
    }
  }

  private createPlatformerExpedition(): void {
    if (!this.player) {
      return
    }

    this.player.setPosition(120, GAME_HEIGHT - 118)
    this.objectiveText.setText([
      `${this.blueprint.hero.name}: ${this.blueprint.noveltyHook}`,
      this.blueprint.winCondition,
    ])

    this.addPlatform(GAME_WIDTH / 2, GAME_HEIGHT - 36, GAME_WIDTH, 72)
    this.addPlatform(190, 380, 180, 18)
    this.addPlatform(430, 320, 160, 18)
    this.addPlatform(650, 270, 180, 18)
    this.addPlatform(840, 210, 160, 18)

    this.spawnRelic(190, 350)
    this.spawnRelic(430, 290)
    this.spawnRelic(650, 240)
    this.spawnRelic(840, 180)
    this.relicsRemaining = this.shards.length

    this.spawnPatroller(310, GAME_HEIGHT - 94, 220, 440)
    this.spawnPatroller(620, GAME_HEIGHT - 94, 520, 780)
    this.spawnPatroller(700, 236, 580, 860)
  }

  private updatePlatformerExpedition(delta: number): void {
    this.movePlayerPlatformer(delta)
    this.handleCombatInput()
    this.updateProjectiles(delta)
    this.updatePatrolEnemies(delta)

    for (const relic of [...this.shards]) {
      if (!this.player) {
        continue
      }

      if (aabbOverlap(this.player, this.playerHalfWidth, this.playerHalfHeight, relic.shape, 12, 12)) {
        relic.shape.destroy()
        this.shards.splice(this.shards.indexOf(relic), 1)
        this.relicsRemaining -= 1
        this.addScore(10)
        this.bumpCombo()
        this.cameras.main.flash(160, 243, 185, 95, false)
      }
    }

    if (this.health <= 0) {
      this.finishGame(false, this.blueprint.loseCondition)
      return
    }

    if (this.relicsRemaining <= 0) {
      this.finishGame(true, this.blueprint.winCondition)
    }
  }

  private createSlingshotDestruction(): void {
    this.slingshot = {
      anchor: { x: 140, y: GAME_HEIGHT - 120 },
      dragGuide: this.add.graphics(),
      projectile: null,
      projectileLaunched: false,
      dragging: false,
      shotsRemaining: 0,
      blocks: [],
      targets: [],
      lastReleaseAt: 0,
      levelIndex: 0,
      levels: SLINGSHOT_LEVELS,
      transitioning: false,
      heroBase: { x: 156, y: GAME_HEIGHT - 70 },
      heroPose: 'idle',
      elasticSnap: null,
      lastTrailAt: 0,
      lastStepAt: 0,
      levelBadge: this.add
        .text(GAME_WIDTH - 28, 24, '', {
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: '12px',
          color: this.blueprint.palette.accentAlt,
        })
        .setOrigin(1, 0)
        .setDepth(30),
      controlHint: this.add
        .text(
          28,
          GAME_HEIGHT - 56,
          'Arrastra hacia atrás, apunta con la trayectoria y suelta. WASD/flechas ajustan tensión, ESPACIO dispara.',
          {
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: '11px',
            color: this.blueprint.palette.accentAlt,
            wordWrap: { width: 620 },
          },
        )
        .setDepth(30),
    }

    this.matter.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT)
    const ground = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 36, GAME_WIDTH, 72, parseColor(this.blueprint.palette.surface))
    ground.setAlpha(0.01)
    const groundBody = this.matter.add.gameObject(ground, { isStatic: true }) as MatterShape
    groundBody.body.label = 'gameclaw-ground'
    const launcher = this.add.rectangle(120, GAME_HEIGHT - 105, 18, 72, parseColor(this.blueprint.palette.accent))
    launcher.setAlpha(0.01)
    const launcherBody = this.matter.add.gameObject(launcher, { isStatic: true }) as MatterShape
    launcherBody.body.label = 'gameclaw-launcher'

    this.drawSlingshotFrame()
    this.slingshot.heroSprite = this.createSlingshotHeroSprite(this.slingshot.heroBase.x, this.slingshot.heroBase.y)

    this.loadSlingshotLevel(0)
    this.refreshDragGuide()

    this.input.on('pointerdown', this.handlePointerDown, this)
    this.input.on('pointermove', this.handlePointerMove, this)
    this.input.on('pointerup', this.handlePointerUp, this)
    this.matter.world.on('collisionstart', this.handleSlingshotCollision, this)
  }

  private updateSlingshotDestruction(): void {
    if (!this.slingshot) {
      return
    }

    this.updateSlingshotKeyboardAim()
    this.syncSlingshotArt()
    this.syncSlingshotHero()
    this.refreshDragGuide()
    this.updateMatterTargets()
    this.updateMatterBlocks()
    this.updateFloatingShards()

    if (this.slingshot.targets.length === 0 && !this.slingshot.transitioning) {
      this.advanceSlingshotLevel()
      return
    }

    const projectile = this.slingshot.projectile
    if (projectile && this.slingshot.projectileLaunched && !this.slingshot.dragging) {
      const rested = projectile.body.speed < 0.2 && this.time.now - this.slingshot.lastReleaseAt > 1100
      const lost =
        projectile.x > GAME_WIDTH + 120 ||
        projectile.x < -120 ||
        projectile.y > GAME_HEIGHT + 120 ||
        projectile.y < -120

      if (rested || lost) {
        projectile.art?.destroy()
        projectile.shadow?.destroy()
        projectile.destroy()
        this.slingshot.projectile = null
        this.slingshot.projectileLaunched = false

        if (this.slingshot.shotsRemaining > 0 && this.slingshot.targets.length > 0) {
          this.time.delayedCall(350, () => {
            if (!this.gameEnded && this.slingshot && this.slingshot.targets.length > 0) {
              this.spawnSlingshotProjectile()
            }
          })
        } else if (this.slingshot.targets.length > 0) {
          this.finishGame(false, this.blueprint.loseCondition)
        }
      }
    }
  }

  private movePlayerFree(delta: number): void {
    if (!this.player || !this.keys) {
      return
    }

    let vx = 0
    let vy = 0
    const speed = 230

    if (this.keys.W.isDown || this.keys.UP.isDown) vy -= 1
    if (this.keys.S.isDown || this.keys.DOWN.isDown) vy += 1
    if (this.keys.A.isDown || this.keys.LEFT.isDown) vx -= 1
    if (this.keys.D.isDown || this.keys.RIGHT.isDown) vx += 1

    if (vx !== 0) {
      this.facing = vx < 0 ? -1 : 1
    }

    const vector = new Phaser.Math.Vector2(vx, vy).normalize().scale(speed * delta)
    this.player.x = Phaser.Math.Clamp(this.player.x + vector.x, 40, GAME_WIDTH - 40)
    this.player.y = Phaser.Math.Clamp(this.player.y + vector.y, 80, GAME_HEIGHT - 48)
  }

  private movePlayerPlatformer(delta: number): void {
    if (!this.player || !this.keys) {
      return
    }

    const moveSpeed = 240
    const gravity = 880 * this.blueprint.physics.gravity
    let inputX = 0

    if (this.keys.A.isDown || this.keys.LEFT.isDown) {
      inputX -= 1
    }
    if (this.keys.D.isDown || this.keys.RIGHT.isDown) {
      inputX += 1
    }

    if (inputX !== 0) {
      this.facing = inputX < 0 ? -1 : 1
    }

    this.playerVelocity.x = inputX * moveSpeed
    this.playerVelocity.y += gravity * delta

    if (this.onGround && (Phaser.Input.Keyboard.JustDown(this.keys.W) || Phaser.Input.Keyboard.JustDown(this.keys.UP))) {
      this.playerVelocity.y = -420
      this.onGround = false
    }

    this.player.x = Phaser.Math.Clamp(
      this.player.x + this.playerVelocity.x * delta,
      this.playerHalfWidth,
      GAME_WIDTH - this.playerHalfWidth,
    )

    const previousBottom = this.player.y + this.playerHalfHeight
    this.player.y += this.playerVelocity.y * delta
    this.onGround = false

    for (const platform of this.platforms) {
      const top = platform.y - platform.height / 2
      if (
        aabbOverlap(this.player, this.playerHalfWidth, this.playerHalfHeight, platform.shape, platform.width / 2, platform.height / 2) &&
        this.playerVelocity.y >= 0 &&
        previousBottom <= top + 12
      ) {
        this.player.y = top - this.playerHalfHeight
        this.playerVelocity.y = 0
        this.onGround = true
      }
    }

    if (this.player.y > GAME_HEIGHT + 60) {
      this.health = 0
    }
  }

  private handleCombatInput(): void {
    if (!this.keys || !this.player) {
      return
    }

    if (this.blueprint.systems.combat === 'auto-shoot' && this.shotAccumulator >= 0.5) {
      this.shotAccumulator = 0
      this.fireAtNearestEnemy()
    }

    if (
      this.blueprint.systems.combat === 'projectile-shot' &&
      Phaser.Input.Keyboard.JustDown(this.keys.SPACE)
    ) {
      this.fireFacingProjectile()
    }

    if (
      this.blueprint.systems.combat === 'pulse-burst' &&
      Phaser.Input.Keyboard.JustDown(this.keys.SPACE)
    ) {
      this.emitBurst(this.runtimeProfile === 'platformer-expedition' ? 90 : 120)
    }
  }

  private handleSpecialInput(): void {
    if (
      this.keys &&
      this.blueprint.systems.specialMechanic === 'rewind-dash' &&
      Phaser.Input.Keyboard.JustDown(this.keys.SHIFT)
    ) {
      this.activateRewind()
    }
  }

  private activateRewind(): void {
    if (!this.player || this.playerHistory.length < 16) {
      return
    }

    const snapshot = this.playerHistory[Math.max(0, this.playerHistory.length - 16)]
    this.player.x = snapshot.x
    this.player.y = snapshot.y
    this.playerVelocity.scale(0)
    this.cameras.main.flash(120, 105, 210, 199, false)
  }

  private recordPlayerHistory(): void {
    if (!this.player) {
      return
    }

    this.playerHistory.push({ x: this.player.x, y: this.player.y })
    if (this.playerHistory.length > 90) {
      this.playerHistory.shift()
    }
  }

  private spawnEnemyAtEdge(speed: number): void {
    const side = Phaser.Math.Between(0, 3)
    const margin = 24
    const enemy = this.add.circle(0, 0, 12, parseColor(this.blueprint.palette.danger))

    if (side === 0) enemy.setPosition(0 - margin, Phaser.Math.Between(80, GAME_HEIGHT))
    if (side === 1) enemy.setPosition(GAME_WIDTH + margin, Phaser.Math.Between(80, GAME_HEIGHT))
    if (side === 2) enemy.setPosition(Phaser.Math.Between(0, GAME_WIDTH), 0 - margin)
    if (side === 3) enemy.setPosition(Phaser.Math.Between(0, GAME_WIDTH), GAME_HEIGHT + margin)

    enemy.setStrokeStyle(2, parseColor(this.blueprint.palette.text), 0.35)
    this.enemies.push({ shape: enemy, vx: 0, vy: speed })
  }

  private spawnPatroller(x: number, y: number, minX: number, maxX: number): void {
    const enemy = this.add.rectangle(x, y, 24, 20, parseColor(this.blueprint.palette.danger))
    enemy.setStrokeStyle(2, parseColor(this.blueprint.palette.text), 0.35)
    this.enemies.push({ shape: enemy, vx: 90, vy: 0, minX, maxX })
  }

  private fireAtNearestEnemy(): void {
    if (!this.player) {
      return
    }

    const nearest = this.enemies
      .map((enemy) => ({
        enemy,
        distance: Phaser.Math.Distance.Between(enemy.shape.x, enemy.shape.y, this.player!.x, this.player!.y),
      }))
      .sort((left, right) => left.distance - right.distance)[0]

    if (!nearest) {
      return
    }

    const vector = new Phaser.Math.Vector2(
      nearest.enemy.shape.x - this.player.x,
      nearest.enemy.shape.y - this.player.y,
    )
      .normalize()
      .scale(340)

    const projectile = this.add.circle(
      this.player.x,
      this.player.y,
      5,
      parseColor(this.blueprint.palette.accentAlt),
    )
    this.projectiles.push({ shape: projectile, vx: vector.x, vy: vector.y })
  }

  private fireFacingProjectile(): void {
    if (!this.player) {
      return
    }

    const projectile = this.add.circle(
      this.player.x + this.facing * 18,
      this.player.y - 4,
      5,
      parseColor(this.blueprint.palette.accentAlt),
    )
    this.projectiles.push({
      shape: projectile,
      vx: this.facing * 360,
      vy: 0,
    })
  }

  private emitBurst(radius: number): void {
    if (!this.player || this.burstCooldown > 0) {
      return
    }

    this.burstCooldown = this.runtimeProfile === 'relic-hunt' ? 1.5 : 2
    this.cameras.main.flash(120, 243, 185, 95, false)

    for (const enemy of [...this.enemies]) {
      const distance = Phaser.Math.Distance.Between(enemy.shape.x, enemy.shape.y, this.player.x, this.player.y)
      if (distance <= radius) {
        this.addScore(3)
        this.bumpCombo()
        this.spawnShard(enemy.shape.x, enemy.shape.y)
        this.removeEnemy(enemy)
      }
    }
  }

  private updateProjectiles(delta: number): void {
    for (const projectile of [...this.projectiles]) {
      projectile.shape.x += projectile.vx * delta
      projectile.shape.y += projectile.vy * delta

      if (
        projectile.shape.x < -30 ||
        projectile.shape.x > GAME_WIDTH + 30 ||
        projectile.shape.y < -30 ||
        projectile.shape.y > GAME_HEIGHT + 30
      ) {
        this.removeProjectile(projectile)
        continue
      }

      const hit = this.enemies.find(
        (enemy) =>
          Phaser.Math.Distance.Between(enemy.shape.x, enemy.shape.y, projectile.shape.x, projectile.shape.y) < 18,
      )

      if (hit) {
        this.addScore(2)
        this.bumpCombo()
        this.spawnShard(hit.shape.x, hit.shape.y)
        this.removeProjectile(projectile)
        this.removeEnemy(hit)
      }
    }
  }

  private updateChasingEnemies(delta: number, chaseMultiplier: number): void {
    if (!this.player) {
      return
    }

    for (const enemy of [...this.enemies]) {
      const vector = new Phaser.Math.Vector2(this.player.x - enemy.shape.x, this.player.y - enemy.shape.y)
        .normalize()
        .scale(enemy.vy * chaseMultiplier * delta)

      enemy.shape.x += vector.x
      enemy.shape.y += vector.y

      if (Phaser.Math.Distance.Between(enemy.shape.x, enemy.shape.y, this.player.x, this.player.y) < 24) {
        this.health -= this.runtimeProfile === 'relic-hunt' ? 10 : 8
        enemy.shape.x -= vector.x * 12
        enemy.shape.y -= vector.y * 12
        this.combo = 1
        this.comboTimer = 0
        this.cameras.main.shake(70, 0.003)
      }
    }
  }

  private updatePatrolEnemies(delta: number): void {
    if (!this.player) {
      return
    }

    for (const enemy of [...this.enemies]) {
      enemy.shape.x += enemy.vx * delta

      if (enemy.minX !== undefined && enemy.shape.x <= enemy.minX) {
        enemy.vx = Math.abs(enemy.vx)
      }
      if (enemy.maxX !== undefined && enemy.shape.x >= enemy.maxX) {
        enemy.vx = -Math.abs(enemy.vx)
      }

      if (aabbOverlap(this.player, this.playerHalfWidth, this.playerHalfHeight, enemy.shape, 12, 10)) {
        this.health -= 12
        this.combo = 1
        this.comboTimer = 0
        this.player.y -= 18
        this.cameras.main.shake(70, 0.003)
      }
    }
  }

  private collectNearbyShards(radius: number, baseScore: number): void {
    const delta = this.game.loop.delta / 1000

    for (const shard of [...this.shards]) {
      shard.shape.x += shard.vx * delta
      shard.shape.y += shard.vy * delta

      if (!this.player) {
        continue
      }

      if (Phaser.Math.Distance.Between(shard.shape.x, shard.shape.y, this.player.x, this.player.y) < radius) {
        this.addScore(baseScore)
        shard.shape.destroy()
        this.shards.splice(this.shards.indexOf(shard), 1)
      }
    }
  }

  private spawnShard(x: number, y: number): void {
    if (this.runtimeProfile === 'relic-hunt' || this.runtimeProfile === 'platformer-expedition') {
      return
    }

    const radius = this.runtimeProfile === 'slingshot-destruction' ? 4 : 6
    const color =
      this.runtimeProfile === 'slingshot-destruction'
        ? parseColor(this.blueprint.palette.accentAlt)
        : parseColor(this.blueprint.palette.accent)

    const shard = this.add.circle(x, y, radius, color, 0.95)
    this.shards.push({
      shape: shard,
      vx: Phaser.Math.Between(-20, 20),
      vy: Phaser.Math.Between(-20, 20) - (this.runtimeProfile === 'slingshot-destruction' ? 18 : 0),
    })
  }

  private emitImpactBurst(
    x: number,
    y: number,
    color: string,
    count: number,
    spread: number,
    alpha = 0.72,
  ): void {
    const parsedColor = parseColor(color)

    for (let i = 0; i < count; i += 1) {
      const angle = Phaser.Math.FloatBetween(-Math.PI, Math.PI)
      const distance = Phaser.Math.FloatBetween(spread * 0.18, spread)
      const radius = Phaser.Math.FloatBetween(1.6, 4.4)
      const particle = this.add
        .circle(x, y, radius, parsedColor, alpha)
        .setDepth(18)
        .setBlendMode(Phaser.BlendModes.ADD)

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance + Phaser.Math.FloatBetween(-8, 12),
        alpha: 0,
        scaleX: 0.18,
        scaleY: 0.18,
        duration: Phaser.Math.Between(260, 560),
        ease: 'Cubic.easeOut',
        onComplete: () => particle.destroy(),
      })
    }
  }

  private spawnLaneWave(): void {
    const lanes = [GAME_WIDTH * 0.32, GAME_WIDTH * 0.5, GAME_WIDTH * 0.68]
    const hazardLane = Phaser.Math.Between(0, 2)
    const pickupLane = (hazardLane + Phaser.Math.Between(1, 2)) % 3

    const hazard = this.add.rectangle(
      lanes[hazardLane],
      -30,
      54,
      26,
      parseColor(this.blueprint.palette.danger),
      0.95,
    )
    const pickup = this.add.circle(lanes[pickupLane], -66, 12, parseColor(this.blueprint.palette.accentAlt))

    this.laneObjects.push({ shape: hazard, vx: 0, vy: 0, kind: 'hazard' })
    this.laneObjects.push({ shape: pickup, vx: 0, vy: 0, kind: 'pickup' })
  }

  private addPlatform(x: number, y: number, width: number, height: number): void {
    const platform = this.add.rectangle(x, y, width, height, parseColor(this.blueprint.palette.surface))
    platform.setStrokeStyle(2, parseColor(this.blueprint.palette.accentAlt), 0.2)
    this.platforms.push({ shape: platform, x, y, width, height })
  }

  private spawnRelic(x: number, y: number): void {
    const relic = this.add.circle(x, y, 8, parseColor(this.blueprint.palette.accentAlt))
    relic.setStrokeStyle(2, parseColor(this.blueprint.palette.text), 0.7)
    this.shards.push({ shape: relic, vx: 0, vy: 0 })
  }

  private loadSlingshotLevel(levelIndex: number): void {
    if (!this.slingshot) {
      return
    }

    const level = this.slingshot.levels[levelIndex]
    this.slingshot.levelIndex = levelIndex
    this.slingshot.transitioning = false
    this.slingshot.levelBadge.setText(`LEVEL ${levelIndex + 1} / ${this.slingshot.levels.length}  ${level.name.toUpperCase()}`)
    this.objectiveText.setText([
      `${this.blueprint.hero.name}: ${level.note}`,
      'Free every orbit core. Save seeds for the next chamber.',
    ])

    this.clearSlingshotActors()
    this.slingshot.shotsRemaining += level.shots

    for (const blockDef of level.blocks) {
      const materialStats = SLINGSHOT_MATERIAL_STATS[blockDef.material]
      const block = this.add.rectangle(
        blockDef.x,
        blockDef.y,
        blockDef.width,
        blockDef.height,
        parseColor(slingshotMaterialColor(blockDef.material, this.blueprint.palette)),
      )
      block.setStrokeStyle(2, parseColor(this.blueprint.palette.text), 0.01)
      block.setAlpha(0.01)
      const gameObject = this.matter.add.gameObject(block, {
        friction: this.blueprint.physics.friction,
        restitution: blockDef.material === 'glass' ? this.blueprint.physics.bounce * 0.22 : this.blueprint.physics.bounce * 0.38,
      }) as MatterShape
      gameObject.body.label = `gameclaw-block-${blockDef.material}`
      this.matter.body.setDensity(gameObject.body, materialStats.density)
      gameObject.art = this.createSlingshotBlockArt(blockDef.material, blockDef.x, blockDef.y, blockDef.width, blockDef.height)
      gameObject.shadow = this.createSlingshotShadow(blockDef.x, blockDef.y, blockDef.width, blockDef.height)

      const sizeBonus = Math.sqrt(blockDef.width * blockDef.height) * 0.034

      this.slingshot.blocks.push({
        shape: gameObject,
        material: blockDef.material,
        integrity: materialStats.integrity + sizeBonus,
        maxIntegrity: materialStats.integrity + sizeBonus,
        fractureLevel: 0,
        lastImpactAt: 0,
        collapseLeft: blockDef.material === 'glass' ? 420 : 360,
        collapseRight: GAME_WIDTH + 120,
        collapseBottom: GAME_HEIGHT + 60,
      })
    }

    for (const targetDef of level.targets) {
      const target = this.add.circle(
        targetDef.x,
        targetDef.y,
        targetDef.radius ?? 16,
        parseColor(this.blueprint.palette.danger),
      )
      target.setStrokeStyle(3, parseColor(this.blueprint.palette.text), 0.01)
      target.setAlpha(0.01)
      const gameObject = this.matter.add.gameObject(target, {
        friction: this.blueprint.physics.friction,
        restitution: this.blueprint.physics.bounce * 0.15,
      }) as MatterShape
      gameObject.body.label = 'gameclaw-target'
      this.matter.body.setDensity(gameObject.body, 0.0019)
      gameObject.art = this.createSlingshotTargetArt(targetDef.x, targetDef.y, (targetDef.radius ?? 16) * 2.8)
      gameObject.shadow = this.createSlingshotShadow(targetDef.x, targetDef.y, 54, 28)
      gameObject.glow = this.createSlingshotGlow(targetDef.x, targetDef.y, (targetDef.radius ?? 16) * 4.2, this.blueprint.palette.accentAlt)
      const integrity = targetDef.integrity ?? this.blueprint.physics.structuralIntegrity * 0.6

      this.slingshot.targets.push({
        shape: gameObject,
        integrity,
        maxIntegrity: integrity,
        lastImpactAt: 0,
      })
    }

    this.spawnSlingshotProjectile()
    this.cameras.main.flash(180, 105, 210, 199, false)
  }

  private advanceSlingshotLevel(): void {
    if (!this.slingshot) {
      return
    }

    if (this.slingshot.levelIndex >= this.slingshot.levels.length - 1) {
      this.finishGame(true, `All observatory chambers collapsed. Final score ${this.score}.`)
      return
    }

    this.slingshot.transitioning = true
    this.clearSlingshotProjectile()
    const nextLevel = this.slingshot.levels[this.slingshot.levelIndex + 1]
    this.objectiveText.setText([
      `Chamber cleared. The orchard opens ${nextLevel.name}.`,
      `Next: ${nextLevel.note}`,
    ])
    this.statusText.setText(`Chamber ${this.slingshot.levelIndex + 1} cleared   Score ${this.score}`)
    this.time.delayedCall(1100, () => {
      if (!this.gameEnded) {
        this.loadSlingshotLevel(this.slingshot!.levelIndex + 1)
      }
    })
  }

  private clearSlingshotActors(): void {
    if (!this.slingshot) {
      return
    }

    for (const block of this.slingshot.blocks) {
      block.shape.art?.destroy()
      block.shape.shadow?.destroy()
      block.shape.glow?.destroy()
      block.shape.destroy()
    }
    for (const target of this.slingshot.targets) {
      target.shape.art?.destroy()
      target.shape.shadow?.destroy()
      target.shape.glow?.destroy()
      target.shape.destroy()
    }

    this.slingshot.blocks = []
    this.slingshot.targets = []
    this.clearSlingshotProjectile()
  }

  private clearSlingshotProjectile(): void {
    if (!this.slingshot?.projectile) {
      return
    }

    this.slingshot.projectile.art?.destroy()
    this.slingshot.projectile.shadow?.destroy()
    this.slingshot.projectile.glow?.destroy()
    this.slingshot.projectile.destroy()
    this.slingshot.projectile = null
    this.slingshot.projectileLaunched = false
    this.slingshot.dragging = false
  }

  private spawnSlingshotProjectile(): void {
    if (!this.slingshot || this.slingshot.shotsRemaining <= 0) {
      return
    }

    const projectile = this.add.circle(
      this.slingshot.anchor.x,
      this.slingshot.anchor.y,
      18,
      parseColor(this.blueprint.palette.accent),
    )
    projectile.setStrokeStyle(3, parseColor(this.blueprint.palette.text), 0.01)
    projectile.setAlpha(0.01)

    const matterProjectile = this.matter.add.gameObject(projectile, {
      friction: this.blueprint.physics.friction,
      restitution: this.blueprint.physics.bounce,
      frictionAir: this.blueprint.physics.drag,
    }) as MatterShape

    matterProjectile.body.label = 'gameclaw-projectile'
    this.matter.body.setDensity(matterProjectile.body, 0.0022)
    this.matter.body.setStatic(matterProjectile.body, true)
    matterProjectile.art = this.createSlingshotProjectileArt(this.slingshot.anchor.x, this.slingshot.anchor.y)
    matterProjectile.shadow = this.createSlingshotShadow(this.slingshot.anchor.x, this.slingshot.anchor.y, 42, 20)
    matterProjectile.glow = this.createSlingshotGlow(this.slingshot.anchor.x, this.slingshot.anchor.y, 62, this.blueprint.palette.accent)
    this.slingshot.projectile = matterProjectile
    this.slingshot.projectileLaunched = false
    this.slingshot.elasticSnap = null
    this.slingshot.shotsRemaining -= 1
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (!this.slingshot?.projectile) {
      return
    }

    const pointerPosition = this.getPointerGamePosition(pointer)
    const projectile = this.slingshot.projectile
    const projectileDistance = Phaser.Math.Distance.Between(
      pointerPosition.x,
      pointerPosition.y,
      projectile.x,
      projectile.y,
    )
    const anchorDistance = Phaser.Math.Distance.Between(
      pointerPosition.x,
      pointerPosition.y,
      this.slingshot.anchor.x,
      this.slingshot.anchor.y,
    )

    if (projectileDistance <= 86 || anchorDistance <= 118) {
      this.slingshot.dragging = true
      this.matter.body.setVelocity(projectile.body, { x: 0, y: 0 })
      this.matter.body.setAngularVelocity(projectile.body, 0)
      this.matter.body.setStatic(projectile.body, true)
      this.setSlingshotProjectilePull(pointerPosition.x, pointerPosition.y)
    }
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.slingshot?.dragging || !this.slingshot.projectile) {
      return
    }

    const pointerPosition = this.getPointerGamePosition(pointer)
    this.setSlingshotProjectilePull(pointerPosition.x, pointerPosition.y)
  }

  private handlePointerUp(): void {
    if (!this.slingshot?.dragging || !this.slingshot.projectile) {
      return
    }

    this.releaseSlingshotProjectile()
  }

  private updateSlingshotKeyboardAim(): void {
    if (
      !this.keys ||
      !this.slingshot?.projectile ||
      this.slingshot.dragging ||
      this.slingshot.projectileLaunched
    ) {
      return
    }

    let inputX = 0
    let inputY = 0

    if (this.keys.A.isDown || this.keys.LEFT.isDown) inputX -= 1
    if (this.keys.D.isDown || this.keys.RIGHT.isDown) inputX += 1
    if (this.keys.W.isDown || this.keys.UP.isDown) inputY -= 1
    if (this.keys.S.isDown || this.keys.DOWN.isDown) inputY += 1

    if (inputX !== 0 || inputY !== 0) {
      const delta = this.game.loop.delta / 1000
      const vector = new Phaser.Math.Vector2(inputX, inputY).normalize().scale(260 * delta)
      const nextX = this.slingshot.projectile.x + vector.x
      const nextY = this.slingshot.projectile.y + vector.y

      this.matter.body.setStatic(this.slingshot.projectile.body, true)
      this.setSlingshotProjectilePull(nextX, nextY)
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
      this.releaseSlingshotProjectile()
    }
  }

  private setSlingshotProjectilePull(x: number, y: number): void {
    if (!this.slingshot?.projectile) {
      return
    }

    const maxDistance = 128
    const constrainedX = Math.min(x, this.slingshot.anchor.x - 2)
    const offsetX = constrainedX - this.slingshot.anchor.x
    const offsetY = y - this.slingshot.anchor.y
    const vector = new Phaser.Math.Vector2(offsetX, offsetY)

    if (vector.length() > maxDistance) {
      vector.normalize().scale(maxDistance)
    }

    this.matter.body.setPosition(this.slingshot.projectile.body, {
      x: this.slingshot.anchor.x + vector.x,
      y: this.slingshot.anchor.y + vector.y,
    })
  }

  private releaseSlingshotProjectile(): void {
    if (!this.slingshot?.projectile) {
      return
    }

    const projectile = this.slingshot.projectile
    const pull = this.calculateSlingshotPull(projectile)

    this.slingshot.dragging = false

    if (pull.length() < 14) {
      this.matter.body.setPosition(projectile.body, this.slingshot.anchor)
      return
    }

    const velocity = this.calculateSlingshotLaunchVelocity(projectile)
    this.slingshot.projectileLaunched = true
    this.slingshot.lastReleaseAt = this.time.now
    this.slingshot.elasticSnap = {
      startedAt: this.time.now,
      pullX: projectile.x - this.slingshot.anchor.x,
      pullY: projectile.y - this.slingshot.anchor.y,
    }

    this.matter.body.setStatic(projectile.body, false)
    this.matter.body.setVelocity(projectile.body, { x: velocity.x, y: velocity.y })
    this.matter.body.setAngularVelocity(projectile.body, Phaser.Math.Clamp(velocity.x * 0.003, -0.18, 0.18))
    this.emitImpactBurst(projectile.x, projectile.y, this.blueprint.palette.accent, 12, 42)
    this.cameras.main.shake(70, 0.0025)
  }

  private getPointerGamePosition(pointer: Phaser.Input.Pointer): Phaser.Math.Vector2 {
    return pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2
  }

  private calculateSlingshotPull(projectile: MatterShape): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(
      this.slingshot!.anchor.x - projectile.x,
      this.slingshot!.anchor.y - projectile.y,
    )
  }

  private calculateSlingshotLaunchVelocity(projectile: MatterShape): Phaser.Math.Vector2 {
    return this.calculateSlingshotPull(projectile).scale(this.blueprint.physics.projectilePower / 30)
  }

  private drawSlingshotFrame(): void {
    if (!this.slingshot) {
      return
    }

    const frame = this.add.graphics().setDepth(4)
    const wood = parseColor('#6f4a25')
    const brass = parseColor(this.blueprint.palette.accent)
    const root = parseColor('#2f2118')
    const { x, y } = this.slingshot.anchor

    frame.lineStyle(18, root, 0.34)
    frame.lineBetween(x - 5, y + 48, x - 2, y - 18)
    frame.lineStyle(11, wood, 0.94)
    frame.lineBetween(x - 5, y + 48, x - 2, y - 18)
    frame.lineStyle(12, wood, 0.94)
    frame.lineBetween(x - 2, y - 18, x - 24, y - 50)
    frame.lineBetween(x - 2, y - 18, x + 26, y - 34)
    frame.lineStyle(3, brass, 0.82)
    frame.lineBetween(x - 17, y - 42, x - 8, y - 24)
    frame.lineBetween(x + 16, y - 30, x + 2, y - 20)
    frame.fillStyle(brass, 0.74)
    frame.fillCircle(x - 24, y - 50, 5)
    frame.fillCircle(x + 26, y - 34, 5)
  }

  private createSlingshotHeroSprite(x: number, y: number): Phaser.GameObjects.Image {
    const hero = this.add.image(x, y, ASTRAL_HERO_SPRITES.idle).setDepth(8).setAlpha(0.98)
    this.applyHeroSpritePose(hero, 'idle')
    return hero
  }

  private applyHeroSpritePose(hero: Phaser.GameObjects.Image, pose: AstralHeroPose): void {
    const display = ASTRAL_HERO_DISPLAY[pose]
    hero
      .setTexture(ASTRAL_HERO_SPRITES[pose])
      .setOrigin(display.originX, 1)
      .setDisplaySize(display.width, display.height)

    if (this.slingshot) {
      this.slingshot.heroPose = pose
    }
  }

  private getHeroHandPosition(): { x: number; y: number } | null {
    const hero = this.slingshot?.heroSprite
    if (!hero || !this.slingshot) {
      return null
    }

    const pose = this.slingshot.heroPose
    const offsets: Record<AstralHeroPose, { x: number; y: number }> = {
      idle: { x: 22, y: -70 },
      walk: { x: 30, y: -68 },
      pull: { x: 48, y: -60 },
      release: { x: 78, y: -64 },
    }
    const offset = offsets[pose]
    const rotation = hero.rotation
    const cos = Math.cos(rotation)
    const sin = Math.sin(rotation)

    return {
      x: hero.x + offset.x * cos - offset.y * sin,
      y: hero.y + offset.x * sin + offset.y * cos,
    }
  }

  private refreshDragGuide(): void {
    if (!this.slingshot) {
      return
    }

    this.slingshot.dragGuide.clear()
    this.slingshot.dragGuide.setDepth(12)
    this.slingshot.dragGuide.lineStyle(2, parseColor(this.blueprint.palette.accentAlt), this.slingshot.dragging ? 0.34 : 0.16)
    this.slingshot.dragGuide.strokeCircle(this.slingshot.anchor.x, this.slingshot.anchor.y, 64)

    const projectile = this.slingshot.projectile
    if (!projectile) {
      return
    }

    const forkTop = { x: this.slingshot.anchor.x - 12, y: this.slingshot.anchor.y - 38 }
    const forkBottom = { x: this.slingshot.anchor.x + 14, y: this.slingshot.anchor.y - 20 }
    const pull = this.calculateSlingshotPull(projectile)

    if (this.slingshot.projectileLaunched) {
      this.drawElasticRecoil(forkTop, forkBottom)
      return
    }

    const tension = Phaser.Math.Clamp(pull.length() / 110, 0, 1)
    this.drawSlingshotPowerMeter(tension)
    this.drawElasticBand(forkTop, projectile, 5, this.blueprint.palette.accent, 0.6, tension, 0)
    this.drawElasticBand(forkBottom, projectile, 4, this.blueprint.palette.accentAlt, 0.62, tension, Math.PI * 0.8)

    const heldHand = this.getHeroHandPosition()
    if (heldHand) {
      this.slingshot.dragGuide.lineStyle(3, parseColor(this.blueprint.palette.accent), 0.38)
      this.slingshot.dragGuide.lineBetween(heldHand.x, heldHand.y, projectile.x, projectile.y)
    }

    if (pull.length() > 14) {
      this.drawPredictedSlingshotTrajectory(projectile)
    }
  }

  private drawSlingshotPowerMeter(tension: number): void {
    if (!this.slingshot) {
      return
    }

    const x = this.slingshot.anchor.x - 70
    const y = this.slingshot.anchor.y - 58
    const height = 98
    const fillHeight = height * tension
    this.slingshot.dragGuide.fillStyle(parseColor('#020507'), 0.46)
    this.slingshot.dragGuide.fillRoundedRect(x, y, 12, height, 6)
    this.slingshot.dragGuide.fillStyle(parseColor(this.blueprint.palette.accent), 0.28 + tension * 0.56)
    this.slingshot.dragGuide.fillRoundedRect(x + 2, y + height - fillHeight + 2, 8, Math.max(4, fillHeight - 4), 4)
    this.slingshot.dragGuide.lineStyle(1, parseColor(this.blueprint.palette.text), 0.22)
    this.slingshot.dragGuide.strokeRoundedRect(x, y, 12, height, 6)
  }

  private drawElasticRecoil(
    forkTop: { x: number; y: number },
    forkBottom: { x: number; y: number },
  ): void {
    if (!this.slingshot?.elasticSnap) {
      return
    }

    const elapsed = this.time.now - this.slingshot.elasticSnap.startedAt
    const duration = 320
    if (elapsed > duration) {
      this.slingshot.elasticSnap = null
      return
    }

    const progress = Phaser.Math.Clamp(elapsed / duration, 0, 1)
    const spring = Math.sin(progress * Math.PI * 5) * (1 - progress)
    const snapPoint = {
      x: this.slingshot.anchor.x + this.slingshot.elasticSnap.pullX * (1 - progress) * 0.22 + spring * 16,
      y: this.slingshot.anchor.y + this.slingshot.elasticSnap.pullY * (1 - progress) * 0.18 - Math.abs(spring) * 10,
    }

    this.drawElasticBand(forkTop, snapPoint, 5, this.blueprint.palette.accent, 0.42 * (1 - progress), 0.12, 0)
    this.drawElasticBand(forkBottom, snapPoint, 4, this.blueprint.palette.accentAlt, 0.44 * (1 - progress), 0.12, 1.6)
  }

  private drawElasticBand(
    start: { x: number; y: number },
    end: { x: number; y: number },
    thickness: number,
    color: string,
    alpha: number,
    tension: number,
    phase: number,
  ): void {
    if (!this.slingshot) {
      return
    }

    const segments = 18
    const dx = end.x - start.x
    const dy = end.y - start.y
    const length = Math.max(1, Math.hypot(dx, dy))
    const normalX = -dy / length
    const normalY = dx / length
    const slack = (1 - tension) * 8
    const tremble = Math.sin(this.time.now * 0.045 + phase) * (2.2 - tension * 1.3)
    let previousX = start.x
    let previousY = start.y

    this.slingshot.dragGuide.lineStyle(thickness, parseColor(color), alpha)

    for (let step = 1; step <= segments; step += 1) {
      const t = step / segments
      const arc = Math.sin(Math.PI * t)
      const wave = Math.sin(t * Math.PI * 3 + phase + this.time.now * 0.035)
      const offset = arc * (slack + tremble + wave * 1.2)
      const x = Phaser.Math.Linear(start.x, end.x, t) + normalX * offset
      const y = Phaser.Math.Linear(start.y, end.y, t) + normalY * offset + arc * slack * 0.45
      this.slingshot.dragGuide.lineBetween(previousX, previousY, x, y)
      previousX = x
      previousY = y
    }
  }

  private drawPredictedSlingshotTrajectory(projectile: MatterShape): void {
    if (!this.slingshot) {
      return
    }

    const velocity = this.calculateSlingshotLaunchVelocity(projectile)
    let x = projectile.x
    let y = projectile.y
    let vx = velocity.x
    let vy = velocity.y
    const gravityPerStep = this.blueprint.physics.gravity
    const drag = Phaser.Math.Clamp(this.blueprint.physics.drag, 0, 0.08)

    for (let i = 1; i <= 28; i += 1) {
      for (let substep = 0; substep < 2; substep += 1) {
        x += vx
        y += vy
        vx *= 1 - drag
        vy = vy * (1 - drag) + gravityPerStep
      }

      if (x < 0 || x > GAME_WIDTH || y < 0 || y > GAME_HEIGHT - 68) {
        break
      }

      this.slingshot.dragGuide.fillStyle(parseColor('#020507'), 0.2 - i * 0.004)
      this.slingshot.dragGuide.fillCircle(x + 2, y + 2, Math.max(2, 6 - i * 0.13))
      this.slingshot.dragGuide.fillStyle(parseColor(this.blueprint.palette.accent), 0.46 - i * 0.012)
      this.slingshot.dragGuide.fillCircle(x, y, Math.max(2, 6 - i * 0.13))
    }
  }

  private syncSlingshotHero(): void {
    if (!this.slingshot?.heroSprite) {
      return
    }

    const hero = this.slingshot.heroSprite
    const projectile = this.slingshot.projectile
    const recoilProgress =
      this.slingshot.elasticSnap && this.slingshot.projectileLaunched
        ? Phaser.Math.Clamp((this.time.now - this.slingshot.elasticSnap.startedAt) / 320, 0, 1)
        : 1

    if (!projectile || this.slingshot.projectileLaunched) {
      const pose: AstralHeroPose = recoilProgress < 0.78 ? 'release' : 'idle'
      this.applyHeroSpritePose(hero, pose)
      hero.setPosition(
        Phaser.Math.Linear(hero.x, this.slingshot.heroBase.x - (1 - recoilProgress) * 14, 0.2),
        Phaser.Math.Linear(hero.y, this.slingshot.heroBase.y + Math.sin(this.time.now * 0.012) * 1.4, 0.2),
      )
      hero.setRotation(Phaser.Math.Linear(hero.rotation, recoilProgress < 0.78 ? -0.08 : 0, 0.2))
      return
    }

    const pullOffsetX = Phaser.Math.Clamp((projectile.x - this.slingshot.anchor.x) * 0.34, -42, 18)
    const pullOffsetY = Phaser.Math.Clamp((projectile.y - this.slingshot.anchor.y) * 0.12, -10, 14)
    const pullAmount = Phaser.Math.Clamp(
      Phaser.Math.Distance.Between(projectile.x, projectile.y, this.slingshot.anchor.x, this.slingshot.anchor.y) / 110,
      0,
      1,
    )
    const walking = pullAmount > 0.08 && pullAmount < 0.48
    const walkPhase = Math.floor(this.time.now / 130) % 2
    const pose: AstralHeroPose = pullAmount > 0.48 ? 'pull' : walking && walkPhase === 0 ? 'walk' : 'idle'
    const walkBob = Math.sin(this.time.now * 0.02) * Math.min(5, Math.abs(pullOffsetX) * 0.16)

    this.applyHeroSpritePose(hero, pose)
    hero.setPosition(this.slingshot.heroBase.x + pullOffsetX, this.slingshot.heroBase.y + pullOffsetY + walkBob)
    hero.setRotation(Phaser.Math.Clamp(pullOffsetX * 0.004, -0.13, 0.07))

    if (walking && this.time.now - this.slingshot.lastStepAt > 180) {
      this.slingshot.lastStepAt = this.time.now
      this.emitImpactBurst(hero.x - 6, this.slingshot.heroBase.y - 6, '#d8a65d', 3, 12, 0.28)
    }
  }

  private handleSlingshotCollision(event: Phaser.Physics.Matter.Events.CollisionStartEvent): void {
    if (!this.slingshot) {
      return
    }

    for (const pair of event.pairs) {
      const bodyA = pair.bodyA
      const bodyB = pair.bodyB
      const projectileHit = Boolean(
        this.slingshot.projectile &&
          (bodyBelongsToMatterShape(bodyA, this.slingshot.projectile) ||
            bodyBelongsToMatterShape(bodyB, this.slingshot.projectile)),
      )
      const targetA = this.findSlingshotTargetByBody(bodyA)
      const targetB = this.findSlingshotTargetByBody(bodyB)
      const blockA = this.findSlingshotBlockByBody(bodyA)
      const blockB = this.findSlingshotBlockByBody(bodyB)
      const targetHit = targetA ?? targetB
      const impactSpeed = Math.hypot(
        bodyA.velocity.x - bodyB.velocity.x,
        bodyA.velocity.y - bodyB.velocity.y,
      )

      if (impactSpeed < 1.35) {
        continue
      }

      const impactX = (bodyA.position.x + bodyB.position.x) * 0.5
      const impactY = (bodyA.position.y + bodyB.position.y) * 0.5
      const burstColor = targetHit
        ? this.blueprint.palette.accentAlt
        : blockA
          ? SLINGSHOT_MATERIAL_STATS[blockA.material].particleColor
          : blockB
            ? SLINGSHOT_MATERIAL_STATS[blockB.material].particleColor
            : this.blueprint.palette.accent
      this.emitImpactBurst(impactX, impactY, burstColor, Phaser.Math.Clamp(Math.round(impactSpeed * 1.5), 4, 16), impactSpeed * 8)

      if (targetA) {
        this.damageSlingshotTarget(targetA, impactSpeed * (projectileHit ? 1.2 : 0.72), impactX, impactY)
      }
      if (targetB && targetB !== targetA) {
        this.damageSlingshotTarget(targetB, impactSpeed * (projectileHit ? 1.2 : 0.72), impactX, impactY)
      }

      const shouldDamageBlocks = projectileHit || Boolean(targetHit) || Boolean(blockA && blockB)
      if (shouldDamageBlocks && blockA) {
        this.damageSlingshotBlock(blockA, impactSpeed * (projectileHit ? 1 : 0.46), impactX, impactY)
      }
      if (shouldDamageBlocks && blockB && blockB !== blockA) {
        this.damageSlingshotBlock(blockB, impactSpeed * (projectileHit ? 1 : 0.46), impactX, impactY)
      }
    }
  }

  private findSlingshotBlockByBody(body: MatterJS.BodyType): SlingshotBlock | undefined {
    return this.slingshot?.blocks.find((block) => bodyBelongsToMatterShape(body, block.shape))
  }

  private findSlingshotTargetByBody(body: MatterJS.BodyType): SlingshotTarget | undefined {
    return this.slingshot?.targets.find((target) => bodyBelongsToMatterShape(body, target.shape))
  }

  private damageSlingshotTarget(target: SlingshotTarget, damage: number, x: number, y: number): void {
    if (!this.slingshot || this.time.now - target.lastImpactAt < 70) {
      return
    }

    target.lastImpactAt = this.time.now
    target.integrity -= damage
    const remaining = Phaser.Math.Clamp(target.integrity / target.maxIntegrity, 0, 1)
    target.shape.art?.setTintFill(remaining < 0.45 ? parseColor('#ffffff') : parseColor(this.blueprint.palette.accentAlt))
    target.shape.glow?.setAlpha(0.18 + (1 - remaining) * 0.28)

    if (target.shape.art) {
      this.tweens.add({
        targets: target.shape.art,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 70,
        yoyo: true,
        ease: 'Quad.easeOut',
      })
      this.time.delayedCall(90, () => target.shape.art?.clearTint())
    }

    if (target.integrity <= 0) {
      this.destroySlingshotTarget(target, x, y)
    }
  }

  private damageSlingshotBlock(block: SlingshotBlock, impactSpeed: number, x: number, y: number): void {
    if (!this.slingshot || this.time.now - block.lastImpactAt < 90) {
      return
    }

    const stats = SLINGSHOT_MATERIAL_STATS[block.material]
    const damage = impactSpeed * stats.damageScale
    if (damage < 0.72) {
      return
    }

    block.lastImpactAt = this.time.now
    block.integrity -= damage
    const fractureLevel = 1 - Phaser.Math.Clamp(block.integrity / block.maxIntegrity, 0, 1)

    if (fractureLevel > block.fractureLevel + 0.16) {
      block.fractureLevel = fractureLevel
      block.shape.art?.setAlpha(Phaser.Math.Clamp(1 - fractureLevel * 0.28, 0.62, 1))
      block.shape.art?.setTint(parseColor(block.material === 'glass' ? '#dffcff' : '#ffe3a5'))
      this.cameras.main.shake(block.material === 'brass' ? 70 : 95, block.material === 'brass' ? 0.002 : 0.0035)
    }

    if (block.integrity <= 0 && block.material !== 'brass') {
      this.breakSlingshotBlock(block, x, y)
    }
  }

  private destroySlingshotTarget(target: SlingshotTarget, x: number, y: number): void {
    if (!this.slingshot) {
      return
    }

    const index = this.slingshot.targets.indexOf(target)
    if (index < 0) {
      return
    }

    this.addScore(30)
    this.emitImpactBurst(x, y, this.blueprint.palette.accentAlt, 24, 86, 0.9)
    target.shape.art?.destroy()
    target.shape.shadow?.destroy()
    target.shape.glow?.destroy()
    target.shape.destroy()
    this.slingshot.targets.splice(index, 1)
    this.cameras.main.shake(150, 0.006)
  }

  private breakSlingshotBlock(block: SlingshotBlock, x: number, y: number): void {
    if (!this.slingshot) {
      return
    }

    const index = this.slingshot.blocks.indexOf(block)
    if (index < 0) {
      return
    }

    this.addScore(block.material === 'glass' ? 4 : 2)
    this.emitImpactBurst(x, y, SLINGSHOT_MATERIAL_STATS[block.material].particleColor, block.material === 'glass' ? 20 : 12, 66, 0.82)
    block.shape.art?.destroy()
    block.shape.shadow?.destroy()
    block.shape.glow?.destroy()
    block.shape.destroy()
    this.slingshot.blocks.splice(index, 1)
  }

  private updateMatterTargets(): void {
    if (!this.slingshot) {
      return
    }

    for (const target of [...this.slingshot.targets]) {
      const destroyed =
        target.integrity <= 0 ||
        target.shape.body.speed > target.integrity ||
        target.shape.y > GAME_HEIGHT - 48 ||
        target.shape.x < 440 ||
        target.shape.x > GAME_WIDTH + 80

      if (destroyed) {
        this.destroySlingshotTarget(target, target.shape.x, target.shape.y)
      }
    }
  }

  private updateMatterBlocks(): void {
    if (!this.slingshot) {
      return
    }

    for (const block of [...this.slingshot.blocks]) {
      const collapsed =
        block.shape.y > block.collapseBottom ||
        block.shape.x > block.collapseRight ||
        block.shape.x < block.collapseLeft

      if (collapsed) {
        if (block.material !== 'glass') {
          this.spawnShard(block.shape.x, block.shape.y)
        }
        block.shape.art?.destroy()
        block.shape.shadow?.destroy()
        block.shape.glow?.destroy()
        block.shape.destroy()
        this.slingshot.blocks.splice(this.slingshot.blocks.indexOf(block), 1)
      }
    }
  }

  private syncSlingshotArt(): void {
    if (!this.slingshot) {
      return
    }

    for (const block of this.slingshot.blocks) {
      this.syncAttachedArt(block.shape, 7, 1)
    }

    for (const target of this.slingshot.targets) {
      this.syncAttachedArt(target.shape, 8, 1)
    }

    if (this.slingshot.projectile) {
      this.syncAttachedArt(this.slingshot.projectile, 9, 1)
      this.updateSlingshotProjectileTrail(this.slingshot.projectile)
    }
  }

  private syncAttachedArt(shape: MatterShape, depth: number, alpha: number): void {
    shape.art?.setPosition(shape.x, shape.y).setRotation(shape.rotation).setDepth(depth).setAlpha(alpha)
    shape.shadow
      ?.setPosition(shape.x, GAME_HEIGHT - 66)
      .setScale(Phaser.Math.Clamp(1 - Math.max(0, GAME_HEIGHT - 80 - shape.y) * 0.0022, 0.34, 1.05), 1)
      .setDepth(depth - 2)
    shape.glow?.setPosition(shape.x, shape.y).setRotation(shape.rotation).setDepth(depth - 1)
  }

  private prepareAstralCutoutTextures(): void {
    if (this.runtimeProfile !== 'slingshot-destruction') {
      return
    }

    this.createEdgeKeyedCutoutTexture(ASTRAL_TEXTURES.projectile, ASTRAL_CUTOUT_TEXTURES.projectile)
    this.createEdgeKeyedCutoutTexture(ASTRAL_TEXTURES.target, ASTRAL_CUTOUT_TEXTURES.target)
    this.createEdgeKeyedCutoutTexture(ASTRAL_TEXTURES.woodBeam, ASTRAL_CUTOUT_TEXTURES.woodBeam)
    this.createEdgeKeyedCutoutTexture(ASTRAL_TEXTURES.woodSupport, ASTRAL_CUTOUT_TEXTURES.woodSupport)
    this.createEdgeKeyedCutoutTexture(ASTRAL_TEXTURES.glassPillar, ASTRAL_CUTOUT_TEXTURES.glassPillar)
    this.createEdgeKeyedCutoutTexture(ASTRAL_TEXTURES.brassBeam, ASTRAL_CUTOUT_TEXTURES.brassBeam)

    for (const pose of Object.keys(ASTRAL_HERO_SPRITES) as AstralHeroPose[]) {
      this.createEdgeKeyedCutoutTexture(
        ASTRAL_TEXTURES.spriteSheet,
        ASTRAL_HERO_SPRITES[pose],
        ASTRAL_HERO_SOURCE_RECTS[pose],
      )
    }
  }

  private createEdgeKeyedCutoutTexture(sourceKey: string, cutoutKey: string, crop?: TextureCrop): void {
    if (!this.textures.exists(sourceKey) || this.textures.exists(cutoutKey)) {
      return
    }

    const source = this.textures.get(sourceKey).getSourceImage() as CanvasImageSource
    const sourceWidth = Number('width' in source ? source.width : 0)
    const sourceHeight = Number('height' in source ? source.height : 0)
    const sourceRect = crop ?? { x: 0, y: 0, width: sourceWidth, height: sourceHeight }
    const width = sourceRect.width
    const height = sourceRect.height
    const canvasTexture = this.textures.createCanvas(cutoutKey, width, height)
    if (!canvasTexture || width <= 0 || height <= 0) {
      return
    }

    const context = canvasTexture.getContext()
    context.clearRect(0, 0, width, height)
    context.drawImage(
      source,
      sourceRect.x,
      sourceRect.y,
      sourceRect.width,
      sourceRect.height,
      0,
      0,
      width,
      height,
    )

    const imageData = context.getImageData(0, 0, width, height)
    const data = imageData.data
    const visited = new Uint8Array(width * height)
    const queue: number[] = []

    const enqueue = (index: number): void => {
      if (visited[index] || !isLightNeutralPixel(data, index)) {
        return
      }

      visited[index] = 1
      queue.push(index)
    }

    for (let x = 0; x < width; x += 1) {
      enqueue(x)
      enqueue((height - 1) * width + x)
    }

    for (let y = 1; y < height - 1; y += 1) {
      enqueue(y * width)
      enqueue(y * width + width - 1)
    }

    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const index = queue[cursor]
      const x = index % width
      const y = Math.floor(index / width)

      if (x > 0) enqueue(index - 1)
      if (x < width - 1) enqueue(index + 1)
      if (y > 0) enqueue(index - width)
      if (y < height - 1) enqueue(index + width)
    }

    for (let index = 0; index < visited.length; index += 1) {
      if (!visited[index]) {
        continue
      }

      data[index * 4 + 3] = 0
    }

    context.putImageData(imageData, 0, 0)
    canvasTexture.refresh()
  }

  private createSlingshotBlockArt(
    material: SlingshotMaterial,
    x: number,
    y: number,
    width: number,
    height: number,
  ): Phaser.GameObjects.Image {
    const textureKey = slingshotMaterialTextureKey(material, width, height)
    return this.add
      .image(x, y, textureKey)
      .setDisplaySize(width * slingshotArtWidthScale(material, width, height), height * slingshotArtHeightScale(material, width, height))
      .setDepth(7)
  }

  private createSlingshotTargetArt(x: number, y: number, size: number): Phaser.GameObjects.Image {
    return this.add.image(x, y, ASTRAL_CUTOUT_TEXTURES.target).setDisplaySize(size, size).setDepth(8)
  }

  private createSlingshotProjectileArt(x: number, y: number): Phaser.GameObjects.Image {
    return this.add.image(x, y, ASTRAL_CUTOUT_TEXTURES.projectile).setDisplaySize(58, 58).setDepth(9)
  }

  private createSlingshotShadow(x: number, y: number, width: number, height: number): Phaser.GameObjects.Ellipse {
    return this.add
      .ellipse(x, y, width, height, 0x020507, 0.28)
      .setDepth(5)
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
  }

  private createSlingshotGlow(x: number, y: number, size: number, color: string): Phaser.GameObjects.Shape {
    return this.add
      .circle(x, y, size * 0.5, parseColor(color), 0.14)
      .setDepth(6)
      .setBlendMode(Phaser.BlendModes.ADD)
  }

  private updateSlingshotProjectileTrail(projectile: MatterShape): void {
    if (!this.slingshot || !this.slingshot.projectileLaunched || projectile.body.speed < 2.8) {
      return
    }

    if (this.time.now - this.slingshot.lastTrailAt < 34) {
      return
    }

    this.slingshot.lastTrailAt = this.time.now
    this.emitImpactBurst(
      projectile.x - projectile.body.velocity.x * 0.42,
      projectile.y - projectile.body.velocity.y * 0.42,
      this.blueprint.palette.accent,
      4,
      18,
      0.56,
    )
  }

  private updateFloatingShards(): void {
    const delta = this.game.loop.delta / 1000

    for (const shard of [...this.shards]) {
      shard.shape.x += shard.vx * delta
      shard.shape.y += shard.vy * delta
      shard.vy += 36 * delta
      shard.shape.alpha = Math.max(0, shard.shape.alpha - delta * 1.35)

      if (shard.shape.alpha <= 0.02 || shard.shape.y > GAME_HEIGHT + 40) {
        shard.shape.destroy()
        this.shards.splice(this.shards.indexOf(shard), 1)
      }
    }
  }

  private refreshHud(): void {
    const comboSuffix =
      this.blueprint.systems.specialMechanic === 'combo-chain' ? `   Combo x${this.combo}` : ''

    if (this.runtimeProfile === 'slingshot-destruction') {
      const loadedShot = this.slingshot?.projectile ? 1 : 0
      const levelLabel = this.slingshot ? `   Chamber ${this.slingshot.levelIndex + 1}/${this.slingshot.levels.length}` : ''
      this.statusText.setText(
        `Cores ${this.slingshot?.targets.length ?? 0}   Seeds ${(this.slingshot?.shotsRemaining ?? 0) + loadedShot}   Score ${this.score}${levelLabel}`,
      )
      return
    }

    if (this.runtimeProfile === 'relic-hunt' || this.runtimeProfile === 'platformer-expedition') {
      this.statusText.setText(
        `Health ${Math.max(0, this.health)}   Relics ${this.relicsRemaining}   Score ${this.score}${comboSuffix}`,
      )
      return
    }

    const burstLine =
      this.blueprint.systems.combat === 'pulse-burst'
        ? this.burstCooldown > 0
          ? `   Burst ${this.burstCooldown.toFixed(1)}s`
          : '   Burst ready'
        : ''

    this.statusText.setText(
      `Health ${Math.max(0, this.health)}   Time ${Math.max(0, this.timeLeft)}   Score ${this.score}${comboSuffix}${burstLine}`,
    )
  }

  private finishGame(won: boolean, summary: string): void {
    if (this.gameEnded) {
      return
    }

    this.gameEnded = true
    this.statusText.setText(won ? 'STATUS: PLAYABLE PROTOTYPE ONLINE' : 'STATUS: LOOP COLLAPSED')
    this.objectiveText.setText([summary, this.blueprint.approximationStrategy])

    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 460, 140, parseColor(this.blueprint.palette.surface), 0.92)
      .setStrokeStyle(2, parseColor(won ? this.blueprint.palette.accentAlt : this.blueprint.palette.danger), 0.95)

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 24, won ? 'PROTOTYPE STABLE' : 'TRY AGAIN', {
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: '28px',
        color: this.blueprint.palette.text,
      })
      .setOrigin(0.5)

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 22, summary, {
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: '13px',
        color: '#d7d0c5',
        align: 'center',
        wordWrap: { width: 380 },
      })
      .setOrigin(0.5)
  }

  private bumpCombo(): void {
    if (this.blueprint.systems.specialMechanic !== 'combo-chain') {
      return
    }

    this.combo = Math.min(6, this.combo + 1)
    this.comboTimer = 3.2
  }

  private addScore(baseScore: number): void {
    const multiplier = this.blueprint.systems.specialMechanic === 'combo-chain' ? this.combo : 1
    this.score += Math.round(baseScore * multiplier)
  }

  private removeEnemy(enemy: MovingShape): void {
    enemy.shape.destroy()
    this.enemies.splice(this.enemies.indexOf(enemy), 1)
  }

  private removeProjectile(projectile: MovingShape): void {
    projectile.shape.destroy()
    this.projectiles.splice(this.projectiles.indexOf(projectile), 1)
  }

  private removeLaneObject(object: LaneObject): void {
    object.shape.destroy()
    this.laneObjects.splice(this.laneObjects.indexOf(object), 1)
  }
}

function defaultTimerForProfile(profile: RuntimeProfile): number {
  switch (profile) {
    case 'lane-runner':
      return 45
    case 'platformer-expedition':
      return 55
    case 'relic-hunt':
      return 0
    case 'slingshot-destruction':
      return 0
    default:
      return 60
  }
}

function slingshotMaterialColor(material: SlingshotMaterial, palette: GamePalette): string {
  switch (material) {
    case 'glass':
      return palette.accentAlt
    case 'brass':
      return palette.accent
    default:
      return palette.surface
  }
}

function slingshotMaterialTextureKey(material: SlingshotMaterial, width: number, height: number): string {
  switch (material) {
    case 'glass':
      return ASTRAL_CUTOUT_TEXTURES.glassPillar
    case 'brass':
      return ASTRAL_CUTOUT_TEXTURES.brassBeam
    case 'wood':
      return width >= height ? ASTRAL_CUTOUT_TEXTURES.woodBeam : ASTRAL_CUTOUT_TEXTURES.woodSupport
    default:
      return ASTRAL_CUTOUT_TEXTURES.woodBeam
  }
}

function isLightNeutralPixel(data: Uint8ClampedArray, index: number): boolean {
  const offset = index * 4
  const red = data[offset]
  const green = data[offset + 1]
  const blue = data[offset + 2]
  const alpha = data[offset + 3]
  const brightest = Math.max(red, green, blue)
  const darkest = Math.min(red, green, blue)

  return alpha < 16 || (brightest > 196 && brightest - darkest < 46)
}

function slingshotArtWidthScale(material: SlingshotMaterial, width: number, height: number): number {
  if (material === 'glass') {
    return 1.35
  }
  if (material === 'brass') {
    return width >= height ? 1.08 : 0.95
  }
  return width >= height ? 1.08 : 1.35
}

function slingshotArtHeightScale(material: SlingshotMaterial, width: number, height: number): number {
  if (material === 'glass') {
    return 1.35
  }
  if (material === 'brass') {
    return width >= height ? 1.28 : 1.1
  }
  return width >= height ? 1.4 : 1.28
}

function bodyBelongsToMatterShape(body: MatterJS.BodyType, shape: MatterShape): boolean {
  if (body === shape.body) {
    return true
  }

  return shape.body.parts.some((part) => part === body)
}

function parseColor(color: string): number {
  return Number.parseInt(color.replace('#', ''), 16)
}

function aabbOverlap(
  left: ShapeObject,
  leftHalfWidth: number,
  leftHalfHeight: number,
  right: ShapeObject,
  rightHalfWidth: number,
  rightHalfHeight: number,
): boolean {
  return (
    Math.abs(left.x - right.x) < leftHalfWidth + rightHalfWidth &&
    Math.abs(left.y - right.y) < leftHalfHeight + rightHalfHeight
  )
}
