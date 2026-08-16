import { useMemo } from 'react'
import * as THREE from 'three'
import { Brush, Evaluator, ADDITION } from 'three-bvh-csg'

/**
 * Small decorative CSG feature to prove three-bvh-csg is wired.
 * Positioned near the map edge so it does not obscure gameplay.
 */
export function TerrainCSGFeatures() {
  const mountainFeature = useMemo(() => {
    const evaluator = new Evaluator()

    const base = new Brush(new THREE.BoxGeometry(2.2, 0.35, 2.2))
    base.position.set(-9, 0.2, -9)
    base.updateMatrixWorld()

    const peak = new Brush(new THREE.ConeGeometry(0.9, 1.4, 5))
    peak.position.set(-9, 1.1, -9)
    peak.updateMatrixWorld()

    const result = evaluator.evaluate(base, peak, ADDITION)
    return result.geometry
  }, [])

  return (
    <mesh geometry={mountainFeature} castShadow={false}>
      <meshStandardMaterial color="#5a5a5a" flatShading roughness={0.9} />
    </mesh>
  )
}
