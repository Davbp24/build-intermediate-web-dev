import { useState, useCallback } from 'react'
import { PANEL as C, FONT } from '../lib/extensionTheme'

const STAMP_SYMBOLS = ['✓', '✗', '?', '!', '★', '♥', '+', '−', '→', '•']

const IClose = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="#78716c">
    <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/>
  </svg>
)

interface StampsProps {
  onClose: () => void
}

export default function Stamps({ onClose }: StampsProps) {
  const [placing, setPlacing] = useState<string | null>(null)

  const handleStampClick = useCallback((symbol: string) => {
    setPlacing(symbol)
    document.dispatchEvent(new CustomEvent('inline:stampPlace', { detail: { emoji: symbol } }))

    const onPlaced = () => {
      setPlacing(null)
      document.removeEventListener('inline:stampPlaced', onPlaced)
    }
    document.addEventListener('inline:stampPlaced', onPlaced)
  }, [])

  const cancelPlacing = useCallback(() => {
    setPlacing(null)
  }, [])

  return (
    <div style={{
      width: 220, background: C.bg, border: `1px solid ${C.border}`,
      borderRadius: C.radius, boxShadow: C.shadow, fontFamily: FONT,
      overflow: 'hidden', userSelect: 'none',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', background: C.headerBg,
        borderBottom: `1px solid ${C.divider}`,
      }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: C.accent, letterSpacing: '-0.01em' }}>
          Stamps
        </span>
        <button type="button" onClick={onClose} style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 30, height: 30, border: 'none', borderRadius: C.radiusSm,
          background: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0,
        }}><IClose /></button>
      </div>

      {/* Placing indicator */}
      {placing && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px', background: C.toneSelectedBg,
          borderBottom: `1px solid ${C.divider}`,
        }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: C.text }}>
            Click anywhere to place {placing}
          </span>
          <button type="button" onClick={cancelPlacing} style={{
            border: 'none', background: 'transparent', cursor: 'pointer',
            fontSize: 11, fontWeight: 500, color: C.textMuted, fontFamily: FONT,
            padding: '4px 8px', borderRadius: C.radiusPill,
          }}>Cancel</button>
        </div>
      )}

      {/* Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 6, padding: 14,
      }}>
        {STAMP_SYMBOLS.map(sym => (
          <button
            key={sym}
            type="button"
            onClick={() => handleStampClick(sym)}
            style={{
              width: '100%', aspectRatio: '1', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 18, border: `1px solid ${placing === sym ? C.accent : C.border}`,
              borderRadius: C.radiusSm,
              background: placing === sym ? C.toneSelectedBg : C.surfaceBubble,
              cursor: 'pointer', padding: 0,
              transition: 'transform 0.15s, background 0.15s',
              fontFamily: FONT,
            }}
          >{sym}</button>
        ))}
      </div>
    </div>
  )
}
