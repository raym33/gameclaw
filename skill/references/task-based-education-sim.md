# Task-Based Education Sim

Use this when the user asks for:

- a garden or orchard learning game
- traffic-rule training with a character in the world
- cooking or ingredient-order learning
- practical classroom games where one character performs tasks
- short procedural simulations for training or onboarding

## Default Mapping

Start with:

- runtime profile: `relic-hunt`
- game type kit: `guided-task-simulation`
- template asset: `skill/assets/templates/task-based-education-sim.json`

This is the best current fit when the slice depends on:

- a central character
- world stations or props
- a visible task sequence
- light pressure rather than combat

## Good Fits

- huerto, granja, or orchard care
- traffic signs, crossings, or road-safety drills
- cooking steps, ingredient order, or kitchen stations
- workshop, assembly, or safety routines

## Rules

- One short procedure per slice.
- Make the next station obvious from the world itself.
- Keep failure soft and progress visible.
- Favor clean route composition over simulation breadth.
- The central character must feel smooth enough that repetition stays pleasant.

## Product Smell

The slice is failing if it feels like:

- random pickups with educational text pasted on top
- a task list disconnected from the world
- a mascot wandering around without a meaningful procedure
- a punishing sim that is not enjoyable to replay

## Implementation Map

- template asset: `skill/assets/templates/task-based-education-sim.json`
- executable default kit: `shared/gameTypeKits.ts`
- task-route layout: `src/game/gameTypeStageLayouts.ts`
- blueprint defaults and inference: `server/blueprint.ts`

## Outcome

The first slice should feel like a small professional educational sim with a playable task routine, not like loose gamification wrapped around chores.
