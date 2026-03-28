'use client'

import { Sheet, SheetContent } from '@/components/ui/sheet'
import { ExternalLink, Clock, Globe, Tag, MapPin, FileText, PenTool, BrainCircuit, X } from 'lucide-react'
import type { Note, NoteType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { formatDistanceToNow, format } from 'date-fns'

const TYPE_META: Record<NoteType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  text:        { label: 'Text Note',   icon: FileText,     color: '#6C91C2', bg: '#DCE6F4' },
  canvas:      { label: 'Drawing',     icon: PenTool,      color: '#a855f7', bg: '#f3e8ff' },
  'ai-summary':{ label: 'AI Summary',  icon: BrainCircuit, color: '#5FA8A1', bg: '#E6F4F2' },
}

interface MetaRowProps {
  icon:     React.ElementType
  label:    string
  children: React.ReactNode
}

function MetaRow({ icon: Icon, label, children }: MetaRowProps) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-0.5">{label}</p>
        <div className="text-[13px] text-foreground leading-relaxed">{children}</div>
      </div>
    </div>
  )
}

interface NoteDetailSheetProps {
  note:    Note | null
  onClose: () => void
}

export default function NoteDetailSheet({ note, onClose }: NoteDetailSheetProps) {
  const meta = note ? (TYPE_META[note.type] ?? TYPE_META.text) : TYPE_META.text

  return (
    <Sheet open={!!note} onOpenChange={open => !open && onClose()}>
      <SheetContent className="w-[420px] sm:max-w-[420px] p-0 overflow-hidden flex flex-col gap-0">
        {note && (
          <>
            {/* ── Frosted header ── */}
            <div className="shrink-0 px-5 py-4 border-b border-border bg-background/80 backdrop-blur-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Type icon badge */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: meta.bg }}
                  >
                    <meta.icon className="w-5 h-5" style={{ color: meta.color }} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ color: meta.color, backgroundColor: meta.bg }}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-[13px] font-semibold text-foreground truncate leading-tight">
                      {note.domain}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* URL */}
              <a
                href={note.pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center gap-1.5 text-[11px] text-primary hover:text-primary/80 transition-colors truncate cursor-pointer group"
              >
                <Globe className="w-3 h-3 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="truncate">{note.pageUrl.length > 64 ? note.pageUrl.slice(0, 64) + '…' : note.pageUrl}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto px-5 pb-6 scrollbar-minimal">

              {/* Note content preview */}
              <div className="mt-4 mb-2">
                <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">Content</p>
                <div
                  className="rounded-xl px-4 py-3 text-[13px] leading-relaxed font-medium text-zinc-800 min-h-[72px] border border-transparent"
                  style={{ backgroundColor: note.color ?? '#fef9c3' }}
                >
                  {note.content || <span className="text-muted-foreground italic">No content</span>}
                </div>
              </div>

              {/* Page context blockquote */}
              {note.pageContext && (
                <div className="mt-4 mb-1">
                  <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">Selected Text</p>
                  <blockquote className="border-l-[3px] border-primary/40 pl-3 text-[12.5px] text-muted-foreground leading-relaxed italic bg-muted/30 rounded-r-lg py-2 pr-3">
                    {note.pageContext}
                  </blockquote>
                </div>
              )}

              {/* Divider */}
              <div className="h-px bg-border my-4" />

              {/* Structured metadata — macOS inspector style */}
              <div className="divide-y divide-border/50">
                <MetaRow icon={Globe} label="Page Title">
                  <span className="font-medium">{note.pageTitle}</span>
                </MetaRow>

                <MetaRow icon={Clock} label="Captured">
                  <span className="font-medium">{format(new Date(note.createdAt), 'MMM d, yyyy · h:mm a')}</span>
                  <span className="text-muted-foreground text-xs ml-2">
                    {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                  </span>
                </MetaRow>

                {note.tags.length > 0 && (
                  <MetaRow icon={Tag} label="Tags">
                    <div className="flex flex-wrap gap-1.5 mt-0.5">
                      {note.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-[11px] font-semibold"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </MetaRow>
                )}

                {(note.lat !== undefined && note.lng !== undefined) && (
                  <MetaRow icon={MapPin} label="Geo-coordinates">
                    <span className="font-mono text-[12px]">{note.lat.toFixed(5)}, {note.lng.toFixed(5)}</span>
                  </MetaRow>
                )}
              </div>

              {/* Note type chip */}
              <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-[10.5px] text-muted-foreground">Note ID</span>
                <span className="font-mono text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-md">{note.id.slice(0, 8)}…</span>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
