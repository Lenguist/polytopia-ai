# 1-3 Base Mobile Performance Configuration

## Prompt

Configure the React Three Fiber `<Canvas>` for mobile-friendly performance from day one. Cap device pixel ratio, disable antialiasing by default, set `powerPreference: "high-performance"`, enable R3F adaptive performance, and add a simple FPS / performance monitor that can be toggled. Document the decisions in code comments.

## Supplementary Information

- Recommended starting values:
  - `dpr={[1, 1.5]}`
  - `gl={{ antialias: false, powerPreference: "high-performance" }}`
  - `performance={{ min: 0.5 }}`
- Use `@react-three/drei` `<Perf />` or a lightweight custom monitor for development only.
- Later steps will add further instancing and quality tiers; this step only establishes the baseline.
- Acceptance: Scene runs at stable frame rates on a mid-range Android phone and iPhone Safari without thermal warnings in short sessions.
