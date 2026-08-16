import { useMemo } from 'react'
import { Physics } from '@react-three/rapier'
import { TileGrid } from './TileGrid'
import { TerrainCSGFeatures } from './TerrainCSG'
import { UnitLayer } from '../Units/UnitLayer'
import { CityLayer } from './CityLayer'
import { ClickableTiles, computeReachableKeys } from './ClickableTiles'
import { ClanBillboards } from '../Units/ClanBillboards'
import type { GameState } from '../../game/types'

interface Props {
  state: GameState
  selectedUnitId: string | null
  onSelectUnit: (id: string | null) => void
  onTileClick: (x: number, y: number) => void
}

export function PolytopiaWorld({
  state,
  selectedUnitId,
  onSelectUnit,
  onTileClick,
}: Props) {
  const reachableKeys = useMemo(
    () => computeReachableKeys(state, selectedUnitId),
    [state, selectedUnitId]
  )

  return (
    <Physics timeStep={1 / 30} gravity={[0, -9.81, 0]}>
      <TileGrid state={state} reachableKeys={reachableKeys} />
      <TerrainCSGFeatures />
      <CityLayer state={state} />
      <UnitLayer
        state={state}
        selectedUnitId={selectedUnitId}
        onSelectUnit={onSelectUnit}
      />
      <ClanBillboards state={state} />
      <ClickableTiles
        state={state}
        selectedUnitId={selectedUnitId}
        onTileClick={onTileClick}
      />
    </Physics>
  )
}
