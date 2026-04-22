export const CAMERA_MODES = ['top-down', 'side-view'] as const
export const MOVEMENT_SYSTEMS = ['free-8dir', 'lane-switch', 'platformer', 'slingshot'] as const
export const PHYSICS_MODELS = ['scripted-arcade', 'matter-rigid-body'] as const
export const COMBAT_SYSTEMS = ['auto-shoot', 'pulse-burst', 'projectile-shot', 'none'] as const
export const OBJECTIVE_TYPES = ['survive', 'collect', 'finish-run', 'destroy-targets'] as const
export const WORLD_LAYOUTS = [
  'arena',
  'lanes',
  'relic-field',
  'platform-route',
  'fortress-stack',
] as const
export const SPECIAL_MECHANICS = [
  'none',
  'combo-chain',
  'rewind-dash',
  'destructible-structures',
] as const
export const RUNTIME_PROFILES = [
  'arena-survivor',
  'lane-runner',
  'relic-hunt',
  'platformer-expedition',
  'slingshot-destruction',
] as const
export const SUPPORT_LEVELS = ['native', 'hybrid', 'approximate'] as const

export type CameraMode = (typeof CAMERA_MODES)[number]
export type MovementSystem = (typeof MOVEMENT_SYSTEMS)[number]
export type PhysicsModel = (typeof PHYSICS_MODELS)[number]
export type CombatSystem = (typeof COMBAT_SYSTEMS)[number]
export type ObjectiveType = (typeof OBJECTIVE_TYPES)[number]
export type WorldLayout = (typeof WORLD_LAYOUTS)[number]
export type SpecialMechanic = (typeof SPECIAL_MECHANICS)[number]
export type RuntimeProfile = (typeof RUNTIME_PROFILES)[number]
export type SupportLevel = (typeof SUPPORT_LEVELS)[number]

export type GenerationSource = 'ai' | 'fallback'
export type GenerationProviderKind = 'openai-compatible' | 'ollama' | 'fallback'

export const CAMERA_LABELS: Record<CameraMode, string> = {
  'top-down': 'Top Down',
  'side-view': 'Side View',
}

export const MOVEMENT_LABELS: Record<MovementSystem, string> = {
  'free-8dir': 'Free 8-Direction',
  'lane-switch': 'Lane Switch',
  platformer: 'Platformer',
  slingshot: 'Slingshot',
}

export const PHYSICS_LABELS: Record<PhysicsModel, string> = {
  'scripted-arcade': 'Scripted Arcade',
  'matter-rigid-body': 'Matter Rigid Body',
}

export const COMBAT_LABELS: Record<CombatSystem, string> = {
  'auto-shoot': 'Auto Shoot',
  'pulse-burst': 'Pulse Burst',
  'projectile-shot': 'Projectile Shot',
  none: 'No Combat',
}

export const OBJECTIVE_LABELS: Record<ObjectiveType, string> = {
  survive: 'Survive',
  collect: 'Collect',
  'finish-run': 'Finish Run',
  'destroy-targets': 'Destroy Targets',
}

export const WORLD_LAYOUT_LABELS: Record<WorldLayout, string> = {
  arena: 'Arena',
  lanes: 'Lanes',
  'relic-field': 'Relic Field',
  'platform-route': 'Platform Route',
  'fortress-stack': 'Fortress Stack',
}

export const SPECIAL_LABELS: Record<SpecialMechanic, string> = {
  none: 'No Special',
  'combo-chain': 'Combo Chain',
  'rewind-dash': 'Rewind Dash',
  'destructible-structures': 'Destructible Structures',
}

export const RUNTIME_LABELS: Record<RuntimeProfile, string> = {
  'arena-survivor': 'Arena Survivor',
  'lane-runner': 'Lane Runner',
  'relic-hunt': 'Relic Hunt',
  'platformer-expedition': 'Platformer Expedition',
  'slingshot-destruction': 'Slingshot Destruction',
}

export const SUPPORT_LEVEL_LABELS: Record<SupportLevel, string> = {
  native: 'Native Runtime',
  hybrid: 'Hybrid Approximation',
  approximate: 'Approximate Slice',
}

export interface GamePalette {
  bg: string
  surface: string
  accent: string
  accentAlt: string
  danger: string
  text: string
}

export interface GameCharacter {
  name: string
  role: string
  description: string
  abilities: string[]
}

export interface GameSystems {
  camera: CameraMode
  movement: MovementSystem
  physics: PhysicsModel
  combat: CombatSystem
  objective: ObjectiveType
  worldLayout: WorldLayout
  specialMechanic: SpecialMechanic
}

export interface PhysicsTuning {
  gravity: number
  bounce: number
  friction: number
  drag: number
  projectilePower: number
  structuralIntegrity: number
}

export interface GameBlueprint {
  id: string
  slug: string
  title: string
  tagline: string
  runtimeProfile: RuntimeProfile
  supportLevel: SupportLevel
  genre: string
  playerFantasy: string
  worldSummary: string
  visualStyle: string
  audioMood: string
  noveltyHook: string
  approximationStrategy: string
  controlNotes: string[]
  coreLoop: string[]
  mechanicHighlights: string[]
  implementationNotes: string[]
  productionBacklog: string[]
  levelMoments: string[]
  assetPrompts: string[]
  imageInsights: string[]
  winCondition: string
  loseCondition: string
  palette: GamePalette
  systems: GameSystems
  physics: PhysicsTuning
  hero: GameCharacter
  enemies: GameCharacter[]
  sourceImageCount: number
}

export interface GenerationResult {
  blueprint: GameBlueprint
  generationSource: GenerationSource
  providerKind: GenerationProviderKind
  providerLabel: string
  warnings: string[]
  createdAt: string
}

export interface StoredGeneration extends GenerationResult {
  notes: string
  files: Array<{
    name: string
    mimeType: string
    size: number
  }>
}

export function deriveRuntimeProfile(systems: GameSystems): RuntimeProfile {
  if (
    systems.movement === 'slingshot' ||
    systems.physics === 'matter-rigid-body' ||
    systems.objective === 'destroy-targets'
  ) {
    return 'slingshot-destruction'
  }

  if (systems.movement === 'platformer' || systems.camera === 'side-view') {
    return 'platformer-expedition'
  }

  if (systems.movement === 'lane-switch' || systems.objective === 'finish-run') {
    return 'lane-runner'
  }

  if (systems.objective === 'collect') {
    return 'relic-hunt'
  }

  return 'arena-survivor'
}
