import Link from 'next/link'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface KpiCardProps {
  title:        string
  value:        string | number
  delta?:       number
  deltaLabel?:  string
  icon:         React.ElementType
  iconColor?:   string
  description?: string
  href?:        string
}

export default function KpiCard({
  title, value, delta, deltaLabel, icon: Icon,
  iconColor = 'text-[#4B83C4]', description, href,
}: KpiCardProps) {
  const isPositive = delta !== undefined && delta >= 0

  const content = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500 tracking-wide">
          {title}
        </p>
        <div className={cn('w-8 h-8 rounded-md bg-[#EBF1F7] flex items-center justify-center p-1.5', iconColor)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        {delta !== undefined && (
          <div className="flex items-center gap-1.5 mt-1">
            <span className={cn(
              'inline-flex items-center gap-0.5 text-xs font-medium',
              isPositive ? 'text-emerald-600' : 'text-red-500',
            )}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isPositive ? '+' : ''}{delta}%
            </span>
            {deltaLabel && (
              <span className="text-xs text-slate-400">{deltaLabel}</span>
            )}
          </div>
        )}
        {description && !delta && (
          <p className="text-xs text-slate-400 mt-1">{description}</p>
        )}
      </div>
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-xl border border-slate-100 bg-white p-5 space-y-3 hover:border-slate-200 transition-all cursor-pointer"
      >
        {content}
      </Link>
    )
  }

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5 space-y-3">
      {content}
    </div>
  )
}
