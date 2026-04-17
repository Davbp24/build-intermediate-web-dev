'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Clock, Map, Share2, Settings, LogOut,
  Search, Plus, UserPlus, Zap, Megaphone, Package, TrendingUp,
  FolderKanban, Lightbulb, Star, X, Check, PanelLeftClose,
  ChevronDown, BarChart2, Folder, FolderPlus, ChevronRight,
  FileText, FilePlus,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DEFAULT_WORKSPACES } from '@/lib/workspaces'
import { useSidebar } from '@/lib/sidebar-context'
import { signOut } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/client'
import {
  loadFolderDocuments,
  createFolderDocument,
  deleteDocumentsInFolders,
  type FolderDocument,
} from '@/lib/workspace-library'
import {
  type WorkspaceFolder,
  loadWorkspaceFolders,
  saveWorkspaceFolders,
  getRootFolders,
  getChildFolders,
  removeFolderSubtree,
  collectSubtreeFolderIds,
} from '@/lib/workspace-folders'

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------
interface WorkspaceItem { id: string; label: string; color: string; icon: string }

const ICON_MAP: Record<string, React.ElementType> = {
  Megaphone, Package, TrendingUp, FolderKanban, Lightbulb, Zap,
}
const DEFAULT_ICON_KEYS = ['Megaphone', 'Package', 'TrendingUp', 'FolderKanban', 'Lightbulb']
const DEFAULT_COLORS    = ['#f43f5e', '#6C91C2', '#f59e0b', '#5FA8A1', '#a855f7']

const FEATURES = [
  { href: (ws: string) => `/app/${ws}/dashboard`,  icon: LayoutDashboard, label: 'Dashboard'       },
  { href: (ws: string) => `/app/${ws}/history`,    icon: Clock,           label: 'History'         },
  { href: (ws: string) => `/app/${ws}/analytics`,  icon: BarChart2,       label: 'Analytics'       },
  { href: (ws: string) => `/app/${ws}/workflows`,  icon: Zap,             label: 'Workflows'       },
  { href: (ws: string) => `/app/${ws}/map`,         icon: Map,             label: 'Map'             },
  { href: (ws: string) => `/app/${ws}/graph`,       icon: Share2,          label: 'Graph'           },
  { href: (ws: string) => `/app/${ws}/settings`,    icon: Settings,        label: 'Settings'        },
]

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------
function loadWorkspaces(): WorkspaceItem[] {
  if (typeof window === 'undefined') return DEFAULT_WORKSPACES
  try { const r = localStorage.getItem('inline-workspaces'); return r ? JSON.parse(r) : DEFAULT_WORKSPACES } catch { return DEFAULT_WORKSPACES }
}
function saveWorkspaces(ws: WorkspaceItem[]) { localStorage.setItem('inline-workspaces', JSON.stringify(ws)) }
function loadFavorites(): string[] {
  if (typeof window === 'undefined') return []
  try { const r = localStorage.getItem('inline-favorites'); return r ? JSON.parse(r) : [] } catch { return [] }
}
function saveFavorites(favs: string[]) { localStorage.setItem('inline-favorites', JSON.stringify(favs)) }

function getActiveWorkspace(pathname: string): string {
  const m = pathname.match(/\/app\/(ws-[^/]+)/)
  return m ? m[1] : 'ws-1'
}

// ---------------------------------------------------------------------------
// NavRow
// ---------------------------------------------------------------------------
function NavRow({ href, icon: Icon, label, collapsed, active, dotColor, onStar, starred, onGear }: {
  href: string; icon: React.ElementType; label: string; collapsed: boolean; active: boolean
  dotColor?: string; onStar?: () => void; starred?: boolean; onGear?: () => void
}) {
  return (
    <div className="group/row relative flex items-center">
      <Link
        href={href}
        title={collapsed ? label : undefined}
        className={cn(
          collapsed
            ? 'w-10 h-10 aspect-square rounded-md flex items-center justify-center transition-all cursor-pointer shrink-0'
            : 'flex flex-1 items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-sm transition-all cursor-pointer min-w-0',
          active ? 'bg-[#F1F1EF] text-[#37352F] font-semibold' : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100',
        )}
      >
        {dotColor ? (
          <span className="w-4 h-4 rounded-md flex items-center justify-center shrink-0" style={{ background: dotColor + '22' }}>
            <Icon className="w-3 h-3 shrink-0" style={{ color: dotColor }} />
          </span>
        ) : (
          <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-[#37352F]' : '')} />
        )}
        <span
          className="flex-1 overflow-hidden whitespace-nowrap truncate min-w-0 transition-[opacity,max-width] duration-[220ms] ease-[cubic-bezier(.4,0,.2,1)]"
          style={{ maxWidth: collapsed ? 0 : 160, opacity: collapsed ? 0 : 1 }}
        >
          {label}
        </span>
      </Link>
      {!collapsed && (onStar || onGear) && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity pr-1 shrink-0">
          {onGear && (
            <button onClick={e => { e.preventDefault(); e.stopPropagation(); onGear() }}
              className="w-5 h-5 flex items-center justify-center rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer" title="Workspace settings">
              <Settings className="w-3 h-3" />
            </button>
          )}
          {onStar && (
            <button onClick={e => { e.preventDefault(); e.stopPropagation(); onStar() }}
              className="w-5 h-5 flex items-center justify-center rounded transition-colors cursor-pointer"
              title={starred ? 'Unpin' : 'Pin to Favorites'}>
              <Star className={cn('w-3 h-3 transition-colors', starred ? 'fill-amber-400 text-amber-400' : 'text-stone-400 hover:text-amber-400')} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Collapsible section label
// ---------------------------------------------------------------------------
function SectionLabel({ label, collapsed, expanded, onToggle, action }: {
  label: string; collapsed: boolean; expanded: boolean; onToggle: () => void; action?: React.ReactNode
}) {
  if (collapsed) return null
  return (
    <div className="flex items-center justify-between px-2.5 pt-4 pb-1">
      <button onClick={onToggle} className="flex items-center gap-1 cursor-pointer hover:text-stone-700 transition-colors">
        <span className="text-[10.5px] font-semibold uppercase tracking-wider text-stone-400 select-none">
          {label}
        </span>
        <ChevronDown className={cn('w-3 h-3 text-stone-300 transition-transform duration-200', !expanded && '-rotate-90')} />
      </button>
      {action}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Invite Modal
// ---------------------------------------------------------------------------
function InviteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email,   setEmail]   = useState('')
  const [role,    setRole]    = useState('Editor')
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)
  const roles = ['Viewer', 'Editor', 'Admin']

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setTimeout(() => {
      setSent(true); setLoading(false)
      setTimeout(() => { setSent(false); setEmail(''); onClose() }, 1800)
    }, 600)
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">Invite team member</DialogTitle>
        </DialogHeader>
        {sent ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center">
              <Check className="w-5 h-5 text-accent" />
            </div>
            <p className="text-sm text-stone-400">Invite sent to <strong>{email}</strong></p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-3 mt-1">
            <div className="space-y-1">
              <label className="text-xs font-medium">Email address</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full h-8 px-3 text-sm rounded-lg border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#C4D4E4]" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Role</label>
              <div className="flex gap-1.5">
                {roles.map(r => (
                  <button key={r} type="button" onClick={() => setRole(r)}
                    className={cn('flex-1 h-8 rounded-lg text-xs font-medium border transition-colors cursor-pointer',
                      role === r ? 'bg-[#1C1E26] text-white border-[#191919]' : 'bg-white text-stone-400 border-stone-200 hover:border-[#D3D1CB]')}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full h-8 rounded-lg bg-[#1C1E26] text-white text-sm font-medium hover:bg-[#150C00] transition-colors disabled:opacity-60 cursor-pointer">
              {loading ? 'Sending…' : 'Send invite'}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Nested workspace folders (same row UI, indented children)
// ---------------------------------------------------------------------------
function SidebarFolderNode({
  folder,
  wsId,
  depth,
  allFolders,
  libraryDocs,
  expandedFolders,
  toggleFolderExpand,
  folderDocsOpen,
  newDocumentInFolder,
  deleteFolderCascade,
  addingSubfolderParentId,
  setAddingSubfolderParentId,
  newSubfolderName,
  setNewSubfolderName,
  newSubfolderRef,
  addSubfolder,
  ensureFolderOpen,
}: {
  folder: WorkspaceFolder
  wsId: string
  depth: number
  allFolders: WorkspaceFolder[]
  libraryDocs: FolderDocument[]
  expandedFolders: Record<string, boolean>
  toggleFolderExpand: (id: string) => void
  folderDocsOpen: (id: string) => boolean
  newDocumentInFolder: (wsId: string, folderId: string) => void
  deleteFolderCascade: (wsId: string, folderId: string) => void
  addingSubfolderParentId: string | null
  setAddingSubfolderParentId: (id: string | null) => void
  newSubfolderName: string
  setNewSubfolderName: (s: string) => void
  newSubfolderRef: React.RefObject<HTMLInputElement | null>
  addSubfolder: (wsId: string, parentId: string) => void
  ensureFolderOpen: (id: string) => void
}) {
  const childFolders = getChildFolders(allFolders, wsId, folder.id)
  const folderDocs = libraryDocs.filter(d => d.workspaceId === wsId && d.folderId === folder.id)
  const treeOpen = folderDocsOpen(folder.id)

  return (
    <div className="mb-0.5" style={depth > 0 ? { marginLeft: Math.min(depth * 8, 28) } : undefined}>
      <div className="group/folder flex items-center gap-0.5 px-1 py-[4px] rounded-md text-xs hover:bg-stone-50">
        <button
          type="button"
          onClick={() => toggleFolderExpand(folder.id)}
          className="w-5 h-5 flex items-center justify-center rounded text-stone-400 hover:text-stone-700 cursor-pointer shrink-0"
          title={treeOpen ? 'Collapse' : 'Expand'}
        >
          <ChevronRight className={cn('w-3 h-3 transition-transform', treeOpen && 'rotate-90')} />
        </button>
        <Folder className="w-3 h-3 shrink-0 text-stone-400" />
        <Link
          href={`/app/${wsId}/folder/${folder.id}`}
          className="flex-1 truncate text-stone-400 hover:text-stone-700 font-medium cursor-pointer min-w-0"
          title="Open folder library"
        >
          {folder.name}
        </Link>
        <button
          type="button"
          onClick={e => {
            e.preventDefault()
            ensureFolderOpen(folder.id)
            setAddingSubfolderParentId(folder.id)
          }}
          className="opacity-0 group-hover/folder:opacity-100 w-5 h-5 flex items-center justify-center rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer shrink-0"
          title="New subfolder"
        >
          <FolderPlus className="w-2.5 h-2.5" />
        </button>
        <button
          type="button"
          onClick={e => { e.preventDefault(); newDocumentInFolder(wsId, folder.id) }}
          className="opacity-0 group-hover/folder:opacity-100 w-5 h-5 flex items-center justify-center rounded text-[#37352F] hover:bg-[#F1F1EF] cursor-pointer shrink-0"
          title="New document in folder"
        >
          <FilePlus className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => deleteFolderCascade(wsId, folder.id)}
          className="opacity-0 group-hover/folder:opacity-100 w-4 h-4 flex items-center justify-center rounded text-stone-400 hover:text-red-500 cursor-pointer shrink-0"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      </div>
      {treeOpen && (
        <div className="ml-4 pl-2 border-l border-stone-200/40 space-y-0.5 mt-0.5">
          {childFolders.map(child => (
            <SidebarFolderNode
              key={child.id}
              folder={child}
              wsId={wsId}
              depth={depth + 1}
              allFolders={allFolders}
              libraryDocs={libraryDocs}
              expandedFolders={expandedFolders}
              toggleFolderExpand={toggleFolderExpand}
              folderDocsOpen={folderDocsOpen}
              newDocumentInFolder={newDocumentInFolder}
              deleteFolderCascade={deleteFolderCascade}
              addingSubfolderParentId={addingSubfolderParentId}
              setAddingSubfolderParentId={setAddingSubfolderParentId}
              newSubfolderName={newSubfolderName}
              setNewSubfolderName={setNewSubfolderName}
              newSubfolderRef={newSubfolderRef}
              addSubfolder={addSubfolder}
              ensureFolderOpen={ensureFolderOpen}
            />
          ))}
          {addingSubfolderParentId === folder.id && (
            <div className="flex items-center gap-1 px-1 py-0.5">
              <Folder className="w-3 h-3 text-stone-300 shrink-0" />
              <input
                ref={newSubfolderRef}
                className="flex-1 text-xs h-6 px-1.5 rounded border border-[#D3D1CB] bg-white focus:outline-none focus:ring-1 focus:ring-[#C4D4E4] min-w-0"
                placeholder="Subfolder name…"
                value={newSubfolderName}
                onChange={e => setNewSubfolderName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') addSubfolder(wsId, folder.id)
                  if (e.key === 'Escape') {
                    setAddingSubfolderParentId(null)
                    setNewSubfolderName('')
                  }
                }}
                onBlur={() =>
                  setTimeout(() => {
                    setAddingSubfolderParentId(null)
                    setNewSubfolderName('')
                  }, 150)
                }
              />
              <button
                type="button"
                onClick={() => addSubfolder(wsId, folder.id)}
                className="w-5 h-5 flex items-center justify-center rounded text-[#37352F] hover:bg-[#F1F1EF] cursor-pointer shrink-0"
              >
                <Check className="w-2.5 h-2.5" />
              </button>
            </div>
          )}
          {folderDocs.length === 0 && childFolders.length === 0 && addingSubfolderParentId !== folder.id && (
            <p className="text-[10px] text-stone-400 px-1 py-0.5">Empty folder</p>
          )}
          {folderDocs.map(doc => (
            <Link
              key={doc.id}
              href={`/app/${wsId}/folder/${folder.id}/doc/${doc.id}`}
              className="flex items-center gap-1.5 px-1.5 py-1 rounded text-[11px] text-stone-400 hover:text-stone-700 hover:bg-stone-50 cursor-pointer truncate"
            >
              <FileText className="w-3 h-3 shrink-0 opacity-70" />
              <span className="truncate">{doc.title}</span>
            </Link>
          ))}
          <button
            type="button"
            onClick={() => newDocumentInFolder(wsId, folder.id)}
            className="flex items-center gap-1 w-full px-1.5 py-1 rounded text-[11px] text-[#4B83C4] hover:bg-[#F1F1EF] cursor-pointer"
          >
            <Plus className="w-3 h-3" /> New document
          </button>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Sidebar
// ---------------------------------------------------------------------------
export default function Sidebar() {
  const router = useRouter()
  const { collapsed, setCollapsed } = useSidebar()
  const [workspaces,         setWorkspaces]         = useState<WorkspaceItem[]>(DEFAULT_WORKSPACES)
  const [favorites,          setFavorites]          = useState<string[]>([])
  const [folders,            setFolders]            = useState<WorkspaceFolder[]>([])
  const [addingWs,           setAddingWs]           = useState(false)
  const [newWsName,          setNewWsName]          = useState('')
  const [inviteOpen,         setInviteOpen]         = useState(false)
  const [addingFolderForWs,  setAddingFolderForWs]  = useState<string | null>(null)
  const [newFolderName,      setNewFolderName]      = useState('')
  const [addingSubfolderParentId, setAddingSubfolderParentId] = useState<string | null>(null)
  const [newSubfolderName,   setNewSubfolderName]   = useState('')
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Record<string, boolean>>({})
  const [expandedFolders,   setExpandedFolders]   = useState<Record<string, boolean>>({})
  const [libraryDocs,       setLibraryDocs]       = useState<FolderDocument[]>([])
  const [userName,  setUserName]  = useState('User')
  const [userEmail, setUserEmail] = useState('')
  const [userInitial, setUserInitial] = useState('U')
  const newWsRef     = useRef<HTMLInputElement>(null)
  const newFolderRef = useRef<HTMLInputElement>(null)
  const newSubfolderRef = useRef<HTMLInputElement>(null)
  const pathname     = usePathname()
  const activeWsId   = getActiveWorkspace(pathname)

  // Accordion expanded state per section
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    favorites: true, features: true, workspaces: true,
  })
  function toggleSection(key: string) {
    setExpandedSections(p => ({ ...p, [key]: !p[key] }))
  }

  function toggleWsExpand(wsId: string) {
    setExpandedWorkspaces(p => ({ ...p, [wsId]: !p[wsId] }))
  }

  function refreshLibraryDocs() {
    setLibraryDocs(loadFolderDocuments())
  }

  function refreshFolders() {
    setFolders(loadWorkspaceFolders())
  }

  useEffect(() => {
    setWorkspaces(loadWorkspaces())
    setFavorites(loadFavorites())
    refreshFolders()
    refreshLibraryDocs()

    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const supabase = createClient()
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return
        const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'
        setUserName(name)
        setUserEmail(user.email ?? '')
        setUserInitial((name.charAt(0) || 'U').toUpperCase())
      })
    }
  }, [])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'inline-folder-documents') refreshLibraryDocs()
      if (e.key === 'inline-folders') refreshFolders()
    }
    const onLib = () => refreshLibraryDocs()
    const onFolders = () => refreshFolders()
    window.addEventListener('storage', onStorage)
    window.addEventListener('inline-folder-docs-changed', onLib)
    window.addEventListener('inline-folders-changed', onFolders)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('inline-folder-docs-changed', onLib)
      window.removeEventListener('inline-folders-changed', onFolders)
    }
  }, [])
  useEffect(() => {
    if (addingWs) setTimeout(() => newWsRef.current?.focus(), 50)
  }, [addingWs])

  function toggleFavorite(wsId: string) {
    setFavorites(prev => {
      const next = prev.includes(wsId) ? prev.filter(f => f !== wsId) : [...prev, wsId]
      saveFavorites(next)
      return next
    })
  }

  function addWorkspace() {
    const name = newWsName.trim()
    if (!name) { setAddingWs(false); return }
    const idx = workspaces.length % DEFAULT_ICON_KEYS.length
    const ws: WorkspaceItem = { id: `ws-${Date.now()}`, label: name, color: DEFAULT_COLORS[idx], icon: DEFAULT_ICON_KEYS[idx] }
    const next = [...workspaces, ws]
    setWorkspaces(next); saveWorkspaces(next)
    setNewWsName(''); setAddingWs(false)
  }

  useEffect(() => {
    if (addingFolderForWs) setTimeout(() => newFolderRef.current?.focus(), 50)
  }, [addingFolderForWs])

  useEffect(() => {
    if (addingSubfolderParentId) setTimeout(() => newSubfolderRef.current?.focus(), 50)
  }, [addingSubfolderParentId])

  function addFolder(wsId: string) {
    const name = newFolderName.trim()
    if (!name) { setAddingFolderForWs(null); return }
    const next = [...folders, { id: `folder-${Date.now()}`, workspaceId: wsId, name, parentId: null }]
    setFolders(next); saveWorkspaceFolders(next)
    setNewFolderName(''); setAddingFolderForWs(null)
  }

  function addSubfolder(wsId: string, parentId: string) {
    const name = newSubfolderName.trim()
    if (!name) { setAddingSubfolderParentId(null); return }
    const next = [...folders, { id: `folder-${Date.now()}`, workspaceId: wsId, name, parentId }]
    setFolders(next); saveWorkspaceFolders(next)
    setNewSubfolderName(''); setAddingSubfolderParentId(null)
  }

  function deleteFolderCascade(wsId: string, folderId: string) {
    const subtree = collectSubtreeFolderIds(folders, folderId)
    deleteDocumentsInFolders(wsId, subtree)
    const next = removeFolderSubtree(folders, folderId)
    setFolders(next)
    saveWorkspaceFolders(next)
    refreshLibraryDocs()
  }

  function ensureFolderOpen(folderId: string) {
    setExpandedFolders(p => ({ ...p, [folderId]: true }))
  }

  function toggleFolderExpand(folderId: string) {
    setExpandedFolders(p => {
      const open = p[folderId] !== false
      return { ...p, [folderId]: !open }
    })
  }

  function folderDocsOpen(folderId: string) {
    return expandedFolders[folderId] !== false
  }

  function newDocumentInFolder(wsId: string, folderId: string) {
    const d = createFolderDocument(wsId, folderId, 'Untitled')
    refreshLibraryDocs()
    router.push(`/app/${wsId}/folder/${folderId}/doc/${d.id}`)
  }

  const favoritedWorkspaces = workspaces.filter(ws => favorites.includes(ws.id))

  return (
    <>
      <motion.aside
        animate={{ width: collapsed ? 60 : 228 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        style={{ willChange: 'width' }}
        className="relative h-screen flex flex-col bg-[#FDFBF7] border-r border-stone-200/60 overflow-hidden shrink-0 select-none"
      >
        {/* ── Logo + sidebar collapse only (activity panel toggle lives on main content) ── */}
        <div
          className={cn(
            'h-[52px] flex shrink-0 items-center border-b border-stone-200',
            collapsed ? 'justify-center px-0' : 'gap-2 px-3',
          )}
        >
          {!collapsed && (
            <div className="min-w-0 flex-1 overflow-hidden transition-[opacity,max-width] duration-[220ms] ease-[cubic-bezier(.4,0,.2,1)]">
              <Link href="/" className="flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-80">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1C1E26]">
                  <span className="block h-4 w-1 -rotate-12 rounded-full bg-white" />
                </div>
                <span className="whitespace-nowrap text-[18px] font-bold tracking-tight text-stone-800">
                  inline
                </span>
              </Link>
            </div>
          )}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <motion.div
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            >
              <PanelLeftClose className="h-4 w-4" />
            </motion.div>
          </button>
        </div>

        {/* ── Search ── */}
        <div className={cn('px-2 pt-3 pb-1 shrink-0', collapsed && 'flex justify-center')}>
          {collapsed ? (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('inline-open-cmd'))}
              className="w-10 h-10 aspect-square rounded-md flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              title="Search (Ctrl+K)"
            >
              <Search className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('inline-open-cmd'))}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-stone-50 border border-stone-200/60 cursor-pointer hover:border-stone-200 transition-colors text-left"
            >
              <Search className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span className="flex-1 text-xs text-stone-400 select-none">Search…</span>
              <kbd className="text-[9px] text-stone-300 bg-white border border-stone-200/60 rounded px-1 py-0.5 font-sans leading-none">/</kbd>
            </button>
          )}
        </div>

        {/* ── Scrollable nav ── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-2 scrollbar-minimal">

          {/* Favorites — collapsible */}
          {favoritedWorkspaces.length > 0 && (
            <>
              <SectionLabel label="Favorites" collapsed={collapsed} expanded={expandedSections.favorites} onToggle={() => toggleSection('favorites')} />
              <nav className="flex flex-col gap-0.5 mt-0.5 overflow-hidden transition-[max-height,opacity] duration-[220ms] ease-[cubic-bezier(.4,0,.2,1)]"
                style={{ maxHeight: (!collapsed && expandedSections.favorites) ? 400 : 0, opacity: (!collapsed && expandedSections.favorites) ? 1 : 0 }}>
                {favoritedWorkspaces.map(ws => {
                  const Icon = ICON_MAP[ws.icon] ?? Zap
                  return (
                    <NavRow key={`fav-${ws.id}`} href={`/app/${ws.id}/dashboard`} icon={Icon}
                      label={ws.label} collapsed={collapsed} active={activeWsId === ws.id}
                      dotColor={ws.color} onStar={() => toggleFavorite(ws.id)} starred />
                  )
                })}
              </nav>
            </>
          )}

          {/* Features — collapsible */}
          <SectionLabel label="Features" collapsed={collapsed} expanded={expandedSections.features} onToggle={() => toggleSection('features')} />
          <nav className="flex flex-col gap-0.5 mt-0.5 overflow-hidden transition-[max-height,opacity] duration-[220ms] ease-[cubic-bezier(.4,0,.2,1)]"
            style={{ maxHeight: (collapsed || expandedSections.features) ? 400 : 0, opacity: (collapsed || expandedSections.features) ? 1 : 0 }}>
            {FEATURES.map(item => {
              const href = item.href(activeWsId)
              return (
                <NavRow key={item.label} href={href} icon={item.icon} label={item.label}
                  collapsed={collapsed} active={pathname === href || pathname.startsWith(href + '/')} />
              )
            })}
          </nav>

          {/* Workspaces — collapsible */}
          <SectionLabel
            label="Workspaces" collapsed={collapsed}
            expanded={expandedSections.workspaces} onToggle={() => toggleSection('workspaces')}
            action={
              <button className="w-5 h-5 rounded flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                onClick={() => setAddingWs(true)} title="New workspace">
                <Plus className="w-3 h-3" />
              </button>
            }
          />
          <div className="overflow-hidden transition-[max-height,opacity] duration-[220ms] ease-[cubic-bezier(.4,0,.2,1)]"
            style={{ maxHeight: (collapsed || expandedSections.workspaces) ? 900 : 0, opacity: (collapsed || expandedSections.workspaces) ? 1 : 0 }}>
            {workspaces.map(ws => {
              const Icon        = ICON_MAP[ws.icon] ?? Zap
              const wsExpanded  = expandedWorkspaces[ws.id] ?? false
              const wsRootFolders = getRootFolders(folders, ws.id)
              const isActive    = activeWsId === ws.id
              const isAddingHere = addingFolderForWs === ws.id

              return (
                <div key={ws.id}>
                  {/* Workspace row */}
                  <div className="group/row relative flex items-center">
                    <Link
                      href={`/app/${ws.id}/dashboard`}
                      onClick={e => {
                        const canExpand = wsRootFolders.length > 0 || isAddingHere
                        if (canExpand) {
                          e.preventDefault()
                          toggleWsExpand(ws.id)
                        }
                      }}
                      className={cn(
                        collapsed
                          ? 'w-10 h-10 aspect-square rounded-md flex items-center justify-center transition-all cursor-pointer shrink-0'
                          : 'flex flex-1 items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-sm transition-all cursor-pointer min-w-0',
                        isActive ? 'bg-[#F1F1EF] text-[#37352F] font-semibold' : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100',
                      )}
                      title={(wsRootFolders.length > 0 || isAddingHere) ? `${wsExpanded ? 'Collapse' : 'Expand'} folders` : undefined}
                    >
                      <span className="w-4 h-4 rounded-md flex items-center justify-center shrink-0" style={{ background: ws.color + '22' }}>
                        <Icon className="w-3 h-3 shrink-0" style={{ color: ws.color }} />
                      </span>
                      <span
                        className="flex-1 overflow-hidden whitespace-nowrap truncate min-w-0 transition-[opacity,max-width] duration-[220ms] ease-[cubic-bezier(.4,0,.2,1)]"
                        style={{ maxWidth: collapsed ? 0 : 120, opacity: collapsed ? 0 : 1 }}
                      >
                        {ws.label}
                      </span>
                    </Link>
                    {!collapsed && (
                      <div className="flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity pr-1 shrink-0">
                        {/* Dashboard — when row click expands folders, still need a way to open this workspace */}
                        {(wsRootFolders.length > 0 || isAddingHere) && (
                          <Link
                            href={`/app/${ws.id}/dashboard`}
                            onClick={e => e.stopPropagation()}
                            className="w-5 h-5 flex items-center justify-center rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                            title="Open workspace dashboard"
                          >
                            <LayoutDashboard className="w-3 h-3" />
                          </Link>
                        )}
                        {/* Add folder */}
                        <button onClick={e => { e.preventDefault(); e.stopPropagation(); setAddingFolderForWs(ws.id); setExpandedWorkspaces(p => ({ ...p, [ws.id]: true })) }}
                          className="w-5 h-5 flex items-center justify-center rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer" title="New folder">
                          <FolderPlus className="w-3 h-3" />
                        </button>
                        {/* Star */}
                        <button onClick={e => { e.preventDefault(); e.stopPropagation(); toggleFavorite(ws.id) }}
                          className="w-5 h-5 flex items-center justify-center rounded transition-colors cursor-pointer"
                          title={favorites.includes(ws.id) ? 'Unpin' : 'Pin to Favorites'}>
                          <Star className={cn('w-3 h-3 transition-colors', favorites.includes(ws.id) ? 'fill-amber-400 text-amber-400' : 'text-stone-400 hover:text-amber-400')} />
                        </button>
                        {/* Expand/collapse */}
                        {(wsRootFolders.length > 0 || isAddingHere) && (
                          <button onClick={e => { e.preventDefault(); e.stopPropagation(); toggleWsExpand(ws.id) }}
                            className="w-5 h-5 flex items-center justify-center rounded text-stone-400 hover:text-stone-700 transition-colors cursor-pointer">
                            <ChevronRight className={cn('w-3 h-3 transition-transform duration-150', wsExpanded && 'rotate-90')} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Folders sub-section */}
                  {!collapsed && (wsRootFolders.length > 0 || isAddingHere) && (
                    <div className="overflow-hidden transition-[max-height,opacity] duration-[200ms] ease-[cubic-bezier(.4,0,.2,1)] ml-3 pl-2 border-l border-stone-200/50"
                      style={{ maxHeight: wsExpanded ? 400 : 0, opacity: wsExpanded ? 1 : 0 }}>
                      {wsRootFolders.map(folder => (
                        <SidebarFolderNode
                          key={folder.id}
                          folder={folder}
                          wsId={ws.id}
                          depth={0}
                          allFolders={folders}
                          libraryDocs={libraryDocs}
                          expandedFolders={expandedFolders}
                          toggleFolderExpand={toggleFolderExpand}
                          folderDocsOpen={folderDocsOpen}
                          newDocumentInFolder={newDocumentInFolder}
                          deleteFolderCascade={deleteFolderCascade}
                          addingSubfolderParentId={addingSubfolderParentId}
                          setAddingSubfolderParentId={setAddingSubfolderParentId}
                          newSubfolderName={newSubfolderName}
                          setNewSubfolderName={setNewSubfolderName}
                          newSubfolderRef={newSubfolderRef}
                          addSubfolder={addSubfolder}
                          ensureFolderOpen={ensureFolderOpen}
                        />
                      ))}
                      {isAddingHere && (
                        <div className="flex items-center gap-1 px-1 py-0.5">
                          <Folder className="w-3 h-3 text-stone-300 shrink-0" />
                          <input ref={newFolderRef}
                            className="flex-1 text-xs h-6 px-1.5 rounded border border-[#D3D1CB] bg-white focus:outline-none focus:ring-1 focus:ring-[#C4D4E4]"
                            placeholder="Folder name…"
                            value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') addFolder(ws.id)
                              if (e.key === 'Escape') { setAddingFolderForWs(null); setNewFolderName('') }
                            }}
                            onBlur={() => setTimeout(() => { setAddingFolderForWs(null); setNewFolderName('') }, 150)}
                          />
                          <button onClick={() => addFolder(ws.id)} className="w-5 h-5 flex items-center justify-center rounded text-[#37352F] hover:bg-[#F1F1EF] cursor-pointer">
                            <Check className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
            {addingWs && !collapsed && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 mt-0.5">
                <input ref={newWsRef}
                  className="flex-1 text-xs h-7 px-2 rounded-md border border-[#D3D1CB] bg-white focus:outline-none focus:ring-2 focus:ring-[#C4D4E4]"
                  placeholder="Workspace name…" value={newWsName} onChange={e => setNewWsName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addWorkspace(); if (e.key === 'Escape') { setAddingWs(false); setNewWsName('') } }}
                  onBlur={() => setTimeout(() => { setAddingWs(false); setNewWsName('') }, 150)} />
                <button onClick={addWorkspace} className="w-6 h-6 flex items-center justify-center rounded text-[#37352F] hover:bg-[#F1F1EF] transition-colors cursor-pointer">
                  <Check className="w-3 h-3" />
                </button>
                <button onClick={() => { setAddingWs(false); setNewWsName('') }} className="w-6 h-6 flex items-center justify-center rounded text-stone-400 hover:bg-stone-100 transition-colors cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-stone-200 px-2 pt-2 pb-2 shrink-0 space-y-0.5">
          <div
            className="overflow-hidden transition-[opacity,max-height] duration-[220ms] ease-[cubic-bezier(.4,0,.2,1)]"
            style={{ maxHeight: collapsed ? 0 : 40, opacity: collapsed ? 0 : 1 }}
          >
            <button
              className="w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-xs text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              onClick={() => setInviteOpen(true)}
            >
              <UserPlus className="w-3.5 h-3.5 shrink-0" />
              <span>Invite Users</span>
            </button>
          </div>

          <div className={cn('flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg', collapsed && 'justify-center')}>
            <Link
              href="/app/account"
              title={collapsed ? `${userName}\n${userEmail}` : undefined}
              className={cn(
                'flex items-center gap-2.5 flex-1 min-w-0 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer',
                collapsed ? 'justify-center' : 'py-0.5',
              )}
            >
              <div className={cn('bg-[#F0EBE3] border border-stone-300 flex items-center justify-center text-[#37352F] text-[10px] font-bold shrink-0', collapsed ? 'w-10 h-10 aspect-square rounded-md' : 'w-6 h-6 rounded-full')}>
                {userInitial}
              </div>
              <div
                className="flex-1 overflow-hidden min-w-0 transition-[opacity,max-width] duration-[220ms] ease-[cubic-bezier(.4,0,.2,1)]"
                style={{ maxWidth: collapsed ? 0 : 120, opacity: collapsed ? 0 : 1 }}
              >
                <p className="font-medium text-stone-700 text-xs truncate leading-tight">{userName}</p>
                <p className="text-stone-400 truncate text-[10px] leading-tight">{userEmail}</p>
              </div>
            </Link>
            <div
              className="transition-[opacity,max-width] duration-[220ms] ease-[cubic-bezier(.4,0,.2,1)] overflow-hidden"
              style={{ maxWidth: collapsed ? 0 : 32, opacity: collapsed ? 0 : 1 }}
            >
              <form action={signOut}>
                <button type="submit"
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors shrink-0 cursor-pointer"
                  title="Sign out">
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </motion.aside>

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </>
  )
}
