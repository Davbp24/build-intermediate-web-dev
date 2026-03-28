import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { getOpenAIApiKeyForUser, getSupabaseAndUserFromRequest } from '@/lib/openai-key'

export async function POST(request: Request) {
  const { user, supabase } = await getSupabaseAndUserFromRequest(request)
  if (!user || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let pageTextSample = ''
  try {
    const body = await request.json()
    pageTextSample = typeof body.pageTextSample === 'string' ? body.pageTextSample : ''
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const apiKey = await getOpenAIApiKeyForUser(supabase, user.id)
  if (!apiKey) {
    return NextResponse.json({ error: 'No OpenAI API key configured.' }, { status: 403 })
  }

  const openai = createOpenAI({ apiKey })
  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    prompt: `You are a web page risk analyst. Analyze the following page content for:
1. Misinformation or bias
2. Privacy risks or data collection
3. Security concerns (phishing, malware indicators)
4. Content safety issues

Be concise (3-5 bullet points). Flag only genuine concerns.

Page content:
${pageTextSample.slice(0, 10000)}`,
  })

  return NextResponse.json({ analysis: text.trim() })
}
