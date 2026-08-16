import type { CSSProperties } from 'react'
import type { GameState, TechId, UnitType } from '../../game/types'
import { TECH_TREE, canResearch, researchCost } from '../../game/techTree'
import { trainableUnits } from '../../game/units'
import { Toast } from './Toast'

interface HUDProps {
  state: GameState
  selectedUnitId: string | null
  showTech: boolean
  onToggleTech: () => void
  onEndTurn: () => void
  onResearch: (techId: TechId) => void
  onTrain: (unitType: UnitType) => void
  toast: string | null
  onToastDone: () => void
}

const panelStyle: CSSProperties = {
  background: 'rgba(0,0,0,0.8)',
  color: '#eee',
  padding: '10px 12px',
  borderRadius: 10,
  fontFamily: 'system-ui, sans-serif',
  fontSize: 13,
  border: '1px solid rgba(255,255,255,0.1)',
  boxSizing: 'border-box',
  minHeight: 96,
}

export function HUD({
  state,
  selectedUnitId,
  showTech,
  onToggleTech,
  onEndTurn,
  onResearch,
  onTrain,
  toast,
  onToastDone,
}: HUDProps) {
  const player = state.players[state.currentPlayerIndex]
  const cityCount = player.cities.length
  const trainList = trainableUnits(player.researched)
  const selected = selectedUnitId ? state.units[selectedUnitId] : null

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 16px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.75), transparent)',
          color: '#f0f0f0',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        <div style={{ pointerEvents: 'auto' }}>
          <div style={{ fontSize: 13, opacity: 0.8 }}>
            Turn {state.turn}
            {state.mode === 'perfection' ? ` / ${state.maxTurns}` : ''}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {player.tribe.toUpperCase()}{' '}
            <span style={{ color: '#ffd700' }}>☆ {player.stars}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, pointerEvents: 'auto' }}>
          <button onClick={onToggleTech} style={btnStyle}>
            Tech
          </button>
          <button
            onClick={onEndTurn}
            disabled={state.gameOver}
            style={{ ...btnStyle, background: state.gameOver ? '#555' : '#3d8b5e' }}
          >
            End Turn
          </button>
        </div>
      </div>

      {/* Bottom cards: selected unit | train — equal style, full width */}
      <div
        style={{
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
          display: 'flex',
          gap: 10,
          alignItems: 'stretch',
          zIndex: 40,
          pointerEvents: 'auto',
        }}
      >
        <div style={{ ...panelStyle, flex: 1, minWidth: 0 }}>
          {selected ? (
            <>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>
                {selected.type.toUpperCase()}
                {selected.range > 1 ? ' 🏹' : ''}
              </div>
              <div>
                HP {selected.health}/{selected.maxHealth}
              </div>
              <div>
                Move {selected.movement}/{selected.maxMovement}
              </div>
              <div style={{ opacity: 0.85 }}>
                Atk {selected.attack} · Def {selected.defense} · R{selected.range}
              </div>
            </>
          ) : (
            <div style={{ opacity: 0.55, fontSize: 12 }}>
              Select a unit to see stats
            </div>
          )}
        </div>

        <div
          style={{
            ...panelStyle,
            flex: '0 0 auto',
            width: 'min(46%, 210px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6, opacity: 0.85 }}>Train</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {trainList.length === 0 ? (
              <div style={{ fontSize: 12, opacity: 0.55 }}>No units yet</div>
            ) : (
              trainList.map((u) => {
                const canAfford = player.stars >= u.cost
                return (
                  <button
                    key={u.type}
                    disabled={!canAfford || state.gameOver}
                    onClick={() => onTrain(u.type)}
                    style={{
                      ...btnStyle,
                      width: '100%',
                      background: canAfford ? (u.ranged ? '#6b4c9a' : '#3a3a5c') : '#444',
                      cursor: canAfford ? 'pointer' : 'not-allowed',
                      textAlign: 'left',
                      fontSize: 12,
                      padding: '6px 8px',
                    }}
                  >
                    {u.name}
                    {u.ranged ? ' 🏹' : ''} · ☆{u.cost}
                    {u.range > 1 ? ` · R${u.range}` : ''}
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Popover covers the bottom card row when a message is active */}
      <Toast message={toast} onDone={onToastDone} />

      {showTech && (
        <div
          style={{
            position: 'absolute',
            top: 70,
            right: 16,
            width: 280,
            maxHeight: '55vh',
            overflowY: 'auto',
            background: 'rgba(15,15,30,0.92)',
            color: '#eee',
            borderRadius: 12,
            padding: 14,
            fontFamily: 'system-ui, sans-serif',
            fontSize: 13,
            zIndex: 20,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <strong>Technology</strong>
            <button onClick={onToggleTech} style={{ ...btnStyle, padding: '2px 8px', fontSize: 12 }}>
              ✕
            </button>
          </div>
          {Object.values(TECH_TREE).map((tech) => {
            const owned = player.researched.includes(tech.id)
            const affordable = canResearch(tech.id, player.researched, cityCount, player.stars)
            const cost = researchCost(tech.id, cityCount)
            return (
              <div
                key={tech.id}
                style={{
                  padding: '8px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  opacity: owned ? 0.5 : 1,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{tech.name}</span>
                  <span style={{ color: '#ffd700' }}>{owned ? '✓' : `☆${cost}`}</span>
                </div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>{tech.description}</div>
                {!owned && (
                  <button
                    disabled={!affordable}
                    onClick={() => onResearch(tech.id)}
                    style={{
                      ...btnStyle,
                      marginTop: 4,
                      padding: '4px 10px',
                      fontSize: 12,
                      background: affordable ? '#4a7c59' : '#444',
                      cursor: affordable ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Research
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {state.gameOver && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div
            style={{
              background: '#1a1a2e',
              padding: '32px 48px',
              borderRadius: 16,
              textAlign: 'center',
              color: '#fff',
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Game Over</div>
            <div style={{ fontSize: 20, color: '#ffd700' }}>
              {state.winner?.toUpperCase()} Wins!
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const btnStyle: CSSProperties = {
  padding: '8px 14px',
  fontSize: 14,
  fontWeight: 600,
  background: '#3a3a5c',
  color: 'white',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
}
