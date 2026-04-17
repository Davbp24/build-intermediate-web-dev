import { streamText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { NextResponse } from 'next/server'
import { getAIApiKey, getSupabaseAndUserFromRequest } from '@/lib/ai-key'
import { INLINE_SYSTEM_CONTEXT } from '@/lib/inline-persona'

export async function POST(request: Request) {
  try {
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

    const apiKey = await getAIApiKey()
    if (!apiKey) {
      return NextResponse.json({ error: 'No AI API key configured.' }, { status: 403 })
    }

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

    const systemPrompt = `${INLINE_SYSTEM_CONTEXT}

# Workspace context for this conversation
The user is chatting from workspace "${workspaceId || 'unknown'}". Use the captures and library documents below as the primary source when answering questions about their research. If the user asks a general question (including "what are you?" or "what can you do?"), answer from the identity/product context above without needing captures.

${notesContext ? `## Captured notes\n${notesContext}` : '## No notes found for this workspace yet.'}

${docsContext ? `## Library documents\n${docsContext}` : ''}`

    const google = createGoogleGenerativeAI({ apiKey })
    const result = streamText({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
    })

    // Stream manually so mid-stream provider errors (e.g. 429 quota) surface as
    // a visible assistant message instead of closing the stream with no text —
    // otherwise the chat bubble just shows "…" forever.
    const encoder = new TextEncoder()
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            controller.enqueue(encoder.encode(chunk))
          }
          controller.close()
        } catch (err: unknown) {
          const status = (err as { statusCode?: number })?.statusCode
          const body = (err as { responseBody?: string })?.responseBody ?? ''
          let msg = 'The AI service failed to respond. Please try again shortly.'
          if (status === 429) {
            msg = body.includes('prepayment')
              ? 'Google AI Studio prepayment credits are depleted for this API key. Add credits at https://ai.studio/projects, or replace GOOGLE_GENERATIVE_AI_API_KEY in web/.env.local with a key whose project has billing, then restart `npm run dev`.'
              : 'AI quota exhausted — add credits at https://ai.studio/projects or use a new API key.'
          } else if (status === 404 && body.includes('no longer available')) {
            msg = 'The Gemini model used by the chat is no longer available on this API key. Update the model name in web/app/api/ai/*/route.ts (e.g. to "gemini-2.5-flash" or "gemini-flash-latest") and restart `npm run dev`.'
          } else if (status === 403) {
            msg = 'Google rejected the AI request (403). The API key may be restricted or the Generative Language API disabled on that project.'
          } else if (status === 400 && body.includes('API key not valid')) {
            msg = 'Google says the API key is not valid. Update GOOGLE_GENERATIVE_AI_API_KEY in web/.env.local and restart `npm run dev`.'
          }
          console.error('[rag] stream error:', status, body.slice(0, 300))
          controller.enqueue(encoder.encode(msg))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  } catch (err: unknown) {
    console.error('[rag] Error:', err)
    const status = (err as { statusCode?: number }).statusCode
    if (status === 429) {
      return NextResponse.json(
        { error: 'AI quota exhausted — add credits at https://ai.studio/projects or use a new API key.' },
        { status: 429 },
      )
    }
    return NextResponse.json({ error: 'AI request failed.' }, { status: 500 })
  }
}
