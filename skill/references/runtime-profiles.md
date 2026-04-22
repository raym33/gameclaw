# Runtime Profiles

Gameclaw composes systems into stable runtime profiles. Prefer adapting one of these before adding a new runtime.

## Profiles

- `arena-survivor`: top-down movement, enemy pressure, projectiles or pulse combat.
- `lane-runner`: lane switching, hazards, pickups, finish-run objective.
- `relic-hunt`: top-down exploration, collection, light enemy pressure.
- `platformer-expedition`: side-view platforms, jumping, patrols, collectibles.
- `slingshot-destruction`: side-view projectile launch, Matter rigid bodies, destructible structures.

## System Stack

Defined in `shared/game.ts`:

- camera
- movement
- physics
- combat
- objective
- worldLayout
- specialMechanic

`deriveRuntimeProfile()` maps systems to the executable runtime. Update this deliberately when adding system combinations.

## Support Levels

- `native`: the request fits an existing runtime.
- `hybrid`: one unusual mechanic or visual twist on a stable runtime.
- `approximate`: concept exceeds current engine scope; preserve the strongest hook in a playable slice.

## Implementation Map

- Schema/types/labels: `shared/game.ts`
- Normalization/fallbacks: `server/blueprint.ts`
- AI prompt and backend parsing: `server/openai.ts`
- Runtime execution: `src/game/createGame.ts`
- Curated Astral Orchard data: `server/demo.ts`

## Adding A Runtime

1. Add types and labels in `shared/game.ts`.
2. Teach `deriveRuntimeProfile()` when to select it.
3. Normalize/fallback values in `server/blueprint.ts`.
4. Add execution path in `src/game/createGame.ts`.
5. Add representative fallback/demo data if useful.
6. Validate with lint, build, and a browser smoke test.
