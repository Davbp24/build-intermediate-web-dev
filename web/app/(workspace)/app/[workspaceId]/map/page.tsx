import type { Metadata } from 'next'
import SpatialMap from '@/components/map/SpatialMap'
import PageHeader from '@/components/shell/PageHeader'
import { fetchMapCoordinates } from '@/lib/data'
import { getWorkspaceName } from '@/lib/workspaces'
import { Layers } from 'lucide-react'

export const metadata: Metadata = { title: 'Map' }

export default async function WorkspaceMapPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params
  const workspaceName = getWorkspaceName(workspaceId)
  const coordinates = await fetchMapCoordinates(workspaceId)

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <PageHeader
        crumbs={[
          { label: workspaceName, href: `/app/${workspaceId}/dashboard` },
          { label: 'Map' },
        ]}
        action={
          <span className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground">
            <Layers className="h-3 w-3" />
            {coordinates.length} locations
          </span>
        }
      />
      <div className="relative flex-1 overflow-hidden">
        <SpatialMap coordinates={coordinates} storageKey={`inline-map-pins-${workspaceId}`} />
      </div>
    </div>
  )
}
