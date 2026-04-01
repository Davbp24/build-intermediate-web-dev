'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/shell/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/client'
import {
  User, Mail, Key, Camera, Check, Loader2, LogOut,
  Shield, Bell, Palette, Trash2, AlertTriangle,
} from 'lucide-react'

type Tab = 'profile' | 'security' | 'notifications' | 'appearance' | 'danger'

const ACCOUNT_NAV: { label: string; items: { id: Tab; label: string; icon: React.ElementType; danger?: boolean }[] }[] = [
  {
    label: 'Account',
    items: [
      { id: 'profile',  label: 'Profile',  icon: User },
      { id: 'security', label: 'Security', icon: Shield },
    ],
  },
  {
    label: 'Preferences',
    items: [
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'appearance',    label: 'Appearance',    icon: Palette },
    ],
  },
  {
    label: 'Danger zone',
    items: [
      { id: 'danger', label: 'Delete account', icon: Trash2, danger: true },
    ],
  },
]

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

function ProfileTab() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, startTrans] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setFullName(user.user_metadata?.full_name || user.user_metadata?.name || '')
      setEmail(user.email ?? '')
      setAvatar(user.user_metadata?.avatar_url ?? null)
    })
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setAvatar(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handleSave() {
    startTrans(async () => {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return
      const supabase = createClient()
      await supabase.auth.updateUser({
        data: { full_name: fullName, avatar_url: avatar },
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    })
  }

  const initial = (fullName || email || 'U').charAt(0).toUpperCase()

  return (
    <div className="space-y-8">
      <SectionCard title="Personal Information" description="This information is visible to your teammates.">
        <Row label="Avatar">
          <div className="flex items-center gap-4">
            <div
              onClick={() => fileRef.current?.click()}
              className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center text-primary font-bold text-xl shrink-0 cursor-pointer hover:opacity-80 transition-opacity overflow-hidden"
            >
              {avatar ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" /> : initial}
            </div>
            <div>
              <Button variant="outline" size="sm" className="cursor-pointer gap-1.5" onClick={() => fileRef.current?.click()}>
                <Camera className="w-3.5 h-3.5" /> Upload Photo
              </Button>
              <p className="text-xs text-muted-foreground mt-1.5">PNG, JPG up to 2MB</p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
          </div>
        </Row>

        <Row label="Full Name" hint="How you appear to teammates.">
          <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" />
        </Row>

        <Row label="Email" hint="Your login email address.">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">{email || 'Not set'}</span>
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

function SecurityTab() {
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [saved, setSaved] = useState(false)
  const [pending, startTrans] = useTransition()

  function handleChangePassword() {
    if (!newPw || newPw !== confirmPw) return
    startTrans(async () => {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return
      const supabase = createClient()
      await supabase.auth.updateUser({ password: newPw })
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    })
  }

  return (
    <div className="space-y-8">
      <SectionCard title="Change Password" description="Update your password to keep your account secure.">
        <Row label="Current Password">
          <Input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" />
        </Row>
        <Row label="New Password">
          <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="••••••••" />
        </Row>
        <Row label="Confirm New Password">
          <Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="••••••••" />
        </Row>
        <div className="flex items-center justify-between pt-1">
          <SaveBadge saved={saved} />
          <Button size="sm" onClick={handleChangePassword} disabled={pending || newPw !== confirmPw || !newPw} className="cursor-pointer ml-auto">
            {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Key className="w-3.5 h-3.5 mr-1.5" />}
            Update Password
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Active Sessions" description="Manage devices where you are signed in.">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Current Session</p>
            <p className="text-xs text-muted-foreground mt-0.5">This browser · active now</p>
          </div>
          <span className="text-xs font-medium text-accent px-2 py-0.5 rounded-full bg-accent/10">Active</span>
        </div>
      </SectionCard>
    </div>
  )
}

function NotificationsTab() {
  const [notifs, setNotifs] = useState({ emailUpdates: true, productNews: false, securityAlerts: true })
  const [saved, setSaved] = useState(false)

  function toggle(k: keyof typeof notifs) {
    const next = { ...notifs, [k]: !notifs[k] }
    setNotifs(next)
    localStorage.setItem('inline_account_notifs', JSON.stringify(next))
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  useEffect(() => {
    try { const s = JSON.parse(localStorage.getItem('inline_account_notifs') || '{}'); setNotifs(p => ({ ...p, ...s })) } catch { /* ignore */ }
  }, [])

  return (
    <div className="space-y-8">
      <SectionCard title="Email Preferences" description="Choose what emails you receive from Inline.">
        <ToggleRow label="Product updates" description="New features and improvements." checked={notifs.emailUpdates} onChange={() => toggle('emailUpdates')} />
        <div className="h-px bg-border" />
        <ToggleRow label="Product news" description="Announcements and blog posts." checked={notifs.productNews} onChange={() => toggle('productNews')} />
        <div className="h-px bg-border" />
        <ToggleRow label="Security alerts" description="Sign-in from new devices and password changes." checked={notifs.securityAlerts} onChange={() => toggle('securityAlerts')} />
        <div className="flex justify-end"><SaveBadge saved={saved} /></div>
      </SectionCard>
    </div>
  )
}

function AppearanceTab() {
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system')

  return (
    <div className="space-y-8">
      <SectionCard title="Theme" description="Select your preferred appearance.">
        <div className="flex gap-3">
          {(['system', 'light', 'dark'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={cn(
                'flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer capitalize',
                theme === t
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/30',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

function DangerTab() {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (confirmText !== 'DELETE') return
    setDeleting(true)
    await new Promise(r => setTimeout(r, 600))
    router.push('/')
  }

  return (
    <div className="space-y-8">
      <SectionCard title="Danger Zone" description="These actions are permanent and cannot be undone.">
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm font-medium">Sign out everywhere</p>
            <p className="text-xs text-muted-foreground mt-0.5">Revoke all active sessions except this one.</p>
          </div>
          <Button size="sm" variant="outline" className="cursor-pointer border-amber-300 text-amber-600 hover:bg-amber-50">
            Sign Out All
          </Button>
        </div>
        <div className="h-px bg-border" />
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm font-medium text-destructive">Delete account</p>
            <p className="text-xs text-muted-foreground mt-0.5">Permanently deletes your account and all personal data.</p>
          </div>
          <Button size="sm" variant="destructive" className="cursor-pointer" onClick={() => setShowModal(true)}>
            Delete Account
          </Button>
        </div>
      </SectionCard>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-card text-card-foreground rounded-2xl border border-border p-6 w-full max-w-sm space-y-4"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4.5 h-4.5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Delete your account?</h3>
                <p className="text-xs text-muted-foreground mt-1">This action is irreversible. All workspaces you own and all personal data will be deleted.</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Type <strong className="text-foreground font-mono">DELETE</strong> to confirm:</p>
              <Input value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder="DELETE" className="font-mono text-sm" autoFocus />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" className="flex-1 cursor-pointer" onClick={() => { setShowModal(false); setConfirmText('') }}>Cancel</Button>
              <Button variant="destructive" size="sm" className="flex-1 cursor-pointer" disabled={confirmText !== 'DELETE' || deleting} onClick={handleDelete}>
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Delete Account'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AccountSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  const TabContent: Record<Tab, React.ReactNode> = {
    profile:       <ProfileTab />,
    security:      <SecurityTab />,
    notifications: <NotificationsTab />,
    appearance:    <AppearanceTab />,
    danger:        <DangerTab />,
  }

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Account Settings' }]}
        title="Account Settings"
        subtitle="Manage your personal account"
      />

      <div className="flex h-[calc(100vh-112px)] overflow-hidden">
        <aside className="w-52 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col overflow-y-auto scrollbar-minimal">
          <nav className="flex-1 p-3 space-y-5 pt-4">
            {ACCOUNT_NAV.map(group => (
              <div key={group.label}>
                <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map(item => {
                    const Icon = item.icon
                    const active = activeTab === item.id
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => setActiveTab(item.id)}
                          className={cn(
                            'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-sm transition-all cursor-pointer font-medium',
                            item.danger
                              ? active ? 'bg-destructive/15 text-destructive' : 'text-destructive/80 hover:bg-destructive/10 hover:text-destructive'
                              : active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                          )}
                        >
                          <Icon className="w-4 h-4 shrink-0 opacity-90" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="p-3 border-t border-sidebar-border shrink-0">
            <form action={signOut}>
              <button
                type="submit"
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all cursor-pointer font-medium"
              >
                <LogOut className="w-4 h-4 shrink-0 opacity-90" />
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-background scrollbar-minimal">
          <div className="max-w-2xl px-6 py-8 space-y-8">
            {TabContent[activeTab]}
          </div>
        </main>
      </div>
    </>
  )
}
