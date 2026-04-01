import type { Metadata } from 'next'
import { Suspense } from 'react'
import NotesTable from '@/components/history/NotesTable'
import PageHeader from '@/components/shell/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchNotes } from '@/lib/data'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'History' }

function TableSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-8 w-36" />
      </div>
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="bg-card px-4 py-3 border-b border-border flex gap-6">
          {['w-20', 'w-12', 'w-16', 'w-14', 'w-20'].map((w, i) => (
            <Skeleton key={i} className={`h-3 ${w}`} />
          ))}
        </div>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="px-4 py-3.5 border-b border-border last:border-0 flex gap-6 items-center">
            <div className="flex items-start gap-3 flex-1">
              <Skeleton className="w-1 h-10 rounded-full" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}

async function HistorySection({ highlightNoteId }: { highlightNoteId?: string }) {
  const notes = await fetchNotes()
  return <NotesTable notes={notes} workspaceId="ws-1" highlightNoteId={highlightNoteId} />
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const q = (await searchParams)?.q
  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Workspace', href: '/app/dashboard' }, { label: 'History' }]}
        title="History"
        subtitle="Every annotation you've ever made, in one place."
        action={
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
            <Download className="w-3.5 h-3.5" />
            Export
          </Button>
        }
      />
      <div className="p-6 max-w-7xl">
        <Suspense fallback={<TableSkeleton />}>
          <HistorySection highlightNoteId={q} />
        </Suspense>
      </div>
    </>
  )
}
