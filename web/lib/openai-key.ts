import { createClient } from '@/lib/supabase/server'

/* ─── resolve the OpenAI key for a user ─── */
export async function getOpenAIApiKeyForUser(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('openai_api_key')
      .eq('id', userId)
      .single()
    if (data?.openai_api_key) return data.openai_api_key as string
  } catch { /* fall through */ }
  return process.env.OPENAI_API_KEY ?? null
}

/* ─── parse auth from cookie session or Bearer header ─── */
export async function getSupabaseAndUserFromRequest(request: Request) {
  const authHeader = request.headers.get('Authorization')
  const supabase = await createClient()

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const { data: { user } } = await supabase.auth.getUser(token)
    return { supabase, user: user ?? null }
  }

  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user: user ?? null }
}
