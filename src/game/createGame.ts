import Phaser from 'phaser'
import astralBackgroundUrl from '../assets/astral-orchard/background-concept.png'
import astralBrassBeamUrl from '../assets/astral-orchard/brass-beam.png'
import astralGlassPillarUrl from '../assets/astral-orchard/glass-pillar.png'
import astralOrbitCoreUrl from '../assets/astral-orchard/orbit-core.png'
import astralHeroMotionSheetUrl from '../assets/astral-orchard/hero-motion-sheet-v2.png'
import astralStarSeedUrl from '../assets/astral-orchard/star-seed.png'
import astralWoodBeamUrl from '../assets/astral-orchard/wood-beam.png'
import astralWoodSupportUrl from '../assets/astral-orchard/wood-support.png'

import {
  deriveRuntimeProfile,
  type GameBlueprint,
  type GamePalette,
  type RuntimeProfile,
} from '../../shared/game'
import { getGameTypeKit, type GameTypeKit } from '../../shared/gameTypeKits'
import { createGuardiansFieldGameConfig } from './guardiansFieldDemo'
import { getPlatformerCourse, getRelicHuntLayout } from './gameTypeStageLayouts'
import {
  createRuntimeFinishOverlay,
  createRuntimeHud,
  createRuntimePlayer,
  resolveFinishStatus,
} from './runtimeSceneScaffold'
import { getRuntimeSceneTemplate, type RuntimeSceneTemplate } from './runtimeTemplates'

const GAME_WIDTH = 960
const GAME_HEIGHT = 540

type ShapeObject = Phaser.GameObjects.Shape
type RuntimeVisualVariant =
  | 'enemy-chaser'
  | 'enemy-patroller'
  | 'projectile'
  | 'shard'
  | 'relic'
  | 'lane-hazard'
  | 'lane-pickup'

type MovingShape = {
  shape: ShapeObject
  vx: number
  vy: number
  minX?: number
  maxX?: number
  art?: Phaser.GameObjects.Image
  shadow?: Phaser.GameObjects.Ellipse
  variant?: RuntimeVisualVariant
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
  art?: Phaser.GameObjects.Image
  shadow?: Phaser.GameObjects.Ellipse
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
  idleA: 'astral-hero-sprite-idle-a',
  idleB: 'astral-hero-sprite-idle-b',
  stepA: 'astral-hero-sprite-step-a',
  stepB: 'astral-hero-sprite-step-b',
  brace: 'astral-hero-sprite-brace',
  pullLight: 'astral-hero-sprite-pull-light',
  pullHeavy: 'astral-hero-sprite-pull-heavy',
  release: 'astral-hero-sprite-release',
} as const

type AstralHeroPose = keyof typeof ASTRAL_HERO_SPRITES

const ASTRAL_HERO_SOURCE_RECTS: Record<AstralHeroPose, TextureCrop> = {
  idleA: { x: 0, y: 120, width: 272, height: 468 },
  idleB: { x: 272, y: 120, width: 271, height: 468 },
  stepA: { x: 543, y: 120, width: 271, height: 468 },
  stepB: { x: 814, y: 120, width: 272, height: 468 },
  brace: { x: 1086, y: 120, width: 272, height: 468 },
  pullLight: { x: 1358, y: 120, width: 271, height: 468 },
  pullHeavy: { x: 1629, y: 120, width: 271, height: 468 },
  release: { x: 1900, y: 120, width: 272, height: 468 },
}

const ASTRAL_HERO_DISPLAY: Record<AstralHeroPose, { width: number; height: number; originX: number }> = {
  idleA: { width: 78, height: 134, originX: 0.48 },
  idleB: { width: 78, height: 134, originX: 0.48 },
  stepA: { width: 78, height: 134, originX: 0.48 },
  stepB: { width: 78, height: 134, originX: 0.48 },
  brace: { width: 78, height: 134, originX: 0.47 },
  pullLight: { width: 78, height: 134, originX: 0.45 },
  pullHeavy: { width: 78, height: 134, originX: 0.44 },
  release: { width: 78, height: 134, originX: 0.44 },
}

type TextureCrop = {
  x: number
  y: number
  width: number
  height: number
}

const RUNTIME_TEXTURE_SUFFIXES = {
  heroTopIdle: 'hero-top-idle',
  heroTopStepA: 'hero-top-step-a',
  heroTopStepB: 'hero-top-step-b',
  heroRunnerStepA: 'hero-runner-step-a',
  heroRunnerStepB: 'hero-runner-step-b',
  heroSideIdle: 'hero-side-idle',
  heroSideRunA: 'hero-side-run-a',
  heroSideRunB: 'hero-side-run-b',
  heroSideJump: 'hero-side-jump',
  enemyChaserA: 'enemy-chaser-a',
  enemyChaserB: 'enemy-chaser-b',
  enemyPatrollerA: 'enemy-patroller-a',
  enemyPatrollerB: 'enemy-patroller-b',
  projectile: 'projectile',
  shard: 'shard',
  relic: 'relic',
  laneHazard: 'lane-hazard',
  lanePickup: 'lane-pickup',
  platform: 'platform',
} as const

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
  levelFocus: { x: number; y: number }
  dragGuide: Phaser.GameObjects.Graphics
  projectile: MatterShape | null
  projectileLaunched: boolean
  dragging: boolean
  dragPointerId: number | null
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

const SLINGSHOT_MAX_PULL = 128
const SLINGSHOT_VERTICAL_PULL = 98
const SLINGSHOT_DRAG_RADIUS = 38
const SLINGSHOT_ANCHOR_GRAB_RADIUS = 54
const SLINGSHOT_RELEASE_MIN_PULL = 16
const SLINGSHOT_PROJECTILE_RADIUS = 18
const MATTER_BASE_DELTA = 1000 / 60
const SLINGSHOT_LEVELS: SlingshotLevel[] = [
  {
    name: 'Lantern Nursery',
    shots: 5,
    note: 'Crack the canopy, let the wooden foot give way, and free the first orbit cores.',
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
    name: 'Moonglass Arcade',
    shots: 4,
    note: 'The glass ribs are fragile. Break the arch high and let the dome fold into itself.',
    blocks: [
      { x: 624, y: GAME_HEIGHT - 96, width: 76, height: 22, material: 'wood' },
      { x: 714, y: GAME_HEIGHT - 96, width: 76, height: 22, material: 'wood' },
      { x: 804, y: GAME_HEIGHT - 96, width: 76, height: 22, material: 'wood' },
      { x: 652, y: GAME_HEIGHT - 144, width: 22, height: 86, material: 'glass' },
      { x: 776, y: GAME_HEIGHT - 144, width: 22, height: 86, material: 'glass' },
      { x: 714, y: GAME_HEIGHT - 188, width: 164, height: 20, material: 'brass' },
      { x: 680, y: GAME_HEIGHT - 232, width: 22, height: 70, material: 'glass' },
      { x: 748, y: GAME_HEIGHT - 232, width: 22, height: 70, material: 'glass' },
      { x: 714, y: GAME_HEIGHT - 268, width: 118, height: 18, material: 'wood' },
    ],
    targets: [
      { x: 680, y: GAME_HEIGHT - 286, integrity: 3.9 },
      { x: 748, y: GAME_HEIGHT - 286, integrity: 3.9 },
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
    name: 'Bellspire Nest',
    shots: 5,
    note: 'This tower punishes direct shots. Break the low hinge and let the top bell carriage drop.',
    blocks: [
      { x: 646, y: GAME_HEIGHT - 96, width: 74, height: 22, material: 'wood' },
      { x: 734, y: GAME_HEIGHT - 96, width: 74, height: 22, material: 'wood' },
      { x: 690, y: GAME_HEIGHT - 140, width: 24, height: 86, material: 'glass' },
      { x: 780, y: GAME_HEIGHT - 140, width: 24, height: 86, material: 'glass' },
      { x: 734, y: GAME_HEIGHT - 184, width: 160, height: 20, material: 'brass' },
      { x: 734, y: GAME_HEIGHT - 232, width: 24, height: 76, material: 'wood' },
      { x: 692, y: GAME_HEIGHT - 270, width: 110, height: 18, material: 'glass' },
      { x: 776, y: GAME_HEIGHT - 304, width: 22, height: 66, material: 'glass' },
      { x: 734, y: GAME_HEIGHT - 334, width: 150, height: 18, material: 'brass' },
    ],
    targets: [
      { x: 694, y: GAME_HEIGHT - 294, integrity: 4.4 },
      { x: 776, y: GAME_HEIGHT - 356, integrity: 4.7 },
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
  {
    name: 'Crown Of The Orchard',
    shots: 6,
    note: 'Final chamber. Peel the wood braces first, then ring through the brass crown.',
    blocks: [
      { x: 618, y: GAME_HEIGHT - 94, width: 70, height: 22, material: 'wood' },
      { x: 696, y: GAME_HEIGHT - 94, width: 70, height: 22, material: 'wood' },
      { x: 774, y: GAME_HEIGHT - 94, width: 70, height: 22, material: 'wood' },
      { x: 852, y: GAME_HEIGHT - 94, width: 70, height: 22, material: 'wood' },
      { x: 656, y: GAME_HEIGHT - 138, width: 22, height: 84, material: 'glass' },
      { x: 814, y: GAME_HEIGHT - 138, width: 22, height: 84, material: 'glass' },
      { x: 734, y: GAME_HEIGHT - 182, width: 198, height: 20, material: 'brass' },
      { x: 700, y: GAME_HEIGHT - 226, width: 22, height: 74, material: 'wood' },
      { x: 768, y: GAME_HEIGHT - 226, width: 22, height: 74, material: 'wood' },
      { x: 734, y: GAME_HEIGHT - 264, width: 136, height: 18, material: 'glass' },
      { x: 734, y: GAME_HEIGHT - 308, width: 24, height: 70, material: 'brass' },
      { x: 686, y: GAME_HEIGHT - 344, width: 118, height: 18, material: 'glass' },
      { x: 782, y: GAME_HEIGHT - 344, width: 118, height: 18, material: 'glass' },
      { x: 734, y: GAME_HEIGHT - 384, width: 204, height: 18, material: 'brass' },
    ],
    targets: [
      { x: 686, y: GAME_HEIGHT - 364, integrity: 4.4 },
      { x: 782, y: GAME_HEIGHT - 364, integrity: 4.4 },
      { x: 734, y: GAME_HEIGHT - 414, integrity: 5.6 },
    ],
  },
]

export function createGameConfig(
  target: HTMLDivElement,
  blueprint: GameBlueprint,
): Phaser.Types.Core.GameConfig {
  if (blueprint.slug === 'gato-y-perro-guardianes-del-campo-magico') {
    return createGuardiansFieldGameConfig(target, blueprint)
  }

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
  private readonly runtimeTemplate: RuntimeSceneTemplate
  private readonly gameTypeDefinition: GameTypeKit
  private readonly runtimeTexturePrefix: string
  private readonly runtimeTextureKeys: string[] = []
  private keys?: Record<string, Phaser.Input.Keyboard.Key>
  private player?: ShapeObject
  private playerArt?: Phaser.GameObjects.Image
  private playerShadow?: Phaser.GameObjects.Ellipse
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
  private audioContext: AudioContext | null = null
  private lastSfxAt = 0

  constructor(blueprint: GameBlueprint, runtimeProfile: RuntimeProfile) {
    super('generated-game')
    this.blueprint = blueprint
    this.runtimeProfile = runtimeProfile
    this.runtimeTemplate = getRuntimeSceneTemplate(runtimeProfile)
    this.gameTypeDefinition = getGameTypeKit(blueprint.gameTypeKit)
    this.runtimeTexturePrefix = `runtime-${runtimeProfile}-${blueprint.slug}-${Math.random().toString(36).slice(2, 8)}`
  }

  preload(): void {
    if (this.runtimeProfile !== 'slingshot-destruction') {
      return
    }

    this.load.image(ASTRAL_TEXTURES.background, astralBackgroundUrl)
    this.load.image(ASTRAL_TEXTURES.spriteSheet, astralHeroMotionSheetUrl)
    this.load.image(ASTRAL_TEXTURES.projectile, astralStarSeedUrl)
    this.load.image(ASTRAL_TEXTURES.target, astralOrbitCoreUrl)
    this.load.image(ASTRAL_TEXTURES.woodBeam, astralWoodBeamUrl)
    this.load.image(ASTRAL_TEXTURES.woodSupport, astralWoodSupportUrl)
    this.load.image(ASTRAL_TEXTURES.glassPillar, astralGlassPillarUrl)
    this.load.image(ASTRAL_TEXTURES.brassBeam, astralBrassBeamUrl)
  }

  create(): void {
    this.resetSessionState()
    this.timeLeft = this.runtimeTemplate.timerSeconds

    this.prepareAstralCutoutTextures()
    this.prepareRuntimeTextures()
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
      this.input.off('pointerupoutside', this.handlePointerUp, this)
      this.input.off('gameout', this.handlePointerLeaveGame, this)
      if (this.runtimeProfile === 'slingshot-destruction') {
        this.matter.world.off('collisionstart', this.handleSlingshotCollision, this)
      }
      for (const key of this.runtimeTextureKeys) {
        if (this.textures.exists(key)) {
          this.textures.remove(key)
        }
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

    this.syncRuntimePresentation()
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
    this.playerArt = undefined
    this.playerShadow = undefined
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
    const hud = createRuntimeHud(this, this.runtimeTemplate, this.blueprint, this.runtimeProfile, GAME_HEIGHT)
    this.statusText = hud.statusText
    this.objectiveText = hud.objectiveText
    this.supportText = hud.supportText
  }

  private prepareRuntimeTextures(): void {
    if (this.runtimeProfile === 'slingshot-destruction') {
      return
    }

    const palette = this.blueprint.palette

    this.generateRuntimeTexture(this.runtimeTextureKey(RUNTIME_TEXTURE_SUFFIXES.heroTopIdle), 72, 72, (graphics) => {
      this.drawTopHeroTexture(graphics, palette, 0, 0)
    })
    this.generateRuntimeTexture(this.runtimeTextureKey(RUNTIME_TEXTURE_SUFFIXES.heroTopStepA), 72, 72, (graphics) => {
      this.drawTopHeroTexture(graphics, palette, -5, -0.16)
    })
    this.generateRuntimeTexture(this.runtimeTextureKey(RUNTIME_TEXTURE_SUFFIXES.heroTopStepB), 72, 72, (graphics) => {
      this.drawTopHeroTexture(graphics, palette, 5, 0.16)
    })
    this.generateRuntimeTexture(this.runtimeTextureKey(RUNTIME_TEXTURE_SUFFIXES.heroRunnerStepA), 76, 84, (graphics) => {
      this.drawRunnerHeroTexture(graphics, palette, -1)
    })
    this.generateRuntimeTexture(this.runtimeTextureKey(RUNTIME_TEXTURE_SUFFIXES.heroRunnerStepB), 76, 84, (graphics) => {
      this.drawRunnerHeroTexture(graphics, palette, 1)
    })
    this.generateRuntimeTexture(this.runtimeTextureKey(RUNTIME_TEXTURE_SUFFIXES.heroSideIdle), 72, 84, (graphics) => {
      this.drawSideHeroTexture(graphics, palette, 'idle')
    })
    this.generateRuntimeTexture(this.runtimeTextureKey(RUNTIME_TEXTURE_SUFFIXES.heroSideRunA), 72, 84, (graphics) => {
      this.drawSideHeroTexture(graphics, palette, 'run-a')
    })
    this.generateRuntimeTexture(this.runtimeTextureKey(RUNTIME_TEXTURE_SUFFIXES.heroSideRunB), 72, 84, (graphics) => {
      this.drawSideHeroTexture(graphics, palette, 'run-b')
    })
    this.generateRuntimeTexture(this.runtimeTextureKey(RUNTIME_TEXTURE_SUFFIXES.heroSideJump), 72, 84, (graphics) => {
      this.drawSideHeroTexture(graphics, palette, 'jump')
    })
    this.generateRuntimeTexture(this.runtimeTextureKey(RUNTIME_TEXTURE_SUFFIXES.enemyChaserA), 52, 52, (graphics) => {
      this.drawChaserEnemyTexture(graphics, palette, -1)
    })
    this.generateRuntimeTexture(this.runtimeTextureKey(RUNTIME_TEXTURE_SUFFIXES.enemyChaserB), 52, 52, (graphics) => {
      this.drawChaserEnemyTexture(graphics, palette, 1)
    })
    this.generateRuntimeTexture(this.runtimeTextureKey(RUNTIME_TEXTURE_SUFFIXES.enemyPatrollerA), 64, 44, (graphics) => {
      this.drawPatrollerTexture(graphics, palette, -1)
    })
    this.generateRuntimeTexture(this.runtimeTextureKey(RUNTIME_TEXTURE_SUFFIXES.enemyPatrollerB), 64, 44, (graphics) => {
      this.drawPatrollerTexture(graphics, palette, 1)
    })
    this.generateRuntimeTexture(this.runtimeTextureKey(RUNTIME_TEXTURE_SUFFIXES.projectile), 28, 28, (graphics) => {
      this.drawProjectileTexture(graphics, palette)
    })
    this.generateRuntimeTexture(this.runtimeTextureKey(RUNTIME_TEXTURE_SUFFIXES.shard), 24, 24, (graphics) => {
      this.drawShardTexture(graphics, palette)
    })
    this.generateRuntimeTexture(this.runtimeTextureKey(RUNTIME_TEXTURE_SUFFIXES.relic), 32, 42, (graphics) => {
      this.drawRelicTexture(graphics, palette)
    })
    this.generateRuntimeTexture(this.runtimeTextureKey(RUNTIME_TEXTURE_SUFFIXES.laneHazard), 128, 56, (graphics) => {
      this.drawLaneHazardTexture(graphics, palette)
    })
    this.generateRuntimeTexture(this.runtimeTextureKey(RUNTIME_TEXTURE_SUFFIXES.lanePickup), 40, 40, (graphics) => {
      this.drawLanePickupTexture(graphics, palette)
    })
    this.generateRuntimeTexture(this.runtimeTextureKey(RUNTIME_TEXTURE_SUFFIXES.platform), 240, 72, (graphics) => {
      this.drawPlatformTexture(graphics, palette)
    })
  }

  private runtimeTextureKey(suffix: string): string {
    return `${this.runtimeTexturePrefix}-${suffix}`
  }

  private generateRuntimeTexture(
    key: string,
    width: number,
    height: number,
    draw: (graphics: Phaser.GameObjects.Graphics) => void,
  ): void {
    if (this.textures.exists(key)) {
      return
    }

    const graphics = this.make.graphics({ x: 0, y: 0, add: false })
    draw(graphics)
    graphics.generateTexture(key, width, height)
    graphics.destroy()
    this.runtimeTextureKeys.push(key)
  }

  private createAttachedRuntimeArt(
    textureKey: string,
    x: number,
    y: number,
    width: number,
    height: number,
    depth: number,
    shadowWidth: number,
    shadowHeight: number,
    shadowAlpha = 0.18,
  ): { art: Phaser.GameObjects.Image; shadow: Phaser.GameObjects.Ellipse } {
    const shadow = this.add
      .ellipse(x, y + height * 0.32, shadowWidth, shadowHeight, 0x02070d, shadowAlpha)
      .setDepth(depth - 1)
    const art = this.add.image(x, y, textureKey).setDisplaySize(width, height).setDepth(depth)

    return { art, shadow }
  }

  private drawBackdrop(palette: GamePalette): void {
    if (this.runtimeProfile === 'slingshot-destruction') {
      this.drawAstralBackdrop(palette)
      return
    }

    const graphics = this.add.graphics()
    const bg = parseColor(palette.bg)
    const surface = parseColor(palette.surface)
    const accent = parseColor(palette.accent)
    const accentAlt = parseColor(palette.accentAlt)

    for (let i = 0; i < 18; i += 1) {
      const t = i / 17
      graphics.fillStyle(mixColors(bg, surface, 0.08 + t * 0.36), 1)
      graphics.fillRect(0, (GAME_HEIGHT / 18) * i, GAME_WIDTH, GAME_HEIGHT / 18 + 2)
    }

    graphics.fillStyle(accent, 0.11)
    graphics.fillCircle(150, 110, 96)
    graphics.fillStyle(accentAlt, 0.09)
    graphics.fillCircle(GAME_WIDTH - 180, 96, 84)

    for (let i = 0; i < 26; i += 1) {
      graphics.fillStyle(i % 4 === 0 ? accentAlt : accent, 0.04 + (i % 3) * 0.012)
      graphics.fillCircle(30 + i * 36, 58 + (i % 5) * 18, 2 + (i % 2))
    }

    switch (this.runtimeProfile) {
      case 'lane-runner':
        graphics.fillStyle(shadeColor(surface, 0.08), 0.86)
        graphics.fillTriangle(220, GAME_HEIGHT, 740, GAME_HEIGHT, 480, 136)
        graphics.fillStyle(shadeColor(surface, -0.04), 0.92)
        graphics.fillTriangle(310, GAME_HEIGHT, 650, GAME_HEIGHT, 480, 176)
        graphics.lineStyle(4, accentAlt, 0.3)
        graphics.lineBetween(398, GAME_HEIGHT, 474, 172)
        graphics.lineBetween(562, GAME_HEIGHT, 486, 172)
        graphics.lineStyle(2, accent, 0.22)
        for (let y = 0; y < 6; y += 1) {
          graphics.lineBetween(450 + y * 4, GAME_HEIGHT - y * 82, 470 + y * 2, GAME_HEIGHT - y * 98)
          graphics.lineBetween(510 - y * 4, GAME_HEIGHT - y * 82, 490 - y * 2, GAME_HEIGHT - y * 98)
        }
        break
      case 'platformer-expedition':
        graphics.fillStyle(shadeColor(surface, -0.08), 0.38)
        graphics.fillEllipse(180, 380, 340, 130)
        graphics.fillEllipse(480, 340, 420, 120)
        graphics.fillEllipse(810, 360, 320, 118)
        graphics.fillStyle(accentAlt, 0.08)
        for (let i = 0; i < 5; i += 1) {
          graphics.fillEllipse(120 + i * 190, 120 + (i % 2) * 22, 140, 38)
        }
        break
      case 'relic-hunt':
        graphics.fillStyle(shadeColor(surface, -0.04), 0.22)
        graphics.fillCircle(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.56, 170)
        graphics.lineStyle(2, accentAlt, 0.22)
        graphics.strokeCircle(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.56, 144)
        graphics.strokeCircle(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.56, 104)
        break
      default:
        graphics.fillStyle(shadeColor(surface, -0.06), 0.2)
        graphics.fillCircle(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.56, 168)
        graphics.lineStyle(2, accent, 0.12)
        graphics.strokeCircle(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.56, 196)
        break
    }

    graphics.fillStyle(surface, 0.18)
    for (let i = 0; i < 8; i += 1) {
      graphics.fillRoundedRect(48 + i * 116, 36 + (i % 2) * 26, 140, 278, 22)
    }

    graphics.lineStyle(1, accentAlt, 0.08)
    for (let x = 0; x <= GAME_WIDTH; x += 48) {
      graphics.lineBetween(x, 0, x, GAME_HEIGHT)
    }
    for (let y = 0; y <= GAME_HEIGHT; y += 48) {
      graphics.lineBetween(0, y, GAME_WIDTH, y)
    }

    if (this.runtimeProfile === 'platformer-expedition' || this.runtimeProfile === 'slingshot-destruction') {
      graphics.fillStyle(surface, 0.84)
      graphics.fillRect(0, GAME_HEIGHT - 72, GAME_WIDTH, 72)
      graphics.lineStyle(3, accent, 0.22)
      graphics.lineBetween(0, GAME_HEIGHT - 72, GAME_WIDTH, GAME_HEIGHT - 72)
    }
  }

  private drawTopHeroTexture(
    graphics: Phaser.GameObjects.Graphics,
    palette: GamePalette,
    strideOffset: number,
    lean: number,
  ): void {
    const accent = parseColor(palette.accent)
    const accentAlt = parseColor(palette.accentAlt)
    const surface = parseColor(palette.surface)
    const text = parseColor(palette.text)
    const bodyX = 36 + lean * 6
    const cloakY = 34 + Math.abs(strideOffset) * 0.22

    graphics.fillStyle(accentAlt, 0.12)
    graphics.fillCircle(36, 36, 22)
    graphics.fillStyle(shadeColor(surface, -0.16), 0.98)
    graphics.fillTriangle(36, 16, 16 + lean * 4, 48, 56 + lean * 4, 48)
    graphics.fillStyle(accent, 0.98)
    graphics.fillCircle(bodyX, cloakY, 15)
    graphics.fillStyle(shadeColor(accentAlt, -0.08), 1)
    graphics.fillEllipse(bodyX, 33, 18, 22)
    graphics.fillStyle(shadeColor(surface, 0.2), 0.98)
    graphics.fillEllipse(bodyX - lean * 2, 25, 16, 14)
    graphics.fillStyle(text, 0.92)
    graphics.fillCircle(bodyX - 4 + lean * 2, 25, 1.8)
    graphics.fillCircle(bodyX + 4 + lean * 2, 25, 1.8)
    graphics.lineStyle(3, text, 0.82)
    graphics.lineBetween(24, 46, 19 + strideOffset * 0.36, 56)
    graphics.lineBetween(48, 46, 53 - strideOffset * 0.36, 56)
    graphics.lineStyle(2, accentAlt, 0.74)
    graphics.lineBetween(24, 36, 15 + strideOffset * 0.24, 42)
    graphics.lineBetween(48, 36, 57 - strideOffset * 0.24, 42)
  }

  private drawRunnerHeroTexture(
    graphics: Phaser.GameObjects.Graphics,
    palette: GamePalette,
    stride: -1 | 1,
  ): void {
    const accent = parseColor(palette.accent)
    const accentAlt = parseColor(palette.accentAlt)
    const surface = parseColor(palette.surface)
    const text = parseColor(palette.text)

    graphics.fillStyle(accentAlt, 0.12)
    graphics.fillCircle(38, 44, 26)
    graphics.fillStyle(shadeColor(surface, 0.16), 1)
    graphics.fillEllipse(38, 20, 18, 16)
    graphics.fillStyle(shadeColor(accent, -0.08), 1)
    graphics.fillRoundedRect(24, 28, 28, 26, 12)
    graphics.fillStyle(accentAlt, 0.98)
    graphics.fillTriangle(38, 26, 22, 42, 54, 42)
    graphics.fillStyle(text, 0.9)
    graphics.fillCircle(34, 20, 1.8)
    graphics.fillCircle(42, 20, 1.8)
    graphics.lineStyle(6, shadeColor(surface, -0.18), 0.98)
    graphics.lineBetween(28, 52, 24 - stride * 4, 68)
    graphics.lineBetween(48, 52, 52 + stride * 4, 68)
    graphics.lineStyle(5, shadeColor(accent, 0.14), 0.94)
    graphics.lineBetween(26, 34, 16 - stride * 3, 46)
    graphics.lineBetween(50, 34, 60 + stride * 3, 46)
    graphics.fillStyle(accent, 0.98)
    graphics.fillTriangle(38, 18, 28, 9, 48, 9)
  }

  private drawSideHeroTexture(
    graphics: Phaser.GameObjects.Graphics,
    palette: GamePalette,
    pose: 'idle' | 'run-a' | 'run-b' | 'jump',
  ): void {
    const accent = parseColor(palette.accent)
    const accentAlt = parseColor(palette.accentAlt)
    const surface = parseColor(palette.surface)
    const text = parseColor(palette.text)
    const runPhase = pose === 'run-a' ? -1 : pose === 'run-b' ? 1 : 0
    const jumpLift = pose === 'jump' ? -8 : 0

    graphics.fillStyle(accentAlt, 0.08)
    graphics.fillEllipse(34, 54 + jumpLift, 26, 10)
    graphics.fillStyle(shadeColor(surface, 0.16), 1)
    graphics.fillEllipse(36, 18 + jumpLift, 18, 16)
    graphics.fillStyle(text, 0.88)
    graphics.fillCircle(40, 18 + jumpLift, 1.7)
    graphics.fillStyle(shadeColor(accent, -0.08), 1)
    graphics.fillRoundedRect(24, 28 + jumpLift, 22, 24, 10)
    graphics.fillStyle(accentAlt, 0.96)
    graphics.fillTriangle(24, 32 + jumpLift, 12, 48 + jumpLift, 32, 40 + jumpLift)
    graphics.lineStyle(5, shadeColor(surface, -0.16), 0.98)
    if (pose === 'jump') {
      graphics.lineBetween(28, 52 + jumpLift, 20, 66 + jumpLift)
      graphics.lineBetween(40, 52 + jumpLift, 46, 66 + jumpLift)
    } else {
      graphics.lineBetween(28, 52 + jumpLift, 22 - runPhase * 4, 68)
      graphics.lineBetween(40, 52 + jumpLift, 44 + runPhase * 4, 68)
    }
    graphics.lineStyle(4, shadeColor(accent, 0.16), 0.94)
    graphics.lineBetween(28, 34 + jumpLift, 18 - runPhase * 2, 44 + jumpLift)
    graphics.lineBetween(42, 34 + jumpLift, 48 + runPhase * 3, 40 + jumpLift)
    graphics.fillStyle(accent, 0.94)
    graphics.fillTriangle(38, 18 + jumpLift, 30, 10 + jumpLift, 48, 13 + jumpLift)
  }

  private drawChaserEnemyTexture(
    graphics: Phaser.GameObjects.Graphics,
    palette: GamePalette,
    phase: -1 | 1,
  ): void {
    const danger = parseColor(this.blueprint.palette.danger)
    const accentAlt = parseColor(palette.accentAlt)
    const text = parseColor(palette.text)
    const centerX = 26
    const centerY = 26

    graphics.fillStyle(accentAlt, 0.1)
    graphics.fillCircle(centerX, centerY, 18)
    for (let i = 0; i < 6; i += 1) {
      const angle = (Math.PI * 2 * i) / 6 + phase * 0.12
      const spikeX = centerX + Math.cos(angle) * 18
      const spikeY = centerY + Math.sin(angle) * 18
      graphics.fillStyle(shadeColor(danger, i % 2 === 0 ? -0.12 : 0.08), 0.96)
      graphics.fillTriangle(
        centerX + Math.cos(angle - 0.34) * 11,
        centerY + Math.sin(angle - 0.34) * 11,
        spikeX,
        spikeY,
        centerX + Math.cos(angle + 0.34) * 11,
        centerY + Math.sin(angle + 0.34) * 11,
      )
    }
    graphics.fillStyle(danger, 1)
    graphics.fillCircle(centerX, centerY, 13)
    graphics.fillStyle(text, 0.9)
    graphics.fillCircle(centerX - 4, centerY - 2, 1.8)
    graphics.fillCircle(centerX + 4, centerY - 2, 1.8)
  }

  private drawPatrollerTexture(
    graphics: Phaser.GameObjects.Graphics,
    palette: GamePalette,
    wingTilt: -1 | 1,
  ): void {
    const danger = parseColor(this.blueprint.palette.danger)
    const accentAlt = parseColor(palette.accentAlt)
    const text = parseColor(palette.text)

    graphics.fillStyle(accentAlt, 0.08)
    graphics.fillEllipse(32, 30, 36, 12)
    graphics.fillStyle(shadeColor(danger, -0.08), 1)
    graphics.fillRoundedRect(18, 14, 28, 16, 7)
    graphics.fillStyle(accentAlt, 0.78)
    graphics.fillTriangle(18, 22, 8, 16 + wingTilt * 3, 16, 28)
    graphics.fillTriangle(46, 22, 56, 16 - wingTilt * 3, 48, 28)
    graphics.lineStyle(4, shadeColor(danger, 0.14), 0.94)
    graphics.lineBetween(22, 30, 18 - wingTilt * 2, 38)
    graphics.lineBetween(42, 30, 46 + wingTilt * 2, 38)
    graphics.fillStyle(text, 0.9)
    graphics.fillCircle(27, 21, 1.7)
    graphics.fillCircle(37, 21, 1.7)
  }

  private drawProjectileTexture(graphics: Phaser.GameObjects.Graphics, palette: GamePalette): void {
    const accent = parseColor(palette.accent)
    const accentAlt = parseColor(palette.accentAlt)

    graphics.fillStyle(accentAlt, 0.12)
    graphics.fillCircle(14, 14, 12)
    graphics.fillStyle(shadeColor(accentAlt, -0.04), 0.9)
    graphics.fillTriangle(6, 14, 2, 22, 18, 18)
    graphics.fillStyle(accent, 1)
    graphics.fillCircle(15, 13, 7)
    graphics.fillStyle(0xffffff, 0.68)
    graphics.fillCircle(17, 11, 2.5)
  }

  private drawShardTexture(graphics: Phaser.GameObjects.Graphics, palette: GamePalette): void {
    const accent = parseColor(palette.accent)
    const accentAlt = parseColor(palette.accentAlt)

    graphics.fillStyle(accentAlt, 0.14)
    graphics.fillCircle(12, 12, 10)
    graphics.fillStyle(accent, 0.98)
    graphics.fillTriangle(12, 2, 22, 12, 12, 22)
    graphics.fillTriangle(12, 2, 2, 12, 12, 22)
    graphics.fillStyle(0xffffff, 0.42)
    graphics.fillTriangle(12, 4, 17, 11, 12, 12)
  }

  private drawRelicTexture(graphics: Phaser.GameObjects.Graphics, palette: GamePalette): void {
    const accent = parseColor(palette.accent)
    const accentAlt = parseColor(palette.accentAlt)
    const surface = parseColor(palette.surface)

    graphics.fillStyle(accentAlt, 0.1)
    graphics.fillCircle(16, 18, 14)
    graphics.fillStyle(shadeColor(surface, -0.14), 0.96)
    graphics.fillRoundedRect(8, 18, 16, 18, 6)
    graphics.fillStyle(accent, 1)
    graphics.fillTriangle(16, 2, 26, 18, 16, 30)
    graphics.fillTriangle(16, 2, 6, 18, 16, 30)
    graphics.fillStyle(0xffffff, 0.46)
    graphics.fillTriangle(16, 6, 20, 16, 16, 18)
  }

  private drawLaneHazardTexture(graphics: Phaser.GameObjects.Graphics, palette: GamePalette): void {
    const danger = parseColor(this.blueprint.palette.danger)
    const text = parseColor(palette.text)
    const accentAlt = parseColor(palette.accentAlt)

    graphics.fillStyle(shadeColor(danger, -0.12), 0.98)
    graphics.fillRoundedRect(10, 8, 108, 40, 14)
    graphics.fillStyle(accentAlt, 0.24)
    graphics.fillRoundedRect(16, 14, 96, 12, 6)
    graphics.lineStyle(6, text, 0.84)
    graphics.lineBetween(20, 40, 40, 16)
    graphics.lineBetween(44, 40, 64, 16)
    graphics.lineBetween(68, 40, 88, 16)
    graphics.lineBetween(92, 40, 112, 16)
  }

  private drawLanePickupTexture(graphics: Phaser.GameObjects.Graphics, palette: GamePalette): void {
    const accent = parseColor(palette.accent)
    const accentAlt = parseColor(palette.accentAlt)

    graphics.fillStyle(accentAlt, 0.12)
    graphics.fillCircle(20, 20, 18)
    graphics.fillStyle(accent, 1)
    graphics.fillCircle(20, 20, 11)
    graphics.fillStyle(0xffffff, 0.64)
    graphics.fillEllipse(16, 16, 8, 5)
    graphics.lineStyle(2, accentAlt, 0.8)
    graphics.strokeCircle(20, 20, 14)
  }

  private drawPlatformTexture(graphics: Phaser.GameObjects.Graphics, palette: GamePalette): void {
    const surface = parseColor(palette.surface)
    const accent = parseColor(palette.accent)
    const accentAlt = parseColor(palette.accentAlt)

    graphics.fillStyle(shadeColor(surface, -0.08), 1)
    graphics.fillRoundedRect(0, 16, 240, 34, 14)
    graphics.fillStyle(shadeColor(surface, 0.12), 1)
    graphics.fillRoundedRect(6, 8, 228, 16, 10)
    graphics.fillStyle(accentAlt, 0.24)
    graphics.fillRoundedRect(14, 12, 212, 8, 4)
    graphics.lineStyle(4, accent, 0.24)
    graphics.lineBetween(18, 38, 222, 38)
    graphics.lineStyle(2, accentAlt, 0.2)
    for (let x = 24; x <= 216; x += 36) {
      graphics.lineBetween(x, 22, x - 8, 48)
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
    const player = createRuntimePlayer(this, this.runtimeTemplate, this.blueprint)
    if (!player) {
      return
    }

    this.player = player.player
    this.playerHalfWidth = player.halfWidth
    this.playerHalfHeight = player.halfHeight
    this.player.setAlpha(0.02)
    const textureKey =
      this.runtimeProfile === 'platformer-expedition'
        ? this.runtimeTextureKey(RUNTIME_TEXTURE_SUFFIXES.heroSideIdle)
        : this.runtimeProfile === 'lane-runner'
          ? this.runtimeTextureKey(RUNTIME_TEXTURE_SUFFIXES.heroRunnerStepA)
          : this.runtimeTextureKey(RUNTIME_TEXTURE_SUFFIXES.heroTopIdle)
    const display = this.createAttachedRuntimeArt(
      textureKey,
      this.player.x,
      this.player.y,
      this.runtimeProfile === 'platformer-expedition' ? 64 : this.runtimeProfile === 'lane-runner' ? 68 : 56,
      this.runtimeProfile === 'platformer-expedition' ? 74 : this.runtimeProfile === 'lane-runner' ? 76 : 56,
      9,
      26,
      10,
      0.15,
    )
    this.playerArt = display.art
    this.playerShadow = display.shadow
  }

  private createArenaSurvivor(): void {
    this.objectiveText.setText([
      `${this.blueprint.hero.name}: ${this.blueprint.hero.abilities.join(' • ')}`,
      this.blueprint.winCondition,
    ])
  }

  private updateArenaSurvivor(delta: number): void {
    const tuning = this.gameTypeDefinition.tuning
    this.movePlayerFree(delta)

    if (this.spawnAccumulator >= (tuning?.enemySpawnInterval ?? 1.05)) {
      this.spawnAccumulator = 0
      this.spawnEnemyAtEdge(
        (tuning?.enemyBaseSpeed ?? 72) + Math.min(this.score * (tuning?.enemySpeedScoreFactor ?? 1.2), 100),
      )
    }

    this.handleCombatInput()
    this.updateProjectiles(delta)
    this.updateChasingEnemies(delta, tuning?.chaseMultiplier ?? 0.95)
    this.collectNearbyShards(tuning?.shardCollectRadius ?? 18, tuning?.shardScore ?? 5)
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

    const tuning = this.gameTypeDefinition.tuning
    const lanes = [GAME_WIDTH * 0.32, GAME_WIDTH * 0.5, GAME_WIDTH * 0.68]

    if (this.laneSwitchCooldown <= 0 && Phaser.Input.Keyboard.JustDown(this.keys.LEFT)) {
      this.laneIndex = Math.max(0, this.laneIndex - 1)
      this.laneSwitchCooldown = tuning?.laneSwitchCooldown ?? 0.12
    }
    if (this.laneSwitchCooldown <= 0 && Phaser.Input.Keyboard.JustDown(this.keys.RIGHT)) {
      this.laneIndex = Math.min(2, this.laneIndex + 1)
      this.laneSwitchCooldown = tuning?.laneSwitchCooldown ?? 0.12
    }

    const previousX = this.player.x
    this.player.x = Phaser.Math.Linear(this.player.x, lanes[this.laneIndex], 0.24)
    this.playerVelocity.set(delta > 0 ? (this.player.x - previousX) / delta : 0, 0)

    if (this.spawnAccumulator >= (tuning?.laneSpawnInterval ?? 0.55)) {
      this.spawnAccumulator = 0
      this.spawnLaneWave()
    }

    const moveSpeed = (tuning?.laneMoveSpeedBase ?? 290) + this.score * (tuning?.laneMoveSpeedScoreFactor ?? 1.4)
    for (const item of [...this.laneObjects]) {
      item.shape.y += moveSpeed * delta

      if (item.shape.y > GAME_HEIGHT + 40) {
        this.removeLaneObject(item)
        continue
      }

      if (Phaser.Math.Distance.Between(item.shape.x, item.shape.y, this.player.x, this.player.y) < 28) {
        if (item.kind === 'pickup') {
          this.addScore(tuning?.lanePickupScore ?? 3)
          this.bumpCombo()
          this.cameras.main.flash(120, 102, 210, 199, false)
        } else {
          this.health -= tuning?.laneHazardDamage ?? 18
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

    for (const position of getRelicHuntLayout(this.blueprint.gameTypeKit, GAME_WIDTH, GAME_HEIGHT)) {
      const relic = this.add.circle(
        position.x,
        position.y,
        8,
        parseColor(this.blueprint.palette.accentAlt),
      )
      relic.setAlpha(0.02)
      const display = this.createAttachedRuntimeArt(
        this.runtimeTextureKey(RUNTIME_TEXTURE_SUFFIXES.relic),
        relic.x,
        relic.y,
        30,
        40,
        8,
        22,
        8,
        0.14,
      )
      this.shards.push({ shape: relic, vx: 0, vy: 0, art: display.art, shadow: display.shadow, variant: 'relic' })
    }

    this.relicsRemaining = this.shards.length
  }

  private updateRelicHunt(delta: number): void {
    const tuning = this.gameTypeDefinition.tuning
    this.movePlayerFree(delta)

    if (
      this.spawnAccumulator >= (tuning?.enemySpawnInterval ?? 1.35) &&
      this.enemies.length < (tuning?.relicEnemyCap ?? 10)
    ) {
      this.spawnAccumulator = 0
      this.spawnEnemyAtEdge(tuning?.enemyBaseSpeed ?? 96)
    }

    this.handleCombatInput()
    this.updateProjectiles(delta)
    this.updateChasingEnemies(delta, tuning?.chaseMultiplier ?? 0.8)

    for (const relic of [...this.shards]) {
      if (!this.player) {
        continue
      }

      if (
        Phaser.Math.Distance.Between(relic.shape.x, relic.shape.y, this.player.x, this.player.y) <
        (tuning?.relicCollectRadius ?? 24)
      ) {
        this.destroyMovingShapePresentation(relic)
        this.shards.splice(this.shards.indexOf(relic), 1)
        this.relicsRemaining -= 1
        this.addScore(tuning?.relicPickupScore ?? 8)
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

    const course = getPlatformerCourse(this.blueprint.gameTypeKit, GAME_HEIGHT)
    this.player.setPosition(120, GAME_HEIGHT - 118)
    this.objectiveText.setText([
      `${this.blueprint.hero.name}: ${this.blueprint.noveltyHook}`,
      this.blueprint.winCondition,
    ])

    for (const platform of course.platforms) {
      this.addPlatform(platform.x, platform.y, platform.width, platform.height)
    }

    for (const relic of course.relics) {
      this.spawnRelic(relic.x, relic.y)
    }
    this.relicsRemaining = this.shards.length

    for (const patroller of course.patrollers) {
      this.spawnPatroller(patroller.x, patroller.y, patroller.minX, patroller.maxX)
    }
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
        this.destroyMovingShapePresentation(relic)
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
      anchor: { x: 182, y: GAME_HEIGHT - 134 },
      levelFocus: { x: 696, y: 294 },
      dragGuide: this.add.graphics(),
      projectile: null,
      projectileLaunched: false,
      dragging: false,
      dragPointerId: null,
      shotsRemaining: 0,
      blocks: [],
      targets: [],
      lastReleaseAt: 0,
      levelIndex: 0,
      levels: SLINGSHOT_LEVELS,
      transitioning: false,
      heroBase: { x: 94, y: GAME_HEIGHT - 72 },
      heroPose: 'idleA',
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
          this.runtimeTemplate.slingshot?.controlsHint ??
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

    this.drawSlingshotFrame()
    this.slingshot.heroSprite = this.createSlingshotHeroSprite(this.slingshot.heroBase.x, this.slingshot.heroBase.y)
    this.configureSlingshotCamera()

    this.loadSlingshotLevel(0)
    this.refreshDragGuide()

    this.input.on('pointerdown', this.handlePointerDown, this)
    this.input.on('pointermove', this.handlePointerMove, this)
    this.input.on('pointerup', this.handlePointerUp, this)
    this.input.on('pointerupoutside', this.handlePointerUp, this)
    this.input.on('gameout', this.handlePointerLeaveGame, this)
    this.matter.world.on('collisionstart', this.handleSlingshotCollision, this)
  }

  private updateSlingshotDestruction(): void {
    if (!this.slingshot) {
      return
    }

    this.updateSlingshotKeyboardAim()
    this.updateSlingshotCamera()
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
        projectile.glow?.destroy()
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

  private configureSlingshotCamera(): void {
    const cameraPreset = this.runtimeTemplate.slingshot?.camera
    const camera = this.cameras.main
    camera.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT)
    camera.setRoundPixels(true)
    camera.setZoom(cameraPreset?.snapZoom ?? 1.09)
    this.snapSlingshotCameraTo(cameraPreset?.snapFocus ?? { x: 700, y: 286 }, cameraPreset?.snapZoom ?? 1.09)
  }

  private updateSlingshotCamera(): void {
    if (!this.slingshot) {
      return
    }

    const cameraPreset = this.runtimeTemplate.slingshot?.camera
    let focusX = this.slingshot.levelFocus.x
    let focusY = this.slingshot.levelFocus.y
    let targetZoom = cameraPreset?.idleZoom ?? 1.045

    if (this.slingshot.dragging && this.slingshot.projectile) {
      focusX = Phaser.Math.Linear(
        this.slingshot.levelFocus.x,
        this.slingshot.projectile.x + (cameraPreset?.dragFocusOffset.x ?? 160),
        cameraPreset?.dragFocusBlend.x ?? 0.16,
      )
      focusY = Phaser.Math.Linear(
        this.slingshot.levelFocus.y,
        this.slingshot.projectile.y + (cameraPreset?.dragFocusOffset.y ?? 0),
        cameraPreset?.dragFocusBlend.y ?? 0.12,
      )
      targetZoom = cameraPreset?.dragZoom ?? 1.075
    }

    if (this.slingshot.projectileLaunched && this.slingshot.projectile) {
      focusX = Phaser.Math.Linear(
        this.slingshot.levelFocus.x - 44,
        this.slingshot.projectile.x + (cameraPreset?.flightFocusOffset.x ?? 80),
        cameraPreset?.flightFocusBlend.x ?? 0.72,
      )
      focusY = Phaser.Math.Linear(
        this.slingshot.levelFocus.y,
        this.slingshot.projectile.y + (cameraPreset?.flightFocusOffset.y ?? -10),
        cameraPreset?.flightFocusBlend.y ?? 0.44,
      )
      targetZoom = cameraPreset?.flightZoom ?? 1.11
    }

    if (this.slingshot.transitioning) {
      targetZoom = cameraPreset?.transitionZoom ?? 1.08
    }

    this.applySlingshotCameraTarget(
      {
        x: Phaser.Math.Clamp(focusX, cameraPreset?.clamp.minX ?? 480, cameraPreset?.clamp.maxX ?? 780),
        y: Phaser.Math.Clamp(focusY, cameraPreset?.clamp.minY ?? 220, cameraPreset?.clamp.maxY ?? 356),
      },
      targetZoom,
    )
  }

  private snapSlingshotCameraTo(focus: { x: number; y: number }, zoom: number): void {
    const camera = this.cameras.main
    camera.setZoom(zoom)
    const { scrollX, scrollY } = this.computeCameraScrollForFocus(focus, zoom)
    camera.setScroll(scrollX, scrollY)
  }

  private applySlingshotCameraTarget(focus: { x: number; y: number }, zoom: number): void {
    const camera = this.cameras.main
    const nextZoom = Phaser.Math.Linear(camera.zoom, zoom, 0.08)
    const { scrollX, scrollY } = this.computeCameraScrollForFocus(focus, nextZoom)
    camera.setZoom(nextZoom)
    camera.setScroll(
      Phaser.Math.Linear(camera.scrollX, scrollX, 0.08),
      Phaser.Math.Linear(camera.scrollY, scrollY, 0.08),
    )
  }

  private computeCameraScrollForFocus(focus: { x: number; y: number }, zoom: number): { scrollX: number; scrollY: number } {
    const viewportWidth = this.cameras.main.width / zoom
    const viewportHeight = this.cameras.main.height / zoom

    return {
      scrollX: Phaser.Math.Clamp(focus.x - viewportWidth / 2, 0, GAME_WIDTH - viewportWidth),
      scrollY: Phaser.Math.Clamp(focus.y - viewportHeight / 2, 0, GAME_HEIGHT - viewportHeight),
    }
  }

  private movePlayerFree(delta: number): void {
    if (!this.player || !this.keys) {
      return
    }

    let vx = 0
    let vy = 0
    const speed = this.gameTypeDefinition.tuning?.topDownPlayerSpeed ?? 230

    if (this.keys.W.isDown || this.keys.UP.isDown) vy -= 1
    if (this.keys.S.isDown || this.keys.DOWN.isDown) vy += 1
    if (this.keys.A.isDown || this.keys.LEFT.isDown) vx -= 1
    if (this.keys.D.isDown || this.keys.RIGHT.isDown) vx += 1

    if (vx !== 0) {
      this.facing = vx < 0 ? -1 : 1
    }

    const vector = new Phaser.Math.Vector2(vx, vy).normalize().scale(speed * delta)
    this.playerVelocity.set(delta > 0 ? vector.x / delta : 0, delta > 0 ? vector.y / delta : 0)
    this.player.x = Phaser.Math.Clamp(this.player.x + vector.x, 40, GAME_WIDTH - 40)
    this.player.y = Phaser.Math.Clamp(this.player.y + vector.y, 80, GAME_HEIGHT - 48)
  }

  private movePlayerPlatformer(delta: number): void {
    if (!this.player || !this.keys) {
      return
    }

    const moveSpeed = this.gameTypeDefinition.tuning?.platformerMoveSpeed ?? 240
    const gravity = 880 * this.blueprint.physics.gravity
    const jumpVelocity = this.gameTypeDefinition.tuning?.platformerJumpVelocity ?? 420
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
      this.playerVelocity.y = -jumpVelocity
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

  private syncRuntimePresentation(): void {
    if (this.runtimeProfile === 'slingshot-destruction') {
      return
    }

    this.syncPlayerPresentation()

    for (const enemy of this.enemies) {
      this.syncMovingShapePresentation(enemy, 8)
    }

    for (const projectile of this.projectiles) {
      this.syncMovingShapePresentation(projectile, 9)
    }

    for (const shard of this.shards) {
      this.syncMovingShapePresentation(shard, shard.variant === 'relic' ? 8 : 7)
    }

    for (const item of this.laneObjects) {
      this.syncMovingShapePresentation(item, 8)
    }

    for (const platform of this.platforms) {
      platform.art?.setPosition(platform.x, platform.y + 2).setDepth(6)
      platform.shadow?.setPosition(platform.x, platform.y + platform.height * 0.38).setDepth(5)
    }
  }

  private syncPlayerPresentation(): void {
    if (!this.player || !this.playerArt || !this.playerShadow) {
      return
    }

    const movingX = Math.abs(this.playerVelocity.x) > 24
    const movingY = Math.abs(this.playerVelocity.y) > 24
    const stepFrame = Math.floor(this.time.now / 120) % 2 === 0

    if (this.runtimeProfile === 'platformer-expedition') {
      const textureKey = !this.onGround
        ? this.runtimeTextureKey(RUNTIME_TEXTURE_SUFFIXES.heroSideJump)
        : movingX
          ? this.runtimeTextureKey(
              stepFrame ? RUNTIME_TEXTURE_SUFFIXES.heroSideRunA : RUNTIME_TEXTURE_SUFFIXES.heroSideRunB,
            )
          : this.runtimeTextureKey(RUNTIME_TEXTURE_SUFFIXES.heroSideIdle)
      const bob = movingX && this.onGround ? Math.sin(this.time.now * 0.024) * 1.6 : 0
      const stretchY = !this.onGround ? 1.04 : 1
      this.playerArt
        .setTexture(textureKey)
        .setPosition(this.player.x, this.player.y - 6 + bob)
        .setScale(this.facing < 0 ? -1 : 1, stretchY)
        .setRotation(0)
      this.playerShadow.setPosition(this.player.x, this.player.y + 16)
      return
    }

    if (this.runtimeProfile === 'lane-runner') {
      const textureKey = this.runtimeTextureKey(
        stepFrame ? RUNTIME_TEXTURE_SUFFIXES.heroRunnerStepA : RUNTIME_TEXTURE_SUFFIXES.heroRunnerStepB,
      )
      const bob = Math.sin(this.time.now * 0.022) * 2.4
      const tilt = Phaser.Math.Clamp(this.playerVelocity.x / 620, -0.08, 0.08)
      this.playerArt
        .setTexture(textureKey)
        .setPosition(this.player.x, this.player.y - 10 + bob)
        .setRotation(tilt)
        .setScale(1, 1)
      this.playerShadow.setPosition(this.player.x, this.player.y + 14)
      return
    }

    const textureKey = movingX || movingY
      ? this.runtimeTextureKey(stepFrame ? RUNTIME_TEXTURE_SUFFIXES.heroTopStepA : RUNTIME_TEXTURE_SUFFIXES.heroTopStepB)
      : this.runtimeTextureKey(RUNTIME_TEXTURE_SUFFIXES.heroTopIdle)
    const hover = movingX || movingY ? Math.sin(this.time.now * 0.026) * 1.4 : Math.sin(this.time.now * 0.014) * 0.8
    const tilt = Phaser.Math.Clamp(this.playerVelocity.x / 920, -0.14, 0.14)
    this.playerArt
      .setTexture(textureKey)
      .setPosition(this.player.x, this.player.y - 4 + hover)
      .setRotation(tilt)
      .setScale(1, 1)
    this.playerShadow.setPosition(this.player.x, this.player.y + 14)
  }

  private syncMovingShapePresentation(shapeData: MovingShape, depth: number): void {
    if (!shapeData.art) {
      return
    }

    const timePhase = this.time.now * 0.01
    const art = shapeData.art.setPosition(shapeData.shape.x, shapeData.shape.y).setDepth(depth)
    shapeData.shadow?.setPosition(shapeData.shape.x, shapeData.shape.y + 12).setDepth(depth - 1)

    switch (shapeData.variant) {
      case 'enemy-chaser': {
        const targetAngle = this.player
          ? Math.atan2(this.player.y - shapeData.shape.y, this.player.x - shapeData.shape.x)
          : 0
        art
          .setTexture(
            this.runtimeTextureKey(
              Math.floor(this.time.now / 150) % 2 === 0
                ? RUNTIME_TEXTURE_SUFFIXES.enemyChaserA
                : RUNTIME_TEXTURE_SUFFIXES.enemyChaserB,
            ),
          )
          .setRotation(targetAngle + Math.PI * 0.5)
          .setY(shapeData.shape.y - 2 + Math.sin(timePhase + shapeData.shape.x * 0.01) * 1.8)
        break
      }
      case 'enemy-patroller':
        art
          .setTexture(
            this.runtimeTextureKey(
              Math.floor(this.time.now / 160) % 2 === 0
                ? RUNTIME_TEXTURE_SUFFIXES.enemyPatrollerA
                : RUNTIME_TEXTURE_SUFFIXES.enemyPatrollerB,
            ),
          )
          .setFlipX(shapeData.vx < 0)
          .setY(shapeData.shape.y - 4 + Math.sin(timePhase + shapeData.shape.x * 0.014) * 1.4)
          .setRotation(0)
        break
      case 'projectile':
        art.setRotation(Math.atan2(shapeData.vy, shapeData.vx || 0.0001))
        break
      case 'relic':
        art
          .setScale(1 + Math.sin(timePhase * 0.9 + shapeData.shape.x * 0.01) * 0.04)
          .setY(shapeData.shape.y + Math.sin(timePhase + shapeData.shape.x * 0.01) * 3)
          .setRotation(Math.sin(timePhase * 0.5 + shapeData.shape.x * 0.01) * 0.04)
        break
      case 'lane-hazard':
        art
          .setRotation(Math.sin(timePhase + shapeData.shape.y * 0.01) * 0.03)
          .setY(shapeData.shape.y - 2)
        break
      case 'lane-pickup':
        art
          .setScale(1 + Math.sin(timePhase * 1.4 + shapeData.shape.x * 0.01) * 0.08)
          .setY(shapeData.shape.y + Math.sin(timePhase * 1.2 + shapeData.shape.x * 0.01) * 2)
        break
      case 'shard':
      default:
        art
          .setRotation(timePhase * 0.9 + shapeData.shape.x * 0.01)
          .setScale(1 + Math.sin(timePhase + shapeData.shape.y * 0.01) * 0.06)
        break
    }
  }

  private handleCombatInput(): void {
    if (!this.keys || !this.player) {
      return
    }

    if (
      this.blueprint.systems.combat === 'auto-shoot' &&
      this.shotAccumulator >= (this.gameTypeDefinition.tuning?.autoShootInterval ?? 0.5)
    ) {
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
      this.emitBurst(this.runtimeTemplate.burst.radius)
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
    enemy.setAlpha(0.02)

    if (side === 0) enemy.setPosition(0 - margin, Phaser.Math.Between(80, GAME_HEIGHT))
    if (side === 1) enemy.setPosition(GAME_WIDTH + margin, Phaser.Math.Between(80, GAME_HEIGHT))
    if (side === 2) enemy.setPosition(Phaser.Math.Between(0, GAME_WIDTH), 0 - margin)
    if (side === 3) enemy.setPosition(Phaser.Math.Between(0, GAME_WIDTH), GAME_HEIGHT + margin)

    const display = this.createAttachedRuntimeArt(
      this.runtimeTextureKey(RUNTIME_TEXTURE_SUFFIXES.enemyChaserA),
      enemy.x,
      enemy.y,
      40,
      40,
      8,
      20,
      8,
      0.14,
    )
    this.enemies.push({
      shape: enemy,
      vx: 0,
      vy: speed,
      art: display.art,
      shadow: display.shadow,
      variant: 'enemy-chaser',
    })
  }

  private spawnPatroller(x: number, y: number, minX: number, maxX: number): void {
    const enemy = this.add.rectangle(x, y, 24, 20, parseColor(this.blueprint.palette.danger))
    enemy.setAlpha(0.02)
    const display = this.createAttachedRuntimeArt(
      this.runtimeTextureKey(RUNTIME_TEXTURE_SUFFIXES.enemyPatrollerA),
      x,
      y,
      44,
      30,
      8,
      20,
      8,
      0.13,
    )
    this.enemies.push({
      shape: enemy,
      vx: this.gameTypeDefinition.tuning?.platformerPatrolSpeed ?? 90,
      vy: 0,
      minX,
      maxX,
      art: display.art,
      shadow: display.shadow,
      variant: 'enemy-patroller',
    })
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
    projectile.setAlpha(0.02)
    const display = this.createAttachedRuntimeArt(
      this.runtimeTextureKey(RUNTIME_TEXTURE_SUFFIXES.projectile),
      projectile.x,
      projectile.y,
      24,
      24,
      9,
      12,
      5,
      0.1,
    )
    this.projectiles.push({
      shape: projectile,
      vx: vector.x,
      vy: vector.y,
      art: display.art,
      shadow: display.shadow,
      variant: 'projectile',
    })
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
    projectile.setAlpha(0.02)
    const display = this.createAttachedRuntimeArt(
      this.runtimeTextureKey(RUNTIME_TEXTURE_SUFFIXES.projectile),
      projectile.x,
      projectile.y,
      24,
      24,
      9,
      12,
      5,
      0.1,
    )
    this.projectiles.push({
      shape: projectile,
      vx: this.facing * 360,
      vy: 0,
      art: display.art,
      shadow: display.shadow,
      variant: 'projectile',
    })
  }

  private emitBurst(radius: number): void {
    if (!this.player || this.burstCooldown > 0) {
      return
    }

    this.burstCooldown = this.runtimeTemplate.burst.cooldown
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
        this.health -= this.runtimeTemplate.chaseContactDamage
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

    const patrolDamage = this.gameTypeDefinition.tuning?.platformerPatrolDamage ?? 12
    for (const enemy of [...this.enemies]) {
      enemy.shape.x += enemy.vx * delta

      if (enemy.minX !== undefined && enemy.shape.x <= enemy.minX) {
        enemy.vx = Math.abs(enemy.vx)
      }
      if (enemy.maxX !== undefined && enemy.shape.x >= enemy.maxX) {
        enemy.vx = -Math.abs(enemy.vx)
      }

      if (aabbOverlap(this.player, this.playerHalfWidth, this.playerHalfHeight, enemy.shape, 12, 10)) {
        this.health -= patrolDamage
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
        this.destroyMovingShapePresentation(shard)
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
    shard.setAlpha(this.runtimeProfile === 'slingshot-destruction' ? 0.95 : 0.02)
    let display: { art: Phaser.GameObjects.Image; shadow: Phaser.GameObjects.Ellipse } | undefined
    if (this.runtimeProfile !== 'slingshot-destruction') {
      display = this.createAttachedRuntimeArt(
        this.runtimeTextureKey(RUNTIME_TEXTURE_SUFFIXES.shard),
        x,
        y,
        18,
        18,
        7,
        12,
        5,
        0.08,
      )
    }
    this.shards.push({
      shape: shard,
      vx: Phaser.Math.Between(-20, 20),
      vy: Phaser.Math.Between(-20, 20) - (this.runtimeProfile === 'slingshot-destruction' ? 18 : 0),
      art: display?.art,
      shadow: display?.shadow,
      variant: this.runtimeProfile === 'slingshot-destruction' ? undefined : 'shard',
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
    const spareLane = [0, 1, 2].find((index) => index !== hazardLane && index !== pickupLane) ?? hazardLane
    const pattern = this.gameTypeDefinition.tuning?.lanePattern ?? 'balanced'

    this.spawnLaneHazard(lanes[hazardLane], -30, 54, 26)

    if (pattern === 'pickup-rich') {
      this.spawnLanePickup(lanes[pickupLane], -66, 12)
      this.spawnLanePickup(lanes[spareLane], -112, 10)
      return
    }

    if (pattern === 'hazard-heavy') {
      this.spawnLaneHazard(lanes[spareLane], -84, 46, 24)
      this.spawnLanePickup(lanes[pickupLane], -138, 11)
      return
    }

    this.spawnLanePickup(lanes[pickupLane], -66, 12)
  }

  private spawnLaneHazard(x: number, y: number, width: number, height: number): void {
    const hazard = this.add.rectangle(x, y, width, height, parseColor(this.blueprint.palette.danger), 0.95)
    hazard.setAlpha(0.02)
    const display = this.createAttachedRuntimeArt(
      this.runtimeTextureKey(RUNTIME_TEXTURE_SUFFIXES.laneHazard),
      hazard.x,
      hazard.y,
      Math.max(64, width * 1.35),
      Math.max(30, height * 1.32),
      8,
      Math.max(26, width * 0.55),
      7,
      0.12,
    )
    this.laneObjects.push({
      shape: hazard,
      vx: 0,
      vy: 0,
      kind: 'hazard',
      art: display.art,
      shadow: display.shadow,
      variant: 'lane-hazard',
    })
  }

  private spawnLanePickup(x: number, y: number, radius: number): void {
    const pickup = this.add.circle(x, y, radius, parseColor(this.blueprint.palette.accentAlt))
    pickup.setAlpha(0.02)
    const display = this.createAttachedRuntimeArt(
      this.runtimeTextureKey(RUNTIME_TEXTURE_SUFFIXES.lanePickup),
      pickup.x,
      pickup.y,
      Math.max(28, radius * 2.4),
      Math.max(28, radius * 2.4),
      8,
      Math.max(16, radius * 1.4),
      6,
      0.12,
    )
    this.laneObjects.push({
      shape: pickup,
      vx: 0,
      vy: 0,
      kind: 'pickup',
      art: display.art,
      shadow: display.shadow,
      variant: 'lane-pickup',
    })
  }

  private addPlatform(x: number, y: number, width: number, height: number): void {
    const platform = this.add.rectangle(x, y, width, height, parseColor(this.blueprint.palette.surface))
    platform.setAlpha(0.02)
    const display = this.createAttachedRuntimeArt(
      this.runtimeTextureKey(RUNTIME_TEXTURE_SUFFIXES.platform),
      x,
      y,
      width * 1.04,
      Math.max(34, height * 1.9),
      6,
      Math.max(40, width * 0.72),
      10,
      0.12,
    )
    this.platforms.push({ shape: platform, x, y, width, height, art: display.art, shadow: display.shadow })
  }

  private spawnRelic(x: number, y: number): void {
    const relic = this.add.circle(x, y, 8, parseColor(this.blueprint.palette.accentAlt))
    relic.setAlpha(0.02)
    const display = this.createAttachedRuntimeArt(
      this.runtimeTextureKey(RUNTIME_TEXTURE_SUFFIXES.relic),
      x,
      y,
      30,
      40,
      8,
      22,
      8,
      0.14,
    )
    this.shards.push({ shape: relic, vx: 0, vy: 0, art: display.art, shadow: display.shadow, variant: 'relic' })
  }

  private loadSlingshotLevel(levelIndex: number): void {
    if (!this.slingshot) {
      return
    }

    const level = this.slingshot.levels[levelIndex]
    this.slingshot.levelIndex = levelIndex
    this.slingshot.transitioning = false
    this.slingshot.levelFocus = this.calculateSlingshotLevelFocus(level)
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
    this.playSceneCue('level-intro', levelIndex)
    this.snapSlingshotCameraTo(this.slingshot.levelFocus, 1.08)
    this.cameras.main.flash(180, 105, 210, 199, false)
  }

  private calculateSlingshotLevelFocus(level: SlingshotLevel): { x: number; y: number } {
    const points = [
      ...level.blocks.map((block) => ({ x: block.x, y: block.y })),
      ...level.targets.map((target) => ({ x: target.x, y: target.y })),
    ]
    const averageX = points.reduce((sum, point) => sum + point.x, 0) / points.length
    const averageY = points.reduce((sum, point) => sum + point.y, 0) / points.length

    return {
      x: Phaser.Math.Clamp(averageX + 8, 520, 786),
      y: Phaser.Math.Clamp(averageY + 32, 226, 356),
    }
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
    this.playSceneCue('level-clear', this.slingshot.levelIndex)
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
    this.slingshot.dragPointerId = null
  }

  private spawnSlingshotProjectile(): void {
    if (!this.slingshot || this.slingshot.shotsRemaining <= 0) {
      return
    }

    const projectile = this.add.circle(
      this.slingshot.anchor.x,
      this.slingshot.anchor.y,
      SLINGSHOT_PROJECTILE_RADIUS,
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
    this.slingshot.dragPointerId = null
    this.slingshot.elasticSnap = null
    this.slingshot.lastTrailAt = 0
    this.slingshot.shotsRemaining -= 1
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (
      !this.slingshot?.projectile ||
      this.slingshot.projectileLaunched ||
      this.slingshot.transitioning ||
      !pointer.leftButtonDown()
    ) {
      return
    }

    this.unlockAudio()
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
    const projectileAtRest =
      Phaser.Math.Distance.Between(projectile.x, projectile.y, this.slingshot.anchor.x, this.slingshot.anchor.y) < 14

    if (projectileDistance <= SLINGSHOT_DRAG_RADIUS || (projectileAtRest && anchorDistance <= SLINGSHOT_ANCHOR_GRAB_RADIUS)) {
      this.slingshot.dragging = true
      this.slingshot.dragPointerId = pointer.id
      this.matter.body.setVelocity(projectile.body, { x: 0, y: 0 })
      this.matter.body.setAngularVelocity(projectile.body, 0)
      this.matter.body.setStatic(projectile.body, true)
      this.setSlingshotProjectilePull(pointerPosition.x, pointerPosition.y)
    }
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (
      !this.slingshot?.dragging ||
      !this.slingshot.projectile ||
      this.slingshot.dragPointerId === null ||
      pointer.id !== this.slingshot.dragPointerId
    ) {
      return
    }

    const pointerPosition = this.getPointerGamePosition(pointer)
    this.setSlingshotProjectilePull(pointerPosition.x, pointerPosition.y)
  }

  private handlePointerUp(pointer?: Phaser.Input.Pointer): void {
    if (
      !this.slingshot?.dragging ||
      !this.slingshot.projectile ||
      (pointer && this.slingshot.dragPointerId !== null && pointer.id !== this.slingshot.dragPointerId)
    ) {
      return
    }

    this.releaseSlingshotProjectile()
  }

  private handlePointerLeaveGame(): void {
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
      this.unlockAudio()
      const delta = this.game.loop.delta / 1000
      const vector = new Phaser.Math.Vector2(inputX, inputY).normalize().scale(260 * delta)
      const nextX = this.slingshot.projectile.x + vector.x
      const nextY = this.slingshot.projectile.y + vector.y

      this.matter.body.setStatic(this.slingshot.projectile.body, true)
      this.setSlingshotProjectilePull(nextX, nextY)
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
      this.unlockAudio()
      this.releaseSlingshotProjectile()
    }
  }

  private setSlingshotProjectilePull(x: number, y: number): void {
    if (!this.slingshot?.projectile) {
      return
    }

    const constrainedX = Math.min(x, this.slingshot.anchor.x - 6)
    const constrainedY = Phaser.Math.Clamp(
      y,
      this.slingshot.anchor.y - SLINGSHOT_VERTICAL_PULL,
      this.slingshot.anchor.y + SLINGSHOT_VERTICAL_PULL,
    )
    const offsetX = constrainedX - this.slingshot.anchor.x
    const offsetY = constrainedY - this.slingshot.anchor.y
    const vector = new Phaser.Math.Vector2(offsetX, offsetY)

    const ellipseLength = Math.sqrt(
      (vector.x * vector.x) / (SLINGSHOT_MAX_PULL * SLINGSHOT_MAX_PULL) +
        (vector.y * vector.y) / (SLINGSHOT_VERTICAL_PULL * SLINGSHOT_VERTICAL_PULL),
    )

    if (ellipseLength > 1) {
      vector.scale(1 / ellipseLength)
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
    this.slingshot.dragPointerId = null

    if (pull.length() < SLINGSHOT_RELEASE_MIN_PULL) {
      this.resetSlingshotProjectileToAnchor()
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
    this.matter.body.setAngularVelocity(projectile.body, Phaser.Math.Clamp(velocity.length() * 0.0032, -0.22, 0.22))
    this.playLaunchAudio(Phaser.Math.Clamp(pull.length() / SLINGSHOT_MAX_PULL, 0, 1))
    this.emitImpactBurst(projectile.x, projectile.y, this.blueprint.palette.accent, 12, 42)
    this.cameras.main.shake(70, 0.0025)
  }

  private resetSlingshotProjectileToAnchor(): void {
    if (!this.slingshot?.projectile) {
      return
    }

    this.matter.body.setVelocity(this.slingshot.projectile.body, { x: 0, y: 0 })
    this.matter.body.setAngularVelocity(this.slingshot.projectile.body, 0)
    this.matter.body.setPosition(this.slingshot.projectile.body, this.slingshot.anchor)
  }

  private getPointerGamePosition(pointer: Phaser.Input.Pointer): Phaser.Math.Vector2 {
    pointer.updateWorldPoint(this.cameras.main)
    return new Phaser.Math.Vector2(pointer.worldX, pointer.worldY)
  }

  private calculateSlingshotPull(projectile: MatterShape): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(
      this.slingshot!.anchor.x - projectile.x,
      this.slingshot!.anchor.y - projectile.y,
    )
  }

  private calculateSlingshotLaunchVelocity(projectile: MatterShape): Phaser.Math.Vector2 {
    const pull = this.calculateSlingshotPull(projectile)
    const tension = Phaser.Math.Clamp(pull.length() / SLINGSHOT_MAX_PULL, 0, 1)
    const springFactor = Phaser.Math.Linear(0.82, 1.12, Math.pow(tension, 0.72))
    return pull.scale((this.blueprint.physics.projectilePower / 30) * springFactor)
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
    const postX = x + 34
    const postTopY = y - 16
    const { top: forkTop, bottom: forkBottom } = this.getSlingshotForkPoints()

    frame.lineStyle(18, root, 0.34)
    frame.lineBetween(postX, y + 46, postX + 2, postTopY)
    frame.lineStyle(11, wood, 0.94)
    frame.lineBetween(postX, y + 46, postX + 2, postTopY)
    frame.lineStyle(12, wood, 0.94)
    frame.lineBetween(postX + 2, postTopY, forkTop.x, forkTop.y)
    frame.lineBetween(postX + 2, postTopY, forkBottom.x, forkBottom.y)
    frame.lineStyle(3, brass, 0.82)
    frame.lineBetween(postX + 6, y - 6, postX - 5, y + 30)
    frame.lineBetween(forkTop.x + 4, forkTop.y + 7, postX + 5, postTopY - 6)
    frame.lineBetween(forkBottom.x + 3, forkBottom.y + 3, postX + 8, postTopY - 2)
    frame.fillStyle(brass, 0.74)
    frame.fillCircle(forkTop.x, forkTop.y, 5)
    frame.fillCircle(forkBottom.x, forkBottom.y, 5)
    frame.fillCircle(postX + 6, y + 26, 4)
  }

  private createSlingshotHeroSprite(x: number, y: number): Phaser.GameObjects.Image {
    const hero = this.add.image(x, y, ASTRAL_HERO_SPRITES.idleA).setDepth(8).setAlpha(0.98)
    this.applyHeroSpritePose(hero, 'idleA')
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
      idleA: { x: 34, y: -86 },
      idleB: { x: 34, y: -86 },
      stepA: { x: 42, y: -86 },
      stepB: { x: 40, y: -86 },
      brace: { x: 48, y: -86 },
      pullLight: { x: 62, y: -88 },
      pullHeavy: { x: 74, y: -89 },
      release: { x: 88, y: -90 },
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

    const { top: forkTop, bottom: forkBottom } = this.getSlingshotForkPoints()
    const pull = this.calculateSlingshotPull(projectile)

    if (this.slingshot.projectileLaunched) {
      this.drawElasticRecoil(forkTop, forkBottom)
      return
    }

    const tension = Phaser.Math.Clamp(pull.length() / SLINGSHOT_MAX_PULL, 0, 1)
    this.drawSlingshotPowerMeter(tension)
    this.drawElasticBand(forkTop, projectile, 5, this.blueprint.palette.accent, 0.6, tension, 0)
    this.drawElasticBand(forkBottom, projectile, 4, this.blueprint.palette.accentAlt, 0.62, tension, Math.PI * 0.8)

    const heldHand = this.getHeroHandPosition()
    if (heldHand && tension > 0.14) {
      this.slingshot.dragGuide.lineStyle(3, parseColor(this.blueprint.palette.accent), 0.18 + tension * 0.28)
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

    const x = this.slingshot.anchor.x - 86
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

    const predictedPoints = this.predictSlingshotTrajectory(projectile)

    for (let i = 0; i < predictedPoints.length; i += 1) {
      const point = predictedPoints[i]
      const alpha = 0.46 - i * 0.012
      if (alpha <= 0.04) {
        break
      }

      this.slingshot.dragGuide.fillStyle(parseColor('#020507'), 0.2 - i * 0.004)
      this.slingshot.dragGuide.fillCircle(point.x + 2, point.y + 2, Math.max(2, 6 - i * 0.13))
      this.slingshot.dragGuide.fillStyle(parseColor(this.blueprint.palette.accent), alpha)
      this.slingshot.dragGuide.fillCircle(point.x, point.y, Math.max(2, 6 - i * 0.13))
    }
  }

  private predictSlingshotTrajectory(projectile: MatterShape): Array<{ x: number; y: number }> {
    const matterLib = Phaser.Physics.Matter.Matter
    const velocity = this.calculateSlingshotLaunchVelocity(projectile)
    const gravity = this.matter.world.engine.gravity
    const deltaTime = (projectile.body.deltaTime || MATTER_BASE_DELTA) * (projectile.body.timeScale || 1)
    const frictionAir = Phaser.Math.Clamp(1 - projectile.body.frictionAir * (deltaTime / MATTER_BASE_DELTA), 0, 1)
    const gravityScale = typeof gravity.scale === 'number' ? gravity.scale : 0.001
    const gravityStepX = gravity.x * gravityScale * deltaTime * deltaTime
    const gravityStepY = gravity.y * gravityScale * deltaTime * deltaTime
    const collisionBodies = matterLib.Composite.allBodies(this.matter.world.engine.world).filter(
      (body) => body !== projectile.body && !body.isSensor,
    )
    const probeBody = matterLib.Bodies.circle(projectile.x, projectile.y, projectile.body.circleRadius || SLINGSHOT_PROJECTILE_RADIUS, {
      isSensor: true,
    })
    const points: Array<{ x: number; y: number }> = []
    let x = projectile.x
    let y = projectile.y
    let vx = velocity.x
    let vy = velocity.y

    for (let step = 0; step < 36; step += 1) {
      vx = vx * frictionAir + gravityStepX
      vy = vy * frictionAir + gravityStepY
      x += vx
      y += vy

      if (x < -40 || x > GAME_WIDTH + 40 || y < -20 || y > GAME_HEIGHT + 40) {
        break
      }

      points.push({ x, y })

      matterLib.Body.setPosition(probeBody, { x, y })
      if (matterLib.Query.collides(probeBody, collisionBodies).length > 0) {
        break
      }
    }

    return points
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
    const idlePose = this.getIdleHeroPose()

    if (!projectile || this.slingshot.projectileLaunched) {
      const pose: AstralHeroPose = recoilProgress < 0.38 ? 'release' : recoilProgress < 0.72 ? 'brace' : idlePose
      this.applyHeroSpritePose(hero, pose)
      hero.setPosition(
        Phaser.Math.Linear(hero.x, this.slingshot.heroBase.x - (1 - recoilProgress) * 8, 0.18),
        Phaser.Math.Linear(hero.y, this.slingshot.heroBase.y + Math.sin(this.time.now * 0.01) * 1.2, 0.18),
      )
      hero.setRotation(Phaser.Math.Linear(hero.rotation, recoilProgress < 0.46 ? -0.035 : 0, 0.18))
      return
    }

    const pullOffsetX = Phaser.Math.Clamp((projectile.x - this.slingshot.anchor.x) * 0.16, -18, 4)
    const pullOffsetY = Phaser.Math.Clamp((projectile.y - this.slingshot.anchor.y) * 0.08, -8, 10)
    const pullAmount = Phaser.Math.Clamp(
      Phaser.Math.Distance.Between(projectile.x, projectile.y, this.slingshot.anchor.x, this.slingshot.anchor.y) / SLINGSHOT_MAX_PULL,
      0,
      1,
    )
    const walking = pullAmount > 0.08 && pullAmount < 0.24
    const walkPhase = Math.floor(this.time.now / 140) % 2
    const pose: AstralHeroPose =
      pullAmount > 0.76
        ? 'pullHeavy'
        : pullAmount > 0.46
          ? 'pullLight'
          : pullAmount > 0.24
            ? 'brace'
            : walking
              ? walkPhase === 0
                ? 'stepA'
                : 'stepB'
              : idlePose
    const walkBob = Math.sin(this.time.now * 0.018) * Math.min(4, Math.abs(pullOffsetX) * 0.14)

    this.applyHeroSpritePose(hero, pose)
    hero.setPosition(this.slingshot.heroBase.x + pullOffsetX, this.slingshot.heroBase.y + pullOffsetY + walkBob)
    hero.setRotation(Phaser.Math.Clamp(pullOffsetX * 0.0016 + (pullAmount > 0.28 ? -0.012 : 0), -0.05, 0.02))

    if (walking && this.time.now - this.slingshot.lastStepAt > 180) {
      this.slingshot.lastStepAt = this.time.now
      this.emitImpactBurst(hero.x + 8, this.slingshot.heroBase.y - 6, '#d8a65d', 3, 12, 0.28)
    }
  }

  private getSlingshotForkPoints(): { top: { x: number; y: number }; bottom: { x: number; y: number } } {
    if (!this.slingshot) {
      return {
        top: { x: 0, y: 0 },
        bottom: { x: 0, y: 0 },
      }
    }

    return {
      top: { x: this.slingshot.anchor.x + 14, y: this.slingshot.anchor.y - 38 },
      bottom: { x: this.slingshot.anchor.x + 34, y: this.slingshot.anchor.y - 18 },
    }
  }

  private getIdleHeroPose(): AstralHeroPose {
    return Math.floor(this.time.now / 420) % 2 === 0 ? 'idleA' : 'idleB'
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
    if (target.integrity > 0) {
      this.playOrbitCoreAudio('hit', Phaser.Math.Clamp(damage / 6, 0.18, 1), x)
    }
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
    if (block.integrity > 0) {
      this.playMaterialAudio(block.material, Phaser.Math.Clamp(damage / 7.5, 0.18, 1), x)
    }
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
    this.playOrbitCoreAudio('release', 1, x)
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
    this.playMaterialAudio(block.material, 1, x)
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
    const glowPulse = 1 + Math.sin((this.time.now + shape.x * 0.35) * 0.01) * 0.06 + Math.min(0.18, shape.body.speed * 0.012)
    const glowAlpha =
      shape.body.label === 'gameclaw-projectile'
        ? 0.22 + Math.min(0.3, shape.body.speed * 0.012)
        : shape.body.label === 'gameclaw-target'
          ? 0.16 + Math.sin((this.time.now + shape.y) * 0.008) * 0.04
          : 0.08

    shape.art?.setPosition(shape.x, shape.y).setRotation(shape.rotation).setDepth(depth).setAlpha(alpha)
    shape.shadow
      ?.setPosition(shape.x, GAME_HEIGHT - 66)
      .setScale(Phaser.Math.Clamp(1 - Math.max(0, GAME_HEIGHT - 80 - shape.y) * 0.0022, 0.34, 1.05), 1)
      .setDepth(depth - 2)
    shape.glow
      ?.setPosition(shape.x, shape.y)
      .setRotation(shape.rotation)
      .setScale(glowPulse)
      .setAlpha(glowAlpha)
      .setDepth(depth - 1)
  }

  private unlockAudio(): void {
    const context = this.getAudioContext()
    if (context?.state === 'suspended') {
      void context.resume()
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') {
      return null
    }

    if (!this.audioContext) {
      const AudioCtor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioCtor) {
        return null
      }

      this.audioContext = new AudioCtor()
    }

    return this.audioContext
  }

  private playSceneCue(kind: 'level-intro' | 'level-clear' | 'run-win' | 'run-lose', variation = 0): void {
    if (kind === 'level-intro') {
      const accent = 320 + variation * 32
      this.playTone({ frequency: accent, duration: 0.12, volume: 0.035, type: 'triangle', slideTo: accent * 0.92, pan: -0.12 })
      this.playTone({ frequency: accent * 1.5, duration: 0.18, volume: 0.03, type: 'sine', slideTo: accent * 1.68, pan: 0.06, delay: 0.04 })
      return
    }

    if (kind === 'level-clear') {
      this.playTone({ frequency: 360 + variation * 16, duration: 0.18, volume: 0.04, type: 'triangle', slideTo: 420 + variation * 18, pan: -0.08 })
      this.playTone({ frequency: 520 + variation * 12, duration: 0.34, volume: 0.03, type: 'sine', slideTo: 610 + variation * 10, pan: 0.12, delay: 0.05 })
      return
    }

    if (kind === 'run-win') {
      this.playTone({ frequency: 392, duration: 0.18, volume: 0.04, type: 'triangle', slideTo: 440, pan: -0.08 })
      this.playTone({ frequency: 524, duration: 0.24, volume: 0.034, type: 'sine', slideTo: 588, pan: 0.1, delay: 0.08 })
      this.playTone({ frequency: 660, duration: 0.34, volume: 0.032, type: 'sine', slideTo: 784, pan: 0.18, delay: 0.16 })
      return
    }

    this.playTone({ frequency: 220, duration: 0.22, volume: 0.05, type: 'sawtooth', slideTo: 132, pan: -0.06 })
    this.playTone({ frequency: 164, duration: 0.32, volume: 0.028, type: 'triangle', slideTo: 96, pan: 0.04, delay: 0.04 })
  }

  private playLaunchAudio(tension: number): void {
    this.playTone({
      frequency: Phaser.Math.Linear(180, 260, tension),
      duration: 0.12,
      volume: 0.055,
      type: 'triangle',
      slideTo: Phaser.Math.Linear(120, 170, tension),
      pan: -0.18,
    })
    this.playTone({
      frequency: Phaser.Math.Linear(420, 560, tension),
      duration: 0.2,
      volume: 0.034,
      type: 'sine',
      slideTo: Phaser.Math.Linear(300, 380, tension),
      pan: 0.08,
      delay: 0.02,
    })
  }

  private playMaterialAudio(material: SlingshotMaterial, intensity: number, x: number): void {
    const pan = Phaser.Math.Clamp((x - GAME_WIDTH / 2) / (GAME_WIDTH / 2), -0.75, 0.75)

    if (material === 'glass') {
      this.playTone({
        frequency: Phaser.Math.Linear(720, 980, intensity),
        duration: 0.1,
        volume: 0.038 + intensity * 0.02,
        type: 'square',
        slideTo: Phaser.Math.Linear(300, 420, intensity),
        pan,
      })
      this.playTone({
        frequency: Phaser.Math.Linear(1100, 1480, intensity),
        duration: 0.14,
        volume: 0.022 + intensity * 0.016,
        type: 'sine',
        slideTo: Phaser.Math.Linear(740, 920, intensity),
        pan: pan * 0.8,
        delay: 0.01,
      })
      return
    }

    if (material === 'brass') {
      this.playTone({
        frequency: Phaser.Math.Linear(240, 340, intensity),
        duration: 0.24,
        volume: 0.038 + intensity * 0.024,
        type: 'triangle',
        slideTo: Phaser.Math.Linear(220, 310, intensity),
        pan,
      })
      this.playTone({
        frequency: Phaser.Math.Linear(420, 560, intensity),
        duration: 0.34,
        volume: 0.026 + intensity * 0.018,
        type: 'sine',
        slideTo: Phaser.Math.Linear(360, 470, intensity),
        pan: pan * 0.7,
        delay: 0.03,
      })
      return
    }

    this.playTone({
      frequency: Phaser.Math.Linear(120, 170, intensity),
      duration: 0.14,
      volume: 0.034 + intensity * 0.02,
      type: 'sawtooth',
      slideTo: Phaser.Math.Linear(82, 120, intensity),
      pan,
    })
    this.playTone({
      frequency: Phaser.Math.Linear(150, 210, intensity),
      duration: 0.08,
      volume: 0.02 + intensity * 0.012,
      type: 'triangle',
      slideTo: Phaser.Math.Linear(104, 150, intensity),
      pan: pan * 0.55,
      delay: 0.02,
    })
  }

  private playOrbitCoreAudio(kind: 'hit' | 'release', intensity: number, x: number): void {
    const pan = Phaser.Math.Clamp((x - GAME_WIDTH / 2) / (GAME_WIDTH / 2), -0.8, 0.8)

    if (kind === 'release') {
      this.playTone({ frequency: 480, duration: 0.14, volume: 0.042, type: 'sine', slideTo: 540, pan, delay: 0 })
      this.playTone({ frequency: 720, duration: 0.28, volume: 0.032, type: 'triangle', slideTo: 860, pan: pan * 0.72, delay: 0.04 })
      this.playTone({ frequency: 980, duration: 0.36, volume: 0.02, type: 'sine', slideTo: 1180, pan: pan * 0.4, delay: 0.09 })
      return
    }

    this.playTone({
      frequency: Phaser.Math.Linear(420, 620, intensity),
      duration: 0.1,
      volume: 0.028 + intensity * 0.014,
      type: 'sine',
      slideTo: Phaser.Math.Linear(380, 520, intensity),
      pan,
    })
  }

  private playTone(options: {
    frequency: number
    duration: number
    volume: number
    type: OscillatorType
    slideTo?: number
    pan?: number
    delay?: number
  }): void {
    const context = this.getAudioContext()
    if (!context || context.state !== 'running') {
      return
    }

    const now = context.currentTime + (options.delay ?? 0)
    if (now - this.lastSfxAt < 0.006) {
      return
    }
    this.lastSfxAt = now

    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const panner = 'createStereoPanner' in context ? context.createStereoPanner() : null
    oscillator.type = options.type
    oscillator.frequency.setValueAtTime(options.frequency, now)
    if (options.slideTo) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(24, options.slideTo), now + options.duration)
    }

    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, options.volume), now + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + options.duration)

    oscillator.connect(gain)
    if (panner) {
      panner.pan.value = options.pan ?? 0
      gain.connect(panner)
      panner.connect(context.destination)
    } else {
      gain.connect(context.destination)
    }

    oscillator.start(now)
    oscillator.stop(now + options.duration + 0.03)
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
        this.destroyMovingShapePresentation(shard)
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
    this.playSceneCue(won ? 'run-win' : 'run-lose')
    this.statusText.setText(resolveFinishStatus(this.runtimeTemplate, won))
    this.objectiveText.setText([summary, this.blueprint.approximationStrategy])
    createRuntimeFinishOverlay(this, this.runtimeTemplate, this.blueprint.palette, won, summary, GAME_WIDTH, GAME_HEIGHT)
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

  private destroyMovingShapePresentation(shapeData: MovingShape): void {
    shapeData.art?.destroy()
    shapeData.shadow?.destroy()
    shapeData.shape.destroy()
  }

  private removeEnemy(enemy: MovingShape): void {
    this.destroyMovingShapePresentation(enemy)
    this.enemies.splice(this.enemies.indexOf(enemy), 1)
  }

  private removeProjectile(projectile: MovingShape): void {
    this.destroyMovingShapePresentation(projectile)
    this.projectiles.splice(this.projectiles.indexOf(projectile), 1)
  }

  private removeLaneObject(object: LaneObject): void {
    this.destroyMovingShapePresentation(object)
    this.laneObjects.splice(this.laneObjects.indexOf(object), 1)
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

function mixColors(left: number, right: number, amount: number): number {
  const t = Phaser.Math.Clamp(amount, 0, 1)
  const leftRed = (left >> 16) & 0xff
  const leftGreen = (left >> 8) & 0xff
  const leftBlue = left & 0xff
  const rightRed = (right >> 16) & 0xff
  const rightGreen = (right >> 8) & 0xff
  const rightBlue = right & 0xff

  const red = Math.round(Phaser.Math.Linear(leftRed, rightRed, t))
  const green = Math.round(Phaser.Math.Linear(leftGreen, rightGreen, t))
  const blue = Math.round(Phaser.Math.Linear(leftBlue, rightBlue, t))

  return (red << 16) | (green << 8) | blue
}

function shadeColor(color: number, amount: number): number {
  return amount >= 0 ? mixColors(color, 0xffffff, amount) : mixColors(color, 0x000000, Math.abs(amount))
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
