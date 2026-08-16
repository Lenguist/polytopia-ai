# 2-2 Turn System & Star Economy

## Prompt

Implement the turn system and star (☆) economy on top of the GameState. Support ending a turn, generating stars from cities, spending stars on units/tech/buildings, and basic income calculation. Include simple validation (cannot spend more stars than available).

## Supplementary Information

- Stars are the universal currency.
- Cities generate a base amount of stars per turn modified by level and surrounding tiles.
- Turn sequence: all units of the current player may act → player ends turn → income is added → next player.
- Keep pure functions so the same logic can run in a headless AI simulation.
- Acceptance: Can start a game, produce a unit by spending stars, end turn, and see income applied.
