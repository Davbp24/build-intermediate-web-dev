import type { Metadata } from 'next'
import KnowledgeGraph from '@/components/graph/KnowledgeGraph'
import PageHeader from '@/components/shell/PageHeader'
import { fetchGraphData } from '@/lib/data'
import { Network } from 'lucide-react'

export const metadata: Metadata = { title: 'Graph' }

export default async function GraphPage() {
  const graphData = await fetchGraphData()

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Workspace', href: '/app/dashboard' }, { label: 'Knowledge Graph' }]}
        title="Knowledge Graph"
        subtitle="Entity relationships across all your annotations."
        action={
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 rounded-md bg-muted/60 border border-border/60">
            <Network className="w-3 h-3" />
            {graphData.nodes.length} nodes
          </span>
        }
      />
      {/* Constrained card container — not full-bleed */}
      <div className="p-6 max-w-7xl">
        <div className="rounded-xl border border-border bg-card overflow-hidden" style={{ height: 600 }}>
          <KnowledgeGraph data={graphData} />
        </div>
      </div>
    </>
  )
}
