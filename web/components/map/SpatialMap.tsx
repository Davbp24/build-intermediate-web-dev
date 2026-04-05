'use client'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import type { MapCoordinate } from '@/lib/types'
type GeocodeHit = { lat: number; lng: number; label: string }
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { getDomainColor } from '@/lib/map-theme'
import {
  Globe2, Map as MapIcon, Box, Eye,
  Search, X, ChevronRight, ExternalLink,
  PanelLeftClose, List, ChevronDown, MapPinPlus,
} from 'lucide-react'

const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
})

type ViewMode = '2d' | '3d' | 'globe' | 'street'

const VIEW_MODES: { id: ViewMode; label: string; icon: React.ElementType }[] = [
  { id: '2d', label: '2D', icon: MapIcon },
  { id: '3d', label: '3D', icon: Box },
  { id: 'globe', label: 'Globe', icon: Globe2 },
  { id: 'street', label: 'Street', icon: Eye },
]

const MY_PLACES_DOMAIN = 'my-places'

function getDomainGroup(coords: MapCoordinate[]): Map<string, MapCoordinate[]> {
  const groups = new Map<string, MapCoordinate[]>()
  for (const c of coords) {
    const key = c.domain
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(c)
  }
  return groups
}

function loadStoredPins(key: string): MapCoordinate[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw) as MapCoordinate[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

interface SpatialMapProps {
  coordinates: MapCoordinate[]
  /** Key for persisting user-placed pins (per workspace recommended). */
  storageKey?: string
}

export default function SpatialMap({ coordinates: serverCoordinates, storageKey = 'inline-map-pins' }: SpatialMapProps) {
  const [mounted, setMounted] = useState(false)
  const [userPins, setUserPins] = useState<MapCoordinate[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('2d')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filterQuery, setFilterQuery] = useState('')
  const [hoveredDomain, setHoveredDomain] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(true)
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({})

  const [placeQuery, setPlaceQuery] = useState('')
  const [placeHits, setPlaceHits] = useState<GeocodeHit[]>([])
  const [placeLoading, setPlaceLoading] = useState(false)
  const [draft, setDraft] = useState<{ lat: number; lng: number; label: string } | null>(null)
  const [draftNote, setDraftNote] = useState('')
  const [pickMode, setPickMode] = useState(false)
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; zoom?: number } | null>(null)

  const placeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!flyTo) return
    const t = setTimeout(() => setFlyTo(null), 700)
    return () => clearTimeout(t)
  }, [flyTo])

  useEffect(() => {
    setUserPins(loadStoredPins(storageKey))
  }, [storageKey])

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(userPins))
    } catch {
      /* ignore quota */
    }
  }, [userPins, storageKey])

  const allCoordinates = useMemo(
    () => [...serverCoordinates, ...userPins],
    [serverCoordinates, userPins],
  )

  const domainGroups = useMemo(() => getDomainGroup(allCoordinates), [allCoordinates])
  const domainList = useMemo(() => {
    const entries = [...domainGroups.entries()].sort((a, b) => b[1].length - a[1].length)
    if (!filterQuery.trim()) return entries
    const q = filterQuery.toLowerCase()
    return entries.filter(
      ([domain, items]) =>
        domain.toLowerCase().includes(q) ||
        items.some(
          i =>
            i.notePreview.toLowerCase().includes(q) ||
            i.locationLabel.toLowerCase().includes(q),
        ),
    )
  }, [domainGroups, filterQuery])

  const selectedCoord = allCoordinates.find(c => c.id === selectedId) ?? null

  const tileUrl = useMemo(() => {
    switch (viewMode) {
      case '3d':
        return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      case 'globe':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      case 'street':
        return 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'
      default:
        return 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    }
  }, [viewMode])

  const tileAttribution = useMemo(() => {
    switch (viewMode) {
      case 'globe':
        return '© Esri, Maxar, Earthstar Geographics'
      case 'street':
        return '© OpenStreetMap contributors, Humanitarian OSM'
      default:
        return '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/attributions">CARTO</a>'
    }
  }, [viewMode])

  useEffect(() => {
    if (placeTimer.current) clearTimeout(placeTimer.current)
    const q = placeQuery.trim()
    if (q.length < 2) {
      setPlaceHits([])
      setPlaceLoading(false)
      return
    }
    setPlaceLoading(true)
    placeTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`)
        if (!res.ok) {
          setPlaceHits([])
          return
        }
        const data = (await res.json()) as GeocodeHit[] | { error?: string }
        if (Array.isArray(data)) setPlaceHits(data)
        else setPlaceHits([])
      } catch {
        setPlaceHits([])
      } finally {
        setPlaceLoading(false)
      }
    }, 350)
    return () => {
      if (placeTimer.current) clearTimeout(placeTimer.current)
    }
  }, [placeQuery])

  const selectPlaceHit = useCallback((hit: GeocodeHit) => {
    setDraft({ lat: hit.lat, lng: hit.lng, label: hit.label })
    setFlyTo({ lat: hit.lat, lng: hit.lng, zoom: 12 })
    setPlaceHits([])
    setPlaceQuery('')
    setPickMode(false)
  }, [])

  const onMapClickPick = useCallback((lat: number, lng: number) => {
    if (!pickMode) return
    setDraft({ lat, lng, label: `${lat.toFixed(4)}, ${lng.toFixed(4)}` })
    setFlyTo({ lat, lng, zoom: Math.max(8, 12) })
    setPickMode(false)
  }, [pickMode])

  const saveDraftPin = useCallback(() => {
    if (!draft || !draftNote.trim()) return
    const id = `user-${Date.now()}`
    const pin: MapCoordinate = {
      id,
      lat: draft.lat,
      lng: draft.lng,
      noteId: id,
      type: 'text',
      notePreview: draftNote.trim(),
      locationLabel: draft.label.slice(0, 120),
      domain: MY_PLACES_DOMAIN,
      color: getDomainColor(MY_PLACES_DOMAIN),
    }
    setUserPins(prev => [...prev, pin])
    setSelectedId(id)
    setDraft(null)
    setDraftNote('')
    setExpandedDomains(e => ({ ...e, [MY_PLACES_DOMAIN]: true }))
  }, [draft, draftNote])

  const toggleDomainExpanded = (domain: string) => {
    setExpandedDomains(e => ({ ...e, [domain]: !e[domain] }))
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="relative h-full w-full">
        {mounted && (
          <LeafletMap
            key={storageKey}
            coordinates={allCoordinates}
            tileUrl={tileUrl}
            tileAttribution={tileAttribution}
            selectedId={selectedId}
            hoveredDomain={hoveredDomain}
            onSelectId={setSelectedId}
            mapClickEnabled={pickMode}
            onMapClick={onMapClickPick}
            flyTo={flyTo}
          />
        )}
      </div>

      <div
        className={cn(
          'absolute left-3 top-3 bottom-3 z-700 flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-[width,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          panelOpen ? 'w-80 opacity-100' : 'w-0 border-0 opacity-0 pointer-events-none',
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <p className="text-xs font-semibold text-foreground">Locations</p>
          <button
            type="button"
            onClick={() => setPanelOpen(false)}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Hide panel"
          >
            <PanelLeftClose className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="border-b border-border px-3 py-2.5">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Find a place
          </p>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={placeQuery}
              onChange={e => setPlaceQuery(e.target.value)}
              placeholder="Search address or city…"
              className="h-8 w-full rounded-full border border-border bg-background pl-8 pr-3 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-stone-400"
            />
          </div>
          {placeLoading && (
            <p className="mt-1 text-[10px] text-muted-foreground">Searching…</p>
          )}
          {placeHits.length > 0 && (
            <ul className="mt-2 max-h-36 overflow-y-auto rounded-lg border border-border bg-background">
              {placeHits.map((hit, i) => (
                <li key={`${hit.lat}-${hit.lng}-${i}`}>
                  <button
                    type="button"
                    onClick={() => selectPlaceHit(hit)}
                    className="w-full cursor-pointer border-b border-border px-2 py-1.5 text-left text-[11px] text-foreground last:border-b-0 hover:bg-muted"
                  >
                    {hit.label}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={() => {
              setPickMode(p => !p)
              setDraft(null)
              setDraftNote('')
            }}
            className={cn(
              'mt-2 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-full border py-1.5 text-[11px] font-medium transition-colors',
              pickMode
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-muted/50 text-foreground hover:bg-muted',
            )}
          >
            <MapPinPlus className="h-3.5 w-3.5" />
            {pickMode ? 'Click map to place…' : 'Drop pin on map'}
          </button>

          {draft && (
            <div className="mt-2 space-y-2 rounded-xl border border-border bg-muted/30 p-2.5">
              <p className="text-[10px] font-medium text-muted-foreground line-clamp-2">{draft.label}</p>
              <textarea
                value={draftNote}
                onChange={e => setDraftNote(e.target.value)}
                placeholder="Note for this location…"
                rows={3}
                className="w-full resize-none rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-stone-400"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveDraftPin}
                  disabled={!draftNote.trim()}
                  className="flex-1 cursor-pointer rounded-lg bg-primary py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-40"
                >
                  Save pin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraft(null)
                    setDraftNote('')
                  }}
                  className="cursor-pointer rounded-lg border border-border px-2 py-1.5 text-xs text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="border-b border-border px-3 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
              placeholder="Filter list…"
              className="h-8 w-full rounded-full border border-border bg-background pl-8 pr-8 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-stone-400"
            />
            {filterQuery && (
              <button
                type="button"
                onClick={() => setFilterQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            {allCoordinates.length} locations · {domainGroups.size} domains
          </p>
        </div>

        <div className="scrollbar-minimal flex-1 space-y-2 overflow-y-auto px-2 py-2">
          {domainList.map(([domain, items]) => {
            const color = getDomainColor(domain)
            const expanded = expandedDomains[domain] ?? true
            return (
              <div
                key={domain}
                onMouseEnter={() => setHoveredDomain(domain)}
                onMouseLeave={() => setHoveredDomain(null)}
              >
                <button
                  type="button"
                  onClick={() => toggleDomainExpanded(domain)}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-full border border-border bg-muted/40 px-2.5 py-2 text-left transition-colors hover:bg-muted/70"
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {domain.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">{domain}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {items.length} {items.length === 1 ? 'note' : 'notes'}
                    </p>
                  </div>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                      expanded ? 'rotate-180' : '',
                    )}
                  />
                </button>

                {expanded && (
                  <div className="mt-1 space-y-0.5 pl-1">
                    {items.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedId(selectedId === item.id ? null : item.id)}
                        className={cn(
                          'flex w-full cursor-pointer items-center gap-2 rounded-full border px-2.5 py-1.5 text-left transition-colors',
                          selectedId === item.id
                            ? 'border-stone-400 bg-muted'
                            : 'border-transparent hover:bg-muted/50',
                        )}
                      >
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-[11px] font-medium text-foreground">
                            {item.locationLabel}
                          </p>
                          <p className="line-clamp-1 text-[10px] text-muted-foreground">
                            {item.notePreview}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {!panelOpen && (
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          className="absolute left-3 top-3 z-700 flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-border bg-card transition-colors hover:bg-muted"
          title="Show locations"
        >
          <List className="h-4 w-4 text-foreground" />
        </button>
      )}

      <div
        className={cn(
          'absolute top-3 z-700 flex overflow-hidden rounded-xl border border-border bg-card p-0.5 transition-[left] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          panelOpen ? 'left-[332px]' : 'left-16',
        )}
      >
        {VIEW_MODES.map(v => {
          const Icon = v.icon
          const active = viewMode === v.id
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => setViewMode(v.id)}
              className={cn(
                'flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                active
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {v.label}
            </button>
          )
        })}
      </div>

      <div
        className={cn(
          'absolute bottom-4 z-700 flex flex-col gap-1.5 rounded-xl border border-border bg-card p-3 transition-[left] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          panelOpen ? 'left-[332px]' : 'left-3',
        )}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Domains
        </p>
        {[...domainGroups.entries()]
          .sort((a, b) => b[1].length - a[1].length)
          .slice(0, 6)
          .map(([domain, items]) => (
            <div
              key={domain}
              className="flex cursor-default items-center gap-2 rounded-full border border-border bg-muted/30 px-2 py-1"
              onMouseEnter={() => setHoveredDomain(domain)}
              onMouseLeave={() => setHoveredDomain(null)}
            >
              <div
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: getDomainColor(domain) }}
              />
              <span className="min-w-0 flex-1 truncate text-[11px] text-foreground">{domain}</span>
              <span className="shrink-0 text-[10px] font-medium tabular-nums text-muted-foreground">
                {items.length}
              </span>
            </div>
          ))}
        <p className="text-[9px] text-muted-foreground">Lines link same domain</p>
      </div>

      {selectedCoord && (
        <div className="absolute bottom-4 right-4 z-700 w-80 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="relative">
            <div className="h-1" style={{ backgroundColor: getDomainColor(selectedCoord.domain) }} />
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="absolute right-2 top-2.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-3 p-4">
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: getDomainColor(selectedCoord.domain) }}
              >
                {selectedCoord.domain.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1 pr-6">
                <p className="text-sm font-semibold text-foreground">{selectedCoord.domain}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{selectedCoord.locationLabel}</p>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-xs leading-relaxed text-foreground">{selectedCoord.notePreview}</p>
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="font-mono">
                {selectedCoord.lat.toFixed(4)}, {selectedCoord.lng.toFixed(4)}
              </span>
              <span className="capitalize">{selectedCoord.type.replace('-', ' ')}</span>
            </div>
            <button
              type="button"
              className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              <ExternalLink className="h-3 w-3" />
              View full note
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
