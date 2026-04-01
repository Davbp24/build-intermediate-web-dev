'use server'

import type { Note } from '@/lib/types'

// ---------------------------------------------------------------------------
// Escape a CSV cell value
// ---------------------------------------------------------------------------
function csvCell(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) return ''
  const s = String(val).replace(/"/g, '""')
  return /[",\r\n]/.test(s) ? `"${s}"` : s
}

// ---------------------------------------------------------------------------
// Convert notes to a CSV string
// ---------------------------------------------------------------------------
function notesToCsv(notes: Note[]): string {
  const HEADERS = [
    'id', 'type', 'domain', 'page_title', 'page_url',
    'content', 'page_context', 'tags', 'color',
    'lat', 'lng', 'created_at', 'updated_at',
  ]

  const rows: string[] = [HEADERS.join(',')]

  for (const n of notes) {
    rows.push([
      csvCell(n.id),
      csvCell(n.type),
      csvCell(n.domain),
      csvCell(n.pageTitle),
      csvCell(n.pageUrl),
      csvCell(n.content),
      csvCell(n.pageContext),
      csvCell(n.tags.join('; ')),
      csvCell(n.color),
      csvCell(n.lat ?? ''),
      csvCell(n.lng ?? ''),
      csvCell(n.createdAt),
      csvCell(n.updatedAt),
    ].join(','))
  }

  return rows.join('\r\n')
}

// ---------------------------------------------------------------------------
// Server Action: export notes for a workspace as a CSV string
// ---------------------------------------------------------------------------
export async function exportWorkspaceNotes(workspaceId?: string): Promise<{ csv: string; filename: string }> {
  // Import dynamically to avoid bundling issues when Supabase is unconfigured
  const { fetchNotes } = await import('@/lib/data')
  const notes = await fetchNotes(workspaceId)
  const csv = notesToCsv(notes)
  const slug = workspaceId ?? 'all'
  const ts   = new Date().toISOString().slice(0, 10)
  return { csv, filename: `inline_export_${slug}_${ts}.csv` }
}
