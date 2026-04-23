import { normalizeBlueprint } from './blueprint'
import type { GenerationResult } from '../shared/game'

export function buildAstralOrchardDemoResult(): GenerationResult {
  const blueprint = normalizeBlueprint(
    {
      title: 'Astral Orchard',
      tagline: 'Collapse moonlit observatories with star-seeds and clean chain reactions.',
      gameTypeKit: 'chain-reaction-siege',
      supportLevel: 'native',
      genre: 'Celestial slingshot destruction',
      playerFantasy:
        'You are the night gardener of a floating orchard, breaking open brass-and-glass observatories to free trapped orbit cores.',
      worldSummary:
        'A moonlit orchard hangs over the clouds. Brass bridges, lantern fruit, and glass observatories float between islands waiting for a precise shot.',
      visualStyle:
        'Paper lantern warmth, deep teal night skies, brass hardware, frosted glass, and cozy magical silhouettes.',
      audioMood: 'Soft nocturnal ambience, crystalline shatters, brass resonance, woody breaks, and bright orbit-core releases.',
      noveltyHook:
        'Every chamber is a tiny destruction puzzle: preserve shots, collapse support legs, and let the architecture fail in beautiful ways.',
      approximationStrategy:
        'This demo is a polished slingshot slice with authored chambers, stronger pacing, and readable physics instead of a generic one-room sandbox.',
      controlNotes: [
        'Drag the loaded seed with the mouse or touch',
        'Release to sling it through the chamber',
        'Clear each observatory before your reserve of shots runs dry',
      ],
      coreLoop: [
        'Read the structure',
        'Spend a precise shot',
        'Trigger a chain reaction and move to the next chamber',
      ],
      mechanicHighlights: [
        'Five authored destruction chambers with run-level shot preservation',
        'Wood, glass, and brass supports with distinct resistance, feel, and procedural audio',
        'Readable tension, matching trajectory preview, cinematic camera, projectile trail, collision VFX, and restart/fullscreen shortcuts',
      ],
      implementationNotes: [
        'Use Matter bodies for projectiles, targets, and support pieces.',
        'Damage targets and fragile supports from real collision speed instead of only checking out-of-bounds collapse.',
      ],
      productionBacklog: [
        'Add chamber medals, score breakdowns, and a world map.',
        'Add more environmental props and parallax layers tied to each chamber theme.',
        'Pipe real uploaded assets into the runtime visuals instead of abstract shapes.',
      ],
      levelMoments: [
        'Break the first canopy cleanly',
        'Fold the moonglass arcade inward from the crown',
        'Twist the observatory bridge off its support legs',
        'Drop the bellspire carriage from its hinge',
        'Trigger the final brass crown collapse',
      ],
      assetPrompts: [
        'Astral Orchard hero portrait in lantern-lit papercraft fantasy style',
        'Astral Orchard observatory kit with brass, frosted glass, and orchard lanterns',
        'Astral Orchard impact particles, orbit cores, and star-seed projectile concepts',
      ],
      imageInsights: [
        'This demo is curated from the Astral Orchard reference pack.',
        'It focuses on slingshot physics, chamber readability, and a dreamy night-orchard tone.',
      ],
      winCondition: 'Free every orbit core across the five observatory chambers.',
      loseCondition: 'Run out of seeds before the orchard is fully unlocked.',
      palette: {
        bg: '#101722',
        surface: '#263041',
        accent: '#f3bf63',
        accentAlt: '#82d8d0',
        danger: '#ff7f66',
        text: '#f7f1e8',
      },
      systems: {
        camera: 'side-view',
        movement: 'slingshot',
        physics: 'matter-rigid-body',
        combat: 'none',
        objective: 'destroy-targets',
        worldLayout: 'fortress-stack',
        specialMechanic: 'destructible-structures',
      },
      physics: {
        gravity: 1.12,
        bounce: 0.38,
        friction: 0.1,
        drag: 0.014,
        projectilePower: 9.8,
        structuralIntegrity: 6.6,
      },
      hero: {
        name: 'Luma Vale',
        role: 'celestial gardener',
        description: 'A patient slingshot keeper who prunes observatories instead of trees.',
        abilities: ['Seed sling', 'Chain-reaction reading', 'Last-shot focus'],
      },
      enemies: [
        {
          name: 'Orbit Core',
          role: 'trapped target',
          description: 'A glowing core locked inside the observatory structure.',
          abilities: ['Brace', 'Shatter trigger'],
        },
      ],
    },
    {
      notes: 'Curated Astral Orchard slingshot demo',
      fileNames: ['astral-orchard-demo'],
      sourceImageCount: 0,
    },
  )

  return {
    blueprint,
    generationSource: 'fallback',
    providerKind: 'fallback',
    providerLabel: 'Curated Demo',
    warnings: [],
    createdAt: new Date().toISOString(),
  }
}
