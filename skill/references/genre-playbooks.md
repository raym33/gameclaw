# Genre Playbooks

Use this when the user idea is clear but the execution path is still fuzzy. Pick the nearest playbook instead of inventing a bespoke process too early.

## Character Action / Platformer

Use when the fantasy depends on readable character motion.

Preset kit: `skill/assets/presets/platformer-expedition.json`
Common game type kits: `treasure-route-platformer`, `precision-climb-platformer`, `combat-gauntlet-platformer`

- Core loop: move, jump/dash/attack, avoid hazards, reach goal.
- Must feel good first: acceleration, jump timing, landing recovery, enemy readability.
- Minimum asset set: idle, move, jump/air, action, recovery, landing cue, enemy, hazard, pickup, environment kit.
- Common failure: adding level breadth before the character is fun to control.

For platformer-first asks, load `skill/assets/templates/platformer-production.json`.

## Top-Down Action / Arena

Use when the game is about spacing, pressure, and cadence.

Preset kit: `skill/assets/presets/arena-survivor.json`
Common game type kits: `spell-swarm-survivor`, `orbital-defense-survivor`

- Core loop: move, aim or auto-aim, attack, survive waves, collect.
- Must feel good first: diagonal movement, attack cadence, hit response, enemy approach timing.
- Minimum asset set: player states, enemy families, attack or projectile FX, pickups, arena dressing, readable HUD.
- Common failure: many weapons and enemies with weak feedback.

## Runner / Lane / One-Touch

Use when the game should read instantly and play in short sessions.

Preset kit: `skill/assets/presets/lane-runner.json`
Common game type kits: `traffic-weave-runner`, `courier-sprint-runner`, `hazard-rush-runner`

- Core loop: dodge, swap, jump, collect, chain.
- Must feel good first: input commitment, obstacle readability, pickup feedback, camera composition.
- Minimum asset set: runner states, obstacle families, pickup feedback, lane markers or environment rhythm props, clean HUD.
- Common failure: technically working movement with no juice or no visual rhythm.

## Slingshot / Projectile Destruction

Use when the loop is pull, aim, release, collapse, and repeat.

Preset kit: `skill/assets/presets/slingshot-destruction.json`
Common game type kit: `chain-reaction-siege`

- Core loop: drag, preview, launch, chain reactions, conserve shots.
- Must feel good first: believable grab radius, matched trajectory preview, recoil, material readability.
- Minimum asset set: character pull/release states, launcher, projectile, targets, breakable material families, impact and debris feedback, chamber backdrop.
- Common failure: pretty background with weak gameplay layer or mismatched launch math.

## Puzzle / Physics Casual

Use when clarity matters more than raw spectacle.

Preset kit: `skill/assets/presets/relic-hunt.json`
Common game type kits: `learning-relic-quest`, `maze-relic-scavenger`, `pressure-relic-hunt`

- Core loop: inspect, act, resolve, reset, improve.
- Must feel good first: state clarity, reset speed, legible object interactions, low input friction.
- Minimum asset set: interactable objects, board or scene surfaces, resolution feedback, hint surfaces, clean state icons if needed.
- Common failure: overcomplicated mechanics with no visual hierarchy.

For educational or gamified requests, `learning-relic-quest` is usually the first stable fit before inventing a bespoke edtech runtime.

## Hybrid Or Unclear Ideas

If the request mixes several genres:

- choose the dominant moment-to-moment loop first
- build only one strong core minute of play
- borrow only the minimum secondary systems needed to make that loop feel complete

Do not hybridize so early that none of the controls or visuals get tuned properly.
