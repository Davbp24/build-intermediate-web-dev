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
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      <PageHeader
        crumbs={[
          { label: workspaceName, href: `/app/${workspaceId}/dashboard` },
          { label: 'Map' },
        ]}
        title="Global Map"
        subtitle="See where your research takes you around the world."
        action={
          <span className="text-xs text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg font-medium">
            {coordinates.length} {coordinates.length === 1 ? 'location' : 'locations'}
          </span>
        }
      />
      <div className="flex-1 relative overflow-hidden">
        <SpatialMap coordinates={coordinates} />
      </div>
    </div>
  )
}
