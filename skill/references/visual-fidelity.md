# Visual Fidelity

Use this when the user cares about the game resembling uploaded sketches, sprites, or the curated Astral Orchard style.

## Rules

- Use original sprites or curated raster assets before procedural shapes.
- Keep Matter bodies invisible or subtle; attach sprites to bodies.
- Do not use procedural character rigs unless explicitly requested.
- If a sprite has a baked background, crop or key it out instead of displaying boxes.
- Verify in browser; build success is not enough for visual work.

## Astral Orchard Assets

- Original sprite sheet: `src/assets/astral-orchard/original-sprite-sheet.png`
- Background concept: `src/assets/astral-orchard/background-concept.png`
- Projectile: `src/assets/astral-orchard/star-seed.png`
- Target/core: `src/assets/astral-orchard/orbit-core.png`
- Materials: wood, glass, brass PNGs in `src/assets/astral-orchard/`

## Slingshot Visual Requirements

- Character should use sprite poses, not a procedural rig.
- Elastic band should visually stretch between fork and projectile.
- Trajectory dots should use the same launch vector as the real shot.
- On release, show recoil/snapback briefly.
- Keep the projectile physics body and visible projectile synchronized.

## Useful Runtime Areas

- Texture loading and cutouts: `src/game/createGame.ts`
- Hero pose crop definitions: `ASTRAL_HERO_SOURCE_RECTS`
- Hero pose sizing: `ASTRAL_HERO_DISPLAY`
- Elastic band drawing: `drawElasticBand`
- Trajectory prediction: `drawPredictedSlingshotTrajectory`
