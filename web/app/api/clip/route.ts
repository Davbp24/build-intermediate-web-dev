import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Save a captured clip / AI result / highlight bundle into public.notes so it
 * appears on the History, Graph, Analytics, and Map pages. The caller can pass
 * either a Supabase access token (Bearer header) or a userId in the body — one
 * of the two is required so the row satisfies RLS.
 */

function looksLikeJwt(token: string): boolean {
  if (!token) return false
  const parts = token.split('.')
  return parts.length === 3 && parts.every(p => p.length > 0)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    pageUrl,
    pageTitle,
    selection,
    highlights,
    workspaceId,
    userId: userIdFromBody,
    type,
    tags,
    content: overrideContent,
    color,
  } = body as {
    pageUrl?: string
    pageTitle?: string
    selection?: string
    highlights?: Array<{ text?: string }>
    workspaceId?: string
    userId?: string
    type?: string
    tags?: string[]
    content?: string
    color?: string
  }

  if (!pageUrl) {
    return NextResponse.json({ error: 'pageUrl required' }, { status: 400 })
  }

  const authHeader = req.headers.get('authorization') || ''
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  const hasJwt = looksLikeJwt(bearer)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    hasJwt
      ? {
          global: { headers: { Authorization: `Bearer ${bearer}` } },
          auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
        }
      : undefined,
  )

  let userId: string | null = userIdFromBody ?? null
  if (hasJwt) {
    try {
      const { data } = await supabase.auth.getUser()
      if (data?.user?.id) userId = data.user.id
    } catch { /* ignore */ }
  }

  if (!userId) {
    return NextResponse.json(
      { error: 'not authenticated: missing Authorization bearer or userId' },
      { status: 401 },
    )
  }

  const content =
    overrideContent ??
    [
      selection ? `> ${selection}\n\n` : '',
      `Source: ${pageUrl}\n`,
      pageTitle ? `Title: ${pageTitle}\n` : '',
      highlights?.length
        ? `\nHighlights:\n${highlights.map(h => `- ${h.text ?? ''}`).join('\n')}`
        : '',
    ].join('')

  let domain = ''
  try { domain = new URL(pageUrl).hostname } catch { /* ignore */ }

  // notes.type is constrained to 'text' | 'canvas' | 'ai-summary'. Map any
  // richer kind (e.g. 'ai-rephrase', 'clip', 'highlight') down to one of the
  // three and stash the original in tags so the UI can still distinguish.
  const allowedTypes = new Set(['text', 'canvas', 'ai-summary'])
  const requestedType = (type || 'text').trim()
  const finalType = allowedTypes.has(requestedType)
    ? requestedType
    : requestedType.startsWith('ai-')
      ? 'ai-summary'
      : 'text'
  const finalTags =
    tags && tags.length
      ? finalType === requestedType
        ? tags
        : Array.from(new Set([...tags, requestedType]))
      : finalType === requestedType
        ? ['clipped']
        : ['clipped', requestedType]

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const { data, error } = await (supabase.from('notes') as any)
    .insert({
      user_id:      userId,
      workspace_id: workspaceId ?? null,
      page_url:     pageUrl,
      page_title:   pageTitle || '',
      content:      String(content).slice(0, 20_000),
      type:         finalType,
      domain,
      color:        color || '#FFEB3B',
      tags:         finalTags,
    })
    .select()
    .single()
  /* eslint-enable @typescript-eslint/no-explicit-any */

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, noteId: data.id })
}
