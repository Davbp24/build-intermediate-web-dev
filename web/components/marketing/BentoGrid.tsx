'use client'

import { motion } from 'framer-motion'
import { StickyNote, RefreshCw, MapPin, Sparkles, Share2, Users, Highlighter } from 'lucide-react'
import { cn } from '@/lib/utils'

const CARDS = [
  {
    title: 'Sticky Notes on Any Page',
    description: 'Leave notes directly on websites — product pages, articles, competitor sites. They stay exactly where you put them, even after the page updates.',
    icon: StickyNote,
    className: 'row-span-2 col-span-1',
    accent: 'text-[#37352F]',
    iconBg: 'bg-[#F1F1EF] border-[#E3E2DE]',
    visual: 'anchor' as const,
    surface: 'solid' as const,
  },
  {
    title: 'Works Offline, Syncs Later',
    description: 'Your notes are saved locally first, so they load instantly. Sync to the cloud happens quietly in the background.',
    icon: RefreshCw,
    className: 'col-span-1',
    accent: 'text-emerald-600',
    iconBg: 'bg-emerald-50 border-emerald-200',
    visual: 'none' as const,
    surface: 'dashed' as const,
  },
  {
    title: 'Highlight & Annotate',
    description: 'Select any text on any page and mark it up with color-coded highlights. Add context so you remember why it mattered.',
    icon: Highlighter,
    className: 'col-span-1',
    accent: 'text-orange-600',
    iconBg: 'bg-orange-50 border-orange-200',
    visual: 'none' as const,
    surface: 'solid' as const,
  },
  {
    title: 'See Everything on a Map',
    description: 'Notes about places — restaurants, apartments, travel spots — show up on a live map so you can see your research at a glance.',
    icon: MapPin,
    className: 'col-span-2',
    accent: 'text-amber-600',
    iconBg: 'bg-amber-50 border-amber-200',
    visual: 'map' as const,
    surface: 'solid' as const,
  },
  {
    title: 'AI That Reads for You',
    description: 'Highlight any paragraph and get a plain-English summary instantly. Great for long articles, terms of service, or dense reports.',
    icon: Sparkles,
    className: 'col-span-1',
    accent: 'text-violet-600',
    iconBg: 'bg-violet-50 border-violet-200',
    visual: 'none' as const,
    surface: 'dashed' as const,
  },
  {
    title: 'Connect the Dots',
    description: 'A visual map of how your notes relate — across websites, topics, and tags. Patterns emerge that you would have missed.',
    icon: Share2,
    className: 'col-span-1',
    accent: 'text-rose-600',
    iconBg: 'bg-rose-50 border-rose-200',
    visual: 'none' as const,
    surface: 'solid' as const,
  },
  {
    title: 'Built for Teams',
    description: 'Share workspaces with your team. Everyone sees the same notes on the same pages — perfect for reviews, QA, and research.',
    icon: Users,
    className: 'col-span-1',
    accent: 'text-sky-600',
    iconBg: 'bg-sky-50 border-sky-200',
    visual: 'none' as const,
    surface: 'dashed' as const,
  },
]

function AnchorVisual() {
  return (
    <div className="mt-4 relative rounded-lg bg-white border-2 border-slate-200 overflow-hidden p-3 space-y-2">
      <div className="h-2 w-3/4 bg-slate-200 rounded" />
      <div className="h-2 w-full bg-slate-100 rounded" />
      <div className="flex items-center gap-2 mt-1">
        <div className="h-2 w-1/3 bg-amber-300 rounded" />
        <div className="h-px w-8 border-t-2 border-dashed border-[#8EB4DC]" />
        <div className="bg-[#F1F1EF] border-2 border-[#8EB4DC] rounded px-2 py-1">
          <p className="text-[8px] text-[#37352F] font-medium leading-tight">Check this →</p>
        </div>
      </div>
      <div className="h-2 w-2/3 bg-slate-100 rounded" />
    </div>
  )
}

function MapVisual() {
  const dots = [
    { x: 15, y: 40 }, { x: 30, y: 25 }, { x: 55, y: 60 },
    { x: 70, y: 35 }, { x: 85, y: 55 }, { x: 45, y: 75 },
  ]
  return (
    <div className="mt-4 relative h-20 rounded-lg bg-white border-2 border-slate-200 overflow-hidden">
      <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 80">
        <path d="M0 40 Q25 20 50 40 Q75 60 100 40" stroke="#64748b" strokeWidth="0.5" fill="none" />
        <path d="M0 55 Q30 35 60 55 Q80 65 100 55" stroke="#64748b" strokeWidth="0.5" fill="none" />
      </svg>
      {dots.map((dot, i) => (
        <div
          key={i}
          className="absolute w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-amber-600"
          style={{ left: `${dot.x}%`, top: `${dot.y}%`, transform: 'translate(-50%,-50%)' }}
        />
      ))}
    </div>
  )
}

export default function BentoGrid() {
  return (
    <section id="how-it-works" className="py-24 px-6 bg-[#FFF7F0] border-t-2 border-[#F5D6BC]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-widest text-[#C4845C] mb-3">
            How it works
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4">
            Seven tools, one extension
          </h2>
          <p className="text-slate-600 max-w-xl mx-auto">
            Everything you need to capture, organize, and share what you find on the web — whether you work solo or with a team.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CARDS.map((card, i) => {
            const Icon = card.icon
            const isSolid = card.surface === 'solid'
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className={cn(
                  'group relative rounded-xl p-6 overflow-hidden transition-colors duration-200',
                  isSolid
                    ? 'bg-white border-2 border-[#E8D5C4] hover:border-[#D4B89A]'
                    : 'bg-white/50 border-2 border-dashed border-[#DCC4AE] hover:border-[#C4A68A]',
                  card.className,
                )}
              >
                <div
                  className={cn(
                    'w-9 h-9 rounded-lg border flex items-center justify-center mb-4',
                    card.iconBg,
                    card.accent,
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">{card.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{card.description}</p>

                {card.visual === 'anchor' && <AnchorVisual />}
                {card.visual === 'map' && <MapVisual />}
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
