# Game Feel

Use this file when the task involves movement, combat feel, platforming, projectile mechanics, camera behavior, or physics tuning.

## General Rules

- Separate **playable** from **pleasant**. Get the loop working, then tune feel.
- Tune with real play in browser. Numbers that look plausible in code are not enough.
- Prefer a few tuned parameters over many interacting ones.
- Every action should have a readable start, active phase, and recovery.

## Movement Standards

- Characters should accelerate into motion and decelerate out of it unless the genre demands instant snapping.
- Air control should usually be weaker than ground control.
- Repeated actions should have rhythm, not mush.
- Facing direction, sprite pose, and attack/ability origin should stay synchronized.

## Platformer Baseline

- Add coyote time and jump buffering when platforming is central.
- Use different gravity or cut-jump behavior if full jumps feel floaty.
- Landings need a tiny recovery cue: squash, dust, camera settle, or animation snap.
- Patrol enemies should communicate direction and threat before contact.

## Top-Down / Arena Baseline

- Movement should feel smooth under diagonal input.
- Attack cadence must be readable.
- Hit response should include at least one of: recoil, flash, particles, camera shake, sound backlog note.
- Enemy pressure should ramp through spacing and timing, not only HP.

## Lane Runner Baseline

- Lane swap must commit quickly and cleanly.
- Hazards should be readable at spawn time.
- Collectible pickup feedback should be stronger than a number increment.

## Slingshot / Projectile Baseline

- The player should only grab the projectile from a believable radius.
- Drag constraints should match the launcher shape and intended aim envelope.
- Pointer release outside the canvas should still resolve the shot.
- Predicted trajectory must use the same launch vector and motion model as the live projectile.
- Release should include recoil or elastic snapback.
- Projectile art, collision body, and shadow/glow should stay synchronized.

## Camera

- Frame the action first. Do not let HUD cover the point of play.
- If the game uses a fixed camera, compose the playfield intentionally.
- If the camera follows, prevent jitter and over-correction.
- Impacts may use short, controlled shake; never let the shake hide gameplay.

## Physics

- Use Matter when rigid-body interaction is the feature, not just because physics exists.
- Use simpler motion when that produces a clearer and more stable loop.
- Material differences should be felt through mass, bounce, drag, break thresholds, or friction.
- Do not fake a preview with unrelated math if the live motion comes from the engine.

## Polish Pass Checklist

- idle, move, action, and recovery states look distinct
- launch, hit, pickup, and failure events have feedback
- collision edges and input edge cases are handled
- the action reads at full speed, not only paused
- the slice still feels good after several consecutive attempts
