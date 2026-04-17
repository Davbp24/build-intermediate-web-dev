import { loadSettings } from './extensionSettings'
import { normalizeInlineVoiceId } from './inlineVoicePresets'

let currentAudio: HTMLAudioElement | null = null

export function stopSpeaking(): void {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
}

function playBlobUrl(url: string, opts?: { onEnd?: () => void }) {
  const audio = new Audio(url)
  currentAudio = audio
  audio.onended = () => {
    URL.revokeObjectURL(url)
    currentAudio = null
    opts?.onEnd?.()
  }
  audio.onerror = () => {
    URL.revokeObjectURL(url)
    currentAudio = null
    opts?.onEnd?.()
  }
  void audio.play()
}

/** Prefer dashboard /api/tts (server ELEVENLABS_API_KEY) via background — avoids CORS and duplicate keys. */
function ttsViaBackground(
  text: string,
  voiceId: string,
  opts?: { onStart?: () => void; onEnd?: () => void },
): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
      resolve(false)
      return
    }
    chrome.runtime.sendMessage(
      { type: 'INLINE_TTS', payload: { text, voiceId } },
      (response: { ok?: boolean; audioBase64?: string; mimeType?: string; error?: string } | undefined) => {
        if (chrome.runtime.lastError) {
          resolve(false)
          return
        }
        if (!response?.ok || !response.audioBase64) {
          resolve(false)
          return
        }
        try {
          opts?.onStart?.()
          const binary = atob(response.audioBase64)
          const bytes = new Uint8Array(binary.length)
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
          const blob = new Blob([bytes], { type: response.mimeType || 'audio/mpeg' })
          const url = URL.createObjectURL(blob)
          playBlobUrl(url, { onEnd: opts?.onEnd })
          resolve(true)
        } catch {
          resolve(false)
        }
      },
    )
  })
}

export async function speakWithElevenLabs(
  text: string,
  opts?: { onStart?: () => void; onEnd?: () => void },
): Promise<void> {
  stopSpeaking()

  const trimmed = text.slice(0, 2000)
  if (!trimmed) return

  const { elevenLabsKey, voiceId: rawVoiceId } = await loadSettings()
  const voiceId = normalizeInlineVoiceId(rawVoiceId)

  const usedProxy = await ttsViaBackground(trimmed, voiceId, opts)
  if (usedProxy) return

  if (!elevenLabsKey) {
    opts?.onEnd?.()
    return
  }

  try {
    opts?.onStart?.()
    const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'xi-api-key': elevenLabsKey },
      body: JSON.stringify({
        text: trimmed,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    })

    if (!resp.ok) {
      opts?.onEnd?.()
      return
    }

    const blob = await resp.blob()
    const url = URL.createObjectURL(blob)
    playBlobUrl(url, { onEnd: opts?.onEnd })
  } catch {
    opts?.onEnd?.()
  }
}
