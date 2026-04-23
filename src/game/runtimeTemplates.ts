import type { RuntimeProfile } from '../../shared/game'

type HudSupportMode = 'restart-fullscreen' | 'runtime-summary'

type RectanglePlayerBodyPreset = {
  shape: 'rectangle'
  spawn: { x: number; y: number }
  width: number
  height: number
}

type CirclePlayerBodyPreset = {
  shape: 'circle'
  spawn: { x: number; y: number }
  radius: number
}

type PlayerBodyPreset = RectanglePlayerBodyPreset | CirclePlayerBodyPreset

type SlingshotCameraPreset = {
  snapFocus: { x: number; y: number }
  snapZoom: number
  idleZoom: number
  dragZoom: number
  flightZoom: number
  transitionZoom: number
  clamp: { minX: number; maxX: number; minY: number; maxY: number }
  dragFocusOffset: { x: number; y: number }
  dragFocusBlend: { x: number; y: number }
  flightFocusOffset: { x: number; y: number }
  flightFocusBlend: { x: number; y: number }
}

export type RuntimeSceneTemplate = {
  timerSeconds: number
  hud: {
    panelWidth: number
    panelHeight: number
    titleFontSize: string
    statusFontSize: string
    objectiveFontSize: string
    objectiveWrapWidth: number
    supportMode: HudSupportMode
    restartText?: string
  }
  finishOverlay: {
    winStatus: string
    loseStatus: string
    winTitle: string
    loseTitle: string
  }
  player?: PlayerBodyPreset
  burst: {
    radius: number
    cooldown: number
  }
  chaseContactDamage: number
  slingshot?: {
    controlsHint: string
    camera: SlingshotCameraPreset
  }
}

export const RUNTIME_SCENE_TEMPLATES: Record<RuntimeProfile, RuntimeSceneTemplate> = {
  'arena-survivor': {
    timerSeconds: 60,
    hud: {
      panelWidth: 470,
      panelHeight: 100,
      titleFontSize: '13px',
      statusFontSize: '15px',
      objectiveFontSize: '12px',
      objectiveWrapWidth: 440,
      supportMode: 'runtime-summary',
    },
    finishOverlay: {
      winStatus: 'STATUS: WAVE CLEARED',
      loseStatus: 'STATUS: RETRY READY',
      winTitle: 'SURVIVAL COMPLETE',
      loseTitle: 'TRY AGAIN',
    },
    player: {
      shape: 'circle',
      spawn: { x: 480, y: 324 },
      radius: 14,
    },
    burst: {
      radius: 120,
      cooldown: 2,
    },
    chaseContactDamage: 8,
  },
  'lane-runner': {
    timerSeconds: 45,
    hud: {
      panelWidth: 470,
      panelHeight: 100,
      titleFontSize: '13px',
      statusFontSize: '15px',
      objectiveFontSize: '12px',
      objectiveWrapWidth: 440,
      supportMode: 'runtime-summary',
    },
    finishOverlay: {
      winStatus: 'STATUS: RUN CLEAR',
      loseStatus: 'STATUS: RETRY READY',
      winTitle: 'RUN COMPLETE',
      loseTitle: 'TRY AGAIN',
    },
    player: {
      shape: 'circle',
      spawn: { x: 480, y: 324 },
      radius: 14,
    },
    burst: {
      radius: 120,
      cooldown: 2,
    },
    chaseContactDamage: 8,
  },
  'relic-hunt': {
    timerSeconds: 0,
    hud: {
      panelWidth: 470,
      panelHeight: 100,
      titleFontSize: '13px',
      statusFontSize: '15px',
      objectiveFontSize: '12px',
      objectiveWrapWidth: 440,
      supportMode: 'runtime-summary',
    },
    finishOverlay: {
      winStatus: 'STATUS: OBJECTIVE COMPLETE',
      loseStatus: 'STATUS: RETRY READY',
      winTitle: 'RELICS SECURED',
      loseTitle: 'TRY AGAIN',
    },
    player: {
      shape: 'circle',
      spawn: { x: 480, y: 324 },
      radius: 14,
    },
    burst: {
      radius: 120,
      cooldown: 1.5,
    },
    chaseContactDamage: 10,
  },
  'platformer-expedition': {
    timerSeconds: 55,
    hud: {
      panelWidth: 470,
      panelHeight: 100,
      titleFontSize: '13px',
      statusFontSize: '15px',
      objectiveFontSize: '12px',
      objectiveWrapWidth: 440,
      supportMode: 'runtime-summary',
    },
    finishOverlay: {
      winStatus: 'STATUS: OBJECTIVE COMPLETE',
      loseStatus: 'STATUS: RETRY READY',
      winTitle: 'LEVEL COMPLETE',
      loseTitle: 'TRY AGAIN',
    },
    player: {
      shape: 'rectangle',
      spawn: { x: 120, y: 420 },
      width: 26,
      height: 32,
    },
    burst: {
      radius: 90,
      cooldown: 2,
    },
    chaseContactDamage: 8,
  },
  'slingshot-destruction': {
    timerSeconds: 0,
    hud: {
      panelWidth: 398,
      panelHeight: 100,
      titleFontSize: '13px',
      statusFontSize: '13px',
      objectiveFontSize: '10px',
      objectiveWrapWidth: 346,
      supportMode: 'restart-fullscreen',
      restartText: 'R reinicia la run · F alterna pantalla completa',
    },
    finishOverlay: {
      winStatus: 'STATUS: CHAMBER CLEAR',
      loseStatus: 'STATUS: RETRY READY',
      winTitle: 'CHAMBER COLLAPSED',
      loseTitle: 'TRY AGAIN',
    },
    burst: {
      radius: 120,
      cooldown: 2,
    },
    chaseContactDamage: 8,
    slingshot: {
      controlsHint: 'Arrastra hacia atrás, apunta con la trayectoria y suelta. WASD/flechas ajustan tensión, ESPACIO dispara.',
      camera: {
        snapFocus: { x: 700, y: 286 },
        snapZoom: 1.09,
        idleZoom: 1.045,
        dragZoom: 1.075,
        flightZoom: 1.11,
        transitionZoom: 1.08,
        clamp: { minX: 480, maxX: 780, minY: 220, maxY: 356 },
        dragFocusOffset: { x: 160, y: 0 },
        dragFocusBlend: { x: 0.16, y: 0.12 },
        flightFocusOffset: { x: 80, y: -10 },
        flightFocusBlend: { x: 0.72, y: 0.44 },
      },
    },
  },
}

export function getRuntimeSceneTemplate(profile: RuntimeProfile): RuntimeSceneTemplate {
  return RUNTIME_SCENE_TEMPLATES[profile]
}
