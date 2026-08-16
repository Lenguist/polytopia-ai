# AI Enemy Gameplay Spec

This document specifies how an external LLM (DeepSeek and **Grok / xAI** first; OpenRouter / AI21 / Hugging Face later) plays as the opposing tribe in **Polytopia 3D**.

## Goals

- One human player, one AI opponent (pass-and-play remains available without an API key).
- On the AI tribe’s turn, the client builds a **compact JSON board + state payload**, sends it with a fixed system/user prompt to the selected provider, and applies the returned actions.
- All game rules (movement, combat, tech cost, stars) stay on the client. The model only proposes legal-looking actions; the client validates and executes them.

## Providers

| Provider     | Status        | Auth                         |
|--------------|---------------|------------------------------|
| DeepSeek     | **Supported** | API key (`sk-…`)             |
| Grok (xAI)   | **Supported** | API key (`xai-…` / console)  |
| OpenRouter   | Not available | —                            |
| AI21         | Not available | —                            |
| Hugging Face | Not available | —                            |

Splash screen: provider `<select>`. **DeepSeek** and **Grok** show an API key field. Other options show “Not yet available” and block Start in vs-AI mode until a keyed provider is chosen with a non-empty key (or the user starts pass-and-play).

API keys are stored only in memory (or optional `sessionStorage`); never committed to the repo.

## When the AI acts

1. Human ends turn → `currentPlayerIndex` advances to the AI tribe.
2. Client shows a short toast: “AI is thinking…”.
3. Client builds the compact payload (see below) and calls the provider.
4. Client parses the JSON action list, validates each action against current rules, applies them in order.
5. Client calls `endTurn` for the AI (or auto-ends after a max action count / timeout).
6. Camera focuses on the human tribe again.

Timeouts / errors: skip remaining actions, end AI turn, toast the failure reason.

## Compact board encoding

The map is a **JSON array of rows** (outer index = `y`, inner index = `x`). Each cell is a short **block** object describing visible contents.

### Cell block schema

```ts
type CellBlock = {
  t: TerrainCode          // terrain
  o?: TribeCode           // owner tribe (omit if none)
  r?: ResourceCode        // resource (omit if none)
  b?: BuildingCode        // building (omit if none)
  u?: UnitBlock           // unit on this tile (omit if none)
  c?: CityBlock           // city on this tile (omit if none)
}

type UnitBlock = {
  id: string
  k: UnitCode             // unit type code
  tr: TribeCode           // tribe
  hp: number              // current health
  m: number               // remaining movement this turn
  a: 0 | 1                // acted this turn?
}

type CityBlock = {
  id: string
  tr: TribeCode
  lv: number              // level
  pop: number
  cap?: 1                 // capital marker
}
```

### Compact codes

**Terrain `t`:** `L` land · `W` water · `M` mountain · `F` forest · `I` ice  
**Resource `r`:** `fr` fruit · `an` animal · `fi` fish · `me` metal · `cr` crop  
**Building `b`:** `vi` village · `ci` city · `fa` farm · `lh` lumberhut · `mi` mine · `po` port · `te` temple  
**Unit `k`:** `wa` warrior · `ar` archer · `de` defender · `ri` rider · `sw` swordsman · `kn` knight · `ca` catapult · `mb` mindbender · `gi` giant · …  
**Tribe `tr` / `o`:** short ids matching game (`imp`, `bar`, `xin`, …) or full `TribeId` if preferred for clarity.

Example 2×2 fragment:

```json
[
  [
    { "t": "L", "r": "fr" },
    { "t": "W" }
  ],
  [
    { "t": "L", "o": "bar", "u": { "id": "u1", "k": "wa", "tr": "bar", "hp": 10, "m": 1, "a": 0 }, "c": { "id": "c1", "tr": "bar", "lv": 1, "pop": 0, "cap": 1 } },
    { "t": "M" }
  ]
]
```

## Game state payload (sent with the board)

Compact companion object (not the full client `GameState`):

```json
{
  "turn": 3,
  "maxTurns": 30,
  "mode": "perfection",
  "w": 16,
  "h": 16,
  "you": "bar",
  "enemy": "imp",
  "stars": 9,
  "tech": ["hunting"],
  "enemyStars": 5,
  "enemyTech": ["climbing"]
}
```

- `you` = the tribe the model must play this request.
- `enemy` = human tribe (summary only; fog of war can omit unseen cells later).

## Prompt contract

**System (fixed, short):**

```
You are the AI player in a turn-based Polytopia-like 4X game.
Play as tribe "you" only. Obey movement (Chebyshev), combat, and economy rules.
Reply with ONLY a JSON array of actions. No markdown, no commentary.
```

**User message (compact):**

```
STATE: { ...compact state... }
BOARD: [ ...rows of cell blocks... ]
ACTIONS allowed:
- {"op":"move","id":"<unitId>","to":[x,y]}
- {"op":"attack","id":"<unitId>","to":[x,y]}
- {"op":"research","tech":"<techId>"}
- {"op":"end"}
Prefer capture/pressure when safe. Research if stars allow and army is idle.
Max 8 actions. Last action should be {"op":"end"} if you are done.
```

## Action response schema

```ts
type AiAction =
  | { op: 'move'; id: string; to: [number, number] }
  | { op: 'attack'; id: string; to: [number, number] }
  | { op: 'research'; tech: string }
  | { op: 'end' }
```

Client validation:

1. Parse JSON; reject non-array.
2. For `move` / `attack`: unit must belong to AI, not acted, path/range legal.
3. For `research`: cost and prerequisites via existing `techTree` helpers.
4. Unknown / illegal actions skipped; log reason.
5. After `end` or max actions / timeout → `endTurn`.

## API call sketches

### DeepSeek

```
POST https://api.deepseek.com/chat/completions
Authorization: Bearer <apiKey>
{
  "model": "deepseek-chat",
  "messages": [
    { "role": "system", "content": "<system>" },
    { "role": "user", "content": "STATE:... BOARD:..." }
  ],
  "temperature": 0.3
}
```

### Grok (xAI)

```
POST https://api.x.ai/v1/chat/completions
Authorization: Bearer <apiKey>
{
  "model": "grok-3",
  "messages": [
    { "role": "system", "content": "<system>" },
    { "role": "user", "content": "STATE:... BOARD:..." }
  ],
  "temperature": 0.3
}
```

Prefer models that respect “JSON only”. If the provider returns prose, extract the first `[...]` JSON array.

## Implementation phases (suggested)

1. **Serializer** — `boardToCompact(state)` + `stateToCompact(state, aiTribe)` (pure TS).
2. **Splash** — provider + DeepSeek / Grok key; pass config into App.
3. **AI turn runner** — on AI index, call provider, apply actions, end turn.
4. **UX** — “AI thinking…” toast; disable human input during AI turn.
5. **Later** — fog of war in BOARD; production/harvest actions; OpenRouter / AI21 / HF adapters.

## Security notes

- API key never leaves the browser except to the chosen provider.
- No key in git, README examples, or analytics.
- Rate-limit: one request per AI turn; backoff on 429.

## Non-goals (v1)

- Multi-AI free-for-all
- Server-side proxy (optional later for key privacy)
- Full Polytopia rules parity (ports, roads, mindbender, etc.)
