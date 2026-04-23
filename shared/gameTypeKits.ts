import type { CombatSystem, RuntimeProfile, SpecialMechanic } from './game'

type GameTypeKitTuning = {
  topDownPlayerSpeed?: number
  enemySpawnInterval?: number
  enemyBaseSpeed?: number
  enemySpeedScoreFactor?: number
  chaseMultiplier?: number
  autoShootInterval?: number
  shardCollectRadius?: number
  shardScore?: number
  laneSpawnInterval?: number
  laneMoveSpeedBase?: number
  laneMoveSpeedScoreFactor?: number
  laneSwitchCooldown?: number
  laneHazardDamage?: number
  lanePickupScore?: number
  lanePattern?: 'balanced' | 'pickup-rich' | 'hazard-heavy'
  relicEnemyCap?: number
  relicCollectRadius?: number
  relicPickupScore?: number
  relicLayout?: 'scatter-ring' | 'maze-ribbon' | 'pressure-clusters'
  platformerMoveSpeed?: number
  platformerJumpVelocity?: number
  platformerPatrolSpeed?: number
  platformerPatrolDamage?: number
  platformerCourse?: 'treasure-route' | 'precision-climb' | 'combat-gauntlet'
}

type PreferredSystems = {
  combat?: CombatSystem
  specialMechanic?: SpecialMechanic
}

type GameTypeKitDefinition = {
  id: string
  label: string
  runtimeProfile: RuntimeProfile
  genreLabel: string
  summary: string
  keywords: readonly string[]
  preferredSystems?: PreferredSystems
  tuning?: GameTypeKitTuning
}

export const GAME_TYPE_KITS = [
  {
    id: 'spell-swarm-survivor',
    label: 'Spell Swarm Survivor',
    runtimeProfile: 'arena-survivor',
    genreLabel: 'Spell swarm survivor',
    summary: 'Circle-strafe, auto-cast, clear waves, and vacuum rewards under pressure.',
    keywords: ['survivor', 'horde', 'swarm', 'spell', 'magic', 'bullet heaven', 'oleadas', 'enjambre'],
    preferredSystems: {
      combat: 'auto-shoot',
      specialMechanic: 'combo-chain',
    },
    tuning: {
      topDownPlayerSpeed: 242,
      enemySpawnInterval: 0.92,
      enemyBaseSpeed: 82,
      enemySpeedScoreFactor: 1.6,
      chaseMultiplier: 0.98,
      autoShootInterval: 0.38,
      shardCollectRadius: 22,
      shardScore: 6,
    },
  },
  {
    id: 'orbital-defense-survivor',
    label: 'Orbital Defense Survivor',
    runtimeProfile: 'arena-survivor',
    genreLabel: 'Orbital defense arena',
    summary: 'Hold the center, burst waves back, and survive cleaner defensive beats.',
    keywords: ['defense', 'defend', 'shield', 'orbital', 'guardian', 'holdout', 'defensa', 'proteger'],
    preferredSystems: {
      combat: 'pulse-burst',
      specialMechanic: 'combo-chain',
    },
    tuning: {
      topDownPlayerSpeed: 220,
      enemySpawnInterval: 1.18,
      enemyBaseSpeed: 68,
      enemySpeedScoreFactor: 0.8,
      chaseMultiplier: 0.9,
      shardCollectRadius: 18,
      shardScore: 4,
    },
  },
  {
    id: 'traffic-weave-runner',
    label: 'Traffic Weave Runner',
    runtimeProfile: 'lane-runner',
    genreLabel: 'Traffic weave runner',
    summary: 'Read lanes early, dodge blockers, and thread clean combo pickups.',
    keywords: ['runner', 'traffic', 'weave', 'dodge', 'cars', 'speed', 'carriles', 'velocidad'],
    preferredSystems: {
      specialMechanic: 'combo-chain',
    },
    tuning: {
      laneSpawnInterval: 0.55,
      laneMoveSpeedBase: 290,
      laneMoveSpeedScoreFactor: 1.4,
      laneSwitchCooldown: 0.12,
      laneHazardDamage: 18,
      lanePickupScore: 3,
      lanePattern: 'balanced',
    },
  },
  {
    id: 'courier-sprint-runner',
    label: 'Courier Sprint Runner',
    runtimeProfile: 'lane-runner',
    genreLabel: 'Courier sprint runner',
    summary: 'Cut through traffic, grab route markers, and keep a delivery streak alive.',
    keywords: ['courier', 'delivery', 'messenger', 'package', 'sprint', 'reparto', 'mensajero'],
    preferredSystems: {
      specialMechanic: 'combo-chain',
    },
    tuning: {
      laneSpawnInterval: 0.48,
      laneMoveSpeedBase: 305,
      laneMoveSpeedScoreFactor: 1.8,
      laneSwitchCooldown: 0.09,
      laneHazardDamage: 14,
      lanePickupScore: 5,
      lanePattern: 'pickup-rich',
    },
  },
  {
    id: 'hazard-rush-runner',
    label: 'Hazard Rush Runner',
    runtimeProfile: 'lane-runner',
    genreLabel: 'Hazard rush runner',
    summary: 'Short, intense dodge gauntlets with tighter timing and harsher punishments.',
    keywords: ['hazard', 'gauntlet', 'obstacle', 'rush', 'dodge', 'peligro', 'obstaculo'],
    preferredSystems: {
      specialMechanic: 'rewind-dash',
    },
    tuning: {
      laneSpawnInterval: 0.44,
      laneMoveSpeedBase: 320,
      laneMoveSpeedScoreFactor: 2.1,
      laneSwitchCooldown: 0.1,
      laneHazardDamage: 22,
      lanePickupScore: 2,
      lanePattern: 'hazard-heavy',
    },
  },
  {
    id: 'maze-relic-scavenger',
    label: 'Maze Relic Scavenger',
    runtimeProfile: 'relic-hunt',
    genreLabel: 'Maze relic scavenger',
    summary: 'Sweep a relic field, route between corners, and clean up the map efficiently.',
    keywords: ['maze', 'labyrinth', 'laberinto', 'relic', 'ruins', 'scavenger', 'explore', 'collect'],
    preferredSystems: {
      combat: 'none',
      specialMechanic: 'rewind-dash',
    },
    tuning: {
      topDownPlayerSpeed: 228,
      enemySpawnInterval: 1.6,
      enemyBaseSpeed: 88,
      chaseMultiplier: 0.74,
      relicEnemyCap: 8,
      relicCollectRadius: 26,
      relicPickupScore: 9,
      relicLayout: 'maze-ribbon',
    },
  },
  {
    id: 'pressure-relic-hunt',
    label: 'Pressure Relic Hunt',
    runtimeProfile: 'relic-hunt',
    genreLabel: 'Pressure relic hunt',
    summary: 'Collect fast while hunters collapse the safe space around you.',
    keywords: ['pressure', 'hunter', 'pursuit', 'temple', 'mine', 'persecution', 'presion', 'persecucion'],
    preferredSystems: {
      combat: 'pulse-burst',
      specialMechanic: 'rewind-dash',
    },
    tuning: {
      topDownPlayerSpeed: 242,
      enemySpawnInterval: 1.05,
      enemyBaseSpeed: 100,
      chaseMultiplier: 0.88,
      relicEnemyCap: 12,
      relicCollectRadius: 22,
      relicPickupScore: 10,
      relicLayout: 'pressure-clusters',
    },
  },
  {
    id: 'treasure-route-platformer',
    label: 'Treasure Route Platformer',
    runtimeProfile: 'platformer-expedition',
    genreLabel: 'Treasure route platformer',
    summary: 'Traverse readable ruins, pick up relics, and keep combat secondary to flow.',
    keywords: ['treasure', 'expedition', 'ruins', 'adventure', 'platformer', 'plataformas', 'explorer'],
    preferredSystems: {
      combat: 'projectile-shot',
      specialMechanic: 'rewind-dash',
    },
    tuning: {
      platformerMoveSpeed: 240,
      platformerJumpVelocity: 420,
      platformerPatrolSpeed: 90,
      platformerPatrolDamage: 12,
      platformerCourse: 'treasure-route',
    },
  },
  {
    id: 'precision-climb-platformer',
    label: 'Precision Climb Platformer',
    runtimeProfile: 'platformer-expedition',
    genreLabel: 'Precision climb platformer',
    summary: 'Short, exact jump chains with more verticality and less combat clutter.',
    keywords: ['precision', 'climb', 'tight jump', 'difficult', 'vertical', 'precision', 'escalada'],
    preferredSystems: {
      combat: 'none',
      specialMechanic: 'rewind-dash',
    },
    tuning: {
      platformerMoveSpeed: 222,
      platformerJumpVelocity: 448,
      platformerPatrolSpeed: 72,
      platformerPatrolDamage: 10,
      platformerCourse: 'precision-climb',
    },
  },
  {
    id: 'combat-gauntlet-platformer',
    label: 'Combat Gauntlet Platformer',
    runtimeProfile: 'platformer-expedition',
    genreLabel: 'Combat gauntlet platformer',
    summary: 'Push forward through patrol clusters, ranged pressure, and tighter combat spaces.',
    keywords: ['combat', 'gauntlet', 'blaster', 'shooter', 'action platformer', 'combate', 'disparos'],
    preferredSystems: {
      combat: 'projectile-shot',
      specialMechanic: 'combo-chain',
    },
    tuning: {
      platformerMoveSpeed: 250,
      platformerJumpVelocity: 412,
      platformerPatrolSpeed: 104,
      platformerPatrolDamage: 14,
      platformerCourse: 'combat-gauntlet',
    },
  },
  {
    id: 'chain-reaction-siege',
    label: 'Chain Reaction Siege',
    runtimeProfile: 'slingshot-destruction',
    genreLabel: 'Chain reaction siege puzzle',
    summary: 'Read structure weak points, conserve shots, and turn clean hits into collapses.',
    keywords: ['slingshot', 'catapult', 'siege', 'destruction', 'chain reaction', 'physics', 'tirachinas', 'derribo'],
    preferredSystems: {
      specialMechanic: 'destructible-structures',
    },
  },
] as const satisfies readonly GameTypeKitDefinition[]

export type GameTypeKitId = (typeof GAME_TYPE_KITS)[number]['id']
export type GameTypeKit = (typeof GAME_TYPE_KITS)[number]
export type { GameTypeKitTuning }

const DEFAULT_GAME_TYPE_KITS: Record<RuntimeProfile, GameTypeKitId> = {
  'arena-survivor': 'spell-swarm-survivor',
  'lane-runner': 'traffic-weave-runner',
  'relic-hunt': 'maze-relic-scavenger',
  'platformer-expedition': 'treasure-route-platformer',
  'slingshot-destruction': 'chain-reaction-siege',
}

export const GAME_TYPE_KIT_LABELS = Object.fromEntries(
  GAME_TYPE_KITS.map((kit) => [kit.id, kit.label]),
) as Record<GameTypeKitId, string>

export function listGameTypeKitsForRuntime(runtimeProfile: RuntimeProfile): GameTypeKit[] {
  return GAME_TYPE_KITS.filter((kit) => kit.runtimeProfile === runtimeProfile)
}

export function resolveGameTypeKit(
  value: string | null | undefined,
  runtimeProfile: RuntimeProfile,
): GameTypeKitId {
  const directMatch = GAME_TYPE_KITS.find(
    (kit) => kit.id === value && kit.runtimeProfile === runtimeProfile,
  )
  if (directMatch) {
    return directMatch.id
  }

  return DEFAULT_GAME_TYPE_KITS[runtimeProfile]
}

export function getGameTypeKit(id: GameTypeKitId): GameTypeKit {
  const match = GAME_TYPE_KITS.find((kit) => kit.id === id)
  if (!match) {
    return GAME_TYPE_KITS[0]
  }

  return match
}

export function inferGameTypeKit(text: string, runtimeProfile: RuntimeProfile): GameTypeKitId {
  const lowered = text.toLowerCase()
  const candidates = listGameTypeKitsForRuntime(runtimeProfile)
  let bestMatch = DEFAULT_GAME_TYPE_KITS[runtimeProfile]
  let bestScore = 0

  for (const candidate of candidates) {
    const score = candidate.keywords.reduce(
      (total, keyword) => total + (lowered.includes(keyword) ? 1 : 0),
      0,
    )

    if (score > bestScore) {
      bestMatch = candidate.id
      bestScore = score
    }
  }

  return bestMatch
}
