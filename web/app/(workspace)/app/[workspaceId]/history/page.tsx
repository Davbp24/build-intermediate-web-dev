import type { Metadata } from 'next'
import { Suspense } from 'react'
import NotesTable from '@/components/history/NotesTable'
import PageHeader from '@/components/shell/PageHeader'
import ExportButton from '@/components/shell/ExportButton'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchNotes } from '@/lib/data'
import { getWorkspaceName } from '@/lib/workspaces'

export const metadata: Metadata = { title: 'History' }

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(8)].map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  )
}

async function HistorySection({
  workspaceId,
  highlightNoteId,
}: {
  workspaceId: string
  highlightNoteId?: string
}) {
  const notes = await fetchNotes(workspaceId)
  return <NotesTable notes={notes} workspaceId={workspaceId} highlightNoteId={highlightNoteId} />
}

export default async function WorkspaceHistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string }>
  searchParams: Promise<{ q?: string }>
}) {
  const { workspaceId } = await params
  const q = (await searchParams)?.q
  const workspaceName = getWorkspaceName(workspaceId)

  return (
    <>
      <PageHeader
        crumbs={[
          { label: workspaceName, href: `/app/${workspaceId}/dashboard` },
          { label: 'History' },
        ]}
        title="History"
        subtitle="Every annotation you've ever made, in one place."
        action={
          <ExportButton
            workspaceId={workspaceId}
            className="h-8 px-3 rounded-lg border border-border bg-card text-sm text-foreground hover:bg-accent/40 transition-colors"
          />
        }
      />
      <div className="p-6 max-w-7xl">
        <Suspense fallback={<TableSkeleton />}>
          <HistorySection workspaceId={workspaceId} highlightNoteId={q} />
        </Suspense>
      </div>
    </>
  )
}
