import type { Note } from '@/lib/types'
import Link from 'next/link'
import { collaboratorIndexForId } from '@/lib/dashboard-mock-avatars'
import {
  FileText, PenTool, BrainCircuit, Code2, Home, CreditCard,
  Layers, Zap, Newspaper, Globe,
} from 'lucide-react'

interface FavoritesRowProps { items: Note[] }

// ── Icon config per domain / type ─────────────────────────────────────────────
type IconCfg = { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }

const DOMAIN_ICON: Record<string, IconCfg> = {
  'github.com':                 { icon: Code2,        color: '#57534e', bg: '#E7E5E4' },
  'zillow.com':                 { icon: Home,         color: '#0f766e', bg: '#E6F4F2' },
  'stripe.com':                 { icon: CreditCard,   color: '#7c3aed', bg: '#EDE9FE' },
  'linear.app':                 { icon: Layers,       color: '#57534e', bg: '#E7E5E4' },
  'vercel.com':                 { icon: Zap,          color: '#1C1E26', bg: '#F1F1EF' },
  'news.ycombinator.com':       { icon: Newspaper,    color: '#CB912F', bg: '#FDECC8' },
}

const TYPE_ICON: Record<string, IconCfg> = {
  'text':       { icon: FileText,     color: '#57534e', bg: '#E7E5E4' },
  'canvas':     { icon: PenTool,      color: '#7c3aed', bg: '#EDE9FE' },
  'ai-summary': { icon: BrainCircuit, color: '#0f766e', bg: '#E6F4F2' },
}

function getIconCfg(note: Note): IconCfg {
  return DOMAIN_ICON[note.domain]
    ?? TYPE_ICON[note.type]
    ?? { icon: Globe, color: '#787774', bg: '#F1F1EF' }
}

// ── Mock user data seeded from note id ────────────────────────────────────────
const MOCK_USERS = [
  { name: 'Wonpil',  avatar: 'W', color: '#D9730D' },
  { name: 'Young K', avatar: 'Y', color: '#9065B0' },
  { name: 'Dowoon',  avatar: 'D', color: '#57534e' },
  { name: 'Park S',  avatar: 'P', color: '#0F7B6C' },
  { name: 'Jae W',   avatar: 'J', color: '#C4554D' },
  { name: 'Brian L', avatar: 'B', color: '#CB912F' },
]

function mockUser(noteId: string) {
  return MOCK_USERS[collaboratorIndexForId(noteId, MOCK_USERS.length)]
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`
  const months = Math.floor(days / 30)
  return `${months} ${months === 1 ? 'month' : 'months'} ago`
}

// ── Card ──────────────────────────────────────────────────────────────────────
function FavoriteCard({ note }: { note: Note }) {
  const cfg  = getIconCfg(note)
  const Icon = cfg.icon
  const user = mockUser(note.id)
  const time = relativeTime(note.updatedAt)

  return (
    <Link
      href={`/app/history?q=${note.id}`}
      className="group flex-shrink-0 w-[240px] rounded-2xl bg-white border border-gray-100 overflow-hidden flex flex-col hover:border-primary/30 transition-colors cursor-pointer"
    >
      {/* Icon area — soft complementary background */}
      <div
        className="flex items-center justify-center h-[136px]"
        style={{ backgroundColor: cfg.bg }}
      >
        <div
          className="w-[64px] h-[64px] rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: cfg.color }}
        >
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>

      {/* Info area */}
      <div className="px-4 py-3 flex flex-col gap-1.5">
        <p className="text-[13px] font-semibold text-gray-900 leading-snug line-clamp-2">
          {note.pageTitle}
        </p>
        <div className="flex items-center gap-1.5">
          <span
            className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
            style={{ backgroundColor: user.color }}
          >
            {user.avatar}
          </span>
          <span className="text-[11px] text-gray-400 truncate">
            {user.name} · {time}
          </span>
        </div>
      </div>
    </Link>
  )
}

// ── Row ───────────────────────────────────────────────────────────────────────
export default function FavoritesRow({ items }: FavoritesRowProps) {
  if (!items.length) return null

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-minimal">
      {items.map(note => (
        <FavoriteCard key={note.id} note={note} />
      ))}
    </div>
  )
}
