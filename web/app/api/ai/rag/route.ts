import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { NextResponse } from 'next/server'
import { getOpenAIApiKeyForUser, getSupabaseAndUserFromRequest } from '@/lib/openai-key'

export async function POST(request: Request) {
  const { user, supabase } = await getSupabaseAndUserFromRequest(request)
  if (!user || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let message = '', workspaceId = '', libraryDocs: { title: string; content: string }[] = []
  try {
    const body = await request.json()
    message     = body.message     ?? ''
    workspaceId = body.workspaceId ?? ''
    libraryDocs = Array.isArray(body.libraryDocs) ? body.libraryDocs : []
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!message) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 })
  }

  const apiKey = await getOpenAIApiKeyForUser(supabase, user.id)
  if (!apiKey) {
    return NextResponse.json({ error: 'No OpenAI API key configured.' }, { status: 403 })
  }

  /* ─── retrieve notes for this workspace ─── */
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const sb = supabase as any
  const { data: notes } = await sb
    .from('notes')
    .select('page_title, domain, content, type, created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(40)
  /* eslint-enable @typescript-eslint/no-explicit-any */

  type NoteSnippet = { page_title: string; domain: string; content: string; type: string; created_at: string }
  const noteSnippets: NoteSnippet[] = notes ?? []

  const notesContext = noteSnippets
    .map(n => `[${n.type ?? 'note'} from ${n.domain ?? 'unknown'} — ${n.page_title ?? ''}]\n${(n.content ?? '').slice(0, 400)}`)
    .join('\n\n')

  const docsContext = libraryDocs
    .slice(0, 10)
    .map(d => `[Document: ${d.title}]\n${(d.content ?? '').slice(0, 600)}`)
    .join('\n\n')

  const systemPrompt = `You are a helpful assistant for a research workspace. Answer the user's question using only the provided context. If the answer is not in the context, say so honestly.

${notesContext ? `## Captured notes\n${notesContext}` : '## No notes found for this workspace yet.'}

${docsContext ? `## Library documents\n${docsContext}` : ''}`

  const openai = createOpenAI({ apiKey })
  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: systemPrompt,
    messages: [{ role: 'user', content: message }],
  })

  return result.toTextStreamResponse()
}
