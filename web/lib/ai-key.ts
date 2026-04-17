import { createClient } from '@/lib/supabase/server'

export async function getAIApiKey(): Promise<string | null> {
  return process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? null
}

export async function getSupabaseAndUserFromRequest(request: Request) {
  const authHeader = request.headers.get('Authorization')
  const supabase = await createClient()

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const { data: { user } } = await supabase.auth.getUser(token)
    if (user) return { supabase, user }
  }

  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user: user ?? null }
}
