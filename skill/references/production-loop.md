# Production Loop

Use this when the user provided references are messy and Codex needs a repeatable way to turn them into a cohesive, playable slice.

## 1. Extract The Game Pillars

Reduce the input into:

- fantasy
- core mechanic
- camera
- movement style
- physics style
- win or failure state
- target quality level

If any of those are unclear, infer the smallest sensible version and keep moving.

## 2. Write The Art Direction In One Block

Before generating lots of assets, lock:

- visual family
- scale language
- mood and palette
- material language
- screenshot target for the main screen

The asset family should feel authored as one product, not like individually nice images.

## 3. Build The Asset Shot List

List only what the core minute of play actually needs:

- playable character states
- interactables and enemies
- projectiles or abilities
- hit, trail, impact, pickup, or destruction feedback
- environment kit for the visible play space
- HUD surfaces or badges

If something is seen repeatedly during play, it belongs on the list.

## 4. Generate In Families

Generate assets in grouped families instead of one by one:

- character family
- prop and interactable family
- VFX family
- HUD family
- environment family

This keeps style, scale, and finish more consistent.

## 5. Integrate Immediately

Do not let generated art sit unused.

- attach visible sprites to gameplay bodies
- clean backgrounds or crop assets when needed
- align pose origin, collision, and action origin
- replace placeholders in the main screen as soon as a final asset exists

## 6. Tune What The Player Actually Sees

After integration, tune:

- timing
- movement feel
- camera framing
- effect intensity
- HUD placement
- screen density

The goal is not “more art”. The goal is “better moment-to-moment play”.

## 7. Close With A Store-Screenshot Test

Before calling the slice polished, ask:

- does the main screen look full on purpose
- can a new player tell what the action is
- do the most important objects stand out
- does the screen still look finished while moving, not only paused

If the answer is no, the slice is not done.
