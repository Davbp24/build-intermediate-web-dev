'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import Link from 'next/link'
import PageHeader from '@/components/shell/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/actions/auth'
import {
  User, Paintbrush, Zap, Puzzle, Check, Eye, EyeOff,
  Play, Loader2, Plus, X, Globe, Shield,
  FileText, Calendar, Bell, GripVertical, ArrowRight,
  HelpCircle, LogOut,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types & navigation groups
// ---------------------------------------------------------------------------
type Tab = 'account' | 'appearance' | 'ai-voice' | 'extension' | 'integrations' | 'notifications'

const NAV_GROUPS: { label: string; items: { id: Tab; label: string; icon: React.ElementType }[] }[] = [
  {
    label: 'Profile',
    items: [
      { id: 'account',      label: 'General',            icon: User     },
      { id: 'notifications',label: 'Notifications',      icon: Bell     },
    ],
  },
  {
    label: 'Preferences',
    items: [
      { id: 'appearance',   label: 'Themes',             icon: Paintbrush },
    ],
  },
  {
    label: 'Apps',
    items: [
      { id: 'integrations', label: 'Apps & integrations', icon: Puzzle },
      { id: 'ai-voice',     label: 'AI & Voice',          icon: Zap    },
      { id: 'extension',    label: 'Extension',           icon: Globe  },
    ],
  },
]

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------
function SectionCard({ title, description, children, action }: {
  title: string; description?: string; children: React.ReactNode; action?: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {description && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed max-w-xl">{description}</p>}
        </div>
        {action}
      </div>
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
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

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn('relative shrink-0 w-9 h-5 rounded-full transition-colors duration-200 cursor-pointer', checked ? 'bg-primary' : 'bg-muted-foreground/30')}
    >
      <span className={cn('absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-background ring-1 ring-border/60 transition-transform duration-200', checked && 'translate-x-4')} />
    </button>
  )
}

function MaskedInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} className="pr-9 font-mono text-sm" />
      <button type="button" onClick={() => setShow(p => !p)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer">
        {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
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
// Account
// ---------------------------------------------------------------------------
function AccountTab() {
  const [name, setName] = useState('John Doe')
  const [email, setEmail] = useState('john@example.com')
  const [saved, setSaved] = useState(false)
  const [pending, start] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const [avatar, setAvatar] = useState<string | null>(null)

  useEffect(() => {
    setName(localStorage.getItem('inline_profile_name') || 'John Doe')
    setEmail(localStorage.getItem('inline_profile_email') || 'john@example.com')
    const av = localStorage.getItem('inline_profile_avatar')
    if (av) setAvatar(av)
  }, [])

  function handleSave() {
    start(async () => {
      localStorage.setItem('inline_profile_name', name)
      localStorage.setItem('inline_profile_email', email)
      if (avatar) localStorage.setItem('inline_profile_avatar', avatar)
      await new Promise(r => setTimeout(r, 400))
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    })
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setAvatar(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Profile" description="Your display name and email address.">
        <Row label="Avatar">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => fileRef.current?.click()}
            >
              {avatar
                ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-primary font-bold text-lg">{name.charAt(0).toUpperCase()}</span>
              }
            </div>
            <div>
              <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => fileRef.current?.click()}>Upload Photo</Button>
              <p className="text-xs text-muted-foreground mt-1.5">PNG, JPG up to 4 MB</p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </div>
          </div>
        </Row>
        <Row label="Full name"><Input value={name} onChange={e => setName(e.target.value)} /></Row>
        <Row label="Email"><Input value={email} onChange={e => setEmail(e.target.value)} type="email" /></Row>
        <div className="flex items-center justify-between pt-1">
          <SaveBadge saved={saved} />
          <Button size="sm" onClick={handleSave} disabled={pending} className="cursor-pointer ml-auto">
            {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}Save changes
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Connected accounts" description="OAuth providers for single sign-on.">
        {[{ name: 'Google', icon: '🔵', connected: false }, { name: 'Microsoft', icon: '🟦', connected: true }].map(a => (
          <div key={a.name} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg">{a.icon}</span>
              <span className="text-sm font-medium">{a.name}</span>
            </div>
            <Button variant={a.connected ? 'outline' : 'default'} size="sm" className="cursor-pointer">
              {a.connected ? 'Disconnect' : 'Connect'}
            </Button>
          </div>
        ))}
      </SectionCard>

      <SectionCard title="Security">
        <Row label="Password">
          <a href="/auth/reset-password" className="inline-flex items-center justify-center gap-1.5 h-9 px-3 text-sm font-medium rounded-md border border-border bg-background hover:bg-accent/30 transition-colors cursor-pointer">
            Change password
          </a>
        </Row>
        <Row label="Two-factor auth" hint="Adds an extra security layer.">
          <Button variant="outline" size="sm" className="cursor-pointer">Enable 2FA</Button>
        </Row>
      </SectionCard>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Appearance / Themes
// ---------------------------------------------------------------------------
function AppearanceTab() {
  const [textSize, setTextSize] = useState(14)
  const [saved, setSaved] = useState(false)
  const [uiTheme, setUiTheme] = useState<'light' | 'dark' | 'cosmic'>('light')

  useEffect(() => {
    const sz = parseInt(localStorage.getItem('inline_text_size') || '14')
    setTextSize(sz)
    document.documentElement.style.setProperty('--font-size-base', `${sz}px`)
    setUiTheme((localStorage.getItem('inline_ui_theme') as 'light' | 'dark' | 'cosmic') || 'light')
  }, [])

  function pickTheme(id: 'light' | 'dark' | 'cosmic') {
    setUiTheme(id)
    localStorage.setItem('inline_ui_theme', id)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  function changeTextSize(v: number) {
    setTextSize(v)
    document.documentElement.style.setProperty('--font-size-base', `${v}px`)
    localStorage.setItem('inline_text_size', String(v))
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  const THEMES = [
    { id: 'light' as const,  name: 'Light',       desc: 'Clean workspace',      cls: 'bg-slate-50 border-slate-200' },
    { id: 'dark' as const,   name: 'Dark',         desc: 'Easier on the eyes',  cls: 'bg-[#191919] border-slate-700' },
    { id: 'cosmic' as const, name: 'Cosmic blue',  desc: 'Soft blue highlights', cls: 'bg-sky-50 border-sky-200' },
  ]

  return (
    <div className="space-y-6">
      <SectionCard title="Select theme" description="Applies accent surfaces across the dashboard." action={<SaveBadge saved={saved} />}>
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map(t => (
            <button key={t.id} type="button" onClick={() => pickTheme(t.id)}
              className={cn('flex flex-col rounded-xl border-2 p-3 text-left transition-all cursor-pointer',
                uiTheme === t.id ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/30'
              )}>
              <div className={cn('h-20 rounded-lg border mb-3', t.cls)} />
              <div className="flex items-center gap-2">
                <span className={cn('w-3.5 h-3.5 rounded-full border-2 shrink-0', uiTheme === t.id ? 'border-primary bg-primary' : 'border-muted-foreground/40')} />
                <div>
                  <p className="text-xs font-semibold">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground">{t.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Text size" description="Scales typography instantly across the dashboard.">
        <Row label="Size" hint={`Current: ${textSize}px`}>
          <div className="space-y-3">
            <input type="range" min={12} max={18} step={1} value={textSize}
              onChange={e => changeTextSize(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer" />
            <div className="flex flex-wrap gap-1.5">
              {[12, 13, 14, 15, 16, 17, 18].map(s => (
                <button key={s} type="button" onClick={() => changeTextSize(s)}
                  className={cn('text-xs px-2.5 py-1 rounded-lg transition-colors cursor-pointer font-medium',
                    textSize === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                  )}>{s}px</button>
              ))}
            </div>
          </div>
        </Row>
      </SectionCard>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
function NotificationsTab() {
  const [prefs, setPrefs] = useState({ product: true, weekly: false, push: true })

  useEffect(() => {
    setPrefs({
      product: localStorage.getItem('inline_notif_product') !== 'false',
      weekly:  localStorage.getItem('inline_notif_weekly') === 'true',
      push:    localStorage.getItem('inline_notif_push') !== 'false',
    })
  }, [])

  function flip(k: keyof typeof prefs) {
    const next = { ...prefs, [k]: !prefs[k] }
    setPrefs(next)
    localStorage.setItem(`inline_notif_${k}`, String(next[k]))
  }

  const rows = [
    { key: 'product' as const, label: 'Product updates',     desc: 'New features and improvements.' },
    { key: 'weekly' as const,  label: 'Weekly digest',       desc: 'Summary of workspace activity.' },
    { key: 'push' as const,    label: 'Browser notifications',desc: 'Toasts for captures and invites.' },
  ]

  return (
    <SectionCard title="Notifications" description="Choose how Inline communicates with you.">
      <div className="space-y-4">
        {rows.map((r, i) => (
          <div key={r.key}>
            {i > 0 && <div className="h-px bg-border" />}
            <div className="flex items-center justify-between pt-2 gap-4">
              <div>
                <p className="text-sm font-medium">{r.label}</p>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
              <Toggle checked={prefs[r.key]} onChange={() => flip(r.key)} />
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

// ---------------------------------------------------------------------------
// AI & Voice
// ---------------------------------------------------------------------------
const VOICE_OPTIONS = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel — Calm, Professional' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi — Confident, Clear'     },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella — Warm, Friendly'      },
  { id: 'ErXwobaYiN019PkySvjV',  name: 'Antoni — Deep, Authoritative'},
]

function AIVoiceTab() {
  const [openaiKey, setOpenaiKey] = useState('')
  const [elevenKey, setElevenKey] = useState('')
  const [voiceId,   setVoiceId]   = useState('21m00Tcm4TlvDq8ikWAM')
  const [saved,     setSaved]     = useState(false)
  const [pending,   start]        = useTransition()
  const [testState, setTest]      = useState<'idle' | 'playing'>('idle')
  const [autocomp,  setAutocomp]  = useState(true)

  useEffect(() => {
    setOpenaiKey(localStorage.getItem('inline_openai_key') || '')
    setElevenKey(localStorage.getItem('inline_elevenlabs_key') || '')
    setVoiceId(localStorage.getItem('inline_voice_id') || '21m00Tcm4TlvDq8ikWAM')
    setAutocomp(localStorage.getItem('inline_autocomplete') !== 'false')
  }, [])

  function handleSave() {
    start(async () => {
      localStorage.setItem('inline_openai_key', openaiKey)
      localStorage.setItem('inline_elevenlabs_key', elevenKey)
      localStorage.setItem('inline_voice_id', voiceId)
      localStorage.setItem('inline_autocomplete', String(autocomp))
      const _chrome = (typeof window !== 'undefined' ? (window as unknown as Record<string, unknown>).chrome : undefined) as (undefined | { storage?: { local?: { set: (v: Record<string, unknown>) => void } } })
      if (_chrome?.storage?.local) {
        _chrome.storage.local.set({ inlineOpenAIKey: openaiKey, inlineElevenLabsKey: elevenKey, inlineVoiceId: voiceId })
      }
      await new Promise(r => setTimeout(r, 400))
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    })
  }

  async function testVoice() {
    if (!elevenKey) { window.speechSynthesis?.speak(new SpeechSynthesisUtterance('Voice preview: Inline AI ready.')); return }
    setTest('playing')
    try {
      const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'xi-api-key': elevenKey },
        body: JSON.stringify({ text: 'Hello, this is your Inline voice assistant.', model_id: 'eleven_monolingual_v1', voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
      })
      if (resp.ok) {
        const blob = await resp.blob()
        const url  = URL.createObjectURL(blob)
        const audio = new Audio(url)
        audio.play()
        audio.onended = () => { URL.revokeObjectURL(url); setTest('idle') }
      } else setTest('idle')
    } catch { setTest('idle') }
  }

  return (
    <div className="space-y-6">
      <SectionCard title="API keys" description="Stored locally and synced to the extension. Never sent to Inline servers." action={<SaveBadge saved={saved} />}>
        <Row label="OpenAI API key" hint="Used for AI Copilot features.">
          <MaskedInput value={openaiKey} onChange={setOpenaiKey} placeholder="sk-…" />
        </Row>
        <Row label="ElevenLabs API key" hint="Used for AI voice read-aloud.">
          <MaskedInput value={elevenKey} onChange={setElevenKey} placeholder="…" />
        </Row>
        <div className="flex justify-end">
          <Button size="sm" onClick={handleSave} disabled={pending} className="cursor-pointer">
            {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}Save keys
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Voice selection" description="The voice used for AI read-aloud.">
        <div className="space-y-2">
          {VOICE_OPTIONS.map(v => (
            <button key={v.id} type="button" onClick={() => setVoiceId(v.id)}
              className={cn('w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-colors cursor-pointer',
                voiceId === v.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
              )}>
              <span>{v.name}</span>
              {voiceId === v.id && <Check className="w-3.5 h-3.5 text-primary" />}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={testVoice} disabled={testState === 'playing'} className="cursor-pointer gap-2">
            {testState === 'playing' ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Playing…</> : <><Play className="w-3.5 h-3.5" />Test voice</>}
          </Button>
          <Button size="sm" onClick={handleSave} className="cursor-pointer">Save voice</Button>
        </div>
      </SectionCard>

      <SectionCard title="AI Copilot">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Context autocomplete</p>
            <p className="text-xs text-muted-foreground mt-0.5">Ghost-text suggestions in sticky notes.</p>
          </div>
          <Toggle checked={autocomp} onChange={v => { setAutocomp(v); localStorage.setItem('inline_autocomplete', String(v)) }} />
        </div>
      </SectionCard>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Extension Config
// ---------------------------------------------------------------------------
function ExtensionTab() {
  const [blocklist, setBlocklist] = useState<string[]>([])
  const [newDomain, setNewDomain] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      const r = localStorage.getItem('inline_blocklist')
      setBlocklist(r ? JSON.parse(r) : [])
    } catch { setBlocklist([]) }
  }, [])

  function persist(list: string[]) {
    localStorage.setItem('inline_blocklist', JSON.stringify(list))
    const _chrome = (typeof window !== 'undefined' ? (window as unknown as Record<string, unknown>).chrome : undefined) as (undefined | { storage?: { local?: { set: (v: Record<string, unknown>) => void } } })
    if (_chrome?.storage?.local) _chrome.storage.local.set({ inlineBlocklist: list })
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  function add() {
    const d = newDomain.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    if (!d || blocklist.includes(d)) return
    const next = [...blocklist, d]
    setBlocklist(next); setNewDomain(''); persist(next)
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Domain blocklist" description="Inline disables itself on these domains." action={<SaveBadge saved={saved} />}>
        <Row label="Add domain">
          <div className="flex gap-2">
            <Input value={newDomain} onChange={e => setNewDomain(e.target.value)}
              placeholder="internal.company.com" onKeyDown={e => e.key === 'Enter' && add()} />
            <Button size="sm" onClick={add} className="cursor-pointer gap-1 shrink-0">
              <Plus className="w-3.5 h-3.5" />Add
            </Button>
          </div>
        </Row>
        {blocklist.map(d => (
          <div key={d} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40 border border-border">
            <div className="flex items-center gap-2 text-sm">
              <Globe className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-mono">{d}</span>
            </div>
            <button type="button" onClick={() => { const n = blocklist.filter(b => b !== d); setBlocklist(n); persist(n) }}
              className="text-muted-foreground hover:text-destructive cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {blocklist.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-3">No domains blocked.</p>
        )}
      </SectionCard>

      <SectionCard title="Extension info">
        <div className="space-y-2 text-sm">
          {[{ label: 'Version', value: '1.1' }, { label: 'Manifest', value: 'MV3' }, { label: 'Storage', value: 'IndexedDB + chrome.storage.local' }].map(r => (
            <div key={r.label} className="flex justify-between">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="font-medium">{r.value}</span>
            </div>
          ))}
        </div>
        <div className="pt-2">
          <Button variant="outline" size="sm" className="cursor-pointer gap-2 text-destructive border-destructive/30 hover:bg-destructive/5">
            <Shield className="w-3.5 h-3.5" />Clear all local data
          </Button>
        </div>
      </SectionCard>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Integrations
// ---------------------------------------------------------------------------
function IntegrationsTab() {
  const [rows, setRows] = useState([
    { id: 'linkedin', name: 'LinkedIn',  connected: false, abbr: 'LI' },
    { id: 'github',   name: 'GitHub',    connected: true,  abbr: 'GH' },
    { id: 'slack',    name: 'Slack',     connected: false, abbr: 'SL' },
    { id: 'notion',   name: 'Notion',    connected: false, abbr: 'NO' },
  ])

  return (
    <SectionCard title="Apps & integrations" description="Connect tools you already use.">
      <ul className="space-y-2">
        {rows.map(r => (
          <li key={r.id} className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-3 py-3">
            <GripVertical className="w-4 h-4 text-muted-foreground/50 cursor-grab" />
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
              {r.abbr}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{r.name}</p>
              <p className="text-xs text-muted-foreground">{r.connected ? 'Connected' : 'Not connected'}</p>
            </div>
            {r.connected ? (
              <Button type="button" variant="outline" size="sm"
                className="cursor-pointer text-destructive border-destructive/30 hover:bg-destructive/5"
                onClick={() => setRows(p => p.map(x => x.id === r.id ? { ...x, connected: false } : x))}>
                Unbind <X className="w-3 h-3 ml-1" />
              </Button>
            ) : (
              <Button type="button" size="sm" className="cursor-pointer gap-1"
                onClick={() => setRows(p => p.map(x => x.id === r.id ? { ...x, connected: true } : x))}>
                Connect <ArrowRight className="w-3 h-3" />
              </Button>
            )}
          </li>
        ))}
      </ul>
    </SectionCard>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function PersonalSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('account')

  const content: Record<Tab, React.ReactNode> = {
    account:      <AccountTab />,
    appearance:   <AppearanceTab />,
    notifications:<NotificationsTab />,
    'ai-voice':   <AIVoiceTab />,
    extension:    <ExtensionTab />,
    integrations: <IntegrationsTab />,
  }

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Settings' }]}
        title="Personal Settings"
        subtitle="Manage your account, appearance, and integrations"
      />

      {/* Two-column layout that lives INSIDE the WorkspaceShell */}
      <div className="flex h-[calc(100vh-112px)] overflow-hidden">
        {/* Left nav */}
        <aside className="w-52 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col overflow-y-auto scrollbar-minimal">
          <nav className="flex-1 p-3 space-y-5 pt-4">
            {NAV_GROUPS.map(group => (
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
                            active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
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

          {/* Footer */}
          <div className="p-3 border-t border-sidebar-border space-y-1 shrink-0">
            <a href="mailto:support@inline.app"
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors cursor-pointer">
              <HelpCircle className="w-4 h-4" />Support
            </a>
            <form action={signOut}>
              <button type="submit"
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer">
                <LogOut className="w-4 h-4" />Log out
              </button>
            </form>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-background scrollbar-minimal">
          <div className="max-w-2xl px-6 py-8 space-y-8">
            {content[activeTab]}
          </div>
        </main>
      </div>
    </>
  )
}
