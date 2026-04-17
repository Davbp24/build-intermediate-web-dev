import { NextRequest, NextResponse } from 'next/server'
import { normalizeInlineVoiceId } from '@/lib/inlineVoicePresets'

// Free-tier fallback (ElevenLabs "premade" category). Works on every plan.
// If the user's selected voice is a paid/library voice and their key is on a
// free plan, we transparently retry with this voice so TTS still plays.
const FREE_TIER_FALLBACK_VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb' // George

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-elevenlabs-key',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      text?: string
      voiceId?: string
      stability?: number
      similarityBoost?: number
    }

    const { text, voiceId } = body

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'text is required' }, { status: 400, headers: corsHeaders })
    }

    // Prefer per-request key from the dashboard/extension so a valid key in settings
    // is not overridden by a stale or missing ELEVENLABS_API_KEY in .env.local.
    const headerKey = req.headers.get('x-elevenlabs-key')?.trim() ?? ''
    const envKey = process.env.ELEVENLABS_API_KEY?.trim() ?? ''
    const apiKey = headerKey || envKey

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'No ElevenLabs API key configured. Add ELEVENLABS_API_KEY to .env.local or pass x-elevenlabs-key header.',
        },
        { status: 422, headers: corsHeaders },
      )
    }

    const vid = normalizeInlineVoiceId(voiceId)

    const trimmed = text.slice(0, 3000)
    const stability =
      typeof body.stability === 'number' && Number.isFinite(body.stability)
        ? Math.min(1, Math.max(0, body.stability))
        : 0.5
    const similarityBoost =
      typeof body.similarityBoost === 'number' && Number.isFinite(body.similarityBoost)
        ? Math.min(1, Math.max(0, body.similarityBoost))
        : 0.75

    const ttsBody = JSON.stringify({
      text: trimmed,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability, similarity_boost: similarityBoost },
    })

    async function callEleven(voiceIdToUse: string) {
      return fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceIdToUse}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: ttsBody,
      })
    }

    let elResp = await callEleven(vid)

    // Free-tier accounts cannot use "professional/library" voices and get 402.
    // Retry once with the free-tier fallback so read-aloud still plays.
    if (!elResp.ok && elResp.status === 402 && vid !== FREE_TIER_FALLBACK_VOICE_ID) {
      elResp = await callEleven(FREE_TIER_FALLBACK_VOICE_ID)
    }

    if (!elResp.ok) {
      const msg = await elResp.text().catch(() => 'ElevenLabs request failed')
      const st = elResp.status
      if (st === 401 || st === 403) {
        return NextResponse.json(
          {
            error:
              'ElevenLabs rejected the API key (invalid, revoked, or wrong account). Update the key in Account → AI & Voice, extension popup, or ELEVENLABS_API_KEY in .env.local, then restart `npm run dev`.',
            upstream: msg.slice(0, 500),
          },
          { status: 502, headers: corsHeaders },
        )
      }
      if (st === 402) {
        return NextResponse.json(
          {
            error:
              'ElevenLabs requires a paid plan for this voice/model. Pick a free-tier voice in Settings → Voice selection, or upgrade your ElevenLabs subscription.',
            upstream: msg.slice(0, 500),
          },
          { status: 402, headers: corsHeaders },
        )
      }
      return NextResponse.json({ error: msg }, { status: st >= 400 && st < 600 ? st : 502, headers: corsHeaders })
    }

    const audioBuffer = await elResp.arrayBuffer()

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
        ...corsHeaders,
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Internal error'
    return NextResponse.json({ error: msg }, { status: 500, headers: corsHeaders })
  }
}
