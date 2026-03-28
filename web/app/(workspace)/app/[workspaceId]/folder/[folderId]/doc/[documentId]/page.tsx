'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import PageHeader from '@/components/shell/PageHeader'
import { Button } from '@/components/ui/button'
import { getWorkspaceName } from '@/lib/workspaces'
import {
  getDocumentById,
  upsertFolderDocument,
  type FolderDocument,
} from '@/lib/workspace-library'
import { findFolder, loadWorkspaceFolders } from '@/lib/workspace-folders'
import FolderDocumentEditor from '@/components/documents/FolderDocumentEditor'
import { Save, ArrowLeft } from 'lucide-react'

function loadSidebarFolderName(workspaceId: string, folderId: string): string | null {
  if (typeof window === 'undefined') return null
  const f = findFolder(loadWorkspaceFolders(), workspaceId, folderId)
  return f?.name ?? null
}

export default function FolderDocumentEditorPage() {
  const params = useParams()
  const workspaceId  = Array.isArray(params.workspaceId)  ? params.workspaceId[0]!  : (params.workspaceId  as string)
  const folderId     = Array.isArray(params.folderId)     ? params.folderId[0]!     : (params.folderId     as string)
  const documentId   = Array.isArray(params.documentId)   ? params.documentId[0]!   : (params.documentId   as string)
  const workspaceName = getWorkspaceName(workspaceId)
  const [folderName, setFolderName] = useState('Folder')

  const [doc,        setDoc]        = useState<FolderDocument | null>(null)
  const [title,      setTitle]      = useState('')
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => {
    setFolderName(loadSidebarFolderName(workspaceId, folderId) ?? 'Folder')
    const sync = () => setFolderName(loadSidebarFolderName(workspaceId, folderId) ?? 'Folder')
    window.addEventListener('inline-folders-changed', sync)
    const onStorage = (e: StorageEvent) => { if (e.key === 'inline-folders') sync() }
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('inline-folders-changed', sync)
      window.removeEventListener('storage', onStorage)
    }
  }, [workspaceId, folderId])

  useEffect(() => {
    const d = getDocumentById(documentId)
    if (!d || d.workspaceId !== workspaceId || d.folderId !== folderId) { setDoc(null); return }
    setDoc(d)
    setTitle(d.title)
  }, [documentId, workspaceId, folderId])

  const persist = useCallback((nextTitle: string, nextContent: string) => {
    if (!doc) return
    const updated: FolderDocument = {
      ...doc,
      title:     nextTitle.trim() || 'Untitled',
      content:   nextContent,
      updatedAt: Date.now(),
    }
    upsertFolderDocument(updated)
    setDoc(updated)
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1200)
  }, [doc])

  const handleContentChange = useCallback((html: string) => {
    if (!doc) return
    persist(title, html)
  }, [doc, title, persist])

  const displayTitle = title.trim() || 'Untitled'

  if (!doc) {
    return (
      <div className="min-h-full bg-background p-8">
        <p className="text-muted-foreground">Document not found.</p>
        <Link href={`/app/${workspaceId}/folder/${folderId}`} className="text-primary text-sm mt-4 inline-block cursor-pointer">
          ← Back to folder
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-background">
      <PageHeader
        crumbs={[
          { label: workspaceName, href: `/app/${workspaceId}/dashboard` },
          { label: folderName, href: `/app/${workspaceId}/folder/${folderId}` },
          { label: displayTitle },
        ]}
        title={displayTitle}
        titleSlot={(
          <h1 className="text-[17px] font-semibold tracking-tight text-foreground leading-tight m-0 min-w-0 pr-8">
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={() => persist(title, doc.content)}
              placeholder="Untitled"
              aria-label="Document title"
              className="w-full max-w-3xl bg-transparent border-0 border-b border-transparent hover:border-border/80 focus:border-primary focus:outline-none focus:ring-0 pb-0.5 px-0 rounded-none"
            />
          </h1>
        )}
        subtitle={`${folderName} · ${workspaceName}`}
        action={
          <div className="flex items-center gap-2">
            {savedFlash && <span className="text-xs text-accent font-medium">Saved</span>}
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer gap-1.5"
              onClick={() => persist(title, doc.content)}
            >
              <Save className="w-3.5 h-3.5" /> Save now
            </Button>
          </div>
        }
      />

      <div className="px-6 pb-6 pt-2">
        <Link
          href={`/app/${workspaceId}/folder/${folderId}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> All documents in {folderName}
        </Link>

        <div className="pl-14">
          <FolderDocumentEditor
            content={doc.content}
            onChange={handleContentChange}
          />
        </div>
      </div>
    </div>
  )
}
