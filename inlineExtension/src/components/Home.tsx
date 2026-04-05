import { useState, useCallback, useRef, useEffect } from 'react'
import Rewrite from './Rewrite'
import AI from './AI'
import Notes from './Notes'
import Settings from './Settings'
import Highlighter from './Highlighter'
import Draw from './Draw'
import { wrapSelectionWithHighlight } from '../content/highlightWrap'

type PanelId = 'rewrite' | 'ai' | 'notes' | 'settings' | 'highlighter' | 'draw' | null

const C = {
  bg: '#ffffff',
  headerBg: '#f0f9ff',
  border: '#e2e8f0',
  shadow: '4px 4px 0px #E2E8F0',
  text: '#0f172a',
  textMuted: '#64748b',
  accent: '#2563eb',
  radius: 12,
  hoverBg: '#f1f5f9',
}

/* ─── Mini icons for the bottom bar ─── */
const IRewrite = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3z"/>
    <path d="M13.5 6.207 9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5z"/>
  </svg>
)
const IAi = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M7.657 6.247c.11-.33.576-.33.686 0l.645 1.937a2.89 2.89 0 0 0 1.829 1.828l1.936.645c.33.11.33.576 0 .686l-1.937.645a2.89 2.89 0 0 0-1.828 1.829l-.645 1.936a.361.361 0 0 1-.686 0l-.645-1.937a2.89 2.89 0 0 0-1.828-1.828l-1.937-.645a.361.361 0 0 1 0-.686l1.937-.645a2.89 2.89 0 0 0 1.828-1.829l.645-1.936z"/>
  </svg>
)
const INotes = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H4z"/>
    <path d="M5 4h6v1H5V4zm0 3h6v1H5V7zm0 3h4v1H5v-1z"/>
  </svg>
)
const IDraw = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M15.825.12a.5.5 0 0 1 .132.584c-1.53 3.43-4.743 8.17-7.095 10.64a6.067 6.067 0 0 1-2.373 1.534c-.018.227-.06.538-.16.868-.201.659-.667 1.479-1.708 1.74a8.118 8.118 0 0 1-3.078.132 3.659 3.659 0 0 1-.562-.135 1.382 1.382 0 0 1-.466-.247.714.714 0 0 1-.204-.288.622.622 0 0 1 .004-.443c.095-.245.316-.38.461-.452.394-.197.625-.453.867-.826.095-.144.184-.297.287-.472l.117-.198c.151-.255.326-.54.546-.848.528-.739 1.201-.925 1.746-.896.126.007.243.025.348.048.062-.172.142-.38.238-.608.261-.619.658-1.419 1.187-2.069 2.176-2.67 6.18-6.206 9.117-8.104a.5.5 0 0 1 .596.04z"/>
  </svg>
)
const IHighlight = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M5.884 6.68a.5.5 0 1 0-.768.64L7.349 10l-2.233 2.68a.5.5 0 0 0 .768.64L8 10.781l2.116 2.54a.5.5 0 0 0 .768-.641L8.651 10l2.233-2.68a.5.5 0 0 0-.768-.64L8 9.219l-2.116-2.54z"/>
  </svg>
)
const ISettings = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
    <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319z"/>
  </svg>
)

interface HomeProps {
  selectedText: string
  originalRange: Range | null
}

export default function Home({ selectedText, originalRange }: HomeProps) {
  const [activePanel, setActivePanel] = useState<PanelId>(null)
  const [pos, setPos] = useState({ x: 40, y: 40 })
  const [notesOpen, setNotesOpen] = useState<{ x: number; y: number }[]>([])
  const dragRef = useRef<{ ox: number; oy: number } | null>(null)

  const toggle = useCallback((id: PanelId) => {
    if (id === 'notes') {
      setNotesOpen(prev => [...prev, { x: 120 + prev.length * 20, y: 120 + prev.length * 20 }])
      return
    }
    setActivePanel(p => p === id ? null : id)
  }, [])

  const closePanel = useCallback(() => setActivePanel(null), [])

  useEffect(() => {
    function handleFeature(e: Event) {
      const detail = (e as CustomEvent).detail as { featureId: string; selectedText: string }
      switch (detail.featureId) {
        case 'highlight':
          wrapSelectionWithHighlight('extract')
          break
        case 'rewrite':
          setActivePanel('rewrite')
          break
        case 'ai':
          setActivePanel('ai')
          break
        case 'draw':
          setActivePanel('draw')
          break
        case 'notes':
          setNotesOpen(prev => [...prev, { x: 120 + prev.length * 20, y: 120 + prev.length * 20 }])
          break
      }
    }
    document.addEventListener('inline:feature', handleFeature)
    return () => document.removeEventListener('inline:feature', handleFeature)
  }, [])

  /* drag the main bar */
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    dragRef.current = { ox: e.clientX - pos.x, oy: e.clientY - pos.y }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [pos])
  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return
    setPos({ x: e.clientX - dragRef.current.ox, y: e.clientY - dragRef.current.oy })
  }, [])
  const onPointerUp = useCallback(() => { dragRef.current = null }, [])

  const TOOLS: { id: PanelId; icon: React.ReactNode; label: string }[] = [
    { id: 'rewrite', icon: <IRewrite />, label: 'Rewrite' },
    { id: 'ai', icon: <IAi />, label: 'Ask AI' },
    { id: 'notes', icon: <INotes />, label: 'Note' },
    { id: 'draw', icon: <IDraw />, label: 'Draw' },
    { id: 'highlighter', icon: <IHighlight />, label: 'Color' },
    { id: 'settings', icon: <ISettings />, label: 'Settings' },
  ]

  return (
    <>
      {/* ─── Main floating toolbar ─── */}
      <div style={{
        position: 'fixed', left: pos.x, top: pos.y,
        zIndex: 2147483646, pointerEvents: 'auto',
      }}>
        {/* Toolbar bar */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{
            display: 'flex', alignItems: 'center',
            background: C.bg, border: `1.5px solid ${C.border}`,
            borderRadius: C.radius, boxShadow: C.shadow,
            padding: '4px 6px', gap: 2, touchAction: 'none',
            cursor: 'grab', fontFamily: 'system-ui, sans-serif',
          }}
        >
          {TOOLS.map(t => (
            <button
              key={t.id}
              onPointerDown={e => e.stopPropagation()}
              onClick={() => toggle(t.id)}
              title={t.label}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 34, height: 34, borderRadius: 8, border: 'none',
                background: activePanel === t.id ? '#eff6ff' : 'transparent',
                color: activePanel === t.id ? C.accent : C.textMuted,
                cursor: 'pointer', transition: 'background 0.1s, color 0.1s',
              }}
            >{t.icon}</button>
          ))}
        </div>

        {/* Active panel (floats below toolbar) */}
        {activePanel && activePanel !== 'notes' && (
          <div style={{ marginTop: 8 }}>
            {activePanel === 'rewrite' && (
              <Rewrite selectedText={selectedText} originalRange={originalRange} onClose={closePanel} />
            )}
            {activePanel === 'ai' && (
              <AI selectedText={selectedText} onClose={closePanel} />
            )}
            {activePanel === 'settings' && (
              <Settings
                onClose={closePanel}
                onOpenDashboard={() => { window.open('http://localhost:3000', '_blank'); closePanel() }}
              />
            )}
            {activePanel === 'highlighter' && (
              <Highlighter onClose={closePanel} />
            )}
            {activePanel === 'draw' && (
              <Draw onClose={closePanel} />
            )}
          </div>
        )}
      </div>

      {/* ─── Independent Notes panels ─── */}
      {notesOpen.map((n, i) => (
        <Notes
          key={i}
          initialX={n.x}
          initialY={n.y}
          onClose={() => setNotesOpen(prev => prev.filter((_, idx) => idx !== i))}
        />
      ))}
    </>
  )
}
