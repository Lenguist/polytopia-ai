# 4-3 Chebyshev Pathfinding & Movement

## Prompt

Implement Chebyshev-distance pathfinding on the square grid (matching original Polytopia movement). When a unit is ordered to move, compute the path, then animate the unit (and its Rapier body if present) smoothly along the path. Respect movement points and terrain costs. Support both instant (debug) and animated movement.

## Supplementary Information

- Chebyshev distance: max(dx, dy).
- Movement should feel snappy but readable.
- Integrate with the pure GameState so the logical position is always authoritative.
- Acceptance: Selecting a unit and clicking a reachable tile moves it correctly with animation and updates GameState.
