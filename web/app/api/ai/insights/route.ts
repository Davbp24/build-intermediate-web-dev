import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { getOpenAIApiKeyForUser, getSupabaseAndUserFromRequest } from '@/lib/openai-key'
import { fetchCaptureTimeSeries } from '@/lib/data'

export async function POST(request: Request) {
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

  const apiKey = await getOpenAIApiKeyForUser(supabase, user.id)
  if (!apiKey) {
    return NextResponse.json(
      { error: 'No OpenAI API key configured. Add one in your profile or set OPENAI_API_KEY for dev.' },
      { status: 403 },
    )
  }

  const series = await fetchCaptureTimeSeries(workspaceId, 7)
  const totalWeek = series.reduce((s, d) => s + d.count, 0)
  const aiWeek = series.reduce((s, d) => s + d.ai, 0)

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const sb = supabase as any
  const { data: domainRows } = await sb
    .from('notes')
    .select('domain')
    .eq('workspace_id', workspaceId)
  const domains = (domainRows ?? []) as { domain: string }[]
  const counts: Record<string, number> = {}
  for (const r of domains) {
    counts[r.domain] = (counts[r.domain] ?? 0) + 1
  }
  const topDomains = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([domain, count]) => ({ domain, count }))
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const openai = createOpenAI({ apiKey })
  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
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
}
