import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react'
import { wrapSelectionWithHighlight } from './highlightWrap'
import { loadSettings } from '../lib/extensionSettings'
import { speakWithElevenLabs } from '../lib/elevenLabsTts'
import { fetchViaBackground } from '../lib/backgroundFetch'

type Pt = { x: number; y: number }
type AnchorNote = { id: string; x: number; y: number; text: string }
type SubPanel = 'rewrite' | 'insight' | null

/* ─── window.ai ─── */
async function tryWindowAi(task: string, text: string): Promise<string | null> {
  const w = window as unknown as {
    ai?: { languageModel?: { create?: () => Promise<{ prompt: (s: string) => Promise<string> }> } }
  }
  try {
    const create = w.ai?.languageModel?.create
    if (!create) return null
    const session = await create.call(w.ai!.languageModel!)
    const prompt =
      task === 'summarize' ? `Summarize in 3 short bullets:\n\n${text}` :
      task === 'shorten'   ? `Shorten by ~40%, keep meaning:\n\n${text}` :
      `Rewrite clearly, same meaning:\n\n${text}`
    return await session.prompt(prompt.slice(0, 8000))
  } catch { return null }
}

async function serverTask(
  apiBase: string, token: string, task: string, text: string, instruction?: string,
): Promise<string | null> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) h.Authorization = `Bearer ${token}`
  try {
    const res = await fetchViaBackground(`${apiBase}/api/ai/extension-light`, {
      method: 'POST', headers: h,
      body: JSON.stringify({ task, text, instruction }),
    })
    if (!res.ok) {
      try {
        const body = await res.json<{ error?: string }>()
        if (body.error) return `[Error] ${body.error}`
      } catch { /* non-JSON body */ }
      return null
    }
    const body = await res.json<{ result?: string }>()
    return body.result ?? null
  } catch (err) {
    return `[Error] ${err instanceof Error ? err.message : 'AI request failed'}`
  }
}

/* ─── Theme ─── */
const DARK = '#1C1E26'
const CREAM = '#FDFBF7'
const BORDER = 'rgba(255,255,255,0.12)'
const MUTED = 'rgba(255,255,255,0.5)'
const FONT = '-apple-system, BlinkMacSystemFont, "Inter", system-ui, sans-serif'

/* ─── SVG icons (stroke style, 16×16) ─── */
const IHighlight = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l-6 6v3h9l3-3"/>
    <path d="M22 12l-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>
  </svg>
)
const IEdit = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
  </svg>
)
const IGrid = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
  </svg>
)
const IAlert = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const IMapPin = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
)
const ITag = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
)
const IVolume = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
  </svg>
)
const IAi = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"/>
  </svg>
)
const INote = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
)

/* ─── Separator (vertical line between groups) ─── */
const Sep = () => (
  <div style={{ width: 1, height: 20, background: BORDER, margin: '0 4px', flexShrink: 0 }} />
)

/* ─── Toolbar button ─── */
function TBtn({
  children, active, onClick, title, isText,
}: {
  children: React.ReactNode
  active?: boolean
  onClick: () => void
  title?: string
  isText?: boolean
}) {
  const [hov, setHov] = useState(false)
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={isText ? {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        padding: '5px 10px', border: 'none', borderRadius: 6,
        background: hov ? 'rgba(255,255,255,0.12)' : 'transparent',
        color: hov ? '#ffffff' : MUTED,
        fontSize: 11, fontWeight: 600,
        fontFamily: FONT,
        cursor: 'pointer', lineHeight: 1, whiteSpace: 'nowrap',
        transition: 'background 0.15s, color 0.15s',
        letterSpacing: '0.02em',
      } : {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        padding: '6px', border: 'none', borderRadius: 6,
        background: active ? 'rgba(255,255,255,0.15)' : hov ? 'rgba(255,255,255,0.08)' : 'transparent',
        color: active ? '#ffffff' : hov ? '#ffffff' : MUTED,
        cursor: 'pointer', lineHeight: 1,
        transition: 'background 0.15s, color 0.15s',
      }}
    >
      {children}
    </button>
  )
}

/* ─── Context menu item ─── */
type CtxItem = { label: string; icon: React.ReactNode; action: () => void; danger?: boolean }

function ContextMenuItem({ item }: { item: CtxItem }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      type="button"
      onClick={item.action}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', padding: '8px 12px', border: 'none',
        borderRadius: 6,
        background: hov ? 'rgba(255,255,255,0.08)' : 'transparent',
        color: item.danger ? '#ef4444' : hov ? '#ffffff' : 'rgba(255,255,255,0.7)',
        fontSize: 12, fontWeight: 500, cursor: 'pointer',
        fontFamily: FONT, textAlign: 'left',
        transition: 'background 0.12s, color 0.12s',
      }}
    >
      <span style={{ display: 'flex', opacity: 0.7 }}>{item.icon}</span>
      {item.label}
    </button>
  )
}

/* ─── Main component ─── */
export default function SmartOverlay() {
  const [toolbar, setToolbar] = useState<Pt | null>(null)
  const [subPanel, setSubPanel] = useState<SubPanel>(null)
  const [subInput, setSubInput] = useState('')
  const [riskOpen, setRiskOpen] = useState(false)
  const [riskText, setRiskText] = useState('')
  const [riskLoading, setRiskLoading] = useState(false)
  const [spatialOpen, setSpatialOpen] = useState(false)
  const [spatialAddr, setSpatialAddr] = useState('')
  const [spatialNote, setSpatialNote] = useState('')
  const [anchors, setAnchors] = useState<AnchorNote[]>([])
  const [anchorsLoaded, setAnchorsLoaded] = useState(false)
  const [ctxMenu, setCtxMenu] = useState<Pt | null>(null)
  const [aiResult, setAiResult] = useState<{ title: string; body: string; loading?: boolean } | null>(null)
  const dragRef = useRef<{ id: string; ox: number; oy: number } | null>(null)
  const selRef = useRef('')
  const subInputRef = useRef<HTMLInputElement>(null)
  const anchorSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* ── Load persisted anchor notes on mount ── */
  useEffect(() => {
    if (!chrome.runtime?.id) { setAnchorsLoaded(true); return }
    chrome.runtime.sendMessage(
      { type: 'LOAD_ANNOTATIONS', payload: { pageUrl: window.location.href } },
      (response) => {
        if (chrome.runtime.lastError) {
          setAnchorsLoaded(true); return
        }
        const saved = response?.data?.elements?.anchorNotes as AnchorNote[] | undefined
        if (Array.isArray(saved)) setAnchors(saved)
        setAnchorsLoaded(true)
      },
    )
  }, [])

  /* ── Debounced persist for anchor notes ── */
  useEffect(() => {
    if (!anchorsLoaded) return
    if (anchorSaveTimer.current) clearTimeout(anchorSaveTimer.current)
    anchorSaveTimer.current = setTimeout(() => {
      if (!chrome.runtime?.id) return
      chrome.runtime.sendMessage(
        {
          type: 'SAVE_ANNOTATIONS',
          payload: {
            pageUrl: window.location.href,
            featureKey: 'anchorNotes',
            data: anchors,
            pageTitle: document.title,
            domain: window.location.hostname,
            clearedAt: anchors.length === 0 ? Date.now() : null,
          },
        },
        () => { if (chrome.runtime.lastError) { /* ignore */ } },
      )
    }, 500)
    return () => {
      if (anchorSaveTimer.current) clearTimeout(anchorSaveTimer.current)
    }
  }, [anchors, anchorsLoaded])

  const refreshSelection = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      setToolbar(null); setSubPanel(null); selRef.current = ''; return
    }
    const range = sel.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    if (!rect.width && !rect.height) { setToolbar(null); return }
    selRef.current = sel.toString()
    setToolbar({ x: rect.left + rect.width / 2, y: rect.top + window.scrollY })
  }, [])

  useEffect(() => {
    const up = () => requestAnimationFrame(refreshSelection)
    document.addEventListener('mouseup', up)
    document.addEventListener('keyup', up)
    return () => { document.removeEventListener('mouseup', up); document.removeEventListener('keyup', up) }
  }, [refreshSelection])

  /* Right-click context menu */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || !sel.toString().trim()) return
      e.preventDefault()
      selRef.current = sel.toString()
      setCtxMenu({ x: e.clientX, y: e.clientY })
    }
    const dismiss = () => setCtxMenu(null)
    document.addEventListener('contextmenu', handler)
    document.addEventListener('click', dismiss)
    return () => {
      document.removeEventListener('contextmenu', handler)
      document.removeEventListener('click', dismiss)
    }
  }, [])

  useEffect(() => {
    const onMsg = (msg: { type?: string }) => {
      if (msg?.type !== 'INLINE_PAGE_RISK') return
      runPageRisk()
    }
    chrome.runtime.onMessage.addListener(onMsg)
    return () => chrome.runtime.onMessage.removeListener(onMsg)
  }, [])

  useEffect(() => {
    if (subPanel) setTimeout(() => subInputRef.current?.focus(), 60)
  }, [subPanel])

  function toggleSub(panel: SubPanel) {
    setSubPanel(p => p === panel ? null : panel)
    setSubInput('')
  }

  async function runAiTask(task: 'summarize' | 'rewrite' | 'shorten', instruction?: string) {
    const wrapped = wrapSelectionWithHighlight(task)
    if (!wrapped) return
    setToolbar(null); setSubPanel(null); setCtxMenu(null)
    const label = task === 'summarize' ? 'Summary' : task === 'rewrite' ? 'Rephrased' : 'Shortened'
    setAiResult({ title: label, body: '', loading: true })
    let out = await tryWindowAi(task, wrapped.text)
    if (!out) {
      const { apiBaseUrl, accessToken } = await loadSettings()
      out = await serverTask(apiBaseUrl, accessToken, task, wrapped.text, instruction)
    }
    setAiResult({
      title: label,
      body: out ?? 'AI unavailable — set API URL + token in the popup.',
      loading: false,
    })
  }

  function runPageRisk() {
    setRiskOpen(true); setRiskLoading(true); setRiskText('')
    void (async () => {
      const sample = (document.body?.innerText ?? '').slice(0, 12000)
      const { apiBaseUrl, accessToken } = await loadSettings()
      const h: Record<string, string> = { 'Content-Type': 'application/json' }
      if (accessToken) h.Authorization = `Bearer ${accessToken}`
      try {
        const res = await fetch(`${apiBaseUrl}/api/ai/page-risk`, {
          method: 'POST', headers: h, body: JSON.stringify({ pageTextSample: sample }),
        })
        const j = await res.json()
        setRiskText((j as { analysis?: string }).analysis ?? (j as { error?: string }).error ?? 'No response')
      } catch (e) { setRiskText(e instanceof Error ? e.message : 'Failed') }
      finally { setRiskLoading(false) }
    })()
  }

  function addAnchor() {
    setToolbar(null); setSubPanel(null); setCtxMenu(null)
    const offset = anchors.length * 16
    setAnchors(a => [...a, {
      id: `an-${Date.now()}`,
      x: Math.min(window.innerWidth - 252, 40 + offset),
      y: Math.min(window.innerHeight - 200, 140 + offset),
      text: selRef.current ? `"${selRef.current.slice(0, 120)}"` : '',
    }])
  }

  if (!toolbar && !riskOpen && !spatialOpen && !ctxMenu && !aiResult && anchors.length === 0) return null

  const tbLeft = toolbar
    ? Math.max(8, Math.min(window.innerWidth - 500, toolbar.x - 230))
    : 0
  const tbTop = toolbar ? Math.max(8, toolbar.y - 50) : 0

  /* Context menu items */
  const ctxItems: CtxItem[] = [
    { label: 'Highlight', icon: <IHighlight />, action: () => { wrapSelectionWithHighlight('extract'); setCtxMenu(null) } },
    { label: 'Summarize', icon: <IAi />, action: () => { void runAiTask('summarize'); setCtxMenu(null) } },
    { label: 'Rephrase', icon: <IEdit />, action: () => { void runAiTask('rewrite'); setCtxMenu(null) } },
    { label: 'Shorten', icon: <IGrid />, action: () => { void runAiTask('shorten'); setCtxMenu(null) } },
    { label: 'Add Note', icon: <INote />, action: addAnchor },
    { label: 'Read Aloud', icon: <IVolume />, action: () => { void speakWithElevenLabs(selRef.current.slice(0, 800)); setCtxMenu(null) } },
    { label: 'Save to Map', icon: <IMapPin />, action: () => { setCtxMenu(null); setSpatialOpen(true) } },
    { label: 'Page Risk', icon: <IAlert />, action: () => { setCtxMenu(null); runPageRisk() } },
  ]

  return (
    <>
      {/* ── Selection toolbar ── */}
      {toolbar && (
        <>
          <div
            className="inline-toolbar"
            style={{
              position: 'fixed',
              left: tbLeft,
              top: tbTop,
              zIndex: 2147483646,
              background: DARK,
              borderRadius: 14,
              pointerEvents: 'auto',
              width: 'max-content',
              fontFamily: FONT,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              padding: '5px 8px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.22), 0 1px 4px rgba(0,0,0,0.12)',
            }}
          >
            <TBtn onClick={() => { wrapSelectionWithHighlight('extract'); setToolbar(null) }} title="Highlight">
              <IHighlight />
            </TBtn>

            <Sep />

            <TBtn isText onClick={() => void runAiTask('summarize')} title="Summarize">Summarize</TBtn>
            <TBtn isText onClick={() => void runAiTask('rewrite')} title="Rephrase">Rephrase</TBtn>
            <TBtn isText onClick={() => void runAiTask('shorten')} title="Shorten">Shorten</TBtn>
            <TBtn active={subPanel === 'rewrite'} onClick={() => toggleSub('rewrite')} title="Custom rewrite">
              <IEdit />
            </TBtn>

            <Sep />

            <TBtn onClick={() => { wrapSelectionWithHighlight('extract'); setToolbar(null) }} title="Extract data">
              <IGrid />
            </TBtn>
            <TBtn onClick={() => { setToolbar(null); runPageRisk() }} title="Page risk">
              <IAlert />
            </TBtn>
            <TBtn onClick={() => { setToolbar(null); setSpatialOpen(true) }} title="Save to map">
              <IMapPin />
            </TBtn>

            <Sep />

            <TBtn active={subPanel === 'insight'} onClick={() => toggleSub('insight')} title="Tag insight">
              <ITag />
            </TBtn>
            <TBtn onClick={() => { void speakWithElevenLabs(selRef.current.slice(0, 800)) }} title="Read aloud">
              <IVolume />
            </TBtn>
            <TBtn isText onClick={addAnchor} title="Pin a note here">Note</TBtn>
          </div>

          {/* Sub-panel: rewrite */}
          {subPanel === 'rewrite' && (
            <div
              className="inline-toolbar"
              style={{
                position: 'fixed', left: tbLeft, top: tbTop + 50,
                zIndex: 2147483645,
                background: DARK, borderRadius: 12,
                pointerEvents: 'auto', width: 320,
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 10px', fontFamily: FONT,
                boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
              }}
            >
              <input
                ref={subInputRef}
                value={subInput}
                onChange={e => setSubInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') void runAiTask('rewrite', subInput) }}
                placeholder="Rewrite instruction…"
                style={{
                  flex: 1, padding: '7px 10px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 8, fontSize: 11, fontFamily: FONT,
                  outline: 'none', color: '#fff',
                  background: 'rgba(255,255,255,0.06)',
                }}
              />
              <button type="button" onClick={() => void runAiTask('rewrite', subInput)}
                style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#fff', color: DARK, fontWeight: 700, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Go
              </button>
              <button type="button" onClick={() => setSubPanel(null)}
                style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: 'transparent', color: MUTED, fontSize: 14, cursor: 'pointer' }}>×</button>
            </div>
          )}

          {/* Sub-panel: insight */}
          {subPanel === 'insight' && (
            <div
              className="inline-toolbar"
              style={{
                position: 'fixed', left: tbLeft, top: tbTop + 50,
                zIndex: 2147483645,
                background: DARK, borderRadius: 12,
                pointerEvents: 'auto', width: 300,
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 10px', fontFamily: FONT,
                boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
              }}
            >
              <input
                ref={subInputRef}
                value={subInput}
                onChange={e => setSubInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && subInput.trim()) {
                    wrapSelectionWithHighlight('extract')
                    const saved = subInput
                    setSubPanel(null); setToolbar(null); setSubInput('')
                    setAiResult({ title: 'Insight saved', body: saved, loading: false })
                  }
                }}
                placeholder="Add insight…"
                style={{
                  flex: 1, padding: '7px 10px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 8, fontSize: 11, fontFamily: FONT,
                  outline: 'none', color: '#fff',
                  background: 'rgba(255,255,255,0.06)',
                }}
              />
              <button type="button" onClick={() => {
                if (subInput.trim()) {
                  wrapSelectionWithHighlight('extract')
                  setAiResult({ title: 'Insight saved', body: subInput, loading: false })
                }
                setSubPanel(null); setToolbar(null); setSubInput('')
              }}
                style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#fff', color: DARK, fontWeight: 700, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Save
              </button>
              <button type="button" onClick={() => setSubPanel(null)}
                style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: 'transparent', color: MUTED, fontSize: 14, cursor: 'pointer' }}>×</button>
            </div>
          )}
        </>
      )}

      {/* ── Right-click context menu ── */}
      {ctxMenu && (
        <div
          className="inline-toolbar"
          style={{
            position: 'fixed',
            left: Math.min(ctxMenu.x, window.innerWidth - 200),
            top: Math.min(ctxMenu.y, window.innerHeight - 360),
            zIndex: 2147483647,
            background: DARK,
            borderRadius: 12,
            pointerEvents: 'auto',
            width: 180,
            padding: '6px',
            fontFamily: FONT,
            boxShadow: '0 8px 32px rgba(0,0,0,0.28), 0 2px 6px rgba(0,0,0,0.15)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 8px 8px', borderBottom: `1px solid ${BORDER}`, marginBottom: 4,
          }}>
            <div style={{
              width: 4, height: 14, borderRadius: 2,
              background: 'rgba(255,255,255,0.6)', transform: 'rotate(-12deg)',
            }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.04em' }}>
              INLINE
            </span>
          </div>
          {ctxItems.map(item => (
            <ContextMenuItem key={item.label} item={item} />
          ))}
        </div>
      )}

      {/* ── Anchor note panels ── */}
      {anchors.map(a => (
        <AnchorPanel key={a.id} note={a} dragRef={dragRef}
          onChange={text => setAnchors(l => l.map(x => x.id === a.id ? { ...x, text } : x))}
          onClose={() => setAnchors(l => l.filter(x => x.id !== a.id))}
        />
      ))}

      {/* ── Spatial save modal ── */}
      {spatialOpen && (
        <div className="inline-modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 2147483647, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto' }}>
          <div style={{ width: 'min(100vw - 24px,380px)', background: CREAM, border: `1.5px solid #d6d3d1`, borderRadius: 16, padding: 20, fontFamily: FONT }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: DARK }}>Save spatial data</h3>
            <label style={{ fontSize: 11, color: '#78716c', display: 'block', marginBottom: 4 }}>Location / address</label>
            <input value={spatialAddr} onChange={e => setSpatialAddr(e.target.value)} placeholder="123 Main St, City"
              style={{ width: '100%', boxSizing: 'border-box', marginBottom: 10, padding: '8px 10px', border: '1.5px solid #d6d3d1', borderRadius: 8, fontSize: 12, outline: 'none', background: '#fff' }} />
            <label style={{ fontSize: 11, color: '#78716c', display: 'block', marginBottom: 4 }}>Insight / note</label>
            <textarea value={spatialNote} onChange={e => setSpatialNote(e.target.value)} placeholder="What did you notice here?"
              style={{ width: '100%', boxSizing: 'border-box', minHeight: 72, marginBottom: 14, padding: '8px 10px', border: '1.5px solid #d6d3d1', borderRadius: 8, fontSize: 12, resize: 'vertical', outline: 'none', fontFamily: FONT, background: '#fff' }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setSpatialOpen(false); setSpatialAddr(''); setSpatialNote('') }}
                style={{ border: '1.5px solid #d6d3d1', borderRadius: 8, padding: '7px 14px', background: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 600, color: DARK }}>Cancel</button>
              <button type="button" onClick={async () => {
                const { apiBaseUrl, accessToken } = await loadSettings()
                const workspaceId = await new Promise<string>(resolve => {
                  chrome.storage.local.get(['inlineActiveWorkspaceId'], r => {
                    resolve(typeof r.inlineActiveWorkspaceId === 'string' && r.inlineActiveWorkspaceId
                      ? r.inlineActiveWorkspaceId : '')
                  })
                })
                const h: Record<string, string> = { 'Content-Type': 'application/json' }
                if (accessToken) h.Authorization = `Bearer ${accessToken}`
                try {
                  const res = await fetch(`${apiBaseUrl}/api/spatial/save`, {
                    method: 'POST', headers: h,
                    body: JSON.stringify({ address: spatialAddr, insight: spatialNote, workspaceId, sourceUrl: window.location.href }),
                  })
                  const j = await res.json()
                  if (!res.ok) setAiResult({ title: 'Save to map', body: (j as { error?: string }).error ?? 'Save failed', loading: false })
                  else setAiResult({ title: 'Saved to map', body: spatialAddr || 'Pin saved.', loading: false })
                } catch (e) {
                  setAiResult({ title: 'Save failed', body: e instanceof Error ? e.message : 'Failed', loading: false })
                }
                setSpatialOpen(false); setSpatialAddr(''); setSpatialNote('')
              }}
                style={{ border: 'none', borderRadius: 8, padding: '7px 14px', background: DARK, color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page risk panel ── */}
      {riskOpen && (
        <div style={{ position: 'fixed', right: 16, top: 16, width: 'min(100vw - 32px, 340px)', maxHeight: '70vh', overflow: 'auto', zIndex: 2147483646, background: CREAM, border: '1.5px solid #d6d3d1', borderRadius: 14, padding: '14px 16px', pointerEvents: 'auto', fontFamily: FONT, fontSize: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <strong style={{ fontSize: 13, color: DARK }}>Page risk analysis</strong>
            <button type="button" onClick={() => setRiskOpen(false)}
              style={{ border: '1.5px solid #d6d3d1', borderRadius: 6, background: '#fff', cursor: 'pointer', padding: '2px 7px', fontSize: 13, color: DARK }}>×</button>
          </div>
          {riskLoading
            ? <p style={{ color: '#78716c', margin: 0 }}>Analysing…</p>
            : <pre style={{ whiteSpace: 'pre-wrap', margin: 0, color: DARK, lineHeight: 1.5 }}>{riskText}</pre>}
        </div>
      )}

      {/* ── Inline AI result card (replaces window.alert) ── */}
      {aiResult && (
        <div
          className="inline-toolbar"
          style={{
            position: 'fixed', right: 16, top: 16,
            width: 'min(100vw - 32px, 360px)', maxHeight: '70vh', overflow: 'auto',
            zIndex: 2147483646,
            background: CREAM, border: '1.5px solid #d6d3d1', borderRadius: 14,
            padding: '14px 16px', pointerEvents: 'auto',
            fontFamily: FONT, fontSize: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <strong style={{ fontSize: 13, color: DARK }}>{aiResult.title}</strong>
            <button type="button" onClick={() => setAiResult(null)}
              style={{ border: '1.5px solid #d6d3d1', borderRadius: 6, background: '#fff', cursor: 'pointer', padding: '2px 7px', fontSize: 13, color: DARK }}>×</button>
          </div>
          {aiResult.loading
            ? <p style={{ color: '#78716c', margin: 0 }}>Thinking…</p>
            : <pre style={{ whiteSpace: 'pre-wrap', margin: 0, color: DARK, lineHeight: 1.5, fontFamily: FONT }}>{aiResult.body}</pre>}
          {!aiResult.loading && aiResult.body && (
            <div style={{ display: 'flex', gap: 6, marginTop: 10, justifyContent: 'flex-end' }}>
              <button type="button"
                onClick={() => { void navigator.clipboard.writeText(aiResult.body).catch(() => {}) }}
                style={{ border: '1.5px solid #d6d3d1', borderRadius: 8, padding: '5px 10px', background: '#fff', fontSize: 11, cursor: 'pointer', fontWeight: 600, color: DARK }}>Copy</button>
            </div>
          )}
        </div>
      )}

      <GlobalDragHandler setAnchors={setAnchors} dragRef={dragRef} />
    </>
  )
}

/* ─── Anchor note panel ─── */
function AnchorPanel({
  note, dragRef, onChange, onClose,
}: {
  note: AnchorNote
  dragRef: MutableRefObject<{ id: string; ox: number; oy: number } | null>
  onChange: (t: string) => void
  onClose: () => void
}) {
  return (
    <div
      className="inline-anchor"
      style={{ position: 'fixed', left: note.x, top: note.y, width: 240, zIndex: 2147483645, background: CREAM, border: '1.5px solid #d6d3d1', borderRadius: 12, overflow: 'hidden', pointerEvents: 'auto', fontFamily: FONT }}
    >
      <div
        onMouseDown={e => { dragRef.current = { id: note.id, ox: e.clientX - note.x, oy: e.clientY - note.y }; e.preventDefault() }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: '#F0EBE3', borderBottom: '1px solid #d6d3d1', cursor: 'grab', userSelect: 'none' }}
      >
        <span style={{ fontSize: 10, fontWeight: 700, color: '#78716c', letterSpacing: 1 }}>⠿ ANCHOR NOTE</span>
        <button type="button" onClick={onClose}
          style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#78716c', fontSize: 15, padding: 0, lineHeight: 1 }}>×</button>
      </div>
      <textarea
        value={note.text}
        onChange={e => onChange(e.target.value)}
        placeholder="Start typing…"
        style={{ display: 'block', width: '100%', boxSizing: 'border-box', border: 'none', padding: '8px 10px', fontSize: 12, resize: 'vertical', minHeight: 90, outline: 'none', fontFamily: FONT, color: DARK, background: CREAM }}
      />
    </div>
  )
}

/* ─── global drag listener ─── */
function GlobalDragHandler({
  setAnchors, dragRef,
}: {
  setAnchors: Dispatch<SetStateAction<AnchorNote[]>>
  dragRef: MutableRefObject<{ id: string; ox: number; oy: number } | null>
}) {
  useEffect(() => {
    const move = (e: MouseEvent) => {
      const d = dragRef.current; if (!d) return
      setAnchors(l => l.map(a => a.id === d.id ? { ...a, x: Math.max(0, e.clientX - d.ox), y: Math.max(0, e.clientY - d.oy) } : a))
    }
    const up = () => { dragRef.current = null }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
  }, [dragRef, setAnchors])
  return null
}
