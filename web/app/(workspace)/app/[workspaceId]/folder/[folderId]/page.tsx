'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import PageHeader from '@/components/shell/PageHeader'
import { Button } from '@/components/ui/button'
import { getWorkspaceName } from '@/lib/workspaces'
import {
  getDocumentsForFolder,
  createFolderDocument,
  upsertFolderDocument,
  type FolderDocument,
} from '@/lib/workspace-library'
import {
  type WorkspaceFolder,
  loadWorkspaceFolders,
  findFolder,
  getFolderPath,
  getChildFolders,
} from '@/lib/workspace-folders'
import {
  FileText,
  Plus,
  FolderOpen,
  Clock,
  ChevronRight,
  Folder,
} from 'lucide-react'

function FolderDocumentRow({
  doc,
  workspaceId,
  folderId,
  onUpdated,
}: {
  doc: FolderDocument
  workspaceId: string
  folderId: string
  onUpdated: () => void
}) {
  const [title, setTitle] = useState(doc.title)
  const href = `/app/${workspaceId}/folder/${folderId}/doc/${doc.id}`

  useEffect(() => {
    setTitle(doc.title)
  }, [doc.id, doc.title])

  const saveTitle = useCallback(() => {
    const t = title.trim() || 'Untitled'
    if (t === doc.title) return
    upsertFolderDocument({ ...doc, title: t, updatedAt: Date.now() })
    onUpdated()
  }, [doc, title, onUpdated])

  return (
    <div className="rounded-2xl border border-border bg-card p-4 hover:border-primary/25 transition-colors flex gap-3 items-start">
      <Link
        href={href}
        className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary/15 transition-colors cursor-pointer"
        title="Open document"
      >
        <FileText className="w-5 h-5 text-primary" />
      </Link>
      <div className="min-w-0 flex-1">
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={e => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          }}
          aria-label="Document name"
          className="w-full font-medium text-foreground bg-transparent border-0 border-b border-transparent hover:border-border/80 focus:border-primary focus:outline-none focus:ring-0 rounded-none px-0 py-0.5 mb-1"
        />
        <Link href={href} className="block text-xs text-muted-foreground line-clamp-2 min-h-10 hover:text-foreground transition-colors cursor-pointer">
          {doc.content.trim() || 'Empty document'}
        </Link>
        <div className="flex items-center gap-1 mt-3 text-[11px] text-muted-foreground">
          <Clock className="w-3 h-3 shrink-0" />
          {new Date(doc.updatedAt).toLocaleString()}
        </div>
      </div>
      <Link
        href={href}
        className="shrink-0 mt-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        title="Open document"
      >
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  )
}

export default function WorkspaceFolderLibraryPage() {
  const params = useParams()
  const router = useRouter()
  const workspaceId = Array.isArray(params.workspaceId) ? params.workspaceId[0]! : (params.workspaceId as string)
  const folderId = Array.isArray(params.folderId) ? params.folderId[0]! : (params.folderId as string)
  const workspaceName = getWorkspaceName(workspaceId)

  const [folder, setFolder] = useState<WorkspaceFolder | null>(null)
  const [allFolders, setAllFolders] = useState<WorkspaceFolder[]>([])
  const [docs, setDocs] = useState<FolderDocument[]>([])

  const refresh = () => {
    const folders = loadWorkspaceFolders()
    setAllFolders(folders)
    setFolder(findFolder(folders, workspaceId, folderId) ?? null)
    setDocs(getDocumentsForFolder(workspaceId, folderId))
  }

  useEffect(() => {
    refresh()
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'inline-folder-documents' || e.key === 'inline-folders') refresh()
    }
    const onFolders = () => refresh()
    window.addEventListener('storage', onStorage)
    window.addEventListener('inline-folders-changed', onFolders)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('inline-folders-changed', onFolders)
    }
  }, [workspaceId, folderId])

  const sorted = useMemo(() => [...docs].sort((a, b) => b.updatedAt - a.updatedAt), [docs])

  const childFolders = useMemo(
    () => (folder ? getChildFolders(allFolders, workspaceId, folder.id) : []),
    [allFolders, workspaceId, folder],
  )

  const breadcrumbPath = useMemo(() => getFolderPath(allFolders, folderId), [allFolders, folderId])

  function handleNew() {
    const d = createFolderDocument(workspaceId, folderId, 'Untitled')
    router.push(`/app/${workspaceId}/folder/${folderId}/doc/${d.id}`)
  }

  if (!folder) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader
          crumbs={[
            { label: workspaceName, href: `/app/${workspaceId}/dashboard` },
            { label: 'Library' },
          ]}
          title="Folder not found"
          subtitle="This folder may have been removed."
        />
        <div className="p-8">
          <Link href={`/app/${workspaceId}/dashboard`} className="inline-flex items-center justify-center h-9 px-4 text-sm font-medium rounded-md border border-border bg-background hover:bg-accent/40 transition-colors cursor-pointer">
            Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  const crumbs = [
    { label: workspaceName, href: `/app/${workspaceId}/dashboard` },
    ...breadcrumbPath.slice(0, -1).map(f => ({
      label: f.name,
      href: `/app/${workspaceId}/folder/${f.id}`,
    })),
    { label: breadcrumbPath[breadcrumbPath.length - 1]?.name ?? folder.name },
  ]

  const hasDocs = sorted.length > 0
  const hasChildren = childFolders.length > 0

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        crumbs={crumbs}
        title={folder.name}
        subtitle="Documents in this workspace folder — like your personal writing library."
        action={(
          <Button size="sm" className="cursor-pointer gap-1.5" onClick={handleNew}>
            <Plus className="w-4 h-4" /> New document
          </Button>
        )}
      />

      <div className="px-6 pt-6 pb-12 w-full max-w-none min-w-0 space-y-8">
        {hasChildren && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Subfolders</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {childFolders.map(sub => (
                <Link
                  key={sub.id}
                  href={`/app/${workspaceId}/folder/${sub.id}`}
                  className="group rounded-2xl border border-border bg-card p-4 hover:border-primary/25 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                      <Folder className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors">{sub.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">Open folder</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Documents</h2>
          {!hasDocs && !hasChildren && (
            <div className="w-full rounded-2xl border border-dashed border-border bg-card/60 backdrop-blur-sm p-12 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <FolderOpen className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">No documents yet</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                Create a document to keep drafts, meeting notes, or captured context scoped to this folder.
              </p>
              <Button className="mt-6 cursor-pointer gap-1.5" onClick={handleNew}>
                <Plus className="w-4 h-4" /> Create first document
              </Button>
            </div>
          )}

          {!hasDocs && hasChildren && (
            <div className="w-full rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
              <p className="text-sm text-muted-foreground">No documents in this folder yet.</p>
              <Button className="mt-4 cursor-pointer gap-1.5" onClick={handleNew}>
                <Plus className="w-4 h-4" /> Create first document
              </Button>
            </div>
          )}

          {hasDocs && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sorted.map(doc => (
                <FolderDocumentRow
                  key={doc.id}
                  doc={doc}
                  workspaceId={workspaceId}
                  folderId={folderId}
                  onUpdated={refresh}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
