import { useState, type CSSProperties } from 'react'
import type { AiConfig, AiProvider } from '../../game/aiCompact'
import { providerNeedsKey } from '../../game/aiCompact'

export type BoardSizeOption = 8 | 12 | 16 | 20 | 24
export type DifficultyLevel = 'easy' | 'normal' | 'hard'

export interface StartConfig {
  mode: 'pass-and-play' | 'vs-ai'
  ai?: AiConfig
  boardSize: BoardSizeOption
  difficulty: DifficultyLevel
}

interface SplashProps {
  onStart: (config: StartConfig) => void
  yourTribe: string
}

const PROVIDERS: { id: AiProvider; label: string }[] = [
  { id: 'mock', label: 'Mock (local heuristic)' },
  { id: 'deepseek', label: 'DeepSeek' },
  { id: 'grok', label: 'Grok (xAI)' },
  { id: 'openrouter', label: 'OpenRouter' },
  { id: 'ai21', label: 'AI21' },
  { id: 'huggingface', label: 'Hugging Face' },
]

const BOARD_SIZES: { value: BoardSizeOption; label: string }[] = [
  { value: 8, label: '8 × 8 (Tiny)' },
  { value: 12, label: '12 × 12 (Small)' },
  { value: 16, label: '16 × 16 (Classic)' },
  { value: 20, label: '20 × 20 (Large)' },
  { value: 24, label: '24 × 24 (Huge)' },
]

const DIFFICULTIES: { value: DifficultyLevel; label: string; hint: string }[] = [
  { value: 'easy', label: 'Easy', hint: 'More starting stars, longer perfection timer' },
  { value: 'normal', label: 'Normal', hint: 'Standard stars and 30-turn perfection' },
  { value: 'hard', label: 'Hard', hint: 'Fewer stars, tighter 25-turn perfection' },
]

export function Splash({ onStart, yourTribe }: SplashProps) {
  const [playMode, setPlayMode] = useState<'pass-and-play' | 'vs-ai'>('pass-and-play')
  const [provider, setProvider] = useState<AiProvider>('mock')
  const [apiKey, setApiKey] = useState('')
  const [boardSize, setBoardSize] = useState<BoardSizeOption>(16)
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('normal')

  const needsKey = providerNeedsKey(provider)
  const mockReady = provider === 'mock'
  const keyReady = needsKey && apiKey.trim().length > 0
  const canStartAi = playMode === 'vs-ai' && (mockReady || keyReady)
  const canStart = playMode === 'pass-and-play' || canStartAi

  const handleStart = () => {
    if (playMode === 'pass-and-play') {
      onStart({ mode: 'pass-and-play', boardSize, difficulty })
      return
    }
    if (!canStartAi) return
    onStart({
      mode: 'vs-ai',
      ai: {
        provider,
        apiKey: mockReady ? 'mock' : apiKey.trim(),
      },
      boardSize,
      difficulty,
    })
  }

  const keyFieldLabel =
    provider === 'grok'
      ? 'xAI / Grok API key'
      : provider === 'deepseek'
        ? 'DeepSeek API key'
        : 'API key'

  const keyPlaceholder = provider === 'grok' ? 'xai-…' : 'sk-…'

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 100,
        background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a12 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#f0f0f0',
        textAlign: 'center',
        overflowY: 'auto',
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 1, marginBottom: 8 }}>
        Polytopia 3D
      </div>
      <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 20 }}>
        A minimal 4X strategy experiment
      </div>

      <div
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 14,
          padding: '18px 22px',
          maxWidth: 360,
          width: '100%',
          marginBottom: 20,
          lineHeight: 1.5,
          fontSize: 14,
          textAlign: 'left',
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 10, color: '#ffd700', textAlign: 'center' }}>
          Setup
        </div>

        <label style={{ display: 'block', fontSize: 13, marginBottom: 6, opacity: 0.9 }}>
          Board size
        </label>
        <select
          value={boardSize}
          onChange={(e) => setBoardSize(Number(e.target.value) as BoardSizeOption)}
          style={selectStyle}
        >
          {BOARD_SIZES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <label style={{ display: 'block', fontSize: 13, marginTop: 14, marginBottom: 6, opacity: 0.9 }}>
          Difficulty
        </label>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
          style={selectStyle}
        >
          {DIFFICULTIES.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
        <div style={{ fontSize: 11, opacity: 0.55, marginTop: 6 }}>
          {DIFFICULTIES.find((d) => d.value === difficulty)?.hint}
        </div>

        <div
          style={{
            fontWeight: 700,
            marginTop: 18,
            marginBottom: 10,
            color: '#ffd700',
            textAlign: 'center',
          }}
        >
          Game mode
        </div>

        <label style={radioRow}>
          <input
            type="radio"
            name="mode"
            checked={playMode === 'pass-and-play'}
            onChange={() => setPlayMode('pass-and-play')}
          />
          <span>
            <strong>Pass-and-play</strong>
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              Two tribes on one device. Hand off after End Turn.
            </div>
          </span>
        </label>

        <label style={{ ...radioRow, marginTop: 10 }}>
          <input
            type="radio"
            name="mode"
            checked={playMode === 'vs-ai'}
            onChange={() => setPlayMode('vs-ai')}
          />
          <span>
            <strong>vs AI</strong>
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              You play as {yourTribe}; the other tribe is controlled by an LLM or mock.
            </div>
          </span>
        </label>

        {playMode === 'vs-ai' && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6, opacity: 0.9 }}>
              AI provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as AiProvider)}
              style={selectStyle}
            >
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>

            {provider === 'mock' ? (
              <div
                style={{
                  marginTop: 12,
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: 'rgba(80,180,120,0.12)',
                  border: '1px solid rgba(80,180,120,0.35)',
                  fontSize: 13,
                  color: '#8fd9a8',
                }}
              >
                Local heuristic — no API key. Good for testing.
              </div>
            ) : needsKey ? (
              <div style={{ marginTop: 12 }}>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 6, opacity: 0.9 }}>
                  {keyFieldLabel}
                </label>
                <input
                  type="password"
                  autoComplete="off"
                  placeholder={keyPlaceholder}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  style={inputStyle}
                />
              </div>
            ) : (
              <div
                style={{
                  marginTop: 12,
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: 'rgba(255,180,60,0.12)',
                  border: '1px solid rgba(255,180,60,0.35)',
                  fontSize: 13,
                  color: '#ffc866',
                }}
              >
                Not yet available
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: 14, fontSize: 13, opacity: 0.85, textAlign: 'center' }}>
          You start as{' '}
          <span style={{ color: '#ffd700', fontWeight: 700 }}>{yourTribe.toUpperCase()}</span>.
        </div>
      </div>

      <button
        onClick={handleStart}
        disabled={!canStart}
        style={{
          padding: '14px 36px',
          fontSize: 17,
          fontWeight: 700,
          background: canStart ? '#3d8b5e' : '#444',
          color: 'white',
          border: 'none',
          borderRadius: 12,
          cursor: canStart ? 'pointer' : 'not-allowed',
          boxShadow: canStart ? '0 6px 20px rgba(61,139,94,0.4)' : 'none',
          opacity: canStart ? 1 : 0.7,
        }}
      >
        Start Game
      </button>
    </div>
  )
}

const radioRow: CSSProperties = {
  display: 'flex',
  gap: 10,
  alignItems: 'flex-start',
  cursor: 'pointer',
}

const selectStyle: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.2)',
  background: '#12121f',
  color: '#f0f0f0',
  fontSize: 14,
}

const inputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.2)',
  background: '#12121f',
  color: '#f0f0f0',
  fontSize: 14,
}
