import { useEffect, useState, type CSSProperties } from 'react'

interface ToastProps {
  message: string | null
  duration?: number
  onDone?: () => void
}

/**
 * Full-width mobile popover that sits over the bottom unit/train cards.
 * Tap anywhere on the sheet to dismiss.
 */
export function Toast({ message, duration = 4500, onDone }: ToastProps) {
  const [visible, setVisible] = useState(false)
  const [text, setText] = useState<string | null>(null)

  useEffect(() => {
    if (!message) {
      setVisible(false)
      return
    }
    setText(message)
    setVisible(true)
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onDone?.(), 280)
    }, duration)
    return () => clearTimeout(t)
  }, [message, duration, onDone])

  if (!text) return null

  const dismiss = () => {
    setVisible(false)
    onDone?.()
  }

  return (
    <div
      onClick={dismiss}
      onTouchEnd={(e) => {
        e.preventDefault()
        dismiss()
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Message"
      style={{
        ...overlayStyle,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
      }}
    >
      <div style={sheetStyle}>
        <div style={{ fontSize: 15, lineHeight: 1.45, fontWeight: 500 }}>{text}</div>
        <div style={{ fontSize: 12, opacity: 0.5, marginTop: 10, textAlign: 'center' }}>
          Tap to dismiss
        </div>
      </div>
    </div>
  )
}

const overlayStyle: CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  // Cover the bottom unit + train card row
  bottom: 0,
  zIndex: 60,
  padding: '12px 12px max(12px, env(safe-area-inset-bottom, 12px))',
  boxSizing: 'border-box',
  background: 'rgba(0,0,0,0.45)',
  transition: 'opacity 0.22s ease, transform 0.22s ease',
  display: 'flex',
  alignItems: 'flex-end',
  // Tall enough to fully cover the bottom cards row
  minHeight: 140,
}

const sheetStyle: CSSProperties = {
  width: '100%',
  background: 'rgba(12,12,22,0.97)',
  color: '#f0f0f0',
  padding: '18px 16px',
  borderRadius: 14,
  fontFamily: 'system-ui, -apple-system, sans-serif',
  border: '1px solid rgba(255,255,255,0.14)',
  boxShadow: '0 -8px 32px rgba(0,0,0,0.45)',
  boxSizing: 'border-box',
  minHeight: 100,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
}
