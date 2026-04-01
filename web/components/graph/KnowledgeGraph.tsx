'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import type { GraphData, GraphNode } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { Share2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/lib/sidebar-context'

const ForceGraph2D = dynamic(
  () => import('react-force-graph-2d').then(m => m.default),
  { ssr: false, loading: () => <Skeleton className="w-full h-full rounded-none" /> },
)

interface KnowledgeGraphProps {
  data: GraphData
}

const NODE_COLORS: Record<GraphNode['type'], string> = {
  url:  '#6C91C2',   // Inline primary blue
  note: '#F2D6A2',   // warm highlight
  tag:  '#5FA8A1',   // teal accent
}

export default function KnowledgeGraph({ data }: KnowledgeGraphProps) {
  const graphRef = useRef<any>(null)
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)
  const [mounted, setMounted] = useState(false)
  const { collapsed } = useSidebar()

  useEffect(() => setMounted(true), [])

  const handleZoomFit = useCallback(() => graphRef.current?.zoomToFit(600, 60), [])

  // Auto-center when sidebar collapses/expands — give the layout animation time to settle
  useEffect(() => {
    const t = setTimeout(handleZoomFit, 350)
    return () => clearTimeout(t)
  }, [collapsed, handleZoomFit])

  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const gNode = node as GraphNode
    const size = (gNode.size ?? 6) / globalScale * 2
    const color = gNode.color ?? NODE_COLORS[gNode.type] ?? '#6366f1'
    const x = gNode.x ?? 0
    const y = gNode.y ?? 0

    // Glow for URL nodes or hovered
    if (gNode.type === 'url' || gNode === hoveredNode) {
      ctx.beginPath()
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2.5)
      gradient.addColorStop(0, color + '50')
      gradient.addColorStop(1, color + '00')
      ctx.fillStyle = gradient
      ctx.arc(x, y, size * 2.5, 0, 2 * Math.PI)
      ctx.fill()
    }

    // Node circle
    ctx.beginPath()
    ctx.arc(x, y, size, 0, 2 * Math.PI)
    ctx.fillStyle = gNode === hoveredNode ? '#ffffff' : color
    ctx.fill()

    // Crisp border for all nodes
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'
    ctx.lineWidth = 1.5 / globalScale
    ctx.stroke()

    // Label
    const label = gNode.label ?? ''
    const fontSize = Math.max(8 / globalScale, 3)
    ctx.font = `600 ${fontSize}px system-ui`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillStyle = 'rgba(30,41,59,0.75)'
    ctx.fillText(label.length > 20 ? label.slice(0, 18) + '…' : label, x, y + size + 3 / globalScale)
  }, [hoveredNode])

  const nodePointerAreaPaint = useCallback((node: any, color: string, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const gNode = node as GraphNode
    const size = (gNode.size ?? 6) / globalScale * 2.5
    ctx.beginPath()
    ctx.arc(gNode.x ?? 0, gNode.y ?? 0, size, 0, 2 * Math.PI)
    ctx.fillStyle = color
    ctx.fill()
  }, [])

  return (
    <div className="relative w-full h-full bg-background overflow-hidden">
      {mounted && (
        <ForceGraph2D
          ref={graphRef}
          graphData={data as any}
          backgroundColor="#f8fafc"
          nodeCanvasObject={nodeCanvasObject}
          nodePointerAreaPaint={nodePointerAreaPaint}
          linkColor={() => 'rgba(100,116,139,0.18)'}
          linkWidth={1.2}
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={0.003}
          linkDirectionalParticleWidth={2}
          linkDirectionalParticleColor={() => 'rgba(108,145,194,0.7)'}
          onNodeHover={(node: any) => setHoveredNode(node as GraphNode | null)}
          cooldownTicks={80}
          onEngineStop={handleZoomFit}
          enableNodeDrag
          enableZoomInteraction
        />
      )}

      {/* Fit button */}
      <div className="absolute bottom-6 right-6 z-10">
        <Button
          variant="outline"
          size="icon-sm"
          className="bg-card/90 backdrop-blur border border-border"
          onClick={handleZoomFit}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 z-10 bg-card/90 backdrop-blur border border-border rounded-lg p-3 space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Share2 className="w-3 h-3" />
          Legend
        </p>
        {[
          { label: 'Website', color: '#6C91C2' },
          { label: 'Note',    color: '#F2D6A2' },
          { label: 'Tag',     color: '#5FA8A1' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Hover tooltip */}
      {hoveredNode && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-card/95 backdrop-blur border border-border rounded-lg px-3 py-2 text-xs max-w-xs text-center pointer-events-none">
          <p className="font-medium">{hoveredNode.label}</p>
          {hoveredNode.domain && (
            <p className="text-muted-foreground mt-0.5">{hoveredNode.domain}</p>
          )}
        </div>
      )}
    </div>
  )
}
