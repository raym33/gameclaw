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

export function buildGuardiansFieldDemoResult(): GenerationResult {
  const blueprint = normalizeBlueprint(
    {
      title: 'Gato y Perro, Guardianes del Campo Magico',
      tagline: 'Heal a magical farm with nine eco inventions, happy animals, and a bright child-friendly adventure.',
      gameTypeKit: 'guided-task-simulation',
      supportLevel: 'native',
      genre: 'Educational eco farm adventure',
      playerFantasy:
        'Guide a brave orange cat and a joyful brown dog across a magical countryside, placing green solutions that heal the land in real time.',
      worldSummary:
        'A once-happy field is drying out. Energy hills, a crystal river, orchards, corrals, and flower meadows wait for the player to restore them with gentle eco stations.',
      visualStyle:
        'Storybook cartoon, top-down family game, lush painterly farm details, soft sunlight, colorful flowers, and expressive animal animation.',
      audioMood:
        'Cheerful rural ambience, playful chimes, gentle wind, clean water sparkle, and short celebratory cues for every restoration task.',
      noveltyHook:
        'Each ecological solution changes the farm instantly: grass returns, the river clears, flowers bloom, and nearby animals celebrate alongside Gato and Perro.',
      approximationStrategy:
        'This curated demo uses a handcrafted multi-scene educational runtime with a custom farm map, companion follow behavior, station interactions, and visible world restoration.',
      controlNotes: [
        'Move with WASD or arrow keys, or click on the ground to guide the active hero.',
        'Press TAB to swap between Gato and Perro; the other friend follows automatically.',
        'Use SPACE or click near a glowing station to learn and place an ecological solution.',
      ],
      coreLoop: [
        'Explore the farm and discover a glowing eco station.',
        'Read a child-friendly explanation and place the solution with one big confirmation.',
        'Watch the map transform, animals celebrate, and the field become greener.',
      ],
      mechanicHighlights: [
        'Title, tutorial, main farm, and celebration ending scenes tailored for ages 3-8.',
        'Nine ecological tasks spread across energy, water, agriculture, livestock, and nature care zones.',
        'Cat and dog companion behaviors, animated NPC animals, and a farm that visually upgrades in three restoration stages.',
      ],
      implementationNotes: [
        'Use a dedicated curated Phaser runtime instead of the generic relic-hunt slice so the brief can support title, tutorial, guided tasks, and a richer map.',
        'Keep interactions frictionless: soft collisions, readable popups, generous activation range, and one-tap placement.',
      ],
      productionBacklog: [
        'Swap procedural audio stingers for voiced child narration and localized VO packs.',
        'Replace generated runtime textures with uploaded final production sprite sheets when available.',
        'Add save-progress stars, printable eco badges, and more reactive farm animals.',
      ],
      levelMoments: [
        'Meet the butterfly guide and learn how to heal the field.',
        'Light up the farm roof with solar panels and see the energy hill glow.',
        'Clean the river so fish sparkle and the lower-right zone becomes blue again.',
        'Finish the ninth eco task and watch the whole farm celebrate under a rainbow.',
      ],
      assetPrompts: [
        'Orange eco cat hero top-down children game sprite sheet with scarf and backpack',
        'Brown dog companion top-down children game sprite sheet with blue collar and leaf charm',
        'Magical eco farm stations: solar panels, wind turbines, irrigation, purifier, crops, livestock, and friendly insects',
      ],
      imageInsights: [
        'This demo is curated for educational eco-farm play rather than a combat loop.',
        'The runtime should feel like a premium app-store kids game slice: readable, gentle, bright, and reactive.',
      ],
      winCondition: 'Place all nine ecological solutions and turn the magical field bright green again.',
      loseCondition: 'There is no harsh fail state; if the player pauses, the butterfly simply invites them back to the next task.',
      palette: {
        bg: '#7fd2ff',
        surface: '#a8774d',
        accent: '#ffc94d',
        accentAlt: '#57d6a1',
        danger: '#ff8d6d',
        text: '#16324a',
      },
      systems: {
        camera: 'top-down',
        movement: 'free-8dir',
        physics: 'scripted-arcade',
        combat: 'none',
        objective: 'collect',
        worldLayout: 'relic-field',
        specialMechanic: 'combo-chain',
      },
      physics: {
        gravity: 0.8,
        bounce: 0.12,
        friction: 0.08,
        drag: 0.02,
        projectilePower: 4,
        structuralIntegrity: 3,
      },
      hero: {
        name: 'Gato',
        role: 'eco guardian',
        description: 'A curious orange kitten with a green scarf and a backpack full of bright ideas.',
        abilities: ['Eco spark', 'Happy jump', 'Kind courage'],
      },
      enemies: [
        {
          name: 'Perro',
          role: 'companion guardian',
          description: 'A loyal brown puppy who follows, points at clues, and celebrates every green victory.',
          abilities: ['Fast tail wag', 'Helpful bark', 'Friendly follow'],
        },
      ],
    },
    {
      notes: 'Curated Gato y Perro magical field educational demo',
      fileNames: ['guardians-field-demo'],
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
