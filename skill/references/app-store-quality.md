# App Store Quality

Use this when the user wants the game to look closer to the kind of small, polished games sold on app stores.

## Target

Do not interpret this as “ship a full commercial game in one step”. Interpret it as:

- the core loop looks marketable
- the main screen feels rich instead of empty
- the game reads well in screenshots and in motion
- the slice has enough finish that a short trailer clip would not look embarrassing

## What Usually Makes A Slice Feel Commercial

- a strong, coherent art direction across background, props, character, UI, and effects
- a main screen with enough detail density, not just one character over a sparse backdrop
- readable animation states with anticipation, action, and recovery
- camera framing that flatters the action
- effects that support the mechanic: trails, bursts, impacts, glows, debris, flashes
- UI surfaces that feel designed, not debug text on top of gameplay

## Detail Density Rules

- The most visible screen should have foreground, midground, and background interest where the genre allows it.
- Important gameplay objects should have distinct silhouettes and materials.
- Repetition is acceptable, but repeated props should still look authored and intentional.
- Empty space is fine only when compositionally deliberate. Empty because art is missing is not acceptable.

## Commercial-Looking Checklist

- character art is supported by enough states to look smooth
- props and interactables match the same visual family
- the player can instantly read where to look and what to do
- HUD belongs to the world/style instead of fighting it
- the main screen could be used in a store screenshot after minor copy/layout work

## Anti-Patterns

- one hero render pasted onto a mostly empty game screen
- detailed background but cheap gameplay layer
- nice sprites with placeholder HUD and placeholder effects
- smooth physics with ugly presentation
- detailed assets used once while the rest of the screen looks unfinished

## Scope Guardrail

To reach this bar, prefer:

- one detailed chamber/level/arena
- one tuned control loop
- one cohesive visual language

Do not dilute quality by trying to ship too many modes, menus, or systems before the playable screen feels premium.
