# 2-1 Game Types & Central State

## Prompt

Design and implement the pure TypeScript core data model for Polytopia. Define types for Tribe, Tile, Unit, City, Technology, GameState, and related enums. Create a central immutable (or carefully mutable) GameState store that can later be driven by both the 3D client and AI agents. No Three.js imports allowed in this module.

## Supplementary Information

- Key concepts from the original game: square grid, Chebyshev movement, stars as currency, fog of war, city population levels, tech tree nodes.
- Prefer a single source of truth (`GameState`) with pure functions that return new state or mutate carefully via immer if desired.
- Keep serialization in mind (for future save/load or multiplayer).
- Acceptance: Fully typed GameState that can represent a minimal 2-player game with a few tiles, one city each, and a warrior.
