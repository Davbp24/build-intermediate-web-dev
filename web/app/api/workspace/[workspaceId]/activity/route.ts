import { NextResponse } from 'next/server'
import { getSupabaseAndUserFromRequest } from '@/lib/ai-key'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const { workspaceId } = await params
  const { user, supabase } = await getSupabaseAndUserFromRequest(request)

  if (!user || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const sb = supabase as any

  const [notesResult, extractionsResult] = await Promise.all([
    sb
      .from('notes')
      .select('id, created_at, updated_at, page_title, domain, type, content')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(50),
    sb
      .from('extractions')
      .select('id, created_at, schema_type, domain, page_url, data')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(50),
  ])
  /* eslint-enable @typescript-eslint/no-explicit-any */

  type NoteRow = { id: string; created_at: string; updated_at: string; page_title: string; domain: string; type: string; content: string }
  type ExRow   = { id: string; created_at: string; schema_type: string; domain: string; page_url: string; data: unknown }

  const notes: NoteRow[]  = notesResult.data  ?? []
  const exs:   ExRow[]    = extractionsResult.data ?? []

  const feed = [
    ...notes.map(n => ({
      id:       `note-${n.id}`,
      kind:     'note' as const,
      label:    n.page_title || n.domain || 'Untitled',
      sub:      n.domain,
      type:     n.type,
      snippet:  typeof n.content === 'string' ? n.content.slice(0, 120) : '',
      time:     n.created_at,
    })),
    ...exs.map(e => ({
      id:       `ext-${e.id}`,
      kind:     'extraction' as const,
      label:    e.schema_type || 'Extraction',
      sub:      e.domain,
      type:     e.schema_type,
      snippet:  '',
      time:     e.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 50)

  return NextResponse.json({ feed })
}
