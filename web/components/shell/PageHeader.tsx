'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Settings2, UserPlus, MoreHorizontal } from 'lucide-react'
import ExportButton from './ExportButton'

interface Crumb { label: string; href?: string }

interface PageHeaderProps {
  crumbs:     Crumb[]
  title:      string
  /** When set, replaces the default title heading (e.g. inline rename). */
  titleSlot?: React.ReactNode
  subtitle?:  string
  action?:    React.ReactNode
  className?: string
}

function getWorkspaceSettingsHref(pathname: string): string {
  const match = pathname.match(/\/app\/(ws-[^/]+)/)
  if (match) return `/app/${match[1]}/settings`
  return '/app/settings'
}

function getWorkspaceId(pathname: string): string | undefined {
  const match = pathname.match(/\/app\/(ws-[^/]+)/)
  return match ? match[1] : undefined
}

export default function PageHeader({ crumbs, title, titleSlot, subtitle, action, className }: PageHeaderProps) {
  const pathname    = usePathname()
  const router      = useRouter()
  const settingsHref = getWorkspaceSettingsHref(pathname)
  const workspaceId  = getWorkspaceId(pathname)

  return (
    <div className={cn('border-b border-border bg-background/90 backdrop-blur-sm sticky top-0 z-10', className)}>
      {/* ── Top bar: breadcrumb + actions ── */}
      <div className="flex items-center justify-between px-6 h-[52px]">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          {crumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-foreground transition-colors cursor-pointer">
                  {crumb.label}
                </Link>
              ) : (
                <span className={cn(i === crumbs.length - 1 && 'text-foreground font-medium')}>
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {action}

          {/* Functional "..." dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer outline-none">
              <MoreHorizontal className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => router.push(settingsHref)}
              >
                <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Workspace Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="p-0 focus:bg-transparent"
                onSelect={e => e.preventDefault()}
              >
                <ExportButton
                  workspaceId={workspaceId}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-foreground rounded-sm hover:bg-accent transition-colors"
                />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                <UserPlus className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Invite Members</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* title slot only (used for inline rename widgets, not plain text titles) */}
      {titleSlot && (
        <div className="px-6 pb-3 pt-0.5 min-w-0">{titleSlot}</div>
      )}
    </div>
  )
}
