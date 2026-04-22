import Phaser from 'phaser'

import type { GameBlueprint, GamePalette } from '../../shared/game'

const GAME_WIDTH = 960
const GAME_HEIGHT = 540

type MovingDot = {
  shape: Phaser.GameObjects.Shape
  vx: number
  vy: number
  lane?: number
}

type LaneObject = MovingDot & {
  kind: 'hazard' | 'pickup'
}

export function createGameConfig(
  target: HTMLDivElement,
  blueprint: GameBlueprint,
): Phaser.Types.Core.GameConfig {
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
    scene: new GeneratedGameScene(blueprint),
  }
}

class GeneratedGameScene extends Phaser.Scene {
  private readonly blueprint: GameBlueprint
  private keys?: Record<string, Phaser.Input.Keyboard.Key>
  private player!: Phaser.GameObjects.Arc
  private statusText!: Phaser.GameObjects.Text
  private objectiveText!: Phaser.GameObjects.Text
  private health = 100
  private score = 0
  private timeLeft = 60
  private burstCooldown = 0
  private laneIndex = 1
  private spawnAccumulator = 0
  private shotAccumulator = 0
  private laneSwitchCooldown = 0
  private relicsRemaining = 0
  private gameEnded = false
  private readonly enemies: MovingDot[] = []
  private readonly projectiles: MovingDot[] = []
  private readonly shards: MovingDot[] = []
  private readonly laneObjects: LaneObject[] = []

  constructor(blueprint: GameBlueprint) {
    super('generated-game')
    this.blueprint = blueprint
  }

  create(): void {
    this.timeLeft = this.blueprint.template === 'lane-runner' ? 45 : 60

    this.drawBackdrop(this.blueprint.palette)
    this.createHud()
    this.createPlayer()
    this.createControls()

    switch (this.blueprint.template) {
      case 'lane-runner':
        this.createLaneRunner()
        break
      case 'relic-sprint':
        this.createRelicSprint()
        break
      default:
        this.createArenaSurvivor()
        break
    }

    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.gameEnded) {
          return
        }

        this.timeLeft -= 1
        this.refreshHud()

        if (this.timeLeft <= 0 && this.blueprint.template !== 'relic-sprint') {
          this.finishGame(true, 'Prototype stable. The loop holds together.')
        }
      },
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

    switch (this.blueprint.template) {
      case 'lane-runner':
        this.updateLaneRunner(delta)
        break
      case 'relic-sprint':
        this.updateRelicSprint(delta)
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

    this.keys = keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE') as Record<
      string,
      Phaser.Input.Keyboard.Key
    >
  }

  private createHud(): void {
    this.add
      .text(28, 24, this.blueprint.title.toUpperCase(), {
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: '13px',
        color: this.blueprint.palette.accent,
      })
      .setAlpha(0.95)

    this.statusText = this.add.text(28, 52, '', {
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: '15px',
      color: this.blueprint.palette.text,
    })

    this.objectiveText = this.add.text(28, 84, '', {
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: '12px',
      color: '#d7d0c5',
      wordWrap: { width: 420 },
    })
  }

  private drawBackdrop(palette: GamePalette): void {
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
  }

  private createPlayer(): void {
    this.player = this.add.circle(
      GAME_WIDTH * 0.5,
      GAME_HEIGHT * 0.6,
      14,
      parseColor(this.blueprint.palette.accent),
    )
    this.player.setStrokeStyle(3, parseColor(this.blueprint.palette.text), 0.8)
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
      this.spawnEnemyAtEdge(70 + Math.min(this.score * 1.5, 110))
    }

    if (this.shotAccumulator >= 0.45) {
      this.shotAccumulator = 0
      this.fireAtNearestEnemy()
    }

    if (this.keys && Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
      this.emitBurst(140)
    }

    this.updateProjectiles(delta)
    this.updateEnemiesTowardPlayer(delta, 0.95)
    this.collectNearbyShards(18, 5)
  }

  private createLaneRunner(): void {
    this.player.setPosition(GAME_WIDTH * 0.5, GAME_HEIGHT - 90)
    this.objectiveText.setText([
      `${this.blueprint.hero.name}: stay clean, read the lane, build a combo.`,
      this.blueprint.winCondition,
    ])
  }

  private updateLaneRunner(delta: number): void {
    const lanes = [GAME_WIDTH * 0.32, GAME_WIDTH * 0.5, GAME_WIDTH * 0.68]

    if (this.keys && this.laneSwitchCooldown <= 0 && Phaser.Input.Keyboard.JustDown(this.keys.LEFT)) {
      this.laneIndex = Math.max(0, this.laneIndex - 1)
      this.laneSwitchCooldown = 0.12
    }
    if (this.keys && this.laneSwitchCooldown <= 0 && Phaser.Input.Keyboard.JustDown(this.keys.RIGHT)) {
      this.laneIndex = Math.min(2, this.laneIndex + 1)
      this.laneSwitchCooldown = 0.12
    }

    this.player.x = Phaser.Math.Linear(this.player.x, lanes[this.laneIndex], 0.24)

    if (this.spawnAccumulator >= 0.55) {
      this.spawnAccumulator = 0
      this.spawnLaneWave()
    }

    const moveSpeed = 290 + this.score * 2
    for (const item of [...this.laneObjects]) {
      item.shape.y += moveSpeed * delta

      if (item.shape.y > GAME_HEIGHT + 40) {
        this.removeLaneObject(item)
        continue
      }

      if (Phaser.Math.Distance.Between(item.shape.x, item.shape.y, this.player.x, this.player.y) < 28) {
        if (item.kind === 'pickup') {
          this.score += 3
          this.cameras.main.flash(120, 102, 210, 199, false)
        } else {
          this.health -= 18
          this.cameras.main.shake(90, 0.005)
        }
        this.removeLaneObject(item)
      }
    }

    if (this.health <= 0) {
      this.finishGame(false, 'Too many collisions. The run breaks apart.')
      return
    }

    if (this.timeLeft <= 0) {
      this.finishGame(true, 'Run complete. The concept survives contact.')
    }
  }

  private createRelicSprint(): void {
    this.objectiveText.setText([
      `${this.blueprint.hero.name}: pulse the hunters and grab the relics.`,
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

  private updateRelicSprint(delta: number): void {
    this.movePlayerFree(delta)

    if (this.spawnAccumulator >= 1.4 && this.enemies.length < 9) {
      this.spawnAccumulator = 0
      this.spawnEnemyAtEdge(95)
    }

    if (this.keys && Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
      this.emitBurst(110)
    }

    this.updateEnemiesTowardPlayer(delta, 0.8)

    for (const relic of [...this.shards]) {
      if (Phaser.Math.Distance.Between(relic.shape.x, relic.shape.y, this.player.x, this.player.y) < 24) {
        relic.shape.destroy()
        this.shards.splice(this.shards.indexOf(relic), 1)
        this.relicsRemaining -= 1
        this.score += 8
        this.cameras.main.flash(160, 243, 185, 95, false)
      }
    }

    if (this.health <= 0) {
      this.finishGame(false, 'The hunters close in before the last relic drops.')
      return
    }

    if (this.relicsRemaining <= 0) {
      this.finishGame(true, 'Every relic secured. The prototype loop is clear.')
    }
  }

  private movePlayerFree(delta: number): void {
    if (!this.keys) {
      return
    }

    let vx = 0
    let vy = 0
    const speed = 230

    if (this.keys.W.isDown || this.keys.UP.isDown) vy -= 1
    if (this.keys.S.isDown || this.keys.DOWN.isDown) vy += 1
    if (this.keys.A.isDown || this.keys.LEFT.isDown) vx -= 1
    if (this.keys.D.isDown || this.keys.RIGHT.isDown) vx += 1

    const vector = new Phaser.Math.Vector2(vx, vy).normalize().scale(speed * delta)
    this.player.x = Phaser.Math.Clamp(this.player.x + vector.x, 40, GAME_WIDTH - 40)
    this.player.y = Phaser.Math.Clamp(this.player.y + vector.y, 80, GAME_HEIGHT - 36)
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

  private fireAtNearestEnemy(): void {
    const nearest = this.enemies
      .map((enemy) => ({
        enemy,
        distance: Phaser.Math.Distance.Between(enemy.shape.x, enemy.shape.y, this.player.x, this.player.y),
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
        this.score += 2
        this.spawnShard(hit.shape.x, hit.shape.y)
        this.removeProjectile(projectile)
        this.removeEnemy(hit)
      }
    }
  }

  private updateEnemiesTowardPlayer(delta: number, chaseMultiplier: number): void {
    for (const enemy of [...this.enemies]) {
      const vector = new Phaser.Math.Vector2(this.player.x - enemy.shape.x, this.player.y - enemy.shape.y)
        .normalize()
        .scale(enemy.vy * chaseMultiplier * delta)

      enemy.shape.x += vector.x
      enemy.shape.y += vector.y

      if (Phaser.Math.Distance.Between(enemy.shape.x, enemy.shape.y, this.player.x, this.player.y) < 24) {
        this.health -= this.blueprint.template === 'relic-sprint' ? 10 : 8
        enemy.shape.x -= vector.x * 12
        enemy.shape.y -= vector.y * 12
        this.cameras.main.shake(70, 0.003)
      }
    }

    if (this.health <= 0) {
      this.finishGame(false, this.blueprint.loseCondition)
    }
  }

  private emitBurst(radius: number): void {
    if (this.burstCooldown > 0) {
      return
    }

    this.burstCooldown = this.blueprint.template === 'relic-sprint' ? 1.5 : 2.2
    this.cameras.main.flash(120, 243, 185, 95, false)

    for (const enemy of [...this.enemies]) {
      const distance = Phaser.Math.Distance.Between(enemy.shape.x, enemy.shape.y, this.player.x, this.player.y)
      if (distance <= radius) {
        this.score += 3
        this.spawnShard(enemy.shape.x, enemy.shape.y)
        this.removeEnemy(enemy)
      }
    }
  }

  private spawnShard(x: number, y: number): void {
    if (this.blueprint.template === 'relic-sprint') {
      return
    }

    const shard = this.add.circle(x, y, 6, parseColor(this.blueprint.palette.accent), 0.95)
    this.shards.push({
      shape: shard,
      vx: Phaser.Math.Between(-20, 20),
      vy: Phaser.Math.Between(-20, 20),
    })
  }

  private collectNearbyShards(radius: number, scoreGain: number): void {
    const delta = this.game.loop.delta / 1000

    for (const shard of [...this.shards]) {
      shard.shape.x += shard.vx * delta
      shard.shape.y += shard.vy * delta

      if (Phaser.Math.Distance.Between(shard.shape.x, shard.shape.y, this.player.x, this.player.y) < radius) {
        this.score += scoreGain
        shard.shape.destroy()
        this.shards.splice(this.shards.indexOf(shard), 1)
      }
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

    this.laneObjects.push({
      shape: hazard,
      vx: 0,
      vy: 0,
      lane: hazardLane,
      kind: 'hazard',
    })
    this.laneObjects.push({
      shape: pickup,
      vx: 0,
      vy: 0,
      lane: pickupLane,
      kind: 'pickup',
    })
  }

  private refreshHud(): void {
    const topLine =
      this.blueprint.template === 'relic-sprint'
        ? `Health ${Math.max(0, this.health)}   Relics ${this.relicsRemaining}   Score ${this.score}`
        : `Health ${Math.max(0, this.health)}   Time ${Math.max(0, this.timeLeft)}   Score ${this.score}`

    const burstLine = this.burstCooldown > 0 ? `Burst cooling ${this.burstCooldown.toFixed(1)}s` : 'Burst ready'
    this.statusText.setText(`${topLine}   ${burstLine}`)
  }

  private finishGame(won: boolean, summary: string): void {
    if (this.gameEnded) {
      return
    }

    this.gameEnded = true
    this.statusText.setText(won ? 'STATUS: PLAYABLE PROTOTYPE ONLINE' : 'STATUS: LOOP COLLAPSED')
    this.objectiveText.setText([summary, this.blueprint.tagline])

    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 440, 132, parseColor(this.blueprint.palette.surface), 0.92)
      .setStrokeStyle(2, parseColor(won ? this.blueprint.palette.accentAlt : this.blueprint.palette.danger), 0.95)

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 22, won ? 'PROTOTYPE STABLE' : 'TRY AGAIN', {
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: '28px',
        color: this.blueprint.palette.text,
      })
      .setOrigin(0.5)

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 18, summary, {
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: '13px',
        color: '#d7d0c5',
        align: 'center',
        wordWrap: { width: 360 },
      })
      .setOrigin(0.5)
  }

  private removeEnemy(enemy: MovingDot): void {
    enemy.shape.destroy()
    this.enemies.splice(this.enemies.indexOf(enemy), 1)
  }

  private removeProjectile(projectile: MovingDot): void {
    projectile.shape.destroy()
    this.projectiles.splice(this.projectiles.indexOf(projectile), 1)
  }

  private removeLaneObject(object: LaneObject): void {
    object.shape.destroy()
    this.laneObjects.splice(this.laneObjects.indexOf(object), 1)
  }
}

function parseColor(color: string): number {
  return Number.parseInt(color.replace('#', ''), 16)
}
