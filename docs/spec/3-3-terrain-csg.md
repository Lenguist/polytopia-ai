# 3-3 Terrain Features with three-bvh-csg

## Prompt

Enhance selected tiles or regions with three-bvh-csg boolean operations. Use Brush + Evaluator to add mountain extrusions, carve simple riverbeds, or union low-poly forest canopies / city walls. Perform CSG at load time or when the map is generated; avoid per-frame CSG. Cache results and keep the resulting geometry low-poly.

## Supplementary Information

- three-bvh-csg is chosen specifically for speed over classic BSP CSG.
- Geometry must be two-manifold where possible.
- Prefer generating feature geometries procedurally or from simple primitives.
- Acceptance: Mountains and at least one other feature type appear on the map without dropping mobile frame rate significantly.
