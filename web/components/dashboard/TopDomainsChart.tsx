'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import type { DomainStat } from '@/lib/types'

const COLORS = ['#4B83C4', '#9065B0', '#0F7B6C', '#D9730D', '#CB912F', '#C4554D', '#9B9A97']

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: DomainStat }[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs">
      <p className="font-medium text-slate-800 mb-1">{d.domain}</p>
      <p className="text-slate-400">{d.count} notes &middot; {d.percentage}%</p>
    </div>
  )
}

interface TopDomainsChartProps {
  data: DomainStat[]
}

export default function TopDomainsChart({ data }: TopDomainsChartProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-5">
        <p className="text-sm font-semibold text-slate-800">Top Domains</p>
        <p className="text-xs text-slate-400 mt-0.5">Notes by website</p>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data.slice(0, 6)}
            layout="vertical"
            margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
            barSize={10}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F1EF" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: '#9B9A97' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="domain"
              tick={{ fontSize: 10, fill: '#9B9A97' }}
              tickLine={false}
              axisLine={false}
              width={120}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F7F6F3' }} />
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
