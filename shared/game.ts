export const GAME_TEMPLATES = [
  'arena-survivor',
  'lane-runner',
  'relic-sprint',
] as const

export type GameTemplate = (typeof GAME_TEMPLATES)[number]

export const TEMPLATE_LABELS: Record<GameTemplate, string> = {
  'arena-survivor': 'Arena Survivor',
  'lane-runner': 'Lane Runner',
  'relic-sprint': 'Relic Sprint',
}

export type GenerationSource = 'openai' | 'fallback'

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

export interface GameBlueprint {
  id: string
  slug: string
  title: string
  tagline: string
  template: GameTemplate
  genre: string
  playerFantasy: string
  worldSummary: string
  visualStyle: string
  audioMood: string
  controlNotes: string[]
  coreLoop: string[]
  mechanicHighlights: string[]
  levelMoments: string[]
  assetPrompts: string[]
  imageInsights: string[]
  winCondition: string
  loseCondition: string
  palette: GamePalette
  hero: GameCharacter
  enemies: GameCharacter[]
  sourceImageCount: number
}

export interface GenerationResult {
  blueprint: GameBlueprint
  generationSource: GenerationSource
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
