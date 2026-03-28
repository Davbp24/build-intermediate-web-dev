'use client'

import { motion } from 'framer-motion'
import { Anchor, RefreshCw, Map, BrainCircuit, Share2, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'

const CARDS = [
  {
    title: 'DOM Anchoring',
    description: 'Notes attach to exact DOM elements using XPath heuristics — they survive page refreshes, layout shifts, and re-renders.',
    icon: Anchor,
    className: 'row-span-2 col-span-1',
    accent: 'text-primary',
    visual: 'anchor' as const,
    surface: 'solid' as const,
  },
  {
    title: 'Local-First Persistence',
    description: 'IndexedDB keeps every annotation instant and offline-ready. Cloud sync happens in the background.',
    icon: RefreshCw,
    className: 'col-span-1',
    accent: 'text-emerald-600',
    visual: 'none' as const,
    surface: 'dashed' as const,
  },
  {
    title: 'Spatial Map View',
    description: 'Every geo-tagged note plotted on a live map. See your research at city scale.',
    icon: Map,
    className: 'col-span-2',
    accent: 'text-sky-600',
    visual: 'map' as const,
    surface: 'solid' as const,
  },
  {
    title: 'AI Summaries',
    description: 'Highlight any text and get an instant AI-generated summary or explanation, anchored to the exact paragraph.',
    icon: BrainCircuit,
    className: 'col-span-1',
    accent: 'text-violet-600',
    visual: 'none' as const,
    surface: 'dashed' as const,
  },
  {
    title: 'Knowledge Graph',
    description: 'A force-directed graph reveals connections between notes across domains, tags, and topics.',
    icon: Share2,
    className: 'col-span-1',
    accent: 'text-pink-600',
    visual: 'none' as const,
    surface: 'solid' as const,
  },
  {
    title: 'Shadow DOM Isolation',
    description: 'All injected UI is encapsulated in a Shadow DOM, so your notes never bleed into or inherit styles from host pages.',
    icon: Layers,
    className: 'col-span-1',
    accent: 'text-amber-600',
    visual: 'none' as const,
    surface: 'dashed' as const,
  },
]

function AnchorVisual() {
  return (
    <div className="mt-4 relative h-32 rounded-2xl bg-slate-50 overflow-hidden border border-slate-200">
      <div className="absolute inset-0 p-3 space-y-2 opacity-50">
        <div className="h-2 w-3/4 bg-slate-300 rounded" />
        <div className="h-2 w-full bg-slate-200 rounded" />
        <div className="h-2 w-2/3 bg-slate-200 rounded" />
      </div>
      <div className="absolute top-2 right-2 w-28 bg-amber-100 rounded-lg border border-slate-200 p-2 rotate-1">
        <p className="text-slate-800 text-[9px] leading-tight font-medium">
          Check this implementation →
        </p>
      </div>
      <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <div className="h-px w-16 bg-primary/40" />
        <div className="w-1.5 h-1.5 rounded-sm bg-primary/70" />
      </div>
    </div>
  )
}

function MapVisual() {
  const dots = [
    { x: 15, y: 40 }, { x: 30, y: 25 }, { x: 55, y: 60 },
    { x: 70, y: 35 }, { x: 85, y: 55 }, { x: 45, y: 75 },
  ]
  return (
    <div className="mt-4 relative h-20 rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden">
      <svg className="absolute inset-0 w-full h-full opacity-25" viewBox="0 0 100 80">
        <path d="M0 40 Q25 20 50 40 Q75 60 100 40" stroke="#64748b" strokeWidth="0.5" fill="none" />
        <path d="M0 55 Q30 35 60 55 Q80 65 100 55" stroke="#64748b" strokeWidth="0.5" fill="none" />
      </svg>
      {dots.map((dot, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-primary border border-slate-200"
          style={{ left: `${dot.x}%`, top: `${dot.y}%`, transform: 'translate(-50%,-50%)' }}
        />
      ))}
    </div>
  )
}

export default function BentoGrid() {
  return (
    <section id="how-it-works" className="py-24 px-6 bg-slate-50 border-t border-slate-200">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
            How it works
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4">
            Built for how researchers think
          </h2>
          <p className="text-slate-600 max-w-xl mx-auto">
            Six capabilities working together to make the entire web your second brain.
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
                  'group relative rounded-3xl p-6 overflow-hidden transition-colors duration-300',
                  isSolid
                    ? 'bg-white border border-slate-200 hover:border-slate-300'
                    : 'bg-transparent border-2 border-dashed border-slate-300 hover:border-slate-400',
                  card.className,
                )}
              >
                <div
                  className={cn(
                    'w-9 h-9 rounded-md border border-slate-200 bg-white flex items-center justify-center mb-4',
                    card.accent,
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">{card.title}</h3>
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
