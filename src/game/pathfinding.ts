import type { GameState, TribeId } from './types'

/** Chebyshev distance (king-move distance). */
export function chebyshev(x1: number, y1: number, x2: number, y2: number): number {
  return Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1))
}

export interface PathNode {
  x: number
  y: number
}

export interface PathOptions {
  /** Tribe has Climbing tech — required to enter mountain tiles. */
  canClimb?: boolean
}

export function tribeCanClimb(state: GameState, tribe: TribeId): boolean {
  const player = state.players.find((p) => p.tribe === tribe)
  return !!player?.researched.includes('climbing')
}

/**
 * Tile is enterable for this mover.
 * Water is always blocked (naval not handled here).
 * Mountains require Climbing.
 * Being already on a mountain without Climbing still allows leaving it.
 */
export function isTilePassable(
  state: GameState,
  x: number,
  y: number,
  canClimb: boolean,
  isStart = false
): boolean {
  if (x < 0 || y < 0 || x >= state.mapWidth || y >= state.mapHeight) return false
  const tile = state.tiles[y][x]
  if (tile.terrain === 'water') return false
  if (tile.terrain === 'mountain' && !canClimb && !isStart) return false
  return true
}

/**
 * Pathfinding on the square grid using Chebyshev distance (8-directional).
 * Mountains are impassable without Climbing.
 */
export function findPath(
  state: GameState,
  startX: number,
  startY: number,
  goalX: number,
  goalY: number,
  maxSteps = 20,
  options: PathOptions = {}
): PathNode[] | null {
  if (startX === goalX && startY === goalY) return [{ x: startX, y: startY }]
  const canClimb = options.canClimb ?? false

  // Goal itself must be passable (unless it is the start)
  if (!isTilePassable(state, goalX, goalY, canClimb, false)) return null

  return bfsPath(state, startX, startY, goalX, goalY, maxSteps, canClimb)
}

function bfsPath(
  state: GameState,
  startX: number,
  startY: number,
  goalX: number,
  goalY: number,
  maxSteps: number,
  canClimb: boolean
): PathNode[] | null {
  const { mapWidth, mapHeight } = state
  const key = (x: number, y: number) => `${x},${y}`
  const cameFrom = new Map<string, string | null>()
  const queue: { x: number; y: number; dist: number }[] = [
    { x: startX, y: startY, dist: 0 },
  ]
  cameFrom.set(key(startX, startY), null)

  const dirs = [
    [-1, -1],
    [0, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
  ]

  while (queue.length > 0) {
    const cur = queue.shift()!
    if (cur.x === goalX && cur.y === goalY) {
      const path: PathNode[] = []
      let k: string | null = key(goalX, goalY)
      while (k) {
        const [xs, ys] = k.split(',').map(Number)
        path.push({ x: xs, y: ys })
        k = cameFrom.get(k) ?? null
      }
      path.reverse()
      return path
    }
    if (cur.dist >= maxSteps) continue

    for (const [dx, dy] of dirs) {
      const nx = cur.x + dx
      const ny = cur.y + dy
      if (nx < 0 || ny < 0 || nx >= mapWidth || ny >= mapHeight) continue
      const nKey = key(nx, ny)
      if (cameFrom.has(nKey)) continue
      if (!isTilePassable(state, nx, ny, canClimb, false)) continue
      cameFrom.set(nKey, key(cur.x, cur.y))
      queue.push({ x: nx, y: ny, dist: cur.dist + 1 })
    }
  }
  return null
}

export function isReachable(
  state: GameState,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  movementPoints: number,
  options: PathOptions = {}
): boolean {
  const dist = chebyshev(fromX, fromY, toX, toY)
  if (dist > movementPoints) return false
  const path = findPath(state, fromX, fromY, toX, toY, movementPoints, options)
  return path !== null && path.length - 1 <= movementPoints
}
