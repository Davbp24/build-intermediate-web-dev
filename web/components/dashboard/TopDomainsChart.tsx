'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import type { DomainStat } from '@/lib/types'

const COLORS = [
  'oklch(0.595 0.214 262.1)',
  'oklch(0.702 0.165 295.6)',
  'oklch(0.749 0.134 222.9)',
  'oklch(0.696 0.170 162.5)',
  'oklch(0.769 0.153 77.6)',
  'oklch(0.704 0.191 22.216)',
  'oklch(0.64 0 0)',
]

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: DomainStat }[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs">
      <p className="font-medium text-foreground mb-1">{d.domain}</p>
      <p className="text-muted-foreground">{d.count} notes · {d.percentage}%</p>
    </div>
  )
}

interface TopDomainsChartProps {
  data: DomainStat[]
}

export default function TopDomainsChart({ data }: TopDomainsChartProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-5">
        <p className="text-sm font-semibold">Top Domains</p>
        <p className="text-xs text-muted-foreground mt-0.5">Notes by website, all time</p>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data.slice(0, 6)}
            layout="vertical"
            margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
            barSize={10}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: 'oklch(0.64 0 0)' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="domain"
              tick={{ fontSize: 10, fill: 'oklch(0.64 0 0)' }}
              tickLine={false}
              axisLine={false}
              width={120}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'oklch(1 0 0 / 4%)' }} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {data.slice(0, 6).map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
