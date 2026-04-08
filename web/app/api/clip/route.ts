import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { pageUrl, pageTitle, selection, highlights, workspaceId } = await req.json()

  if (!pageUrl || !workspaceId) {
    return NextResponse.json({ error: 'pageUrl and workspaceId required' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const content = [
    selection ? `> ${selection}\n\n` : '',
    `Source: ${pageUrl}\n`,
    pageTitle ? `Title: ${pageTitle}\n` : '',
    highlights?.length ? `\nHighlights:\n${highlights.map((h: any) => `- ${h.text}`).join('\n')}` : '',
  ].join('')

  const { data, error } = await supabase.from('notes').insert({
    workspace_id: workspaceId,
    page_url: pageUrl,
    page_title: pageTitle || '',
    content,
    type: 'text',
    domain: new URL(pageUrl).hostname,
    tags: ['clipped'],
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, noteId: data.id })
}
