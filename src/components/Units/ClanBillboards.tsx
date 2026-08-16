import { Html } from '@react-three/drei'
import type { GameState, Unit } from '../../game/types'

const TILE_SIZE = 1

const TRIBE_LABELS: Record<string, string> = {
  imperius: 'Imperius',
  bardur: 'Bardur',
  'xin-xi': 'Xin-xi',
  oumaji: 'Oumaji',
  kickoo: 'Kickoo',
  hoodrick: 'Hoodrick',
  luxidoor: 'Luxidoor',
  vengir: 'Vengir',
  zebasi: 'Zebasi',
  'ai-mo': 'Ai-Mo',
  quetzali: 'Quetzali',
  yadakk: 'Yădakk',
}

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

interface Props {
  state: GameState
}

/**
 * Billboard tooltips above the first (starting) unit of each tribe.
 */
export function ClanBillboards({ state }: Props) {
  // One label per tribe — use the first unit found for that tribe
  const byTribe = new Map<string, Unit>()
  for (const unit of Object.values(state.units)) {
    if (!byTribe.has(unit.tribe)) {
      byTribe.set(unit.tribe, unit)
    }
  }

  return (
    <group>
      {[...byTribe.entries()].map(([tribe, unit]) => {
        const wx = (unit.x - state.mapWidth / 2 + 0.5) * TILE_SIZE
        const wz = (unit.y - state.mapHeight / 2 + 0.5) * TILE_SIZE
        const label = TRIBE_LABELS[tribe] ?? tribe
        const color = TRIBE_COLORS[tribe] ?? '#ffffff'

        return (
          <Html
            key={tribe}
            position={[wx, 1.35, wz]}
            center
            distanceFactor={12}
            style={{ pointerEvents: 'none' }}
            zIndexRange={[10, 0]}
          >
            <div
              style={{
                background: 'rgba(10,10,20,0.85)',
                color: '#fff',
                padding: '4px 10px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                fontFamily: 'system-ui, sans-serif',
                whiteSpace: 'nowrap',
                border: `1.5px solid ${color}`,
                boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
              }}
            >
              <span style={{ color }}>{label}</span>
            </div>
          </Html>
        )
      })}
    </group>
  )
}
