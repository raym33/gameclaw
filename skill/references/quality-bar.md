# Quality Bar

Gameclaw should help Codex ship better small games faster, not just generate more code.

## Default Target

Unless the user explicitly asks for a raw prototype, aim for a **premium vertical slice**:

- one strong playable loop
- one coherent art direction
- one control scheme that feels deliberate
- one level/chamber/arena polished enough to show

Do not spread effort across menus, lore, multiple unfinished modes, or broad architecture before the slice feels good.

## Non-Negotiables

- The game must be readable in motion, not only in screenshots.
- Player input must feel immediate and reliable.
- Movement must have acceleration, deceleration, anticipation, or recovery where appropriate.
- Physics-based mechanics must be deterministic enough to learn.
- Sprite scale, anchoring, and hit feedback must look intentional.
- Asset coverage must be sufficient for the loop. One pretty image and one gameplay sprite is not enough if motion still reads badly.
- HUD and helper text must support the loop instead of covering the action.
- If the user asks for polished or sellable quality, do not leave placeholder primitives in the final presentation layer.

## What To Prioritize First

1. Core loop clarity
2. Input feel
3. Motion readability
4. Physics reliability
5. Asset coverage
6. Art consistency
7. Juice: particles, flash, recoil, hit stop, camera response

## What “Prototype-Looking” Usually Means

- shapes instead of real sprites
- one hero pose reused across idle, movement, action, and recovery
- no anticipation or recovery on actions
- camera that is static, jittery, or badly framed
- hit reactions that only change numbers
- trajectory previews that do not match the real shot
- friction, gravity, or drag values that feel arbitrary
- unreadable or oversized debug-style HUD
- generated art exists but is not actually integrated into the gameplay layer
- too many systems, none of them tuned

Fix those before adding more features.

## Pixel-Perfect Mode

If the game is pixel art or the user asks for pixel-perfect output:

- use nearest-neighbor filtering
- keep sprite sizes and world units consistent
- avoid subpixel wobble on characters and UI
- use integer-friendly scale choices
- do not mix painterly assets and pixel art in the same final slice unless the contrast is intentional

## Sellable Direction

To move from premium slice toward sellable:

- keep the runtime stable
- add content on top of tuned controls, not before
- standardize art rules and animation language
- preserve consistent collision logic and camera grammar
- build a backlog of production features only after the moment-to-moment play already works
