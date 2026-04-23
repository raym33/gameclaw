# Fixed-Shooter Arcade

Use this when the user asks for:

- marcianitos
- Space Invaders-style games
- retro alien shooters
- fixed-screen arcade shooters
- wave-based ship-vs-formation games

## Current Repo Status

Gameclaw does not yet have a native fixed-shooter runtime family.

That means:

- a true marcianitos slice should usually push toward a new runtime
- the skill should not silently collapse it into a generic top-down shooter and pretend the loop is authentic
- approximation is acceptable only when the user mainly wants the tone, pacing, or retro shooter presentation

## Authentic Requirements

If the request is genuinely fixed-shooter-first, the slice usually needs:

- horizontal-only or near-horizontal player movement
- descending enemy formations
- formation turn or collapse rules
- player fire cadence and enemy volley rhythm
- shields or bunker logic when requested
- score, lives, wave count, and danger escalation

If those do not exist, say so and scope the slice honestly.

## What To Prioritize

- immediate shooting
- clear projectile lanes
- readable enemy silhouettes in formation
- tension ramp as the wave gets closer
- instant retry and score-chase flow

## Product Smell

The slice is failing if it feels like:

- a generic arena shooter wearing a retro skin
- mushy horizontal control
- projectiles that disappear into noise
- a fake alien wave with no real formation rhythm

## Implementation Map

- template asset: `skill/assets/templates/fixed-shooter-arcade.json`
- runtime gating and honesty: `skill/SKILL.md`
- nearest safe approximation: `arena-survivor` / `orbital-defense-survivor`

## Outcome

Either build a real fixed-shooter runtime path, or label the slice clearly as arcade-shooter-inspired. Do not blur that line.
