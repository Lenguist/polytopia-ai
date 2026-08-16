import type { Unit, Tile, TerrainType } from './types'
import { isRangedUnit } from './units'

/** Terrain defense bonuses (simplified). */
const TERRAIN_DEFENSE: Partial<Record<TerrainType, number>> = {
  forest: 1.5,
  mountain: 2,
  land: 1,
  water: 0.8,
  ice: 1,
}

/**
 * Deterministic combat resolution matching the spirit of Polytopia.
 * Ranged attacks (attacker is a ranged unit and distance > 1) deal damage
 * without taking counter-attack damage.
 */
export function resolveCombat(
  attacker: Unit,
  defender: Unit,
  defenderTile: Tile,
  distance = 1
): { attacker: Unit; defender: Unit } {
  const defBonus = TERRAIN_DEFENSE[defenderTile.terrain] ?? 1

  const attackForce = attacker.attack * (attacker.health / attacker.maxHealth)
  const defenseForce =
    defender.defense * (defender.health / defender.maxHealth) * defBonus

  const total = attackForce + defenseForce || 1
  const attackResult = Math.round((attackForce / total) * attacker.attack * 4.5)
  const defenseResult = Math.round((defenseForce / total) * defender.defense * 4.5)

  // Ranged strike: no counter-damage when attacking from beyond melee
  const isRangedStrike =
    isRangedUnit(attacker.type) && distance > 1

  const newDefenderHealth = Math.max(0, defender.health - attackResult)
  const newAttackerHealth = isRangedStrike
    ? attacker.health
    : Math.max(0, attacker.health - defenseResult)

  const newAttacker: Unit = {
    ...attacker,
    health: newAttackerHealth,
    acted: true,
    movement: 0,
    veteran: attacker.veteran || (newDefenderHealth <= 0 && !attacker.veteran),
  }

  const newDefender: Unit = {
    ...defender,
    health: newDefenderHealth,
  }

  return { attacker: newAttacker, defender: newDefender }
}

export function canAttack(
  attacker: Unit,
  defender: Unit,
  distance: number
): boolean {
  if (attacker.tribe === defender.tribe) return false
  if (attacker.acted) return false
  if (attacker.health <= 0 || defender.health <= 0) return false
  return distance <= attacker.range
}

/** Chebyshev tiles in attack range that contain enemy units. */
export function enemyTilesInRange(
  attacker: Unit,
  units: Record<string, Unit>,
  mapWidth: number,
  mapHeight: number
): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = []
  for (const u of Object.values(units)) {
    if (u.tribe === attacker.tribe || u.health <= 0) continue
    const d = Math.max(Math.abs(u.x - attacker.x), Math.abs(u.y - attacker.y))
    if (d <= attacker.range && d > 0) {
      if (u.x >= 0 && u.y >= 0 && u.x < mapWidth && u.y < mapHeight) {
        out.push({ x: u.x, y: u.y })
      }
    }
  }
  return out
}
