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
  const res = await fetch(`${apiBase}/api/ai/extension-light`, {
  method: 'POST', headers: h,
  body: JSON.stringify({ task, text, instruction }),
  })
  if (!res.ok) return null
  return ((await res.json()) as { result?: string }).result ?? null
  }
  
  /* ─── SVG icons ─── */
  const IC: React.CSSProperties = { display:'flex', alignItems:'center', justifyContent:'center' }
  
  const IPin = () => (
  <svg style={IC} width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
  <path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.134 3.134a5.927 5.927 0 0 1 .16 1.013c.046.702-.032 1.687-.72 2.375a.5.5 0 0 1-.707 0l-2.829-2.828-3.182 3.182c-.195.195-1.219.902-1.414.707-.195-.195.512-1.22.707-1.414l3.182-3.182-2.828-2.829a.5.5 0 0 1 0-.707c.688-.688 1.673-.767 2.375-.72a5.922 5.922 0 0 1 1.013.16l3.134-3.133a2.772 2.772 0 0 1-.04-.461c0-.43.108-1.022.589-1.503a.5.5 0 0 1 .353-.146z"/>
  </svg>
  )
  const IEdit = () => (
  <svg style={IC} width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
  <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/>
  </svg>
  )
  const IGrid = () => (
  <svg style={IC} width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
  <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3z"/>
  </svg>
  )
  const IAlert = () => (
  <svg style={IC} width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
  <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
  </svg>
  )
  const IMapPin = () => (
  <svg style={IC} width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
  <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
  </svg>
  )
  const ITag = () => (
  <svg style={IC} width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
  <path d="M2 1a1 1 0 0 0-1 1v4.586a1 1 0 0 0 .293.707l7 7a1 1 0 0 0 1.414 0l4.586-4.586a1 1 0 0 0 0-1.414l-7-7A1 1 0 0 0 6.586 1H2zm4 3.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
  </svg>
  )
  const IVolume = () => (
  <svg style={IC} width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
  <path d="M11.536 14.01A8.473 8.473 0 0 0 14.026 8a8.473 8.473 0 0 0-2.49-6.01l-.708.707A7.476 7.476 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303l.708.707z"/>
  <path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.483 5.483 0 0 1 11.025 8a5.483 5.483 0 0 1-1.61 3.89l.706.706z"/>
  <path d="M8.707 11.182A4.486 4.486 0 0 0 10.025 8a4.486 4.486 0 0 0-1.318-3.182L8 5.525A3.489 3.489 0 0 1 9.025 8 3.49 3.49 0 0 1 8 10.475l.707.707z"/>
  <path d="M6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06z"/>
  </svg>
  )
  /* ─── Accent color (matches website primary) ─── */
  const ACCENT = '#4B83C4'
  
  /* ─── Separator ─── */
  const Sep = () => (
    <div style={{ width: 1, height: 18, background: '#e2e8f0', margin: '0 6px', flexShrink: 0 }} />
  )
  
  /* ─── Toolbar button (icon or text variant) ─── */
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
  padding: '4px 8px', border: 'none', borderRadius: 6,
  background: hov ? '#f1f5f9' : 'transparent',
  color: hov ? '#0f172a' : '#64748b',
  fontSize: 11, fontWeight: 700,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", system-ui, sans-serif',
  cursor: 'pointer', lineHeight: 1, whiteSpace: 'nowrap',
  transition: 'background 0.1s, color 0.1s',
  letterSpacing: '0.02em',
  } : {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  padding: '6px', border: 'none', borderRadius: 6,
  background: active ? 'rgba(37,100,188,0.1)' : hov ? '#f1f5f9' : 'transparent',
  color: active ? ACCENT : hov ? '#0f172a' : '#64748b',
  cursor: 'pointer', lineHeight: 1,
  transition: 'background 0.1s, color 0.1s',
  }}
  >
  {children}
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
  const dragRef = useRef<{ id: string; ox: number; oy: number } | null>(null)
  const selRef = useRef('')
  const subInputRef = useRef<HTMLInputElement>(null)
  
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
  
  /* context-menu page-risk trigger */
  useEffect(() => {
  const onMsg = (msg: { type?: string }) => {
  if (msg?.type !== 'INLINE_PAGE_RISK') return
  runPageRisk()
  }
  chrome.runtime.onMessage.addListener(onMsg)
  return () => chrome.runtime.onMessage.removeListener(onMsg)
  }, [])
  
  /* auto-focus sub-panel input */
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
  setToolbar(null); setSubPanel(null)
  let out = await tryWindowAi(task, wrapped.text)
  if (!out) {
  const { apiBaseUrl, accessToken } = await loadSettings()
  out = await serverTask(apiBaseUrl, accessToken, task, wrapped.text, instruction)
  }
  if (out) window.alert(out)
  else window.alert('AI unavailable — set API URL + token in the popup.')
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
  setToolbar(null); setSubPanel(null)
  const offset = anchors.length * 16
  setAnchors(a => [...a, {
  id: `an-${Date.now()}`,
  x: Math.min(window.innerWidth - 252, 40 + offset),
  y: Math.min(window.innerHeight - 200, 140 + offset),
  text: selRef.current ? `"${selRef.current.slice(0, 120)}"` : '',
  }])
  }
  
  if (!toolbar && !riskOpen && !spatialOpen && anchors.length === 0) return null
  
  /* toolbar position */
  const tbLeft = toolbar
  ? Math.max(8, Math.min(window.innerWidth - 500, toolbar.x - 230))
  : 0
  const tbTop = toolbar ? Math.max(8, toolbar.y - 50) : 0
  
  return (
  <>
  {/* ── Selection toolbar ── */}
  {toolbar && (
  <>
  {/* Main pill toolbar */}
  <div
  className="inline-toolbar"
  style={{
  position: 'fixed',
  left: tbLeft,
  top: tbTop,
  zIndex: 2147483646,
  background: '#ffffff',
  border: '1.5px solid #e2e8f0',
  borderRadius: 12,
  pointerEvents: 'auto',
  width: 'max-content',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", system-ui, sans-serif',
  display: 'flex',
  alignItems: 'center',
  gap: 3,
  padding: '5px 10px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  }}
  >
  {/* Highlight */}
  <TBtn onClick={() => { wrapSelectionWithHighlight('extract'); setToolbar(null) }} title="Highlight selection">
  <IPin />
  </TBtn>

  <Sep />

  {/* AI actions */}
  <TBtn isText onClick={() => void runAiTask('summarize')} title="Summarize">Summarize</TBtn>
  <TBtn isText onClick={() => void runAiTask('rewrite')} title="Rephrase">Rephrase</TBtn>
  <TBtn isText onClick={() => void runAiTask('shorten')} title="Shorten">Shorten</TBtn>
  <TBtn active={subPanel === 'rewrite'} onClick={() => toggleSub('rewrite')} title="Custom rewrite">
  <IEdit />
  </TBtn>

  <Sep />

  {/* Tools */}
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

  {/* Extras */}
  <TBtn active={subPanel === 'insight'} onClick={() => toggleSub('insight')} title="Tag insight">
  <ITag />
  </TBtn>
  <TBtn onClick={() => { void window.speechSynthesis?.speak(new SpeechSynthesisUtterance(selRef.current.slice(0, 800))) }} title="Read aloud">
  <IVolume />
  </TBtn>
  <TBtn isText onClick={addAnchor} title="Pin a note here">Note</TBtn>
  </div>
  
  {/* Sub-panel: rewrite — floats below the pill */}
  {subPanel === 'rewrite' && (
  <div
  className="inline-toolbar"
  style={{
  position: 'fixed',
  left: tbLeft,
  top: tbTop + 50,
  zIndex: 2147483645,
  background: '#fff',
  border: '1.5px solid #e2e8f0',
  borderRadius: 12,
  pointerEvents: 'auto',
  width: 320,
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '8px 10px',
  fontFamily: 'system-ui, sans-serif',
  }}
  >
  <input
  ref={subInputRef}
  value={subInput}
  onChange={e => setSubInput(e.target.value)}
  onKeyDown={e => { if (e.key === 'Enter') void runAiTask('rewrite', subInput) }}
  placeholder="Rewrite instruction… (e.g. 'make it formal')"
  style={{
  flex: 1, padding: '6px 10px', border: '1.5px solid #e2e8f0',
  borderRadius: 8, fontSize: 11, fontFamily: 'system-ui,sans-serif',
  outline: 'none', color: '#334155',
  }}
  />
  <button type="button" onClick={() => void runAiTask('rewrite', subInput)}
  style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: ACCENT, color: '#fff', fontWeight: 700, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' }}>
  Go
  </button>
  <button type="button" onClick={() => setSubPanel(null)}
  style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: 'transparent', color: '#94a3b8', fontSize: 14, cursor: 'pointer' }}>×</button>
  </div>
  )}
  
  {/* Sub-panel: insight/tag — floats below the pill */}
  {subPanel === 'insight' && (
  <div
  className="inline-toolbar"
  style={{
  position: 'fixed',
  left: tbLeft,
  top: tbTop + 50,
  zIndex: 2147483645,
  background: '#fff',
  border: '1.5px solid #e2e8f0',
  borderRadius: 12,
  pointerEvents: 'auto',
  width: 300,
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '8px 10px',
  fontFamily: 'system-ui, sans-serif',
  }}
  >
  <input
  ref={subInputRef}
  value={subInput}
  onChange={e => setSubInput(e.target.value)}
  onKeyDown={e => {
  if (e.key === 'Enter' && subInput.trim()) {
  wrapSelectionWithHighlight('extract')
  setSubPanel(null); setToolbar(null); setSubInput('')
  window.alert(`Insight saved: "${subInput}"`)
  }
  }}
  placeholder="Add insight…"
  style={{
  flex: 1, padding: '6px 10px', border: '1.5px solid #e2e8f0',
  borderRadius: 8, fontSize: 11, fontFamily: 'system-ui,sans-serif',
  outline: 'none', color: '#334155',
  }}
  />
  <button type="button" onClick={() => {
  if (subInput.trim()) {
  wrapSelectionWithHighlight('extract')
  window.alert(`Insight saved: "${subInput}"`)
  }
  setSubPanel(null); setToolbar(null); setSubInput('')
  }}
  style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: ACCENT, color: '#fff', fontWeight: 700, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' }}>
  Save
  </button>
  <button type="button" onClick={() => setSubPanel(null)}
  style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: 'transparent', color: '#94a3b8', fontSize: 14, cursor: 'pointer' }}>×</button>
  </div>
  )}
  </>
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
  <div className="inline-modal-backdrop" style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.3)', zIndex:2147483647, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'auto' }}>
  <div style={{ width:'min(100vw - 24px,380px)', background:'#fff', border:'2px solid #e2e8f0', borderRadius:16, padding:18, fontFamily:'system-ui,sans-serif' }}>
  <h3 style={{ margin:'0 0 14px', fontSize:14, fontWeight:700, color:'#0f172a' }}>Save spatial data</h3>
  <label style={{ fontSize:11, color:'#64748b', display:'block', marginBottom:4 }}>Location / address</label>
  <input value={spatialAddr} onChange={e => setSpatialAddr(e.target.value)} placeholder="123 Main St, City"
  style={{ width:'100%', boxSizing:'border-box', marginBottom:10, padding:'8px 10px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:12, outline:'none' }} />
  <label style={{ fontSize:11, color:'#64748b', display:'block', marginBottom:4 }}>Insight / note</label>
  <textarea value={spatialNote} onChange={e => setSpatialNote(e.target.value)} placeholder="What did you notice here?"
  style={{ width:'100%', boxSizing:'border-box', minHeight:72, marginBottom:14, padding:'8px 10px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:12, resize:'vertical', outline:'none', fontFamily:'system-ui,sans-serif' }} />
  <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
  <button type="button" onClick={() => { setSpatialOpen(false); setSpatialAddr(''); setSpatialNote('') }}
  style={{ border:'1.5px solid #e2e8f0', borderRadius:8, padding:'7px 14px', background:'#fff', fontSize:12, cursor:'pointer', fontWeight:600 }}>Cancel</button>
  <button type="button" onClick={async () => {
  const { apiBaseUrl, accessToken } = await loadSettings()
  const h: Record<string,string> = { 'Content-Type':'application/json' }
  if (accessToken) h.Authorization = `Bearer ${accessToken}`
  try {
  const res = await fetch(`${apiBaseUrl}/api/spatial/save`, { method:'POST', headers:h, body:JSON.stringify({ address:spatialAddr, insight:spatialNote, workspaceId:'ws-1', sourceUrl:window.location.href }) })
  const j = await res.json()
  if (!res.ok) window.alert((j as { error?: string }).error ?? 'Save failed')
  else window.alert('Saved to map.')
  } catch (e) { window.alert(e instanceof Error ? e.message : 'Failed') }
  setSpatialOpen(false); setSpatialAddr(''); setSpatialNote('')
  }}
  style={{ border:'1.5px solid #e2e8f0', borderRadius:8, padding:'7px 14px', background:ACCENT, color:'#fff', fontSize:12, cursor:'pointer', fontWeight:600 }}>Save</button>
  </div>
  </div>
  </div>
  )}
  
  {/* ── Page risk panel ── */}
  {riskOpen && (
  <div style={{ position:'fixed', right:16, top:16, width:'min(100vw - 32px, 340px)', maxHeight:'70vh', overflow:'auto', zIndex:2147483646, background:'#fff', border:'2px solid #e2e8f0', borderRadius:14, padding:'12px 14px', pointerEvents:'auto', fontFamily:'system-ui,sans-serif', fontSize:12 }}>
  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
  <strong style={{ fontSize:13, color:'#0f172a' }}>Page risk analysis</strong>
  <button type="button" onClick={() => setRiskOpen(false)}
  style={{ border:'1.5px solid #e2e8f0', borderRadius:6, background:'#fff', cursor:'pointer', padding:'2px 7px', fontSize:13 }}>×</button>
  </div>
  {riskLoading
  ? <p style={{ color:'#64748b', margin:0 }}>Analysing…</p>
  : <pre style={{ whiteSpace:'pre-wrap', margin:0, color:'#334155', lineHeight:1.5 }}>{riskText}</pre>}
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
  style={{ position:'fixed', left:note.x, top:note.y, width:240, zIndex:2147483645, background:'#fff', border:'2px solid #e2e8f0', borderRadius:12, overflow:'hidden', pointerEvents:'auto', fontFamily:'system-ui,sans-serif' }}
  >
  <div
  onMouseDown={e => { dragRef.current = { id:note.id, ox:e.clientX - note.x, oy:e.clientY - note.y }; e.preventDefault() }}
  style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 10px', background:'#f8fafc', borderBottom:'1px solid #e2e8f0', cursor:'grab', userSelect:'none' }}
  >
  <span style={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:1 }}>⠿ ANCHOR NOTE</span>
  <button type="button" onClick={onClose}
  style={{ border:'none', background:'none', cursor:'pointer', color:'#94a3b8', fontSize:15, padding:0, lineHeight:1 }}>×</button>
  </div>
  <textarea
  value={note.text}
  onChange={e => onChange(e.target.value)}
  placeholder="Start typing…"
  style={{ display:'block', width:'100%', boxSizing:'border-box', border:'none', padding:'8px 10px', fontSize:12, resize:'vertical', minHeight:90, outline:'none', fontFamily:'system-ui,sans-serif', color:'#0f172a' }}
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