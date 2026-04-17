import { useState, useCallback } from 'react'
import { PANEL as C, FONT } from '../lib/extensionTheme'
import { wrapSelectionWithHighlight } from '../content/highlightWrap'

const IHighlight = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="#1C1E26">
    <path d="M5.884 6.68a.5.5 0 1 0-.768.64L7.349 10l-2.233 2.68a.5.5 0 0 0 .768.64L8 10.781l2.116 2.54a.5.5 0 0 0 .768-.641L8.651 10l2.233-2.68a.5.5 0 0 0-.768-.64L8 9.219l-2.116-2.54z"/>
    <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/>
  </svg>
)
const IClose = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="#78716c">
    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
  </svg>
)

const SWATCHES = [
  '#93c5fd', '#a5b4fc', '#f9a8d4', '#fca5a5',
  '#fdba74', '#fcd34d', '#86efac', '#6ee7b7',
  '#67e8f9', '#d8b4fe',
]

interface HighlighterProps {
  onClose: () => void
}

export default function Highlighter({ onClose }: HighlighterProps) {
  const [active, setActive] = useState<string>(SWATCHES[0])

  const applyHighlight = useCallback((color: string) => {
    setActive(color)
    wrapSelectionWithHighlight('color', color)
  }, [])

  return (
    <div style={{
      width: 180, background: C.bg, border: `1px solid ${C.border}`,
      borderRadius: C.radius, boxShadow: C.shadow, fontFamily: FONT,
      overflow: 'hidden', userSelect: 'none',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', background: C.headerBg,
        borderBottom: `1px solid ${C.divider}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IHighlight />
          <span style={{ fontSize: 13, fontWeight: 500, color: C.accent, letterSpacing: '-0.02em' }}>Highlighter</span>
        </div>
        <button type="button" onClick={onClose} title="Close" aria-label="Close" style={btnIcon}><IClose /></button>
      </div>

      {/* Color grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 12, padding: '18px 16px 20px',
      }}>
        {SWATCHES.map(color => (
          <button
            key={color} type="button"
            onClick={() => applyHighlight(color)}
            title={`Highlight ${color}`}
            aria-label={`Highlight ${color}`}
            style={{
              width: 32, height: 32, borderRadius: 12,
              background: color, cursor: 'pointer',
              border: active === color ? `3px solid ${C.accent}` : '2px solid rgba(255,255,255,0.9)',
              boxShadow: active === color ? C.shadowSoft : 'none',
              transition: 'transform 0.15s ease, box-shadow 0.15s',
              transform: active === color ? 'scale(1.08)' : 'scale(1)',
            }}
          />
        ))}
      </div>
    </div>
  )
}

const btnIcon: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 32, height: 32, border: 'none', borderRadius: C.radiusSm,
  background: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: 0,
}
