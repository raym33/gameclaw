# Runtime Profiles

Gameclaw composes systems into stable runtime profiles. Prefer adapting one of these before adding a new runtime.

The goal is not to cover every genre immediately. The goal is to map a request to the fastest stable runtime that can still deliver a premium-feeling slice.

Inside each runtime family, Gameclaw can now choose a narrower executable game type kit. Use runtime profiles for the big execution decision and game type kits for the more specific product shape.

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

## Quality Targets By Profile

- `arena-survivor`: readable kiting, clean enemy pressure, satisfying hit feedback.
- `lane-runner`: fast lane commitment, readable hazards, crisp pickups.
- `relic-hunt`: smooth exploration, clear collection loop, low-friction combat pressure.
- `platformer-expedition`: tuned jump arc, good landings, readable patrol timing.
- `slingshot-destruction`: believable drag-release, matching trajectory preview, strong material feedback, authored destruction puzzles.

## Implementation Map

- Schema/types/labels: `shared/game.ts`
- Game type kit catalog: `shared/gameTypeKits.ts`
- Normalization/fallbacks: `server/blueprint.ts`
- AI prompt and backend parsing: `server/openai.ts`
- Runtime execution: `src/game/createGame.ts`
- Runtime stage layouts: `src/game/gameTypeStageLayouts.ts`
- Curated Astral Orchard data: `server/demo.ts`

## Adding A Runtime

Only add a new runtime when an existing one cannot reach the requested quality bar without becoming misleading.

1. Add types and labels in `shared/game.ts`.
2. Teach `deriveRuntimeProfile()` when to select it.
3. Normalize/fallback values in `server/blueprint.ts`.
4. Add execution path in `src/game/createGame.ts`.
5. Add representative fallback/demo data if useful.
6. Validate with lint, build, and a browser smoke test.
