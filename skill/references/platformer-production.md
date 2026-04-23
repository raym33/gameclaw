# Platformer Production

Use this when the user asks for:

- platformers
- side-scrollers
- metroidvania-style slices
- character-action platforming
- games where jump feel and route readability matter more than abstract systems

## Default Mapping

Start with:

- runtime profile: `platformer-expedition`
- template asset: `skill/assets/templates/platformer-production.json`

Then choose the nearest game type kit:

- `treasure-route-platformer` for broad adventure flow
- `precision-climb-platformer` for exact jumps and recovery
- `combat-gauntlet-platformer` for action-platformer pressure

## Rules

- Character feel is the product. If the jump is weak, the slice is weak.
- Get run, jump, fall, land, and recovery readable before adding breadth.
- Use more sprites if motion pops between incompatible poses.
- Show the next landing zone early enough for the player to trust the camera.
- Keep the route short and authored. One memorable minute is better than a long mushy stage.

## Product Smell

The slice is failing if it feels like:

- a generic rectangle hopping across debug platforms
- a platformer with nice art but bad jumps
- a cluttered screen where hazards and landings merge together
- a “metroidvania” claim with no strong movement or route identity

## Implementation Map

- template asset: `skill/assets/templates/platformer-production.json`
- executable kits: `shared/gameTypeKits.ts`
- platformer route layouts: `src/game/gameTypeStageLayouts.ts`
- blueprint defaults and inference: `server/blueprint.ts`

## Outcome

The first slice should feel like a small professional platformer chapter, not like placeholder blocks waiting for a future game.
