'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import type { Note } from '@/lib/types'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getPinnedNoteIds,
  togglePinnedNote,
  isPinnedNote,
} from '@/lib/dashboard-favorites'
import { collaboratorIndexForId } from '@/lib/dashboard-mock-avatars'

const PASTEL_BGS = ['bg-[#F1F1EF]', 'bg-[#EBF1F7]', 'bg-[#FDECC8]', 'bg-[#DBEDDB]']

const MOCK_USERS = [
  { name: 'Wonpil',  avatar: 'W', color: '#D9730D' },
  { name: 'Young K', avatar: 'Y', color: '#9065B0' },
  { name: 'Dowoon',  avatar: 'D', color: '#4B83C4' },
  { name: 'Park S',  avatar: 'P', color: '#0F7B6C' },
  { name: 'Jae W',   avatar: 'J', color: '#C4554D' },
  { name: 'Brian L', avatar: 'B', color: '#f59e0b' },
]

function getMockAvatars(noteId: string) {
  const base = collaboratorIndexForId(noteId, MOCK_USERS.length)
  const count = 2 + (base % 2)
  const avatars: typeof MOCK_USERS = []
  for (let i = 0; i < count; i++) {
    avatars.push(MOCK_USERS[(base + i) % MOCK_USERS.length])
  }
  return avatars
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

function NoteCaptureCard({
  note,
  workspaceId,
  pinned,
  onTogglePin,
  index,
}: {
  note: Note
  workspaceId: string
  pinned: boolean
  onTogglePin: () => void
  index: number
}) {
  const time = relativeTime(note.updatedAt)
  const bg = PASTEL_BGS[index % PASTEL_BGS.length]
  const avatars = getMockAvatars(note.id)

  return (
    <div className={cn(
      'relative shrink-0 w-full rounded-2xl p-5 flex flex-col justify-between h-40',
      'border border-transparent hover:border-slate-200 transition-colors cursor-pointer',
      bg,
    )}>
      <button
        type="button"
        title={pinned ? 'Remove from favorites' : 'Add to favorites'}
        onClick={e => {
          e.preventDefault()
          e.stopPropagation()
          onTogglePin()
        }}
        className="absolute top-3 right-3 z-20 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
      >
        <Star className={cn('w-4 h-4', pinned && 'fill-amber-400 text-amber-400')} />
      </button>

      <Link
        href={`/app/${workspaceId}/history/${note.id}`}
        className="flex flex-col justify-between flex-1 min-h-0"
      >
        <div>
          <p className="text-base font-semibold text-slate-900 tracking-tight line-clamp-1 pr-6">
            {note.pageTitle || note.domain}
          </p>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
            {note.content?.slice(0, 120) || note.domain}
          </p>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex -space-x-2">
            {avatars.map((user, i) => (
              <div
                key={user.name}
                className="relative w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white"
                style={{ backgroundColor: user.color, zIndex: avatars.length - i }}
              >
                {user.avatar}
                {i === 0 && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-white" />
                )}
              </div>
            ))}
          </div>
          <span className="text-[10px] text-slate-400">{time}</span>
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
      <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
        <p className="text-sm text-slate-400">
          No web captures yet. Use the browser extension to save pages, then star your favorites here.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {displayNotes.slice(0, 8).map((note, i) => (
        <NoteCaptureCard
          key={note.id}
          note={note}
          workspaceId={workspaceId}
          pinned={isPinnedNote(workspaceId, note.id, note.is_pinned)}
          onTogglePin={() => {
            togglePinnedNote(workspaceId, note.id)
            refreshPins()
          }}
          index={i}
        />
      ))}
    </div>
  )
}
