# Game Type Kits

Use this when the runtime family is already chosen but the slice still needs a more specific commercial shape.

Runtime profiles are broad execution families. Game type kits are narrower playable product directions inside those families.

## Why They Exist

Without game type kits, Codex tends to pick the right runtime and still produce the same slice repeatedly with different art.

With game type kits, Codex should also change:

- gameplay tuning
- combat fallback
- route or stage composition
- collectible placement
- pacing and failure profile
- blueprint defaults and presentation language

## Current Kits

### Arena Survivor

- `spell-swarm-survivor`: fast kiting, auto-fire cadence, denser pressure.
- `orbital-defense-survivor`: cleaner defensive pulse rhythm, slower wave holdout.

### Lane Runner

- `traffic-weave-runner`: balanced dodge-and-pickup runner.
- `courier-sprint-runner`: pickup-rich route runner with stronger streak play.
- `hazard-rush-runner`: harsher obstacle gauntlet with tighter punishment.

### Relic Hunt

- `guided-task-simulation`: educational task loop with a central character, stations, and short procedures.
- `learning-relic-quest`: educational discovery loop with mastery streaks and soft pressure.
- `maze-relic-scavenger`: wider map sweep and cleaner collection routing.
- `pressure-relic-hunt`: stronger pursuit pressure and riskier last pickups.

### Platformer Expedition

- `treasure-route-platformer`: readable adventure route with collectibles.
- `precision-climb-platformer`: exact jumps, more vertical climb, less combat clutter.
- `combat-gauntlet-platformer`: more patrol pressure and forward combat.

### Slingshot Destruction

- `chain-reaction-siege`: weak-point reading, chain reactions, shot conservation.

## Implementation Map

- Catalog and inference: `shared/gameTypeKits.ts`
- Blueprint normalization: `server/blueprint.ts`
- Prompt steering: `server/openai.ts`
- Runtime stage composition: `src/game/gameTypeStageLayouts.ts`
- Runtime tuning application: `src/game/createGame.ts`

## Rule

Always choose the nearest game type kit after choosing the runtime profile.

If none fits, use the nearest kit and say what still remains approximate instead of inventing a fake new executable genre.
