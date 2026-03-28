/**
 * Data access layer for the dashboard.
 *
 * All public functions accept an optional `workspaceId` parameter.
 * When provided, queries are scoped to that workspace via workspace_id = ?.
 * Falls back to MOCK_* data when NEXT_PUBLIC_SUPABASE_URL is not configured.
 */
import type { Note, DashboardStats, GraphData, MapCoordinate } from './types'
import type { Database } from './supabase/types'
import {
  MOCK_NOTES,
  MOCK_DASHBOARD_STATS,
  MOCK_GRAPH_DATA,
  MOCK_MAP_COORDINATES,
} from './mock-data'

export const HAS_SUPABASE = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------
export async function fetchNotes(workspaceId?: string): Promise<Note[]> {
  if (!HAS_SUPABASE) return MOCK_NOTES

  const { createClient } = await import('./supabase/server')
  const supabase = await createClient()

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const sb = supabase as any
  let query = sb.from('notes').select('*').order('created_at', { ascending: false })
  if (workspaceId) query = query.eq('workspace_id', workspaceId)
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const result = await query
  if (result.error || !result.data) return MOCK_NOTES

  type NoteRow = Database['public']['Tables']['notes']['Row']
  const data = result.data as NoteRow[]

  return data.map(n => ({
    id:          n.id,
    pageUrl:     n.page_url,
    domain:      n.domain,
    pageTitle:   n.page_title ?? '',
    pageContext: n.page_context ?? '',
    content:     n.content,
    type:        n.type as Note['type'],
    color:       n.color,
    x:           n.pos_x,
    y:           n.pos_y,
    width:       n.width,
    height:      n.height,
    tags:        n.tags,
    is_pinned:   n.is_pinned,
    lat:         n.lat ?? undefined,
    lng:         n.lng ?? undefined,
    createdAt:   n.created_at,
    updatedAt:   n.updated_at,
  }))
}

// ---------------------------------------------------------------------------
// Dashboard Stats (workspace-scoped)
// ---------------------------------------------------------------------------
export async function fetchDashboardStats(workspaceId?: string): Promise<DashboardStats> {
  if (!HAS_SUPABASE) return MOCK_DASHBOARD_STATS

  const { createClient } = await import('./supabase/server')
  const supabase = await createClient()

  const now      = new Date()
  const week     = new Date(now); week.setDate(now.getDate() - 7)
  const prevWeek = new Date(now); prevWeek.setDate(now.getDate() - 14)

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const sb = supabase as any
  // Scoped query helper
  const base = () => workspaceId
    ? sb.from('notes').eq('workspace_id', workspaceId)
    : sb.from('notes')
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const [
    { count: totalNotes },
    { count: notesThisWeek },
    { count: notesPrevWeek },
    { data: domainRowsRaw },
    { count: aiCount },
  ] = await Promise.all([
    base().select('*', { count: 'exact', head: true }),
    base().select('*', { count: 'exact', head: true }).gte('created_at', week.toISOString()),
    base().select('*', { count: 'exact', head: true })
      .gte('created_at', prevWeek.toISOString())
      .lt('created_at', week.toISOString()),
    base().select('domain, created_at'),
    sb.from('extractions').select('*', { count: 'exact', head: true }).eq('schema_type', 'ai-summary'),
  ])

  const domainRows = (domainRowsRaw ?? []) as { domain: string; created_at: string }[]

  // Domain frequency map
  const domainMap: Record<string, number> = {}
  for (const row of domainRows) {
    domainMap[row.domain] = (domainMap[row.domain] ?? 0) + 1
  }
  const total = Object.values(domainMap).reduce((a, b) => a + b, 0) || 1
  const topDomains = Object.entries(domainMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 7)
    .map(([domain, count]) => ({
      domain,
      count,
      percentage: Math.round((count / total) * 100),
      lastVisited: new Date().toISOString(),
    }))

  // 30-day capture history
  const captureHistory = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (29 - i))
    const dateStr = d.toISOString().split('T')[0]
    const count = domainRows.filter(r => r.created_at.startsWith(dateStr)).length
    return { date: dateStr, count }
  })

  // Week-over-week delta (percentage)
  const thisWeekCount = notesThisWeek ?? 0
  const prevWeekCount = notesPrevWeek ?? 0
  const notesThisWeekDelta = prevWeekCount === 0
    ? 0
    : Math.round(((thisWeekCount - prevWeekCount) / prevWeekCount) * 100)

  // Streak: count consecutive days with at least one capture (from today backwards)
  let streakDays = 0
  for (let i = captureHistory.length - 1; i >= 0; i--) {
    if (captureHistory[i].count > 0) streakDays++
    else break
  }

  return {
    notesThisWeek:      thisWeekCount,
    notesThisWeekDelta,
    totalNotes:         totalNotes ?? 0,
    totalDomains:       Object.keys(domainMap).length,
    aiQueriesRun:       aiCount ?? 0,
    streakDays,
    captureHistory,
    topDomains,
  }
}

// ---------------------------------------------------------------------------
// Map coordinates (workspace-scoped via note join)
// ---------------------------------------------------------------------------
export async function fetchMapCoordinates(workspaceId?: string): Promise<MapCoordinate[]> {
  if (!HAS_SUPABASE) return MOCK_MAP_COORDINATES

  const { createClient } = await import('./supabase/server')
  const supabase = await createClient()

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const sb = supabase as any
  let q = sb.from('notes').select('id, domain, type, content, lat, lng').not('lat', 'is', null).not('lng', 'is', null)
  if (workspaceId) q = q.eq('workspace_id', workspaceId)
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const { data: notesWithGeo } = await q

  if (notesWithGeo && notesWithGeo.length > 0) {
    return (notesWithGeo as { id: string; domain: string; type: string; content: string; lat: number; lng: number }[])
      .map(n => ({
        id:     n.id,
        lat:    n.lat,
        lng:    n.lng,
        noteId: n.id,
        type:   n.type as MapCoordinate['type'],
        label:  n.content.slice(0, 80),
        domain: n.domain,
        color:  n.type === 'canvas' ? '#a855f7' : n.type === 'ai-summary' ? '#5FA8A1' : '#6C91C2',
      }))
  }

  // Fallback to spatial_entities table
  const { data: seRows } = await supabase
    .from('spatial_entities')
    .select('id, note_id, raw_address, lat, lng')

  if (!seRows) return MOCK_MAP_COORDINATES

  return (seRows as { id: string; note_id: string | null; raw_address: string; lat: number; lng: number }[])
    .map(se => ({
      id:     se.id,
      lat:    se.lat,
      lng:    se.lng,
      noteId: se.note_id ?? '',
      type:   'text' as const,
      label:  se.raw_address,
      domain: '',
      color:  '#6C91C2',
    }))
}

// ---------------------------------------------------------------------------
// Graph data (workspace-scoped)
// ---------------------------------------------------------------------------
export async function fetchGraphData(workspaceId?: string): Promise<GraphData> {
  if (!HAS_SUPABASE) return MOCK_GRAPH_DATA

  const notes = await fetchNotes(workspaceId)

  const domainMap: Record<string, number> = {}
  for (const n of notes) {
    domainMap[n.domain] = (domainMap[n.domain] ?? 0) + 1
  }

  const domainNodes = Object.entries(domainMap).map(([domain, count]) => ({
    id: `url-${domain}`, label: domain, type: 'url' as const,
    domain, size: Math.min(count * 2 + 8, 28), color: '#6C91C2',
  }))

  const tagMap: Record<string, number> = {}
  for (const n of notes) {
    for (const tag of n.tags) {
      tagMap[tag] = (tagMap[tag] ?? 0) + 1
    }
  }
  const tagNodes = Object.entries(tagMap).slice(0, 20).map(([tag, count]) => ({
    id: `tag-${tag}`, label: `#${tag}`, type: 'tag' as const,
    size: Math.min(count + 4, 14), color: '#5FA8A1',
  }))

  const noteNodes = notes.slice(0, 30).map(n => ({
    id: n.id, label: n.content.slice(0, 32) + '…',
    type: 'note' as const, domain: n.domain, size: 5, color: n.color,
  }))

  const nodeIdSet = new Set([
    ...domainNodes.map(n => n.id),
    ...tagNodes.map(n => n.id),
    ...noteNodes.map(n => n.id),
  ])

  const links = [
    ...notes.slice(0, 30).map(n => ({
      source: n.id, target: `url-${n.domain}`, strength: 1 as const,
    })),
    ...notes.slice(0, 30).flatMap(n =>
      n.tags.slice(0, 3).map(tag => ({
        source: n.id, target: `tag-${tag}`, strength: 0.5 as const,
      })),
    ),
  ].filter(l => nodeIdSet.has(l.source) && nodeIdSet.has(l.target))

  return { nodes: [...domainNodes, ...tagNodes, ...noteNodes], links }
}

// ---------------------------------------------------------------------------
// Workspace-scoped analytics: daily captures for a rolling N-day window
// ---------------------------------------------------------------------------
export async function fetchCaptureTimeSeries(
  workspaceId?: string,
  days = 30,
): Promise<{ date: string; count: number; ai: number }[]> {
  if (!HAS_SUPABASE) {
    // Generate plausible-looking mock data
    const now = new Date()
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(now)
      d.setDate(d.getDate() - (days - 1 - i))
      return {
        date:  d.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 12),
        ai:    Math.floor(Math.random() * 4),
      }
    })
  }

  const { createClient } = await import('./supabase/server')
  const supabase = await createClient()

  const since = new Date()
  since.setDate(since.getDate() - (days - 1))

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const sb = supabase as any
  let q = sb.from('notes').select('created_at, type').gte('created_at', since.toISOString())
  if (workspaceId) q = q.eq('workspace_id', workspaceId)
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const { data } = await q

  const now = new Date()
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (days - 1 - i))
    const dateStr = d.toISOString().split('T')[0]
    type Row = { created_at: string; type: string }
    const dayRows = ((data ?? []) as Row[]).filter(r => r.created_at.startsWith(dateStr))
    return {
      date:  dateStr,
      count: dayRows.length,
      ai:    dayRows.filter(r => r.type === 'ai-summary').length,
    }
  })
}

// ---------------------------------------------------------------------------
// Note detail (history page)
// ---------------------------------------------------------------------------
export async function fetchNoteById(noteId: string, workspaceId?: string): Promise<Note | null> {
  if (!HAS_SUPABASE) return MOCK_NOTES.find(n => n.id === noteId) ?? null

  const { createClient } = await import('./supabase/server')
  const supabase = await createClient()

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const sb = supabase as any
  let q = sb.from('notes').select('*').eq('id', noteId)
  if (workspaceId) q = q.eq('workspace_id', workspaceId)
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const { data, error } = await q.single()
  if (error || !data) return null

  type NoteRow = Database['public']['Tables']['notes']['Row']
  const n = data as NoteRow
  return {
    id:          n.id,
    pageUrl:     n.page_url,
    domain:      n.domain,
    pageTitle:   n.page_title ?? '',
    pageContext: n.page_context ?? '',
    content:     n.content,
    type:        n.type as Note['type'],
    color:       n.color,
    x:           n.pos_x,
    y:           n.pos_y,
    width:       n.width,
    height:      n.height,
    tags:        n.tags,
    is_pinned:   n.is_pinned,
    lat:         n.lat ?? undefined,
    lng:         n.lng ?? undefined,
    createdAt:   n.created_at,
    updatedAt:   n.updated_at,
  }
}

export interface Extraction {
  id:         string
  schemaType: string
  domain:     string
  pageUrl:    string
  data:       unknown
  createdAt:  string
}

export async function fetchExtractionsForNote(noteId: string): Promise<Extraction[]> {
  if (!HAS_SUPABASE) return []

  const { createClient } = await import('./supabase/server')
  const supabase = await createClient()

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const sb = supabase as any
  const { data, error } = await sb
    .from('extractions')
    .select('*')
    .eq('note_id', noteId)
    .order('created_at', { ascending: false })
  /* eslint-enable @typescript-eslint/no-explicit-any */

  if (error || !data) return []

  type ExRow = { id: string; schema_type: string; domain: string; page_url: string; data: unknown; created_at: string }
  return (data as ExRow[]).map(e => ({
    id:         e.id,
    schemaType: e.schema_type,
    domain:     e.domain,
    pageUrl:    e.page_url,
    data:       e.data,
    createdAt:  e.created_at,
  }))
}
