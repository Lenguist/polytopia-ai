import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { GameState } from '../../game/types'

const TILE_SIZE = 1

interface Props {
  state: GameState
  /** Bumps when the active player changes so we re-focus. */
  focusKey: number
}

/**
 * Smoothly pans OrbitControls target (and camera) toward the
 * centroid of the current player's units/cities after each turn.
 */
export function CameraFocus({ state, focusKey }: Props) {
  const { controls } = useThree() as { controls: any }
  const goal = useRef(new THREE.Vector3(0, 0, 0))
  const animating = useRef(false)

  useEffect(() => {
    const player = state.players[state.currentPlayerIndex]
    if (!player) return

    let sx = 0
    let sz = 0
    let n = 0

    for (const id of player.units) {
      const u = state.units[id]
      if (!u) continue
      sx += (u.x - state.mapWidth / 2 + 0.5) * TILE_SIZE
      sz += (u.y - state.mapHeight / 2 + 0.5) * TILE_SIZE
      n++
    }
    for (const id of player.cities) {
      const c = state.cities[id]
      if (!c) continue
      sx += (c.x - state.mapWidth / 2 + 0.5) * TILE_SIZE
      sz += (c.y - state.mapHeight / 2 + 0.5) * TILE_SIZE
      n++
    }

    if (n === 0) return
    goal.current.set(sx / n, 0, sz / n)
    animating.current = true
  }, [focusKey, state])

  useFrame((_, dt) => {
    if (!animating.current || !controls) return

    const target = controls.target as THREE.Vector3
    const cam = controls.object as THREE.Camera

    // Lerp look-at target toward the active tribe
    target.lerp(goal.current, Math.min(1, dt * 3.5))

    // Nudge camera toward a comfortable offset from the goal
    const comfortable = new THREE.Vector3(
      goal.current.x + 9,
      12,
      goal.current.z + 9
    )
    cam.position.lerp(comfortable, Math.min(1, dt * 2.2))

    controls.update?.()

    if (target.distanceTo(goal.current) < 0.08) {
      target.copy(goal.current)
      animating.current = false
    }
  })

  return null
}
