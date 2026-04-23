# Playtest Matrix

Use this before calling a slice finished. The goal is to catch the things that make a game feel amateur even when the code is technically correct.

## Universal Checks

- The first interaction works without confusion.
- Inputs feel immediate and repeatable.
- Failure and reset are fast enough to encourage another try.
- The camera shows the action instead of hiding it.
- The player can read what is dangerous, useful, and optional.

## Movement Checks

- Start and stop of movement read clearly.
- Repeated actions have rhythm instead of mush.
- Facing, pose, hitbox, and action origin stay aligned.
- The character still looks good at full gameplay speed.

## Physics Checks

- Similar shots or collisions behave consistently enough to learn from.
- Heavy and light materials read differently.
- Visual preview and live result agree.
- Objects do not collide with hidden geometry in ways the player cannot predict.

## Screen Composition Checks

- The eye knows where to look first.
- HUD supports the scene instead of covering the scene.
- Background and gameplay layer belong to the same product.
- The main play screen has enough density and contrast to survive a screenshot.

## Commercial-Looking Checks

- The first ten seconds look intentionally composed.
- The main loop produces at least one moment worth clipping.
- Effects help the mechanic instead of just decorating it.
- The slice feels like the opening of a real shipped game, not a test level.

## Exit Rule

If two or more of these checks fail, do not add more features. Fix readability, feel, or presentation first.
