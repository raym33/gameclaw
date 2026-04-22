import crypto from 'node:crypto'

import {
  CAMERA_MODES,
  COMBAT_SYSTEMS,
  OBJECTIVE_TYPES,
  PHYSICS_MODELS,
  RUNTIME_LABELS,
  SPECIAL_MECHANICS,
  SUPPORT_LEVELS,
  WORLD_LAYOUTS,
  type GameBlueprint,
  type GameCharacter,
  type GamePalette,
  type GameSystems,
  type PhysicsTuning,
  type RuntimeProfile,
  type SpecialMechanic,
  type SupportLevel,
} from '../shared/game'

const MOVEMENT_SYSTEMS = ['free-8dir', 'lane-switch', 'platformer', 'slingshot'] as const
const HEX_COLOR = /^#(?:[0-9a-f]{3}){1,2}$/i

export const GAME_BLUEPRINT_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'title',
    'tagline',
    'supportLevel',
    'genre',
    'playerFantasy',
    'worldSummary',
    'visualStyle',
    'audioMood',
    'noveltyHook',
    'approximationStrategy',
    'controlNotes',
    'coreLoop',
    'mechanicHighlights',
    'implementationNotes',
    'productionBacklog',
    'levelMoments',
    'assetPrompts',
    'imageInsights',
    'winCondition',
    'loseCondition',
    'palette',
    'systems',
    'physics',
    'hero',
    'enemies',
  ],
  properties: {
    title: { type: 'string', minLength: 1, maxLength: 80 },
    tagline: { type: 'string', minLength: 1, maxLength: 160 },
    supportLevel: {
      type: 'string',
      enum: ['native', 'hybrid', 'approximate'],
    },
    genre: { type: 'string', minLength: 1, maxLength: 60 },
    playerFantasy: { type: 'string', minLength: 1, maxLength: 220 },
    worldSummary: { type: 'string', minLength: 1, maxLength: 500 },
    visualStyle: { type: 'string', minLength: 1, maxLength: 220 },
    audioMood: { type: 'string', minLength: 1, maxLength: 120 },
    noveltyHook: { type: 'string', minLength: 1, maxLength: 180 },
    approximationStrategy: { type: 'string', minLength: 1, maxLength: 220 },
    controlNotes: listSchema(3, 6, 120),
    coreLoop: listSchema(3, 5, 120),
    mechanicHighlights: listSchema(3, 6, 140),
    implementationNotes: listSchema(2, 6, 160),
    productionBacklog: listSchema(2, 6, 160),
    levelMoments: listSchema(3, 5, 140),
    assetPrompts: listSchema(3, 6, 220),
    imageInsights: listSchema(2, 6, 160),
    winCondition: { type: 'string', minLength: 1, maxLength: 180 },
    loseCondition: { type: 'string', minLength: 1, maxLength: 180 },
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
    systems: {
      type: 'object',
      additionalProperties: false,
      required: [
        'camera',
        'movement',
        'physics',
        'combat',
        'objective',
        'worldLayout',
        'specialMechanic',
      ],
      properties: {
        camera: { type: 'string', enum: [...CAMERA_MODES] },
        movement: { type: 'string', enum: [...MOVEMENT_SYSTEMS] },
        physics: { type: 'string', enum: [...PHYSICS_MODELS] },
        combat: { type: 'string', enum: [...COMBAT_SYSTEMS] },
        objective: { type: 'string', enum: [...OBJECTIVE_TYPES] },
        worldLayout: { type: 'string', enum: [...WORLD_LAYOUTS] },
        specialMechanic: { type: 'string', enum: [...SPECIAL_MECHANICS] },
      },
    },
    physics: {
      type: 'object',
      additionalProperties: false,
      required: [
        'gravity',
        'bounce',
        'friction',
        'drag',
        'projectilePower',
        'structuralIntegrity',
      ],
      properties: {
        gravity: { type: 'number', minimum: 0.2, maximum: 2.5 },
        bounce: { type: 'number', minimum: 0, maximum: 0.95 },
        friction: { type: 'number', minimum: 0, maximum: 1 },
        drag: { type: 'number', minimum: 0, maximum: 0.25 },
        projectilePower: { type: 'number', minimum: 2, maximum: 16 },
        structuralIntegrity: { type: 'number', minimum: 1, maximum: 12 },
      },
    },
    hero: characterSchema(),
    enemies: {
      type: 'array',
      minItems: 1,
      maxItems: 4,
      items: characterSchema(),
    },
  },
} as const

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
  abilities: ['Dash', 'Prototype instinct', 'Last-second recovery'],
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
  const inferredProfile = inferRuntimeProfileFromText(`${title} ${options.notes}`)
  const systems = normalizeSystems(raw.systems, `${title} ${options.notes}`, inferredProfile)
  const runtimeProfile = deriveProfileFromSystems(systems)
  const supportLevel = normalizeSupportLevel(
    raw.supportLevel,
    `${options.notes} ${raw.noveltyHook ?? ''}`,
    runtimeProfile,
    systems.specialMechanic,
  )

  return {
    id: crypto.randomUUID(),
    slug: slugify(title),
    title,
    tagline: stringOrFallback(
      raw.tagline,
      'Upload messy references, ship a stable vertical slice.',
    ),
    runtimeProfile,
    supportLevel,
    genre: stringOrFallback(raw.genre, defaultGenre(runtimeProfile)),
    playerFantasy: stringOrFallback(
      raw.playerFantasy,
      'Pilot the strongest part of the idea before the full production pipeline exists.',
    ),
    worldSummary: stringOrFallback(
      raw.worldSummary,
      'A playable prototype distilled from sketches, screenshots, and handwritten ideas.',
    ),
    visualStyle: stringOrFallback(
      raw.visualStyle,
      'Bold silhouette work, layered gradients, and readable arcade contrast.',
    ),
    audioMood: stringOrFallback(raw.audioMood, 'Punchy arcade rhythm with handmade texture.'),
    noveltyHook: stringOrFallback(
      raw.noveltyHook,
      defaultNoveltyHook(runtimeProfile, options.notes),
    ),
    approximationStrategy: stringOrFallback(
      raw.approximationStrategy,
      defaultApproximationStrategy(runtimeProfile, supportLevel, systems.specialMechanic),
    ),
    controlNotes: listOrFallback(raw.controlNotes, defaultControlNotes(runtimeProfile, systems)),
    coreLoop: listOrFallback(raw.coreLoop, defaultLoop(runtimeProfile)),
    mechanicHighlights: listOrFallback(
      raw.mechanicHighlights,
      defaultMechanics(runtimeProfile, systems),
    ),
    implementationNotes: listOrFallback(
      raw.implementationNotes,
      defaultImplementationNotes(runtimeProfile, systems),
    ),
    productionBacklog: listOrFallback(
      raw.productionBacklog,
      defaultProductionBacklog(runtimeProfile, systems, supportLevel),
    ),
    levelMoments: listOrFallback(raw.levelMoments, defaultMoments(runtimeProfile)),
    assetPrompts: listOrFallback(raw.assetPrompts, defaultAssetPrompts(title, runtimeProfile)),
    imageInsights: listOrFallback(
      raw.imageInsights,
      buildInsights(options.fileNames, options.notes),
    ),
    winCondition: stringOrFallback(raw.winCondition, defaultWinCondition(runtimeProfile)),
    loseCondition: stringOrFallback(raw.loseCondition, defaultLoseCondition(runtimeProfile)),
    palette: normalizePalette(raw.palette),
    systems,
    physics: normalizePhysics(raw.physics, runtimeProfile),
    hero: normalizeCharacter(raw.hero, defaultHero(runtimeProfile)),
    enemies: normalizeEnemies(raw.enemies, runtimeProfile),
    sourceImageCount: options.sourceImageCount,
  }
}

export function buildFallbackBlueprint(
  notes: string,
  fileNames: string[],
  sourceImageCount: number,
): GameBlueprint {
  const inferredProfile = inferRuntimeProfileFromText(notes)
  const specialMechanic = inferSpecialMechanic(notes, inferredProfile)
  const supportLevel = inferSupportLevel(notes, inferredProfile, specialMechanic)

  return normalizeBlueprint(
    {
      title: buildTitle(notes, fileNames),
      supportLevel,
      noveltyHook: defaultNoveltyHook(inferredProfile, notes),
      approximationStrategy: defaultApproximationStrategy(
        inferredProfile,
        supportLevel,
        specialMechanic,
      ),
      systems: {
        ...defaultsForProfile(inferredProfile),
        specialMechanic,
      },
      genre: defaultGenre(inferredProfile),
      worldSummary: summarizeNotes(notes, fileNames),
      visualStyle: 'Sketch-driven shapes, cinematic gradients, and readable arcade contrast.',
      audioMood: 'Hybrid of crunchy arcade rhythm and moody ambient pads.',
      imageInsights: buildInsights(fileNames, notes),
    },
    { notes, fileNames, sourceImageCount },
  )
}

function characterSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['name', 'role', 'description', 'abilities'],
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 40 },
      role: { type: 'string', minLength: 1, maxLength: 40 },
      description: { type: 'string', minLength: 1, maxLength: 180 },
      abilities: listSchema(2, 4, 70),
    },
  } as const
}

function listSchema(minItems: number, maxItems: number, maxLength: number) {
  return {
    type: 'array',
    minItems,
    maxItems,
    items: { type: 'string', minLength: 1, maxLength },
  } as const
}

function normalizeSystems(
  value: unknown,
  hint: string,
  inferredProfile: RuntimeProfile,
): GameSystems {
  const raw = isRecord(value) ? value : {}
  const preferredProfile = inferProfileFromRaw(raw, hint, inferredProfile)
  const defaults = defaultsForProfile(preferredProfile)

  if (preferredProfile === 'slingshot-destruction') {
    return {
      camera: 'side-view',
      movement: 'slingshot',
      physics: 'matter-rigid-body',
      combat: 'none',
      objective: 'destroy-targets',
      worldLayout: 'fortress-stack',
      specialMechanic:
        enumOrFallback(raw.specialMechanic, SPECIAL_MECHANICS, 'destructible-structures') ??
        'destructible-structures',
    }
  }

  if (preferredProfile === 'platformer-expedition') {
    return {
      camera: 'side-view',
      movement: 'platformer',
      physics: 'scripted-arcade',
      combat: enumOrFallback(raw.combat, COMBAT_SYSTEMS, 'projectile-shot'),
      objective: enumOrFallback(raw.objective, OBJECTIVE_TYPES, 'collect'),
      worldLayout: 'platform-route',
      specialMechanic: normalizeSpecial(
        raw.specialMechanic,
        preferredProfile,
        hint,
        defaults.specialMechanic,
      ),
    }
  }

  if (preferredProfile === 'lane-runner') {
    return {
      camera: 'top-down',
      movement: 'lane-switch',
      physics: 'scripted-arcade',
      combat: 'none',
      objective: 'finish-run',
      worldLayout: 'lanes',
      specialMechanic: normalizeSpecial(
        raw.specialMechanic,
        preferredProfile,
        hint,
        defaults.specialMechanic,
      ),
    }
  }

  if (preferredProfile === 'relic-hunt') {
    return {
      camera: 'top-down',
      movement: 'free-8dir',
      physics: 'scripted-arcade',
      combat: enumOrFallback(raw.combat, COMBAT_SYSTEMS, 'pulse-burst'),
      objective: 'collect',
      worldLayout: 'relic-field',
      specialMechanic: normalizeSpecial(
        raw.specialMechanic,
        preferredProfile,
        hint,
        defaults.specialMechanic,
      ),
    }
  }

  return {
    camera: 'top-down',
    movement: 'free-8dir',
    physics: 'scripted-arcade',
    combat: enumOrFallback(raw.combat, COMBAT_SYSTEMS, 'auto-shoot'),
    objective: 'survive',
    worldLayout: 'arena',
    specialMechanic: normalizeSpecial(
      raw.specialMechanic,
      preferredProfile,
      hint,
      defaults.specialMechanic,
    ),
  }
}

function normalizeSpecial(
  value: unknown,
  profile: RuntimeProfile,
  hint: string,
  fallback: SpecialMechanic,
): SpecialMechanic {
  const inferred = enumOrFallback(value, SPECIAL_MECHANICS, inferSpecialMechanic(hint, profile))
  if (profile === 'slingshot-destruction') {
    return 'destructible-structures'
  }

  return inferred ?? fallback
}

function normalizeSupportLevel(
  value: unknown,
  hint: string,
  profile: RuntimeProfile,
  specialMechanic: SpecialMechanic,
): SupportLevel {
  return (
    enumOrFallback(
      value,
      SUPPORT_LEVELS,
      inferSupportLevel(hint, profile, specialMechanic),
    ) ?? 'native'
  )
}

function normalizePhysics(value: unknown, profile: RuntimeProfile): PhysicsTuning {
  const raw = isRecord(value) ? value : {}
  const defaults = defaultPhysics(profile)

  return {
    gravity: numberOrFallback(raw.gravity, defaults.gravity, 0.2, 2.5),
    bounce: numberOrFallback(raw.bounce, defaults.bounce, 0, 0.95),
    friction: numberOrFallback(raw.friction, defaults.friction, 0, 1),
    drag: numberOrFallback(raw.drag, defaults.drag, 0, 0.25),
    projectilePower: numberOrFallback(raw.projectilePower, defaults.projectilePower, 2, 16),
    structuralIntegrity: numberOrFallback(
      raw.structuralIntegrity,
      defaults.structuralIntegrity,
      1,
      12,
    ),
  }
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

function normalizeEnemies(value: unknown, profile: RuntimeProfile): GameCharacter[] {
  if (!Array.isArray(value) || value.length === 0) {
    return defaultEnemies(profile)
  }

  return value
    .map((entry) => normalizeCharacter(entry, DEFAULT_ENEMY))
    .filter((entry, index, list) => list.findIndex((item) => item.name === entry.name) === index)
    .slice(0, 4)
}

function defaultsForProfile(profile: RuntimeProfile): GameSystems {
  switch (profile) {
    case 'slingshot-destruction':
      return {
        camera: 'side-view',
        movement: 'slingshot',
        physics: 'matter-rigid-body',
        combat: 'none',
        objective: 'destroy-targets',
        worldLayout: 'fortress-stack',
        specialMechanic: 'destructible-structures',
      }
    case 'platformer-expedition':
      return {
        camera: 'side-view',
        movement: 'platformer',
        physics: 'scripted-arcade',
        combat: 'projectile-shot',
        objective: 'collect',
        worldLayout: 'platform-route',
        specialMechanic: 'rewind-dash',
      }
    case 'lane-runner':
      return {
        camera: 'top-down',
        movement: 'lane-switch',
        physics: 'scripted-arcade',
        combat: 'none',
        objective: 'finish-run',
        worldLayout: 'lanes',
        specialMechanic: 'combo-chain',
      }
    case 'relic-hunt':
      return {
        camera: 'top-down',
        movement: 'free-8dir',
        physics: 'scripted-arcade',
        combat: 'pulse-burst',
        objective: 'collect',
        worldLayout: 'relic-field',
        specialMechanic: 'rewind-dash',
      }
    default:
      return {
        camera: 'top-down',
        movement: 'free-8dir',
        physics: 'scripted-arcade',
        combat: 'auto-shoot',
        objective: 'survive',
        worldLayout: 'arena',
        specialMechanic: 'combo-chain',
      }
  }
}

function defaultPhysics(profile: RuntimeProfile): PhysicsTuning {
  switch (profile) {
    case 'slingshot-destruction':
      return {
        gravity: 1.2,
        bounce: 0.45,
        friction: 0.08,
        drag: 0.01,
        projectilePower: 10,
        structuralIntegrity: 7,
      }
    case 'platformer-expedition':
      return {
        gravity: 1.1,
        bounce: 0.08,
        friction: 0.18,
        drag: 0.04,
        projectilePower: 7,
        structuralIntegrity: 5,
      }
    case 'lane-runner':
      return {
        gravity: 0.4,
        bounce: 0.02,
        friction: 0.1,
        drag: 0.01,
        projectilePower: 4,
        structuralIntegrity: 4,
      }
    case 'relic-hunt':
      return {
        gravity: 0.55,
        bounce: 0.06,
        friction: 0.12,
        drag: 0.02,
        projectilePower: 6,
        structuralIntegrity: 5,
      }
    default:
      return {
        gravity: 0.7,
        bounce: 0.08,
        friction: 0.12,
        drag: 0.02,
        projectilePower: 6,
        structuralIntegrity: 5,
      }
  }
}

function defaultHero(profile: RuntimeProfile): GameCharacter {
  switch (profile) {
    case 'slingshot-destruction':
      return {
        name: 'Anchor Rebel',
        role: 'artillery lead',
        description: 'A launch specialist who turns strange ideas into impact.',
        abilities: ['Elastic aim', 'Heavy payload', 'Last-shot focus'],
      }
    case 'platformer-expedition':
      return {
        name: 'Vault Runner',
        role: 'platform scout',
        description: 'A fast explorer built for jumps, shortcuts, and risky recoveries.',
        abilities: ['Air control', 'Forward shot', 'Rewind dash'],
      }
    case 'lane-runner':
      return {
        name: 'Slipstream',
        role: 'runner',
        description: 'A speed pilot threading through unstable traffic.',
        abilities: ['Lane snap', 'Chain focus', 'Speed reserve'],
      }
    case 'relic-hunt':
      return {
        name: 'Relic Diver',
        role: 'collector',
        description: 'A scavenger reading space and pressure at the same time.',
        abilities: ['Pulse wave', 'Quick pivot', 'Rewind dodge'],
      }
    default:
      return DEFAULT_HERO
  }
}

function defaultEnemies(profile: RuntimeProfile): GameCharacter[] {
  switch (profile) {
    case 'slingshot-destruction':
      return [
        {
          name: 'Core Totem',
          role: 'target',
          description: 'The fragile objective buried inside stacked defenses.',
          abilities: ['Brace', 'Collapse trigger'],
        },
      ]
    case 'platformer-expedition':
      return [
        {
          name: 'Rail Drone',
          role: 'patroller',
          description: 'A sentry drifting across the route and punishing bad timing.',
          abilities: ['Patrol', 'Body check'],
        },
      ]
    case 'lane-runner':
      return [
        {
          name: 'Crash Marker',
          role: 'hazard',
          description: 'A lane blocker built to break combos.',
          abilities: ['Block lane', 'Crowd the route'],
        },
      ]
    case 'relic-hunt':
      return [
        {
          name: 'Shard Hunter',
          role: 'pursuer',
          description: 'A hunter that closes space while you collect.',
          abilities: ['Rush', 'Pressure'],
        },
      ]
    default:
      return [DEFAULT_ENEMY]
  }
}

function defaultGenre(profile: RuntimeProfile): string {
  switch (profile) {
    case 'slingshot-destruction':
      return 'Physics destruction prototype'
    case 'platformer-expedition':
      return 'Platform action prototype'
    case 'lane-runner':
      return 'Arcade runner prototype'
    case 'relic-hunt':
      return 'Action collector prototype'
    default:
      return 'Arena action prototype'
  }
}

function defaultNoveltyHook(profile: RuntimeProfile, notes: string): string {
  if (notes.trim()) {
    return notes.trim().slice(0, 160)
  }

  switch (profile) {
    case 'slingshot-destruction':
      return 'Rigid-body impact and collapse sell the fantasy immediately.'
    case 'platformer-expedition':
      return 'Traversal and recovery define the game more than raw damage output.'
    case 'lane-runner':
      return 'Speed, rhythm, and route-reading become the core expression.'
    case 'relic-hunt':
      return 'Pressure-based collection keeps the prototype readable and tense.'
    default:
      return 'The hook survives by focusing on one loop and one signature move.'
  }
}

function defaultApproximationStrategy(
  profile: RuntimeProfile,
  supportLevel: SupportLevel,
  specialMechanic: SpecialMechanic,
): string {
  if (supportLevel === 'native') {
    return `Implemented directly through the ${RUNTIME_LABELS[profile]} runtime with stable systems.`
  }

  if (supportLevel === 'hybrid') {
    return `The unusual idea is anchored in ${RUNTIME_LABELS[profile]} and represented through ${specialMechanic.replace('-', ' ')} as the main differentiator.`
  }

  return `The full concept is broader than the current runtime, so the prototype collapses it into ${RUNTIME_LABELS[profile]} while preserving the strongest player-facing hook.`
}

function defaultControlNotes(profile: RuntimeProfile, systems: GameSystems): string[] {
  if (profile === 'slingshot-destruction') {
    return [
      'Drag the projectile with the mouse or touch',
      'Release to launch with rigid-body physics',
      'Use the available shots to collapse the structure',
    ]
  }

  if (profile === 'platformer-expedition') {
    return [
      'Move with A/D or left/right',
      'Jump with W or up',
      systems.specialMechanic === 'rewind-dash'
        ? 'Space attacks and Shift rewinds your last position'
        : 'Space attacks or triggers the main traversal action',
    ]
  }

  if (profile === 'lane-runner') {
    return [
      'Switch lanes with A/D or left/right',
      'Read hazard timing instead of over-correcting',
      systems.specialMechanic === 'rewind-dash'
        ? 'Shift rewinds your last mistake if you time it early'
        : 'Chain pickups to keep your combo alive',
    ]
  }

  return [
    'Move with WASD or arrow keys',
    systems.combat === 'projectile-shot'
      ? 'Press Space to fire your main shot'
      : systems.combat === 'pulse-burst'
        ? 'Press Space to trigger your pulse burst'
        : 'Maintain spacing and let the loop build momentum',
    systems.specialMechanic === 'rewind-dash'
      ? 'Press Shift to rewind your last position'
      : 'Keep the strongest mechanic in rhythm',
  ]
}

function defaultLoop(profile: RuntimeProfile): string[] {
  switch (profile) {
    case 'slingshot-destruction':
      return ['Read the structure', 'Pull back and fire', 'Collapse defenses and clear targets']
    case 'platformer-expedition':
      return ['Cross the route', 'Control jumps and shots', 'Secure pickups under pressure']
    case 'lane-runner':
      return ['Read the route', 'Switch cleanly', 'Chain pickups until the finish']
    case 'relic-hunt':
      return ['Scout the field', 'Collect relics', 'Pulse back pursuers and escape']
    default:
      return ['Move through the arena', 'Exploit your main attack loop', 'Outlast escalating pressure']
  }
}

function defaultMechanics(profile: RuntimeProfile, systems: GameSystems): string[] {
  const base =
    profile === 'slingshot-destruction'
      ? ['Elastic launch arc', 'Rigid-body collapse', 'Target elimination through chain reactions']
      : profile === 'platformer-expedition'
        ? ['Jump timing', 'Route pressure', 'Mid-air correction']
        : profile === 'lane-runner'
          ? ['Three-lane routing', 'Hazard reads', 'Pickup combo pacing']
          : profile === 'relic-hunt'
            ? ['Top-down collection', 'Close-range panic button', 'Hunter pressure']
            : ['Auto-pressure combat', 'Space control', 'Wave escalation']

  if (systems.specialMechanic === 'rewind-dash') {
    base.push('Short-range rewind recovery')
  }
  if (systems.specialMechanic === 'combo-chain') {
    base.push('Combo multiplier for clean execution')
  }

  return base.slice(0, 6)
}

function defaultImplementationNotes(profile: RuntimeProfile, systems: GameSystems): string[] {
  const notes =
    profile === 'slingshot-destruction'
      ? [
          'Use Phaser Matter bodies for the projectile, stack, and targets.',
          'Treat destruction as a velocity and displacement threshold problem rather than full structural simulation.',
        ]
      : profile === 'platformer-expedition'
        ? [
            'Keep collision readable with a small set of hand-authored platforms.',
            'Use a single signature attack so traversal stays primary.',
          ]
        : profile === 'lane-runner'
          ? [
              'Keep the route readable with fixed lanes and deterministic wave pacing.',
              'Reward clean movement more than twitch randomness.',
            ]
          : profile === 'relic-hunt'
            ? [
                'Anchor tension around collection pressure instead of raw enemy count.',
                'The pulse mechanic should create emergency breathing room, not trivialize pursuit.',
              ]
            : [
                'Auto-shoot exists to preserve flow while the player focuses on movement.',
                'Enemy escalation should spike visually before it spikes lethally.',
              ]

  if (systems.specialMechanic === 'rewind-dash') {
    notes.push('Record short movement history and expose a lightweight positional rewind.')
  }

  return notes.slice(0, 6)
}

function defaultProductionBacklog(
  profile: RuntimeProfile,
  systems: GameSystems,
  supportLevel: SupportLevel,
): string[] {
  const backlog = [
    'Replace placeholder shapes with authored sprites and hit feedback.',
    'Add progression, onboarding, and clearer fail-state messaging.',
  ]

  if (profile === 'slingshot-destruction') {
    backlog.push('Add material-specific destruction behavior and more than one fort layout.')
  }
  if (profile === 'platformer-expedition') {
    backlog.push('Add enemy variety, checkpointing, and longer route composition.')
  }
  if (systems.specialMechanic === 'rewind-dash') {
    backlog.push('Turn the rewind into a deeper system with cooldowns, echoes, or resource cost.')
  }
  if (supportLevel !== 'native') {
    backlog.push('Build a bespoke module for the original idea so the prototype stops approximating it.')
  }

  return backlog.slice(0, 6)
}

function defaultMoments(profile: RuntimeProfile): string[] {
  switch (profile) {
    case 'slingshot-destruction':
      return ['First calibrated shot', 'Partial collapse and target exposure', 'Last-shot chain reaction']
    case 'platformer-expedition':
      return ['Opening jump read', 'Mid-route pressure platform', 'Final pickup scramble']
    case 'lane-runner':
      return ['First route split', 'Mid-run hazard flood', 'Final sprint with a live combo']
    case 'relic-hunt':
      return ['First relic secured', 'Hunter pressure spike', 'Final relic escape']
    default:
      return ['Opening calm', 'Pressure spike', 'Short final stand']
  }
}

function defaultAssetPrompts(title: string, profile: RuntimeProfile): string[] {
  return [
    `${title} hero render for ${profile} with strong silhouette and readable color blocking`,
    `${title} environment kit for ${profile} with sketchbook energy and clear gameplay readability`,
    `${title} enemies and pickups for ${profile} with arcade contrast and clean motion cues`,
  ]
}

function defaultWinCondition(profile: RuntimeProfile): string {
  switch (profile) {
    case 'slingshot-destruction':
      return 'Destroy every target inside the structure before you run out of shots.'
    case 'platformer-expedition':
      return 'Collect the route objectives and survive the platform run.'
    case 'lane-runner':
      return 'Reach the finish timer alive with enough pickups to validate the route.'
    case 'relic-hunt':
      return 'Collect every relic before the hunters drain your health.'
    default:
      return 'Survive the timer while keeping the prototype loop intact.'
  }
}

function defaultLoseCondition(profile: RuntimeProfile): string {
  switch (profile) {
    case 'slingshot-destruction':
      return 'Run out of shots before the structure gives up its targets.'
    case 'platformer-expedition':
      return 'Miss the route too often and the expedition collapses.'
    case 'lane-runner':
      return 'Take too many hits before the finish sequence resolves.'
    case 'relic-hunt':
      return 'Let the pursuers pin you down before the last relic is secured.'
    default:
      return 'Lose too much health before the loop completes.'
  }
}

function buildInsights(fileNames: string[], notes: string): string[] {
  const base = [
    `Detected ${Math.max(fileNames.length, 1)} reference image${fileNames.length === 1 ? '' : 's'}.`,
    'The references suggest the user cares more about tone and mechanic identity than final production polish.',
  ]

  if (notes.trim()) {
    base.push(`Notes emphasize: ${notes.trim().slice(0, 110)}${notes.trim().length > 110 ? '...' : ''}`)
  }

  if (fileNames.length > 0) {
    base.push(`File hints: ${fileNames.slice(0, 3).join(', ')}`)
  }

  return base.slice(0, 4)
}

function inferProfileFromRaw(
  raw: Record<string, unknown>,
  hint: string,
  fallback: RuntimeProfile,
): RuntimeProfile {
  const compact = JSON.stringify(raw).toLowerCase()
  const combined = `${compact} ${hint.toLowerCase()}`

  if (
    combined.includes('slingshot') ||
    combined.includes('catapult') ||
    combined.includes('destroy-targets') ||
    combined.includes('fortress') ||
    combined.includes('matter-rigid-body') ||
    combined.includes('destructible-structures')
  ) {
    return 'slingshot-destruction'
  }

  if (
    combined.includes('platformer') ||
    combined.includes('metroidvania') ||
    combined.includes('jump') ||
    combined.includes('side-view') ||
    combined.includes('platform-route')
  ) {
    return 'platformer-expedition'
  }

  if (
    combined.includes('lane-switch') ||
    combined.includes('runner') ||
    combined.includes('finish-run') ||
    combined.includes('lanes')
  ) {
    return 'lane-runner'
  }

  if (
    combined.includes('collect') ||
    combined.includes('relic') ||
    combined.includes('maze') ||
    combined.includes('explore')
  ) {
    return 'relic-hunt'
  }

  return fallback
}

function inferRuntimeProfileFromText(text: string): RuntimeProfile {
  const lowered = text.toLowerCase()

  if (
    lowered.includes('catapult') ||
    lowered.includes('slingshot') ||
    lowered.includes('physics destruction') ||
    lowered.includes('derribo') ||
    lowered.includes('destruccion')
  ) {
    return 'slingshot-destruction'
  }

  if (
    lowered.includes('platformer') ||
    lowered.includes('metroidvania') ||
    lowered.includes('jump') ||
    lowered.includes('salto') ||
    lowered.includes('plataforma') ||
    lowered.includes('lateral')
  ) {
    return 'platformer-expedition'
  }

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
    return 'relic-hunt'
  }

  return 'arena-survivor'
}

function inferSpecialMechanic(text: string, profile: RuntimeProfile): SpecialMechanic {
  const lowered = text.toLowerCase()

  if (profile === 'slingshot-destruction') {
    return 'destructible-structures'
  }

  if (
    lowered.includes('rewind') ||
    lowered.includes('time') ||
    lowered.includes('temporal') ||
    lowered.includes('rebobina')
  ) {
    return 'rewind-dash'
  }

  if (
    lowered.includes('combo') ||
    lowered.includes('chain') ||
    lowered.includes('ritmo') ||
    lowered.includes('streak')
  ) {
    return 'combo-chain'
  }

  return defaultsForProfile(profile).specialMechanic
}

function inferSupportLevel(
  text: string,
  profile: RuntimeProfile,
  specialMechanic: SpecialMechanic,
): SupportLevel {
  const lowered = text.toLowerCase()
  const unsupportedKeywords = [
    'card',
    'deck',
    'dialogue',
    'city builder',
    'management',
    'mmo',
    'social deduction',
    'rhythm',
    'farming',
  ]

  if (unsupportedKeywords.some((keyword) => lowered.includes(keyword))) {
    return 'approximate'
  }

  if (
    specialMechanic === 'rewind-dash' ||
    lowered.includes('original') ||
    lowered.includes('extraño') ||
    lowered.includes('weird') ||
    lowered.includes('experimental')
  ) {
    return profile === 'slingshot-destruction' ? 'native' : 'hybrid'
  }

  return 'native'
}

function deriveProfileFromSystems(systems: GameSystems): RuntimeProfile {
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

function numberOrFallback(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback
  }

  return Math.min(max, Math.max(min, value))
}

function enumOrFallback<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return typeof value === 'string' && allowed.includes(value as T) ? (value as T) : fallback
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
