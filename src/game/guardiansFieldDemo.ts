import Phaser from 'phaser'
import animalBeeUrl from '../assets/guardians-field/animal-bee-v1.png'
import animalBirdUrl from '../assets/guardians-field/animal-bird-v1.png'
import animalBunnyUrl from '../assets/guardians-field/animal-bunny-v1.png'
import animalCowUrl from '../assets/guardians-field/animal-cow-v1.png'
import animalFishUrl from '../assets/guardians-field/animal-fish-v1.png'
import animalHenUrl from '../assets/guardians-field/animal-hen-v1.png'
import catSheetUrl from '../assets/guardians-field/cat-sheet-v1.png'
import dogSheetUrl from '../assets/guardians-field/dog-sheet-v1.png'
import ecoEcoFarmUrl from '../assets/guardians-field/eco-eco-farm-v1.png'
import ecoEcoLivestockUrl from '../assets/guardians-field/eco-eco-livestock-v1.png'
import ecoEnergyAutomationUrl from '../assets/guardians-field/eco-energy-automation-v1.png'
import ecoInsectControlUrl from '../assets/guardians-field/eco-insect-control-v1.png'
import ecoSolarPanelsUrl from '../assets/guardians-field/eco-solar-panels-v1.png'
import ecoSolarTractorUrl from '../assets/guardians-field/eco-solar-tractor-v1.png'
import ecoWaterAutomationUrl from '../assets/guardians-field/eco-water-automation-v1.png'
import ecoWaterPurifierUrl from '../assets/guardians-field/eco-water-purifier-v1.png'
import ecoWindTurbinesUrl from '../assets/guardians-field/eco-wind-turbines-v1.png'
import fieldBackgroundUrl from '../assets/guardians-field/field-background-v1.png'

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
const CHARACTER_FRAME_SIZE = 362

const GUARDIANS_TEXTURES = {
  background: 'guardians-field-background',
  catSheet: 'guardians-cat-sheet',
  dogSheet: 'guardians-dog-sheet',
} as const

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

type CloudState = {
  sprite: Phaser.GameObjects.Image
  speed: number
  amplitude: number
  phase: number
  baseY: number
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

type MachineMotionState = {
  def: EcoTaskDefinition
  baseX: number
  baseY: number
  rings: Phaser.GameObjects.Ellipse[]
  spinners: Phaser.GameObjects.Container[]
  orbiters: Phaser.GameObjects.Image[]
  pulses: Phaser.GameObjects.Ellipse[]
  mover?: Phaser.GameObjects.Image
  routePhase: number
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

type HeroBadgeState = {
  role: ActorRole
  container: Phaser.GameObjects.Container
  frame: Phaser.GameObjects.Rectangle
  label: Phaser.GameObjects.Text
  portrait: Phaser.GameObjects.Image
}

const GUARDIAN_SHEET_KEYS: Record<ActorRole, string> = {
  cat: GUARDIANS_TEXTURES.catSheet,
  dog: GUARDIANS_TEXTURES.dogSheet,
}

const ANIMAL_TEXTURES: Record<AnimalKind, string> = {
  cow: 'guardians-animal-cow',
  hen: 'guardians-animal-hen',
  bunny: 'guardians-animal-bunny',
  bird: 'guardians-animal-bird',
  bee: 'guardians-animal-bee',
  fish: 'guardians-animal-fish',
}

const ANIMAL_TEXTURE_URLS: Record<AnimalKind, string> = {
  cow: animalCowUrl,
  hen: animalHenUrl,
  bunny: animalBunnyUrl,
  bird: animalBirdUrl,
  bee: animalBeeUrl,
  fish: animalFishUrl,
}

const ECO_TEXTURES: Record<TaskId, string> = {
  'solar-panels': 'guardians-eco-solar-panels',
  'wind-turbines': 'guardians-eco-wind-turbines',
  'solar-tractor': 'guardians-eco-solar-tractor',
  'energy-automation': 'guardians-eco-energy-automation',
  'water-automation': 'guardians-eco-water-automation',
  'water-purifier': 'guardians-eco-water-purifier',
  'eco-farm': 'guardians-eco-eco-farm',
  'eco-livestock': 'guardians-eco-eco-livestock',
  'insect-control': 'guardians-eco-insect-control',
}

const ECO_TEXTURE_URLS: Record<TaskId, string> = {
  'solar-panels': ecoSolarPanelsUrl,
  'wind-turbines': ecoWindTurbinesUrl,
  'solar-tractor': ecoSolarTractorUrl,
  'energy-automation': ecoEnergyAutomationUrl,
  'water-automation': ecoWaterAutomationUrl,
  'water-purifier': ecoWaterPurifierUrl,
  'eco-farm': ecoEcoFarmUrl,
  'eco-livestock': ecoEcoLivestockUrl,
  'insect-control': ecoInsectControlUrl,
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

    graphics.fillStyle(parseColor('#ffffff'), 0.16)
    graphics.fillEllipse(210, 194, 320, 54)
    graphics.fillEllipse(732, 178, 420, 60)
    graphics.fillEllipse(520, 248, 540, 70)

    graphics.fillStyle(parseColor('#d8f2bd'), 1)
    graphics.fillEllipse(180, 440, 460, 160)
    graphics.fillEllipse(510, 470, 680, 180)
    graphics.fillEllipse(860, 438, 420, 140)
    graphics.fillStyle(parseColor('#b9df74'), 0.82)
    graphics.fillEllipse(140, 472, 420, 120)
    graphics.fillEllipse(740, 488, 520, 120)
    graphics.fillStyle(parseColor('#9ccf6a'), 0.54)
    graphics.fillEllipse(130, 508, 560, 92)
    graphics.fillEllipse(672, 514, 640, 96)

    graphics.fillStyle(parseColor('#ffffff'), 0.95)
    graphics.fillEllipse(162, 96, 120, 46)
    graphics.fillEllipse(232, 88, 96, 36)
    graphics.fillEllipse(742, 76, 152, 54)
    graphics.fillEllipse(812, 84, 96, 42)
    graphics.fillEllipse(568, 126, 126, 44)
    graphics.fillEllipse(622, 118, 88, 32)

    this.add.circle(828, 96, 42, parseColor('#ffe27a'), 0.98)
    this.add.circle(846, 80, 14, parseColor('#fff4b2'), 0.8)
    this.add.circle(828, 96, 62, parseColor('#ffe27a'), 0.16)
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

  preload(): void {
    this.load.image(GUARDIANS_TEXTURES.background, fieldBackgroundUrl)
    this.load.spritesheet(GUARDIANS_TEXTURES.catSheet, catSheetUrl, {
      frameWidth: CHARACTER_FRAME_SIZE,
      frameHeight: CHARACTER_FRAME_SIZE,
    })
    this.load.spritesheet(GUARDIANS_TEXTURES.dogSheet, dogSheetUrl, {
      frameWidth: CHARACTER_FRAME_SIZE,
      frameHeight: CHARACTER_FRAME_SIZE,
    })

    for (const [kind, key] of Object.entries(ANIMAL_TEXTURES) as Array<[AnimalKind, string]>) {
      this.load.image(key, ANIMAL_TEXTURE_URLS[kind])
    }

    for (const [taskId, key] of Object.entries(ECO_TEXTURES) as Array<[TaskId, string]>) {
      this.load.image(key, ECO_TEXTURE_URLS[taskId])
    }
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

    const titleCat = this.add.image(320, 324, GUARDIANS_TEXTURES.catSheet, 0).setDisplaySize(152, 152).setDepth(26)
    const titleDog = this.add.image(458, 342, GUARDIANS_TEXTURES.dogSheet, 0).setDisplaySize(152, 152).setDepth(27)
    applyGuardianArt(titleCat, 'cat', 'down', 'happy')
    applyGuardianArt(titleDog, 'dog', 'right', 'happy')
    this.add.image(640, 308, ECO_TEXTURES['wind-turbines']).setDisplaySize(148, 148).setDepth(22)
    this.add.image(792, 336, ECO_TEXTURES['solar-panels']).setDisplaySize(144, 144).setDepth(22)
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
    const tutorialCat = this.add.image(162, 420, GUARDIANS_TEXTURES.catSheet, 0).setDisplaySize(124, 124).setDepth(24)
    const tutorialDog = this.add.image(280, 432, GUARDIANS_TEXTURES.dogSheet, 0).setDisplaySize(126, 126).setDepth(24)
    applyGuardianArt(tutorialCat, 'cat', 'right', 'idle')
    applyGuardianArt(tutorialDog, 'dog', 'right', 'idle')

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

    this.add.image(730, 372, ECO_TEXTURES['water-purifier']).setDisplaySize(124, 124).setDepth(26)
    this.add.image(850, 360, ECO_TEXTURES['eco-farm']).setDisplaySize(124, 124).setDepth(26)

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
  private machines: MachineMotionState[] = []
  private animals: AnimalState[] = []
  private currentTask: TaskStationState | null = null
  private pendingAutoOpenTask: TaskStationState | null = null
  private popup!: PopupState
  private popupTask: TaskStationState | null = null
  private promptText!: Phaser.GameObjects.Text
  private progressText!: Phaser.GameObjects.Text
  private scoreText!: Phaser.GameObjects.Text
  private moodIcon!: Phaser.GameObjects.Text
  private guidanceText!: Phaser.GameObjects.Text
  private nextTaskText!: Phaser.GameObjects.Text
  private catBadge!: HeroBadgeState
  private dogBadge!: HeroBadgeState
  private pauseOverlay?: Phaser.GameObjects.Container
  private paused = false
  private completedCount = 0
  private ecoScore = 0
  private guidanceOverrideText = ''
  private guidanceOverrideUntil = 0
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
  private backgroundImage!: Phaser.GameObjects.Image
  private sparkleLayer!: Phaser.GameObjects.Particles.ParticleEmitter
  private clouds: CloudState[] = []

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
    this.updateClouds(delta)
    this.updateAnimals(delta)
    this.updateTaskStations()
    this.updateMachineMotions(delta)
    this.updateTaskPrompt()
    this.updateHud()
  }

  private createWorldLayers(): void {
    this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, parseColor('#9fe2ff'), 1).setDepth(-96)
    this.backgroundImage = this.add
      .image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, GUARDIANS_TEXTURES.background)
      .setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT)
      .setDepth(-86)
    this.skyGraphics = this.add.graphics().setDepth(-80)
    this.createClouds()
    this.groundGraphics = this.add.graphics().setDepth(-32)
    this.riverGraphics = this.add.graphics().setDepth(-18)
    this.decorGraphics = this.add.graphics().setDepth(10)
    this.frontGraphics = this.add.graphics().setDepth(12)
  }

  private createClouds(): void {
    const blueprints = [
      { x: 180, y: 126, scale: 1.1, speed: 6, amplitude: 6, phase: 0.2 },
      { x: 520, y: 82, scale: 0.86, speed: 8, amplitude: 4, phase: 1.1 },
      { x: 910, y: 132, scale: 1.22, speed: 5, amplitude: 5, phase: 1.8 },
      { x: 1280, y: 104, scale: 0.94, speed: 7, amplitude: 6, phase: 2.4 },
      { x: 1530, y: 148, scale: 0.72, speed: 9, amplitude: 4, phase: 3.2 },
    ] as const

    this.clouds = blueprints.map((blueprint, index) => {
      const sprite = this.add
        .image(blueprint.x, blueprint.y, cloudTextureKey(index % 2 === 0 ? 0 : 1))
        .setDisplaySize(184 * blueprint.scale, 88 * blueprint.scale)
        .setAlpha(0.86)
        .setDepth(-74 + index * 0.2)

      return {
        sprite,
        speed: blueprint.speed,
        amplitude: blueprint.amplitude,
        phase: blueprint.phase,
        baseY: blueprint.y,
      }
    })
  }

  private updateClouds(delta: number): void {
    for (const cloud of this.clouds) {
      cloud.phase += delta * 0.6
      cloud.sprite.x += cloud.speed * delta
      cloud.sprite.y = cloud.baseY + Math.sin(cloud.phase) * cloud.amplitude

      if (cloud.sprite.x - cloud.sprite.displayWidth * 0.6 > WORLD_WIDTH) {
        cloud.sprite.x = -cloud.sprite.displayWidth * 0.6
      }
    }
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
      .image(x, y - 8, GUARDIANS_TEXTURES[role === 'cat' ? 'catSheet' : 'dogSheet'], 0)
      .setDisplaySize(90, 90)
      .setDepth(7)
    applyGuardianArt(art, role, 'down', 'idle')

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
        .image(blueprint.x, blueprint.y, ANIMAL_TEXTURES[blueprint.kind])
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
        .image(def.x, def.y, ECO_TEXTURES[def.id])
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
      marker.on('pointerdown', (
        _pointer: Phaser.Input.Pointer,
        _localX: number,
        _localY: number,
        event: Phaser.Types.Input.EventData,
      ) => {
        event.stopPropagation()
        if (this.popupTask) {
          return
        }

        if (this.getActiveDistanceTo(def.x, def.y) <= TASK_INTERACTION_RADIUS + 24) {
          this.openTaskPopup(station)
        } else {
          this.getActiveActor().clickTarget = new Phaser.Math.Vector2(def.x, def.y + 46)
          this.pendingAutoOpenTask = station
          this.guidanceOverrideText = `Vamos hacia: ${def.label}. Acercate para activarlo.`
          this.guidanceOverrideUntil = this.time.now + 2200
        }
      })

      return station
    })

    this.machines = this.tasks.map((station) => this.createMachineMotion(station))
  }

  private createMachineMotion(station: TaskStationState): MachineMotionState {
    const { def } = station
    const rings = [
      this.add
        .ellipse(def.x, def.y + 8, 134, 92, 0xffffff, 0)
        .setStrokeStyle(3, parseColor('#ffffff'), 0.1)
        .setDepth(9),
      this.add
        .ellipse(def.x, def.y + 8, 178, 124, 0xffffff, 0)
        .setStrokeStyle(2, parseColor(this.blueprint.palette.accentAlt), 0.08)
        .setDepth(9),
    ]
    const motion: MachineMotionState = {
      def,
      baseX: def.x,
      baseY: def.y,
      rings,
      spinners: [],
      orbiters: [],
      pulses: [],
      routePhase: Phaser.Math.FloatBetween(0, 1),
    }

    if (def.id === 'wind-turbines') {
      motion.spinners.push(
        this.createBladeSpinner(def.x - 34, def.y - 38, 0.74),
        this.createBladeSpinner(def.x + 3, def.y - 56, 0.9),
        this.createBladeSpinner(def.x + 40, def.y - 32, 0.66),
      )
    }

    if (def.id === 'solar-tractor') {
      motion.mover = this.add
        .image(def.x - 112, def.y + 72, ECO_TEXTURES['solar-tractor'])
        .setDisplaySize(58, 58)
        .setDepth(16)
        .setAlpha(0)
    }

    const pulseTasks: TaskId[] = [
      'solar-panels',
      'energy-automation',
      'water-automation',
      'water-purifier',
      'eco-farm',
      'eco-livestock',
    ]
    if (pulseTasks.includes(def.id)) {
      for (let i = 0; i < 8; i += 1) {
        const color = def.zone === 'water' ? '#7fd2ff' : def.zone === 'energy' ? '#ffe27a' : '#84df9f'
        motion.pulses.push(this.add.ellipse(def.x, def.y, 8, 12, parseColor(color), 0.12).setDepth(15))
      }
    }

    if (def.id === 'insect-control' || def.id === 'eco-farm') {
      const textureKey = def.id === 'insect-control' ? ANIMAL_TEXTURES.bee : butterflyTextureKey(0)
      for (let i = 0; i < 4; i += 1) {
        motion.orbiters.push(this.add.image(def.x, def.y, textureKey).setDisplaySize(26, 26).setDepth(17).setAlpha(0.28))
      }
    }

    if (def.id === 'solar-panels' || def.id === 'water-purifier') {
      for (let i = 0; i < 4; i += 1) {
        motion.orbiters.push(this.add.image(def.x, def.y, sparkleTextureKey()).setDisplaySize(18, 18).setDepth(17).setAlpha(0.18))
      }
    }

    return motion
  }

  private createBladeSpinner(x: number, y: number, scale: number): Phaser.GameObjects.Container {
    const blades = this.add.graphics()
    blades.fillStyle(parseColor('#f9fbff'), 0.96)
    blades.fillTriangle(0, -5, 8, 3, 0, -42)
    blades.fillTriangle(5, 1, 42, -9, 12, 10)
    blades.fillTriangle(-4, 4, -12, 38, 9, 12)
    blades.fillStyle(parseColor('#bde9ff'), 0.88)
    blades.fillCircle(0, 0, 7)
    blades.fillStyle(parseColor('#ffffff'), 0.95)
    blades.fillCircle(-2, -2, 3)

    return this.add.container(x, y, [blades]).setScale(scale).setDepth(18).setAlpha(0.38)
  }

  private createHud(): void {
    this.add.rectangle(VIEW_WIDTH / 2, 36, 900, 70, parseColor('#fff8ef'), 0.9).setScrollFactor(0).setDepth(40)
      .setStrokeStyle(3, parseColor(this.blueprint.palette.accentAlt), 0.65)
    this.add.rectangle(VIEW_WIDTH / 2, 77, 900, 22, parseColor('#17354b'), 0.08).setScrollFactor(0).setDepth(40)

    this.catBadge = this.createHeroBadge(74, 36, 'cat', 'Gato')
    this.dogBadge = this.createHeroBadge(176, 36, 'dog', 'Perro')

    this.progressText = this.add
      .text(248, 28, 'Soluciones 0 / 9', {
        fontFamily: 'Baloo 2, Nunito, sans-serif',
        fontSize: '24px',
        color: '#16324a',
      })
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(42)

    this.scoreText = this.add
      .text(248, 54, 'Puntos Eco 0', {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '19px',
        color: '#28536d',
      })
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(42)

    this.nextTaskText = this.add
      .text(514, 36, 'Siguiente: Explora el campo', {
        fontFamily: 'Baloo 2, Nunito, sans-serif',
        fontSize: '20px',
        color: '#20445b',
        wordWrap: { width: 230 },
      })
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(42)

    this.moodIcon = this.add
      .text(790, 36, '🙂', {
        fontSize: '38px',
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

    const pause = this.createButton(892, 36, 116, 'Pausa', () => {
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

  private createHeroBadge(x: number, y: number, role: ActorRole, label: string): HeroBadgeState {
    const frame = this.add
      .rectangle(0, 0, 82, 56, parseColor('#ffffff'), 0.78)
      .setStrokeStyle(3, parseColor('#c5e7dd'), 0.84)
    const portrait = this.add
      .image(-18, -2, GUARDIANS_TEXTURES[role === 'cat' ? 'catSheet' : 'dogSheet'], 0)
      .setDisplaySize(54, 54)
    applyGuardianArt(portrait, role, 'right', 'idle')
    const text = this.add
      .text(10, 0, label, {
        fontFamily: 'Baloo 2, Nunito, sans-serif',
        fontSize: '18px',
        color: '#16324a',
      })
      .setOrigin(0, 0.5)

    const container = this.add.container(x, y, [frame, portrait, text]).setScrollFactor(0).setDepth(42)
    return { role, container, frame, label: text, portrait }
  }

  private createPopup(): void {
    const backdrop = this.add.rectangle(VIEW_WIDTH / 2, VIEW_HEIGHT / 2, VIEW_WIDTH, VIEW_HEIGHT, 0x17354b, 0.42)
    const panel = this.add.rectangle(VIEW_WIDTH / 2, VIEW_HEIGHT / 2, 690, 362, parseColor('#fff8ef'), 0.96)
      .setStrokeStyle(5, parseColor(this.blueprint.palette.accentAlt), 0.72)
    const icon = this.add.image(VIEW_WIDTH / 2 - 250, VIEW_HEIGHT / 2 - 28, ECO_TEXTURES['solar-panels']).setDisplaySize(126, 126)
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
      this.pendingAutoOpenTask = null

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
    applyGuardianArt(actor.art, actor.role, actor.direction, actor.pose)
    actor.art.setPosition(actor.body.x, actor.body.y - 10 + bob)

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
      const isCurrent = this.currentTask?.def.id === task.def.id
      const pulse = Math.sin(this.time.now * 0.004 + task.bounceOffset)
      task.glow
        .setAlpha(task.placed ? 0.22 + pulse * 0.05 : isCurrent ? 0.28 + pulse * 0.1 : 0.16 + pulse * 0.08)
        .setScale(task.placed ? 1.18 + pulse * 0.03 : isCurrent ? 1.16 + pulse * 0.07 : 1 + pulse * 0.06)
      task.marker
        .setY(task.def.y + pulse * (task.placed ? 4 : 6))
        .setScale(task.placed ? 1.02 + pulse * 0.02 : isCurrent ? 1.08 + pulse * 0.04 : 1 + pulse * 0.03)
      task.pedestal.setFillStyle(parseColor(task.placed ? this.blueprint.palette.accentAlt : '#17354b'), task.placed ? 0.22 : 0.18)
      task.label.setAlpha(task.placed || isCurrent ? 0.98 : 0.84)
      task.marker.setTint(task.placed ? 0xffffff : 0xeaf6ee)
    }
  }

  private updateMachineMotions(delta: number): void {
    for (const machine of this.machines) {
      const placed = this.taskIsPlaced(machine.def.id)
      const isCurrent = this.currentTask?.def.id === machine.def.id
      const emphasis = placed ? 1 : isCurrent ? 0.64 : 0.28
      const wave = Math.sin(this.time.now * 0.004 + machine.routePhase * Math.PI * 2)

      machine.rings.forEach((ring, index) => {
        const scale = 1 + (index * 0.14) + wave * (placed ? 0.06 : 0.03)
        ring
          .setScale(scale)
          .setStrokeStyle(index === 0 ? 3 : 2, parseColor(placed ? this.blueprint.palette.accentAlt : '#ffffff'), (0.08 + emphasis * 0.22) / (index + 1))
      })

      machine.spinners.forEach((spinner, index) => {
        spinner.rotation += delta * (placed ? 5.4 + index * 0.65 : 0.85)
        spinner.setAlpha(placed ? 0.96 : isCurrent ? 0.72 : 0.34)
      })

      machine.orbiters.forEach((orbiter, index) => {
        const radius = 42 + index * 9
        const speed = placed ? 0.0028 : 0.0011
        const angle = this.time.now * speed + index * ((Math.PI * 2) / Math.max(1, machine.orbiters.length))
        const yRadius = machine.def.zone === 'nature' ? 32 : 24
        orbiter
          .setPosition(machine.baseX + Math.cos(angle) * radius, machine.baseY - 14 + Math.sin(angle) * yRadius)
          .setAlpha(placed ? 0.92 : isCurrent ? 0.54 : 0.2)
          .setScale(Math.cos(angle) < 0 ? -1 : 1, 1)
      })

      machine.pulses.forEach((pulse, index) => {
        const beat = (Math.sin(this.time.now * 0.009 + index * 0.82) + 1) * 0.5
        this.updateMachinePulse(machine, pulse, index, beat, emphasis)
      })

      if (machine.mover) {
        if (placed) {
          const phase = (this.time.now * 0.00018 + machine.routePhase) % 1
          const route = Math.sin(phase * Math.PI * 2)
          machine.mover
            .setAlpha(0.92)
            .setPosition(machine.baseX - 118 + phase * 236, machine.baseY + 70 + route * 18)
            .setFlipX(phase > 0.5)
        } else {
          machine.mover.setAlpha(isCurrent ? 0.22 : 0)
        }
      }
    }
  }

  private updateMachinePulse(
    machine: MachineMotionState,
    pulse: Phaser.GameObjects.Ellipse,
    index: number,
    beat: number,
    emphasis: number,
  ): void {
    const col = index % 4
    const row = Math.floor(index / 4)

    if (machine.def.id === 'solar-panels') {
      pulse
        .setPosition(machine.baseX - 46 + col * 30, machine.baseY - 42 - beat * 26 + row * 10)
        .setDisplaySize(8 + beat * 10, 8 + beat * 10)
        .setFillStyle(parseColor('#ffe27a'), emphasis * (0.18 + beat * 0.45))
      return
    }

    if (machine.def.id === 'energy-automation') {
      const angle = index * 0.78 + this.time.now * 0.003
      pulse
        .setPosition(machine.baseX + Math.cos(angle) * 44, machine.baseY - 8 + Math.sin(angle) * 28)
        .setDisplaySize(7 + beat * 8, 7 + beat * 8)
        .setFillStyle(parseColor('#ffe27a'), emphasis * (0.16 + beat * 0.58))
      return
    }

    if (machine.def.id === 'water-automation') {
      pulse
        .setPosition(machine.baseX - 66 + col * 44, machine.baseY + 28 + row * 28 + beat * 18)
        .setDisplaySize(8, 12 + beat * 8)
        .setFillStyle(parseColor('#7fd2ff'), emphasis * (0.2 + beat * 0.55))
      return
    }

    if (machine.def.id === 'water-purifier') {
      pulse
        .setPosition(machine.baseX - 26 + col * 18, machine.baseY + 38 - beat * 42 + row * 18)
        .setDisplaySize(7 + beat * 6, 7 + beat * 6)
        .setFillStyle(parseColor('#c9f5ff'), emphasis * (0.22 + beat * 0.48))
      return
    }

    const cropColor = machine.def.id === 'eco-livestock' ? '#ffd66d' : '#84df9f'
    pulse
      .setPosition(machine.baseX - 58 + col * 38, machine.baseY + 32 + row * 26 - beat * 10)
      .setDisplaySize(8 + beat * 12, 8 + beat * 12)
      .setFillStyle(parseColor(cropColor), emphasis * (0.12 + beat * 0.44))
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

    if (this.pendingAutoOpenTask === this.currentTask) {
      this.pendingAutoOpenTask = null
      this.openTaskPopup(this.currentTask)
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

    const activeBadge = this.activeRole === 'cat' ? this.catBadge : this.dogBadge
    const restingBadge = this.activeRole === 'cat' ? this.dogBadge : this.catBadge
    activeBadge.frame.setFillStyle(parseColor('#fff7cf'), 0.96)
    activeBadge.frame.setStrokeStyle(3, parseColor('#57d6a1'), 0.96)
    activeBadge.container.setScale(1.02)
    restingBadge.frame.setFillStyle(parseColor('#ffffff'), 0.78)
    restingBadge.frame.setStrokeStyle(3, parseColor('#c5e7dd'), 0.84)
    restingBadge.container.setScale(0.95)

    if (this.completedCount < 3) {
      this.moodIcon.setText('🙂')
    } else if (this.completedCount < 6) {
      this.moodIcon.setText('😄')
    } else {
      this.moodIcon.setText('🤩')
    }

    if (this.currentTask) {
      this.guidanceText.setText(`Acercate y ayuda con: ${this.currentTask.def.label}`)
      this.nextTaskText.setText(`Siguiente:\n${this.currentTask.def.shortLabel}`)
    } else if (this.completedCount >= TASKS.length) {
      this.guidanceText.setText('¡El campo esta casi listo para celebrar!')
      this.nextTaskText.setText('Siguiente:\nGran celebracion')
    } else if (this.time.now < this.guidanceOverrideUntil) {
      this.guidanceText.setText(this.guidanceOverrideText)
      this.nextTaskText.setText('Activado:\nCampo mas vivo')
    } else {
      this.guidanceText.setText('Explora el campo y busca otra estacion brillante.')
      const pendingTask = this.tasks.find((task) => !task.placed)
      this.nextTaskText.setText(`Siguiente:\n${pendingTask?.def.shortLabel ?? 'Explorar'}`)
    }
  }

  private openTaskPopup(task: TaskStationState): void {
    this.popupTask = task
    this.popup.title.setText(task.def.label)
    this.popup.body.setText(`${task.def.description}\n\n${task.def.celebration}`)
    this.popup.quote.setText(`“${task.def.voiceLine}”`)
    this.popup.icon.setTexture(ECO_TEXTURES[task.def.id])
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
    this.guidanceOverrideText = task.def.celebration
    this.guidanceOverrideUntil = this.time.now + 3400
    this.cameras.main.shake(120, 0.0026)
    this.cameras.main.flash(180, 255, 245, 190, false)

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

    this.skyGraphics.clear()
    this.groundGraphics.clear()
    this.riverGraphics.clear()
    this.decorGraphics.clear()
    this.frontGraphics.clear()

    this.skyGraphics.fillStyle(parseColor('#ffffff'), 0.1 + progress * 0.08)
    this.skyGraphics.fillEllipse(320, 142, 560, 98)
    this.skyGraphics.fillEllipse(1052, 132, 680, 118)
    this.skyGraphics.fillStyle(parseColor('#ffe27a'), 0.08 + energy * 0.1)
    this.skyGraphics.fillCircle(276, 154, 120)
    this.skyGraphics.fillStyle(parseColor('#7fd2ff'), 0.08 + water * 0.12)
    this.skyGraphics.fillCircle(1262, 216, 138)

    const dryOverlay = 0.5 - progress * 0.42
    if (dryOverlay > 0.02) {
      this.groundGraphics.fillStyle(parseColor('#a88b62'), dryOverlay)
      this.groundGraphics.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
      this.groundGraphics.fillStyle(parseColor('#7a6850'), 0.12 + (1 - progress) * 0.1)
      this.groundGraphics.fillEllipse(360, 214, 560, 250)
      this.groundGraphics.fillEllipse(1234, 280, 520, 240)
      this.groundGraphics.fillEllipse(410, 794, 590, 280)
      this.groundGraphics.fillEllipse(1190, 790, 560, 260)
    }

    this.groundGraphics.fillStyle(parseColor('#fff6cf'), 0.06 + progress * 0.08)
    for (let i = 0; i < 8; i += 1) {
      this.groundGraphics.fillEllipse(192 + i * 176, 540 + Math.sin(i * 0.7) * 12, 160, 34)
    }

    this.riverGraphics.fillStyle(parseColor('#324f3d'), 0.18 - water * 0.12)
    this.riverGraphics.fillEllipse(858, 540, 220, 980)
    this.riverGraphics.fillStyle(parseColor('#a8efff'), 0.06 + water * 0.22)
    for (let i = 0; i < 10; i += 1) {
      this.riverGraphics.fillEllipse(824 + (i % 2) * 34, 170 + i * 86, 86, 18)
    }

    this.decorGraphics.fillStyle(parseColor('#ffffff'), 0.06 + progress * 0.06)
    this.decorGraphics.fillEllipse(280, 242, 260, 70)
    this.decorGraphics.fillEllipse(1220, 276, 280, 72)
    this.decorGraphics.fillEllipse(388, 808, 320, 78)
    this.decorGraphics.fillEllipse(1184, 802, 320, 78)

    this.drawZoneRibbon(210, 96, 196, 'Energia Limpia', '#ffe27a')
    this.drawZoneRibbon(1126, 94, 170, 'Agua Clara', '#7fd2ff')
    this.drawZoneRibbon(224, 596, 208, 'Huerto Feliz', '#84df9f')
    this.drawZoneRibbon(1030, 606, 240, 'Insectos Amigos', '#ffb8c6')

    for (const patch of FLOWER_PATCHES) {
      const visible = progress >= patch.threshold * 0.5 || this.getZoneProgress(patch.zone) > 0.2
      if (!visible) {
        continue
      }

      this.drawFlowerPatch(
        patch.x + (patch.zone === 'water' ? 14 : 0),
        patch.y + (patch.zone === 'farm' ? 10 : 0),
        progress,
        this.getZoneProgress(patch.zone),
      )
    }

    for (const task of this.tasks) {
      if (!task.placed) {
        continue
      }
      this.decorGraphics.fillStyle(parseColor('#ffffff'), 0.1)
      this.decorGraphics.fillCircle(task.def.x, task.def.y + 10, 76)
    }

    if (progress >= 0.66) {
      const rainbow = this.frontGraphics
      rainbow.lineStyle(18, parseColor('#ff9685'), 0.76).arc(1454, 152, 168, Phaser.Math.DegToRad(205), Phaser.Math.DegToRad(332), false)
      rainbow.lineStyle(18, parseColor('#ffd66d'), 0.72).arc(1454, 152, 148, Phaser.Math.DegToRad(205), Phaser.Math.DegToRad(332), false)
      rainbow.lineStyle(18, parseColor('#84df9f'), 0.72).arc(1454, 152, 128, Phaser.Math.DegToRad(205), Phaser.Math.DegToRad(332), false)
      rainbow.lineStyle(18, parseColor('#7fd2ff'), 0.72).arc(1454, 152, 108, Phaser.Math.DegToRad(205), Phaser.Math.DegToRad(332), false)
    }
  }

  private taskIsPlaced(taskId: TaskId): boolean {
    return this.completedTaskIds.has(taskId)
  }

  private drawZoneRibbon(x: number, y: number, width: number, label: string, color: string): void {
    this.frontGraphics.fillStyle(parseColor(color), 0.92)
    this.frontGraphics.fillRoundedRect(x, y, width, 34, 16)
    this.frontGraphics.fillStyle(parseColor('#ffffff'), 0.22)
    this.frontGraphics.fillRoundedRect(x + 8, y + 6, width - 16, 10, 6)
    this.frontGraphics.fillStyle(parseColor('#16324a'), 0.18)
    const notchWidth = Phaser.Math.Clamp(label.length * 7, 54, width - 26)
    this.frontGraphics.fillRoundedRect(x + (width - notchWidth) / 2, y + 17, notchWidth, 7, 3)
  }

  private drawFarmhouse(x: number, y: number, progress: number, solarPlaced: boolean, automationPlaced: boolean): void {
    this.decorGraphics.fillStyle(parseColor('#fff2de'), 0.98)
    this.decorGraphics.fillRoundedRect(x - 92, y - 20, 184, 132, 30)
    this.decorGraphics.fillStyle(parseColor('#c26c51'), 0.98)
    this.decorGraphics.fillTriangle(x - 112, y, x, y - 86, x + 112, y)
    this.decorGraphics.fillStyle(parseColor('#af7a52'), 0.98)
    this.decorGraphics.fillRoundedRect(x - 24, y + 32, 48, 60, 16)

    for (let i = 0; i < 3; i += 1) {
      this.decorGraphics.fillStyle(parseColor(automationPlaced ? '#ffe38a' : '#e6f0ff'), automationPlaced ? 0.96 : 0.84)
      this.decorGraphics.fillRoundedRect(x - 70 + i * 48, y + 18, 28, 24, 8)
    }

    if (solarPlaced) {
      this.decorGraphics.fillStyle(parseColor('#3d79b8'), 1)
      this.decorGraphics.fillRoundedRect(x - 66, y - 34, 54, 28, 8)
      this.decorGraphics.fillRoundedRect(x + 12, y - 42, 54, 28, 8)
      this.decorGraphics.fillStyle(parseColor('#9fe1ff'), 0.9)
      this.decorGraphics.fillRect(x - 60, y - 28, 42, 6)
      this.decorGraphics.fillRect(x - 60, y - 18, 42, 6)
      this.decorGraphics.fillRect(x + 18, y - 36, 42, 6)
      this.decorGraphics.fillRect(x + 18, y - 26, 42, 6)
    }

    this.decorGraphics.fillStyle(mixColors(parseColor('#cfa46d'), parseColor('#88d66b'), progress), 0.96)
    this.decorGraphics.fillRoundedRect(x - 118, y + 104, 236, 28, 12)
  }

  private drawWindCluster(x: number, y: number, progress: number, active: boolean): void {
    this.decorGraphics.fillStyle(mixColors(parseColor('#d5b57a'), parseColor('#8cda76'), progress), 0.92)
    this.decorGraphics.fillEllipse(x, y + 82, 210, 66)

    const turbines = [
      { x: x - 62, y: y + 26, h: 102, swing: active ? -10 : 0 },
      { x, y: y - 8, h: 136, swing: active ? 10 : 0 },
      { x: x + 72, y: y + 20, h: 92, swing: active ? -14 : 0 },
    ] as const

    for (const turbine of turbines) {
      this.decorGraphics.fillStyle(parseColor('#f9fbff'), 0.98)
      this.decorGraphics.fillRoundedRect(turbine.x - 4, turbine.y, 8, turbine.h, 4)
      const hubY = turbine.y + 8
      this.decorGraphics.fillCircle(turbine.x, hubY, 6)
      this.decorGraphics.fillTriangle(turbine.x, hubY, turbine.x - 28, hubY + turbine.swing, turbine.x - 8, hubY + 10)
      this.decorGraphics.fillTriangle(turbine.x, hubY, turbine.x + 28, hubY - turbine.swing, turbine.x + 8, hubY + 10)
      this.decorGraphics.fillTriangle(turbine.x, hubY, turbine.x + (active ? 4 : -4), hubY + 34, turbine.x - 10, hubY + 14)
    }
  }

  private drawTractorPatch(x: number, y: number, active: boolean): void {
    this.decorGraphics.fillStyle(parseColor('#a27753'), 0.96)
    this.decorGraphics.fillRoundedRect(x - 74, y - 12, 148, 84, 24)
    this.decorGraphics.fillStyle(parseColor('#72ba54'), 1)
    this.decorGraphics.fillRoundedRect(x - 34, y + 8, 72, 34, 12)
    this.decorGraphics.fillCircle(x - 18, y + 52, 14)
    this.decorGraphics.fillCircle(x + 34, y + 52, 14)
    this.decorGraphics.fillStyle(parseColor('#4a81bb'), 1)
    this.decorGraphics.fillRoundedRect(x - 12, y - 6, 34, 16, 6)
    this.decorGraphics.fillStyle(parseColor(active ? '#ffe27a' : '#d5dfec'), active ? 0.96 : 0.72)
    this.decorGraphics.fillRoundedRect(x - 6, y - 18, 22, 8, 4)
    this.decorGraphics.fillStyle(parseColor(active ? '#fff4c6' : '#b58e67'), 0.92)
    this.decorGraphics.fillRoundedRect(x - 84, y + 70, 168, 18, 9)
  }

  private drawIrrigationBeds(x: number, y: number, progress: number, active: boolean): void {
    const bedColor = mixColors(parseColor('#b87f4e'), parseColor('#8dcd69'), progress * 0.72)
    for (let row = 0; row < 4; row += 1) {
      this.decorGraphics.fillStyle(bedColor, 0.96)
      this.decorGraphics.fillRoundedRect(x - 92, y + row * 26, 186, 18, 9)
      for (let i = 0; i < 7; i += 1) {
        const stemHeight = active ? 18 + ((row + i) % 3) * 3 : 10
        this.decorGraphics.fillStyle(parseColor('#59bf58'), active ? 0.96 : 0.62)
        this.decorGraphics.fillRect(x - 78 + i * 26, y - stemHeight + row * 26, 4, stemHeight)
        this.decorGraphics.fillCircle(x - 76 + i * 26, y - stemHeight - 2 + row * 26, 8)
      }
    }

    this.decorGraphics.fillStyle(parseColor('#5ebcff'), 0.94)
    this.decorGraphics.fillRoundedRect(x - 112, y + 22, 14, 68, 7)
    this.decorGraphics.fillRoundedRect(x + 92, y + 22, 14, 68, 7)
    if (active) {
      this.decorGraphics.fillStyle(parseColor('#dff8ff'), 0.88)
      for (let i = 0; i < 8; i += 1) {
        this.decorGraphics.fillCircle(x - 94 + (i % 4) * 60, y + 12 + Math.floor(i / 4) * 52, 4)
      }
    }
  }

  private drawPurifierGarden(x: number, y: number, progress: number, active: boolean): void {
    this.decorGraphics.fillStyle(parseColor('#6dd5c8'), 0.98)
    this.decorGraphics.fillRoundedRect(x - 34, y - 96, 68, 146, 20)
    this.decorGraphics.fillStyle(parseColor(active ? '#c9f2ff' : '#97c4cf'), active ? 0.96 : 0.7)
    this.decorGraphics.fillRoundedRect(x - 24, y - 66, 48, 64, 14)
    this.decorGraphics.fillStyle(parseColor('#89d06a'), 0.98)
    for (let i = 0; i < 5; i += 1) {
      this.decorGraphics.fillRect(x + 48 + i * 10, y - 18 - i * 2, 4, 34 + i * 3)
      this.decorGraphics.fillEllipse(x + 50 + i * 10, y - 24 - i * 2, 14, 8)
    }
    this.decorGraphics.fillStyle(mixColors(parseColor('#7fa28e'), parseColor('#79e0ff'), 0.2 + progress * 0.8), 0.9)
    this.decorGraphics.fillEllipse(x + 36, y + 34, 112, 40)
  }

  private drawCropRows(x: number, y: number, progress: number, active: boolean): void {
    const cropColors = ['#7fd26a', '#ffd66d', '#ff8fa5', '#8fd2ff'] as const
    for (let row = 0; row < 4; row += 1) {
      this.decorGraphics.fillStyle(parseColor('#a17348'), 0.96)
      this.decorGraphics.fillRoundedRect(x - 132, y - 64 + row * 34, 256, 22, 11)
      for (let i = 0; i < 9; i += 1) {
        const stemHeight = active ? 18 + ((row + i) % 3) * 4 : 8 + (i % 2) * 2
        this.decorGraphics.fillStyle(parseColor('#53b84f'), 0.96)
        this.decorGraphics.fillRect(x - 112 + i * 28, y - 84 + row * 34, 4, stemHeight)
        this.decorGraphics.fillStyle(parseColor(cropColors[(row + i) % cropColors.length]), active ? 0.98 : 0.72)
        this.decorGraphics.fillCircle(x - 110 + i * 28, y - 88 + row * 34, active ? 8 : 5)
      }
    }

    this.decorGraphics.fillStyle(mixColors(parseColor('#d8b37a'), parseColor('#9bdc7d'), progress), 0.94)
    this.decorGraphics.fillRoundedRect(x - 152, y + 84, 294, 22, 11)
  }

  private drawBarnyard(x: number, y: number, progress: number, active: boolean): void {
    this.decorGraphics.fillStyle(parseColor('#bb7b50'), 0.98)
    this.decorGraphics.fillRoundedRect(x - 94, y - 52, 188, 122, 26)
    this.decorGraphics.fillStyle(parseColor('#8b4d3e'), 0.96)
    this.decorGraphics.fillTriangle(x - 114, y - 26, x, y - 102, x + 114, y - 26)
    this.decorGraphics.fillStyle(parseColor('#7ed46a'), 0.94)
    this.decorGraphics.fillRoundedRect(x - 124, y + 76, 248, 38, 18)
    this.decorGraphics.fillStyle(parseColor('#fff4e2'), 1)
    this.decorGraphics.fillEllipse(x - 26, y + 20, 34, 24)
    this.decorGraphics.fillEllipse(x + 30, y + 24, 28, 20)
    if (active) {
      this.decorGraphics.fillStyle(parseColor('#ffcf6f'), 0.9)
      this.decorGraphics.fillCircle(x - 38, y - 6, 5)
      this.decorGraphics.fillCircle(x - 14, y - 14, 4)
      this.decorGraphics.fillCircle(x + 46, y - 4, 4)
    }
    this.decorGraphics.fillStyle(mixColors(parseColor('#b88a5b'), parseColor('#8fdc6f'), progress), 0.94)
    this.decorGraphics.fillRoundedRect(x - 144, y + 112, 284, 18, 9)
  }

  private drawBugGarden(x: number, y: number, progress: number, active: boolean): void {
    this.decorGraphics.fillStyle(mixColors(parseColor('#b78353'), parseColor('#7ddc72'), progress), 0.96)
    this.decorGraphics.fillEllipse(x, y + 42, 286, 146)
    for (let i = 0; i < 14; i += 1) {
      const px = x - 120 + (i % 7) * 40
      const py = y - 22 + Math.floor(i / 7) * 54
      this.decorGraphics.fillStyle(parseColor('#59bf58'), 0.94)
      this.decorGraphics.fillRect(px - 2, py - 10, 4, 24)
      this.decorGraphics.fillStyle(parseColor(['#ff9bb0', '#ffd66d', '#84dfff', '#ffffff'][i % 4]), active ? 0.98 : 0.7)
      this.decorGraphics.fillCircle(px, py - 14, active ? 8 : 6)
    }

    this.decorGraphics.fillStyle(parseColor('#c48f52'), 0.96)
    this.decorGraphics.fillRoundedRect(x + 98, y - 52, 38, 84, 10)
    this.decorGraphics.fillStyle(parseColor('#8a5d38'), 0.96)
    for (let i = 0; i < 3; i += 1) {
      this.decorGraphics.fillRect(x + 108, y - 42 + i * 22, 18, 12)
    }

    if (active) {
      this.decorGraphics.fillStyle(parseColor('#ffd66d'), 1)
      this.decorGraphics.fillEllipse(x - 12, y - 42, 18, 14)
      this.decorGraphics.fillStyle(parseColor('#3e2f24'), 1)
      this.decorGraphics.fillRect(x - 14, y - 48, 3, 12)
      this.decorGraphics.fillStyle(parseColor('#ff8fb1'), 0.98)
      this.decorGraphics.fillCircle(x + 42, y - 30, 7)
      this.decorGraphics.fillCircle(x + 50, y - 30, 7)
    }
  }

  private drawRiverbankDetails(progress: number): void {
    this.frontGraphics.fillStyle(parseColor('#e8ddc2'), 0.46)
    this.frontGraphics.fillEllipse(1154, 516, 78, 24)
    this.frontGraphics.fillEllipse(1178, 598, 86, 28)
    this.frontGraphics.fillEllipse(1188, 700, 72, 22)
    for (let i = 0; i < 8; i += 1) {
      const reedX = 1160 + (i % 3) * 18 + (i > 4 ? 114 : 0)
      const reedY = 338 + i * 42
      this.frontGraphics.fillStyle(parseColor('#72c66d'), 0.92)
      this.frontGraphics.fillRect(reedX, reedY, 4, 24)
      this.frontGraphics.fillEllipse(reedX + 2, reedY - 6, 12, 7)
    }

    if (progress > 0.45) {
      this.frontGraphics.fillStyle(parseColor('#ffffff'), 0.24)
      this.frontGraphics.fillCircle(1322, 538, 14)
      this.frontGraphics.fillCircle(1278, 624, 10)
      this.frontGraphics.fillCircle(1296, 714, 12)
    }
  }

  private drawBridge(x: number, y: number, progress: number): void {
    this.frontGraphics.fillStyle(parseColor('#a1744e'), 0.96)
    this.frontGraphics.fillRoundedRect(x - 34, y, 68, 108, 18)
    this.frontGraphics.fillStyle(parseColor('#d8b07b'), 0.88)
    for (let i = 0; i < 5; i += 1) {
      this.frontGraphics.fillRoundedRect(x - 24, y + 10 + i * 18, 48, 10, 5)
    }
    this.frontGraphics.fillStyle(parseColor('#6e523a'), 0.9)
    this.frontGraphics.fillRoundedRect(x - 40, y - 12, 12, 132, 6)
    this.frontGraphics.fillRoundedRect(x + 28, y - 12, 12, 132, 6)
    if (progress > 0.4) {
      this.frontGraphics.fillStyle(parseColor('#fff3c5'), 0.42)
      this.frontGraphics.fillRoundedRect(x - 12, y + 20, 24, 68, 12)
    }
  }

  private drawTree(x: number, y: number, leafColor: number, alpha: number): void {
    this.decorGraphics.fillStyle(parseColor('#6e4f34'), 0.26)
    this.decorGraphics.fillEllipse(x, y + 68, 62, 16)
    this.decorGraphics.fillStyle(parseColor('#815d3d'), 0.96)
    this.decorGraphics.fillRoundedRect(x - 11, y + 18, 22, 56, 8)
    this.decorGraphics.fillStyle(parseColor('#9a7250'), 0.4)
    this.decorGraphics.fillRoundedRect(x - 3, y + 22, 6, 44, 3)
    this.decorGraphics.fillStyle(mixColors(leafColor, parseColor('#c7ef9b'), 0.16), alpha)
    this.decorGraphics.fillCircle(x, y, 42)
    this.decorGraphics.fillCircle(x - 28, y + 16, 30)
    this.decorGraphics.fillCircle(x + 28, y + 16, 30)
    this.decorGraphics.fillCircle(x, y + 24, 34)
    this.decorGraphics.fillStyle(parseColor('#dff8a6'), 0.2)
    this.decorGraphics.fillCircle(x - 12, y - 10, 14)
    this.decorGraphics.fillCircle(x + 16, y + 4, 10)
  }

  private drawFlowerPatch(x: number, y: number, progress: number, zoneProgress: number): void {
    const flowerCount = 8 + Math.round(progress * 7 + zoneProgress * 6)
    for (let i = 0; i < flowerCount; i += 1) {
      const angle = (Math.PI * 2 * i) / flowerCount
      const distance = 8 + (i % 4) * 8
      const px = x + Math.cos(angle) * distance
      const py = y + Math.sin(angle) * distance
      this.decorGraphics.fillStyle(parseColor('#5fbf58'), 0.9)
      this.decorGraphics.fillRect(px - 1, py - 2, 2, 11)
      this.decorGraphics.fillStyle(
        [parseColor('#ff9bb0'), parseColor('#fff08b'), parseColor('#84dfff'), parseColor('#ffffff')][i % 4],
        0.95,
      )
      this.decorGraphics.fillCircle(px - 3, py - 7, 3)
      this.decorGraphics.fillCircle(px + 3, py - 7, 3)
      this.decorGraphics.fillCircle(px, py - 10, 3)
      this.decorGraphics.fillCircle(px, py - 4, 3)
    }
  }

  private drawFence(x: number, y: number, width: number, height: number, progress: number): void {
    this.frontGraphics.lineStyle(6, mixColors(parseColor('#8c6745'), parseColor('#a97a53'), progress * 0.55), 0.92)
    this.frontGraphics.strokeRoundedRect(x, y, width, height, 24)
    for (let px = x + 22; px < x + width; px += 40) {
      this.frontGraphics.lineBetween(px, y, px, y + height)
    }
    this.frontGraphics.lineStyle(3, parseColor('#f7d2a5'), 0.36)
    this.frontGraphics.strokeRoundedRect(x + 8, y + 8, width - 16, height - 16, 18)
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

    const winCat = this.add.image(358, 340, GUARDIANS_TEXTURES.catSheet, 0).setDisplaySize(172, 172).setDepth(22)
    const winDog = this.add.image(538, 348, GUARDIANS_TEXTURES.dogSheet, 0).setDisplaySize(176, 176).setDepth(22)
    applyGuardianArt(winCat, 'cat', 'down', 'happy')
    applyGuardianArt(winDog, 'dog', 'right', 'happy')
    this.add.image(734, 324, ECO_TEXTURES['eco-farm']).setDisplaySize(150, 150).setDepth(20)
    this.add.image(840, 336, ECO_TEXTURES['wind-turbines']).setDisplaySize(150, 150).setDepth(20)
    this.add.image(154, 404, ANIMAL_TEXTURES.cow).setDisplaySize(82, 82).setDepth(20)
    this.add.image(190, 446, ANIMAL_TEXTURES.bunny).setDisplaySize(70, 70).setDepth(20)
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
  if (scene.textures.exists(sparkleTextureKey())) {
    return
  }

  for (const frame of [0, 1] as const) {
    createGraphicsTexture(scene, butterflyTextureKey(frame), 64, 64, (graphics) => {
      drawButterflyTexture(graphics, frame)
    })
  }

  for (const frame of [0, 1] as const) {
    createGraphicsTexture(scene, cloudTextureKey(frame), 220, 104, (graphics) => {
      drawCloudTexture(graphics, frame)
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

function drawCloudTexture(graphics: Phaser.GameObjects.Graphics, frame: 0 | 1): void {
  graphics.fillStyle(parseColor('#87b9df'), 0.16)
  graphics.fillEllipse(112, 70, 144, 24)
  graphics.fillStyle(parseColor('#ffffff'), 0.92)
  graphics.fillEllipse(72, 52, 74, 38)
  graphics.fillEllipse(110, 42 + frame * 2, 82, 46)
  graphics.fillEllipse(150, 54, 90, 40)
  graphics.fillEllipse(188, 56 - frame * 2, 54, 30)
  graphics.fillStyle(parseColor('#dff3ff'), 0.74)
  graphics.fillEllipse(110, 36, 44, 18)
  graphics.fillEllipse(156, 46, 36, 14)
}

function guardianFrameIndex(role: ActorRole, direction: Direction, pose: CharacterPose): { frame: number; flipX: boolean } {
  const usesSide = direction === 'left' || direction === 'right'
  const flipX = direction === 'left'

  if (usesSide) {
    if (pose === 'walk-a') return { frame: 5, flipX }
    if (pose === 'walk-b') return { frame: 6, flipX }
    if (pose === 'thinking') return { frame: role === 'cat' ? 7 : 4, flipX }
    if (pose === 'point') return { frame: 7, flipX }
    if (pose === 'happy') return { frame: 3, flipX: false }
    return { frame: 4, flipX }
  }

  if (direction === 'up') {
    if (pose === 'walk-a') return { frame: 9, flipX: false }
    if (pose === 'walk-b') return { frame: 10, flipX: false }
    if (pose === 'point') return { frame: 11, flipX: false }
    return { frame: 8, flipX: false }
  }

  if (pose === 'walk-a') return { frame: 1, flipX: false }
  if (pose === 'walk-b') return { frame: 2, flipX: false }
  if (pose === 'happy') return { frame: 3, flipX: false }
  return { frame: 0, flipX: false }
}

function applyGuardianArt(
  image: Phaser.GameObjects.Image,
  role: ActorRole,
  direction: Direction,
  pose: CharacterPose,
): void {
  const { frame, flipX } = guardianFrameIndex(role, direction, pose)
  image.setTexture(GUARDIAN_SHEET_KEYS[role], frame)
  image.setFlipX(flipX)
}

function butterflyTextureKey(frame: 0 | 1): string {
  return `guardians-butterfly-${frame}`
}

function cloudTextureKey(frame: 0 | 1): string {
  return `guardians-cloud-${frame}`
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
