import Phaser from 'phaser'

import type { GameBlueprint } from '../../shared/game'

const VIEW_WIDTH = 960
const VIEW_HEIGHT = 540
const WORLD_WIDTH = 1664
const WORLD_HEIGHT = 1088

const BOOT_SCENE_KEY = 'guardians-boot'
const TITLE_SCENE_KEY = 'guardians-title'
const TUTORIAL_SCENE_KEY = 'guardians-tutorial'
const FARM_SCENE_KEY = 'guardians-farm'
const WIN_SCENE_KEY = 'guardians-win'

const WORLD_MARGIN = 72
const TASK_INTERACTION_RADIUS = 108

type ActorRole = 'cat' | 'dog'
type Direction = 'up' | 'down' | 'left' | 'right'
type CharacterPose = 'idle' | 'walk-a' | 'walk-b' | 'happy' | 'thinking' | 'point'
type TaskZone = 'energy' | 'water' | 'farm' | 'nature'
type TaskId =
  | 'solar-panels'
  | 'wind-turbines'
  | 'solar-tractor'
  | 'energy-automation'
  | 'water-automation'
  | 'water-purifier'
  | 'eco-farm'
  | 'eco-livestock'
  | 'insect-control'
type AnimalKind = 'cow' | 'bunny' | 'bird' | 'bee' | 'fish' | 'hen'

type EcoTaskDefinition = {
  id: TaskId
  label: string
  shortLabel: string
  zone: TaskZone
  x: number
  y: number
  description: string
  voiceLine: string
  celebration: string
  buttonLabel: string
}

type WinSceneData = {
  completedCount: number
  score: number
}

type MatterEllipse = Phaser.GameObjects.Ellipse & { body: MatterJS.BodyType }

type ActorState = {
  role: ActorRole
  body: MatterEllipse
  art: Phaser.GameObjects.Image
  shadow: Phaser.GameObjects.Ellipse
  clickTarget: Phaser.Math.Vector2 | null
  assistTarget: Phaser.Math.Vector2 | null
  history: Array<{ x: number; y: number }>
  pose: CharacterPose
  direction: Direction
  celebrationUntil: number
  promptUntil: number
}

type AnimalState = {
  kind: AnimalKind
  zone: TaskZone
  x: number
  y: number
  baseX: number
  baseY: number
  phase: number
  speed: number
  sprite: Phaser.GameObjects.Image
  shadow: Phaser.GameObjects.Ellipse
  reactionUntil: number
}

type TaskStationState = {
  def: EcoTaskDefinition
  pedestal: Phaser.GameObjects.Ellipse
  glow: Phaser.GameObjects.Ellipse
  marker: Phaser.GameObjects.Image
  label: Phaser.GameObjects.Text
  placed: boolean
  bounceOffset: number
}

type PopupState = {
  container: Phaser.GameObjects.Container
  title: Phaser.GameObjects.Text
  body: Phaser.GameObjects.Text
  quote: Phaser.GameObjects.Text
  icon: Phaser.GameObjects.Image
  button: Phaser.GameObjects.Container
  buttonLabel: Phaser.GameObjects.Text
}

type ButtonState = {
  container: Phaser.GameObjects.Container
  background: Phaser.GameObjects.RoundedRectangle | Phaser.GameObjects.Rectangle
  label: Phaser.GameObjects.Text
}

const TASKS: readonly EcoTaskDefinition[] = [
  {
    id: 'solar-panels',
    label: 'Paneles Solares',
    shortLabel: 'Paneles',
    zone: 'energy',
    x: 322,
    y: 250,
    description: 'Los paneles capturan el sol y dan electricidad limpia para la granja.',
    voiceLine: '¡Miau! ¡Vamos a poner paneles que brillan como el sol!',
    celebration: 'El tejado se ilumina y la colina de energia despierta con flores doradas.',
    buttonLabel: 'Colocar Paneles',
  },
  {
    id: 'wind-turbines',
    label: 'Molinos de Viento',
    shortLabel: 'Molinos',
    zone: 'energy',
    x: 568,
    y: 190,
    description: 'El viento hace electricidad sin humo y ayuda a que el aire este mas limpio.',
    voiceLine: '¡Guau! ¡Que giren suavecito y llenen el campo de energia!',
    celebration: 'Las aspas giran, sopla una brisa feliz y los pajaritos vuelan en circulos.',
    buttonLabel: 'Activar Molinos',
  },
  {
    id: 'solar-tractor',
    label: 'Bateria Solar del Tractor',
    shortLabel: 'Tractor',
    zone: 'energy',
    x: 536,
    y: 350,
    description: 'El tractor usa el sol y trabaja sin echar humo al cielo.',
    voiceLine: '¡Miau! ¡El tractor verde puede trabajar sin ensuciar el aire!',
    celebration: 'El tractor arranca en silencio y deja un caminito brillante entre los cultivos.',
    buttonLabel: 'Cargar Tractor',
  },
  {
    id: 'energy-automation',
    label: 'Ahorro de Energia',
    shortLabel: 'Luces Listas',
    zone: 'energy',
    x: 210,
    y: 360,
    description: 'Sensores y luces listas usan solo la energia justa para cada momento.',
    voiceLine: '¡Guau! ¡La casita enciende lo justo y ahorra un monton!',
    celebration: 'Las ventanas brillan con calidez y la granja sonríe con lucecitas suaves.',
    buttonLabel: 'Ordenar Casita',
  },
  {
    id: 'water-automation',
    label: 'Riego Inteligente',
    shortLabel: 'Riego',
    zone: 'water',
    x: 1110,
    y: 260,
    description: 'El agua cae solo donde hace falta para que ninguna gotita se desperdicie.',
    voiceLine: '¡Miau! ¡Las plantas beben solo lo que necesitan!',
    celebration: 'Aparecen gotitas brillantes y las hileras verdes despiertan junto al agua.',
    buttonLabel: 'Regar con Cuidado',
  },
  {
    id: 'water-purifier',
    label: 'Depurado de Aguas',
    shortLabel: 'Rio Limpio',
    zone: 'water',
    x: 1286,
    y: 450,
    description: 'Con filtros y plantas acuaticas limpiamos el rio para peces, flores y patitos.',
    voiceLine: '¡Guau! ¡El agua vuelve a estar clarita y feliz!',
    celebration: 'El rio azul brilla de nuevo, saltan peces y crecen juncos llenos de vida.',
    buttonLabel: 'Limpiar el Rio',
  },
  {
    id: 'eco-farm',
    label: 'Agricultura Ecologica',
    shortLabel: 'Huerto Eco',
    zone: 'farm',
    x: 356,
    y: 760,
    description: 'Cultivamos sin venenos, con tierra sana, flores amigas y mucho amor.',
    voiceLine: '¡Miau! ¡Mira como crecen las verduras cuando cuidamos la tierra!',
    celebration: 'Brotan tomates, zanahorias y margaritas mientras las mariposas llenan el huerto.',
    buttonLabel: 'Sembrar Eco',
  },
  {
    id: 'eco-livestock',
    label: 'Ganaderia Ecologica',
    shortLabel: 'Corral Feliz',
    zone: 'farm',
    x: 654,
    y: 780,
    description: 'Los animales viven contentos, comen bien y ayudan a que el suelo siga sano.',
    voiceLine: '¡Guau! ¡Las vaquitas y las gallinas tienen un corral superfeliz!',
    celebration: 'El corral se llena de hierba fresca y los animales bailan alrededor de Perro.',
    buttonLabel: 'Cuidar Animales',
  },
  {
    id: 'insect-control',
    label: 'Insectos Amigos',
    shortLabel: 'Abejas y Mariquitas',
    zone: 'nature',
    x: 1022,
    y: 772,
    description: 'Usamos insectos amigos y plantas aromaticas en vez de venenos para cuidar el campo.',
    voiceLine: '¡Miau! ¡Las mariquitas ayudan y las abejas zumban contentas!',
    celebration: 'Aparecen flores nuevas, zumban las abejas y las mariquitas protegen el jardin.',
    buttonLabel: 'Llamar Insectos Amigos',
  },
] as const

const TREE_POSITIONS = [
  { x: 154, y: 164 },
  { x: 240, y: 132 },
  { x: 760, y: 122 },
  { x: 908, y: 184 },
  { x: 1426, y: 176 },
  { x: 1524, y: 260 },
  { x: 1488, y: 524 },
  { x: 1544, y: 762 },
  { x: 1410, y: 916 },
  { x: 908, y: 934 },
  { x: 660, y: 934 },
  { x: 196, y: 904 },
]

const FLOWER_PATCHES = [
  { x: 194, y: 242, threshold: 0.12, zone: 'energy' as TaskZone },
  { x: 298, y: 418, threshold: 0.16, zone: 'energy' as TaskZone },
  { x: 532, y: 530, threshold: 0.18, zone: 'farm' as TaskZone },
  { x: 406, y: 842, threshold: 0.34, zone: 'farm' as TaskZone },
  { x: 782, y: 748, threshold: 0.44, zone: 'farm' as TaskZone },
  { x: 1164, y: 322, threshold: 0.28, zone: 'water' as TaskZone },
  { x: 1324, y: 574, threshold: 0.52, zone: 'water' as TaskZone },
  { x: 1042, y: 858, threshold: 0.58, zone: 'nature' as TaskZone },
  { x: 1206, y: 808, threshold: 0.64, zone: 'nature' as TaskZone },
  { x: 1384, y: 700, threshold: 0.72, zone: 'nature' as TaskZone },
]

const NPC_BLUEPRINTS = [
  { kind: 'cow' as AnimalKind, zone: 'farm' as TaskZone, x: 760, y: 760, speed: 0.42 },
  { kind: 'hen' as AnimalKind, zone: 'farm' as TaskZone, x: 708, y: 846, speed: 0.58 },
  { kind: 'bunny' as AnimalKind, zone: 'farm' as TaskZone, x: 464, y: 718, speed: 0.54 },
  { kind: 'bee' as AnimalKind, zone: 'nature' as TaskZone, x: 1068, y: 724, speed: 0.86 },
  { kind: 'bee' as AnimalKind, zone: 'nature' as TaskZone, x: 1168, y: 800, speed: 0.94 },
  { kind: 'bird' as AnimalKind, zone: 'energy' as TaskZone, x: 586, y: 148, speed: 0.76 },
  { kind: 'bird' as AnimalKind, zone: 'energy' as TaskZone, x: 692, y: 236, speed: 0.7 },
  { kind: 'fish' as AnimalKind, zone: 'water' as TaskZone, x: 1272, y: 520, speed: 0.62 },
  { kind: 'fish' as AnimalKind, zone: 'water' as TaskZone, x: 1330, y: 608, speed: 0.66 },
] as const

const CHARACTER_DIRECTIONS: readonly Direction[] = ['down', 'left', 'right', 'up']

export function createGuardiansFieldGameConfig(
  target: HTMLDivElement,
  blueprint: GameBlueprint,
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    width: VIEW_WIDTH,
    height: VIEW_HEIGHT,
    parent: target,
    backgroundColor: blueprint.palette.bg,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'matter',
      matter: {
        gravity: { x: 0, y: 0 },
      },
    },
    scene: [
      new GuardiansBootScene(blueprint),
      new GuardiansTitleScene(blueprint),
      new GuardiansTutorialScene(blueprint),
      new GuardiansFarmScene(blueprint),
      new GuardiansWinScene(blueprint),
    ],
  }
}

abstract class GuardiansBaseScene extends Phaser.Scene {
  protected readonly blueprint: GameBlueprint

  protected constructor(key: string, blueprint: GameBlueprint) {
    super(key)
    this.blueprint = blueprint
  }

  protected drawSceneBackdrop(): void {
    const graphics = this.add.graphics()
    for (let i = 0; i < 16; i += 1) {
      const t = i / 15
      graphics.fillStyle(mixColors(parseColor('#9fe2ff'), parseColor('#dff8ff'), t * 0.55), 1)
      graphics.fillRect(0, i * (VIEW_HEIGHT / 16), VIEW_WIDTH, VIEW_HEIGHT / 16 + 2)
    }

    graphics.fillStyle(parseColor('#d8f2bd'), 1)
    graphics.fillEllipse(180, 440, 460, 160)
    graphics.fillEllipse(510, 470, 680, 180)
    graphics.fillEllipse(860, 438, 420, 140)
    graphics.fillStyle(parseColor('#b9df74'), 0.82)
    graphics.fillEllipse(140, 472, 420, 120)
    graphics.fillEllipse(740, 488, 520, 120)

    graphics.fillStyle(parseColor('#ffffff'), 0.95)
    graphics.fillEllipse(162, 96, 120, 46)
    graphics.fillEllipse(232, 88, 96, 36)
    graphics.fillEllipse(742, 76, 152, 54)
    graphics.fillEllipse(812, 84, 96, 42)

    this.add.circle(828, 96, 42, parseColor('#ffe27a'), 0.98)
    this.add.circle(846, 80, 14, parseColor('#fff4b2'), 0.8)
  }

  protected createButton(
    x: number,
    y: number,
    width: number,
    label: string,
    onClick: () => void,
    accent = this.blueprint.palette.accent,
  ): ButtonState {
    const background = this.add
      .rectangle(0, 0, width, 64, parseColor(accent), 0.96)
      .setStrokeStyle(4, parseColor('#ffffff'), 0.8)
    const text = this.add
      .text(0, 0, label, {
        fontFamily: 'Baloo 2, Nunito, sans-serif',
        fontSize: '28px',
        color: '#16324a',
      })
      .setOrigin(0.5)

    const container = this.add.container(x, y, [background, text]).setSize(width, 64).setDepth(50)
    const hitbox = this.add.rectangle(0, 0, width, 64, 0x000000, 0.001)
    container.add(hitbox)
    hitbox.setInteractive({ useHandCursor: true })
    hitbox.on('pointerover', () => {
      background.setScale(1.04, 1.04)
      text.setScale(1.03)
    })
    hitbox.on('pointerout', () => {
      background.setScale(1, 1)
      text.setScale(1)
    })
    hitbox.on('pointerdown', () => {
      this.cameras.main.flash(120, 255, 238, 170, false)
      onClick()
    })

    return { container, background, label: text }
  }

  protected createSpeechCard(x: number, y: number, width: number, title: string, lines: string[]): Phaser.GameObjects.Container {
    const background = this.add
      .rectangle(0, 0, width, 168, parseColor('#fff8ef'), 0.94)
      .setStrokeStyle(4, parseColor(this.blueprint.palette.accentAlt), 0.7)
    const heading = this.add
      .text(-width * 0.5 + 24, -56, title, {
        fontFamily: 'Baloo 2, Nunito, sans-serif',
        fontSize: '26px',
        color: '#16324a',
      })
      .setOrigin(0, 0.5)
    const body = this.add
      .text(-width * 0.5 + 24, -16, lines.join('\n'), {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '20px',
        color: '#23415b',
        wordWrap: { width: width - 48 },
        lineSpacing: 6,
      })
      .setOrigin(0, 0)

    return this.add.container(x, y, [background, heading, body]).setDepth(40)
  }
}

class GuardiansBootScene extends GuardiansBaseScene {
  constructor(blueprint: GameBlueprint) {
    super(BOOT_SCENE_KEY, blueprint)
  }

  create(): void {
    prepareGuardiansTextures(this)
    this.scene.start(TITLE_SCENE_KEY)
  }
}

class GuardiansTitleScene extends GuardiansBaseScene {
  private creditsCard?: Phaser.GameObjects.Container

  constructor(blueprint: GameBlueprint) {
    super(TITLE_SCENE_KEY, blueprint)
  }

  create(): void {
    this.drawSceneBackdrop()

    const rainbow = this.add.graphics().setDepth(8)
    rainbow.lineStyle(14, parseColor('#ff9b8d'), 0.74).arc(740, 250, 164, Phaser.Math.DegToRad(210), Phaser.Math.DegToRad(330), false)
    rainbow.lineStyle(14, parseColor('#ffd66d'), 0.68).arc(740, 250, 146, Phaser.Math.DegToRad(210), Phaser.Math.DegToRad(330), false)
    rainbow.lineStyle(14, parseColor('#84df9f'), 0.68).arc(740, 250, 128, Phaser.Math.DegToRad(210), Phaser.Math.DegToRad(330), false)
    rainbow.lineStyle(14, parseColor('#7fd2ff'), 0.68).arc(740, 250, 110, Phaser.Math.DegToRad(210), Phaser.Math.DegToRad(330), false)

    this.add
      .text(VIEW_WIDTH / 2, 104, this.blueprint.title, {
        fontFamily: 'Baloo 2, Nunito, sans-serif',
        fontSize: '46px',
        color: '#16324a',
        align: 'center',
        wordWrap: { width: 740 },
      })
      .setOrigin(0.5)
      .setDepth(30)

    this.add
      .text(VIEW_WIDTH / 2, 188, 'Gato y Perro curan el campo con nueve soluciones ecologicas', {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '22px',
        color: '#28536d',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(30)

    this.add.image(320, 324, characterTextureKey('cat', 'down', 'happy')).setDisplaySize(152, 152).setDepth(26)
    this.add.image(458, 342, characterTextureKey('dog', 'right', 'happy')).setDisplaySize(152, 152).setDepth(27)
    this.add.image(640, 308, ecoTextureKey('wind-turbines', 'active-a')).setDisplaySize(148, 148).setDepth(22)
    this.add.image(792, 336, ecoTextureKey('solar-panels', 'active-a')).setDisplaySize(144, 144).setDepth(22)
    this.add.image(722, 208, butterflyTextureKey(0)).setDisplaySize(72, 72).setDepth(32)

    this.createButton(VIEW_WIDTH / 2, 376, 274, 'Jugar', () => {
      this.scene.start(TUTORIAL_SCENE_KEY)
    })
    this.createButton(VIEW_WIDTH / 2, 454, 274, 'Como Jugar', () => {
      this.scene.start(TUTORIAL_SCENE_KEY)
    }, '#84df9f')
    this.createButton(VIEW_WIDTH / 2, 518, 274, 'Creditos', () => {
      this.toggleCredits()
    }, '#ffd66d').container.setScale(0.92)
  }

  private toggleCredits(): void {
    if (this.creditsCard) {
      this.creditsCard.destroy()
      this.creditsCard = undefined
      return
    }

    const overlay = this.add.rectangle(VIEW_WIDTH / 2, VIEW_HEIGHT / 2, VIEW_WIDTH, VIEW_HEIGHT, 0x17354b, 0.42).setDepth(90)
    const card = this.createSpeechCard(VIEW_WIDTH / 2, VIEW_HEIGHT / 2, 620, 'Creditos', [
      'Demo curada dentro de Gameclaw.',
      'Direccion visual: granja magica infantil y muy positiva.',
      'Objetivo: explicar soluciones ecologicas con una experiencia suave y jugable.',
    ])
    card.setDepth(95)
    const close = this.createButton(VIEW_WIDTH / 2, VIEW_HEIGHT / 2 + 112, 220, 'Cerrar', () => {
      overlay.destroy()
      card.destroy()
      close.container.destroy()
      this.creditsCard = undefined
    }, '#84df9f')
    close.container.setDepth(96)

    this.creditsCard = this.add.container(0, 0, [overlay, card, close.container]).setDepth(90)
  }
}

class GuardiansTutorialScene extends GuardiansBaseScene {
  constructor(blueprint: GameBlueprint) {
    super(TUTORIAL_SCENE_KEY, blueprint)
  }

  create(): void {
    this.drawSceneBackdrop()
    this.add.rectangle(VIEW_WIDTH / 2, VIEW_HEIGHT / 2, VIEW_WIDTH, VIEW_HEIGHT, parseColor('#16324a'), 0.08)

    this.add
      .text(VIEW_WIDTH / 2, 64, 'La mariposa sabia te ensena en tres pasos', {
        fontFamily: 'Baloo 2, Nunito, sans-serif',
        fontSize: '36px',
        color: '#16324a',
      })
      .setOrigin(0.5)

    this.add.image(126, 110, butterflyTextureKey(1)).setDisplaySize(84, 84).setDepth(30)
    this.add.image(162, 420, characterTextureKey('cat', 'right', 'idle')).setDisplaySize(124, 124).setDepth(24)
    this.add.image(280, 432, characterTextureKey('dog', 'right', 'idle')).setDisplaySize(126, 126).setDepth(24)

    this.createSpeechCard(326, 194, 264, '1. Moverse', [
      'Usa WASD o las flechas.',
      'Tambien puedes hacer clic para ir.',
    ])
    this.createSpeechCard(632, 194, 264, '2. Acercarte', [
      'Busca estaciones brillantes.',
      'Pulsa ESPACIO o haz clic cerca.',
    ])
    this.createSpeechCard(478, 382, 360, '3. Colocar Soluciones', [
      'Pulsa el boton grande del cartel.',
      'Cada mejora hace el campo mas verde y feliz.',
    ])

    this.add.image(730, 372, ecoTextureKey('water-purifier', 'active-a')).setDisplaySize(124, 124).setDepth(26)
    this.add.image(850, 360, ecoTextureKey('eco-farm', 'active-a')).setDisplaySize(124, 124).setDepth(26)

    this.createButton(VIEW_WIDTH / 2, 500, 288, 'Entrar al Campo', () => {
      this.scene.start(FARM_SCENE_KEY)
    })
  }
}

class GuardiansFarmScene extends GuardiansBaseScene {
  private readonly keys: Partial<Record<'W' | 'A' | 'S' | 'D' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'SPACE' | 'TAB', Phaser.Input.Keyboard.Key>> = {}
  private cat!: ActorState
  private dog!: ActorState
  private activeRole: ActorRole = 'cat'
  private tasks: TaskStationState[] = []
  private animals: AnimalState[] = []
  private currentTask: TaskStationState | null = null
  private popup!: PopupState
  private popupTask: TaskStationState | null = null
  private promptText!: Phaser.GameObjects.Text
  private progressText!: Phaser.GameObjects.Text
  private scoreText!: Phaser.GameObjects.Text
  private moodIcon!: Phaser.GameObjects.Text
  private guidanceText!: Phaser.GameObjects.Text
  private pauseOverlay?: Phaser.GameObjects.Container
  private paused = false
  private completedCount = 0
  private ecoScore = 0
  private readonly completedTaskIds = new Set<TaskId>()
  private readonly zoneProgress: Record<TaskZone, number> = {
    energy: 0,
    water: 0,
    farm: 0,
    nature: 0,
  }
  private skyGraphics!: Phaser.GameObjects.Graphics
  private groundGraphics!: Phaser.GameObjects.Graphics
  private riverGraphics!: Phaser.GameObjects.Graphics
  private decorGraphics!: Phaser.GameObjects.Graphics
  private frontGraphics!: Phaser.GameObjects.Graphics
  private sparkleLayer!: Phaser.GameObjects.Particles.ParticleEmitter

  constructor(blueprint: GameBlueprint) {
    super(FARM_SCENE_KEY, blueprint)
  }

  create(): void {
    prepareGuardiansTextures(this)
    this.input.mouse?.disableContextMenu()
    this.matter.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    this.cameras.main.setZoom(1)
    this.cameras.main.setRoundPixels(true)

    this.createWorldLayers()
    this.createStaticObstacles()
    this.createActors()
    this.createAnimals()
    this.createTaskStations()
    this.createHud()
    this.createPopup()
    this.createAmbientEffects()
    this.bindInput()
    this.redrawFarmWorld()
    this.cameras.main.startFollow(this.cat.body, true, 0.08, 0.08)
  }

  update(_time: number, deltaMs: number): void {
    if (this.paused) {
      return
    }

    const delta = deltaMs / 1000
    this.handleControls(delta)
    this.updateActor(this.cat, delta, this.activeRole === 'cat')
    this.updateActor(this.dog, delta, this.activeRole === 'dog')
    this.updateAnimals(delta)
    this.updateTaskStations()
    this.updateTaskPrompt()
    this.updateHud()
  }

  private createWorldLayers(): void {
    this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, parseColor('#9fe2ff'), 1).setDepth(-90)
    this.skyGraphics = this.add.graphics().setDepth(-80)
    this.groundGraphics = this.add.graphics().setDepth(-40)
    this.riverGraphics = this.add.graphics().setDepth(-20)
    this.decorGraphics = this.add.graphics().setDepth(-10)
    this.frontGraphics = this.add.graphics().setDepth(12)
  }

  private createStaticObstacles(): void {
    const obstacles = [
      { x: 262, y: 286, width: 188, height: 128 },
      { x: 666, y: 786, width: 202, height: 122 },
      { x: 1238, y: 534, width: 116, height: 246 },
      { x: 1134, y: 858, width: 220, height: 118 },
    ]

    for (const obstacle of obstacles) {
      const shape = this.add.rectangle(obstacle.x, obstacle.y, obstacle.width, obstacle.height, 0x000000, 0.01)
      this.matter.add.gameObject(shape, { isStatic: true })
    }
  }

  private createActors(): void {
    this.cat = this.createActor('cat', 250, 520)
    this.dog = this.createActor('dog', 318, 560)
    this.dog.assistTarget = null
  }

  private createActor(role: ActorRole, x: number, y: number): ActorState {
    const bodyShape = this.add.ellipse(x, y, 28, 22, 0xffffff, 0.01)
    const body = this.matter.add.gameObject(bodyShape, {
      frictionAir: 0.22,
      restitution: 0.12,
    }) as MatterEllipse
    body.setAlpha(0.01)
    body.setDepth(5)
    this.matter.body.setInertia(body.body, Infinity)
    this.matter.body.setVelocity(body.body, { x: 0, y: 0 })

    const shadow = this.add.ellipse(x, y + 20, 34, 12, 0x06141f, 0.18).setDepth(6)
    const art = this.add
      .image(x, y - 8, characterTextureKey(role, 'down', 'idle'))
      .setDisplaySize(90, 90)
      .setDepth(7)

    return {
      role,
      body,
      art,
      shadow,
      clickTarget: null,
      assistTarget: null,
      history: [],
      pose: 'idle',
      direction: 'down',
      celebrationUntil: 0,
      promptUntil: 0,
    }
  }

  private createAnimals(): void {
    this.animals = NPC_BLUEPRINTS.map((blueprint, index) => {
      const shadow = this.add.ellipse(blueprint.x, blueprint.y + 12, 24, 8, 0x06141f, 0.12).setDepth(8)
      const sprite = this.add
        .image(blueprint.x, blueprint.y, animalTextureKey(blueprint.kind, 0))
        .setDisplaySize(56, 56)
        .setDepth(9)

      return {
        ...blueprint,
        baseX: blueprint.x,
        baseY: blueprint.y,
        phase: index * 0.8,
        sprite,
        shadow,
        reactionUntil: 0,
      }
    })
  }

  private createTaskStations(): void {
    this.tasks = TASKS.map((def) => {
      const pedestal = this.add.ellipse(def.x, def.y + 34, 92, 26, 0x17354b, 0.18).setDepth(10)
      const glow = this.add.ellipse(def.x, def.y, 104, 104, parseColor('#fff6c2'), 0.1).setDepth(11)
      const marker = this.add
        .image(def.x, def.y, ecoTextureKey(def.id, 'base'))
        .setDisplaySize(94, 94)
        .setDepth(12)
      const label = this.add
        .text(def.x, def.y + 60, def.shortLabel, {
          fontFamily: 'Baloo 2, Nunito, sans-serif',
          fontSize: '18px',
          color: '#16324a',
          backgroundColor: '#fff9e8',
          padding: { left: 10, right: 10, top: 4, bottom: 4 },
        })
        .setOrigin(0.5)
        .setDepth(14)

      const station = { def, pedestal, glow, marker, label, placed: false, bounceOffset: Phaser.Math.FloatBetween(0, Math.PI * 2) }

      marker.setInteractive({ useHandCursor: true })
      marker.on('pointerdown', () => {
        if (this.popupTask) {
          return
        }

        if (this.getActiveDistanceTo(def.x, def.y) <= TASK_INTERACTION_RADIUS + 24) {
          this.openTaskPopup(station)
        }
      })

      return station
    })
  }

  private createHud(): void {
    this.add.rectangle(VIEW_WIDTH / 2, 34, 860, 58, parseColor('#fff8ef'), 0.86).setScrollFactor(0).setDepth(40)
      .setStrokeStyle(3, parseColor(this.blueprint.palette.accentAlt), 0.65)

    this.progressText = this.add
      .text(96, 34, 'Soluciones 0 / 9', {
        fontFamily: 'Baloo 2, Nunito, sans-serif',
        fontSize: '26px',
        color: '#16324a',
      })
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(42)

    this.scoreText = this.add
      .text(390, 34, 'Puntos Eco 0', {
        fontFamily: 'Baloo 2, Nunito, sans-serif',
        fontSize: '26px',
        color: '#28536d',
      })
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(42)

    this.moodIcon = this.add
      .text(726, 34, '🙂', {
        fontSize: '34px',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(42)

    this.guidanceText = this.add
      .text(VIEW_WIDTH / 2, VIEW_HEIGHT - 28, 'Explora el campo y acercate a una estacion brillante.', {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '20px',
        color: '#17354b',
        backgroundColor: '#fff8ef',
        padding: { left: 12, right: 12, top: 6, bottom: 6 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(42)

    const pause = this.createButton(868, 34, 124, 'Pausa', () => {
      this.togglePause()
    }, '#84df9f')
    pause.container.setScrollFactor(0).setDepth(43).setScale(0.74)

    this.promptText = this.add
      .text(0, 0, '', {
        fontFamily: 'Baloo 2, Nunito, sans-serif',
        fontSize: '20px',
        color: '#16324a',
        backgroundColor: '#fff8ef',
        padding: { left: 10, right: 10, top: 6, bottom: 6 },
      })
      .setOrigin(0.5)
      .setDepth(34)
      .setVisible(false)
  }

  private createPopup(): void {
    const backdrop = this.add.rectangle(VIEW_WIDTH / 2, VIEW_HEIGHT / 2, VIEW_WIDTH, VIEW_HEIGHT, 0x17354b, 0.42)
    const panel = this.add.rectangle(VIEW_WIDTH / 2, VIEW_HEIGHT / 2, 690, 362, parseColor('#fff8ef'), 0.96)
      .setStrokeStyle(5, parseColor(this.blueprint.palette.accentAlt), 0.72)
    const icon = this.add.image(VIEW_WIDTH / 2 - 250, VIEW_HEIGHT / 2 - 28, ecoTextureKey('solar-panels', 'base')).setDisplaySize(126, 126)
    const title = this.add.text(VIEW_WIDTH / 2 - 146, VIEW_HEIGHT / 2 - 132, '', {
      fontFamily: 'Baloo 2, Nunito, sans-serif',
      fontSize: '34px',
      color: '#16324a',
      wordWrap: { width: 390 },
    })
    const body = this.add.text(VIEW_WIDTH / 2 - 146, VIEW_HEIGHT / 2 - 58, '', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '23px',
      color: '#28536d',
      wordWrap: { width: 404 },
      lineSpacing: 8,
    })
    const quote = this.add.text(VIEW_WIDTH / 2 - 146, VIEW_HEIGHT / 2 + 72, '', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '22px',
      color: '#3d5e47',
      fontStyle: 'italic',
      wordWrap: { width: 404 },
    })

    const buttonBackground = this.add.rectangle(VIEW_WIDTH / 2, VIEW_HEIGHT / 2 + 138, 250, 60, parseColor('#ffd66d'), 1)
      .setStrokeStyle(4, parseColor('#ffffff'), 0.9)
    const buttonLabel = this.add.text(VIEW_WIDTH / 2, VIEW_HEIGHT / 2 + 138, '', {
      fontFamily: 'Baloo 2, Nunito, sans-serif',
      fontSize: '26px',
      color: '#16324a',
    }).setOrigin(0.5)
    const buttonHit = this.add.rectangle(VIEW_WIDTH / 2, VIEW_HEIGHT / 2 + 138, 250, 60, 0x000000, 0.001).setInteractive({ useHandCursor: true })
    buttonHit.on('pointerdown', () => {
      if (this.popupTask) {
        this.completeTask(this.popupTask)
      }
    })

    const button = this.add.container(0, 0, [buttonBackground, buttonLabel, buttonHit])
    const container = this.add.container(0, 0, [backdrop, panel, icon, title, body, quote, button]).setScrollFactor(0).setDepth(60)
    container.setVisible(false)
    backdrop.setInteractive()
    backdrop.on('pointerdown', () => this.closeTaskPopup())

    this.popup = {
      container,
      title,
      body,
      quote,
      icon,
      button,
      buttonLabel,
    }
  }

  private createAmbientEffects(): void {
    const particles = this.add.particles(0, 0, sparkleTextureKey(), {
      x: { min: 120, max: WORLD_WIDTH - 120 },
      y: { min: 120, max: WORLD_HEIGHT - 120 },
      lifespan: 2200,
      quantity: 1,
      frequency: 180,
      scale: { start: 0.42, end: 0 },
      alpha: { start: 0.28, end: 0 },
      tint: [parseColor('#ffe27a'), parseColor('#ffffff'), parseColor('#84df9f')],
      speedY: { min: -14, max: 6 },
      speedX: { min: -6, max: 6 },
    })

    particles.setDepth(16)
    this.sparkleLayer = particles.emitters.list[0]
  }

  private bindInput(): void {
    const keyboard = this.input.keyboard
    if (keyboard) {
      const mapped = keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,TAB') as Record<string, Phaser.Input.Keyboard.Key>
      this.keys.W = mapped.W
      this.keys.A = mapped.A
      this.keys.S = mapped.S
      this.keys.D = mapped.D
      this.keys.UP = mapped.UP
      this.keys.DOWN = mapped.DOWN
      this.keys.LEFT = mapped.LEFT
      this.keys.RIGHT = mapped.RIGHT
      this.keys.SPACE = mapped.SPACE
      this.keys.TAB = mapped.TAB
    }

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.popupTask) {
        return
      }

      const worldPoint = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2
      if (pointer.rightButtonDown()) {
        this.dog.assistTarget = new Phaser.Math.Vector2(worldPoint.x, worldPoint.y)
        this.dog.promptUntil = this.time.now + 1200
        return
      }

      this.getActiveActor().clickTarget = new Phaser.Math.Vector2(worldPoint.x, worldPoint.y)

      const nearbyTask = this.tasks.find(
        (task) =>
          !task.placed &&
          Phaser.Math.Distance.Between(worldPoint.x, worldPoint.y, task.def.x, task.def.y) <= 72 &&
          this.getActiveDistanceTo(task.def.x, task.def.y) <= TASK_INTERACTION_RADIUS + 24,
      )

      if (nearbyTask) {
        this.openTaskPopup(nearbyTask)
      }
    })
  }

  private handleControls(delta: number): void {
    if (!this.keys.SPACE || !this.keys.TAB) {
      return
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.TAB)) {
      this.activeRole = this.activeRole === 'cat' ? 'dog' : 'cat'
      this.cameras.main.startFollow(this.getActiveActor().body, true, 0.08, 0.08)
      const actor = this.getActiveActor()
      actor.promptUntil = this.time.now + 1100
      actor.pose = 'point'
      actor.celebrationUntil = this.time.now + 300
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) && this.currentTask && !this.popupTask) {
      this.openTaskPopup(this.currentTask)
    }

    const active = this.getActiveActor()
    const input = new Phaser.Math.Vector2()
    if (this.keys.W?.isDown || this.keys.UP?.isDown) input.y -= 1
    if (this.keys.S?.isDown || this.keys.DOWN?.isDown) input.y += 1
    if (this.keys.A?.isDown || this.keys.LEFT?.isDown) input.x -= 1
    if (this.keys.D?.isDown || this.keys.RIGHT?.isDown) input.x += 1

    if (input.lengthSq() > 0) {
      input.normalize()
      const speed = active.role === 'cat' ? 3.6 : 3.3
      active.clickTarget = null
      this.matter.body.setVelocity(active.body.body, { x: input.x * speed, y: input.y * speed })
    } else if (!active.clickTarget) {
      this.matter.body.setVelocity(active.body.body, {
        x: active.body.body.velocity.x * 0.82,
        y: active.body.body.velocity.y * 0.82,
      })
    }

    if (this.popupTask) {
      this.matter.body.setVelocity(this.cat.body.body, { x: 0, y: 0 })
      this.matter.body.setVelocity(this.dog.body.body, { x: 0, y: 0 })
    }

    this.cat.history.push({ x: this.cat.body.x, y: this.cat.body.y })
    this.dog.history.push({ x: this.dog.body.x, y: this.dog.body.y })
    if (this.cat.history.length > 72) this.cat.history.shift()
    if (this.dog.history.length > 72) this.dog.history.shift()

    const followerTarget =
      this.activeRole === 'cat'
        ? this.cat.history[Math.max(0, this.cat.history.length - 18)]
        : this.dog.history[Math.max(0, this.dog.history.length - 18)]
    const follower = this.activeRole === 'cat' ? this.dog : this.cat
    const assistTarget = follower.role === 'dog' && follower.assistTarget ? follower.assistTarget : followerTarget
    if (assistTarget) {
      const desired = new Phaser.Math.Vector2(assistTarget.x - follower.body.x, assistTarget.y - follower.body.y)
      if (desired.length() > 18) {
        desired.normalize().scale(follower.role === 'dog' ? 2.8 : 3)
        this.matter.body.setVelocity(follower.body.body, { x: desired.x, y: desired.y })
      } else if (follower.role === 'dog') {
        follower.assistTarget = null
        this.matter.body.setVelocity(follower.body.body, { x: 0, y: 0 })
      }
    } else {
      this.matter.body.setVelocity(follower.body.body, {
        x: follower.body.body.velocity.x * 0.82,
        y: follower.body.body.velocity.y * 0.82,
      })
    }

    if (delta > 0) {
      this.keepActorInBounds(this.cat)
      this.keepActorInBounds(this.dog)
    }
  }

  private updateActor(actor: ActorState, delta: number, isActive: boolean): void {
    if (actor.clickTarget) {
      const deltaToTarget = new Phaser.Math.Vector2(actor.clickTarget.x - actor.body.x, actor.clickTarget.y - actor.body.y)
      if (deltaToTarget.length() < 12) {
        actor.clickTarget = null
      } else {
        deltaToTarget.normalize().scale(actor.role === 'cat' ? 3.7 : 3.4)
        this.matter.body.setVelocity(actor.body.body, { x: deltaToTarget.x, y: deltaToTarget.y })
      }
    }

    const velocity = new Phaser.Math.Vector2(actor.body.body.velocity.x, actor.body.body.velocity.y)
    const speed = velocity.length()

    if (speed > 0.32) {
      actor.pose = this.time.now % 280 < 140 ? 'walk-a' : 'walk-b'
      if (Math.abs(velocity.x) > Math.abs(velocity.y)) {
        actor.direction = velocity.x < 0 ? 'left' : 'right'
      } else {
        actor.direction = velocity.y < 0 ? 'up' : 'down'
      }
    } else if (this.time.now < actor.celebrationUntil) {
      actor.pose = 'happy'
    } else if (this.time.now < actor.promptUntil) {
      actor.pose = actor.role === 'dog' ? 'point' : 'thinking'
    } else {
      actor.pose = 'idle'
    }

    const bob = speed > 0.32 ? Math.sin(this.time.now * 0.024 + (actor.role === 'cat' ? 0 : 1.4)) * 3 : 0
    actor.shadow.setPosition(actor.body.x, actor.body.y + 20)
    actor.art
      .setTexture(characterTextureKey(actor.role, actor.direction, actor.pose))
      .setPosition(actor.body.x, actor.body.y - 10 + bob)
      .setScale(actor.direction === 'left' ? -1 : 1, 1)

    if (isActive) {
      actor.art.setTint(0xffffff)
    } else {
      actor.art.setTint(0xf2f6ff)
    }

    if (delta > 0 && this.popupTask) {
      actor.art.setPosition(actor.art.x, actor.art.y + Math.sin(this.time.now * 0.008) * 0.6)
    }
  }

  private keepActorInBounds(actor: ActorState): void {
    const clampedX = Phaser.Math.Clamp(actor.body.x, WORLD_MARGIN, WORLD_WIDTH - WORLD_MARGIN)
    const clampedY = Phaser.Math.Clamp(actor.body.y, WORLD_MARGIN, WORLD_HEIGHT - WORLD_MARGIN)
    if (clampedX !== actor.body.x || clampedY !== actor.body.y) {
      this.matter.body.setPosition(actor.body.body, { x: clampedX, y: clampedY })
    }
  }

  private updateAnimals(delta: number): void {
    for (const animal of this.animals) {
      const zoneFactor = this.getZoneProgress(animal.zone)
      animal.phase += delta * animal.speed
      const dance = this.time.now < animal.reactionUntil
      const wobbleX = Math.sin(animal.phase * 1.8) * (dance ? 18 : 10 + zoneFactor * 8)
      const wobbleY = Math.cos(animal.phase * 1.6) * (dance ? 10 : 4 + zoneFactor * 4)
      animal.x = animal.baseX + wobbleX
      animal.y = animal.baseY + wobbleY
      animal.shadow.setPosition(animal.x, animal.y + 14)
      animal.sprite
        .setTexture(animalTextureKey(animal.kind, Math.floor(this.time.now / 180) % 2))
        .setPosition(animal.x, animal.y + (dance ? Math.sin(this.time.now * 0.03) * 5 : 0))
        .setScale(
          animal.kind === 'bee' && Math.sin(animal.phase) < 0 ? -1 : 1,
          1,
        )
      animal.sprite.setAlpha(0.74 + zoneFactor * 0.26)
    }
  }

  private updateTaskStations(): void {
    for (const task of this.tasks) {
      const pulse = Math.sin(this.time.now * 0.004 + task.bounceOffset)
      task.glow
        .setAlpha(task.placed ? 0.18 + pulse * 0.04 : 0.16 + pulse * 0.08)
        .setScale(task.placed ? 1.12 : 1 + pulse * 0.06)
      task.marker
        .setY(task.def.y + pulse * (task.placed ? 4 : 6))
        .setTexture(
          task.placed
            ? ecoTextureKey(task.def.id, Math.floor(this.time.now / 260) % 2 === 0 ? 'active-a' : 'active-b')
            : ecoTextureKey(task.def.id, 'base'),
        )
      task.pedestal.setFillStyle(parseColor(task.placed ? this.blueprint.palette.accentAlt : '#17354b'), task.placed ? 0.22 : 0.18)
      task.label.setAlpha(task.placed ? 0.96 : 0.84)
    }
  }

  private updateTaskPrompt(): void {
    if (this.popupTask) {
      this.promptText.setVisible(false)
      this.currentTask = null
      return
    }

    const actor = this.getActiveActor()
    this.currentTask =
      this.tasks.find(
        (task) =>
          !task.placed &&
          Phaser.Math.Distance.Between(actor.body.x, actor.body.y, task.def.x, task.def.y) <= TASK_INTERACTION_RADIUS,
      ) ?? null

    if (!this.currentTask) {
      this.promptText.setVisible(false)
      return
    }

    this.promptText
      .setText(`ESPACIO o clic: ${this.currentTask.def.shortLabel}`)
      .setPosition(this.currentTask.def.x, this.currentTask.def.y - 86)
      .setVisible(true)
  }

  private updateHud(): void {
    this.progressText.setText(`Soluciones ${this.completedCount} / 9`)
    this.scoreText.setText(`Puntos Eco ${this.ecoScore}`)
    if (this.completedCount < 3) {
      this.moodIcon.setText('🙂')
    } else if (this.completedCount < 6) {
      this.moodIcon.setText('😄')
    } else {
      this.moodIcon.setText('🤩')
    }

    if (this.currentTask) {
      this.guidanceText.setText(`Acercate y ayuda con: ${this.currentTask.def.label}`)
    } else if (this.completedCount >= TASKS.length) {
      this.guidanceText.setText('¡El campo esta casi listo para celebrar!')
    } else {
      this.guidanceText.setText('Explora el campo y busca otra estacion brillante.')
    }
  }

  private openTaskPopup(task: TaskStationState): void {
    this.popupTask = task
    this.popup.title.setText(task.def.label)
    this.popup.body.setText(`${task.def.description}\n\n${task.def.celebration}`)
    this.popup.quote.setText(`“${task.def.voiceLine}”`)
    this.popup.icon.setTexture(task.placed ? ecoTextureKey(task.def.id, 'active-a') : ecoTextureKey(task.def.id, 'base'))
    this.popup.buttonLabel.setText(task.def.buttonLabel)
    this.popup.container.setVisible(true)
    this.currentTask = task
  }

  private closeTaskPopup(): void {
    this.popupTask = null
    this.popup.container.setVisible(false)
  }

  private completeTask(task: TaskStationState): void {
    if (task.placed) {
      this.closeTaskPopup()
      return
    }

    task.placed = true
    this.completedTaskIds.add(task.def.id)
    this.completedCount += 1
    this.ecoScore += 10
    this.zoneProgress[task.def.zone] += 1
    this.closeTaskPopup()
    this.cat.celebrationUntil = this.time.now + 1600
    this.dog.celebrationUntil = this.time.now + 1600
    this.cat.pose = 'happy'
    this.dog.pose = 'happy'
    this.emitMagicBurst(task.def.x, task.def.y, this.blueprint.palette.accentAlt)
    this.emitMagicBurst(task.def.x, task.def.y, this.blueprint.palette.accent)
    this.cameras.main.shake(120, 0.0026)

    for (const animal of this.animals) {
      if (animal.zone === task.def.zone || Phaser.Math.Distance.Between(animal.baseX, animal.baseY, task.def.x, task.def.y) < 260) {
        animal.reactionUntil = this.time.now + 1800
      }
    }

    this.redrawFarmWorld()

    if (this.completedCount >= TASKS.length) {
      this.time.delayedCall(1400, () => {
        this.scene.start(WIN_SCENE_KEY, {
          completedCount: this.completedCount,
          score: this.ecoScore,
        } satisfies WinSceneData)
      })
    }
  }

  private redrawFarmWorld(): void {
    const progress = this.completedCount / TASKS.length
    const energy = this.getZoneProgress('energy')
    const water = this.getZoneProgress('water')
    const farm = this.getZoneProgress('farm')
    const nature = this.getZoneProgress('nature')

    this.skyGraphics.clear()
    this.groundGraphics.clear()
    this.riverGraphics.clear()
    this.decorGraphics.clear()
    this.frontGraphics.clear()

    for (let i = 0; i < 12; i += 1) {
      const t = i / 11
      this.skyGraphics.fillStyle(mixColors(parseColor('#8fd9ff'), parseColor('#dff9ff'), t * 0.6), 1)
      this.skyGraphics.fillRect(0, i * 48, WORLD_WIDTH, 48)
    }

    const dryGrass = parseColor('#b79156')
    const lushGrass = parseColor('#86d76a')
    const deepGrass = mixColors(lushGrass, parseColor('#5bbb50'), 0.34)
    const mainGround = mixColors(dryGrass, lushGrass, progress)
    this.groundGraphics.fillStyle(mainGround, 1)
    this.groundGraphics.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

    this.groundGraphics.fillStyle(mixColors(parseColor('#d5b57a'), parseColor('#9bdd79'), energy), 0.94)
    this.groundGraphics.fillRoundedRect(72, 84, 702, 414, 84)
    this.groundGraphics.fillStyle(mixColors(parseColor('#c49a61'), parseColor('#8fd26b'), water), 0.94)
    this.groundGraphics.fillRoundedRect(844, 72, 724, 474, 92)
    this.groundGraphics.fillStyle(mixColors(parseColor('#c7935a'), parseColor('#81d464'), farm), 0.94)
    this.groundGraphics.fillRoundedRect(82, 548, 772, 436, 98)
    this.groundGraphics.fillStyle(mixColors(parseColor('#be8a58'), parseColor('#7ddb6f'), nature), 0.94)
    this.groundGraphics.fillRoundedRect(900, 578, 668, 392, 96)

    this.groundGraphics.fillStyle(mixColors(parseColor('#caa372'), parseColor('#d8c58b'), progress), 0.92)
    this.groundGraphics.fillRoundedRect(162, 464, 1240, 96, 48)
    this.groundGraphics.fillRoundedRect(742, 154, 118, 820, 44)

    const riverColor = mixColors(parseColor('#7da483'), parseColor('#69d7ff'), 0.18 + water * 0.82)
    const riverGlow = mixColors(parseColor('#91bca4'), parseColor('#bff6ff'), 0.12 + water * 0.88)
    this.riverGraphics.fillStyle(riverColor, 0.96)
    this.riverGraphics.fillEllipse(1248, 542, 212, 620)
    this.riverGraphics.fillEllipse(1292, 444, 164, 284)
    this.riverGraphics.fillStyle(riverGlow, 0.34)
    this.riverGraphics.fillEllipse(1264, 526, 88, 496)
    this.riverGraphics.fillEllipse(1292, 438, 66, 220)

    this.decorGraphics.fillStyle(mixColors(parseColor('#f4d26f'), parseColor('#fff0aa'), energy), 0.9)
    this.decorGraphics.fillCircle(552, 178, 44 + energy * 12)
    this.decorGraphics.fillStyle(mixColors(parseColor('#87674f'), parseColor('#5f4834'), progress), 0.94)
    this.decorGraphics.fillRoundedRect(188, 206, 168, 130, 24)
    this.decorGraphics.fillStyle(mixColors(parseColor('#9c4f3c'), parseColor('#bf6c52'), energy), 0.96)
    this.decorGraphics.fillTriangle(172, 222, 272, 144, 372, 222)
    this.decorGraphics.fillStyle(mixColors(parseColor('#9f794d'), parseColor('#72bf56'), farm), 0.96)
    this.decorGraphics.fillRoundedRect(292, 666, 242, 164, 28)
    this.decorGraphics.fillStyle(mixColors(parseColor('#7d6446'), parseColor('#68b64f'), farm), 0.96)
    this.decorGraphics.fillRoundedRect(588, 696, 188, 132, 24)

    this.decorGraphics.fillStyle(mixColors(parseColor('#8b6b56'), parseColor('#a6db77'), nature), 0.96)
    this.decorGraphics.fillCircle(1082, 768, 118)
    this.decorGraphics.fillCircle(1188, 846, 96)
    this.decorGraphics.fillCircle(1324, 760, 88)

    for (const tree of TREE_POSITIONS) {
      const zoneColor =
        tree.x > 900 ? mixColors(parseColor('#7f8f55'), deepGrass, Math.max(water, nature)) : mixColors(parseColor('#7f8f55'), deepGrass, Math.max(energy, farm))
      this.drawTree(tree.x, tree.y, zoneColor, 0.72 + progress * 0.28)
    }

    for (const patch of FLOWER_PATCHES) {
      const visible = progress >= patch.threshold * 0.55 || this.getZoneProgress(patch.zone) > 0.24
      if (!visible) {
        continue
      }
      this.drawFlowerPatch(patch.x, patch.y, progress, this.getZoneProgress(patch.zone))
    }

    this.drawFence(574, 724, 274, 110, farm)
    this.drawFence(1002, 698, 326, 126, nature)
    this.drawFence(1042, 194, 268, 110, water)

    if (progress >= 0.66) {
      const rainbow = this.frontGraphics
      rainbow.lineStyle(18, parseColor('#ff9685'), 0.72).arc(1460, 150, 160, Phaser.Math.DegToRad(205), Phaser.Math.DegToRad(332), false)
      rainbow.lineStyle(18, parseColor('#ffd66d'), 0.68).arc(1460, 150, 140, Phaser.Math.DegToRad(205), Phaser.Math.DegToRad(332), false)
      rainbow.lineStyle(18, parseColor('#84df9f'), 0.68).arc(1460, 150, 120, Phaser.Math.DegToRad(205), Phaser.Math.DegToRad(332), false)
      rainbow.lineStyle(18, parseColor('#7fd2ff'), 0.68).arc(1460, 150, 100, Phaser.Math.DegToRad(205), Phaser.Math.DegToRad(332), false)
    }
  }

  private drawTree(x: number, y: number, leafColor: number, alpha: number): void {
    this.decorGraphics.fillStyle(parseColor('#815d3d'), 0.94)
    this.decorGraphics.fillRoundedRect(x - 10, y + 24, 20, 46, 8)
    this.decorGraphics.fillStyle(leafColor, alpha)
    this.decorGraphics.fillCircle(x, y, 38)
    this.decorGraphics.fillCircle(x - 24, y + 14, 28)
    this.decorGraphics.fillCircle(x + 24, y + 14, 28)
    this.decorGraphics.fillStyle(parseColor('#dff8a6'), 0.18)
    this.decorGraphics.fillCircle(x - 10, y - 8, 12)
  }

  private drawFlowerPatch(x: number, y: number, progress: number, zoneProgress: number): void {
    const flowerCount = 5 + Math.round(progress * 6 + zoneProgress * 5)
    for (let i = 0; i < flowerCount; i += 1) {
      const angle = (Math.PI * 2 * i) / flowerCount
      const distance = 8 + (i % 3) * 8
      const px = x + Math.cos(angle) * distance
      const py = y + Math.sin(angle) * distance
      this.decorGraphics.fillStyle(parseColor('#5fbf58'), 0.9)
      this.decorGraphics.fillRect(px - 1, py - 3, 2, 9)
      this.decorGraphics.fillStyle(
        [parseColor('#ff9bb0'), parseColor('#fff08b'), parseColor('#84dfff'), parseColor('#ffffff')][i % 4],
        0.95,
      )
      this.decorGraphics.fillCircle(px, py - 6, 4)
    }
  }

  private drawFence(x: number, y: number, width: number, height: number, progress: number): void {
    this.frontGraphics.lineStyle(6, mixColors(parseColor('#8c6745'), parseColor('#a97a53'), progress * 0.55), 0.88)
    this.frontGraphics.strokeRoundedRect(x, y, width, height, 24)
    for (let px = x + 22; px < x + width; px += 40) {
      this.frontGraphics.lineBetween(px, y, px, y + height)
    }
  }

  private getZoneProgress(zone: TaskZone): number {
    const total = TASKS.filter((task) => task.zone === zone).length
    return total === 0 ? 0 : this.zoneProgress[zone] / total
  }

  private emitMagicBurst(x: number, y: number, color: string): void {
    for (let i = 0; i < 12; i += 1) {
      const spark = this.add
        .image(x, y, sparkleTextureKey())
        .setTint(parseColor(color))
        .setScale(Phaser.Math.FloatBetween(0.5, 1.1))
        .setDepth(26)

      this.tweens.add({
        targets: spark,
        x: x + Phaser.Math.Between(-84, 84),
        y: y + Phaser.Math.Between(-64, 64),
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: Phaser.Math.Between(420, 720),
        ease: 'Cubic.easeOut',
        onComplete: () => spark.destroy(),
      })
    }
  }

  private togglePause(): void {
    this.paused = !this.paused
    if (!this.paused) {
      this.pauseOverlay?.destroy()
      this.pauseOverlay = undefined
      return
    }

    const shade = this.add.rectangle(VIEW_WIDTH / 2, VIEW_HEIGHT / 2, VIEW_WIDTH, VIEW_HEIGHT, 0x17354b, 0.42).setScrollFactor(0)
    const card = this.createSpeechCard(VIEW_WIDTH / 2, VIEW_HEIGHT / 2 - 12, 420, 'Pausa', [
      'El campo te espera tranquilito.',
      'Pulsa el boton otra vez para seguir jugando.',
    ])
    card.setScrollFactor(0)
    const button = this.createButton(VIEW_WIDTH / 2, VIEW_HEIGHT / 2 + 118, 220, 'Seguir', () => this.togglePause(), '#84df9f')
    button.container.setScrollFactor(0)
    this.pauseOverlay = this.add.container(0, 0, [shade, card, button.container]).setDepth(80)
  }

  private getActiveActor(): ActorState {
    return this.activeRole === 'cat' ? this.cat : this.dog
  }

  private getActiveDistanceTo(x: number, y: number): number {
    const actor = this.getActiveActor()
    return Phaser.Math.Distance.Between(actor.body.x, actor.body.y, x, y)
  }
}

class GuardiansWinScene extends GuardiansBaseScene {
  private completedCount = 0
  private score = 0

  constructor(blueprint: GameBlueprint) {
    super(WIN_SCENE_KEY, blueprint)
  }

  init(data: WinSceneData): void {
    this.completedCount = data.completedCount ?? 9
    this.score = data.score ?? 90
  }

  create(): void {
    this.drawSceneBackdrop()
    this.add.rectangle(VIEW_WIDTH / 2, VIEW_HEIGHT / 2, VIEW_WIDTH, VIEW_HEIGHT, parseColor('#fff7ce'), 0.18)

    const rainbow = this.add.graphics().setDepth(10)
    rainbow.lineStyle(18, parseColor('#ff9685'), 0.74).arc(VIEW_WIDTH / 2, 146, 190, Phaser.Math.DegToRad(205), Phaser.Math.DegToRad(334), false)
    rainbow.lineStyle(18, parseColor('#ffd66d'), 0.7).arc(VIEW_WIDTH / 2, 146, 170, Phaser.Math.DegToRad(205), Phaser.Math.DegToRad(334), false)
    rainbow.lineStyle(18, parseColor('#84df9f'), 0.7).arc(VIEW_WIDTH / 2, 146, 150, Phaser.Math.DegToRad(205), Phaser.Math.DegToRad(334), false)
    rainbow.lineStyle(18, parseColor('#7fd2ff'), 0.7).arc(VIEW_WIDTH / 2, 146, 130, Phaser.Math.DegToRad(205), Phaser.Math.DegToRad(334), false)

    this.add
      .text(VIEW_WIDTH / 2, 86, '¡Gracias! ¡Juntos salvamos el planeta!', {
        fontFamily: 'Baloo 2, Nunito, sans-serif',
        fontSize: '42px',
        color: '#16324a',
        align: 'center',
        wordWrap: { width: 760 },
      })
      .setOrigin(0.5)
      .setDepth(18)

    this.add
      .text(VIEW_WIDTH / 2, 166, `Soluciones ${this.completedCount} / 9   ·   Puntos Eco ${this.score}`, {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '24px',
        color: '#28536d',
      })
      .setOrigin(0.5)
      .setDepth(18)

    this.add.image(358, 340, characterTextureKey('cat', 'down', 'happy')).setDisplaySize(172, 172).setDepth(22)
    this.add.image(538, 348, characterTextureKey('dog', 'right', 'happy')).setDisplaySize(176, 176).setDepth(22)
    this.add.image(734, 324, ecoTextureKey('eco-farm', 'active-b')).setDisplaySize(150, 150).setDepth(20)
    this.add.image(840, 336, ecoTextureKey('wind-turbines', 'active-b')).setDisplaySize(150, 150).setDepth(20)
    this.add.image(154, 404, animalTextureKey('cow', 1)).setDisplaySize(82, 82).setDepth(20)
    this.add.image(190, 446, animalTextureKey('bunny', 1)).setDisplaySize(70, 70).setDepth(20)
    this.add.image(810, 208, butterflyTextureKey(0)).setDisplaySize(82, 82).setDepth(24)

    this.add.particles(0, 0, sparkleTextureKey(), {
      x: { min: 80, max: VIEW_WIDTH - 80 },
      y: -16,
      lifespan: 2600,
      frequency: 70,
      quantity: 3,
      speedY: { min: 82, max: 150 },
      speedX: { min: -28, max: 28 },
      scale: { start: 0.7, end: 0.08 },
      alpha: { start: 0.92, end: 0 },
      tint: [parseColor('#ff9bb0'), parseColor('#ffd66d'), parseColor('#84df9f'), parseColor('#7fd2ff')],
    }).setDepth(30)

    this.createButton(VIEW_WIDTH / 2, 474, 288, 'Jugar Otra Vez', () => {
      this.scene.start(TITLE_SCENE_KEY)
    })
  }
}

function prepareGuardiansTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists(characterTextureKey('cat', 'down', 'idle'))) {
    return
  }

  for (const role of ['cat', 'dog'] as const) {
    for (const direction of CHARACTER_DIRECTIONS) {
      for (const pose of ['idle', 'walk-a', 'walk-b', 'happy', 'thinking', 'point'] as const) {
        createGraphicsTexture(scene, characterTextureKey(role, direction, pose), 96, 96, (graphics) => {
          drawGuardianTexture(graphics, role, direction, pose)
        })
      }
    }
  }

  for (const kind of ['cow', 'bunny', 'bird', 'bee', 'fish', 'hen'] as const) {
    for (const frame of [0, 1] as const) {
      createGraphicsTexture(scene, animalTextureKey(kind, frame), 72, 72, (graphics) => {
        drawAnimalTexture(graphics, kind, frame)
      })
    }
  }

  for (const task of TASKS) {
    for (const state of ['base', 'active-a', 'active-b'] as const) {
      createGraphicsTexture(scene, ecoTextureKey(task.id, state), 112, 112, (graphics) => {
        drawEcoTexture(graphics, task.id, state)
      })
    }
  }

  for (const frame of [0, 1] as const) {
    createGraphicsTexture(scene, butterflyTextureKey(frame), 64, 64, (graphics) => {
      drawButterflyTexture(graphics, frame)
    })
  }

  createGraphicsTexture(scene, sparkleTextureKey(), 28, 28, (graphics) => {
    graphics.fillStyle(parseColor('#ffffff'), 1)
    graphics.fillTriangle(14, 0, 18, 10, 14, 14)
    graphics.fillTriangle(28, 14, 18, 18, 14, 14)
    graphics.fillTriangle(14, 28, 10, 18, 14, 14)
    graphics.fillTriangle(0, 14, 10, 10, 14, 14)
    graphics.fillStyle(parseColor('#ffe27a'), 0.72)
    graphics.fillCircle(14, 14, 4)
  })
}

function createGraphicsTexture(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  draw: (graphics: Phaser.GameObjects.Graphics) => void,
): void {
  if (scene.textures.exists(key)) {
    return
  }

  const graphics = scene.make.graphics({ x: 0, y: 0, add: false })
  draw(graphics)
  graphics.generateTexture(key, width, height)
  graphics.destroy()
}

function drawGuardianTexture(
  graphics: Phaser.GameObjects.Graphics,
  role: ActorRole,
  direction: Direction,
  pose: CharacterPose,
): void {
  const fur = role === 'cat' ? parseColor('#f7a338') : parseColor('#9a6a48')
  const furAlt = role === 'cat' ? parseColor('#ffd596') : parseColor('#d1aa7a')
  const accent = role === 'cat' ? parseColor('#6bd66d') : parseColor('#58b7ff')
  const badge = role === 'cat' ? parseColor('#65d57a') : parseColor('#78d46f')
  const eye = role === 'cat' ? parseColor('#49b84e') : parseColor('#2b4055')
  const step = pose === 'walk-a' ? -1 : pose === 'walk-b' ? 1 : 0
  const jump = pose === 'happy' ? -8 : 0
  const point = pose === 'point' ? 1 : 0
  const think = pose === 'thinking' ? 1 : 0

  graphics.fillStyle(parseColor('#d6f0ff'), 0.12)
  graphics.fillCircle(48, 54 + jump, 26)
  graphics.fillStyle(fur, 1)
  graphics.fillEllipse(48, 54 + jump, 34, 28)
  graphics.fillStyle(furAlt, 0.96)
  graphics.fillEllipse(48, 48 + jump, 22, 18)

  if (direction === 'up') {
    graphics.fillStyle(fur, 1)
    graphics.fillTriangle(36, 32 + jump, 26, 18 + jump, 42, 22 + jump)
    graphics.fillTriangle(60, 32 + jump, 54, 22 + jump, 70, 18 + jump)
  } else {
    graphics.fillStyle(fur, 1)
    graphics.fillTriangle(34, 28 + jump, 26, 14 + jump, 42, 20 + jump)
    graphics.fillTriangle(62, 28 + jump, 54, 20 + jump, 70, 14 + jump)
  }

  graphics.fillStyle(fur, 1)
  graphics.fillEllipse(48, 34 + jump, direction === 'up' ? 30 : 34, 28)
  graphics.fillStyle(furAlt, 0.98)
  graphics.fillEllipse(48, 38 + jump, 22, 16)

  if (direction !== 'up') {
    graphics.fillStyle(eye, 0.94)
    if (direction === 'left') {
      graphics.fillCircle(42, 32 + jump, 2)
      graphics.fillCircle(34, 34 + jump, 2.2)
    } else if (direction === 'right') {
      graphics.fillCircle(54, 32 + jump, 2)
      graphics.fillCircle(62, 34 + jump, 2.2)
    } else {
      graphics.fillCircle(42, 34 + jump, 2.2)
      graphics.fillCircle(54, 34 + jump, 2.2)
    }
  }

  graphics.lineStyle(4, fur, 0.96)
  const tailShift = pose === 'happy' ? Math.sin(Math.PI * 0.25) * 4 : step * 2
  if (direction === 'left') {
    graphics.lineBetween(66, 56 + jump, 78, 48 + jump + tailShift)
  } else if (direction === 'right') {
    graphics.lineBetween(30, 56 + jump, 18, 48 + jump - tailShift)
  } else {
    graphics.lineBetween(66, 58 + jump, 78, 48 + jump + tailShift)
  }

  graphics.fillStyle(accent, 0.98)
  if (role === 'cat') {
    graphics.fillRoundedRect(34, 50 + jump, 28, 10, 5)
  } else {
    graphics.fillRoundedRect(34, 48 + jump, 28, 8, 4)
    graphics.fillStyle(badge, 0.98)
    graphics.fillCircle(48, 60 + jump, 4)
  }

  graphics.fillStyle(fur, 1)
  const pawY = 70 + jump
  graphics.fillEllipse(38 - step * 2, pawY, 10, 8)
  graphics.fillEllipse(58 + step * 2, pawY, 10, 8)
  graphics.fillEllipse(40 + step * 2, pawY + 10, 10, 8)
  graphics.fillEllipse(56 - step * 2, pawY + 10, 10, 8)

  if (think) {
    graphics.lineStyle(4, accent, 0.96)
    graphics.lineBetween(60, 24 + jump, 66, 12 + jump)
    graphics.fillStyle(parseColor('#fff0aa'), 0.92)
    graphics.fillCircle(74, 10 + jump, 6)
  }

  if (point) {
    graphics.lineStyle(4, furAlt, 0.96)
    graphics.lineBetween(60, 54 + jump, 74, 48 + jump)
  }

  if (pose === 'happy') {
    graphics.fillStyle(parseColor('#ff8db6'), 0.92)
    graphics.fillCircle(28, 18, 6)
    graphics.fillCircle(36, 18, 6)
    graphics.fillTriangle(23, 20, 41, 20, 32, 30)
  }
}

function drawAnimalTexture(graphics: Phaser.GameObjects.Graphics, kind: AnimalKind, frame: 0 | 1): void {
  switch (kind) {
    case 'cow':
      graphics.fillStyle(parseColor('#fff7ec'), 1)
      graphics.fillEllipse(36, 42, 36, 28)
      graphics.fillEllipse(48, 30, 24, 20)
      graphics.fillStyle(parseColor('#6f4e37'), 0.98)
      graphics.fillEllipse(26, 38, 14, 12)
      graphics.fillEllipse(46, 46, 12, 10)
      graphics.fillCircle(46, 30, 2)
      graphics.fillCircle(54, 30, 2)
      break
    case 'bunny':
      graphics.fillStyle(parseColor('#fff1ef'), 1)
      graphics.fillEllipse(36, 42, 26, 22)
      graphics.fillEllipse(40, 26, 22, 18)
      graphics.fillRoundedRect(30, 4 + frame * 2, 6, 24, 3)
      graphics.fillRoundedRect(42, 2 + frame * 2, 6, 24, 3)
      graphics.fillStyle(parseColor('#ff9bb0'), 0.8)
      graphics.fillRoundedRect(32, 8 + frame * 2, 2, 16, 1)
      graphics.fillRoundedRect(44, 6 + frame * 2, 2, 16, 1)
      break
    case 'bird':
      graphics.fillStyle(parseColor('#8fd2ff'), 1)
      graphics.fillCircle(36, 36, 16)
      graphics.fillTriangle(46, 40, 62, 36, 46, 32)
      graphics.fillStyle(parseColor('#ffffff'), 0.9)
      graphics.fillCircle(32, 34, 6)
      break
    case 'bee':
      graphics.fillStyle(parseColor('#ffd66d'), 1)
      graphics.fillEllipse(36, 36, 24, 18)
      graphics.fillStyle(parseColor('#3e2f24'), 0.96)
      graphics.fillRect(30, 28, 4, 16)
      graphics.fillRect(38, 28, 4, 16)
      graphics.fillStyle(parseColor('#e7f6ff'), 0.72)
      graphics.fillEllipse(26, 28 - frame * 4, 12, 10)
      graphics.fillEllipse(46, 28 + frame * 4, 12, 10)
      break
    case 'fish':
      graphics.fillStyle(parseColor('#6bd7ff'), 1)
      graphics.fillEllipse(34, 36, 24, 16)
      graphics.fillTriangle(18, 36, 4, 26, 4, 46)
      graphics.fillStyle(parseColor('#ffffff'), 0.76)
      graphics.fillCircle(40, 34, 3)
      break
    case 'hen':
      graphics.fillStyle(parseColor('#fff6d7'), 1)
      graphics.fillEllipse(36, 40, 26, 22)
      graphics.fillCircle(44, 28, 10)
      graphics.fillStyle(parseColor('#ff8b6a'), 0.96)
      graphics.fillTriangle(50, 30, 60, 26, 52, 22)
      graphics.fillCircle(46, 18 + frame * 2, 4)
      break
  }
}

function drawButterflyTexture(graphics: Phaser.GameObjects.Graphics, frame: 0 | 1): void {
  graphics.fillStyle(parseColor('#ff9bb0'), 0.96)
  graphics.fillEllipse(22, 28 - frame * 4, 18, 24)
  graphics.fillEllipse(42, 28 + frame * 4, 18, 24)
  graphics.fillStyle(parseColor('#7fd2ff'), 0.96)
  graphics.fillEllipse(22, 42 + frame * 2, 16, 20)
  graphics.fillEllipse(42, 42 - frame * 2, 16, 20)
  graphics.fillStyle(parseColor('#3e4055'), 0.96)
  graphics.fillRoundedRect(30, 20, 4, 26, 2)
}

function drawEcoTexture(
  graphics: Phaser.GameObjects.Graphics,
  taskId: TaskId,
  state: 'base' | 'active-a' | 'active-b',
): void {
  const active = state !== 'base'
  const blink = state === 'active-b'

  graphics.fillStyle(parseColor(active ? '#fff6cf' : '#fff1dc'), active ? 0.22 : 0.12)
  graphics.fillCircle(56, 56, active ? 38 : 34)

  switch (taskId) {
    case 'solar-panels':
      graphics.fillStyle(parseColor('#417db6'), 1)
      graphics.fillRoundedRect(22, 42, 68, 40, 10)
      graphics.fillStyle(parseColor('#8fd2ff'), blink ? 0.9 : 0.72)
      graphics.fillRect(28, 48, 56, 8)
      graphics.fillRect(28, 62, 56, 8)
      graphics.fillStyle(parseColor('#ffe27a'), active ? 0.92 : 0.56)
      graphics.fillCircle(78, 24, active ? 12 : 8)
      break
    case 'wind-turbines':
      graphics.fillStyle(parseColor('#f6fbff'), 1)
      graphics.fillRect(52, 24, 8, 56)
      graphics.fillTriangle(56, 18, 22, 38 + (blink ? 4 : -4), 46, 42)
      graphics.fillTriangle(56, 18, 88, 40 + (blink ? -4 : 4), 66, 42)
      graphics.fillTriangle(56, 18, 56 + (blink ? 5 : -5), 72, 44, 46)
      break
    case 'solar-tractor':
      graphics.fillStyle(parseColor('#67b34d'), 1)
      graphics.fillRoundedRect(24, 42, 58, 28, 10)
      graphics.fillCircle(34, 76, 10)
      graphics.fillCircle(76, 76, 10)
      graphics.fillStyle(parseColor('#4f88c0'), 1)
      graphics.fillRoundedRect(42, 28, 28, 16, 5)
      graphics.fillStyle(parseColor(active ? '#ffe27a' : '#d0d8e0'), active ? 0.92 : 0.7)
      graphics.fillRoundedRect(48, 20, 18, 8, 4)
      break
    case 'energy-automation':
      graphics.fillStyle(parseColor('#f9d692'), 1)
      graphics.fillRoundedRect(28, 34, 56, 46, 16)
      graphics.fillStyle(parseColor('#ffb95b'), 0.96)
      graphics.fillTriangle(24, 42, 56, 20, 88, 42)
      graphics.fillStyle(parseColor(active ? '#ffe27a' : '#e8f4ff'), active ? 0.98 : 0.74)
      graphics.fillCircle(40, 56, blink ? 8 : 6)
      graphics.fillCircle(68, 56, blink ? 6 : 8)
      break
    case 'water-automation':
      graphics.fillStyle(parseColor('#6ac5ff'), 1)
      graphics.fillRoundedRect(24, 54, 62, 10, 5)
      graphics.fillStyle(parseColor('#70d27d'), 0.92)
      graphics.fillRect(34, 34, 8, 20)
      graphics.fillRect(56, 30, 8, 24)
      graphics.fillRect(74, 36, 8, 18)
      graphics.fillStyle(parseColor(active ? '#dff8ff' : '#b7ddf0'), active ? 0.96 : 0.76)
      graphics.fillCircle(40, blink ? 70 : 64, 5)
      graphics.fillCircle(60, blink ? 64 : 70, 5)
      graphics.fillCircle(78, blink ? 72 : 66, 5)
      break
    case 'water-purifier':
      graphics.fillStyle(parseColor('#6ad5c4'), 1)
      graphics.fillRoundedRect(24, 24, 26, 52, 8)
      graphics.fillStyle(parseColor('#a4e3ff'), active ? 0.98 : 0.74)
      graphics.fillRoundedRect(50, 38, 34, 22, 8)
      graphics.fillStyle(parseColor('#7fd26a'), 0.98)
      graphics.fillEllipse(72, 74, 20, 12)
      graphics.fillRect(68, 58, 4, 18)
      break
    case 'eco-farm':
      graphics.fillStyle(parseColor('#9a6e49'), 1)
      graphics.fillRoundedRect(22, 40, 68, 38, 12)
      graphics.fillStyle(parseColor('#7ed46a'), active ? 1 : 0.74)
      for (let i = 0; i < 4; i += 1) {
        graphics.fillRect(30 + i * 12, 34 - (blink && i % 2 === 0 ? 4 : 0), 6, 18)
        graphics.fillCircle(34 + i * 12, 30 - (blink && i % 2 === 0 ? 4 : 0), 8)
      }
      break
    case 'eco-livestock':
      graphics.fillStyle(parseColor('#c78a54'), 1)
      graphics.fillRoundedRect(20, 42, 72, 36, 12)
      graphics.fillStyle(parseColor('#7ed46a'), active ? 0.98 : 0.72)
      graphics.fillRoundedRect(24, 46, 64, 28, 10)
      graphics.fillStyle(parseColor('#fff6e2'), 1)
      graphics.fillEllipse(46, 58, 16, 12)
      graphics.fillEllipse(70, 60, 14, 10)
      break
    case 'insect-control':
      graphics.fillStyle(parseColor('#7ed46a'), 1)
      graphics.fillRoundedRect(22, 44, 68, 30, 12)
      graphics.fillStyle(parseColor('#ffd66d'), 1)
      graphics.fillEllipse(40, 42, 14, 12)
      graphics.fillStyle(parseColor('#3e2f24'), 1)
      graphics.fillRect(38, 36, 3, 12)
      graphics.fillStyle(parseColor('#ff7f99'), 0.96)
      graphics.fillCircle(68, blink ? 34 : 38, 7)
      graphics.fillCircle(76, blink ? 34 : 38, 7)
      break
  }

  if (active) {
    graphics.lineStyle(4, parseColor('#ffffff'), 0.44)
    graphics.strokeCircle(56, 56, 40)
  }
}

function characterTextureKey(role: ActorRole, direction: Direction, pose: CharacterPose): string {
  return `guardians-${role}-${direction}-${pose}`
}

function animalTextureKey(kind: AnimalKind, frame: 0 | 1): string {
  return `guardians-animal-${kind}-${frame}`
}

function ecoTextureKey(taskId: TaskId, state: 'base' | 'active-a' | 'active-b'): string {
  return `guardians-eco-${taskId}-${state}`
}

function butterflyTextureKey(frame: 0 | 1): string {
  return `guardians-butterfly-${frame}`
}

function sparkleTextureKey(): string {
  return 'guardians-sparkle'
}

function parseColor(color: string): number {
  return Number.parseInt(color.replace('#', ''), 16)
}

function mixColors(left: number, right: number, amount: number): number {
  const t = Phaser.Math.Clamp(amount, 0, 1)
  const lr = (left >> 16) & 0xff
  const lg = (left >> 8) & 0xff
  const lb = left & 0xff
  const rr = (right >> 16) & 0xff
  const rg = (right >> 8) & 0xff
  const rb = right & 0xff
  const r = Math.round(Phaser.Math.Linear(lr, rr, t))
  const g = Math.round(Phaser.Math.Linear(lg, rg, t))
  const b = Math.round(Phaser.Math.Linear(lb, rb, t))

  return (r << 16) | (g << 8) | b
}
