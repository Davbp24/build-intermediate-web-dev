import type { Metadata } from 'next'
import { Suspense } from 'react'
import { BarChart2, BookMarked, Globe, BrainCircuit, Flame, RefreshCw } from 'lucide-react'
import KpiCard from '@/components/dashboard/KpiCard'
import CaptureChart from '@/components/dashboard/CaptureChart'
import TopDomainsChart from '@/components/dashboard/TopDomainsChart'
import ActivityHeatmap from '@/components/dashboard/ActivityHeatmap'
import PinnedCapturesRow from '@/components/dashboard/PinnedCapturesRow'
import LibraryDocumentsSection from '@/components/dashboard/LibraryDocumentsSection'
import PageHeader from '@/components/shell/PageHeader'
import { KpiSkeleton, ChartSkeleton, HeatmapSkeleton } from '@/components/dashboard/DashboardSkeleton'
import { fetchDashboardStats, fetchNotes } from '@/lib/data'

export const metadata: Metadata = { title: 'Dashboard' }

/** Legacy `/app/dashboard` — scope library + pins to default workspace */
const DEFAULT_WORKSPACE_ID = 'ws-1'

async function StatsSection() {
  const stats = await fetchDashboardStats(DEFAULT_WORKSPACE_ID)

  const kpis = [
    { title: 'Notes This Week',  value: stats.notesThisWeek,              delta: stats.notesThisWeekDelta, deltaLabel: 'vs last week', icon: BookMarked,   iconColor: 'text-stone-700' },
    { title: 'Total Notes',      value: stats.totalNotes.toLocaleString(), description: 'Across all domains',        icon: BarChart2,    iconColor: 'text-teal-800' },
    { title: 'Domains Tracked',  value: stats.totalDomains,               description: 'Unique websites',           icon: Globe,        iconColor: 'text-amber-800' },
    { title: 'AI Queries Run',   value: stats.aiQueriesRun,               description: 'Summaries generated',       icon: BrainCircuit, iconColor: 'text-stone-600' },
    { title: 'Day Streak',       value: `${stats.streakDays}d`,           description: 'Consecutive active days',   icon: Flame,        iconColor: 'text-orange-800' },
  ]

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {kpis.map(kpi => <KpiCard key={kpi.title} {...kpi} />)}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <CaptureChart data={stats.captureHistory} />
        <TopDomainsChart data={stats.topDomains} />
      </div>
      <ActivityHeatmap data={stats.captureHistory} linkHref="/app/ws-1/analytics#activity" />
    </>
  )
}

async function CapturesAndLibrarySection() {
  const notes = await fetchNotes(DEFAULT_WORKSPACE_ID)
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Web captures
        </h2>
        <p className="text-xs text-muted-foreground mb-3">
          Pages you&apos;ve annotated. Use the star to pin favorites to the front of this row.
        </p>
        <PinnedCapturesRow workspaceId={DEFAULT_WORKSPACE_ID} initialNotes={notes} />
      </div>
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Library documents
        </h2>
        <p className="text-xs text-muted-foreground mb-3">
          Folder documents for this workspace — open to edit. Star to pin here on the dashboard.
        </p>
        <LibraryDocumentsSection workspaceId={DEFAULT_WORKSPACE_ID} />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Workspace', href: '/app/dashboard' }, { label: 'Dashboard' }]}
        title="Dashboard"
        subtitle="Web captures, library documents, and activity for your default workspace."
        action={(
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 rounded-md bg-muted/60 border border-border/60">
            <RefreshCw className="w-3 h-3" />
            Last synced: just now
          </span>
        )}
      />

      <div className="p-6 space-y-8 max-w-7xl">
        <Suspense fallback={(
          <div className="space-y-6">
            <div className="flex gap-3 overflow-hidden">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-[240px] h-[200px] shrink-0 rounded-2xl bg-muted/50 animate-pulse" />
              ))}
            </div>
            <div className="h-40 rounded-2xl bg-muted/40 animate-pulse" />
          </div>
        )}
        >
          <CapturesAndLibrarySection />
        </Suspense>

        <Suspense
          fallback={(
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {[...Array(5)].map((_, i) => <KpiSkeleton key={i} />)}
              </div>
              <div className="grid lg:grid-cols-2 gap-4">
                <ChartSkeleton /><ChartSkeleton />
              </div>
              <HeatmapSkeleton />
            </div>
          )}
        >
          <StatsSection />
        </Suspense>
      </div>
    </>
  )
}
