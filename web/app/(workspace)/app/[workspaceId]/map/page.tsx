import type { Metadata } from 'next'
import SpatialMap from '@/components/map/SpatialMap'
import PageHeader from '@/components/shell/PageHeader'
import { fetchMapCoordinates } from '@/lib/data'
import { getWorkspaceName } from '@/lib/workspaces'

export const metadata: Metadata = { title: 'Map' }

export default async function WorkspaceMapPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params
  const workspaceName   = getWorkspaceName(workspaceId)
  const coordinates     = await fetchMapCoordinates(workspaceId)

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <PageHeader
        crumbs={[
          { label: workspaceName, href: `/app/${workspaceId}/dashboard` },
          { label: 'Spatial Map' },
        ]}
        title="Spatial Map"
        subtitle="Geographic distribution of your tracked entities."
        action={
          <span className="text-xs text-muted-foreground bg-muted/60 border border-border/60 px-2 py-1 rounded-md">
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
