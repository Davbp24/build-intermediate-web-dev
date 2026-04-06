import type React from 'react'
import { useState, useCallback } from 'react'

const C = {
  bg: '#ffffff',
  headerBg: '#fdf2f8',
  border: '#e2e8f0',
  shadow: '4px 4px 0px #E2E8F0',
  text: '#0f172a',
  textMuted: '#64748b',
  accent: '#ec4899',
  radius: 12,
}

const IHighlight = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="#ec4899">
    <path d="M5.884 6.68a.5.5 0 1 0-.768.64L7.349 10l-2.233 2.68a.5.5 0 0 0 .768.64L8 10.781l2.116 2.54a.5.5 0 0 0 .768-.641L8.651 10l2.233-2.68a.5.5 0 0 0-.768-.64L8 9.219l-2.116-2.54z"/>
    <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/>
  </svg>
)
const IClose = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="#64748b">
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
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !sel.toString().trim()) return

    const range = sel.getRangeAt(0)
    const span = document.createElement('span')
    span.setAttribute('data-inline-highlight', 'color')
    span.style.backgroundColor = color
    span.style.borderRadius = '3px'
    span.style.padding = '0 2px'
    span.title = 'Highlighted by Inline'
    try {
      range.surroundContents(span)
    } catch {
      const contents = range.extractContents()
      span.appendChild(contents)
      range.insertNode(span)
    }
    // Double-click to unhighlight
    span.style.cursor = 'pointer'
    span.addEventListener('dblclick', (e) => {
      e.preventDefault()
      e.stopPropagation()
      const text = span.textContent ?? ''
      const parent = span.parentNode
      if (parent) {
        parent.replaceChild(document.createTextNode(text), span)
        parent.normalize()
      }
    })
    sel.removeAllRanges()
  }, [])

  return (
    <div style={{
      width: 200, background: C.bg, border: `1.5px solid ${C.border}`,
      borderRadius: C.radius, boxShadow: C.shadow, fontFamily: 'system-ui, sans-serif',
      overflow: 'hidden', userSelect: 'none',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', background: C.headerBg,
        borderBottom: `1.5px solid ${C.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IHighlight />
          <span style={{ fontSize: 12, fontWeight: 700, color: C.accent }}>Highlighter</span>
        </div>
        <button onClick={onClose} style={btnIcon}><IClose /></button>
      </div>

      {/* Color grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 8, padding: 14,
      }}>
        {SWATCHES.map(color => (
          <button
            key={color}
            onClick={() => applyHighlight(color)}
            style={{
              width: 28, height: 28, borderRadius: 6,
              background: color, cursor: 'pointer',
              border: active === color ? '2.5px solid #0f172a' : '2px solid transparent',
              transition: 'border-color 0.1s',
            }}
          />
        ))}
      </div>
    </div>
  )
}

const btnIcon: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 24, height: 24, border: 'none', borderRadius: 6,
  background: 'transparent', cursor: 'pointer', padding: 0,
}
