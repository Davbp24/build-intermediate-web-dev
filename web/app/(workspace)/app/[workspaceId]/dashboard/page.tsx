import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import {
  BarChart2, BookMarked, Globe, BrainCircuit, Flame,
  Plus, Sparkles, ChevronRight,
} from 'lucide-react'
import KpiCard from '@/components/dashboard/KpiCard'
import CaptureChart from '@/components/dashboard/CaptureChart'
import TopDomainsChart from '@/components/dashboard/TopDomainsChart'
import ActivityHeatmap from '@/components/dashboard/ActivityHeatmap'
import PinnedCapturesRow from '@/components/dashboard/PinnedCapturesRow'
import LibraryDocumentsSection from '@/components/dashboard/LibraryDocumentsSection'
import { KpiSkeleton, ChartSkeleton, HeatmapSkeleton } from '@/components/dashboard/DashboardSkeleton'
import { fetchDashboardStats, fetchNotes } from '@/lib/data'
import { getWorkspaceName } from '@/lib/workspaces'

export const metadata: Metadata = { title: 'Dashboard' }

function Greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

async function StatsSection({ workspaceId }: { workspaceId: string }) {
  const stats = await fetchDashboardStats(workspaceId)
  const analyticsBase = `/app/${workspaceId}/analytics`

  const kpis = [
    { title: 'This week',     value: stats.notesThisWeek,               delta: stats.notesThisWeekDelta, deltaLabel: 'vs last week', icon: BookMarked,   iconColor: 'text-[#4B83C4]', href: analyticsBase },
    { title: 'Total notes',   value: stats.totalNotes.toLocaleString(), description: 'All time',         icon: BarChart2,    iconColor: 'text-[#4B83C4]', href: analyticsBase },
    { title: 'Domains',       value: stats.totalDomains,                description: 'Unique websites',  icon: Globe,        iconColor: 'text-[#4B83C4]', href: analyticsBase },
    { title: 'AI queries',    value: stats.aiQueriesRun,                description: 'Summaries made',   icon: BrainCircuit, iconColor: 'text-[#4B83C4]', href: analyticsBase },
    { title: 'Streak',        value: `${stats.streakDays}d`,            description: 'Active days',      icon: Flame,        iconColor: 'text-[#4B83C4]', href: analyticsBase },
  ]

  return (
    <div className="space-y-4">
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
    </div>
  )
}

async function CapturesSection({ workspaceId }: { workspaceId: string }) {
  const notes = await fetchNotes(workspaceId)
  return <PinnedCapturesRow workspaceId={workspaceId} initialNotes={notes} />
}

export default async function WorkspaceDashboardPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params
  const workspaceName   = getWorkspaceName(workspaceId)

  return (
    <div className="min-h-full bg-white">
      {/* ── Top breadcrumb bar ── */}
      <div className="border-b border-[#E3E2DE] bg-white px-8 py-3">
        <nav className="flex items-center gap-1.5 text-xs text-[#9B9A97]">
          <span>{workspaceName}</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#37352F] font-medium">Dashboard</span>
        </nav>
      </div>

      {/* ── Main content — generous bottom padding so chat bar never overlaps ── */}
      <div className="px-8 py-8 pb-32 max-w-7xl space-y-12">

        {/* ── Greeting + actions ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#191919] tracking-tight">
              <Greeting />
            </h1>
            <p className="text-sm text-[#9B9A97] mt-0.5">Here&apos;s what&apos;s happening in your workspace.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/app/${workspaceId}/workflows`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#E3E2DE] text-sm font-medium text-[#37352F] hover:bg-[#F7F6F3] hover:border-[#D3D1CB] transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Workflows
            </Link>
            <Link
              href={`/app/${workspaceId}/history`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#191919] text-sm font-medium text-white hover:bg-[#150C00] transition-colors"
            >
              View all captures
            </Link>
          </div>
        </div>

        {/* ── Web Captures ── */}
        <section>
          <h2 className="text-sm font-semibold text-[#37352F] mb-4">Web Captures</h2>
          <Suspense fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-40 rounded-2xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          }>
            <CapturesSection workspaceId={workspaceId} />
          </Suspense>
        </section>

        {/* ── Library Documents ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#37352F]">Library Documents</h2>
            <Link
              href={`/app/${workspaceId}/folder/new`}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#9B9A97] hover:text-[#37352F] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New
            </Link>
          </div>
          <Suspense fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-40 rounded-2xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          }>
            <LibraryDocumentsSection workspaceId={workspaceId} />
          </Suspense>
        </section>

        {/* ── Stats & Activity ── */}
        <section>
          <h2 className="text-sm font-semibold text-[#37352F] mb-4">Stats &amp; Activity</h2>
          <Suspense fallback={
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {[...Array(5)].map((_, i) => <KpiSkeleton key={i} />)}
              </div>
              <div className="grid lg:grid-cols-2 gap-4">
                <ChartSkeleton /><ChartSkeleton />
              </div>
              <HeatmapSkeleton />
            </div>
          }>
            <StatsSection workspaceId={workspaceId} />
          </Suspense>
        </section>

      </div>
    </div>
  )
}
