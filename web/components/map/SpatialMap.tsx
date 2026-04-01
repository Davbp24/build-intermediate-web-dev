'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import type { MapCoordinate } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Map as MapIcon } from 'lucide-react'

// Leaflet must be loaded client-side only
const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-full rounded-none" />,
})

interface SpatialMapProps {
  coordinates: MapCoordinate[]
}

export default function SpatialMap({ coordinates }: SpatialMapProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div className="relative w-full h-full">
      {mounted && <LeafletMap coordinates={coordinates} />}

      {/* Overlay: stats */}
      <div className="absolute top-4 left-4 z-[500] flex flex-col gap-2">
        <div className="bg-card/90 backdrop-blur border border-border rounded-lg px-3 py-2">
          <div className="flex items-center gap-2 text-xs font-medium">
            <MapIcon className="w-3.5 h-3.5 text-primary" />
            <span>{coordinates.length} geo-tagged notes</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          {(['text', 'canvas', 'ai-summary'] as const).map(type => (
            <div key={type} className="flex items-center gap-2 bg-card/90 backdrop-blur border border-border rounded-md px-2.5 py-1.5 shadow">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor:
                    type === 'text' ? 'oklch(0.585 0.228 264.4)' :
                    type === 'canvas' ? 'oklch(0.702 0.165 295.6)' :
                    'oklch(0.696 0.170 162.5)',
                }}
              />
              <span className="text-xs text-muted-foreground capitalize">{type === 'ai-summary' ? 'AI Summary' : type}</span>
              <Badge className="ml-auto h-4 text-[10px] bg-muted text-muted-foreground border-0 px-1">
                {coordinates.filter(c => c.type === type).length}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
