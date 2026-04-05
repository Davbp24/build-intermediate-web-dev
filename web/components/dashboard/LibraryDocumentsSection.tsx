'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { FileText, Star } from 'lucide-react'
import { cn, stripHtml } from '@/lib/utils'
import { loadFolderDocuments, upsertFolderDocument, type FolderDocument } from '@/lib/workspace-library'
import { loadWorkspaceFolders, findFolder, type WorkspaceFolder } from '@/lib/workspace-folders'
import {
  getPinnedDocumentIds,
  togglePinnedDocument,
  isPinnedDocument,
} from '@/lib/dashboard-favorites'
import { collaboratorIndexForId } from '@/lib/dashboard-mock-avatars'

const PASTEL_BGS = ['bg-[#F5EDE3]', 'bg-[#FDECC8]', 'bg-[#F1F1EF]', 'bg-[#E7E5E4]']

const MOCK_USERS = [
  { avatar: 'A', color: '#7c3aed' },
  { avatar: 'K', color: '#57534e' },
  { avatar: 'M', color: '#D9730D' },
  { avatar: 'S', color: '#0F7B6C' },
  { avatar: 'R', color: '#ec4899' },
]

function getMockAvatars(docId: string) {
  const base = collaboratorIndexForId(docId, MOCK_USERS.length)
  const count = 2 + (base % 2)
  const out: typeof MOCK_USERS = []
  for (let i = 0; i < count; i++) {
    out.push(MOCK_USERS[(base + i) % MOCK_USERS.length])
  }
  return out
}

function relativeTime(ts: number) {
  const diff = Date.now() - ts
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(ts).toLocaleDateString()
}

export default function LibraryDocumentsSection({ workspaceId }: { workspaceId: string }) {
  const [tick, setTick] = useState(0)
  const [hasHydrated, setHasHydrated] = useState(false)

  const refresh = useCallback(() => setTick(t => t + 1), [])

  useEffect(() => {
    setHasHydrated(true)
  }, [])

  useEffect(() => {
    const onDocs = () => refresh()
    const onPins = () => refresh()
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'inline-folder-documents' || e.key === 'inline-folders') refresh()
    }
    window.addEventListener('inline-folder-docs-changed', onDocs)
    window.addEventListener('storage', onStorage)
    window.addEventListener('inline-dashboard-pins-changed', onPins)
    return () => {
      window.removeEventListener('inline-folder-docs-changed', onDocs)
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('inline-dashboard-pins-changed', onPins)
    }
  }, [refresh])

  const { docs, folders } = useMemo(() => {
    void tick
    if (!hasHydrated) {
      return { docs: [] as FolderDocument[], folders: [] as WorkspaceFolder[] }
    }
    const allDocs = loadFolderDocuments().filter(d => d.workspaceId === workspaceId)
    const foldersList = loadWorkspaceFolders()
    const sorted = [...allDocs].sort((a, b) => b.updatedAt - a.updatedAt)
    return { docs: sorted, folders: foldersList }
  }, [workspaceId, tick, hasHydrated])

  const pinnedIds = useMemo(() => {
    void tick
    if (!hasHydrated) return new Set<string>()
    return new Set(getPinnedDocumentIds(workspaceId))
  }, [workspaceId, tick, hasHydrated])

  const orderedDocs = useMemo(() => {
    const pinned = docs.filter(d => pinnedIds.has(d.id))
    const rest = docs.filter(d => !pinnedIds.has(d.id))
    return [...pinned, ...rest].slice(0, 12)
  }, [docs, pinnedIds])

  function folderLabel(folderId: string) {
    return findFolder(folders, workspaceId, folderId)?.name ?? 'Folder'
  }

  if (!docs.length) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-border p-8 text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-[#EBF1F7] flex items-center justify-center mb-3">
          <FileText className="h-6 w-6 text-stone-600" />
        </div>
        <p className="text-sm font-medium text-foreground">No documents yet</p>
        <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
          Create a folder from the sidebar, add a document, and it will appear here automatically.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {orderedDocs.map((doc, i) => (
        <DocLibraryCard
          key={doc.id}
          doc={doc}
          workspaceId={workspaceId}
          folderName={folderLabel(doc.folderId)}
          pinned={isPinnedDocument(workspaceId, doc.id)}
          onTogglePin={() => {
            togglePinnedDocument(workspaceId, doc.id)
            refresh()
          }}
          onRenamed={refresh}
          index={i}
        />
      ))}
    </div>
  )
}

function DocLibraryCard({
  doc,
  workspaceId,
  folderName,
  pinned,
  onTogglePin,
  onRenamed,
  index,
}: {
  doc: FolderDocument
  workspaceId: string
  folderName: string
  pinned: boolean
  onTogglePin: () => void
  onRenamed: () => void
  index: number
}) {
  const href = `/app/${workspaceId}/folder/${doc.folderId}/doc/${doc.id}`
  const [title, setTitle] = useState(doc.title)
  const bg = PASTEL_BGS[index % PASTEL_BGS.length]
  const avatars = getMockAvatars(doc.id)
  const preview = stripHtml(doc.content) || 'Empty document'

  useEffect(() => {
    setTitle(doc.title)
  }, [doc.id, doc.title])

  function saveTitle() {
    const t = title.trim() || 'Untitled'
    if (t === doc.title) return
    upsertFolderDocument({ ...doc, title: t, updatedAt: Date.now() })
    onRenamed()
  }

  return (
    <div className={cn(
      'relative rounded-2xl p-5 flex flex-col justify-between h-40',
      'border border-transparent transition-colors hover:border-border',
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
        className="absolute right-3 top-3 z-20 cursor-pointer text-muted-foreground/50 transition-colors hover:text-amber-600"
      >
        <Star className={cn('w-4 h-4', pinned && 'fill-amber-400 text-amber-400')} />
      </button>

      <div>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={e => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          }}
          aria-label="Document name"
          className="line-clamp-1 w-full truncate rounded-none border-0 bg-transparent px-0 py-0 pr-6 text-base font-semibold tracking-tight text-foreground focus:outline-none focus:ring-0"
        />
        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
          {preview}
        </p>
      </div>

      <Link href={href} className="flex items-center justify-between mt-4 cursor-pointer">
        <div className="flex -space-x-2">
          {avatars.map((user, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white"
              style={{ backgroundColor: user.color, zIndex: avatars.length - i }}
            >
              {user.avatar}
            </div>
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground">{folderName} &middot; {relativeTime(doc.updatedAt)}</span>
      </Link>
    </div>
  )
}
