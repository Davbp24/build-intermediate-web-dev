import { useState, useCallback } from 'react'
import { PANEL as C, FONT } from '../lib/extensionTheme'

/* ─── Icons ─── */
const IPencil = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="#1C1E26">
    <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zM13.5 6.207 9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5z"/>
    <path d="M6.032 13.575A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/>
  </svg>
)
const IGear = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="#78716c">
    <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
    <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.421 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.421-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.116l.094-.318z"/>
  </svg>
)
const IArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="#78716c">
    <path d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
  </svg>
)
const IExtLink = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="#1C1E26">
    <path d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
    <path d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
  </svg>
)
const IPause = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="#78716c">
    <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"/>
  </svg>
)

/* ─── Toggle Switch ─── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative', width: 44, height: 24, borderRadius: 12,
        background: checked ? C.toggleOn : C.toggleOff,
        border: 'none', cursor: 'pointer', padding: 0,
        transition: 'background 0.2s',
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: checked ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', display: 'block',
      }} />
    </button>
  )
}

interface SettingsProps {
  onClose: () => void
  onOpenDashboard: () => void
}

export default function Settings({ onClose, onOpenDashboard }: SettingsProps) {
  const [screenReader, setScreenReader] = useState(false)
  const [highContrast, setHighContrast] = useState(false)
  const [immersiveReader, setImmersiveReader] = useState(false)
  const [language, setLanguage] = useState('en-US')
  const [paused, setPaused] = useState(false)

  const toggleHighContrast = useCallback((v: boolean) => {
    setHighContrast(v)
    try {
      const body = document.body ?? document.documentElement
      body.style.filter = v ? 'contrast(150%)' : ''
    } catch { /* sandboxed */ }
  }, [])

  const togglePause = useCallback(() => {
    setPaused(p => !p)
  }, [])

  return (
    <div style={{
      width: 300, background: C.bg, border: `1.5px solid ${C.border}`,
      borderRadius: C.radius, boxShadow: C.shadow, fontFamily: FONT,
      overflow: 'hidden', userSelect: 'none', display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', background: C.headerBg,
        borderBottom: `1.5px solid ${C.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IPencil />
          <span style={{ fontSize: 15, fontWeight: 800, color: C.accent, letterSpacing: '-0.02em' }}>Inline</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={() => {}} style={hdrBtn}><IGear /></button>
          <button onClick={onClose} style={hdrBtn}><IArrowRight /></button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '14px 16px', flex: 1 }}>
        <p style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: C.text }}>Global settings</p>

        {/* Accessibility */}
        <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: C.text }}>Accessibility</p>
        <div style={{
          border: `1.5px solid ${C.border}`, borderRadius: 10, overflow: 'hidden',
          marginBottom: 14,
        }}>
          <SettingsRow label="Screen reader" right={<Toggle checked={screenReader} onChange={setScreenReader} />} />
          <SettingsRow label="High contrast" right={<Toggle checked={highContrast} onChange={toggleHighContrast} />} border />
          <SettingsRow label="Immersive reader" right={<Toggle checked={immersiveReader} onChange={setImmersiveReader} />} border />
        </div>

        {/* Language */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', border: `1.5px solid ${C.border}`, borderRadius: 10,
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Language</span>
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            style={{
              padding: '4px 8px', border: `1.5px solid ${C.border}`, borderRadius: 6,
              fontSize: 12, color: C.text, background: C.bg, cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="en-US">English (US)</option>
            <option value="en-GB">English (UK)</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="pt">Português</option>
          </select>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', borderTop: `1.5px solid ${C.border}`,
      }}>
        <button onClick={onOpenDashboard} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          border: 'none', background: 'transparent', cursor: 'pointer',
          fontSize: 13, fontWeight: 600, color: C.text, padding: 0,
        }}>
          All settings <IExtLink />
        </button>
        <button onClick={togglePause} style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: 8,
          border: `1.5px solid ${C.border}`,
          background: paused ? '#fef2f2' : C.bg, cursor: 'pointer',
          color: paused ? '#ef4444' : C.textMuted,
        }}>
          <IPause />
        </button>
      </div>
    </div>
  )
}

function SettingsRow({ label, right, border }: { label: string; right: React.ReactNode; border?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px',
      ...(border ? { borderTop: `1px solid ${C.border}` } : {}),
    }}>
      <span style={{ fontSize: 13, color: C.text }}>{label}</span>
      {right}
    </div>
  )
}

const hdrBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 30, height: 30, border: 'none', borderRadius: 8,
  background: 'transparent', cursor: 'pointer', padding: 0,
}
