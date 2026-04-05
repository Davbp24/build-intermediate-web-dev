import { useState, useCallback } from 'react'
import Rewrite from './Rewrite'
import AI from './AI'
import Notes from './Notes'
import Settings from './Settings'
import Highlighter from './Highlighter'
import Draw from './Draw'

type PanelId = 'rewrite' | 'ai' | 'notes' | 'settings' | 'highlighter' | 'draw' | null

const ACCENT = '#1C1E26'
const FONT = '-apple-system, BlinkMacSystemFont, "Inter", system-ui, sans-serif'

const IRewrite = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
  </svg>
)
const IAi = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"/>
  </svg>
)
const INotes = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <line x1="10" y1="9" x2="8" y2="9"/>
  </svg>
)
const IDraw = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19l7-7 3 3-7 7-3-3z"/>
    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
    <path d="M2 2l7.586 7.586"/>
    <circle cx="11" cy="11" r="2"/>
  </svg>
)
const IHighlight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l-6 6v3h9l3-3"/>
    <path d="M22 12l-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>
  </svg>
)
const ISettings = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
  </svg>
)

interface HomeProps {
  selectedText: string
  originalRange: Range | null
}

export default function Home({ selectedText, originalRange }: HomeProps) {
  const [hoveredPanel, setHoveredPanel] = useState<PanelId>(null)
  const [pinnedPanel, setPinnedPanel] = useState<PanelId>(null)
  const [notesOpen, setNotesOpen] = useState<{ x: number; y: number }[]>([])

  const activePanel = pinnedPanel ?? hoveredPanel

  const toggle = useCallback((id: PanelId) => {
    if (id === 'notes') {
      setNotesOpen(prev => [...prev, { x: 120 + prev.length * 20, y: 120 + prev.length * 20 }])
      return
    }
    setPinnedPanel(p => p === id ? null : id)
  }, [])

  const closePanel = useCallback(() => {
    setPinnedPanel(null)
    setHoveredPanel(null)
  }, [])

  const TOOLS: { id: PanelId; icon: React.ReactNode; label: string }[] = [
    { id: 'rewrite', icon: <IRewrite />, label: 'Rewrite' },
    { id: 'ai', icon: <IAi />, label: 'Ask AI' },
    { id: 'notes', icon: <INotes />, label: 'Note' },
    { id: 'draw', icon: <IDraw />, label: 'Draw' },
    { id: 'highlighter', icon: <IHighlight />, label: 'Highlight' },
    { id: 'settings', icon: <ISettings />, label: 'Settings' },
  ]

  return (
    <>
      {/* Vertical sidebar bar - right edge, vertically centered */}
      <div
        style={{
          position: 'fixed',
          right: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 2147483647,
          pointerEvents: 'auto',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          fontFamily: FONT,
        }}
        onMouseLeave={() => { if (!pinnedPanel) setHoveredPanel(null) }}
      >
        {/* Flyout panel - appears to the LEFT of the bar */}
        {activePanel && activePanel !== 'notes' && (
          <div
            style={{ marginRight: 8, pointerEvents: 'auto' }}
            onMouseEnter={() => { if (!pinnedPanel) setHoveredPanel(activePanel) }}
          >
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

        {/* The slim dark vertical pill */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            padding: '10px 6px',
            background: ACCENT,
            borderRadius: 28,
            boxShadow: '0 4px 24px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.12)',
          }}
        >
          {/* Logo mark at top */}
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 4,
            }}
          >
            <div style={{
              width: 4,
              height: 16,
              borderRadius: 2,
              background: 'rgba(255,255,255,0.7)',
              transform: 'rotate(-12deg)',
            }} />
          </div>

          {/* Separator */}
          <div style={{ width: 16, height: 1, background: 'rgba(255,255,255,0.12)', margin: '2px 0 4px' }} />

          {/* Tool buttons */}
          {TOOLS.map(t => {
            const isActive = activePanel === t.id
            return (
              <button
                key={t.id}
                onClick={() => toggle(t.id)}
                onMouseEnter={() => { if (!pinnedPanel) setHoveredPanel(t.id) }}
                title={t.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: 'none',
                  background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: isActive ? '#ffffff' : 'rgba(255,255,255,0.55)',
                  cursor: 'pointer',
                  transition: 'background 0.15s, color 0.15s',
                  padding: 0,
                }}
              >{t.icon}</button>
            )
          })}
        </div>
      </div>

      {/* Independent Notes panels */}
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
