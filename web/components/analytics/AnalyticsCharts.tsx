'use client'

import { useState, useMemo } from 'react'
import ActivityHeatmap from '@/components/dashboard/ActivityHeatmap'
import ActivityDetailPanel from '@/components/analytics/ActivityDetailPanel'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts'
import type { DashboardStats } from '@/lib/types'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, BookMarked, Globe, BrainCircuit, Flame } from 'lucide-react'

interface TimeSeries { date: string; count: number; ai: number }
interface Props {
  stats:        DashboardStats
  timeSeries30: TimeSeries[]
  timeSeries7:  TimeSeries[]
  workspaceId:  string
}

const CHART_COLORS = {
  primary:  '#6C91C2',
  teal:     '#5FA8A1',
  amber:    '#F2D6A2',
  violet:   '#a855f7',
  grid:     '#E2E8F0',
  text:     '#94a3b8',
}

const NOTE_TYPE_COLORS = ['#6C91C2', '#a855f7', '#5FA8A1']

type Period = '7d' | '30d'

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function StatChip({ label, value, delta, icon: Icon, iconColor }: {
  label: string; value: string | number; delta?: number; icon: React.ElementType; iconColor: string
}) {
  const pos = delta !== undefined && delta >= 0
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
      <div className={cn('w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0', iconColor)}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {delta !== undefined && (
          <span className={cn('text-xs font-medium flex items-center gap-1 mt-0.5', pos ? 'text-emerald-500' : 'text-red-400')}>
            {pos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {pos ? '+' : ''}{delta}% vs last period
          </span>
        )}
      </div>
    </div>
  )
}

function PeriodToggle({ period, onChange }: { period: Period; onChange: (p: Period) => void }) {
  return (
    <div className="flex rounded-lg border border-border bg-muted/40 p-0.5 gap-0.5">
      {(['7d', '30d'] as Period[]).map(p => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            'px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer',
            period === p
              ? 'bg-white border border-slate-200 text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {p === '7d' ? 'Last 7 days' : 'Last 30 days'}
        </button>
      ))}
    </div>
  )
}

// Custom Recharts tooltip
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-border rounded-xl px-3 py-2 text-sm">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-foreground font-medium">{p.name}: {p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main charts component
// ---------------------------------------------------------------------------
export default function AnalyticsCharts({ stats, timeSeries30, timeSeries7 }: Props) {
  const [period, setPeriod] = useState<Period>('30d')

  const series = period === '7d' ? timeSeries7 : timeSeries30

  // Format date labels
  const chartData = useMemo(() => series.map(d => ({
    ...d,
    label: new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  })), [series])

  // Note type distribution from topDomains proportionally  
  const noteTypeData = [
    { name: 'Text',       value: Math.max(1, Math.floor(stats.totalNotes * 0.55)) },
    { name: 'Canvas',     value: Math.max(1, Math.floor(stats.totalNotes * 0.25)) },
    { name: 'AI Summary', value: Math.max(1, Math.floor(stats.totalNotes * 0.20)) },
  ]

  // Domain data from topDomains
  const domainData = stats.topDomains.slice(0, 8).map(d => ({
    domain:  d.domain.replace(/^www\./, '').slice(0, 18),
    count:   d.count,
    pct:     d.percentage,
  }))

  const totalCaptures = series.reduce((sum, d) => sum + d.count, 0)
  const totalAI       = series.reduce((sum, d) => sum + d.ai, 0)
  const avgPerDay     = totalCaptures > 0 ? (totalCaptures / series.length).toFixed(1) : '0'

  return (
    <div className="space-y-6">
      <section id="activity" className="scroll-mt-28 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Activity</h2>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
            Daily capture intensity plus a breakdown of totals, your busiest day, and a recent day-by-day log.
          </p>
        </div>
        <div className="grid lg:grid-cols-5 gap-6 items-start">
          <div className="lg:col-span-3 min-w-0">
            <ActivityHeatmap data={stats.captureHistory} />
          </div>
          <div className="lg:col-span-2 min-w-0">
            <ActivityDetailPanel data={stats.captureHistory} />
          </div>
        </div>
      </section>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatChip label="Total Notes"     value={stats.totalNotes}      icon={BookMarked}   iconColor="text-primary" />
        <StatChip label="Domains Tracked" value={stats.totalDomains}    icon={Globe}        iconColor="text-sky-500" delta={stats.notesThisWeekDelta} />
        <StatChip label="AI Queries"      value={stats.aiQueriesRun}    icon={BrainCircuit} iconColor="text-emerald-500" />
        <StatChip label="Day Streak"      value={`${stats.streakDays}d`} icon={Flame}       iconColor="text-amber-500" />
      </div>

      {/* ── Capture volume chart ── */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold">Capture Volume</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalCaptures} total · {avgPerDay}/day avg · {totalAI} AI summaries
            </p>
          </div>
          <PeriodToggle period={period} onChange={setPeriod} />
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="captureGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={CHART_COLORS.primary} stopOpacity={0.15} />
                <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}    />
              </linearGradient>
              <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={CHART_COLORS.teal} stopOpacity={0.15} />
                <stop offset="95%" stopColor={CHART_COLORS.teal} stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: CHART_COLORS.text, fontSize: 10 }} tickLine={false} axisLine={false}
              interval={period === '7d' ? 0 : 'preserveStartEnd'} />
            <YAxis tick={{ fill: CHART_COLORS.text, fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
            <Area type="monotone" dataKey="count" name="Notes" stroke={CHART_COLORS.primary} strokeWidth={2} fill="url(#captureGrad)" dot={false} activeDot={{ r: 5 }} />
            <Area type="monotone" dataKey="ai"    name="AI"    stroke={CHART_COLORS.teal}    strokeWidth={2} fill="url(#aiGrad)"      dot={false} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Bottom row: domains + type split ── */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Domain breakdown */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Top Domains</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={domainData} layout="vertical" margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
              <XAxis type="number" tick={{ fill: CHART_COLORS.text, fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="domain" width={90} tick={{ fill: CHART_COLORS.text, fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Notes" fill={CHART_COLORS.primary} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Note type split */}
        <div className="rounded-2xl border border-border bg-card p-5 flex flex-col">
          <h2 className="text-sm font-semibold mb-4">Note Type Distribution</h2>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full flex items-center gap-6">
              <ResponsiveContainer width="60%" height={180}>
                <PieChart>
                  <Pie
                    data={noteTypeData}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {noteTypeData.map((_, i) => (
                      <Cell key={i} fill={NOTE_TYPE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {noteTypeData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: NOTE_TYPE_COLORS[i] }} />
                    <div>
                      <p className="text-xs font-semibold text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.value} notes</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
