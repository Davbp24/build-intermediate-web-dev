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
  iconColor = 'text-primary', description, href,
}: KpiCardProps) {
  const isPositive = delta !== undefined && delta >= 0

  const content = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </p>
        <div className={cn('w-8 h-8 rounded-lg bg-muted flex items-center justify-center', iconColor)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        {delta !== undefined && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className={cn(
              'inline-flex items-center gap-0.5 text-xs font-medium',
              isPositive ? 'text-emerald-500' : 'text-red-400',
            )}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isPositive ? '+' : ''}{delta}%
            </span>
            {deltaLabel && (
              <span className="text-xs text-muted-foreground">{deltaLabel}</span>
            )}
          </div>
        )}
        {description && !delta && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-xl border border-border bg-card p-5 space-y-4 hover:border-primary/30 hover:scale-[1.01] transition-[border-color,transform] cursor-pointer"
      >
        {content}
      </Link>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      {content}
    </div>
  )
}
