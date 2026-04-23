# Visual Fidelity

Use this when the user cares about the game resembling uploaded sketches, sprites, or the curated Astral Orchard style.

## Rules

- Use original sprites or curated raster assets before procedural shapes.
- If final sprites are missing, generate or edit raster assets and move the selected finals into the repo instead of leaving the game on primitives.
- Keep Matter bodies invisible or subtle; attach sprites to bodies.
- Do not use procedural character rigs unless explicitly requested.
- If a sprite has a baked background, crop or key it out instead of displaying boxes.
- Verify in browser; build success is not enough for visual work.

## Production Rules

- Character pose, action origin, and collision body should line up.
- Use clear idle, locomotion, action, and recovery states when the character is frequently on screen.
- Keep sprite scale consistent across all gameplay objects.
- Prefer one clear art direction per slice; avoid mixing incompatible visual styles by accident.

## Pixel-Perfect Rules

- Use nearest-neighbor filtering for pixel art.
- Avoid subpixel drift on characters and UI.
- Keep sprite dimensions and display scale consistent.
- Use integer-friendly sizes and camera framing when possible.

## Astral Orchard Assets

- Original sprite sheet: `src/assets/astral-orchard/original-sprite-sheet.png`
- Launcher composition: `src/assets/astral-orchard/hero-launcher.png`
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
- Keep grab radius and drag envelope believable so mouse aim feels intentional.

## Useful Runtime Areas

- Texture loading and cutouts: `src/game/createGame.ts`
- Hero pose crop definitions: `ASTRAL_HERO_SOURCE_RECTS`
- Hero pose sizing: `ASTRAL_HERO_DISPLAY`
- Elastic band drawing: `drawElasticBand`
- Trajectory prediction: `drawPredictedSlingshotTrajectory`
