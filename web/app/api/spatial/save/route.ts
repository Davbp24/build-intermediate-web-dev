import { NextResponse } from 'next/server'
import { getSupabaseAndUserFromRequest } from '@/lib/openai-key'

async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'InlineApp/1.0' },
    })
    const data = await res.json() as { lat: string; lon: string }[]
    if (!data.length) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  const { user, supabase } = await getSupabaseAndUserFromRequest(request)
  if (!user || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let address = '', insight = '', workspaceId = '', sourceUrl = ''
  try {
    const body = await request.json()
    address     = body.address     ?? ''
    insight     = body.insight     ?? ''
    workspaceId = body.workspaceId ?? ''
    sourceUrl   = body.sourceUrl   ?? ''
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!address) {
    return NextResponse.json({ error: 'address is required' }, { status: 400 })
  }

  const coords = await geocode(address)

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const sb = supabase as any
  const { data, error } = await sb.from('spatial_entities').insert({
    user_id:      user.id,
    workspace_id: workspaceId || null,
    address,
    insight_note: insight,
    source_url:   sourceUrl,
    lat:          coords?.lat ?? null,
    lng:          coords?.lng ?? null,
    created_at:   new Date().toISOString(),
  }).select().single()
  /* eslint-enable @typescript-eslint/no-explicit-any */

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, entity: data, coords })
}
