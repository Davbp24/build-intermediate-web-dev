'use client'

import { useState, useEffect, useTransition, useRef, Fragment, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import PageHeader from '@/components/shell/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/actions/auth'
import {
  DEFAULT_INLINE_VOICE_ID,
  INLINE_VOICE_PRESETS,
  normalizeInlineVoiceId,
} from '@/lib/inlineVoicePresets'
import {
  Check, Eye, EyeOff,
  Play, Loader2, Plus, X, Globe, Shield,
  GripVertical, ArrowRight, AlertTriangle, LogOut,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types & navigation (same shell pattern as workspace settings)
// ---------------------------------------------------------------------------
type Tab = 'general' | 'security' | 'notifications' | 'appearance' | 'integrations' | 'ai-voice' | 'extension' | 'danger'

const PROFILE_TABS: { id: Tab; label: string; danger?: boolean }[] = [
  { id: 'general', label: 'General' },
  { id: 'security', label: 'Security' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'appearance', label: 'Themes' },
  { id: 'integrations', label: 'Apps & integrations' },
  { id: 'ai-voice', label: 'AI & Voice' },
  { id: 'extension', label: 'Extension' },
  { id: 'danger', label: 'Delete account', danger: true },
]

// ---------------------------------------------------------------------------
// Layout helpers (match workspace settings page)
// ---------------------------------------------------------------------------
function SectionCard({ title, description, children, action }: {
  title: string; description?: string; children: React.ReactNode; action?: React.ReactNode
}) {
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
        type="button"
        onClick={() => onChange(!checked)}
        className={cn('relative shrink-0 w-9 h-5 rounded-full transition-colors duration-200 cursor-pointer', checked ? 'bg-primary' : 'bg-muted-foreground/30')}
      >
        <span className={cn('absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-background ring-1 ring-border/60 transition-transform duration-200', checked && 'translate-x-4')} />
      </button>
    </div>
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
// General (identity only — mirrors workspace “General” → Workspace Identity)
// ---------------------------------------------------------------------------
const PROFILE_ACCENT = '#6C91C2'

function GeneralTab() {
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
    <div className="space-y-8">
      <SectionCard title="Profile Identity" description="Customize your name, icon, and email.">
        <Row label="Icon / Logo">
          <div className="flex items-center gap-4">
            <div
              onClick={() => fileRef.current?.click()}
              className="flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl text-xl font-bold text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: PROFILE_ACCENT }}
            >
              {avatar
                ? <img src={avatar} alt="avatar" className="h-full w-full object-cover" />
                : name.charAt(0).toUpperCase()}
            </div>
            <div>
              <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => fileRef.current?.click()}>
                Upload Icon
              </Button>
              <p className="mt-1.5 text-xs text-muted-foreground">PNG, SVG, JPG</p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </div>
          </div>
        </Row>

        <Row label="Name" hint="How you appear to teammates.">
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
        </Row>

        <Row label="Email" hint="Your login email address.">
          <Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@company.com" />
        </Row>

        <div className="flex items-center justify-between pt-1">
          <SaveBadge saved={saved} />
          <Button size="sm" onClick={handleSave} disabled={pending} className="ml-auto cursor-pointer">
            {pending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
            Save Changes
          </Button>
        </div>
      </SectionCard>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Security (connected accounts, password, 2FA, session)
// ---------------------------------------------------------------------------
function SecurityTab() {
  const providers = [{ name: 'Google', icon: '🔵', connected: false }, { name: 'Microsoft', icon: '🟦', connected: true }] as const

  return (
    <div className="space-y-8">
      <SectionCard title="Connected accounts" description="OAuth providers for single sign-on.">
        <div className="space-y-0">
          {providers.map((a, i) => (
            <div key={a.name}>
              {i > 0 && <div className="h-px bg-border" />}
              <div className="flex items-center justify-between py-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{a.icon}</span>
                  <span className="font-medium text-foreground">{a.name}</span>
                </div>
                <Button variant={a.connected ? 'outline' : 'default'} size="sm" className="cursor-pointer">
                  {a.connected ? 'Disconnect' : 'Connect'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Password & 2FA" description="Protect your account with a strong password and optional two-factor authentication.">
        <Row label="Password">
          <a
            href="/auth/reset-password"
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-accent/30"
          >
            Change password
          </a>
        </Row>
        <Row label="Two-factor auth" hint="Adds an extra security layer.">
          <Button variant="outline" size="sm" className="cursor-pointer">Enable 2FA</Button>
        </Row>
      </SectionCard>

      <SectionCard title="Session" description="Sign out of Inline on this device.">
        <div className="flex items-center justify-between gap-4 py-0.5">
          <div>
            <p className="text-sm font-medium text-foreground">Sign out</p>
            <p className="mt-0.5 text-xs text-muted-foreground">You will need to sign in again to access your workspace.</p>
          </div>
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm" className="cursor-pointer gap-1.5">
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </Button>
          </form>
        </div>
      </SectionCard>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Danger zone (mirrors workspace Delete workspace tab)
// ---------------------------------------------------------------------------
function AccountDangerTab() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setEmail(localStorage.getItem('inline_profile_email') || '')
  }, [])

  async function handleDelete() {
    if (!email || confirmText !== email) return
    setDeleting(true)
    try {
      localStorage.removeItem('inline_profile_name')
      localStorage.removeItem('inline_profile_email')
      localStorage.removeItem('inline_profile_avatar')
      await new Promise(r => setTimeout(r, 600))
      router.push('/')
    } catch {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-8">
      <SectionCard title="Danger Zone" description="These actions are permanent and cannot be undone.">
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm font-medium">Deactivate account</p>
            <p className="text-xs text-muted-foreground mt-0.5">Hide your profile and pause activity until you sign back in.</p>
          </div>
          <Button size="sm" variant="outline" className="cursor-pointer border-amber-300 text-amber-600 hover:bg-amber-50">
            Deactivate
          </Button>
        </div>
        <div className="h-px bg-border" />
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm font-medium text-destructive">Delete account</p>
            <p className="text-xs text-muted-foreground mt-0.5">Permanently removes your profile and local preferences from this browser.</p>
          </div>
          <Button size="sm" variant="destructive" className="cursor-pointer" onClick={() => setShowDeleteModal(true)}>
            Delete
          </Button>
        </div>
      </SectionCard>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6 text-card-foreground"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Delete your account?</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  This action is irreversible for data stored locally in this browser.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">
                Type <strong className="font-mono text-foreground">{email || 'your email'}</strong> to confirm:
              </p>
              <Input
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder={email || 'email@example.com'}
                className="font-mono text-sm"
                autoFocus
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 cursor-pointer"
                onClick={() => {
                  setShowDeleteModal(false)
                  setConfirmText('')
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1 cursor-pointer"
                disabled={!email || confirmText !== email || deleting}
                onClick={handleDelete}
              >
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Delete account'}
              </Button>
            </div>
          </div>
        </div>
      )}
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
    <div className="space-y-8">
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
    <div className="space-y-8">
      <SectionCard title="Notifications" description="Choose how Inline communicates with you.">
        {rows.map((r, i) => (
          <Fragment key={r.key}>
            {i > 0 && <div className="h-px bg-border" />}
            <ToggleRow
              label={r.label}
              description={r.desc}
              checked={prefs[r.key]}
              onChange={() => flip(r.key)}
            />
          </Fragment>
        ))}
      </SectionCard>
    </div>
  )
}

// ---------------------------------------------------------------------------
// AI & Voice
// ---------------------------------------------------------------------------
function syncVoiceToChromeExtension(payload: {
  elevenLabsKey: string
  voiceId: string
  stability: string
  similarity: string
}) {
  const extId = process.env.NEXT_PUBLIC_CHROME_EXTENSION_ID
  if (!extId || typeof window === 'undefined') return
  const w = window as unknown as {
    chrome?: { runtime?: { sendMessage: (extensionId: string, message: unknown, responseCallback?: () => void) => void } }
  }
  try {
    w.chrome?.runtime?.sendMessage(extId, {
      type: 'INLINE_SYNC_VOICE_SETTINGS',
      payload,
    }, () => { /* optional: ignore lastError */ })
  } catch {
    /* not Chrome or extension unavailable */
  }
}

function AIVoiceTab() {
  const [openaiKey, setOpenaiKey] = useState('')
  const [elevenKey, setElevenKey] = useState('')
  const [voiceId,   setVoiceId]   = useState(DEFAULT_INLINE_VOICE_ID)
  const [saved,     setSaved]     = useState(false)
  const [pending,   start]        = useTransition()
  const [testState, setTest]      = useState<'idle' | 'playing'>('idle')
  const [autocomp,  setAutocomp]  = useState(true)
  const [voiceChat, setVoiceChat] = useState(false)
  const [screenReader, setScreenReader] = useState(false)
  const [stability, setStability] = useState(0.5)
  const [similarity, setSimilarity] = useState(0.75)

  useEffect(() => {
    setOpenaiKey(localStorage.getItem('inline_openai_key') || '')
    setElevenKey(localStorage.getItem('inline_elevenlabs_key') || '')
    const rawVoice = localStorage.getItem('inline_voice_id')
    const normVoice = normalizeInlineVoiceId(rawVoice)
    setVoiceId(normVoice)
    if (rawVoice !== normVoice) localStorage.setItem('inline_voice_id', normVoice)
    setAutocomp(localStorage.getItem('inline_autocomplete') !== 'false')
    setVoiceChat(localStorage.getItem('inline_voice_chat') === 'true')
    setScreenReader(localStorage.getItem('inline_screen_reader') === 'true')
    setStability(parseFloat(localStorage.getItem('inline_voice_stability') || '0.5'))
    setSimilarity(parseFloat(localStorage.getItem('inline_voice_similarity') || '0.75'))
  }, [])

  function handleSave() {
    start(async () => {
      const vid = normalizeInlineVoiceId(voiceId)
      setVoiceId(vid)
      localStorage.setItem('inline_openai_key', openaiKey)
      localStorage.setItem('inline_elevenlabs_key', elevenKey)
      localStorage.setItem('inline_voice_id', vid)
      localStorage.setItem('inline_autocomplete', String(autocomp))
      localStorage.setItem('inline_voice_chat', String(voiceChat))
      localStorage.setItem('inline_screen_reader', String(screenReader))
      localStorage.setItem('inline_voice_stability', String(stability))
      localStorage.setItem('inline_voice_similarity', String(similarity))
      const _chrome = (typeof window !== 'undefined' ? (window as unknown as Record<string, unknown>).chrome : undefined) as (undefined | { storage?: { local?: { set: (v: Record<string, unknown>) => void } } })
      if (_chrome?.storage?.local) {
        _chrome.storage.local.set({
          inlineOpenAIKey: openaiKey,
          inlineElevenLabsKey: elevenKey,
          inlineVoiceId: vid,
          inlineScreenReader: String(screenReader),
          inlineVoiceStability: String(stability),
          inlineVoiceSimilarity: String(similarity),
        })
      }
      syncVoiceToChromeExtension({
        elevenLabsKey: elevenKey,
        voiceId: vid,
        stability: String(stability),
        similarity: String(similarity),
      })
      await new Promise(r => setTimeout(r, 400))
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    })
  }

  async function testVoice() {
    setTest('playing')
    try {
      if (elevenKey) {
        const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'xi-api-key': elevenKey },
          body: JSON.stringify({ text: 'Hello, this is your Inline voice assistant.', model_id: 'eleven_multilingual_v2', voice_settings: { stability, similarity_boost: similarity } }),
        })
        if (resp.ok) {
          const blob = await resp.blob()
          const url = URL.createObjectURL(blob)
          const audio = new Audio(url)
          audio.play()
          audio.onended = () => { URL.revokeObjectURL(url); setTest('idle') }
        } else setTest('idle')
        return
      }

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Hello, this is your Inline voice assistant.',
          voiceId,
          stability,
          similarityBoost: similarity,
        }),
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        audio.play()
        audio.onended = () => { URL.revokeObjectURL(url); setTest('idle') }
      } else setTest('idle')
    } catch {
      setTest('idle')
    }
  }

  return (
    <div className="space-y-8">
      <SectionCard title="API keys" description="Stored locally and synced to the extension. Never sent to Inline servers. Set NEXT_PUBLIC_CHROME_EXTENSION_ID in .env.local (extension ID from chrome://extensions) so Save also pushes voice settings to the extension when the dashboard is open in Chrome." action={<SaveBadge saved={saved} />}>
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

      <SectionCard title="Voice selection" description="The voice used for AI read-aloud across the dashboard and extension (ElevenLabs only — no browser voice).">
        <div className="space-y-2">
          {INLINE_VOICE_PRESETS.map(v => (
            <button key={v.id} type="button" onClick={() => setVoiceId(v.id)}
              className={cn('w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-colors cursor-pointer',
                voiceId === v.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
              )}>
              <span className="text-left">
                <span className="font-medium text-foreground">{v.name}</span>
                <span className="block text-xs text-muted-foreground mt-0.5">
                  {v.gender === 'female' ? 'Female' : 'Male'} · {v.subtitle}
                </span>
              </span>
              {voiceId === v.id && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
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

      <SectionCard title="Voice tuning" description="Adjust voice characteristics for ElevenLabs TTS.">
        <Row label="Stability" hint="Higher = more consistent, lower = more expressive.">
          <div className="flex items-center gap-3">
            <input type="range" min="0" max="1" step="0.05" value={stability}
              onChange={e => { const v = parseFloat(e.target.value); setStability(v); localStorage.setItem('inline_voice_stability', String(v)) }}
              className="flex-1 accent-primary cursor-pointer" />
            <span className="w-8 text-right text-xs font-mono text-muted-foreground">{stability.toFixed(2)}</span>
          </div>
        </Row>
        <Row label="Similarity boost" hint="Higher = closer to original voice, lower = more variation.">
          <div className="flex items-center gap-3">
            <input type="range" min="0" max="1" step="0.05" value={similarity}
              onChange={e => { const v = parseFloat(e.target.value); setSimilarity(v); localStorage.setItem('inline_voice_similarity', String(v)) }}
              className="flex-1 accent-primary cursor-pointer" />
            <span className="w-8 text-right text-xs font-mono text-muted-foreground">{similarity.toFixed(2)}</span>
          </div>
        </Row>
      </SectionCard>

      <SectionCard title="Voice behavior">
        <ToggleRow
          label="Voice replies in chat"
          description="Automatically speak AI responses in the workspace chat panel."
          checked={voiceChat}
          onChange={v => { setVoiceChat(v); localStorage.setItem('inline_voice_chat', String(v)) }}
        />
        <ToggleRow
          label="Extension screen reader"
          description="Auto-read AI results aloud in the browser extension."
          checked={screenReader}
          onChange={v => {
            setScreenReader(v)
            localStorage.setItem('inline_screen_reader', String(v))
            const _chrome = (typeof window !== 'undefined' ? (window as unknown as Record<string, unknown>).chrome : undefined) as (undefined | { storage?: { local?: { set: (v: Record<string, unknown>) => void } } })
            if (_chrome?.storage?.local) _chrome.storage.local.set({ inlineScreenReader: String(v) })
          }}
        />
      </SectionCard>

      <SectionCard title="AI Copilot">
        <ToggleRow
          label="Context autocomplete"
          description="Ghost-text suggestions in sticky notes."
          checked={autocomp}
          onChange={v => { setAutocomp(v); localStorage.setItem('inline_autocomplete', String(v)) }}
        />
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
    <div className="space-y-8">
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
    <div className="space-y-8">
      <SectionCard title="Apps & integrations" description="Connect tools you already use.">
        <ul className="space-y-2">
          {rows.map(r => (
            <li key={r.id} className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-3 py-3">
              <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground/50" />
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                {r.abbr}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.connected ? 'Connected' : 'Not connected'}</p>
              </div>
              {r.connected ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer border-destructive/30 text-destructive hover:bg-destructive/5"
                  onClick={() => setRows(p => p.map(x => x.id === r.id ? { ...x, connected: false } : x))}
                >
                  Unbind <X className="ml-1 h-3 w-3" />
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  className="cursor-pointer gap-1"
                  onClick={() => setRows(p => p.map(x => x.id === r.id ? { ...x, connected: true } : x))}
                >
                  Connect <ArrowRight className="h-3 w-3" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
const TAB_DESCRIPTIONS: Partial<Record<Tab, string>> = {
  general: 'Your name, icon, and email.',
  security: 'Connected accounts, password, and session.',
  notifications: 'Choose how Inline communicates with you.',
  appearance: 'Theme and text size for the dashboard.',
  integrations: 'Connect tools you already use.',
  'ai-voice': 'API keys, voice, and copilot options.',
  extension: 'Blocklist and extension preferences.',
  danger: 'Permanently delete your account and local data.',
}

function PersonalSettingsPageInner() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<Tab>('general')

  useEffect(() => {
    const t = searchParams.get('tab')
    if (t && PROFILE_TABS.some(x => x.id === t)) setActiveTab(t as Tab)
  }, [searchParams])

  const content: Record<Tab, React.ReactNode> = {
    general:       <GeneralTab />,
    security:      <SecurityTab />,
    appearance:    <AppearanceTab />,
    notifications: <NotificationsTab />,
    'ai-voice':    <AIVoiceTab />,
    extension:     <ExtensionTab />,
    integrations:  <IntegrationsTab />,
    danger:        <AccountDangerTab />,
  }

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Account', href: '/app/dashboard' }, { label: 'Settings' }]}
      />

      <div className="px-6 pb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground mt-4">
          Account Settings
        </h1>

        <nav
          className="mt-6 flex gap-1 overflow-x-auto scrollbar-minimal border-b border-border -mb-px pb-px"
          aria-label="Account settings sections"
        >
          {PROFILE_TABS.map(tab => {
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
            {PROFILE_TABS.find(t => t.id === activeTab)?.label}
          </h2>
          {TAB_DESCRIPTIONS[activeTab] && (
            <p className="text-sm text-muted-foreground">{TAB_DESCRIPTIONS[activeTab]}</p>
          )}
        </div>

        <div className="mt-6 w-full space-y-8">{content[activeTab]}</div>
      </div>
    </>
  )
}

export default function PersonalSettingsPage() {
  return (
    <Suspense fallback={<div className="px-6 pb-12 pt-8 text-sm text-muted-foreground">Loading settings…</div>}>
      <PersonalSettingsPageInner />
    </Suspense>
  )
}
