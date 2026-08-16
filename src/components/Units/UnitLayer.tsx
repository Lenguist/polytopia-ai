import { useMemo } from 'react'
import { RigidBody } from '@react-three/rapier'
import type { GameState, Unit, City } from '../../game/types'
import { isRangedUnit } from '../../game/units'

const TILE_SIZE = 1
const TRIBE_COLORS: Record<string, string> = {
  imperius: '#4a90d9',
  bardur: '#c47a3a',
  'xin-xi': '#cc3333',
  oumaji: '#e6b800',
  kickoo: '#33aa77',
  hoodrick: '#66aa33',
  luxidoor: '#9933cc',
  vengir: '#888888',
  zebasi: '#dd8833',
  'ai-mo': '#66ccff',
  quetzali: '#33cc99',
  yadakk: '#cc6633',
}

interface UnitLayerProps {
  state: GameState
  selectedUnitId: string | null
  onSelectUnit: (id: string | null) => void
}

/** World Y so a unit sits just above a city spire / roof. */
function heightOnCity(city: City, stackIndex: number): number {
  const scale = 0.85 + city.level * 0.12
  // Matches CityLayer: rigid at y=0.15, capital cone tip ~0.15 + 0.72*scale + half cone
  const spireTop = city.isCapital
    ? 0.15 + 0.72 * scale + 0.18
    : 0.15 + 0.55 * scale + 0.12
  return spireTop + 0.55 + stackIndex * 0.4
}

export function UnitLayer({ state, selectedUnitId, onSelectUnit }: UnitLayerProps) {
  const units = Object.values(state.units)

  const cityByTile = useMemo(() => {
    const map = new Map<string, City>()
    for (const c of Object.values(state.cities)) {
      map.set(`${c.x},${c.y}`, c)
    }
    return map
  }, [state.cities])

  // Stack index for units sharing a tile (stable by id)
  const stackIndex = useMemo(() => {
    const groups = new Map<string, string[]>()
    for (const u of units) {
      if (u.health <= 0) continue
      const key = `${u.x},${u.y}`
      const list = groups.get(key) ?? []
      list.push(u.id)
      groups.set(key, list)
    }
    for (const list of groups.values()) list.sort()
    const idx = new Map<string, number>()
    for (const list of groups.values()) {
      list.forEach((id, i) => idx.set(id, i))
    }
    return idx
  }, [units])

  return (
    <group>
      {units.map((unit) => {
        const city = cityByTile.get(`${unit.x},${unit.y}`)
        const stack = stackIndex.get(unit.id) ?? 0
        const baseY = city ? heightOnCity(city, stack) : 0.45
        return (
          <UnitMesh
            key={unit.id}
            unit={unit}
            mapWidth={state.mapWidth}
            mapHeight={state.mapHeight}
            selected={unit.id === selectedUnitId}
            baseY={baseY}
            onSelect={() => onSelectUnit(unit.id === selectedUnitId ? null : unit.id)}
          />
        )
      })}
    </group>
  )
}

function UnitMesh({
  unit,
  mapWidth,
  mapHeight,
  selected,
  baseY,
  onSelect,
}: {
  unit: Unit
  mapWidth: number
  mapHeight: number
  selected: boolean
  baseY: number
  onSelect: () => void
}) {
  const wx = (unit.x - mapWidth / 2 + 0.5) * TILE_SIZE
  const wz = (unit.y - mapHeight / 2 + 0.5) * TILE_SIZE
  const color = TRIBE_COLORS[unit.tribe] ?? '#ffffff'
  const ranged = isRangedUnit(unit.type)

  return (
    <RigidBody
      type="kinematicPosition"
      position={[wx, baseY, wz]}
      colliders="hull"
      enabledRotations={[false, false, false]}
    >
      <group
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
      >
        <mesh castShadow={false} position={[0, 0.15, 0]}>
          <capsuleGeometry args={[ranged ? 0.2 : 0.28, ranged ? 0.4 : 0.35, 4, 8]} />
          <meshStandardMaterial
            color={selected ? '#ffffff' : color}
            flatShading
            emissive={selected ? color : '#000000'}
            emissiveIntensity={selected ? 0.4 : 0}
          />
        </mesh>
        <mesh position={[0, 0.55, 0]}>
          <sphereGeometry args={[0.16, 8, 8]} />
          <meshStandardMaterial color={color} flatShading />
        </mesh>
        {ranged && (
          <mesh position={[0.22, 0.35, 0]} rotation={[0, 0, 0.3]}>
            <torusGeometry args={[0.14, 0.03, 6, 10, Math.PI]} />
            <meshStandardMaterial color="#8b5a2b" flatShading />
          </mesh>
        )}
        {selected && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[0.4, 0.5, 16]} />
            <meshBasicMaterial color="#ffd700" transparent opacity={0.85} />
          </mesh>
        )}
      </group>
    </RigidBody>
  )
}
