import { useState, useRef, useEffect, useCallback } from 'react'
import { PANEL as C, FONT } from '../lib/extensionTheme'

type Tool = 'pen' | 'marker' | 'arrow' | 'rectangle' | 'ellipse' | 'eraser'

const COLORS = [
  '#1C1E26', '#dc2626', '#2563eb', '#16a34a', '#f59e0b',
  '#7c3aed', '#ec4899', '#06b6d4', '#ea580c', '#78716c',
]

/* ─── Tool icons ─── */
const IPen = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5z"/>
  </svg>
)
const IMarker = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8.5 1a.5.5 0 0 0-1 0v5.7L5.354 4.354a.5.5 0 1 0-.708.708L7.5 7.916V11.5a.5.5 0 0 0 1 0V7.916l2.854-2.854a.5.5 0 0 0-.708-.708L8.5 6.7V1z"/>
    <path d="M3 13.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5z"/>
  </svg>
)
const IArrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="19" x2="19" y2="5"/>
    <polyline points="12 5 19 5 19 12"/>
  </svg>
)
const IRectangle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
  </svg>
)
const IEllipse = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="12" rx="10" ry="7"/>
  </svg>
)
const IEraser = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8.086 2.207a2 2 0 0 1 2.828 0l3.879 3.879a2 2 0 0 1 0 2.828l-5.5 5.5A2 2 0 0 1 7.879 15H5.12a2 2 0 0 1-1.414-.586l-2.5-2.5a2 2 0 0 1 0-2.828l5.88-5.879zm2.121.707a1 1 0 0 0-1.414 0L4.16 7.547l5.293 5.293 4.633-4.633a1 1 0 0 0 0-1.414l-3.879-3.879zM8.746 13.547 3.453 8.254 1.914 9.793a1 1 0 0 0 0 1.414l2.5 2.5a1 1 0 0 0 .707.293H7.88a1 1 0 0 0 .707-.293l.16-.16z"/>
  </svg>
)
const IDraw = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="#1C1E26">
    <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zM13.5 6.207 9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5z"/>
  </svg>
)
const IClose = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="#78716c">
    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
  </svg>
)

interface DrawProps {
  onClose: () => void
}

export default function Draw({ onClose }: DrawProps) {
  const [tool, setTool] = useState<Tool>('pen')
  const [color, setColor] = useState(COLORS[0])
  const [thickness, setThickness] = useState(3)
  const canvasRef = useRef<SVGSVGElement | null>(null)
  const drawing = useRef(false)
  const pathData = useRef('')
  const currentPath = useRef<SVGPathElement | null>(null)
  const startPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const currentShapeEl = useRef<SVGElement | null>(null)

  /* ─── Create/remove SVG overlay on mount ─── */
  useEffect(() => {
    const existing = document.getElementById('inline-draw-canvas')
    if (existing) {
      canvasRef.current = existing as unknown as SVGSVGElement
      return
    }
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.id = 'inline-draw-canvas'
    svg.style.cssText =
      'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2147483640;pointer-events:none;'
    document.body.appendChild(svg)
    canvasRef.current = svg
    return () => { svg.remove(); canvasRef.current = null }
  }, [])

  const activateCanvas = useCallback(() => {
    if (!canvasRef.current) return
    canvasRef.current.style.pointerEvents = 'auto'
  }, [])

  const deactivateCanvas = useCallback(() => {
    if (!canvasRef.current) return
    canvasRef.current.style.pointerEvents = 'none'
  }, [])

  useEffect(() => { activateCanvas(); return deactivateCanvas }, [activateCanvas, deactivateCanvas])

  /* ─── Drawing handlers ─── */
  useEffect(() => {
    if (!canvasRef.current) return
    const svgEl: SVGSVGElement = canvasRef.current

    function start(e: PointerEvent) {
      if (tool === 'eraser') return
      drawing.current = true
      startPos.current = { x: e.clientX, y: e.clientY }

      if (tool === 'pen' || tool === 'marker') {
        pathData.current = `M${e.clientX} ${e.clientY}`
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        path.setAttribute('d', pathData.current)
        path.setAttribute('stroke', color)
        path.setAttribute('stroke-width', String(tool === 'marker' ? thickness * 3 : thickness))
        path.setAttribute('fill', 'none')
        path.setAttribute('stroke-linecap', 'round')
        path.setAttribute('stroke-linejoin', 'round')
        if (tool === 'marker') path.setAttribute('opacity', '0.4')
        path.setAttribute('data-inline-draw', 'true')
        svgEl.appendChild(path)
        currentPath.current = path
      } else if (tool === 'arrow') {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
        g.setAttribute('data-inline-draw', 'true')
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
        line.setAttribute('x1', String(e.clientX))
        line.setAttribute('y1', String(e.clientY))
        line.setAttribute('x2', String(e.clientX))
        line.setAttribute('y2', String(e.clientY))
        line.setAttribute('stroke', color)
        line.setAttribute('stroke-width', String(thickness))
        line.setAttribute('stroke-linecap', 'round')
        const head = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
        head.setAttribute('fill', color)
        head.setAttribute('points', '0,0 0,0 0,0')
        g.appendChild(line)
        g.appendChild(head)
        svgEl.appendChild(g)
        currentShapeEl.current = g
      } else if (tool === 'rectangle') {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        rect.setAttribute('x', String(e.clientX))
        rect.setAttribute('y', String(e.clientY))
        rect.setAttribute('width', '0')
        rect.setAttribute('height', '0')
        rect.setAttribute('stroke', color)
        rect.setAttribute('stroke-width', String(thickness))
        rect.setAttribute('fill', 'none')
        rect.setAttribute('rx', '2')
        rect.setAttribute('data-inline-draw', 'true')
        svgEl.appendChild(rect)
        currentShapeEl.current = rect
      } else if (tool === 'ellipse') {
        const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse')
        ellipse.setAttribute('cx', String(e.clientX))
        ellipse.setAttribute('cy', String(e.clientY))
        ellipse.setAttribute('rx', '0')
        ellipse.setAttribute('ry', '0')
        ellipse.setAttribute('stroke', color)
        ellipse.setAttribute('stroke-width', String(thickness))
        ellipse.setAttribute('fill', 'none')
        ellipse.setAttribute('data-inline-draw', 'true')
        svgEl.appendChild(ellipse)
        currentShapeEl.current = ellipse
      }
    }

    function move(e: PointerEvent) {
      if (!drawing.current) return

      if ((tool === 'pen' || tool === 'marker') && currentPath.current) {
        pathData.current += ` L${e.clientX} ${e.clientY}`
        currentPath.current.setAttribute('d', pathData.current)
      } else if (tool === 'arrow' && currentShapeEl.current) {
        const g = currentShapeEl.current
        const line = g.querySelector('line')
        const head = g.querySelector('polygon')
        if (line && head) {
          line.setAttribute('x2', String(e.clientX))
          line.setAttribute('y2', String(e.clientY))
          const sx = startPos.current.x, sy = startPos.current.y
          const ex = e.clientX, ey = e.clientY
          const angle = Math.atan2(ey - sy, ex - sx)
          const headLen = Math.max(10, thickness * 4)
          const p1x = ex - headLen * Math.cos(angle - Math.PI / 6)
          const p1y = ey - headLen * Math.sin(angle - Math.PI / 6)
          const p2x = ex - headLen * Math.cos(angle + Math.PI / 6)
          const p2y = ey - headLen * Math.sin(angle + Math.PI / 6)
          head.setAttribute('points', `${ex},${ey} ${p1x},${p1y} ${p2x},${p2y}`)
        }
      } else if (tool === 'rectangle' && currentShapeEl.current) {
        const rect = currentShapeEl.current as SVGRectElement
        const sx = startPos.current.x, sy = startPos.current.y
        const x = Math.min(sx, e.clientX)
        const y = Math.min(sy, e.clientY)
        const w = Math.abs(e.clientX - sx)
        const h = Math.abs(e.clientY - sy)
        rect.setAttribute('x', String(x))
        rect.setAttribute('y', String(y))
        rect.setAttribute('width', String(w))
        rect.setAttribute('height', String(h))
      } else if (tool === 'ellipse' && currentShapeEl.current) {
        const ellipse = currentShapeEl.current as SVGEllipseElement
        const sx = startPos.current.x, sy = startPos.current.y
        const cx = (sx + e.clientX) / 2
        const cy = (sy + e.clientY) / 2
        const rx = Math.abs(e.clientX - sx) / 2
        const ry = Math.abs(e.clientY - sy) / 2
        ellipse.setAttribute('cx', String(cx))
        ellipse.setAttribute('cy', String(cy))
        ellipse.setAttribute('rx', String(rx))
        ellipse.setAttribute('ry', String(ry))
      }
    }

    function end() {
      drawing.current = false
      currentPath.current = null
      currentShapeEl.current = null
    }

    function erase(e: PointerEvent) {
      if (tool !== 'eraser') return
      const el = document.elementFromPoint(e.clientX, e.clientY)
      if (el && el.hasAttribute('data-inline-draw')) el.remove()
      if (el?.parentElement && el.parentElement.hasAttribute('data-inline-draw')) el.parentElement.remove()
    }

    svgEl.addEventListener('pointerdown', start)
    svgEl.addEventListener('pointermove', move)
    svgEl.addEventListener('pointerup', end)
    svgEl.addEventListener('click', erase)
    return () => {
      svgEl.removeEventListener('pointerdown', start)
      svgEl.removeEventListener('pointermove', move)
      svgEl.removeEventListener('pointerup', end)
      svgEl.removeEventListener('click', erase)
    }
  }, [tool, color, thickness])

  const tools: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: 'pen', icon: <IPen />, label: 'Pen' },
    { id: 'marker', icon: <IMarker />, label: 'Marker' },
    { id: 'arrow', icon: <IArrow />, label: 'Arrow' },
    { id: 'rectangle', icon: <IRectangle />, label: 'Rectangle' },
    { id: 'ellipse', icon: <IEllipse />, label: 'Ellipse' },
    { id: 'eraser', icon: <IEraser />, label: 'Eraser' },
  ]

  return (
    <div style={{
      width: 220, background: C.bg, border: `1.5px solid ${C.border}`,
      borderRadius: C.radius, boxShadow: C.shadow, fontFamily: FONT,
      overflow: 'hidden', userSelect: 'none',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', background: C.headerBg,
        borderBottom: `1.5px solid ${C.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IDraw />
          <span style={{ fontSize: 12, fontWeight: 700, color: C.accent }}>Draw</span>
        </div>
        <button onClick={onClose} style={btnIcon}><IClose /></button>
      </div>

      {/* Tool grid – 3x2 */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 6, padding: '10px 14px', justifyItems: 'center',
      }}>
        {tools.map(t => (
          <button key={t.id}
            onClick={() => setTool(t.id)}
            title={t.label}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 8,
              border: `1.5px solid ${tool === t.id ? C.accent : C.border}`,
              background: tool === t.id ? '#F0EBE3' : C.bg,
              color: tool === t.id ? C.accent : C.textMuted,
              cursor: 'pointer',
            }}
          >{t.icon}</button>
        ))}
      </div>

      {/* Thickness slider */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '4px 14px 10px', justifyContent: 'center',
      }}>
        <button onClick={() => setThickness(v => Math.max(1, v - 1))} style={sliderBtn}>−</button>
        <input
          type="range" min={1} max={12} value={thickness}
          onChange={e => setThickness(Number(e.target.value))}
          style={{ flex: 1, accentColor: C.accent, height: 4, cursor: 'pointer' }}
        />
        <button onClick={() => setThickness(v => Math.min(12, v + 1))} style={sliderBtn}>+</button>
      </div>

      {/* Color grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 8, padding: '6px 14px 14px',
      }}>
        {COLORS.map(c => (
          <button
            key={c}
            onClick={() => setColor(c)}
            style={{
              width: 26, height: 26, borderRadius: 6,
              background: c, cursor: 'pointer',
              border: color === c ? `2.5px solid ${C.accent}` : '2px solid transparent',
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

const sliderBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 24, height: 24, borderRadius: 6,
  border: `1.5px solid ${C.border}`, background: C.bg,
  cursor: 'pointer', fontSize: 14, fontWeight: 700, color: C.textMuted,
}
