# Falling-Block Puzzle

Use this when the user asks for:

- Tetris-like games
- falling-block puzzle games
- line-clear stackers
- jewel, tile, or block stacking games where board logic is the core product

## Current Repo Status

Gameclaw does not yet have a native falling-block runtime family.

That means:

- a true stacker should usually push toward a new runtime
- the skill should not silently collapse it into an unrelated runtime and pretend the result is authentic
- approximation is acceptable only when the user mainly wants the visual language or product framing, not the real loop

## Authentic Requirements

If the request is genuinely falling-block-first, the slice usually needs:

- a grid board
- spawn rules
- gravity curve
- rotation or kick rules
- lock timing
- line clear logic
- next queue and usually hold
- clean score, danger, and restart surfaces

If those do not exist, say so and scope the slice honestly.

## What To Prioritize

- input immediacy
- board readability
- line clear feedback
- danger-state clarity
- instant restart speed
- a screen that can survive a store screenshot without looking like a debug board

## Product Smell

The slice is failing if it feels like:

- a generic puzzle skin with no real stack tension
- slow or mushy inputs
- pretty blocks with unreadable board state
- a fake “Tetris-like” that never earns the comparison

## Implementation Map

- template asset: `skill/assets/templates/falling-block-puzzle.json`
- runtime gating and honesty: `skill/SKILL.md`
- production guidance for platform-like movement is not enough here; this needs dedicated board logic when authentic

## Outcome

Either build a real falling-block runtime path, or label the slice clearly as puzzle-inspired. Do not blur that line.
