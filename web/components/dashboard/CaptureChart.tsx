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
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="font-semibold text-slate-800">{payload[0].value} notes</p>
    </div>
  )
}

export default function CaptureChart({ data }: CaptureChartProps) {
  const formatted = data.map(d => ({ ...d, label: formatDate(d.date) }))

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-5">
        <p className="text-sm font-semibold text-slate-800">Capture Volume</p>
        <p className="text-xs text-slate-400 mt-0.5">Notes captured per day</p>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formatted} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="captureGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4B83C4" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#4B83C4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F1EF" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#9B9A97' }}
              tickLine={false}
              axisLine={false}
              interval={5}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#9B9A97' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E3E2DE' }} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#4B83C4"
              strokeWidth={2}
              fill="url(#captureGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#4B83C4', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
