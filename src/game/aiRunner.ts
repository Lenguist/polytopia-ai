/**
 * Apply validated AI actions to GameState.
 */
import type { GameState, TechId } from './types'
import { findPath, isReachable, chebyshev, tribeCanClimb } from './pathfinding'
import { resolveCombat, canAttack } from './combat'
import { researchTech, endTurn, checkWinConditions } from './state'
import type { AiAction } from './aiClient'

export interface ApplyResult {
  state: GameState
  log: string[]
}

export function applyAiActions(
  initial: GameState,
  actions: AiAction[],
  aiPlayerIndex: number
): ApplyResult {
  let state = initial
  const log: string[] = []
  const aiTribe = state.players[aiPlayerIndex]?.tribe
  if (!aiTribe) return { state, log: ['No AI player'] }

  for (const action of actions) {
    if (state.gameOver) break
    if (action.op === 'end') {
      log.push('end')
      break
    }

    if (action.op === 'research') {
      const next = researchTech(state, aiPlayerIndex, action.tech as TechId)
      if (next) {
        state = next
        log.push(`research ${action.tech}`)
      } else {
        log.push(`skip research ${action.tech}`)
      }
      continue
    }

    const unit = state.units[action.id]
    if (!unit || unit.tribe !== aiTribe || unit.acted || unit.health <= 0) {
      log.push(`skip ${action.op} ${action.id}`)
      continue
    }

    const [tx, ty] = action.to
    if (tx < 0 || ty < 0 || tx >= state.mapWidth || ty >= state.mapHeight) {
      log.push(`skip ${action.op} bad coords`)
      continue
    }

    const canClimb = tribeCanClimb(state, aiTribe)

    if (action.op === 'move') {
      const occupant = Object.values(state.units).find(
        (u) => u.x === tx && u.y === ty && u.health > 0 && u.id !== unit.id
      )
      if (occupant) {
        log.push(`skip move occupied`)
        continue
      }
      if (!isReachable(state, unit.x, unit.y, tx, ty, unit.movement, { canClimb })) {
        log.push(`skip move unreachable`)
        continue
      }
      if (!findPath(state, unit.x, unit.y, tx, ty, unit.movement, { canClimb })) {
        log.push(`skip move no path`)
        continue
      }
      const units = { ...state.units }
      units[unit.id] = {
        ...units[unit.id],
        x: tx,
        y: ty,
        movement: 0,
        acted: true,
      }
      state = { ...state, units }
      log.push(`move ${unit.id} → ${tx},${ty}`)
      continue
    }

    if (action.op === 'attack') {
      const defender = Object.values(state.units).find(
        (u) => u.x === tx && u.y === ty && u.health > 0 && u.tribe !== aiTribe
      )
      if (!defender) {
        log.push(`skip attack no enemy`)
        continue
      }
      const dist = chebyshev(unit.x, unit.y, defender.x, defender.y)
      if (!canAttack(unit, defender, dist)) {
        log.push(`skip attack range`)
        continue
      }
      const tile = state.tiles[defender.y][defender.x]
      const { attacker, defender: def2 } = resolveCombat(unit, defender, tile, dist)
      const units = { ...state.units }
      units[attacker.id] = attacker
      let players = state.players
      if (def2.health <= 0) {
        delete units[def2.id]
        players = state.players.map((p) =>
          p.tribe === def2.tribe
            ? { ...p, units: p.units.filter((id) => id !== def2.id) }
            : p
        )
        log.push(`attack kill ${def2.id}`)
      } else {
        units[def2.id] = def2
        log.push(`attack hit ${def2.id} hp=${def2.health}`)
      }
      state = checkWinConditions({ ...state, units, players })
    }
  }

  if (!state.gameOver) {
    state = endTurn(state)
  }
  return { state, log }
}
