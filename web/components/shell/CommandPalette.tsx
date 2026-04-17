'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  LayoutDashboard, Clock, Map, Share2, Settings,
  ExternalLink, Search, Zap, FileText,
} from 'lucide-react'
import { MOCK_NOTES } from '@/lib/mock-data'
import { prettyNotePreviewTruncated } from '@/lib/note-preview'

const NAV_COMMANDS = [
  { label: 'Dashboard',       icon: LayoutDashboard, href: '/app/dashboard', shortcut: 'G D' },
  { label: 'History',         icon: Clock,           href: '/app/history',   shortcut: 'G H' },
  { label: 'Map View',        icon: Map,             href: '/app/map',       shortcut: 'G M' },
  { label: 'Knowledge Graph', icon: Share2,          href: '/app/graph',     shortcut: 'G G' },
  { label: 'Settings',        icon: Settings,        href: '/app/settings',  shortcut: ''    },
]

const ACTION_COMMANDS = [
  { label: 'Open Extension', icon: ExternalLink, href: '#',            shortcut: '' },
  { label: 'View Changelog', icon: Zap,          href: '#',            shortcut: '' },
]

export default function CommandPalette() {
  const [open,  setOpen]  = useState(false)
  const [query, setQuery] = useState('')
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(o => !o)
      }
      // Also open on "/" key when not in an input
      if (e.key === '/' && !['INPUT','TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault()
        setOpen(true)
      }
    }
    const openFromSidebar = () => setOpen(true)
    document.addEventListener('keydown', down)
    window.addEventListener('inline-open-cmd', openFromSidebar)
    return () => {
      document.removeEventListener('keydown', down)
      window.removeEventListener('inline-open-cmd', openFromSidebar)
    }
  }, [])

  const run = useCallback(
    (href: string) => {
      setOpen(false)
      setQuery('')
      if (href && href !== '#') router.push(href)
    },
    [router],
  )

  // Filter note results when query >= 2 chars
  const noteResults = useMemo(() => {
    if (query.length < 2) return []
    const q = query.toLowerCase()
    return MOCK_NOTES.filter(
      n =>
        n.content.toLowerCase().includes(q) ||
        n.pageTitle.toLowerCase().includes(q) ||
        n.domain.toLowerCase().includes(q),
    ).slice(0, 5)
  }, [query])

  const showNotes = noteResults.length > 0

  return (
    <CommandDialog open={open} onOpenChange={v => { setOpen(v); if (!v) setQuery('') }}>
      <Command className="rounded-xl border-border" shouldFilter={false}>
        <CommandInput
          placeholder="Search notes or type a command…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {/* Note search results */}
          {showNotes && (
            <>
              <CommandGroup heading="Notes">
                {noteResults.map(note => (
                  <CommandItem
                    key={note.id}
                    onSelect={() => run(`/app/history?q=${note.id}`)}
                    className="flex flex-col items-start gap-0.5 py-2"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <FileText className="w-4 h-4 shrink-0 text-muted-foreground" />
                      <span className="text-sm font-medium truncate flex-1">
                        {prettyNotePreviewTruncated(note, 60)}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0 bg-muted px-1.5 py-0.5 rounded">
                        {note.domain}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground pl-6 truncate w-full">
                      {note.pageTitle}
                    </p>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {/* Navigation */}
          <CommandGroup heading="Navigation">
            {NAV_COMMANDS.map(item => {
              const Icon = item.icon
              return (
                <CommandItem key={item.label} onSelect={() => run(item.href)}>
                  <Icon className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span>{item.label}</span>
                  {item.shortcut && (
                    <kbd className="ml-auto text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                      {item.shortcut}
                    </kbd>
                  )}
                </CommandItem>
              )
            })}
          </CommandGroup>

          <CommandSeparator />

          {/* Actions */}
          <CommandGroup heading="Actions">
            {ACTION_COMMANDS.map(item => {
              const Icon = item.icon
              return (
                <CommandItem key={item.label} onSelect={() => run(item.href)}>
                  <Icon className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span>{item.label}</span>
                </CommandItem>
              )
            })}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
