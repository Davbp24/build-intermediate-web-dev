'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { FileText, Folder, Star, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { loadFolderDocuments, upsertFolderDocument, type FolderDocument } from '@/lib/workspace-library'
import { loadWorkspaceFolders, findFolder, type WorkspaceFolder } from '@/lib/workspace-folders'
import {
  getPinnedDocumentIds,
  togglePinnedDocument,
  isPinnedDocument,
} from '@/lib/dashboard-favorites'

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
  /** Avoid hydration mismatch: SSR has no localStorage; first client paint must match server. */
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
    return [...pinned, ...rest].slice(0, 18)
  }, [docs, pinnedIds])

  function folderLabel(folderId: string) {
    return findFolder(folders, workspaceId, folderId)?.name ?? 'Folder'
  }

  if (!docs.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
          <FileText className="w-6 h-6 text-primary" />
        </div>
        <p className="text-sm font-medium text-foreground">No library documents yet</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
          In the sidebar, open <strong>Workspaces</strong>, pick this workspace, then use the folder icon to add folders and documents. They will show up here automatically.
        </p>
      </div>
    )
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-minimal">
      {orderedDocs.map(doc => (
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
}: {
  doc: FolderDocument
  workspaceId: string
  folderName: string
  pinned: boolean
  onTogglePin: () => void
  onRenamed: () => void
}) {
  const href = `/app/${workspaceId}/folder/${doc.folderId}/doc/${doc.id}`
  const [title, setTitle] = useState(doc.title)

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
      <Link href={href} className="block relative z-0 cursor-pointer" aria-label={`Open ${title || 'document'}`}>
        <div className="flex items-center justify-center h-[100px] bg-primary/8">
          <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary" />
          </div>
        </div>
      </Link>
      <div className="px-4 pt-2">
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={e => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          }}
          aria-label="Document name"
          className="text-[13px] font-semibold text-foreground leading-snug w-full bg-transparent border-0 border-b border-transparent hover:border-border/80 focus:border-primary focus:outline-none focus:ring-0 rounded-none px-0 py-0.5 pr-7"
        />
      </div>
      <Link href={href} className="px-4 pb-3 pt-1 flex flex-col gap-1.5 flex-1 min-h-0 cursor-pointer text-left">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Folder className="w-3 h-3 shrink-0" />
          <span className="truncate">{folderName}</span>
        </div>
        <p className="text-[11px] text-muted-foreground line-clamp-2 min-h-8">
          {doc.content.trim() || 'Empty document'}
        </p>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="w-3 h-3" />
          {relativeTime(doc.updatedAt)}
        </div>
      </Link>
    </div>
  )
}
