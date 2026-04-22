import Phaser from 'phaser'

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
}

type SlingshotMaterial = 'wood' | 'glass' | 'brass'

type SlingshotBlock = {
  shape: MatterShape
  material: SlingshotMaterial
  collapseLeft: number
  collapseRight: number
  collapseBottom: number
}

type SlingshotTarget = {
  shape: MatterShape
  integrity: number
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

  create(): void {
    this.timeLeft = defaultTimerForProfile(this.runtimeProfile)

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
    })
  }

  update(_time: number, deltaMs: number): void {
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
      'W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,SHIFT',
    ) as Record<string, Phaser.Input.Keyboard.Key>
  }

  private createHud(): void {
    this.add
      .text(28, 24, this.blueprint.title.toUpperCase(), {
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: '13px',
        color: this.blueprint.palette.accent,
      })
      .setAlpha(0.95)

    this.statusText = this.add.text(28, 50, '', {
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: '15px',
      color: this.blueprint.palette.text,
    })

    this.objectiveText = this.add.text(28, 84, '', {
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: '12px',
      color: '#d7d0c5',
      wordWrap: { width: 440 },
    })

    this.supportText = this.add.text(28, GAME_HEIGHT - 26, '', {
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: '11px',
      color: this.blueprint.palette.accentAlt,
    })
    this.supportText.setText(
      `${RUNTIME_LABELS[this.runtimeProfile]} / ${this.blueprint.supportLevel.toUpperCase()} / ${this.blueprint.noveltyHook}`,
    )
  }

  private drawBackdrop(palette: GamePalette): void {
    const graphics = this.add.graphics()
    graphics.fillStyle(parseColor(palette.bg), 1)
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    if (this.runtimeProfile === 'slingshot-destruction') {
      graphics.fillStyle(parseColor(palette.accent), 0.08)
      graphics.fillCircle(160, 120, 76)
      graphics.fillStyle(parseColor(palette.accentAlt), 0.12)
      graphics.fillCircle(172, 112, 54)

      for (let i = 0; i < 6; i += 1) {
        graphics.fillStyle(parseColor(palette.accentAlt), 0.06 + i * 0.01)
        graphics.fillEllipse(120 + i * 140, GAME_HEIGHT - 80 - (i % 2) * 18, 180, 52)
      }
    }

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
      levelBadge: this.add
        .text(GAME_WIDTH - 28, 24, '', {
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: '12px',
          color: this.blueprint.palette.accentAlt,
        })
        .setOrigin(1, 0),
    }

    this.matter.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT)
    const ground = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 36, GAME_WIDTH, 72, parseColor(this.blueprint.palette.surface))
    this.matter.add.gameObject(ground, { isStatic: true })
    const launcher = this.add.rectangle(120, GAME_HEIGHT - 105, 18, 72, parseColor(this.blueprint.palette.accent))
    this.matter.add.gameObject(launcher, { isStatic: true })

    this.loadSlingshotLevel(0)
    this.refreshDragGuide()

    this.input.on('pointerdown', this.handlePointerDown, this)
    this.input.on('pointermove', this.handlePointerMove, this)
    this.input.on('pointerup', this.handlePointerUp, this)
  }

  private updateSlingshotDestruction(): void {
    if (!this.slingshot) {
      return
    }

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
      `Break the structure, free every orbit core, and preserve shots for the next chamber.`,
    ])

    this.clearSlingshotActors()
    this.slingshot.shotsRemaining += level.shots

    for (const blockDef of level.blocks) {
      const block = this.add.rectangle(
        blockDef.x,
        blockDef.y,
        blockDef.width,
        blockDef.height,
        parseColor(slingshotMaterialColor(blockDef.material, this.blueprint.palette)),
      )
      block.setStrokeStyle(2, parseColor(this.blueprint.palette.text), blockDef.material === 'glass' ? 0.3 : 0.18)
      const gameObject = this.matter.add.gameObject(block, {
        friction: this.blueprint.physics.friction,
        restitution: blockDef.material === 'glass' ? this.blueprint.physics.bounce * 0.22 : this.blueprint.physics.bounce * 0.38,
      }) as MatterShape

      this.slingshot.blocks.push({
        shape: gameObject,
        material: blockDef.material,
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
      target.setStrokeStyle(3, parseColor(this.blueprint.palette.text), 0.52)
      const gameObject = this.matter.add.gameObject(target, {
        friction: this.blueprint.physics.friction,
        restitution: this.blueprint.physics.bounce * 0.15,
      }) as MatterShape

      this.slingshot.targets.push({
        shape: gameObject,
        integrity: targetDef.integrity ?? this.blueprint.physics.structuralIntegrity * 0.6,
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
      block.shape.destroy()
    }
    for (const target of this.slingshot.targets) {
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
    projectile.setStrokeStyle(3, parseColor(this.blueprint.palette.text), 0.7)

    const matterProjectile = this.matter.add.gameObject(projectile, {
      friction: this.blueprint.physics.friction,
      restitution: this.blueprint.physics.bounce,
      frictionAir: this.blueprint.physics.drag,
    }) as MatterShape

    this.matter.body.setStatic(matterProjectile.body, true)
    this.slingshot.projectile = matterProjectile
    this.slingshot.projectileLaunched = false
    this.slingshot.shotsRemaining -= 1
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (!this.slingshot?.projectile) {
      return
    }

    const projectile = this.slingshot.projectile
    if (Phaser.Math.Distance.Between(pointer.x, pointer.y, projectile.x, projectile.y) <= 28) {
      this.slingshot.dragging = true
      this.matter.body.setVelocity(projectile.body, { x: 0, y: 0 })
      this.matter.body.setAngularVelocity(projectile.body, 0)
      this.matter.body.setStatic(projectile.body, true)
    }
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.slingshot?.dragging || !this.slingshot.projectile) {
      return
    }

    const maxDistance = 110
    const offsetX = pointer.x - this.slingshot.anchor.x
    const offsetY = pointer.y - this.slingshot.anchor.y
    const vector = new Phaser.Math.Vector2(offsetX, offsetY)

    if (vector.length() > maxDistance) {
      vector.normalize().scale(maxDistance)
    }

    this.matter.body.setPosition(this.slingshot.projectile.body, {
      x: this.slingshot.anchor.x + vector.x,
      y: this.slingshot.anchor.y + vector.y,
    })
  }

  private handlePointerUp(): void {
    if (!this.slingshot?.dragging || !this.slingshot.projectile) {
      return
    }

    const projectile = this.slingshot.projectile
    const velocity = new Phaser.Math.Vector2(
      this.slingshot.anchor.x - projectile.x,
      this.slingshot.anchor.y - projectile.y,
    ).scale(this.blueprint.physics.projectilePower / 30)

    this.slingshot.dragging = false
    this.slingshot.projectileLaunched = true
    this.slingshot.lastReleaseAt = this.time.now

    this.matter.body.setStatic(projectile.body, false)
    this.matter.body.setVelocity(projectile.body, { x: velocity.x, y: velocity.y })
  }

  private refreshDragGuide(): void {
    if (!this.slingshot) {
      return
    }

    this.slingshot.dragGuide.clear()
    this.slingshot.dragGuide.lineStyle(4, parseColor(this.blueprint.palette.accentAlt), 0.45)

    const projectile = this.slingshot.projectile
    if (!projectile) {
      return
    }

    this.slingshot.dragGuide.lineBetween(
      this.slingshot.anchor.x,
      this.slingshot.anchor.y,
      projectile.x,
      projectile.y,
    )
  }

  private updateMatterTargets(): void {
    if (!this.slingshot) {
      return
    }

    for (const target of [...this.slingshot.targets]) {
      const destroyed =
        target.shape.body.speed > target.integrity ||
        target.shape.y > GAME_HEIGHT - 48 ||
        target.shape.x < 440 ||
        target.shape.x > GAME_WIDTH + 80

      if (destroyed) {
        this.addScore(30)
        this.spawnShard(target.shape.x, target.shape.y)
        target.shape.destroy()
        this.slingshot.targets.splice(this.slingshot.targets.indexOf(target), 1)
        this.cameras.main.shake(120, 0.005)
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
        block.shape.destroy()
        this.slingshot.blocks.splice(this.slingshot.blocks.indexOf(block), 1)
      }
    }
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
      const levelLabel = this.slingshot ? `   Level ${this.slingshot.levelIndex + 1}/${this.slingshot.levels.length}` : ''
      this.statusText.setText(
        `Targets ${this.slingshot?.targets.length ?? 0}   Shots ${(this.slingshot?.shotsRemaining ?? 0) + loadedShot}   Score ${this.score}${levelLabel}`,
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
