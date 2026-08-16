import { useMemo } from 'react'
import * as THREE from 'three'
import type { GameState } from '../../game/types'
import { isReachable, tribeCanClimb } from '../../game/pathfinding'
import { enemyTilesInRange } from '../../game/combat'

const TILE_SIZE = 1

interface Props {
  state: GameState
  selectedUnitId: string | null
  onTileClick: (x: number, y: number) => void
  onReachableChange?: (keys: Set<string>) => void
}

export function ClickableTiles({ state, selectedUnitId, onTileClick }: Props) {
  const { mapWidth, mapHeight } = state

  const selectedUnit = selectedUnitId ? state.units[selectedUnitId] : null

  const attackTargets = useMemo(() => {
    if (!selectedUnit || selectedUnit.acted) return [] as { x: number; y: number }[]
    return enemyTilesInRange(selectedUnit, state.units, mapWidth, mapHeight)
  }, [selectedUnit, state.units, mapWidth, mapHeight])

  const handlePointerDown = (e: any) => {
    e.stopPropagation()
    const point: THREE.Vector3 = e.point
    const tileX = Math.floor(point.x / TILE_SIZE + mapWidth / 2)
    const tileY = Math.floor(point.z / TILE_SIZE + mapHeight / 2)
    if (tileX < 0 || tileY < 0 || tileX >= mapWidth || tileY >= mapHeight) return
    onTileClick(tileX, tileY)
  }

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.22, 0]}
        onPointerDown={handlePointerDown}
      >
        <planeGeometry args={[mapWidth * TILE_SIZE, mapHeight * TILE_SIZE]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {attackTargets.map(({ x, y }) => {
        const wx = (x - mapWidth / 2 + 0.5) * TILE_SIZE
        const wz = (y - mapHeight / 2 + 0.5) * TILE_SIZE
        return (
          <mesh
            key={`a-${x},${y}`}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[wx, 0.32, wz]}
            onPointerDown={(e) => {
              e.stopPropagation()
              onTileClick(x, y)
            }}
          >
            <ringGeometry args={[0.28, 0.42, 20]} />
            <meshBasicMaterial
              color="#e74c3c"
              transparent
              opacity={0.8}
              depthWrite={false}
            />
          </mesh>
        )
      })}
    </group>
  )
}

export function computeReachableKeys(
  state: GameState,
  selectedUnitId: string | null
): Set<string> {
  const keys = new Set<string>()
  if (!selectedUnitId) return keys
  const unit = state.units[selectedUnitId]
  if (!unit || unit.acted) return keys

  const canClimb = tribeCanClimb(state, unit.tribe)
  const range = unit.movement
  for (let dy = -range; dy <= range; dy++) {
    for (let dx = -range; dx <= range; dx++) {
      if (dx === 0 && dy === 0) continue
      const tx = unit.x + dx
      const ty = unit.y + dy
      if (tx < 0 || ty < 0 || tx >= state.mapWidth || ty >= state.mapHeight) continue
      if (isReachable(state, unit.x, unit.y, tx, ty, range, { canClimb })) {
        keys.add(`${tx},${ty}`)
      }
    }
  }
  return keys
}
