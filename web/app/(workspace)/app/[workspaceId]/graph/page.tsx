import type { Metadata } from 'next'
import { Suspense } from 'react'
import PageHeader from '@/components/shell/PageHeader'
import KnowledgeGraph from '@/components/graph/KnowledgeGraph'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchGraphData } from '@/lib/data'
import { getWorkspaceName } from '@/lib/workspaces'

export const metadata: Metadata = { title: 'Knowledge Graph' }

async function GraphData({ workspaceId }: { workspaceId: string }) {
  const data = await fetchGraphData(workspaceId)
  return (
    // Immersive: fills the remaining height after the sticky header (~100px)
    <div className="w-full" style={{ height: 'calc(100vh - 100px)' }}>
      <KnowledgeGraph data={data} />
    </div>
  )
}

export default async function WorkspaceGraphPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params
  const workspaceName   = getWorkspaceName(workspaceId)

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <PageHeader
        crumbs={[
          { label: workspaceName, href: `/app/${workspaceId}/dashboard` },
          { label: 'Knowledge Graph' },
        ]}
        title="Knowledge Graph"
        subtitle="Semantic relationships between your notes, websites, and tags."
      />
      {/* No card wrapper — immersive full-height canvas */}
      <Suspense fallback={<Skeleton className="flex-1 rounded-none" />}>
        <GraphData workspaceId={workspaceId} />
      </Suspense>
    </div>
  )
}
