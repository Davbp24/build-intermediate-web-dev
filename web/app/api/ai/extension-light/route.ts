import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { getAIApiKey, getSupabaseAndUserFromRequest } from '@/lib/ai-key'

export async function POST(request: Request) {
  const { user, supabase } = await getSupabaseAndUserFromRequest(request)
  if (!user || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let task = '', text = '', instruction = ''
  try {
    const body = await request.json()
    task        = body.task        ?? ''
    text        = body.text        ?? ''
    instruction = body.instruction ?? ''
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const apiKey = await getAIApiKey()
  if (!apiKey) {
    return NextResponse.json({ error: 'No AI API key configured.' }, { status: 403 })
  }

  const prompt =
    task === 'summarize' ? `Summarize the following text in 3 short bullets:\n\n${text}` :
    task === 'rewrite'   ? (instruction
      ? `Rewrite the following text. Instruction: ${instruction}\n\nText:\n${text}`
      : `Rewrite the following text clearly, keeping the same meaning:\n\n${text}`) :
    task === 'shorten'   ? `Shorten the following text by ~40%, keeping all key information:\n\n${text}` :
    `Process this text:\n\n${text}`

  const google = createGoogleGenerativeAI({ apiKey })
  const { text: result } = await generateText({
    model: google('gemini-2.0-flash'),
    prompt: prompt.slice(0, 12000),
  })

  return NextResponse.json({ result: result.trim() })
}
