/**
 * Pure TypeScript types for Polytopia game logic.
 * No Three.js or React imports allowed in this module.
 */

export type TribeId =
  | 'xin-xi'
  | 'imperius'
  | 'bardur'
  | 'oumaji'
  | 'kickoo'
  | 'hoodrick'
  | 'luxidoor'
  | 'vengir'
  | 'zebasi'
  | 'ai-mo'
  | 'quetzali'
  | 'yadakk'
  | 'aquarion'
  | 'elyrion'
  | 'polaris'
  | 'cymanti'

export type TerrainType = 'land' | 'water' | 'mountain' | 'forest' | 'ice'

export type UnitType =
  | 'warrior'
  | 'archer'
  | 'defender'
  | 'rider'
  | 'swordsman'
  | 'knight'
  | 'catapult'
  | 'mindbender'
  | 'giant'
  | 'raft'
  | 'boat'
  | 'ship'
  | 'battleship'

export type TechId =
  | 'climbing'
  | 'organization'
  | 'riding'
  | 'hunting'
  | 'fishing'
  | 'archery'
  | 'farming'
  | 'forestry'
  | 'mining'
  | 'roads'
  | 'sailing'
  | 'strategy'
  | 'chivalry'
  | 'construction'
  | 'mathematics'
  | 'philosophy'
  | 'navigation'
  | 'smithery'
  | 'free-spirit'
  | 'meditation'

export interface Tile {
  x: number
  y: number
  terrain: TerrainType
  owner: TribeId | null
  resource: 'fruit' | 'animal' | 'fish' | 'metal' | 'crop' | null
  building: 'village' | 'city' | 'farm' | 'lumberhut' | 'mine' | 'port' | 'temple' | null
  exploredBy: TribeId[]
}

export interface Unit {
  id: string
  type: UnitType
  tribe: TribeId
  x: number
  y: number
  health: number
  maxHealth: number
  movement: number
  maxMovement: number
  attack: number
  defense: number
  range: number
  veteran: boolean
  acted: boolean // has this unit already acted this turn?
}

export interface City {
  id: string
  tribe: TribeId
  x: number
  y: number
  level: number // 1+
  population: number
  isCapital: boolean
  starsPerTurn: number
}

export interface PlayerState {
  tribe: TribeId
  stars: number
  researched: TechId[]
  cities: string[] // city ids
  units: string[]  // unit ids
  score: number
  isAlive: boolean
}

export type GameMode = 'perfection' | 'domination' | 'creative'

export interface GameState {
  mode: GameMode
  turn: number
  maxTurns: number // 30 for perfection, Infinity-like for domination
  currentPlayerIndex: number
  players: PlayerState[]
  tiles: Tile[][] // [y][x]
  units: Record<string, Unit>
  cities: Record<string, City>
  mapWidth: number
  mapHeight: number
  winner: TribeId | null
  gameOver: boolean
}

export interface TechNode {
  id: TechId
  name: string
  cost: number // base cost; actual cost scales with city count
  requires: TechId[]
  unlocks: {
    units?: UnitType[]
    buildings?: string[]
    abilities?: string[]
  }
  description: string
}
