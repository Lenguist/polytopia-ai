import type { TechId, TechNode } from './types'

/**
 * Simplified but representative technology tree.
 * Costs and prerequisites approximate the original game.
 */
export const TECH_TREE: Record<TechId, TechNode> = {
  climbing: {
    id: 'climbing',
    name: 'Climbing',
    cost: 5,
    requires: [],
    unlocks: { abilities: ['mountain-movement', 'mountain-vision'] },
    description: 'Move and see better on mountains.',
  },
  organization: {
    id: 'organization',
    name: 'Organization',
    cost: 5,
    requires: [],
    unlocks: { abilities: ['harvest-fruit'] },
    description: 'Harvest fruit to grow cities.',
  },
  riding: {
    id: 'riding',
    name: 'Riding',
    cost: 5,
    requires: [],
    unlocks: { units: ['rider'] },
    description: 'Train Riders for fast exploration.',
  },
  hunting: {
    id: 'hunting',
    name: 'Hunting',
    cost: 5,
    requires: [],
    unlocks: { abilities: ['harvest-animal'] },
    description: 'Hunt animals for population.',
  },
  fishing: {
    id: 'fishing',
    name: 'Fishing',
    cost: 5,
    requires: [],
    unlocks: { abilities: ['harvest-fish'], buildings: ['port'] },
    description: 'Fish and build ports.',
  },
  archery: {
    id: 'archery',
    name: 'Archery',
    cost: 6,
    requires: [],
    unlocks: { units: ['archer'] },
    description: 'Train Archers with ranged attacks.',
  },
  farming: {
    id: 'farming',
    name: 'Farming',
    cost: 6,
    requires: ['organization'],
    unlocks: { buildings: ['farm'] },
    description: 'Build farms for more population.',
  },
  forestry: {
    id: 'forestry',
    name: 'Forestry',
    cost: 6,
    requires: ['hunting'],
    unlocks: { buildings: ['lumberhut'] },
    description: 'Build lumber huts in forests.',
  },
  mining: {
    id: 'mining',
    name: 'Mining',
    cost: 6,
    requires: ['climbing'],
    unlocks: { buildings: ['mine'] },
    description: 'Mine metal from mountains.',
  },
  roads: {
    id: 'roads',
    name: 'Roads',
    cost: 6,
    requires: ['riding'],
    unlocks: { abilities: ['build-roads'] },
    description: 'Build roads for faster movement.',
  },
  sailing: {
    id: 'sailing',
    name: 'Sailing',
    cost: 7,
    requires: ['fishing'],
    unlocks: { units: ['boat', 'ship'] },
    description: 'Sail the oceans.',
  },
  strategy: {
    id: 'strategy',
    name: 'Strategy',
    cost: 7,
    requires: [],
    unlocks: { units: ['defender'] },
    description: 'Train sturdy Defenders.',
  },
  chivalry: {
    id: 'chivalry',
    name: 'Chivalry',
    cost: 8,
    requires: ['riding'],
    unlocks: { units: ['knight'] },
    description: 'Train powerful Knights.',
  },
  construction: {
    id: 'construction',
    name: 'Construction',
    cost: 8,
    requires: ['farming'],
    unlocks: { abilities: ['burn-forest', 'clear-forest'] },
    description: 'Advanced building and forest management.',
  },
  mathematics: {
    id: 'mathematics',
    name: 'Mathematics',
    cost: 8,
    requires: ['forestry'],
    unlocks: { abilities: ['sawmill'] },
    description: 'Boost lumber production.',
  },
  philosophy: {
    id: 'philosophy',
    name: 'Philosophy',
    cost: 8,
    requires: ['meditation'],
    unlocks: { abilities: ['tech-discount'] },
    description: 'Reduce future research costs.',
  },
  navigation: {
    id: 'navigation',
    name: 'Navigation',
    cost: 9,
    requires: ['sailing'],
    unlocks: { units: ['battleship'] },
    description: 'Build Battleships.',
  },
  smithery: {
    id: 'smithery',
    name: 'Smithery',
    cost: 9,
    requires: ['mining'],
    unlocks: { units: ['swordsman'] },
    description: 'Train Swordsmen.',
  },
  'free-spirit': {
    id: 'free-spirit',
    name: 'Free Spirit',
    cost: 7,
    requires: [],
    unlocks: { buildings: ['temple'], abilities: ['disband'] },
    description: 'Build temples and disband units.',
  },
  meditation: {
    id: 'meditation',
    name: 'Meditation',
    cost: 6,
    requires: [],
    unlocks: { buildings: ['mountain-temple'] },
    description: 'Mountain temples and inner peace.',
  },
}

/** Starting tech for each regular tribe (simplified). */
export const TRIBE_STARTING_TECH: Record<string, TechId> = {
  'xin-xi': 'climbing',
  imperius: 'organization',
  bardur: 'hunting',
  oumaji: 'riding',
  kickoo: 'fishing',
  hoodrick: 'archery',
  luxidoor: 'organization',
  vengir: 'smithery',
  zebasi: 'farming',
  'ai-mo': 'meditation',
  quetzali: 'strategy',
  yadakk: 'roads',
}

export function canResearch(
  techId: TechId,
  researched: TechId[],
  cityCount: number,
  stars: number
): boolean {
  const node = TECH_TREE[techId]
  if (!node) return false
  if (researched.includes(techId)) return false
  if (!node.requires.every((r) => researched.includes(r))) return false
  const cost = node.cost + Math.max(0, cityCount - 1) * 2 // simple scaling
  return stars >= cost
}

export function researchCost(techId: TechId, cityCount: number): number {
  const node = TECH_TREE[techId]
  if (!node) return Infinity
  return node.cost + Math.max(0, cityCount - 1) * 2
}
