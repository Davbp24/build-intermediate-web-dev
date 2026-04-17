import { useState, useRef, useEffect, useCallback } from 'react'
import { PANEL as C, FONT } from '../lib/extensionTheme'

type HWTool = 'pen' | 'highlighter' | 'eraser'

const COLORS = [
  '#1C1E26', '#dc2626', '#2563eb', '#16a34a', '#f59e0b',
  '#7c3aed', '#ec4899', '#06b6d4', '#ea580c', '#78716c',
]

interface Point {
  x: number
  y: number
  pressure: number
}

interface Stroke {
  id?: string
  points: Point[]
  color: string
  thickness: number
  tool: HWTool
}

function makeStrokeId(): string {
  return `hw-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

const IPen = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
)
const IHighlighter = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l-6 6v3h9l3-3" /><path d="M22 12l-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
  </svg>
)
const IEraser = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8.086 2.207a2 2 0 0 1 2.828 0l3.879 3.879a2 2 0 0 1 0 2.828l-5.5 5.5A2 2 0 0 1 7.879 15H5.12a2 2 0 0 1-1.414-.586l-2.5-2.5a2 2 0 0 1 0-2.828l5.88-5.879z" />
  </svg>
)
const IHW = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#1C1E26" stroke="none">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
  </svg>
)
const IClose = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="#78716c">
    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
  </svg>
)

interface HandwritingProps {
  onClose: () => void
}

export default function Handwriting({ onClose }: HandwritingProps) {
  const [tool, setTool] = useState<HWTool>('pen')
  const [color, setColor] = useState(COLORS[0])
  const [thickness, setThickness] = useState(3)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const strokes = useRef<Stroke[]>([])
  const currentStroke = useRef<Stroke | null>(null)
  const drawing = useRef(false)
  const rafId = useRef(0)

  useEffect(() => {
    const existing = document.getElementById('inline-handwriting-canvas') as HTMLCanvasElement | null
    if (existing) {
      canvasRef.current = existing
      return
    }
    const canvas = document.createElement('canvas')
    canvas.id = 'inline-handwriting-canvas'
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    canvas.style.cssText =
      'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2147483639;pointer-events:none;touch-action:none;'
    document.body.appendChild(canvas)
    canvasRef.current = canvas

    const onResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      renderAllStrokes()
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      canvas.remove()
      canvasRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    try {
      if (!chrome.runtime?.id) return
      chrome.runtime.sendMessage(
        { type: 'LOAD_ANNOTATIONS', payload: { pageUrl: window.location.href } },
        (response) => {
          if (chrome.runtime.lastError || !response?.ok) return
          const saved = response.data?.elements?.handwriting as Stroke[] | undefined
          if (Array.isArray(saved) && saved.length > 0) {
            strokes.current = saved
            renderAllStrokes()
          }
        },
      )
    } catch { /* extension context unavailable */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.style.pointerEvents = 'auto'
    return () => { canvas.style.pointerEvents = 'none' }
  }, [])

  const renderStroke = useCallback((ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    const pts = stroke.points
    if (pts.length === 0) return

    ctx.save()

    if (stroke.tool === 'highlighter') {
      ctx.globalCompositeOperation = 'multiply'
      ctx.globalAlpha = 0.35
    } else if (stroke.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.globalAlpha = 1
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
    }

    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = stroke.tool === 'eraser' ? 'rgba(0,0,0,1)' : stroke.color

    if (pts.length === 1) {
      const p = pts[0]
      const r = stroke.thickness * (p.pressure || 0.5) * 0.5
      ctx.beginPath()
      ctx.arc(p.x, p.y, Math.max(r, 0.5), 0, Math.PI * 2)
      ctx.fillStyle = ctx.strokeStyle
      ctx.fill()
      ctx.restore()
      return
    }

    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i]
      const p1 = pts[i + 1]
      const w = stroke.thickness * ((p0.pressure + p1.pressure) / 2 || 0.5)
      ctx.lineWidth = Math.max(w, 0.5)
      ctx.beginPath()
      ctx.moveTo(p0.x, p0.y)
      if (i + 2 < pts.length) {
        const p2 = pts[i + 1]
        const cpx = (p0.x + p2.x) / 2
        const cpy = (p0.y + p2.y) / 2
        ctx.quadraticCurveTo(p0.x, p0.y, cpx, cpy)
      } else {
        ctx.lineTo(p1.x, p1.y)
      }
      ctx.stroke()
    }

    ctx.restore()
  }, [])

  const renderAllStrokes = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const s of strokes.current) renderStroke(ctx, s)
  }, [renderStroke])

  const persistData = useCallback(() => {
    try {
      if (!chrome.runtime?.id) return
      const data = strokes.current.map(s => ({ ...s, id: s.id ?? makeStrokeId() }))
      strokes.current = data
      chrome.runtime.sendMessage(
        {
          type: 'SAVE_ANNOTATIONS',
          payload: {
            pageUrl: window.location.href,
            featureKey: 'handwriting',
            data,
            pageTitle: document.title,
            domain: window.location.hostname,
            clearedAt: data.length === 0 ? Date.now() : null,
          },
        },
        () => { if (chrome.runtime.lastError) { /* ignore */ } },
      )
    } catch { /* extension context unavailable */ }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function onPointerDown(e: PointerEvent) {
      drawing.current = true
      const pressure = e.pressure > 0 ? e.pressure : 0.5
      currentStroke.current = {
        id: makeStrokeId(),
        points: [{ x: e.clientX, y: e.clientY, pressure }],
        color,
        thickness,
        tool,
      }
    }

    function onPointerMove(e: PointerEvent) {
      if (!drawing.current || !currentStroke.current) return
      const pressure = e.pressure > 0 ? e.pressure : 0.5
      currentStroke.current.points.push({ x: e.clientX, y: e.clientY, pressure })

      cancelAnimationFrame(rafId.current)
      rafId.current = requestAnimationFrame(() => {
        const cvs = canvasRef.current
        if (!cvs) return
        const ctx = cvs.getContext('2d')
        if (!ctx) return
        ctx.clearRect(0, 0, cvs.width, cvs.height)
        for (const s of strokes.current) renderStroke(ctx, s)
        if (currentStroke.current) renderStroke(ctx, currentStroke.current)
      })
    }

    function onPointerUp() {
      if (!drawing.current || !currentStroke.current) return
      drawing.current = false
      if (currentStroke.current.points.length > 0) {
        strokes.current = [...strokes.current, currentStroke.current]
      }
      currentStroke.current = null
      renderAllStrokes()
      persistData()
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointerleave', onPointerUp)

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointerleave', onPointerUp)
    }
  }, [tool, color, thickness, renderStroke, renderAllStrokes, persistData])

  const handleClear = useCallback(() => {
    strokes.current = []
    currentStroke.current = null
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    persistData()
  }, [persistData])

  const handleExport = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `handwriting-${Date.now()}.png`
    link.href = dataUrl
    link.click()
  }, [])

  const tools: { id: HWTool; icon: React.ReactNode; label: string }[] = [
    { id: 'pen', icon: <IPen />, label: 'Pen' },
    { id: 'highlighter', icon: <IHighlighter />, label: 'Highlighter' },
    { id: 'eraser', icon: <IEraser />, label: 'Eraser' },
  ]

  return (
    <div style={{
      width: 196, background: C.bg, border: `1px solid ${C.border}`,
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
          <IHW />
          <span style={{ fontSize: 13, fontWeight: 500, color: C.accent, letterSpacing: '-0.02em' }}>Handwriting</span>
        </div>
        <button type="button" onClick={onClose} style={btnIcon}><IClose /></button>
      </div>

      {/* Tool grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10, padding: '14px 16px', justifyItems: 'center',
      }}>
        {tools.map(t => (
          <button key={t.id} type="button"
            onClick={() => setTool(t.id)}
            title={t.label}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 42, height: 42, borderRadius: C.radiusMd,
              border: `1.5px solid ${tool === t.id ? C.accent : C.border}`,
              background: tool === t.id ? C.toneSelectedBg : C.surfaceBubble,
              color: tool === t.id ? C.accent : C.textMuted,
              cursor: 'pointer',
              boxShadow: tool === t.id ? C.shadowSoft : 'none',
              transition: 'background 0.15s, box-shadow 0.15s, border-color 0.15s',
            }}
          >{t.icon}</button>
        ))}
      </div>

      {/* Thickness slider */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '6px 16px 12px', justifyContent: 'center',
      }}>
        <button type="button" onClick={() => setThickness(v => Math.max(1, v - 1))} style={sliderBtn}>−</button>
        <div style={{
          flex: 1, height: 10, borderRadius: C.radiusPill,
          background: C.surfaceMuted, padding: '0 4px', display: 'flex', alignItems: 'center',
          boxShadow: 'none',
        }}>
          <input
            type="range" min={1} max={16} value={thickness}
            onChange={e => setThickness(Number(e.target.value))}
            style={{ flex: 1, width: '100%', accentColor: C.accent, height: 6, cursor: 'pointer' }}
          />
        </div>
        <button type="button" onClick={() => setThickness(v => Math.min(16, v + 1))} style={sliderBtn}>+</button>
      </div>

      {/* Color grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 10, padding: '8px 16px 14px',
      }}>
        {COLORS.map(c => (
          <button
            key={c} type="button"
            onClick={() => setColor(c)}
            style={{
              width: 30, height: 30, borderRadius: 10,
              background: c, cursor: 'pointer',
              border: color === c ? `3px solid ${C.accent}` : '2px solid rgba(255,255,255,0.85)',
              boxShadow: color === c ? C.shadowSoft : 'none',
              transition: 'transform 0.12s ease, box-shadow 0.12s',
              transform: color === c ? 'scale(1.06)' : 'scale(1)',
            }}
          />
        ))}
      </div>

      {/* Action buttons */}
      <div style={{
        display: 'flex', gap: 8, padding: '0 16px 16px',
      }}>
        <button type="button" onClick={handleClear} style={actionBtn}>Clear all</button>
        <button type="button" onClick={handleExport} style={actionBtn}>Export PNG</button>
      </div>
    </div>
  )
}

const btnIcon: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 32, height: 32, border: 'none', borderRadius: C.radiusSm,
  background: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: 0,
}

const sliderBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 32, height: 32, borderRadius: C.radiusPill,
  border: `1px solid ${C.border}`, background: C.surfaceBubble,
  cursor: 'pointer', fontSize: 16, fontWeight: 500, color: C.textMuted,
  boxShadow: C.shadowSoft,
}

const actionBtn: React.CSSProperties = {
  flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 500,
  borderRadius: C.radiusSm, cursor: 'pointer', letterSpacing: '-0.01em',
  border: `1.5px solid ${C.border}`, background: C.surfaceBubble,
  color: C.textMuted, transition: 'background 0.15s, border-color 0.15s',
}
