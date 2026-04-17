import type { Metadata } from 'next'
import KnowledgeGraph from '@/components/graph/KnowledgeGraph'
import { fetchGraphData } from '@/lib/data'

export const metadata: Metadata = { title: 'Graph' }

export default async function GraphPage() {
  const graphData = await fetchGraphData()

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <KnowledgeGraph data={graphData} />
    </div>
  )
}
