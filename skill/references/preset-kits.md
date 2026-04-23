# Preset Kits

Use this when Codex needs concrete starting defaults instead of reinventing camera, feel, HUD, and asset coverage from scratch.

If the request is educational, about gamification, or clearly platformer-first, load the matching template alongside the chosen preset.

## What These Presets Are

Each preset kit in `skill/assets/presets/` gives a reusable starting point for one runtime profile:

- `arena-survivor.json`
- `lane-runner.json`
- `relic-hunt.json`
- `platformer-expedition.json`
- `slingshot-destruction.json`

They are not final values. They are good defaults for:

- systems alignment
- physics tuning ranges
- camera behavior
- HUD priorities
- asset shot lists
- playtest focus

The runtime layer now also has a matching preset registry in `src/game/runtimeTemplates.ts`, reusable scene scaffold helpers in `src/game/runtimeSceneScaffold.ts`, and executable game type kits in `shared/gameTypeKits.ts` plus `src/game/gameTypeStageLayouts.ts` for timers, HUD defaults, player body presets, finish overlays, support text, stage layouts, and gameplay tuning.

## How To Use Them

1. Pick the preset that matches the chosen runtime profile.
2. Pick the nearest game type kit inside that runtime profile.
3. Reuse its systems and feel defaults as the first stable pass.
4. Reuse its asset shot list to avoid under-generating the gameplay layer.
5. Tune from there using the user references and browser playtests.

## Fast Access

List presets:

```bash
./skill/scripts/show-preset.sh
```

Show one preset:

```bash
./skill/scripts/show-preset.sh slingshot-destruction
```

List templates:

```bash
./skill/scripts/show-template.sh
```

Show the education template:

```bash
./skill/scripts/show-template.sh education-gamification
```

Show the platformer template:

```bash
./skill/scripts/show-template.sh platformer-production
```

## Rule

Do not cargo-cult a preset. Use it to start faster, then tune until the slice stops feeling generic.
