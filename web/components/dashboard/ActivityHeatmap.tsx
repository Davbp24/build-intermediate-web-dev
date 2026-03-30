'use client'

import Link from 'next/link'
import type { DailyCapture } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ActivityHeatmapProps {
  data: DailyCapture[]
  linkHref?: string
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getIntensityClass(count: number, max: number) {
  if (count === 0) return 'bg-slate-100'
  const ratio = count / max
  if (ratio < 0.25) return 'bg-[#EDEBE8]'
  if (ratio < 0.5) return 'bg-[#E3E2DE]'
  if (ratio < 0.75) return 'bg-[#7A756D]'
  return 'bg-[#191919]'
}

export default function ActivityHeatmap({ data, linkHref }: ActivityHeatmapProps) {
  const max = Math.max(...data.map(d => d.count), 1)

  const firstDate = new Date(data[0]?.date ?? new Date().toISOString())
  const startPadding = firstDate.getDay()
  const cells: (DailyCapture | null)[] = [
    ...Array(startPadding).fill(null),
    ...data,
  ]

  const remainder = cells.length % 7
  if (remainder > 0) {
    for (let i = 0; i < 7 - remainder; i++) cells.push(null)
  }

  const weeks: (DailyCapture | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }

  const shellClass = 'rounded-xl border border-slate-200 bg-white p-5'

  const body = (
    <>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">Activity</p>
          <p className="text-xs text-slate-400 mt-0.5">Capture frequency, last 30 days</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
          <span>Less</span>
          {['bg-slate-100', 'bg-[#EDEBE8]', 'bg-[#E3E2DE]', 'bg-[#7A756D]', 'bg-[#191919]'].map(cls => (
            <div key={cls} className={cn('w-3 h-3 rounded-sm', cls)} />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto scrollbar-minimal">
        <div className="flex flex-col gap-1 mr-1 shrink-0">
          <div className="h-3" />
          {WEEKDAY_LABELS.map((day, i) => (
            <div key={day} className="h-3 flex items-center">
              {i % 2 === 1 && (
                <span className="text-[9px] text-slate-400 leading-none w-6">{day}</span>
              )}
              {i % 2 !== 1 && <span className="w-6" />}
            </div>
          ))}
        </div>

        {weeks.map((week, wi) => {
          const firstReal = week.find(d => d !== null)
          const monthLabel = firstReal
            ? new Date(firstReal.date).toLocaleDateString('en-US', { month: 'short' })
            : ''
          return (
            <div key={`w-${wi}`} className="flex flex-col gap-1 shrink-0">
              <div className="h-3 flex items-center">
                <span className="text-[9px] text-slate-400 leading-none">{wi % 4 === 0 ? monthLabel : ''}</span>
              </div>
              {week.map((cell, di) => (
                <div
                  key={cell ? cell.date : `pad-${wi}-${di}`}
                  title={cell ? `${cell.date}: ${cell.count} notes` : ''}
                  className={cn(
                    'w-3 h-3 rounded-sm transition-opacity',
                    linkHref ? 'pointer-events-none' : 'hover:opacity-80',
                    cell ? getIntensityClass(cell.count, max) : 'bg-transparent',
                  )}
                />
              ))}
            </div>
          )
        })}
      </div>
    </>
  )

  if (linkHref) {
    return (
      <Link
        href={linkHref}
        className={cn(shellClass, 'block transition-colors hover:border-[#D3D1CB]')}
        aria-label="View full activity on Analytics"
      >
        {body}
      </Link>
    )
  }

  return <div className={shellClass}>{body}</div>
}
