import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { getAIApiKey, getSupabaseAndUserFromRequest } from '@/lib/ai-key'

export async function POST(request: Request) {
  try {
    const { user, supabase } = await getSupabaseAndUserFromRequest(request)
    if (!user || !supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let workspaceId = ''
    try {
      const body = await request.json()
      workspaceId = typeof body.workspaceId === 'string' ? body.workspaceId : ''
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 })
    }

    const apiKey = await getAIApiKey()
    if (!apiKey) {
      return NextResponse.json(
        { error: 'No AI API key configured.' },
        { status: 403 },
      )
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const sb = supabase as any

    const since = new Date()
    since.setDate(since.getDate() - 6)

    const { data: noteRows } = await sb
      .from('notes')
      .select('created_at, type, domain')
      .eq('workspace_id', workspaceId)
      .gte('created_at', since.toISOString())

    const rows = (noteRows ?? []) as { created_at: string; type: string; domain: string }[]
    const totalWeek = rows.length
    const aiWeek = rows.filter(r => r.type === 'ai-summary').length

    const counts: Record<string, number> = {}
    for (const r of rows) {
      counts[r.domain] = (counts[r.domain] ?? 0) + 1
    }
    const topDomains = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([domain, count]) => ({ domain, count }))
    /* eslint-enable @typescript-eslint/no-explicit-any */

    const google = createGoogleGenerativeAI({ apiKey })
    const { text } = await generateText({
      model: google('gemini-2.0-flash'),
      prompt: `You are an analytics coach for a web research product. In 2-3 short sentences, give one actionable insight.
Hard numbers (last 7 days):
- Total captures: ${totalWeek}
- AI-tagged captures: ${aiWeek}
- Top domains: ${topDomains.map(d => `${d.domain} (${d.count})`).join(', ') || 'none yet'}

Be specific and friendly. No markdown headings.`,
    })

    return NextResponse.json({
      narrative: text.trim(),
      stats: { totalWeek, aiWeek, topDomains },
    })
  } catch (err) {
    console.error('[insights] Error:', err)
    return NextResponse.json(
      { error: 'Failed to generate insights.', narrative: 'No insights available right now.', stats: { totalWeek: 0, aiWeek: 0, topDomains: [] } },
      { status: 200 },
    )
  }
}
