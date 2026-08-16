/**
 * LLM provider clients for AI turns (Grok / xAI, DeepSeek) + local mock.
 */
import type { AiConfig, AiProvider } from './aiCompact'
import { AI_SYSTEM_PROMPT, buildAiUserPrompt } from './aiCompact'
import type { GameState, TribeId, Unit } from './types'
import { chebyshev, isReachable, tribeCanClimb } from './pathfinding'
import { canAttack } from './combat'

export type AiAction =
  | { op: 'move'; id: string; to: [number, number] }
  | { op: 'attack'; id: string; to: [number, number] }
  | { op: 'research'; tech: string }
  | { op: 'end' }

interface ProviderEndpoint {
  url: string
  model: string
}

function endpointFor(provider: AiProvider): ProviderEndpoint | null {
  switch (provider) {
    case 'grok':
      return {
        url: 'https://api.x.ai/v1/chat/completions',
        model: 'grok-4.6',
      }
    case 'deepseek':
      return {
        url: 'https://api.deepseek.com/chat/completions',
        model: 'deepseek-chat',
      }
    default:
      return null
  }
}

export function parseActionsFromText(text: string): AiAction[] {
  const trimmed = text.trim()
  const start = trimmed.indexOf('[')
  const end = trimmed.lastIndexOf(']')
  if (start >= 0 && end > start) {
    try {
      const parsed = JSON.parse(trimmed.slice(start, end + 1))
      if (Array.isArray(parsed)) return normalizeActions(parsed)
    } catch {
      /* fall through */
    }
  }
  try {
    const obj = JSON.parse(trimmed)
    if (Array.isArray(obj)) return normalizeActions(obj)
    if (obj && Array.isArray(obj.actions)) return normalizeActions(obj.actions)
  } catch {
    /* ignore */
  }
  return [{ op: 'end' }]
}

function normalizeActions(raw: unknown[]): AiAction[] {
  const out: AiAction[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const op = o.op
    if (op === 'end') {
      out.push({ op: 'end' })
      continue
    }
    if (op === 'research' && typeof o.tech === 'string') {
      out.push({ op: 'research', tech: o.tech })
      continue
    }
    if ((op === 'move' || op === 'attack') && typeof o.id === 'string') {
      const to = o.to
      if (Array.isArray(to) && to.length >= 2) {
        out.push({
          op,
          id: o.id,
          to: [Number(to[0]), Number(to[1])],
        })
      }
    }
  }
  if (out.length === 0) out.push({ op: 'end' })
  return out.slice(0, 8)
}

function nearestEnemy(unit: Unit, state: GameState): Unit | null {
  let best: Unit | null = null
  let bestD = Infinity
  for (const u of Object.values(state.units)) {
    if (u.health <= 0 || u.tribe === unit.tribe) continue
    const d = chebyshev(unit.x, unit.y, u.x, u.y)
    if (d < bestD) {
      bestD = d
      best = u
    }
  }
  return best
}

/** Local heuristic AI — no network. Used for mock provider and tests. */
export function mockHeuristicActions(state: GameState, aiTribe: TribeId): AiAction[] {
  const actions: AiAction[] = []
  const player = state.players.find((p) => p.tribe === aiTribe)
  const canClimb = tribeCanClimb(state, aiTribe)

  // If blocked by mountains and can afford Climbing, research it
  if (
    player &&
    !canClimb &&
    player.stars >= 5 &&
    !player.researched.includes('climbing')
  ) {
    actions.push({ op: 'research', tech: 'climbing' })
  }

  const myUnits = Object.values(state.units).filter(
    (u) => u.tribe === aiTribe && u.health > 0 && !u.acted
  )

  for (const unit of myUnits) {
    const enemy = nearestEnemy(unit, state)
    if (!enemy) continue

    const dist = chebyshev(unit.x, unit.y, enemy.x, enemy.y)
    if (canAttack(unit, enemy, dist)) {
      actions.push({ op: 'attack', id: unit.id, to: [enemy.x, enemy.y] })
      continue
    }

    // Prefer steps that reduce distance, avoid mountains without Climbing
    let best: { x: number; y: number; score: number } | null = null
    const range = unit.movement
    for (let dy = -range; dy <= range; dy++) {
      for (let dx = -range; dx <= range; dx++) {
        if (dx === 0 && dy === 0) continue
        const tx = unit.x + dx
        const ty = unit.y + dy
        if (tx < 0 || ty < 0 || tx >= state.mapWidth || ty >= state.mapHeight) continue
        const tile = state.tiles[ty][tx]
        if (tile.terrain === 'mountain' && !canClimb) continue
        if (tile.terrain === 'water') continue
        const occupied = Object.values(state.units).some(
          (u) => u.health > 0 && u.x === tx && u.y === ty
        )
        if (occupied) continue
        if (!isReachable(state, unit.x, unit.y, tx, ty, range, { canClimb })) continue
        const score = chebyshev(tx, ty, enemy.x, enemy.y)
        // Prefer lower score; slight preference for non-forest open land
        const adj = score + (tile.terrain === 'forest' ? 0.1 : 0)
        if (!best || adj < best.score) best = { x: tx, y: ty, score: adj }
      }
    }
    if (best) {
      actions.push({ op: 'move', id: unit.id, to: [best.x, best.y] })
    }
  }

  actions.push({ op: 'end' })
  return actions
}

export async function requestAiActions(
  state: GameState,
  aiTribe: TribeId,
  config: AiConfig,
  signal?: AbortSignal
): Promise<AiAction[]> {
  if (
    config.provider === 'mock' ||
    config.apiKey === 'mock' ||
    config.apiKey === 'test'
  ) {
    await new Promise((r) => setTimeout(r, 80))
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    return mockHeuristicActions(state, aiTribe)
  }

  const ep = endpointFor(config.provider)
  if (!ep) {
    throw new Error(`Provider ${config.provider} is not available yet`)
  }

  const userContent = buildAiUserPrompt(state, aiTribe)

  const res = await fetch(ep.url, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: ep.model,
      temperature: 0.3,
      messages: [
        { role: 'system', content: AI_SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`AI API ${res.status}: ${body.slice(0, 200) || res.statusText}`)
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const content = data.choices?.[0]?.message?.content ?? ''
  return parseActionsFromText(content)
}
