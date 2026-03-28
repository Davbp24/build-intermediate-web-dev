'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import type { Note } from '@/lib/types'
import {
  FileText, PenTool, BrainCircuit, Code2, Home, CreditCard,
  Layers, Zap, Newspaper, Globe, Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getPinnedNoteIds,
  togglePinnedNote,
  isPinnedNote,
} from '@/lib/dashboard-favorites'
import { collaboratorIndexForId } from '@/lib/dashboard-mock-avatars'

type IconCfg = { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }

const DOMAIN_ICON: Record<string, IconCfg> = {
  'github.com':           { icon: Code2,        color: '#6C91C2', bg: '#DCE6F4' },
  'zillow.com':           { icon: Home,         color: '#5FA8A1', bg: '#E6F4F2' },
  'stripe.com':           { icon: CreditCard,   color: '#8b5cf6', bg: '#ede9fe' },
  'linear.app':           { icon: Layers,       color: '#6C91C2', bg: '#DCE6F4' },
  'vercel.com':           { icon: Zap,          color: '#1e293b', bg: '#f1f5f9' },
  'news.ycombinator.com': { icon: Newspaper,    color: '#f59e0b', bg: '#fef3c7' },
}

const TYPE_ICON: Record<string, IconCfg> = {
  text:       { icon: FileText,     color: '#6C91C2', bg: '#DCE6F4' },
  canvas:     { icon: PenTool,      color: '#a855f7', bg: '#f3e8ff' },
  'ai-summary': { icon: BrainCircuit, color: '#5FA8A1', bg: '#E6F4F2' },
}

function getIconCfg(note: Note): IconCfg {
  return DOMAIN_ICON[note.domain]
    ?? TYPE_ICON[note.type]
    ?? { icon: Globe, color: '#64748b', bg: '#f1f5f9' }
}

const MOCK_USERS = [
  { name: 'Wonpil',  avatar: 'W', color: '#f97316' },
  { name: 'Young K', avatar: 'Y', color: '#8b5cf6' },
  { name: 'Dowoon',  avatar: 'D', color: '#0ea5e9' },
  { name: 'Park S',  avatar: 'P', color: '#22c55e' },
  { name: 'Jae W',   avatar: 'J', color: '#ec4899' },
  { name: 'Brian L', avatar: 'B', color: '#f59e0b' },
]

function mockUser(noteId: string) {
  return MOCK_USERS[collaboratorIndexForId(noteId, MOCK_USERS.length)]
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`
  const months = Math.floor(days / 30)
  return `${months} ${months === 1 ? 'month' : 'months'} ago`
}

function NoteCaptureCard({
  note,
  workspaceId,
  pinned,
  onTogglePin,
}: {
  note: Note
  workspaceId: string
  pinned: boolean
  onTogglePin: () => void
}) {
  const cfg = getIconCfg(note)
  const Icon = cfg.icon
  const user = mockUser(note.id)
  const time = relativeTime(note.updatedAt)

  return (
    <div className="relative shrink-0 w-[240px] rounded-2xl bg-card border border-border overflow-hidden flex flex-col hover:border-primary/30 transition-colors">
      <button
        type="button"
        title={pinned ? 'Remove from favorites' : 'Add to favorites'}
        onClick={e => {
          e.preventDefault()
          e.stopPropagation()
          onTogglePin()
        }}
        className="absolute top-2 right-2 z-20 w-8 h-8 rounded-lg bg-background/90 border border-border/80 flex items-center justify-center text-muted-foreground hover:text-amber-500 hover:border-amber-500/40 transition-colors cursor-pointer"
      >
        <Star className={cn('w-4 h-4', pinned && 'fill-amber-400 text-amber-400')} />
      </button>
      <Link
        href={`/app/${workspaceId}/history/${note.id}`}
        className="relative z-0 flex flex-col flex-1 min-h-0 cursor-pointer"
      >
        <div
          className="flex items-center justify-center h-[136px]"
          style={{ backgroundColor: cfg.bg }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: cfg.color }}
          >
            <Icon className="w-7 h-7 text-white" />
          </div>
        </div>
        <div className="px-4 py-3 flex flex-col gap-1.5">
          <p className="text-[13px] font-semibold text-foreground leading-snug line-clamp-2 pr-6">
            {note.pageTitle}
          </p>
          <div className="flex items-center gap-1.5">
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
              style={{ backgroundColor: user.color }}
            >
              {user.avatar}
            </span>
            <span className="text-[11px] text-muted-foreground truncate">
              {user.name} · {time}
            </span>
          </div>
        </div>
      </Link>
    </div>
  )
}

export default function PinnedCapturesRow({
  workspaceId,
  initialNotes,
}: {
  workspaceId: string
  initialNotes: Note[]
}) {
  const [pinVersion, setPinVersion] = useState(0)

  const refreshPins = useCallback(() => setPinVersion(v => v + 1), [])

  useEffect(() => {
    window.addEventListener('inline-dashboard-pins-changed', refreshPins)
    return () => window.removeEventListener('inline-dashboard-pins-changed', refreshPins)
  }, [refreshPins])

  const pinnedIds = useMemo(() => {
    void pinVersion
    return new Set(getPinnedNoteIds(workspaceId))
  }, [workspaceId, pinVersion])

  const displayNotes = useMemo(() => {
    const withPin = initialNotes.map(n => ({
      ...n,
      _effectivePin: pinnedIds.has(n.id) || !!n.is_pinned,
    }))
    const pinned = withPin.filter(n => n._effectivePin)
    const unpinned = withPin.filter(n => !n._effectivePin)
    const ordered = [...pinned, ...unpinned]
    const seen = new Set<string>()
    const deduped: Note[] = []
    for (const n of ordered) {
      if (seen.has(n.id)) continue
      seen.add(n.id)
      const { _effectivePin: _ignored, ...clean } = n as Note & { _effectivePin?: boolean }
      deduped.push(clean)
    }
    return deduped.slice(0, 12)
  }, [initialNotes, pinnedIds])

  if (!displayNotes.length) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        No web captures yet. Use the extension to capture pages — then star favorites here.
      </p>
    )
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-minimal">
      {displayNotes.map(note => (
        <NoteCaptureCard
          key={note.id}
          note={note}
          workspaceId={workspaceId}
          pinned={isPinnedNote(workspaceId, note.id, note.is_pinned)}
          onTogglePin={() => {
            togglePinnedNote(workspaceId, note.id)
            refreshPins()
          }}
        />
      ))}
    </div>
  )
}
