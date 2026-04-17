import type { Metadata } from 'next'
import SpatialMap from '@/components/map/SpatialMap'
import { fetchMapCoordinates } from '@/lib/data'

export const metadata: Metadata = { title: 'Map' }

export default async function MapPage() {
  const coordinates = await fetchMapCoordinates()

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <SpatialMap coordinates={coordinates} storageKey="inline-map-pins-global" backHref="/app/dashboard" />
    </div>
  )
}
