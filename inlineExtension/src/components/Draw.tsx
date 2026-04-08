import { useState, useRef, useEffect, useCallback } from 'react'
import { PANEL as C, FONT } from '../lib/extensionTheme'

type Tool = 'pen' | 'marker' | 'arrow' | 'rectangle' | 'ellipse' | 'eraser' | 'lasso'

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
const ILasso = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 22a5 5 0 0 1-2-4"/>
    <path d="M7 16.93c.96.43 1.96.74 2.99.91"/>
    <path d="M3.34 14A6.8 6.8 0 0 1 2 10c0-4.42 4.48-8 10-8s10 3.58 10 8-4.48 8-10 8a12 12 0 0 1-3-.38"/>
    <circle cx="7" cy="22" r="2"/>
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
  const [eraserMode, setEraserMode] = useState<'object' | 'pixel'>('object')
  const canvasRef = useRef<SVGSVGElement | null>(null)
  const drawing = useRef(false)
  const pathData = useRef('')
  const currentPath = useRef<SVGPathElement | null>(null)
  const startPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const currentShapeEl = useRef<SVGElement | null>(null)
  const startTime = useRef(0)
  const pointsArray = useRef<{ x: number; y: number }[]>([])
  const lassoPath = useRef<SVGPathElement | null>(null)
  const selectedGroup = useRef<SVGGElement | null>(null)
  const isDraggingGroup = useRef(false)
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const groupTranslate = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const eraserDown = useRef(false)

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

  /* ─── Restore saved draw paths from backend on mount ─── */
  useEffect(() => {
    try {
      chrome.runtime.sendMessage(
        { type: 'LOAD_ANNOTATIONS', payload: { pageUrl: window.location.href } },
        (response) => {
          if (chrome.runtime.lastError || !response?.ok) return
          const paths = response.data?.elements?.drawPaths as Record<string, unknown>[] | undefined
          if (!Array.isArray(paths) || paths.length === 0) return
          const svg = canvasRef.current
          if (!svg) return

          for (const item of paths) {
            if (item.type === 'path') {
              const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
              path.setAttribute('d', String(item.d))
              path.setAttribute('stroke', String(item.stroke))
              path.setAttribute('stroke-width', String(item.strokeWidth))
              path.setAttribute('fill', String(item.fill ?? 'none'))
              path.setAttribute('stroke-linecap', 'round')
              path.setAttribute('stroke-linejoin', 'round')
              if (item.opacity) path.setAttribute('opacity', String(item.opacity))
              path.setAttribute('data-inline-draw', 'true')
              svg.appendChild(path)
            } else if (item.type === 'rect') {
              const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
              rect.setAttribute('x', String(item.x))
              rect.setAttribute('y', String(item.y))
              rect.setAttribute('width', String(item.width))
              rect.setAttribute('height', String(item.height))
              rect.setAttribute('stroke', String(item.stroke))
              rect.setAttribute('stroke-width', String(item.strokeWidth))
              rect.setAttribute('fill', 'none')
              rect.setAttribute('rx', '2')
              rect.setAttribute('data-inline-draw', 'true')
              svg.appendChild(rect)
            } else if (item.type === 'ellipse') {
              const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse')
              ellipse.setAttribute('cx', String(item.cx))
              ellipse.setAttribute('cy', String(item.cy))
              ellipse.setAttribute('rx', String(item.rx))
              ellipse.setAttribute('ry', String(item.ry))
              ellipse.setAttribute('stroke', String(item.stroke))
              ellipse.setAttribute('stroke-width', String(item.strokeWidth))
              ellipse.setAttribute('fill', 'none')
              ellipse.setAttribute('data-inline-draw', 'true')
              svg.appendChild(ellipse)
            } else if (item.type === 'arrow') {
              const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
              g.setAttribute('data-inline-draw', 'true')
              const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
              line.setAttribute('x1', String(item.x1))
              line.setAttribute('y1', String(item.y1))
              line.setAttribute('x2', String(item.x2))
              line.setAttribute('y2', String(item.y2))
              line.setAttribute('stroke', String(item.stroke))
              line.setAttribute('stroke-width', String(item.strokeWidth))
              line.setAttribute('stroke-linecap', 'round')
              const head = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
              head.setAttribute('fill', String(item.fill))
              head.setAttribute('points', String(item.points))
              g.appendChild(line)
              g.appendChild(head)
              svg.appendChild(g)
            } else if (item.type === 'line') {
              const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
              line.setAttribute('x1', String(item.x1))
              line.setAttribute('y1', String(item.y1))
              line.setAttribute('x2', String(item.x2))
              line.setAttribute('y2', String(item.y2))
              line.setAttribute('stroke', String(item.stroke))
              line.setAttribute('stroke-width', String(item.strokeWidth))
              line.setAttribute('stroke-linecap', 'round')
              line.setAttribute('data-inline-draw', 'true')
              svg.appendChild(line)
            }
          }
        },
      )
    } catch { /* extension context unavailable */ }
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

    function deselectGroup() {
      if (!selectedGroup.current || !svgEl) return
      const g = selectedGroup.current
      const border = g.querySelector('.inline-lasso-border')
      if (border) border.remove()
      while (g.firstChild) svgEl.insertBefore(g.firstChild, g)
      g.remove()
      selectedGroup.current = null
    }

    function ptToLineDist(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
      const A = px - x1, B = py - y1, C = x2 - x1, D = y2 - y1
      const lenSq = C * C + D * D
      if (lenSq === 0) return Math.hypot(A, B)
      const t = Math.max(0, Math.min(1, (A * C + B * D) / lenSq))
      return Math.hypot(px - (x1 + t * C), py - (y1 + t * D))
    }

    function recognizeShape(pts: { x: number; y: number }[], elapsed: number) {
      if (pts.length < 2 || pts.length > 50 || elapsed < 300) return null
      const xs = pts.map(p => p.x), ys = pts.map(p => p.y)
      const minX = Math.min(...xs), maxX = Math.max(...xs)
      const minY = Math.min(...ys), maxY = Math.max(...ys)
      const bw = maxX - minX, bh = maxY - minY
      const first = pts[0], last = pts[pts.length - 1]
      const closedDist = Math.hypot(last.x - first.x, last.y - first.y)
      const isClosed = closedDist < Math.max(bw, bh) * 0.3

      const lineLen = Math.hypot(last.x - first.x, last.y - first.y)
      if (lineLen > 20) {
        const maxDist = Math.max(...pts.map(p => ptToLineDist(p.x, p.y, first.x, first.y, last.x, last.y)))
        if (maxDist < 15) return { type: 'line' as const, x1: first.x, y1: first.y, x2: last.x, y2: last.y }
      }

      if (!isClosed || bw < 15 || bh < 15) return null

      const edgeThresh = Math.max(bw, bh) * 0.2
      const nearEdge = pts.filter(p => {
        const dL = Math.abs(p.x - minX), dR = Math.abs(p.x - maxX)
        const dT = Math.abs(p.y - minY), dB = Math.abs(p.y - maxY)
        return Math.min(dL, dR) < edgeThresh || Math.min(dT, dB) < edgeThresh
      })
      if (nearEdge.length > pts.length * 0.7) {
        const aspect = bw / bh
        if (aspect > 0.3 && aspect < 3.5) {
          return { type: 'rect' as const, x: minX, y: minY, width: bw, height: bh }
        }
      }

      const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2
      const rx = bw / 2, ry = bh / 2
      if (rx > 5 && ry > 5) {
        const nDists = pts.map(p => {
          const nx = (p.x - cx) / rx, ny = (p.y - cy) / ry
          return Math.sqrt(nx * nx + ny * ny)
        })
        const avg = nDists.reduce((a, b) => a + b, 0) / nDists.length
        const maxDev = Math.max(...nDists.map(d => Math.abs(d - avg)))
        if (maxDev < 0.4) return { type: 'ellipse' as const, cx, cy, rx, ry }
      }

      return null
    }

    function pixelErase(ex: number, ey: number) {
      const radius = Math.max(8, thickness * 2)
      const els = svgEl.querySelectorAll('[data-inline-draw]')
      els.forEach(el => {
        const tag = el.tagName.toLowerCase()
        if (tag === 'path') {
          const d = el.getAttribute('d') ?? ''
          const segments = d.match(/[ML][^ML]*/g)
          if (!segments) return
          const kept: string[][] = [[]]
          let prevInside = false
          for (const seg of segments) {
            const nums = seg.trim().substring(1).trim().split(/[\s,]+/).map(Number)
            if (nums.length < 2) continue
            const px = nums[0], py = nums[1]
            const inside = Math.hypot(px - ex, py - ey) < radius
            if (inside) {
              if (!prevInside && kept[kept.length - 1].length > 0) kept.push([])
              prevInside = true
            } else {
              const cmd = seg.trim()[0]
              if (prevInside || kept[kept.length - 1].length === 0) {
                kept[kept.length - 1].push(`M${px} ${py}`)
              } else {
                kept[kept.length - 1].push(`${cmd}${px} ${py}`)
              }
              prevInside = false
            }
          }
          const newPaths = kept.filter(k => k.length > 1)
          if (newPaths.length === 0) {
            el.remove()
          } else if (newPaths.length === 1) {
            el.setAttribute('d', newPaths[0].join(' '))
          } else {
            const stroke = el.getAttribute('stroke') ?? ''
            const sw = el.getAttribute('stroke-width') ?? ''
            const opacity = el.getAttribute('opacity')
            const fill = el.getAttribute('fill') ?? 'none'
            el.remove()
            for (const segs of newPaths) {
              const p = document.createElementNS('http://www.w3.org/2000/svg', 'path')
              p.setAttribute('d', segs.join(' '))
              p.setAttribute('stroke', stroke)
              p.setAttribute('stroke-width', sw)
              p.setAttribute('fill', fill)
              p.setAttribute('stroke-linecap', 'round')
              p.setAttribute('stroke-linejoin', 'round')
              if (opacity) p.setAttribute('opacity', opacity)
              p.setAttribute('data-inline-draw', 'true')
              svgEl.appendChild(p)
            }
          }
        } else {
          try {
            const bbox = (el as SVGGraphicsElement).getBBox?.()
            if (bbox) {
              const cx = bbox.x + bbox.width / 2, cy = bbox.y + bbox.height / 2
              if (Math.hypot(cx - ex, cy - ey) < radius + Math.max(bbox.width, bbox.height) / 2) {
                el.remove()
              }
            }
          } catch { /* ignore */ }
        }
      })
    }

    function start(e: PointerEvent) {
      if (selectedGroup.current && tool !== 'lasso') deselectGroup()

      if (tool === 'eraser' && eraserMode === 'pixel') {
        eraserDown.current = true
        return
      }
      if (tool === 'eraser') return

      if (tool === 'lasso' && selectedGroup.current) {
        const target = document.elementFromPoint(e.clientX, e.clientY)
        if (selectedGroup.current.contains(target as Node)) {
          isDraggingGroup.current = true
          dragStart.current = { x: e.clientX, y: e.clientY }
          const existing = selectedGroup.current.getAttribute('transform')
          const match = existing?.match(/translate\(([-\d.]+)[, ]+([-\d.]+)\)/)
          groupTranslate.current = match
            ? { x: parseFloat(match[1]), y: parseFloat(match[2]) }
            : { x: 0, y: 0 }
          return
        }
        deselectGroup()
      }

      drawing.current = true
      startPos.current = { x: e.clientX, y: e.clientY }
      startTime.current = Date.now()
      pointsArray.current = [{ x: e.clientX, y: e.clientY }]

      if (tool === 'lasso') {
        pathData.current = `M${e.clientX} ${e.clientY}`
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        path.setAttribute('d', pathData.current)
        path.setAttribute('stroke', '#2563eb')
        path.setAttribute('stroke-width', '1.5')
        path.setAttribute('fill', 'none')
        path.setAttribute('stroke-dasharray', '6 3')
        path.setAttribute('opacity', '0.7')
        svgEl.appendChild(path)
        lassoPath.current = path
      } else if (tool === 'pen' || tool === 'marker') {
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
      if (tool === 'eraser' && eraserMode === 'pixel' && eraserDown.current) {
        pixelErase(e.clientX, e.clientY)
        return
      }

      if (isDraggingGroup.current && selectedGroup.current) {
        const dx = e.clientX - dragStart.current.x + groupTranslate.current.x
        const dy = e.clientY - dragStart.current.y + groupTranslate.current.y
        selectedGroup.current.setAttribute('transform', `translate(${dx}, ${dy})`)
        return
      }

      if (!drawing.current) return

      if (tool === 'lasso' && lassoPath.current) {
        pathData.current += ` L${e.clientX} ${e.clientY}`
        lassoPath.current.setAttribute('d', pathData.current)
        pointsArray.current.push({ x: e.clientX, y: e.clientY })
      } else if ((tool === 'pen' || tool === 'marker') && currentPath.current) {
        pathData.current += ` L${e.clientX} ${e.clientY}`
        currentPath.current.setAttribute('d', pathData.current)
        pointsArray.current.push({ x: e.clientX, y: e.clientY })
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

    function serializeDrawElements(): Record<string, unknown>[] {
      if (!svgEl) return []
      const els = svgEl.querySelectorAll('[data-inline-draw]')
      const result: Record<string, unknown>[] = []
      els.forEach((el) => {
        const tag = el.tagName.toLowerCase()
        if (tag === 'path') {
          result.push({
            type: 'path',
            d: el.getAttribute('d') ?? '',
            stroke: el.getAttribute('stroke') ?? '',
            strokeWidth: el.getAttribute('stroke-width') ?? '',
            opacity: el.getAttribute('opacity') ?? undefined,
            fill: el.getAttribute('fill') ?? 'none',
          })
        } else if (tag === 'rect') {
          result.push({
            type: 'rect',
            x: el.getAttribute('x') ?? '0',
            y: el.getAttribute('y') ?? '0',
            width: el.getAttribute('width') ?? '0',
            height: el.getAttribute('height') ?? '0',
            stroke: el.getAttribute('stroke') ?? '',
            strokeWidth: el.getAttribute('stroke-width') ?? '',
          })
        } else if (tag === 'ellipse') {
          result.push({
            type: 'ellipse',
            cx: el.getAttribute('cx') ?? '0',
            cy: el.getAttribute('cy') ?? '0',
            rx: el.getAttribute('rx') ?? '0',
            ry: el.getAttribute('ry') ?? '0',
            stroke: el.getAttribute('stroke') ?? '',
            strokeWidth: el.getAttribute('stroke-width') ?? '',
          })
        } else if (tag === 'line') {
          result.push({
            type: 'line',
            x1: el.getAttribute('x1') ?? '0',
            y1: el.getAttribute('y1') ?? '0',
            x2: el.getAttribute('x2') ?? '0',
            y2: el.getAttribute('y2') ?? '0',
            stroke: el.getAttribute('stroke') ?? '',
            strokeWidth: el.getAttribute('stroke-width') ?? '',
          })
        } else if (tag === 'g' && !el.classList.contains('inline-lasso-group')) {
          const line = el.querySelector('line')
          const polygon = el.querySelector('polygon')
          if (line && polygon) {
            result.push({
              type: 'arrow',
              x1: line.getAttribute('x1') ?? '0',
              y1: line.getAttribute('y1') ?? '0',
              x2: line.getAttribute('x2') ?? '0',
              y2: line.getAttribute('y2') ?? '0',
              stroke: line.getAttribute('stroke') ?? '',
              strokeWidth: line.getAttribute('stroke-width') ?? '',
              points: polygon.getAttribute('points') ?? '',
              fill: polygon.getAttribute('fill') ?? '',
            })
          }
        }
      })
      return result
    }

    function persistDrawData() {
      const serialized = serializeDrawElements()
      if (serialized.length > 0) {
        try {
          chrome.runtime.sendMessage(
            {
              type: 'SAVE_ANNOTATIONS',
              payload: { pageUrl: window.location.href, featureKey: 'drawPaths', data: serialized },
            },
            () => { if (chrome.runtime.lastError) { /* ignore */ } },
          )
        } catch { /* extension context unavailable */ }
      }
    }

    function end() {
      if (tool === 'eraser' && eraserMode === 'pixel') {
        eraserDown.current = false
        persistDrawData()
        return
      }

      if (isDraggingGroup.current) {
        isDraggingGroup.current = false
        const t = selectedGroup.current?.getAttribute('transform')
        const match = t?.match(/translate\(([-\d.]+)[, ]+([-\d.]+)\)/)
        if (match) groupTranslate.current = { x: parseFloat(match[1]), y: parseFloat(match[2]) }
        return
      }

      if (tool === 'lasso' && drawing.current && lassoPath.current) {
        drawing.current = false
        const pts = pointsArray.current
        if (pts.length > 2) {
          const lxs = pts.map(p => p.x), lys = pts.map(p => p.y)
          const lMinX = Math.min(...lxs), lMaxX = Math.max(...lxs)
          const lMinY = Math.min(...lys), lMaxY = Math.max(...lys)
          const drawEls = svgEl.querySelectorAll('[data-inline-draw]')
          const selected: SVGElement[] = []
          drawEls.forEach(el => {
            if (el === lassoPath.current) return
            if (el.classList.contains('inline-lasso-group')) return
            try {
              const bbox = (el as SVGGraphicsElement).getBBox()
              const cx = bbox.x + bbox.width / 2, cy = bbox.y + bbox.height / 2
              if (cx >= lMinX && cx <= lMaxX && cy >= lMinY && cy <= lMaxY) {
                selected.push(el as SVGElement)
              }
            } catch { /* ignore */ }
          })

          lassoPath.current.remove()
          lassoPath.current = null

          if (selected.length > 0) {
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
            g.classList.add('inline-lasso-group')
            g.setAttribute('data-inline-draw', 'true')
            svgEl.appendChild(g)
            let gMinX = Infinity, gMinY = Infinity, gMaxX = -Infinity, gMaxY = -Infinity
            for (const el of selected) {
              try {
                const bbox = (el as SVGGraphicsElement).getBBox()
                gMinX = Math.min(gMinX, bbox.x)
                gMinY = Math.min(gMinY, bbox.y)
                gMaxX = Math.max(gMaxX, bbox.x + bbox.width)
                gMaxY = Math.max(gMaxY, bbox.y + bbox.height)
              } catch { /* ignore */ }
              g.appendChild(el)
            }
            const border = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
            border.classList.add('inline-lasso-border')
            border.setAttribute('x', String(gMinX - 4))
            border.setAttribute('y', String(gMinY - 4))
            border.setAttribute('width', String(gMaxX - gMinX + 8))
            border.setAttribute('height', String(gMaxY - gMinY + 8))
            border.setAttribute('stroke', '#2563eb')
            border.setAttribute('stroke-width', '1.5')
            border.setAttribute('stroke-dasharray', '5 3')
            border.setAttribute('fill', 'none')
            border.setAttribute('rx', '3')
            g.insertBefore(border, g.firstChild)
            selectedGroup.current = g
            groupTranslate.current = { x: 0, y: 0 }
          }
        } else {
          lassoPath.current.remove()
          lassoPath.current = null
        }
        pointsArray.current = []
        return
      }

      if (tool === 'pen' && drawing.current && currentPath.current) {
        const pts = pointsArray.current
        const elapsed = Date.now() - startTime.current
        const shape = recognizeShape(pts, elapsed)
        if (shape) {
          const oldPath = currentPath.current
          const stroke = oldPath.getAttribute('stroke') ?? color
          const sw = oldPath.getAttribute('stroke-width') ?? String(thickness)
          oldPath.remove()
          if (shape.type === 'line') {
            const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line')
            ln.setAttribute('x1', String(shape.x1))
            ln.setAttribute('y1', String(shape.y1))
            ln.setAttribute('x2', String(shape.x2))
            ln.setAttribute('y2', String(shape.y2))
            ln.setAttribute('stroke', stroke)
            ln.setAttribute('stroke-width', sw)
            ln.setAttribute('stroke-linecap', 'round')
            ln.setAttribute('data-inline-draw', 'true')
            svgEl.appendChild(ln)
          } else if (shape.type === 'rect') {
            const rc = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
            rc.setAttribute('x', String(shape.x))
            rc.setAttribute('y', String(shape.y))
            rc.setAttribute('width', String(shape.width))
            rc.setAttribute('height', String(shape.height))
            rc.setAttribute('stroke', stroke)
            rc.setAttribute('stroke-width', sw)
            rc.setAttribute('fill', 'none')
            rc.setAttribute('rx', '2')
            rc.setAttribute('data-inline-draw', 'true')
            svgEl.appendChild(rc)
          } else if (shape.type === 'ellipse') {
            const el = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse')
            el.setAttribute('cx', String(shape.cx))
            el.setAttribute('cy', String(shape.cy))
            el.setAttribute('rx', String(shape.rx))
            el.setAttribute('ry', String(shape.ry))
            el.setAttribute('stroke', stroke)
            el.setAttribute('stroke-width', sw)
            el.setAttribute('fill', 'none')
            el.setAttribute('data-inline-draw', 'true')
            svgEl.appendChild(el)
          }
        }
      }

      drawing.current = false
      currentPath.current = null
      currentShapeEl.current = null
      pointsArray.current = []
      persistDrawData()
    }

    function erase(e: PointerEvent) {
      if (tool !== 'eraser' || eraserMode !== 'object') return
      const el = document.elementFromPoint(e.clientX, e.clientY)
      if (el && el.hasAttribute('data-inline-draw')) el.remove()
      if (el?.parentElement && el.parentElement.hasAttribute('data-inline-draw')) el.parentElement.remove()
      persistDrawData()
    }

    function onKeyDown(e: KeyboardEvent) {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedGroup.current) {
        selectedGroup.current.remove()
        selectedGroup.current = null
        persistDrawData()
      }
    }

    svgEl.addEventListener('pointerdown', start)
    svgEl.addEventListener('pointermove', move)
    svgEl.addEventListener('pointerup', end)
    svgEl.addEventListener('click', erase)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      svgEl.removeEventListener('pointerdown', start)
      svgEl.removeEventListener('pointermove', move)
      svgEl.removeEventListener('pointerup', end)
      svgEl.removeEventListener('click', erase)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [tool, color, thickness, eraserMode])

  const tools: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: 'pen', icon: <IPen />, label: 'Pen' },
    { id: 'marker', icon: <IMarker />, label: 'Marker' },
    { id: 'arrow', icon: <IArrow />, label: 'Arrow' },
    { id: 'rectangle', icon: <IRectangle />, label: 'Rectangle' },
    { id: 'ellipse', icon: <IEllipse />, label: 'Ellipse' },
    { id: 'eraser', icon: <IEraser />, label: 'Eraser' },
    { id: 'lasso', icon: <ILasso />, label: 'Lasso' },
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
          <IDraw />
          <span style={{ fontSize: 13, fontWeight: 500, color: C.accent, letterSpacing: '-0.02em' }}>Draw</span>
        </div>
        <button type="button" onClick={onClose} style={btnIcon}><IClose /></button>
      </div>

      {/* Tool grid – 3x3 */}
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

      {/* Eraser sub-mode pills */}
      {tool === 'eraser' && (
        <div style={{
          display: 'flex', gap: 6, padding: '0 16px 10px',
          justifyContent: 'center',
        }}>
          {(['object', 'pixel'] as const).map(mode => (
            <button key={mode} type="button"
              onClick={() => setEraserMode(mode)}
              style={{
                padding: '4px 14px', fontSize: 12, fontWeight: 500,
                borderRadius: C.radiusPill, cursor: 'pointer',
                border: `1.5px solid ${eraserMode === mode ? C.accent : C.border}`,
                background: eraserMode === mode ? C.toneSelectedBg : C.surfaceBubble,
                color: eraserMode === mode ? C.accent : C.textMuted,
                transition: 'background 0.15s, border-color 0.15s',
                letterSpacing: '-0.01em',
              }}
            >{mode.charAt(0).toUpperCase() + mode.slice(1)}</button>
          ))}
        </div>
      )}

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
            type="range" min={1} max={12} value={thickness}
            onChange={e => setThickness(Number(e.target.value))}
            style={{ flex: 1, width: '100%', accentColor: C.accent, height: 6, cursor: 'pointer' }}
          />
        </div>
        <button type="button" onClick={() => setThickness(v => Math.min(12, v + 1))} style={sliderBtn}>+</button>
      </div>

      {/* Color grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 10, padding: '8px 16px 18px',
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
