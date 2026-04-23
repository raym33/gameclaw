import type { GameTypeKitId } from '../../shared/gameTypeKits'

export type StagePoint = {
  x: number
  y: number
}

export type PlatformSpec = {
  x: number
  y: number
  width: number
  height: number
}

export type PatrolSpec = {
  x: number
  y: number
  minX: number
  maxX: number
}

export type PlatformerCourse = {
  platforms: PlatformSpec[]
  relics: StagePoint[]
  patrollers: PatrolSpec[]
}

export function getRelicHuntLayout(
  gameTypeKit: GameTypeKitId,
  gameWidth: number,
  gameHeight: number,
): StagePoint[] {
  switch (gameTypeKit) {
    case 'guided-task-simulation':
      return [
        { x: 142, y: 126 },
        { x: 284, y: 126 },
        { x: 436, y: 146 },
        { x: 612, y: 124 },
        { x: 786, y: 142 },
        { x: 796, y: 282 },
        { x: 662, y: 350 },
        { x: 494, y: 372 },
        { x: 320, y: 336 },
        { x: 178, y: 266 },
      ]
    case 'learning-relic-quest':
      return [
        { x: 150, y: 122 },
        { x: 270, y: 164 },
        { x: 396, y: 128 },
        { x: 520, y: 174 },
        { x: 648, y: 138 },
        { x: 778, y: 182 },
        { x: 814, y: 292 },
        { x: 694, y: 338 },
        { x: 560, y: 302 },
        { x: 434, y: 350 },
        { x: 286, y: 318 },
        { x: 164, y: 382 },
      ]
    case 'maze-relic-scavenger':
      return [
        { x: 148, y: 128 },
        { x: gameWidth * 0.34, y: 152 },
        { x: gameWidth * 0.52, y: 112 },
        { x: gameWidth * 0.72, y: 150 },
        { x: gameWidth - 148, y: 132 },
        { x: 190, y: gameHeight * 0.48 },
        { x: gameWidth * 0.5, y: gameHeight * 0.48 },
        { x: gameWidth - 196, y: gameHeight * 0.5 },
        { x: 156, y: gameHeight - 108 },
        { x: gameWidth * 0.5, y: gameHeight - 132 },
        { x: gameWidth - 156, y: gameHeight - 112 },
      ]
    case 'pressure-relic-hunt':
      return [
        { x: 180, y: 148 },
        { x: 240, y: 208 },
        { x: 316, y: 154 },
        { x: gameWidth * 0.5, y: 128 },
        { x: gameWidth * 0.5, y: gameHeight * 0.5 },
        { x: gameWidth * 0.68, y: 154 },
        { x: gameWidth - 240, y: 214 },
        { x: gameWidth - 180, y: 150 },
        { x: 214, y: gameHeight - 136 },
        { x: gameWidth * 0.5, y: gameHeight - 118 },
        { x: gameWidth - 214, y: gameHeight - 142 },
      ]
    default:
      return [
        { x: gameWidth * 0.5, y: 124 },
        { x: gameWidth * 0.28, y: 178 },
        { x: gameWidth * 0.72, y: 178 },
        { x: 156, y: gameHeight * 0.46 },
        { x: gameWidth * 0.5, y: gameHeight * 0.48 },
        { x: gameWidth - 156, y: gameHeight * 0.46 },
        { x: gameWidth * 0.34, y: gameHeight - 124 },
        { x: gameWidth * 0.66, y: gameHeight - 124 },
      ]
  }
}

export function getPlatformerCourse(
  gameTypeKit: GameTypeKitId,
  gameHeight: number,
): PlatformerCourse {
  switch (gameTypeKit) {
    case 'precision-climb-platformer':
      return {
        platforms: [
          { x: 480, y: gameHeight - 36, width: 960, height: 72 },
          { x: 150, y: 408, width: 120, height: 16 },
          { x: 286, y: 354, width: 108, height: 16 },
          { x: 418, y: 302, width: 100, height: 16 },
          { x: 560, y: 252, width: 100, height: 16 },
          { x: 690, y: 204, width: 92, height: 16 },
          { x: 804, y: 160, width: 84, height: 16 },
        ],
        relics: [
          { x: 150, y: 378 },
          { x: 286, y: 324 },
          { x: 418, y: 272 },
          { x: 560, y: 222 },
          { x: 690, y: 174 },
          { x: 804, y: 130 },
        ],
        patrollers: [
          { x: 520, y: gameHeight - 94, minX: 360, maxX: 620 },
          { x: 672, y: 220, minX: 614, maxX: 758 },
        ],
      }
    case 'combat-gauntlet-platformer':
      return {
        platforms: [
          { x: 480, y: gameHeight - 36, width: 960, height: 72 },
          { x: 184, y: 396, width: 166, height: 18 },
          { x: 380, y: 344, width: 144, height: 18 },
          { x: 566, y: 296, width: 152, height: 18 },
          { x: 748, y: 252, width: 166, height: 18 },
          { x: 850, y: 184, width: 112, height: 18 },
        ],
        relics: [
          { x: 184, y: 366 },
          { x: 380, y: 314 },
          { x: 566, y: 266 },
          { x: 748, y: 222 },
          { x: 850, y: 154 },
        ],
        patrollers: [
          { x: 292, y: gameHeight - 94, minX: 168, maxX: 412 },
          { x: 514, y: gameHeight - 94, minX: 420, maxX: 650 },
          { x: 714, y: 218, minX: 642, maxX: 830 },
          { x: 850, y: 150, minX: 792, maxX: 900 },
        ],
      }
    default:
      return {
        platforms: [
          { x: 480, y: gameHeight - 36, width: 960, height: 72 },
          { x: 190, y: 380, width: 180, height: 18 },
          { x: 430, y: 320, width: 160, height: 18 },
          { x: 650, y: 270, width: 180, height: 18 },
          { x: 840, y: 210, width: 160, height: 18 },
        ],
        relics: [
          { x: 190, y: 350 },
          { x: 430, y: 290 },
          { x: 650, y: 240 },
          { x: 840, y: 180 },
        ],
        patrollers: [
          { x: 310, y: gameHeight - 94, minX: 220, maxX: 440 },
          { x: 620, y: gameHeight - 94, minX: 520, maxX: 780 },
          { x: 700, y: 236, minX: 580, maxX: 860 },
        ],
      }
  }
}
