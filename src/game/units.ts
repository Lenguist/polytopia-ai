import type { UnitType, Unit, TribeId } from './types'

export interface UnitStats {
  type: UnitType
  name: string
  health: number
  attack: number
  defense: number
  movement: number
  range: number
  /** Star cost to train from a city */
  cost: number
  /** Tech id required (omit if always available like warrior) */
  requiresTech?: string
  /** True if this unit is a ranged attacker (no counter-damage when attacking at distance > 1) */
  ranged?: boolean
}

/** Canonical unit catalog (simplified Polytopia). */
export const UNIT_STATS: Record<UnitType, UnitStats> = {
  warrior: {
    type: 'warrior',
    name: 'Warrior',
    health: 10,
    attack: 2,
    defense: 2,
    movement: 1,
    range: 1,
    cost: 2,
  },
  archer: {
    type: 'archer',
    name: 'Archer',
    health: 10,
    attack: 2,
    defense: 1,
    movement: 1,
    range: 2,
    cost: 3,
    requiresTech: 'archery',
    ranged: true,
  },
  defender: {
    type: 'defender',
    name: 'Defender',
    health: 15,
    attack: 1,
    defense: 3,
    movement: 1,
    range: 1,
    cost: 3,
    requiresTech: 'strategy',
  },
  rider: {
    type: 'rider',
    name: 'Rider',
    health: 10,
    attack: 2,
    defense: 1,
    movement: 2,
    range: 1,
    cost: 3,
    requiresTech: 'riding',
  },
  swordsman: {
    type: 'swordsman',
    name: 'Swordsman',
    health: 15,
    attack: 3,
    defense: 3,
    movement: 1,
    range: 1,
    cost: 5,
    requiresTech: 'smithery',
  },
  knight: {
    type: 'knight',
    name: 'Knight',
    health: 15,
    attack: 4,
    defense: 1,
    movement: 3,
    range: 1,
    cost: 8,
    requiresTech: 'chivalry',
  },
  catapult: {
    type: 'catapult',
    name: 'Catapult',
    health: 10,
    attack: 4,
    defense: 0,
    movement: 1,
    range: 3,
    cost: 8,
    requiresTech: 'mathematics',
    ranged: true,
  },
  mindbender: {
    type: 'mindbender',
    name: 'Mind Bender',
    health: 10,
    attack: 0,
    defense: 1,
    movement: 1,
    range: 1,
    cost: 5,
    requiresTech: 'philosophy',
  },
  giant: {
    type: 'giant',
    name: 'Giant',
    health: 40,
    attack: 5,
    defense: 4,
    movement: 1,
    range: 1,
    cost: 0,
  },
  raft: {
    type: 'raft',
    name: 'Raft',
    health: 10,
    attack: 0,
    defense: 1,
    movement: 2,
    range: 1,
    cost: 0,
  },
  boat: {
    type: 'boat',
    name: 'Boat',
    health: 10,
    attack: 1,
    defense: 1,
    movement: 2,
    range: 1,
    cost: 5,
    requiresTech: 'sailing',
  },
  ship: {
    type: 'ship',
    name: 'Ship',
    health: 15,
    attack: 2,
    defense: 2,
    movement: 3,
    range: 2,
    cost: 10,
    requiresTech: 'sailing',
    ranged: true,
  },
  battleship: {
    type: 'battleship',
    name: 'Battleship',
    health: 20,
    attack: 4,
    defense: 3,
    movement: 3,
    range: 2,
    cost: 15,
    requiresTech: 'navigation',
    ranged: true,
  },
}

export function isRangedUnit(type: UnitType): boolean {
  return UNIT_STATS[type]?.ranged === true
}

export function createUnit(
  type: UnitType,
  tribe: TribeId,
  x: number,
  y: number,
  id: string
): Unit {
  const s = UNIT_STATS[type]
  return {
    id,
    type,
    tribe,
    x,
    y,
    health: s.health,
    maxHealth: s.health,
    movement: s.movement,
    maxMovement: s.movement,
    attack: s.attack,
    defense: s.defense,
    range: s.range,
    veteran: false,
    acted: false,
  }
}

/** Units the player can currently train (tech + known catalog). */
export function trainableUnits(researched: string[]): UnitStats[] {
  return Object.values(UNIT_STATS).filter((s) => {
    if (s.cost <= 0) return false
    if (s.type === 'warrior') return true
    if (!s.requiresTech) return false
    return researched.includes(s.requiresTech)
  })
}
