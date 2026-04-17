import { useState, useEffect, useCallback } from 'react'
import { PANEL as C, FONT } from '../lib/extensionTheme'
import { loadLayers, saveLayers, type LayerVisibility } from '../lib/layerState'

const IClose = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="#78716c">
    <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/>
  </svg>
)

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  const title = label ? `${checked ? 'Hide' : 'Show'} ${label}` : undefined
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={title}
      title={title}
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative', width: 48, height: 28, borderRadius: C.radiusPill,
        background: checked ? C.toggleOn : C.toggleOff,
        border: 'none', cursor: 'pointer', padding: 0,
        transition: 'background 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: 'none',
      }}
    >
      <span style={{
        position: 'absolute', top: 4, left: checked ? 24 : 4,
        width: 20, height: 20, borderRadius: '50%', background: '#fff',
        transition: 'left 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'block',
        boxShadow: 'none',
      }} />
    </button>
  )
}

const LAYER_ROWS: { key: keyof LayerVisibility; label: string }[] = [
  { key: 'highlights', label: 'Highlights' },
  { key: 'drawings', label: 'Drawings' },
  { key: 'stickies', label: 'Stickies' },
  { key: 'stamps', label: 'Stamps' },
]

interface LayersProps {
  onClose: () => void
}

export default function Layers({ onClose }: LayersProps) {
  const [layers, setLayers] = useState<LayerVisibility>({
    highlights: true, drawings: true, stickies: true, stamps: true,
  })

  useEffect(() => {
    loadLayers().then(setLayers)
  }, [])

  const handleToggle = useCallback((key: keyof LayerVisibility, value: boolean) => {
    setLayers(prev => {
      const next = { ...prev, [key]: value }
      saveLayers(next)
      document.dispatchEvent(new CustomEvent('inline:layerToggle', { detail: next }))
      return next
    })
  }, [])

  return (
    <div style={{
      width: 240, background: C.bg, border: `1px solid ${C.border}`,
      borderRadius: C.radius, boxShadow: C.shadow, fontFamily: FONT,
      overflow: 'hidden', userSelect: 'none',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', background: C.headerBg,
        borderBottom: `1px solid ${C.divider}`,
      }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: C.accent, letterSpacing: '-0.01em' }}>
          Layers
        </span>
        <button type="button" onClick={onClose} title="Close" aria-label="Close" style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 30, height: 30, border: 'none', borderRadius: C.radiusSm,
          background: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0,
        }}><IClose /></button>
      </div>

      {/* Toggles */}
      <div style={{ padding: '8px 0' }}>
        {LAYER_ROWS.map((row, i) => (
          <div key={row.key} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px',
            ...(i > 0 ? { borderTop: `1px solid ${C.divider}` } : {}),
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: C.text }}>{row.label}</span>
            </div>
            <Toggle checked={layers[row.key]} onChange={v => handleToggle(row.key, v)} label={row.label} />
          </div>
        ))}
      </div>
    </div>
  )
}
