import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { GameState, TerrainType } from '../../game/types'

const TERRAIN_COLORS: Record<TerrainType, string> = {
  land: '#4a7c59',
  water: '#2a6f8f',
  mountain: '#7a7a7a',
  forest: '#2d5a27',
  ice: '#c8e0f0',
}

const MOVE_TINT = new THREE.Color('#c9b84a')

const TILE_SIZE = 1
const TOP_SIZE = TILE_SIZE * 0.92
const BOTTOM_SIZE = TILE_SIZE

interface TileGridProps {
  state: GameState
  reachableKeys?: Set<string>
}

function createBevelledBox(topSize: number, bottomSize: number, height: number): THREE.BufferGeometry {
  const ht = topSize / 2
  const hb = bottomSize / 2
  const hy = height / 2

  const positions = new Float32Array([
    -hb, -hy,  hb,
     hb, -hy,  hb,
     hb, -hy, -hb,
    -hb, -hy, -hb,
    -ht,  hy,  ht,
     ht,  hy,  ht,
     ht,  hy, -ht,
    -ht,  hy, -ht,
  ])

  const faces: number[][] = [
    [0, 1, 5, 4],
    [1, 2, 6, 5],
    [2, 3, 7, 6],
    [3, 0, 4, 7],
    [4, 5, 6, 7],
    [0, 3, 2, 1],
  ]

  const verts: number[] = []
  const norms: number[] = []

  for (const face of faces) {
    const [a, b, c, d] = face
    const ax = positions[a * 3], ay = positions[a * 3 + 1], az = positions[a * 3 + 2]
    const bx = positions[b * 3], by = positions[b * 3 + 1], bz = positions[b * 3 + 2]
    const cx = positions[c * 3], cy = positions[c * 3 + 1], cz = positions[c * 3 + 2]

    const e1x = bx - ax, e1y = by - ay, e1z = bz - az
    const e2x = cx - ax, e2y = cy - ay, e2z = cz - az
    let nx = e1y * e2z - e1z * e2y
    let ny = e1z * e2x - e1x * e2z
    let nz = e1x * e2y - e1y * e2x
    const len = Math.hypot(nx, ny, nz) || 1
    nx /= len
    ny /= len
    nz /= len

    for (const idx of [a, b, c, a, c, d]) {
      verts.push(positions[idx * 3], positions[idx * 3 + 1], positions[idx * 3 + 2])
      norms.push(nx, ny, nz)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(norms, 3))
  return geo
}

function tintForMove(base: THREE.Color): THREE.Color {
  const out = base.clone().lerp(MOVE_TINT, 0.28)
  out.multiplyScalar(1.18)
  out.r = Math.min(1, out.r)
  out.g = Math.min(1, out.g)
  out.b = Math.min(1, out.b)
  return out
}

/** Deterministic 0..1 from tile coords. */
function tileNoise(x: number, y: number, salt = 0): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + salt * 45.164) * 43758.5453
  return n - Math.floor(n)
}

export function TileGrid({ state, reachableKeys }: TileGridProps) {
  const { tiles, mapWidth, mapHeight } = state

  const groups = useMemo(() => {
    type Group = {
      positions: Float32Array
      coords: { x: number; y: number }[]
      count: number
    }
    const map: Record<TerrainType, Group> = {
      land: { positions: new Float32Array(0), coords: [], count: 0 },
      water: { positions: new Float32Array(0), coords: [], count: 0 },
      mountain: { positions: new Float32Array(0), coords: [], count: 0 },
      forest: { positions: new Float32Array(0), coords: [], count: 0 },
      ice: { positions: new Float32Array(0), coords: [], count: 0 },
    }

    const counts: Record<TerrainType, number> = {
      land: 0, water: 0, mountain: 0, forest: 0, ice: 0,
    }
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        counts[tiles[y][x].terrain]++
      }
    }

    for (const t of Object.keys(counts) as TerrainType[]) {
      map[t] = {
        positions: new Float32Array(counts[t] * 3),
        coords: new Array(counts[t]),
        count: counts[t],
      }
    }

    const cursors: Record<TerrainType, number> = {
      land: 0, water: 0, mountain: 0, forest: 0, ice: 0,
    }
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        const tile = tiles[y][x]
        const t = tile.terrain
        const i = cursors[t]
        const pi = i * 3
        map[t].positions[pi] = (x - mapWidth / 2 + 0.5) * TILE_SIZE
        // Mountain base sits low; stacked cubes build height above
        map[t].positions[pi + 1] =
          t === 'mountain' ? 0.12 : t === 'water' ? -0.05 : 0.05
        map[t].positions[pi + 2] = (y - mapHeight / 2 + 0.5) * TILE_SIZE
        map[t].coords[i] = { x, y }
        cursors[t]++
      }
    }

    return map
  }, [tiles, mapWidth, mapHeight])

  const mountainStacks = useMemo(() => {
    const stacks: {
      wx: number
      wz: number
      layers: { y: number; s: number; color: string }[]
      key: string
    }[] = []
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        if (tiles[y][x].terrain !== 'mountain') continue
        const wx = (x - mapWidth / 2 + 0.5) * TILE_SIZE
        const wz = (y - mapHeight / 2 + 0.5) * TILE_SIZE
        const n = tileNoise(x, y)
        const heightLayers = n > 0.65 ? 3 : n > 0.3 ? 2 : 1
        const layers: { y: number; s: number; color: string }[] = []
        // Rock pedestal + stacked cubes tapering upward
        layers.push({ y: 0.22, s: 0.88, color: '#6e6e6e' })
        if (heightLayers >= 2) layers.push({ y: 0.55, s: 0.62, color: '#808080' })
        if (heightLayers >= 3) layers.push({ y: 0.88, s: 0.4, color: '#959595' })
        // Occasional snow cap
        if (n > 0.8) layers.push({ y: 1.12, s: 0.28, color: '#e8eef5' })
        stacks.push({ wx, wz, layers, key: `${x},${y}` })
      }
    }
    return stacks
  }, [tiles, mapWidth, mapHeight])

  const groundW = mapWidth * TILE_SIZE + 6
  const groundH = mapHeight * TILE_SIZE + 6

  return (
    <group>
      <mesh position={[0, -0.45, 0]}>
        <boxGeometry args={[groundW, 0.5, groundH]} />
        <meshStandardMaterial
          color="#c2a66a"
          flatShading
          roughness={0.95}
          metalness={0}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      {(Object.keys(groups) as TerrainType[]).map((terrain) => {
        // Mountain floor still uses flat tile; peaks are separate cubes
        const g = groups[terrain]
        if (g.count === 0) return null
        return (
          <TerrainInstances
            key={terrain}
            terrain={terrain}
            positions={g.positions}
            coords={g.coords}
            count={g.count}
            reachableKeys={reachableKeys}
          />
        )
      })}

      {/* Mountains built from stacked cubes */}
      {mountainStacks.map((m) => (
        <group key={m.key} position={[m.wx, 0, m.wz]}>
          {m.layers.map((layer, i) => (
            <mesh key={i} position={[0, layer.y, 0]}>
              <boxGeometry args={[layer.s, 0.32, layer.s]} />
              <meshStandardMaterial
                color={layer.color}
                flatShading
                roughness={0.9}
                metalness={0.05}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

function TerrainInstances({
  terrain,
  positions,
  coords,
  count,
  reachableKeys,
}: {
  terrain: TerrainType
  positions: Float32Array
  coords: { x: number; y: number }[]
  count: number
  reachableKeys?: Set<string>
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const baseColor = useMemo(() => new THREE.Color(TERRAIN_COLORS[terrain]), [terrain])
  const moveColor = useMemo(() => tintForMove(baseColor), [baseColor])

  const geometry = useMemo(() => {
    if (terrain === 'mountain') {
      // Low rock base under the cube stack
      return createBevelledBox(TOP_SIZE, BOTTOM_SIZE, 0.22)
    }
    if (terrain === 'water') {
      return createBevelledBox(TOP_SIZE, BOTTOM_SIZE, 0.2)
    }
    return createBevelledBox(TOP_SIZE, BOTTOM_SIZE, 0.28)
  }, [terrain])

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return

    const dummy = new THREE.Object3D()
    for (let i = 0; i < count; i++) {
      const ix = i * 3
      dummy.position.set(positions[ix], positions[ix + 1], positions[ix + 2])
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [positions, count])

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return

    if (!mesh.instanceColor) {
      mesh.instanceColor = new THREE.InstancedBufferAttribute(
        new Float32Array(count * 3),
        3
      )
    }

    for (let i = 0; i < count; i++) {
      const { x, y } = coords[i]
      const key = `${x},${y}`
      if (reachableKeys?.has(key)) {
        mesh.setColorAt(i, moveColor)
      } else {
        mesh.setColorAt(i, baseColor)
      }
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [coords, count, reachableKeys, baseColor, moveColor])

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, count]}
      castShadow={false}
      receiveShadow={false}
      frustumCulled={false}
    >
      <meshStandardMaterial
        color="#ffffff"
        flatShading
        roughness={0.85}
        metalness={0.05}
      />
    </instancedMesh>
  )
}
