import crypto from 'node:crypto'

import type {
  GameBlueprint,
  GameCharacter,
  GamePalette,
  GameTemplate,
} from '../shared/game'

const HEX_COLOR = /^#(?:[0-9a-f]{3}){1,2}$/i

export const GAME_BLUEPRINT_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'title',
    'tagline',
    'template',
    'genre',
    'playerFantasy',
    'worldSummary',
    'visualStyle',
    'audioMood',
    'controlNotes',
    'coreLoop',
    'mechanicHighlights',
    'levelMoments',
    'assetPrompts',
    'imageInsights',
    'winCondition',
    'loseCondition',
    'palette',
    'hero',
    'enemies',
  ],
  properties: {
    title: { type: 'string', minLength: 1, maxLength: 80 },
    tagline: { type: 'string', minLength: 1, maxLength: 140 },
    template: {
      type: 'string',
      enum: ['arena-survivor', 'lane-runner', 'relic-sprint'],
    },
    genre: { type: 'string', minLength: 1, maxLength: 60 },
    playerFantasy: { type: 'string', minLength: 1, maxLength: 200 },
    worldSummary: { type: 'string', minLength: 1, maxLength: 500 },
    visualStyle: { type: 'string', minLength: 1, maxLength: 200 },
    audioMood: { type: 'string', minLength: 1, maxLength: 120 },
    controlNotes: {
      type: 'array',
      minItems: 3,
      maxItems: 6,
      items: { type: 'string', minLength: 1, maxLength: 100 },
    },
    coreLoop: {
      type: 'array',
      minItems: 3,
      maxItems: 5,
      items: { type: 'string', minLength: 1, maxLength: 120 },
    },
    mechanicHighlights: {
      type: 'array',
      minItems: 3,
      maxItems: 6,
      items: { type: 'string', minLength: 1, maxLength: 120 },
    },
    levelMoments: {
      type: 'array',
      minItems: 3,
      maxItems: 5,
      items: { type: 'string', minLength: 1, maxLength: 120 },
    },
    assetPrompts: {
      type: 'array',
      minItems: 3,
      maxItems: 6,
      items: { type: 'string', minLength: 1, maxLength: 200 },
    },
    imageInsights: {
      type: 'array',
      minItems: 2,
      maxItems: 6,
      items: { type: 'string', minLength: 1, maxLength: 140 },
    },
    winCondition: { type: 'string', minLength: 1, maxLength: 160 },
    loseCondition: { type: 'string', minLength: 1, maxLength: 160 },
    palette: {
      type: 'object',
      additionalProperties: false,
      required: ['bg', 'surface', 'accent', 'accentAlt', 'danger', 'text'],
      properties: {
        bg: { type: 'string' },
        surface: { type: 'string' },
        accent: { type: 'string' },
        accentAlt: { type: 'string' },
        danger: { type: 'string' },
        text: { type: 'string' },
      },
    },
    hero: characterSchema(),
    enemies: {
      type: 'array',
      minItems: 1,
      maxItems: 3,
      items: characterSchema(),
    },
  },
} as const

function characterSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['name', 'role', 'description', 'abilities'],
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 40 },
      role: { type: 'string', minLength: 1, maxLength: 40 },
      description: { type: 'string', minLength: 1, maxLength: 160 },
      abilities: {
        type: 'array',
        minItems: 2,
        maxItems: 4,
        items: { type: 'string', minLength: 1, maxLength: 60 },
      },
    },
  } as const
}

const DEFAULT_PALETTE: GamePalette = {
  bg: '#111418',
  surface: '#1c232c',
  accent: '#f3b95f',
  accentAlt: '#69d2c7',
  danger: '#ff6b57',
  text: '#f7f1e8',
}

const DEFAULT_HERO: GameCharacter = {
  name: 'The Dreamer',
  role: 'lead',
  description: 'A sketch-born hero chasing an impossible prototype.',
  abilities: ['Burst dash', 'Ink shot', 'Improvised shield'],
}

const DEFAULT_ENEMY: GameCharacter = {
  name: 'Glitch Wisp',
  role: 'enemy',
  description: 'A shape-shifting fragment that hunts unfinished ideas.',
  abilities: ['Rush', 'Swarm', 'Disrupt'],
}

export function normalizeBlueprint(
  input: unknown,
  options: {
    notes: string
    fileNames: string[]
    sourceImageCount: number
  },
): GameBlueprint {
  const raw = isRecord(input) ? input : {}
  const title = stringOrFallback(raw.title, buildTitle(options.notes, options.fileNames))
  const template = normalizeTemplate(raw.template, `${title} ${options.notes}`)

  return {
    id: crypto.randomUUID(),
    slug: slugify(title),
    title,
    tagline: stringOrFallback(
      raw.tagline,
      'Upload sketches, get a playable prototype, keep the original spark.',
    ),
    template,
    genre: stringOrFallback(raw.genre, fallbackGenre(template)),
    playerFantasy: stringOrFallback(
      raw.playerFantasy,
      'Move fast, improvise, and turn rough ideas into momentum.',
    ),
    worldSummary: stringOrFallback(
      raw.worldSummary,
      'A playable prototype distilled from sketches, screenshots, and handwritten ideas.',
    ),
    visualStyle: stringOrFallback(
      raw.visualStyle,
      'Bold graphic silhouettes, layered gradients, and sketchbook energy.',
    ),
    audioMood: stringOrFallback(raw.audioMood, 'Pulsing synth tension with hand-made texture.'),
    controlNotes: listOrFallback(raw.controlNotes, [
      'Move with WASD or arrow keys',
      'Use Space for the signature burst',
      'Survive long enough to complete the prototype loop',
    ]),
    coreLoop: listOrFallback(raw.coreLoop, defaultLoop(template)),
    mechanicHighlights: listOrFallback(raw.mechanicHighlights, defaultMechanics(template)),
    levelMoments: listOrFallback(raw.levelMoments, defaultMoments(template)),
    assetPrompts: listOrFallback(raw.assetPrompts, defaultAssetPrompts(title)),
    imageInsights: listOrFallback(raw.imageInsights, buildInsights(options.fileNames, options.notes)),
    winCondition: stringOrFallback(raw.winCondition, defaultWinCondition(template)),
    loseCondition: stringOrFallback(raw.loseCondition, defaultLoseCondition(template)),
    palette: normalizePalette(raw.palette),
    hero: normalizeCharacter(raw.hero, DEFAULT_HERO),
    enemies: normalizeEnemies(raw.enemies),
    sourceImageCount: options.sourceImageCount,
  }
}

export function buildFallbackBlueprint(
  notes: string,
  fileNames: string[],
  sourceImageCount: number,
): GameBlueprint {
  return normalizeBlueprint(
    {
      title: buildTitle(notes, fileNames),
      template: inferTemplateFromText(notes),
      genre: 'AI prototyped action concept',
      tagline: 'A first playable version assembled from visual references.',
      playerFantasy: 'You pilot the core idea before the art and systems are locked.',
      worldSummary: summarizeNotes(notes, fileNames),
      visualStyle: 'Sketch-driven shapes, cinematic gradients, and readable arcade contrast.',
      audioMood: 'Hybrid of crunchy arcade rhythm and moody ambient pads.',
      imageInsights: buildInsights(fileNames, notes),
    },
    { notes, fileNames, sourceImageCount },
  )
}

function normalizeTemplate(value: unknown, hint: string): GameTemplate {
  if (value === 'arena-survivor' || value === 'lane-runner' || value === 'relic-sprint') {
    return value
  }

  return inferTemplateFromText(hint)
}

function inferTemplateFromText(text: string): GameTemplate {
  const lowered = text.toLowerCase()

  if (
    lowered.includes('runner') ||
    lowered.includes('carrera') ||
    lowered.includes('velocidad') ||
    lowered.includes('lane')
  ) {
    return 'lane-runner'
  }

  if (
    lowered.includes('maze') ||
    lowered.includes('laberinto') ||
    lowered.includes('relic') ||
    lowered.includes('explore') ||
    lowered.includes('collect')
  ) {
    return 'relic-sprint'
  }

  return 'arena-survivor'
}

function normalizePalette(value: unknown): GamePalette {
  const raw = isRecord(value) ? value : {}

  return {
    bg: colorOrFallback(raw.bg, DEFAULT_PALETTE.bg),
    surface: colorOrFallback(raw.surface, DEFAULT_PALETTE.surface),
    accent: colorOrFallback(raw.accent, DEFAULT_PALETTE.accent),
    accentAlt: colorOrFallback(raw.accentAlt, DEFAULT_PALETTE.accentAlt),
    danger: colorOrFallback(raw.danger, DEFAULT_PALETTE.danger),
    text: colorOrFallback(raw.text, DEFAULT_PALETTE.text),
  }
}

function normalizeCharacter(value: unknown, fallback: GameCharacter): GameCharacter {
  const raw = isRecord(value) ? value : {}

  return {
    name: stringOrFallback(raw.name, fallback.name),
    role: stringOrFallback(raw.role, fallback.role),
    description: stringOrFallback(raw.description, fallback.description),
    abilities: listOrFallback(raw.abilities, fallback.abilities).slice(0, 4),
  }
}

function normalizeEnemies(value: unknown): GameCharacter[] {
  if (!Array.isArray(value) || value.length === 0) {
    return [DEFAULT_ENEMY]
  }

  return value
    .map((entry) => normalizeCharacter(entry, DEFAULT_ENEMY))
    .filter((entry, index, list) => list.findIndex((item) => item.name === entry.name) === index)
    .slice(0, 3)
}

function defaultLoop(template: GameTemplate): string[] {
  switch (template) {
    case 'lane-runner':
      return ['Read the lane layout', 'Switch cleanly', 'Chain pickups to build momentum']
    case 'relic-sprint':
      return ['Scout the room', 'Secure relics', 'Pulse back the hunters']
    default:
      return ['Move through the arena', 'Auto-fire and burst', 'Outlast escalating enemy waves']
  }
}

function defaultMechanics(template: GameTemplate): string[] {
  switch (template) {
    case 'lane-runner':
      return ['Three-lane dodging', 'Combo pickup chain', 'Hit-based danger meter']
    case 'relic-sprint':
      return ['Top-down scavenging', 'Short-range pulse attack', 'Hunter pressure escalation']
    default:
      return ['Auto-targeting attacks', 'Short-cooldown burst', 'Wave-based enemy pressure']
  }
}

function defaultMoments(template: GameTemplate): string[] {
  switch (template) {
    case 'lane-runner':
      return ['Fast opening lane swap', 'Mid-run hazard flood', 'Final sprint with double pickups']
    case 'relic-sprint':
      return ['First relic reveal', 'Arena lock-in with extra hunters', 'Last relic escape']
    default:
      return ['Opening calm before the rush', 'Mid-match enemy spike', 'Last-stand finale']
  }
}

function defaultAssetPrompts(title: string): string[] {
  return [
    `${title} hero silhouette with bold outline and 2-color shading`,
    `${title} environment tile set with sketchbook energy and clean gameplay readability`,
    `${title} enemy pack with readable shapes, strong contrast, and arcade motion cues`,
  ]
}

function defaultWinCondition(template: GameTemplate): string {
  switch (template) {
    case 'lane-runner':
      return 'Stay alive until the finish timer ends and collect enough sparks to complete the run.'
    case 'relic-sprint':
      return 'Collect every relic fragment before the hunters drain your health.'
    default:
      return 'Survive the arena countdown while clearing enough enemies to stabilize the zone.'
  }
}

function defaultLoseCondition(template: GameTemplate): string {
  switch (template) {
    case 'lane-runner':
      return 'Crash into too many hazards and the run collapses.'
    case 'relic-sprint':
      return 'Let the hunter swarm pin you down until your health is gone.'
    default:
      return 'Take too many enemy hits before the timer completes.'
  }
}

function buildInsights(fileNames: string[], notes: string): string[] {
  const base = [
    `Detected ${Math.max(fileNames.length, 1)} reference image${fileNames.length === 1 ? '' : 's'}.`,
    'The references suggest the user cares more about tone and shape language than final polish.',
  ]

  if (notes.trim()) {
    base.push(`Notes emphasize: ${notes.trim().slice(0, 100)}${notes.trim().length > 100 ? '...' : ''}`)
  }

  if (fileNames.length > 0) {
    base.push(`File hints: ${fileNames.slice(0, 3).join(', ')}`)
  }

  return base.slice(0, 4)
}

function buildTitle(notes: string, fileNames: string[]): string {
  const fromNotes = notes
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .join(' ')

  if (fromNotes) {
    return capitalizeWords(fromNotes)
  }

  const fromFile = fileNames[0]?.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim()
  if (fromFile) {
    return capitalizeWords(fromFile)
  }

  return 'Gameclaw Prototype'
}

function summarizeNotes(notes: string, fileNames: string[]): string {
  if (notes.trim()) {
    return notes.trim().slice(0, 280)
  }

  if (fileNames.length > 0) {
    return `Built from the uploaded references: ${fileNames.join(', ')}.`
  }

  return 'Built from rough visual references and early gameplay thoughts.'
}

function fallbackGenre(template: GameTemplate): string {
  switch (template) {
    case 'lane-runner':
      return 'Arcade runner'
    case 'relic-sprint':
      return 'Action scavenger'
    default:
      return 'Arena action'
  }
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'gameclaw-prototype'
  )
}

function stringOrFallback(value: unknown, fallback: string): string {
  if (typeof value !== 'string') {
    return fallback
  }

  const trimmed = value.trim()
  return trimmed || fallback
}

function colorOrFallback(value: unknown, fallback: string): string {
  if (typeof value !== 'string') {
    return fallback
  }

  const trimmed = value.trim()
  return HEX_COLOR.test(trimmed) ? trimmed : fallback
}

function listOrFallback(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) {
    return fallback
  }

  const cleaned = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)

  return cleaned.length > 0 ? cleaned : fallback
}

function capitalizeWords(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
