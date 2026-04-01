'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sparkles, Clock, Globe, BrainCircuit, TrendingUp, Activity, FileText, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ─── types ─── */
interface FeedItem {
  id:      string
  kind:    'note' | 'extraction'
  label:   string
  sub:     string
  type:    string
  snippet: string
  time:    string
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function getWsId(pathname: string): string {
  const m = pathname.match(/\/app\/(ws-[^/]+)/)
  return m ? m[1] : 'ws-1'
}

const KIND_ICON: Record<string, React.ElementType> = {
  note:        Globe,
  'ai-summary': BrainCircuit,
  extraction:  TrendingUp,
  highlight:   FileText,
}

export default function RightContextPanel() {
  const pathname  = usePathname()
  const wsId      = getWsId(pathname)
  const [tab, setTab] = useState<'activity' | 'insights'>('activity')

  /* ─── activity feed ─── */
  const [feed, setFeed]         = useState<FeedItem[]>([])
  const [feedLoading, setFeedLoading] = useState(false)

  const loadActivity = useCallback(async () => {
    setFeedLoading(true)
    try {
      const res = await fetch(`/api/workspace/${wsId}/activity`)
      if (res.ok) {
        const json = await res.json() as { feed: FeedItem[] }
        setFeed(json.feed ?? [])
      }
    } catch { /* ignore */ }
    finally { setFeedLoading(false) }
  }, [wsId])

  useEffect(() => { void loadActivity() }, [loadActivity])
  useEffect(() => { setTab('activity') }, [pathname])

  /* ─── insights ─── */
  const [insightText,    setInsightText]    = useState<string | null>(null)
  const [insightLoading, setInsightLoading] = useState(false)

  const loadInsights = useCallback(async () => {
    if (insightText) return
    setInsightLoading(true)
    try {
      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: wsId }),
      })
      if (res.ok) {
        const json = await res.json() as { narrative?: string }
        setInsightText(json.narrative ?? null)
      }
    } catch { /* ignore */ }
    finally { setInsightLoading(false) }
  }, [wsId, insightText])

  useEffect(() => {
    if (tab === 'insights') void loadInsights()
  }, [tab, loadInsights])

  return (
    <motion.aside
      initial={{ x: 240, opacity: 0 }}
      animate={{ x: 0,   opacity: 1 }}
      exit={{ x: 240, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 34 }}
      className="w-60 shrink-0 h-screen flex flex-col bg-white border-l border-slate-200 overflow-hidden"
    >
      {/* Header tabs */}
      <div className="h-[52px] flex items-center px-4 border-b border-slate-200 shrink-0 gap-1">
        {(['activity', 'insights'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 h-7 rounded-md text-xs font-semibold transition-colors cursor-pointer',
              tab === t
                ? 'bg-[#F1F1EF] text-[#37352F]'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100',
            )}
          >
            {t === 'activity' ? 'Activity' : 'Insights'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 scrollbar-minimal">

        {/* ── Activity tab ── */}
        {tab === 'activity' && (
          <>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-2">
              Recent Workspace Activity
            </p>
            {feedLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              </div>
            )}
            {!feedLoading && feed.length === 0 && (
              <p className="text-[11px] text-slate-300 px-1">No activity yet.</p>
            )}
            {!feedLoading && feed.map(item => {
              const Icon = KIND_ICON[item.type] ?? KIND_ICON[item.kind] ?? Activity
              const color = item.kind === 'extraction' ? '#f59e0b' : item.type === 'ai-summary' ? '#5FA8A1' : '#6C91C2'
              return (
                <div key={item.id} className="flex items-start gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: color + '22' }}>
                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-slate-700 truncate">{item.label}</p>
                    <p className="text-[10.5px] text-slate-400 truncate">{item.sub}</p>
                    {item.snippet && (
                      <p className="text-[10px] text-slate-300 truncate mt-0.5">{item.snippet}</p>
                    )}
                    <p className="text-[10px] text-slate-300 mt-0.5">{relTime(item.time)}</p>
                  </div>
                </div>
              )
            })}
          </>
        )}

        {/* ── Insights tab ── */}
        {tab === 'insights' && (
          <>
            <div className="flex items-center gap-1.5 px-1 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#37352F]" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                AI Insights
              </p>
            </div>
            {insightLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              </div>
            )}
            {!insightLoading && insightText && (
              <div className="rounded-xl border border-slate-200 bg-[#F1F1EF] p-3">
                <p className="text-[11.5px] text-slate-600 leading-relaxed">{insightText}</p>
              </div>
            )}
            {!insightLoading && !insightText && (
              <p className="text-[11px] text-slate-300 px-1">
                No AI insights available yet.
              </p>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-slate-200 shrink-0">
        <div className="flex items-center gap-1.5 text-[10.5px] text-slate-300">
          <Clock className="w-3 h-3" />
          <span>Workspace: {wsId}</span>
        </div>
      </div>
    </motion.aside>
  )
}
