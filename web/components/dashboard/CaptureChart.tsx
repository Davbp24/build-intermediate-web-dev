'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import type { DailyCapture } from '@/lib/types'

interface CaptureChartProps {
  data: DailyCapture[]
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="font-semibold text-foreground">{payload[0].value} notes</p>
    </div>
  )
}

export default function CaptureChart({ data }: CaptureChartProps) {
  const formatted = data.map(d => ({ ...d, label: formatDate(d.date) }))

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-5">
        <p className="text-sm font-semibold">Capture Volume</p>
        <p className="text-xs text-muted-foreground mt-0.5">Notes captured per day, last 30 days</p>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formatted} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="captureGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.585 0.228 264.4)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="oklch(0.585 0.228 264.4)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: 'oklch(0.64 0 0)' }}
              tickLine={false}
              axisLine={false}
              interval={5}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'oklch(0.64 0 0)' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'oklch(1 0 0 / 15%)' }} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="oklch(0.585 0.228 264.4)"
              strokeWidth={2}
              fill="url(#captureGradient)"
              dot={false}
              activeDot={{ r: 4, fill: 'oklch(0.585 0.228 264.4)', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
