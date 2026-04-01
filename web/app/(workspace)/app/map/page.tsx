import type { Metadata } from 'next'
import SpatialMap from '@/components/map/SpatialMap'
import PageHeader from '@/components/shell/PageHeader'
import { fetchMapCoordinates } from '@/lib/data'
import { Layers } from 'lucide-react'

export const metadata: Metadata = { title: 'Map' }

export default async function MapPage() {
  const coordinates = await fetchMapCoordinates()

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <PageHeader
        crumbs={[{ label: 'Workspace', href: '/app/dashboard' }, { label: 'Spatial Map' }]}
        title="Spatial Map"
        subtitle="Geographic distribution of your tracked entities."
        action={
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 rounded-md bg-muted/60 border border-border/60">
            <Layers className="w-3 h-3" />
            {coordinates.length} points
          </span>
        }
      />
      <div className="flex-1 relative overflow-hidden">
        <SpatialMap coordinates={coordinates} />
      </div>
    </div>
  )
}
