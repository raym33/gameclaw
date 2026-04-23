# Education And Gamification

Use this when the user asks for:

- educational games
- classroom-friendly loops
- learning apps with game feel
- training or onboarding gamification
- study tools that should feel like commercial games instead of worksheets

## Default Mapping

Start with:

- runtime profile: `relic-hunt`
- game type kit: `learning-relic-quest`
- template asset: `skill/assets/templates/education-gamification.json`

This is the safest default because it supports:

- discovery and collection
- concept checkpoints
- streaks and low-friction retries
- visible lesson content in pickups and landmarks

## When To Switch

- Use `guided-task-simulation` with `skill/assets/templates/task-based-education-sim.json` when the user wants a character completing practical tasks in a garden, kitchen, traffic route, workshop, or similar world.
- Use `courier-sprint-runner` when the ask is about rapid drills, timed review, or streak pressure.
- Use `precision-climb-platformer` when the ask is about mastery ladders, chapter climbing, or progressive skill gates.
- Stay honest if the request really needs quizzes, branching dialogue, dashboards, multiplayer classrooms, or assessment exports. Those are broader product systems, not just feel tuning.

## Rules

- Keep one concept family per slice. Do not try to teach everything at once.
- Make the learning content visible in gameplay surfaces, not only in side text.
- Prefer light pressure over harsh punishment.
- Reward recovery, streaks, and chapter completion more than failure.
- Keep the screen bright, legible, and welcoming. Educational does not mean visually cheap.
- If the user wants something “for kids” or “for classrooms”, remove frustration faster than you remove challenge.

## Product Smell

The slice is failing if it feels like:

- a worksheet with a character pasted on top
- a quiz UI pretending to be a game
- a noisy reward machine with no actual learning loop
- a punishment-heavy loop that makes repetition unpleasant

## Implementation Map

- template asset: `skill/assets/templates/education-gamification.json`
- executable default kit: `shared/gameTypeKits.ts`
- relic route layout: `src/game/gameTypeStageLayouts.ts`
- blueprint defaults and inference: `server/blueprint.ts`

## Outcome

The first slice should feel like a small sellable educational game, not like “edtech mode” bolted onto a prototype.
