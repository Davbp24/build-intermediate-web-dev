'use server'

import { revalidatePath } from 'next/cache'

const HAS_SUPABASE = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function revalidateAll() {
  revalidatePath('/app/history')
  revalidatePath('/app/[workspaceId]/history', 'page')
  revalidatePath('/app/dashboard')
  revalidatePath('/app/[workspaceId]/dashboard', 'page')
}

// ---------------------------------------------------------------------------
// Delete a single note
// ---------------------------------------------------------------------------
export async function deleteNote(id: string): Promise<{ success: boolean; error?: string }> {
  if (!HAS_SUPABASE) {
    revalidateAll()
    return { success: true }
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { error } = await supabase.from('notes').delete().eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidateAll()
  return { success: true }
}

// ---------------------------------------------------------------------------
// Bulk delete
// ---------------------------------------------------------------------------
export async function bulkDeleteNotes(ids: string[]): Promise<{ success: boolean; count: number; error?: string }> {
  if (!ids.length) return { success: true, count: 0 }

  if (!HAS_SUPABASE) {
    revalidateAll()
    return { success: true, count: ids.length }
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { error, count } = await supabase.from('notes').delete().in('id', ids)

  if (error) return { success: false, count: 0, error: error.message }
  revalidateAll()
  return { success: true, count: count ?? ids.length }
}

// ---------------------------------------------------------------------------
// Update note content
// ---------------------------------------------------------------------------
export async function updateNoteContent(id: string, content: string): Promise<{ success: boolean; error?: string }> {
  if (!HAS_SUPABASE) {
    revalidateAll()
    return { success: true }
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('notes').update({ content }).eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidateAll()
  return { success: true }
}

// ---------------------------------------------------------------------------
// Update note tags
// ---------------------------------------------------------------------------
export async function updateNoteTags(id: string, tags: string[]): Promise<{ success: boolean; error?: string }> {
  if (!HAS_SUPABASE) {
    revalidateAll()
    return { success: true }
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('notes').update({ tags }).eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidateAll()
  return { success: true }
}

// ---------------------------------------------------------------------------
// Toggle pin
// ---------------------------------------------------------------------------
export async function toggleNotePin(id: string, pinned: boolean): Promise<{ success: boolean; error?: string }> {
  if (!HAS_SUPABASE) {
    revalidateAll()
    return { success: true }
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('notes').update({ is_pinned: pinned }).eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidateAll()
  return { success: true }
}
