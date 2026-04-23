# Asset Coverage

Use this when the user wants polished, professional, sellable, or presentation-ready output.

## Principle

Missing art is implementation work, not an optional extra. If the loop looks unfinished because it lacks sprites, props, impacts, or UI surfaces, Codex should generate what is missing and integrate it.
Prefer spending more generation effort on fewer strong assets over accepting thin coverage that keeps the game looking cheap.

## Minimum Final Coverage

- A frequently visible character should have enough dedicated states to read well in motion.
- A gameplay object that the player aims at, collides with, or destroys should have final art attached to its runtime body.
- Repeated feedback moments should have visible presentation, not only physics or number changes.
- UI that stays on screen should look like part of the art direction, not a debug overlay.

## Character Coverage

For a character that stays on screen for most of the loop, aim for at least:

- 2 idle variants if the camera lingers on the character
- 2 locomotion poses if the character moves repeatedly
- 1 anticipation or brace pose before a major action
- 1 peak action pose
- 1 recovery or release pose

If those states still snap badly in motion, generate more in-between coverage instead of forcing interpolation between incompatible full-body illustrations.

## Gameplay Coverage

When the loop depends on them, provide final art for:

- background or chamber art
- main character
- projectile or weapon payload
- targets or enemies
- destructible or interactive materials
- impact, trail, muzzle, spark, or destruction feedback
- HUD plate, badge, or prompt surface if the raw text treatment looks temporary

## Destruction And Physics Loops

For slingshot, projectile, or destruction games:

- the launcher/weapon should look physically readable
- pull, release, and recovery should each read as separate states
- trajectory preview, projectile sprite, and collision body should agree
- material families should look distinct enough to read weight and fragility

## Anti-Patterns

- one idle sprite reused for walk, pull, release, and recovery
- beautiful generated art left unused while gameplay still shows primitives
- incompatible character angles mixed in one final slice
- backgrounds generated once but no gameplay props generated to match them
- final presentation depending on debug text boxes or temporary panels

## Exit Test

Before calling the slice polished, check:

- every frequently seen state has dedicated visual coverage
- the player can read actions while the game is moving
- no core gameplay object is still presented as a placeholder
- asset quality matches the requested style across the whole loop
