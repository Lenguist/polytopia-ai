import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Suspense, useState, useCallback, useEffect, useRef } from 'react'
import {
  createInitialState,
  endTurn,
  researchTech,
  trainUnit,
  checkWinConditions,
} from './game'
import { findPath, isReachable, chebyshev, tribeCanClimb } from './game/pathfinding'
import { resolveCombat, canAttack } from './game/combat'
import type { AiConfig } from './game/aiCompact'
import { requestAiActions, mockHeuristicActions } from './game/aiClient'
import { applyAiActions } from './game/aiRunner'
import { PolytopiaWorld } from './components/World/PolytopiaWorld'
import { CameraFocus } from './components/World/CameraFocus'
import { HUD } from './components/UI/HUD'
import { Splash, type StartConfig, type DifficultyLevel } from './components/UI/Splash'
import type { GameState, TechId, UnitType, TribeId } from './game/types'

const TRIBE_NAMES: Record<string, string> = {
  imperius: 'Imperius',
  bardur: 'Bardur',
}

function difficultySettings(d: DifficultyLevel): { startingStars: number; maxTurns: number } {
  switch (d) {
    case 'easy':
      return { startingStars: 8, maxTurns: 40 }
    case 'hard':
      return { startingStars: 3, maxTurns: 25 }
    default:
      return { startingStars: 5, maxTurns: 30 }
  }
}

/**
 * ?autoplay=<ms> — milliseconds between auto turns.
 * 1000 = 1 second per turn. 0 or omitted = disabled.
 * Legacy: autoplay=1 is treated as 500ms for convenience.
 */
function readQuery() {
  if (typeof window === 'undefined') {
    return { autoplayMs: 0, winner: null as string | null }
  }
  const q = new URLSearchParams(window.location.search)
  const raw = q.get('autoplay')
  let autoplayMs = 0
  if (raw !== null && raw !== '') {
    const n = Number(raw)
    if (Number.isFinite(n) && n > 0) {
      autoplayMs = n === 1 ? 500 : Math.floor(n)
    }
  }
  return {
    autoplayMs,
    winner: q.get('winner'),
  }
}

const QUERY = readQuery()
const AUTOPLAY = QUERY.autoplayMs > 0

function forceVictoryState(winner: TribeId): GameState {
  const s = createInitialState({
    mode: 'domination',
    mapWidth: 8,
    mapHeight: 8,
    tribes: ['imperius', 'bardur'],
  })
  const units: typeof s.units = {}
  for (const u of Object.values(s.units)) {
    if (u.tribe === winner) units[u.id] = u
  }
  const players = s.players.map((p) => ({
    ...p,
    isAlive: p.tribe === winner,
    units: p.tribe === winner ? p.units : [],
  }))
  return {
    ...s,
    units,
    players,
    gameOver: true,
    winner,
    mode: 'domination',
  }
}

function App() {
  const [state, setState] = useState<GameState>(() => {
    if (QUERY.winner === 'imperius' || QUERY.winner === 'bardur') {
      return forceVictoryState(QUERY.winner)
    }
    return createInitialState({
      mode: AUTOPLAY ? 'domination' : 'perfection',
      mapWidth: AUTOPLAY ? 6 : 16,
      mapHeight: AUTOPLAY ? 6 : 16,
      tribes: ['imperius', 'bardur'],
    })
  })
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null)
  const [showTech, setShowTech] = useState(false)
  const [started, setStarted] = useState(AUTOPLAY || !!QUERY.winner)
  const [toast, setToast] = useState<string | null>(
    QUERY.winner
      ? `Game over — ${QUERY.winner.toUpperCase()} wins! Enemy defeated.`
      : AUTOPLAY
        ? `Autoplay mock duel · ${QUERY.autoplayMs}ms/turn`
        : null
  )
  const [focusKey, setFocusKey] = useState(0)
  const [playMode, setPlayMode] = useState<'pass-and-play' | 'vs-ai'>(
    AUTOPLAY ? 'vs-ai' : 'pass-and-play'
  )
  const [aiConfig, setAiConfig] = useState<AiConfig | null>(
    AUTOPLAY ? { provider: 'mock', apiKey: 'mock' } : null
  )
  const [aiBusy, setAiBusy] = useState(false)
  const prevPlayerIndex = useRef(0)
  const stateRef = useRef(state)
  stateRef.current = state
  const runningRef = useRef(false)

  const currentPlayer = state.players[state.currentPlayerIndex]
  const humanTribe = state.players[0]?.tribe
  const isAiTurn =
    !state.gameOver &&
    playMode === 'vs-ai' &&
    !!aiConfig &&
    (AUTOPLAY || currentPlayer.tribe !== humanTribe)

  // Autoplay keeps mountains (Climbing-gated); convert water so paths exist around peaks
  useEffect(() => {
    if (!AUTOPLAY || QUERY.winner) return
    setState((prev) => {
      const tiles = prev.tiles.map((row) =>
        row.map((t) => {
          if (t.terrain === 'water' && t.building !== 'city') {
            return { ...t, terrain: 'land' as const }
          }
          return t
        })
      )
      return { ...prev, tiles }
    })
  }, [])

  useEffect(() => {
    if (!started) return
    if (state.gameOver) {
      setToast(`Game over — ${state.winner?.toUpperCase()} wins! Enemy defeated.`)
      return
    }
    const tribeLabel = TRIBE_NAMES[currentPlayer.tribe] ?? currentPlayer.tribe
    if (state.currentPlayerIndex !== prevPlayerIndex.current || state.turn === 1) {
      if (isAiTurn) {
        setToast(
          AUTOPLAY
            ? `Autoplay: ${tribeLabel} · turn ${state.turn} · ${QUERY.autoplayMs}ms`
            : `AI (${aiConfig?.provider ?? 'llm'}) is thinking…`
        )
      } else {
        setToast(`You are ${tribeLabel.toUpperCase()}. Tap a unit to move.`)
      }
      setFocusKey((k) => k + 1)
    }
    prevPlayerIndex.current = state.currentPlayerIndex
  }, [
    started,
    state.currentPlayerIndex,
    state.turn,
    state.gameOver,
    state.winner,
    currentPlayer.tribe,
    isAiTurn,
    aiConfig?.provider,
  ])

  useEffect(() => {
    if (!started || !isAiTurn || !aiConfig || state.gameOver) return
    if (runningRef.current) return
    runningRef.current = true
    setAiBusy(true)

    const playerIndex = state.currentPlayerIndex
    const tribe = state.players[playerIndex].tribe
    const delayMs = AUTOPLAY ? QUERY.autoplayMs : 0

    let cancelled = false
    const timer = window.setTimeout(async () => {
      if (cancelled) return
      try {
        const snapshot = stateRef.current
        const actions =
          aiConfig.provider === 'mock'
            ? mockHeuristicActions(snapshot, tribe)
            : await requestAiActions(snapshot, tribe, aiConfig)
        if (cancelled) return
        const { state: next, log } = applyAiActions(snapshot, actions, playerIndex)
        setState(next)
        setSelectedUnitId(null)
        if (!next.gameOver) {
          const summary =
            log.filter((l) => !l.startsWith('skip')).slice(0, 3).join(' · ') || 'end'
          setToast(`${TRIBE_NAMES[tribe] ?? tribe}: ${summary}`)
        }
      } catch (err) {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : 'AI failed'
        setToast(`AI error: ${msg.slice(0, 100)}`)
        setState((prev) => endTurn(prev))
      } finally {
        if (!cancelled) {
          runningRef.current = false
          setAiBusy(false)
        }
      }
    }, delayMs)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      runningRef.current = false
    }
  }, [started, isAiTurn, aiConfig, state.currentPlayerIndex, state.turn, state.gameOver])

  const tryMoveOrAttack = useCallback(
    (targetX: number, targetY: number) => {
      if (isAiTurn || aiBusy || !selectedUnitId || state.gameOver) return
      const unit = state.units[selectedUnitId]
      if (!unit || unit.tribe !== currentPlayer.tribe || unit.acted) return

      const occupant = Object.values(state.units).find(
        (u) => u.x === targetX && u.y === targetY && u.health > 0 && u.id !== unit.id
      )
      if (occupant && occupant.tribe === unit.tribe) return

      if (occupant && occupant.tribe !== unit.tribe) {
        const dist = chebyshev(unit.x, unit.y, occupant.x, occupant.y)
        if (!canAttack(unit, occupant, dist)) {
          setToast('Enemy is out of attack range.')
          return
        }
        const tile = state.tiles[occupant.y][occupant.x]
        const { attacker, defender } = resolveCombat(unit, occupant, tile, dist)
        setState((prev) => {
          const units = { ...prev.units }
          units[attacker.id] = attacker
          let players = prev.players
          if (defender.health <= 0) {
            delete units[defender.id]
            players = prev.players.map((p) =>
              p.tribe === defender.tribe
                ? { ...p, units: p.units.filter((id) => id !== defender.id) }
                : p
            )
            setToast('Enemy unit defeated!')
          } else {
            units[defender.id] = defender
            setToast(`Hit! Enemy HP: ${defender.health}`)
          }
          return checkWinConditions({ ...prev, units, players })
        })
        setSelectedUnitId(null)
        return
      }

      const canClimb = tribeCanClimb(state, unit.tribe)
      if (state.tiles[targetY][targetX].terrain === 'mountain' && !canClimb) {
        setToast('Need Climbing tech to enter mountains.')
        return
      }
      if (!isReachable(state, unit.x, unit.y, targetX, targetY, unit.movement, { canClimb })) {
        setToast('That tile is out of movement range.')
        return
      }
      if (!findPath(state, unit.x, unit.y, targetX, targetY, unit.movement, { canClimb })) {
        setToast('No path to that tile.')
        return
      }

      setState((prev) => {
        const units = { ...prev.units }
        units[selectedUnitId] = {
          ...units[selectedUnitId],
          x: targetX,
          y: targetY,
          movement: 0,
          acted: true,
        }
        return { ...prev, units }
      })
      setSelectedUnitId(null)
      setToast('Moved. Tap End Turn when finished.')
    },
    [selectedUnitId, state, currentPlayer, isAiTurn, aiBusy]
  )

  const handleSelectUnit = useCallback(
    (id: string | null) => {
      if (isAiTurn || aiBusy) return
      if (!id) {
        setSelectedUnitId(null)
        return
      }
      const unit = state.units[id]
      if (!unit || unit.tribe !== currentPlayer.tribe) return
      if (unit.acted) {
        setToast('This unit has already acted this turn.')
        return
      }
      setSelectedUnitId(id)
      setToast('Highlighted tiles show where you can move.')
    },
    [state.units, currentPlayer.tribe, isAiTurn, aiBusy]
  )

  const handleEndTurn = () => {
    if (isAiTurn || aiBusy) return
    setState((prev) => endTurn(prev))
    setSelectedUnitId(null)
    setShowTech(false)
  }

  const handleResearch = (techId: TechId) => {
    if (isAiTurn || aiBusy) return
    setState((prev) => researchTech(prev, prev.currentPlayerIndex, techId) ?? prev)
  }

  const handleTrain = (unitType: UnitType) => {
    if (isAiTurn || aiBusy || state.gameOver) return
    setState((prev) => trainUnit(prev, prev.currentPlayerIndex, unitType) ?? prev)
  }

  const handleStart = (config: StartConfig) => {
    const { startingStars, maxTurns } = difficultySettings(config.difficulty)
    const size = config.boardSize
    const next = createInitialState({
      mode: config.mode === 'vs-ai' ? 'domination' : 'perfection',
      mapWidth: size,
      mapHeight: size,
      tribes: ['imperius', 'bardur'],
    })
    next.maxTurns = maxTurns
    next.players = next.players.map((p) => ({ ...p, stars: startingStars }))
    setState(next)
    setPlayMode(config.mode)
    setAiConfig(config.ai ?? null)
    setSelectedUnitId(null)
    setShowTech(false)
    setAiBusy(false)
    setStarted(true)
    setFocusKey((k) => k + 1)
    setToast(
      config.mode === 'vs-ai'
        ? `You are Imperius. AI: ${config.ai?.provider}.`
        : `You are IMPERIUS. Tap a unit to move.`
    )
  }

  const camDist = 8 + state.mapWidth * 0.4

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', touchAction: 'none' }}>
      {!started && (
        <Splash onStart={handleStart} yourTribe={TRIBE_NAMES[humanTribe] ?? 'Imperius'} />
      )}

      <Canvas
        camera={{
          position: [camDist * 0.7, camDist * 0.9, camDist * 0.7],
          fov: 50,
          near: 0.1,
          far: 300,
        }}
        dpr={[1, 1.5]}
        performance={{ min: 0.5 }}
        gl={{
          antialias: false,
          powerPreference: 'high-performance',
          alpha: false,
        }}
        style={{ width: '100%', height: '100%' }}
        onPointerMissed={() => !isAiTurn && !aiBusy && setSelectedUnitId(null)}
      >
        <color attach="background" args={['#4ab0d8']} />
        <fog attach="fog" args={['#6bc4e0', 48, 125]} />
        <ambientLight intensity={0.4} color="#fff4e0" />
        <directionalLight position={[18, 28, 12]} intensity={1.55} color="#fff2cc" />
        <directionalLight position={[-8, 10, -6]} intensity={0.3} color="#a8d8ff" />
        <hemisphereLight args={['#6ec4e8', '#6bc46b', 0.45]} />

        <Suspense fallback={null}>
          <PolytopiaWorld
            state={state}
            selectedUnitId={selectedUnitId}
            onSelectUnit={handleSelectUnit}
            onTileClick={tryMoveOrAttack}
          />
          <CameraFocus state={state} focusKey={focusKey} />
        </Suspense>

        <OrbitControls
          maxPolarAngle={Math.PI / 2.2}
          minDistance={6}
          maxDistance={60}
          target={[0, 0, 0]}
          enablePan
          enableDamping
          dampingFactor={0.12}
          makeDefault
        />
      </Canvas>

      {started && (
        <HUD
          state={state}
          selectedUnitId={selectedUnitId}
          showTech={showTech}
          onToggleTech={() => !isAiTurn && !aiBusy && setShowTech((v) => !v)}
          onEndTurn={handleEndTurn}
          onResearch={handleResearch}
          onTrain={handleTrain}
          toast={toast}
          onToastDone={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default App
