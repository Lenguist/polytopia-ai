/**
 * Compact board + state encoding for LLM AI turns.
 * See docs/spec/ai.md
 */
import type {
  GameState,
  Tile,
  Unit,
  City,
  TerrainType,
  TribeId,
  UnitType,
} from './types'

const TERRAIN: Record<TerrainType, string> = {
  land: 'L',
  water: 'W',
  mountain: 'M',
  forest: 'F',
  ice: 'I',
}

const RESOURCE: Record<string, string> = {
  fruit: 'fr',
  animal: 'an',
  fish: 'fi',
  metal: 'me',
  crop: 'cr',
}

const BUILDING: Record<string, string> = {
  village: 'vi',
  city: 'ci',
  farm: 'fa',
  lumberhut: 'lh',
  mine: 'mi',
  port: 'po',
  temple: 'te',
}

const UNIT: Record<UnitType, string> = {
  warrior: 'wa',
  archer: 'ar',
  defender: 'de',
  rider: 'ri',
  swordsman: 'sw',
  knight: 'kn',
  catapult: 'ca',
  mindbender: 'mb',
  giant: 'gi',
  raft: 'rf',
  boat: 'bo',
  ship: 'sh',
  battleship: 'bs',
}

const TRIBE_SHORT: Partial<Record<TribeId, string>> = {
  imperius: 'imp',
  bardur: 'bar',
  'xin-xi': 'xin',
  oumaji: 'oum',
  kickoo: 'kic',
  hoodrick: 'hoo',
  luxidoor: 'lux',
  vengir: 'ven',
  zebasi: 'zeb',
  'ai-mo': 'aim',
  quetzali: 'que',
  yadakk: 'yad',
}

function tribeCode(t: TribeId): string {
  return TRIBE_SHORT[t] ?? t
}

function cellBlock(
  tile: Tile,
  unit: Unit | undefined,
  city: City | undefined
): Record<string, unknown> {
  const block: Record<string, unknown> = {
    t: TERRAIN[tile.terrain],
  }
  if (tile.owner) block.o = tribeCode(tile.owner)
  if (tile.resource) block.r = RESOURCE[tile.resource] ?? tile.resource
  if (tile.building) block.b = BUILDING[tile.building] ?? tile.building
  if (unit) {
    block.u = {
      id: unit.id,
      k: UNIT[unit.type] ?? unit.type,
      tr: tribeCode(unit.tribe),
      hp: unit.health,
      m: unit.movement,
      a: unit.acted ? 1 : 0,
    }
  }
  if (city) {
    block.c = {
      id: city.id,
      tr: tribeCode(city.tribe),
      lv: city.level,
      pop: city.population,
      ...(city.isCapital ? { cap: 1 } : {}),
    }
  }
  return block
}

export function boardToCompact(state: GameState): Record<string, unknown>[][] {
  const unitAt = new Map<string, Unit>()
  for (const u of Object.values(state.units)) {
    if (u.health > 0) unitAt.set(`${u.x},${u.y}`, u)
  }
  const cityAt = new Map<string, City>()
  for (const c of Object.values(state.cities)) {
    cityAt.set(`${c.x},${c.y}`, c)
  }

  const rows: Record<string, unknown>[][] = []
  for (let y = 0; y < state.mapHeight; y++) {
    const row: Record<string, unknown>[] = []
    for (let x = 0; x < state.mapWidth; x++) {
      const key = `${x},${y}`
      row.push(cellBlock(state.tiles[y][x], unitAt.get(key), cityAt.get(key)))
    }
    rows.push(row)
  }
  return rows
}

export function stateToCompact(state: GameState, aiTribe: TribeId) {
  const ai = state.players.find((p) => p.tribe === aiTribe)
  const enemy = state.players.find((p) => p.tribe !== aiTribe)
  return {
    turn: state.turn,
    maxTurns: state.maxTurns,
    mode: state.mode,
    w: state.mapWidth,
    h: state.mapHeight,
    you: tribeCode(aiTribe),
    enemy: enemy ? tribeCode(enemy.tribe) : null,
    stars: ai?.stars ?? 0,
    tech: ai?.researched ?? [],
    enemyStars: enemy?.stars ?? 0,
    enemyTech: enemy?.researched ?? [],
  }
}

export const AI_SYSTEM_PROMPT = `You are the AI player in a turn-based Polytopia-like 4X game.
Play as tribe "you" only. Obey movement (Chebyshev distance), combat range, and economy rules.
Reply with ONLY a JSON array of actions. No markdown, no commentary.`

export function buildAiUserPrompt(
  state: GameState,
  aiTribe: TribeId
): string {
  const compactState = stateToCompact(state, aiTribe)
  const board = boardToCompact(state)
  return [
    `STATE: ${JSON.stringify(compactState)}`,
    `BOARD: ${JSON.stringify(board)}`,
    `ACTIONS allowed:`,
    `- {"op":"move","id":"<unitId>","to":[x,y]}`,
    `- {"op":"attack","id":"<unitId>","to":[x,y]}`,
    `- {"op":"research","tech":"<techId>"}`,
    `- {"op":"end"}`,
    `Prefer capture/pressure when safe. Research if stars allow and army is idle.`,
    `Max 8 actions. Last action should be {"op":"end"} if you are done.`,
  ].join('\n')
}

export const KEYED_PROVIDERS = ['deepseek', 'grok', 'mock'] as const

export type AiProvider =
  | 'deepseek'
  | 'grok'
  | 'mock'
  | 'openrouter'
  | 'ai21'
  | 'huggingface'

export function providerNeedsKey(p: AiProvider): boolean {
  return p === 'deepseek' || p === 'grok'
}

export function providerLabel(p: AiProvider): string {
  switch (p) {
    case 'deepseek':
      return 'DeepSeek'
    case 'grok':
      return 'Grok (xAI)'
    case 'mock':
      return 'Mock (local)'
    case 'openrouter':
      return 'OpenRouter'
    case 'ai21':
      return 'AI21'
    case 'huggingface':
      return 'Hugging Face'
  }
}

export interface AiConfig {
  provider: AiProvider
  apiKey: string
}
