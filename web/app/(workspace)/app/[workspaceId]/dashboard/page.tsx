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
import { getWorkspaceName } from '@/lib/workspaces'

export const metadata: Metadata = { title: 'Dashboard' }

async function StatsSection({ workspaceId }: { workspaceId: string }) {
  const stats = await fetchDashboardStats(workspaceId)
  const analyticsBase = `/app/${workspaceId}/analytics`

  const kpis = [
    {
      title: 'Notes This Week',  value: stats.notesThisWeek,
      delta: stats.notesThisWeekDelta, deltaLabel: 'vs last week',
      icon: BookMarked, iconColor: 'text-primary',
      href: analyticsBase,
    },
    {
      title: 'Total Notes', value: stats.totalNotes.toLocaleString(),
      description: 'Across all domains',
      icon: BarChart2, iconColor: 'text-violet-500',
      href: analyticsBase,
    },
    {
      title: 'Domains Tracked', value: stats.totalDomains,
      description: 'Unique websites',
      icon: Globe, iconColor: 'text-sky-500',
      href: analyticsBase,
    },
    {
      title: 'AI Queries Run', value: stats.aiQueriesRun,
      description: 'Summaries generated',
      icon: BrainCircuit, iconColor: 'text-emerald-500',
      href: analyticsBase,
    },
    {
      title: 'Day Streak', value: `${stats.streakDays}d`,
      description: 'Consecutive active days',
      icon: Flame, iconColor: 'text-amber-500',
      href: analyticsBase,
    },
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
      <ActivityHeatmap
        data={stats.captureHistory}
        linkHref={`/app/${workspaceId}/analytics#activity`}
      />
    </>
  )
}

async function CapturesAndLibrarySection({ workspaceId }: { workspaceId: string }) {
  const notes = await fetchNotes(workspaceId)
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Web captures
        </h2>
        <p className="text-xs text-muted-foreground mb-3">
          Pages you&apos;ve annotated. Star any card to pin it to the front of this row.
        </p>
        <PinnedCapturesRow workspaceId={workspaceId} initialNotes={notes} />
      </div>
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Library documents
        </h2>
        <p className="text-xs text-muted-foreground mb-3">
          Documents from your nested folders — click to open the editor. Star to pin on the dashboard.
        </p>
        <LibraryDocumentsSection workspaceId={workspaceId} />
      </div>
    </div>
  )
}

export default async function WorkspaceDashboardPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params
  const workspaceName   = getWorkspaceName(workspaceId)

  return (
    <>
      <PageHeader
        crumbs={[
          { label: workspaceName, href: `/app/${workspaceId}/dashboard` },
          { label: 'Dashboard' },
        ]}
        title="Dashboard"
        subtitle="Web captures, library documents, and activity for this workspace."
        action={(
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 rounded-md bg-muted/60 border border-border/60">
            <RefreshCw className="w-3 h-3" />
            Live data
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
          <CapturesAndLibrarySection workspaceId={workspaceId} />
        </Suspense>

        <Suspense fallback={(
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
          <StatsSection workspaceId={workspaceId} />
        </Suspense>
      </div>
    </>
  )
}
