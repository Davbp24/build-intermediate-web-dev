'use client'

import { useState, useEffect, useTransition, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/shell/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { getWorkspaceName, getWorkspaceColor, DEFAULT_WORKSPACES } from '@/lib/workspaces'
import { exportWorkspaceNotes } from '@/lib/actions/export'
import {
  loadWorkspaceFolders,
  getRootFolders,
  getChildFolders,
  type WorkspaceFolder,
} from '@/lib/workspace-folders'
import {
  Shield,
  Check, UserPlus, Download, Loader2, AlertTriangle,
  X, Crown, Pencil, Eye, FolderOpen, ArrowRight, Folder,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------
type Tab = 'identity' | 'library' | 'members' | 'notifications' | 'permissions' | 'data' | 'danger'

/** Flat tab list for horizontal nav (order preserved) */
const WS_TABS: { id: Tab; label: string; danger?: boolean }[] = [
  { id: 'identity', label: 'General' },
  { id: 'library', label: 'Folders & documents' },
  { id: 'members', label: 'Members' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'permissions', label: 'Permissions' },
  { id: 'data', label: 'Data' },
  { id: 'danger', label: 'Delete workspace', danger: true },
]

const ROLE_META = {
  Admin:  { icon: Crown,  color: '#6C91C2', bg: 'rgba(108,145,194,.12)' },
  Editor: { icon: Pencil, color: '#5FA8A1', bg: 'rgba(95,168,161,.12)'  },
  Viewer: { icon: Eye,    color: '#9B9A97', bg: 'rgba(155,154,151,.12)' },
} as const
type Role = keyof typeof ROLE_META

const INIT_MEMBERS: { id: string; name: string; email: string; role: Role; avatar: string; color: string }[] = [
  { id: 'm1', name: 'John Doe',   email: 'john@example.com',   role: 'Admin',  avatar: 'J', color: '#6C91C2' },
  { id: 'm2', name: 'Sarah Chen', email: 'sarah@example.com',  role: 'Editor', avatar: 'S', color: '#5FA8A1' },
  { id: 'm3', name: 'Marcus J.',  email: 'marcus@example.com', role: 'Viewer', avatar: 'M', color: '#f59e0b' },
]

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------
function SectionCard({ title, description, children, action }: { title: string; description?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground tracking-tight">{title}</h3>
          {description && <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-xl">{description}</p>}
        </div>
        {action}
      </div>
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        {children}
      </div>
    </div>
  )
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[1fr_1.8fr] gap-6 items-start">
      <div className="pt-0.5">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {hint && <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  )
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn('relative shrink-0 w-9 h-5 rounded-full transition-colors duration-200 cursor-pointer', checked ? 'bg-primary' : 'bg-muted-foreground/30')}
      >
        <span className={cn('absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-background ring-1 ring-border/60 transition-transform duration-200', checked && 'translate-x-4')} />
      </button>
    </div>
  )
}

function SaveBadge({ saved }: { saved: boolean }) {
  return saved ? (
    <span className="inline-flex items-center gap-1 text-xs text-accent font-medium">
      <Check className="w-3 h-3" /> Saved
    </span>
  ) : null
}

// ---------------------------------------------------------------------------
// Identity Tab
// ---------------------------------------------------------------------------
function IdentityTab({ workspaceId, initialName, initialColor }: { workspaceId: string; initialName: string; initialColor: string }) {
  const [wsName, setWsName] = useState(initialName)
  const [color,  setColor]  = useState(initialColor)
  const [saved,  setSaved]  = useState(false)
  const [pending, startTrans] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const [icon,   setIcon]   = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setIcon(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handleSave() {
    startTrans(async () => {
      // Persist locally (until Supabase workspace table is connected)
      const raw = localStorage.getItem('inline-workspaces')
      const workspaces = (raw ? JSON.parse(raw) : [...DEFAULT_WORKSPACES]) as { id: string; label?: string; color?: string; icon?: string }[]
      const updated = workspaces.map(w => (w.id === workspaceId ? { ...w, label: wsName, color } : w))
      localStorage.setItem('inline-workspaces', JSON.stringify(updated))
      await new Promise(r => setTimeout(r, 400))
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    })
  }

  const PALETTE = ['#6C91C2','#5FA8A1','#f59e0b','#ef4444','#a855f7','#ec4899','#22c55e','#f97316']

  return (
    <div className="space-y-8">
      <SectionCard title="Workspace Identity" description="Customize your workspace name, icon, and color.">
        <Row label="Icon / Logo">
          <div className="flex items-center gap-4">
            <div
              onClick={() => fileRef.current?.click()}
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shrink-0 cursor-pointer hover:opacity-80 transition-opacity overflow-hidden"
              style={{ backgroundColor: color }}
            >
              {icon ? <img src={icon} alt="ws icon" className="w-full h-full object-cover" /> : wsName.charAt(0).toUpperCase()}
            </div>
            <div>
              <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => fileRef.current?.click()}>
                Upload Icon
              </Button>
              <p className="text-xs text-muted-foreground mt-1.5">PNG, SVG, JPG</p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
          </div>
        </Row>

        <Row label="Name">
          <Input value={wsName} onChange={e => setWsName(e.target.value)} placeholder="Workspace name" />
        </Row>

        <Row label="Color" hint="Used for sidebar indicators and icons.">
          <div className="flex flex-wrap gap-2">
            {PALETTE.map(c => (
              <button
                key={c} onClick={() => setColor(c)}
                className={cn('w-7 h-7 rounded-full border-2 transition-all cursor-pointer hover:scale-110',
                  color === c ? 'border-foreground scale-110' : 'border-transparent'
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </Row>

        <div className="flex items-center justify-between pt-1">
          <SaveBadge saved={saved} />
          <Button size="sm" onClick={handleSave} disabled={pending} className="cursor-pointer ml-auto">
            {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
            Save Changes
          </Button>
        </div>
      </SectionCard>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Members Tab
// ---------------------------------------------------------------------------
function MembersTab({ workspaceId }: { workspaceId: string }) {
  const [members, setMembers] = useState(INIT_MEMBERS)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)

  function changeRole(id: string, role: Role) {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, role } : m))
  }

  function removeMember(id: string) {
    setMembers(prev => prev.filter(m => m.id !== id))
  }

  async function handleInvite() {
    if (!inviteEmail.includes('@')) return
    setInviting(true)
    await new Promise(r => setTimeout(r, 600))
    setInviting(false)
    setInviteSent(true)
    setInviteEmail('')
    setTimeout(() => setInviteSent(false), 3000)
  }

  return (
    <div className="space-y-8">
      <SectionCard title="Invite Member" description="Send an email invitation to join this workspace.">
        <div className="flex gap-2">
          <Input
            value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
            placeholder="colleague@company.com"
            onKeyDown={e => e.key === 'Enter' && handleInvite()}
            className="flex-1"
          />
          <Button size="sm" onClick={handleInvite} disabled={inviting} className="cursor-pointer gap-1.5 shrink-0">
            {inviting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
            {inviteSent ? 'Sent!' : 'Invite'}
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Team Members" description={`${members.length} members in this workspace.`}>
        <div className="space-y-1">
          {members.map((m, i) => {
            const RoleMeta = ROLE_META[m.role]
            const RoleIcon = RoleMeta.icon
            return (
              <div key={m.id}>
                {i > 0 && <div className="h-px bg-border" />}
                <div className="flex items-center gap-3 py-2.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: m.color }}>
                    {m.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                  </div>

                  {/* Role selector — Radix-style custom dropdown */}
                  <div className="flex items-center gap-1">
                    {(['Viewer', 'Editor', 'Admin'] as Role[]).map(r => (
                      <button
                        key={r}
                        onClick={() => changeRole(m.id, r)}
                        className={cn(
                          'flex items-center gap-1 h-6 px-2 rounded-md text-xs font-medium border transition-colors cursor-pointer',
                          m.role === r
                            ? 'border-transparent text-white'
                            : 'bg-transparent text-muted-foreground border-border hover:border-primary/40'
                        )}
                        style={m.role === r ? { background: RoleMeta.color, borderColor: RoleMeta.color } : undefined}
                      >
                        {m.role === r && <RoleIcon className="w-2.5 h-2.5" />}
                        {r}
                      </button>
                    ))}
                  </div>

                  {m.role !== 'Admin' && (
                    <button onClick={() => removeMember(m.id)} className="w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </SectionCard>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Data Management Tab
// ---------------------------------------------------------------------------
function DataTab({ workspaceId }: { workspaceId: string }) {
  const [exporting, setExporting] = useState(false)
  const [exported,  setExported]  = useState(false)

  async function handleExport() {
    setExporting(true)
    try {
      const { csv, filename } = await exportWorkspaceNotes(workspaceId)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url  = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href     = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      setExported(true)
      setTimeout(() => setExported(false), 3000)
    } catch (err) {
      console.error('Export failed', err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-8">
      <SectionCard title="Export Data" description="Download all notes, extractions, and metadata as a CSV file.">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Notes Export</p>
            <p className="text-xs text-muted-foreground mt-0.5">All captured notes for this workspace as <code className="font-mono text-[11px] bg-muted px-1 rounded">workspace_export.csv</code></p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting} className="cursor-pointer gap-2">
            {exporting
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Exporting…</>
              : exported
              ? <><Check className="w-3.5 h-3.5 text-accent" /> Downloaded</>
              : <><Download className="w-3.5 h-3.5" /> Export CSV</>
            }
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Import Data" description="Bring notes from external sources into this workspace.">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Import from CSV / JSON</p>
            <p className="text-xs text-muted-foreground mt-0.5">Accepted formats: Inline export CSV, Notion export JSON.</p>
          </div>
          <Button variant="outline" size="sm" className="cursor-pointer">Browse File</Button>
        </div>
      </SectionCard>

      <SectionCard title="Storage" description="Data usage for this workspace.">
        <div className="space-y-3">
          {[
            { label: 'Notes',       val: '42 KB',  pct: 22 },
            { label: 'Drawings',    val: '130 KB', pct: 65 },
            { label: 'Extractions', val: '18 KB',  pct: 9  },
          ].map(r => (
            <div key={r.label} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="font-medium">{r.val}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary/60 rounded-full" style={{ width: `${r.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Danger Zone Tab
// ---------------------------------------------------------------------------
function DangerTab({ workspaceId, workspaceName }: { workspaceId: string; workspaceName: string }) {
  const router = useRouter()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [confirmText,     setConfirmText]     = useState('')
  const [deleting,        setDeleting]        = useState(false)

  async function handleDelete() {
    if (confirmText !== workspaceName) return
    setDeleting(true)
    try {
      // Remove from localStorage
      const raw = localStorage.getItem('inline-workspaces')
      const workspaces = raw ? JSON.parse(raw) as { id: string }[] : []
      const filtered   = workspaces.filter(w => w.id !== workspaceId)
      localStorage.setItem('inline-workspaces', JSON.stringify(filtered))
      await new Promise(r => setTimeout(r, 600))
      router.push('/app/dashboard')
    } catch { setDeleting(false) }
  }

  return (
    <div className="space-y-8">
      <SectionCard title="Danger Zone" description="These actions are permanent and cannot be undone.">
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm font-medium">Archive workspace</p>
            <p className="text-xs text-muted-foreground mt-0.5">Hide from sidebar. Notes are preserved and can be restored.</p>
          </div>
          <Button size="sm" variant="outline" className="cursor-pointer border-amber-300 text-amber-600 hover:bg-amber-50">Archive</Button>
        </div>
        <div className="h-px bg-border" />
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm font-medium text-destructive">Delete workspace</p>
            <p className="text-xs text-muted-foreground mt-0.5">Permanently deletes all notes, drawings, and data.</p>
          </div>
          <Button size="sm" variant="destructive" className="cursor-pointer" onClick={() => setShowDeleteModal(true)}>
            Delete
          </Button>
        </div>
      </SectionCard>

      {/* ── Delete confirmation modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-card text-card-foreground rounded-2xl border border-border p-6 w-full max-w-sm space-y-4"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4.5 h-4.5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Delete &ldquo;{workspaceName}&rdquo;?</h3>
                <p className="text-xs text-muted-foreground mt-1">This action is irreversible. All notes and data will be permanently deleted.</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Type <strong className="text-foreground font-mono">{workspaceName}</strong> to confirm:</p>
              <Input
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder={workspaceName}
                className="font-mono text-sm"
                autoFocus
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" className="flex-1 cursor-pointer" onClick={() => { setShowDeleteModal(false); setConfirmText('') }}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" className="flex-1 cursor-pointer"
                disabled={confirmText !== workspaceName || deleting}
                onClick={handleDelete}>
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Delete workspace'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Library (folders & documents)
// ---------------------------------------------------------------------------
function LibraryFolderTreeItem({
  folder,
  workspaceId,
  allFolders,
  depth,
}: {
  folder: WorkspaceFolder
  workspaceId: string
  allFolders: WorkspaceFolder[]
  depth: number
}) {
  const children = getChildFolders(allFolders, workspaceId, folder.id)
  return (
    <li className="space-y-2">
      <Link
        href={`/app/${workspaceId}/folder/${folder.id}`}
        className="flex items-center gap-3 rounded-xl border border-border/80 px-4 py-3 hover:border-primary/30 hover:bg-primary/5 transition-colors cursor-pointer"
        style={{ marginLeft: depth * 12 }}
      >
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Folder className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground">{folder.name}</p>
          <p className="text-xs text-muted-foreground">Open folder library & documents</p>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </Link>
      {children.length > 0 && (
        <ul className="space-y-2 ml-3 pl-3 border-l border-border/50">
          {children.map(c => (
            <LibraryFolderTreeItem
              key={c.id}
              folder={c}
              workspaceId={workspaceId}
              allFolders={allFolders}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

function LibraryTab({ workspaceId }: { workspaceId: string }) {
  const [folders, setFolders] = useState<WorkspaceFolder[]>([])

  function refreshFolders() {
    setFolders(loadWorkspaceFolders().filter(f => f.workspaceId === workspaceId))
  }

  useEffect(() => {
    refreshFolders()
    const onFolders = () => refreshFolders()
    window.addEventListener('inline-folders-changed', onFolders)
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'inline-folders') refreshFolders()
    }
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('inline-folders-changed', onFolders)
      window.removeEventListener('storage', onStorage)
    }
  }, [workspaceId])

  const roots = useMemo(() => getRootFolders(folders, workspaceId), [folders, workspaceId])

  return (
    <div className="space-y-8">
      <SectionCard
        title="Workspace library"
        description="Folders belong only to this workspace. Nest subfolders from the sidebar; each folder can hold documents and more folders."
      >
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/app/${workspaceId}/dashboard`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline cursor-pointer"
          >
            <ArrowRight className="w-4 h-4 rotate-180" /> Back to dashboard
          </Link>
        </div>
        {roots.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-4">No folders yet. Use the sidebar → Workspaces → folder icon to create one.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {roots.map(f => (
              <LibraryFolderTreeItem
                key={f.id}
                folder={f}
                workspaceId={workspaceId}
                allFolders={folders}
                depth={0}
              />
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Notifications & Permissions Tabs
// ---------------------------------------------------------------------------
function NotificationsTab() {
  const [notifs, setNotifs] = useState({ weeklyDigest: true, memberJoins: true, noteCaptures: false, riskAlerts: true })
  const [saved, setSaved] = useState(false)

  function toggle(k: keyof typeof notifs) {
    const next = { ...notifs, [k]: !notifs[k] }
    setNotifs(next)
    localStorage.setItem('inline_ws_notifs', JSON.stringify(next))
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  useEffect(() => {
    try { const s = JSON.parse(localStorage.getItem('inline_ws_notifs') || '{}'); setNotifs(p => ({ ...p, ...s })) } catch { /* ignore */ }
  }, [])

  return (
    <div className="space-y-8">
      <SectionCard title="Email Notifications">
        <ToggleRow label="Weekly digest"    description="Workspace activity summary every Monday." checked={notifs.weeklyDigest}  onChange={() => toggle('weeklyDigest')} />
        <div className="h-px bg-border" />
        <ToggleRow label="New member joins" description="Notify when someone joins this workspace."  checked={notifs.memberJoins}   onChange={() => toggle('memberJoins')} />
        <div className="h-px bg-border" />
        <ToggleRow label="Note captures"    description="Real-time alerts when a teammate captures." checked={notifs.noteCaptures}  onChange={() => toggle('noteCaptures')} />
        <div className="h-px bg-border" />
        <ToggleRow label="Risk alerts"      description="Notify when Analyze Risk finds issues."     checked={notifs.riskAlerts}    onChange={() => toggle('riskAlerts')} />
        <div className="flex justify-end"><SaveBadge saved={saved} /></div>
      </SectionCard>
    </div>
  )
}

function PermissionsTab() {
  return (
    <div className="space-y-8">
      <SectionCard title="Access Control" description="Who can perform each action in this workspace.">
        <div className="space-y-0">
          {[
            { action: 'Capture notes',     roles: ['Editor', 'Admin'] },
            { action: 'Delete notes',      roles: ['Admin'] },
            { action: 'Invite members',    roles: ['Admin'] },
            { action: 'Export data',       roles: ['Editor', 'Admin'] },
            { action: 'View all notes',    roles: ['Viewer', 'Editor', 'Admin'] },
            { action: 'Edit workspace',    roles: ['Admin'] },
            { action: 'Delete workspace',  roles: ['Admin'] },
          ].map((row, i) => (
            <div key={i} className={cn('flex items-center justify-between py-3 text-sm', i > 0 && 'border-t border-border')}>
              <span className="text-foreground">{row.action}</span>
              <div className="flex gap-1.5">
                {row.roles.map(r => {
                  const meta = ROLE_META[r as Role]
                  return (
                    <span key={r} className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: meta.bg, color: meta.color }}>
                      {r}
                    </span>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function WorkspaceSettingsPage() {
  const params      = useParams()
  const workspaceId = Array.isArray(params.workspaceId) ? params.workspaceId[0] : (params.workspaceId as string) ?? 'ws-1'
  const [workspaceName,  setWorkspaceName]  = useState(() => getWorkspaceName(workspaceId))
  const workspaceColor = getWorkspaceColor(workspaceId)

  const [activeTab, setActiveTab] = useState<Tab>('identity')

  useEffect(() => { setWorkspaceName(getWorkspaceName(workspaceId)) }, [workspaceId])

  const TabContent: Record<Tab, React.ReactNode> = {
    identity:      <IdentityTab workspaceId={workspaceId} initialName={workspaceName} initialColor={workspaceColor} />,
    library:       <LibraryTab workspaceId={workspaceId} />,
    members:       <MembersTab workspaceId={workspaceId} />,
    notifications: <NotificationsTab />,
    permissions:   <PermissionsTab />,
    data:          <DataTab workspaceId={workspaceId} />,
    danger:        <DangerTab workspaceId={workspaceId} workspaceName={workspaceName} />,
  }

  const tabDescriptions: Partial<Record<Tab, string>> = {
    identity: 'Workspace name, icon, and color.',
    library: 'Folders and documents in this workspace.',
    members: 'Invite people and manage roles.',
    notifications: 'Email and activity alerts.',
    permissions: 'Who can capture, export, and manage the workspace.',
    data: 'Export, import, and storage usage.',
    danger: 'Archive or permanently delete this workspace.',
  }

  return (
    <>
      <PageHeader
        crumbs={[{ label: workspaceName, href: `/app/${workspaceId}/dashboard` }, { label: 'Settings' }]}
      />

      <div className="px-6 pb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground mt-4">
          {workspaceName} Settings
        </h1>

        <p className="mt-4 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">AI &amp; Voice, ElevenLabs, and the browser extension</span>{' '}
          are configured in{' '}
          <Link
            href="/app/settings?tab=ai-voice"
            className="font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
          >
            Account settings → AI &amp; Voice
          </Link>
          . This page only covers options for <em>this workspace</em> (folders, members, etc.).
        </p>

        <nav
          className="mt-6 flex gap-1 overflow-x-auto scrollbar-minimal border-b border-border -mb-px pb-px"
          aria-label="Workspace settings sections"
        >
          {WS_TABS.map(tab => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'shrink-0 px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer whitespace-nowrap',
                  tab.danger
                    ? active
                      ? 'border-destructive text-destructive'
                      : 'border-transparent text-destructive/80 hover:text-destructive'
                    : active
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
              </button>
            )
          })}
        </nav>

        <div className="mt-8 w-full space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            {WS_TABS.find(t => t.id === activeTab)?.label}
          </h2>
          {tabDescriptions[activeTab] && (
            <p className="text-sm text-muted-foreground">{tabDescriptions[activeTab]}</p>
          )}
        </div>

        <div className="mt-6 w-full space-y-8">{TabContent[activeTab]}</div>
      </div>
    </>
  )
}
