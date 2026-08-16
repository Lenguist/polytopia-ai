# 5-2 Combat System

## Prompt

Implement deterministic combat resolution between units. Use attack/defense values, terrain modifiers, and any relevant skills. Support the original-style combat outcome (damage calculation, possible death, veteran status). Trigger simple visual feedback (flash, particle, or camera shake) on the 3D side.

## Supplementary Information

- Combat is not physics-based; it is a pure rules calculation.
- Keep the pure combat function completely free of Three.js.
- Visuals are a separate layer that reacts to combat events.
- Acceptance: Two units can fight; the correct unit dies or is damaged and GameState + 3D view stay in sync.
