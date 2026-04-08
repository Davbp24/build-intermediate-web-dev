import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Rewrite from './Rewrite'
import AI from './AI'
import Notes from './Notes'
import Settings from './Settings'
import Highlighter from './Highlighter'
import Draw from './Draw'
import CommandPalette from './CommandPalette'
import Layers from './Layers'
import Stamps from './Stamps'
import Search from './Search'
import CropOverlay from './CropOverlay'
import Laser from './Laser'
import SharePanel from './SharePanel'
import Handwriting from './Handwriting'

type PanelId = 'rewrite' | 'ai' | 'notes' | 'settings' | 'highlighter' | 'draw' | 'layers' | 'stamps' | 'search' | 'screenshot' | 'laser' | 'share' | 'handwriting' | null

const ACCENT = '#1C1E26'
const FONT = '-apple-system, BlinkMacSystemFont, "Inter", system-ui, sans-serif'

const pillSpring = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
  mass: 0.7,
}

const panelTransition = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 32,
  mass: 0.5,
}

const IRewrite = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
  </svg>
)
const IAi = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"/>
  </svg>
)
const INotes = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <line x1="10" y1="9" x2="8" y2="9"/>
  </svg>
)
const IDraw = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19l7-7 3 3-7 7-3-3z"/>
    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
    <path d="M2 2l7.586 7.586"/>
    <circle cx="11" cy="11" r="2"/>
  </svg>
)
const IHighlight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l-6 6v3h9l3-3"/>
    <path d="M22 12l-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>
  </svg>
)
const ISettings = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
  </svg>
)
const ILayers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/>
    <polyline points="2 17 12 22 22 17"/>
    <polyline points="2 12 12 17 22 12"/>
  </svg>
)
const IStamps = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)
const ISearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const IScreenshot = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
)
const ILaser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="2" fill="currentColor"/>
    <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
  </svg>
)
const IShare = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
)
const IHandwriting = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
    <path d="M2 22c2-2 4-3.5 6-3.5s3 1 5 1 4-1.5 6-3.5"/>
  </svg>
)
const INotebook = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
)
const IEyeOff = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)
const IEye = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)

function Tooltip({ text, visible }: { text: string; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 6, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 6, scale: 0.95 }}
          transition={{ duration: 0.1, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            right: '100%',
            marginRight: 10,
            whiteSpace: 'nowrap',
            background: ACCENT,
            color: 'rgba(255,255,255,0.88)',
            fontSize: 11,
            fontWeight: 500,
            fontFamily: FONT,
            padding: '5px 10px',
            borderRadius: 8,
            pointerEvents: 'none',
            letterSpacing: '-0.01em',
            lineHeight: 1,
            boxShadow: '0 4px 12px -2px rgba(0,0,0,0.2)',
          }}
        >
          {text}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const PILL_W = 38

interface HomeProps {
  selectedText: string
  originalRange: Range | null
}

export default function Home({ selectedText, originalRange }: HomeProps) {
  const [pinnedPanel, setPinnedPanel] = useState<PanelId>(null)
  const [notesOpen, setNotesOpen] = useState<{ x: number; y: number }[]>([])
  const [pillCollapsed, setPillCollapsed] = useState(false)
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false)
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)
  const [laserActive, setLaserActive] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [hoveredTool, setHoveredTool] = useState<string | null>(null)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const activePanel = pinnedPanel

  const toggle = useCallback((id: PanelId) => {
    if (id === 'notes') {
      setNotesOpen(prev => [...prev, { x: 120 + prev.length * 20, y: 120 + prev.length * 20 }])
      return
    }
    if (id === 'screenshot') {
      chrome.runtime.sendMessage({ type: 'CAPTURE_TAB' }, (response) => {
        if (response?.ok && response.dataUrl) {
          setScreenshotUrl(response.dataUrl)
        }
      })
      return
    }
    if (id === 'laser') {
      setLaserActive(prev => !prev)
      return
    }
    setPinnedPanel(p => p === id ? null : id)
  }, [])

  const closePanel = useCallback(() => {
    setPinnedPanel(null)
  }, [])

  const togglePillCollapse = useCallback(() => {
    setPillCollapsed((c) => {
      const next = !c
      if (next) closePanel()
      return next
    })
  }, [closePanel])

  const toggleHidden = useCallback(() => {
    setHidden(h => {
      const next = !h
      if (next) {
        closePanel()
        setPillCollapsed(false)
        setLaserActive(false)
        setScreenshotUrl(null)
        document.dispatchEvent(new CustomEvent('inline:hideAll', { detail: { hidden: true } }))
      } else {
        document.dispatchEvent(new CustomEvent('inline:hideAll', { detail: { hidden: false } }))
      }
      return next
    })
  }, [closePanel])

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ hidden: boolean }>).detail
      setHidden(detail.hidden)
      if (detail.hidden) {
        closePanel()
        setPillCollapsed(false)
        setLaserActive(false)
        setScreenshotUrl(null)
      }
    }
    document.addEventListener('inline:hideAll', handler)
    return () => document.removeEventListener('inline:hideAll', handler)
  }, [closePanel])

  const handleHoverStart = useCallback((label: string) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    hoverTimerRef.current = setTimeout(() => setHoveredTool(label), 150)
  }, [])

  const handleHoverEnd = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    setHoveredTool(null)
  }, [])

  const TOOLS: { id: PanelId; icon: React.ReactNode; label: string }[] = [
    { id: 'rewrite', icon: <IRewrite />, label: 'Rewrite' },
    { id: 'ai', icon: <IAi />, label: 'Ask AI' },
    { id: 'notes', icon: <INotes />, label: 'Sticky note' },
    { id: 'draw', icon: <IDraw />, label: 'Draw' },
    { id: 'highlighter', icon: <IHighlight />, label: 'Highlight' },
    { id: 'layers', icon: <ILayers />, label: 'Layers' },
    { id: 'stamps', icon: <IStamps />, label: 'Stamps' },
    { id: 'search', icon: <ISearch />, label: 'Search' },
    { id: 'screenshot', icon: <IScreenshot />, label: 'Screenshot' },
    { id: 'laser', icon: <ILaser />, label: 'Laser pointer' },
    { id: 'share', icon: <IShare />, label: 'Share' },
    { id: 'handwriting', icon: <IHandwriting />, label: 'Handwriting' },
    { id: 'settings', icon: <ISettings />, label: 'Settings' },
  ]

  const handlePaletteAction = useCallback(
    (actionId: string) => {
      switch (actionId) {
        case 'rewrite':
        case 'ai':
        case 'notes':
        case 'draw':
        case 'highlighter':
        case 'settings':
        case 'layers':
        case 'stamps':
        case 'search':
        case 'screenshot':
        case 'laser':
        case 'share':
        case 'handwriting':
          toggle(actionId)
          break
        case 'notebooks':
          window.open('http://localhost:3000/dashboard', '_blank')
          break
        case 'collapse':
        case 'pause':
          togglePillCollapse()
          break
      }
      setCmdPaletteOpen(false)
    },
    [toggle, togglePillCollapse],
  )

  useEffect(() => {
    const handleCommand = (e: Event) => {
      const command = (e as CustomEvent<{ command: string }>).detail.command
      switch (command) {
        case 'toggle-command-palette':
          setCmdPaletteOpen((v) => !v)
          break
        case 'toggle-rewrite':
          toggle('rewrite')
          break
        case 'toggle-ai':
          toggle('ai')
          break
        case 'toggle-highlighter':
          toggle('highlighter')
          break
        case 'new-note':
          toggle('notes')
          break
        case 'toggle-pause':
          togglePillCollapse()
          break
      }
    }
    document.addEventListener('inline:command', handleCommand)
    return () => document.removeEventListener('inline:command', handleCommand)
  }, [toggle, togglePillCollapse])

  useEffect(() => {
    const handleKb = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCmdPaletteOpen((v) => !v)
      }
    }
    document.addEventListener('keydown', handleKb)
    return () => document.removeEventListener('keydown', handleKb)
  }, [])

  const panelContent = activePanel && activePanel !== 'notes' && activePanel !== 'screenshot' && activePanel !== 'laser' ? (
    <motion.div
      key={activePanel}
      initial={{ opacity: 0, x: 12, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 12, scale: 0.97 }}
      transition={panelTransition}
      style={{
        marginRight: 8,
        pointerEvents: 'auto',
        maxHeight: 'calc(100vh - 40px)',
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollbarWidth: 'none',
      }}
    >
      {activePanel === 'rewrite' && <Rewrite selectedText={selectedText} originalRange={originalRange} onClose={closePanel} />}
      {activePanel === 'ai' && <AI selectedText={selectedText} originalRange={originalRange} onClose={closePanel} />}
      {activePanel === 'settings' && <Settings onClose={closePanel} onOpenDashboard={() => { window.open('http://localhost:3000', '_blank'); closePanel() }} />}
      {activePanel === 'highlighter' && <Highlighter onClose={closePanel} />}
      {activePanel === 'draw' && <Draw onClose={closePanel} />}
      {activePanel === 'layers' && <Layers onClose={closePanel} />}
      {activePanel === 'stamps' && <Stamps onClose={closePanel} />}
      {activePanel === 'search' && <Search onClose={closePanel} />}
      {activePanel === 'share' && <SharePanel onClose={closePanel} />}
      {activePanel === 'handwriting' && <Handwriting onClose={closePanel} />}
    </motion.div>
  ) : null

  return (
    <>
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
      >
        <AnimatePresence mode="wait">
          {!hidden && panelContent}
        </AnimatePresence>

        {hidden && (
          <motion.button
            type="button"
            onClick={toggleHidden}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={pillSpring}
            title="Show extension"
            style={{
              width: PILL_W,
              height: PILL_W,
              borderRadius: '50%',
              background: ACCENT,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.7)',
              boxShadow: '0 4px 16px -4px rgba(28,30,38,0.22)',
              padding: 0,
              outline: 'none',
            }}
          >
            <IEye />
          </motion.button>
        )}

        {!hidden && (
          <motion.div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: PILL_W,
              background: ACCENT,
              borderRadius: PILL_W / 2,
              overflow: 'hidden',
              boxShadow: '0 4px 20px -6px rgba(28,30,38,0.22)',
            }}
            animate={{
              paddingTop: pillCollapsed ? 5 : 5,
              paddingBottom: pillCollapsed ? 5 : 5,
            }}
            transition={pillSpring}
          >
            <motion.button
              type="button"
              onClick={togglePillCollapse}
              title={pillCollapsed ? 'Expand toolbar' : 'Collapse toolbar'}
              aria-expanded={!pillCollapsed}
              transition={pillSpring}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: 0,
                flexShrink: 0,
              }}
            >
              <div style={{
                width: 3,
                height: 14,
                borderRadius: 2,
                background: 'rgba(255,255,255,0.55)',
                transform: 'rotate(-12deg)',
              }} />
            </motion.button>

            <motion.div
              initial={false}
              animate={
                pillCollapsed
                  ? { height: 0, opacity: 0 }
                  : { height: 'auto', opacity: 1 }
              }
              transition={pillSpring}
              style={{
                overflow: 'hidden',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transformOrigin: 'top center',
                pointerEvents: pillCollapsed ? 'none' : 'auto',
              }}
            >
              <div style={{ width: 16, height: 1, background: 'rgba(255,255,255,0.08)', margin: '2px 0 3px' }} />

              <div
                style={{
                  maxHeight: 'min(64vh, 460px)',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  scrollbarWidth: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0,
                  width: '100%',
                }}
              >
                {TOOLS.map(t => {
                  const isActive = activePanel === t.id
                  return (
                    <div key={t.id} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Tooltip text={t.label} visible={hoveredTool === t.label && !isActive} />
                      <button
                        onClick={() => toggle(t.id)}
                        onMouseEnter={() => handleHoverStart(t.label)}
                        onMouseLeave={handleHoverEnd}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          border: 'none',
                          background: isActive ? 'rgba(255,255,255,0.14)' : 'transparent',
                          color: isActive ? '#ffffff' : 'rgba(255,255,255,0.48)',
                          cursor: 'pointer',
                          transition: 'background 0.15s, color 0.15s',
                          padding: 0,
                          flexShrink: 0,
                        }}
                      >{t.icon}</button>
                    </div>
                  )
                })}

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Tooltip text="Notebooks" visible={hoveredTool === 'Notebooks'} />
                  <button
                    onClick={() => window.open('http://localhost:3000/dashboard', '_blank')}
                    onMouseEnter={() => handleHoverStart('Notebooks')}
                    onMouseLeave={handleHoverEnd}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      border: 'none',
                      background: 'transparent',
                      color: 'rgba(255,255,255,0.48)',
                      cursor: 'pointer',
                      transition: 'background 0.15s, color 0.15s',
                      padding: 0,
                      flexShrink: 0,
                    }}
                  ><INotebook /></button>
                </div>

                <div style={{ width: 16, height: 1, background: 'rgba(255,255,255,0.08)', margin: '3px 0' }} />

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Tooltip text="Hide extension" visible={hoveredTool === 'Hide extension'} />
                  <button
                    onClick={toggleHidden}
                    onMouseEnter={() => handleHoverStart('Hide extension')}
                    onMouseLeave={handleHoverEnd}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      border: 'none',
                      background: 'transparent',
                      color: 'rgba(255,255,255,0.48)',
                      cursor: 'pointer',
                      transition: 'background 0.15s, color 0.15s',
                      padding: 0,
                      flexShrink: 0,
                    }}
                  >
                    <IEyeOff />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>

      {!hidden && notesOpen.map((n, i) => (
        <Notes
          key={i}
          initialX={n.x}
          initialY={n.y}
          onClose={() => setNotesOpen(prev => prev.filter((_, idx) => idx !== i))}
        />
      ))}

      {cmdPaletteOpen && (
        <CommandPalette
          onClose={() => setCmdPaletteOpen(false)}
          onAction={handlePaletteAction}
        />
      )}

      {!hidden && screenshotUrl && (
        <CropOverlay screenshot={screenshotUrl} onClose={() => setScreenshotUrl(null)} />
      )}

      {!hidden && laserActive && (
        <Laser onClose={() => setLaserActive(false)} />
      )}
    </>
  )
}
