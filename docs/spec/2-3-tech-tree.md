# 2-3 Technology Tree & Research

## Prompt

Model the technology tree as data (nodes with prerequisites, costs, and unlocks). Implement research that spends stars and unlocks units, buildings, or abilities. Support the concept of starting technologies per tribe. Keep the tree data-driven so special tribes can later override branches.

## Supplementary Information

- Original tree is a compact web (Climbing, Organization, Riding, Hunting, Fishing → higher tiers).
- Cost of research increases with number of cities.
- Research is instant once paid (no multi-turn research).
- Acceptance: A tribe can research a tier-1 tech, then a dependent tier-2 tech, and the unlocked unit becomes available for production.
