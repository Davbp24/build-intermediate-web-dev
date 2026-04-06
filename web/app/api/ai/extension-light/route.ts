import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { getAIApiKey } from '@/lib/ai-key'

export async function POST(request: Request) {
  let task = '', text = '', instruction = '', maxLen = 0
  try {
    const body = await request.json()
    task        = body.task        ?? ''
    text        = body.text        ?? ''
    instruction = body.instruction ?? ''
    maxLen      = body.maxLen      ?? 0
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const apiKey = await getAIApiKey()
  if (!apiKey) {
    return NextResponse.json({ error: 'No AI API key configured.' }, { status: 403 })
  }

  const charLimit = maxLen || text.length
  const lengthHint = `Your response MUST be ${charLimit} characters or fewer.`

  const prompt =
    task === 'summarize' ? `Summarize the following text concisely. ${lengthHint}\n\n${text}` :
    task === 'rewrite'   ? (instruction
      ? `Rewrite the following text. Instruction: ${instruction}. ${lengthHint}\n\nText:\n${text}`
      : `Rewrite the following text clearly, keeping the same meaning. ${lengthHint}\n\n${text}`) :
    task === 'shorten'   ? `Shorten the following text by ~40%, keeping all key information. ${lengthHint}\n\n${text}` :
    `Process this text. ${lengthHint}\n\n${text}`

  try {
    const google = createGoogleGenerativeAI({ apiKey })
    const { text: result } = await generateText({
      model: google('gemini-2.0-flash'),
      prompt: prompt.slice(0, 12000),
    })

    const trimmed = result.trim().slice(0, charLimit)
    return NextResponse.json({ result: trimmed })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'AI request failed'
    const isQuota = msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')
    return NextResponse.json(
      { error: isQuota ? 'Gemini rate limit reached — wait a minute and try again.' : msg },
      { status: isQuota ? 429 : 500 },
    )
  }
}
