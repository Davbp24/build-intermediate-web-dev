'use server'

import { redirect } from 'next/navigation'

const HAS_SUPABASE = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function signOut() {
  if (HAS_SUPABASE) {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    await supabase.auth.signOut()
  }
  redirect('/')
}

export async function sendPasswordReset(email: string): Promise<{ error?: string }> {
  if (!HAS_SUPABASE) return { error: 'Supabase is not configured.' }
  if (!email?.trim()) return { error: 'Email is required.' }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/update-password`,
  })

  if (error) return { error: error.message }
  return {}
}
