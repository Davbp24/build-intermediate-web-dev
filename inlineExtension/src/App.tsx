import { useEffect, useState } from 'react'
import './App.css'
import { loadSettings, saveSettings } from './lib/extensionSettings'
import { DEFAULT_INLINE_VOICE_ID, INLINE_VOICE_PRESETS } from './lib/inlineVoicePresets'

function App() {
  const [apiBase, setApiBase] = useState('http://localhost:3000')
  const [token, setToken] = useState('')
  const [elevenKey, setElevenKey] = useState('')
  const [voiceId, setVoiceId] = useState(DEFAULT_INLINE_VOICE_ID)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    void loadSettings().then(s => {
      setApiBase(s.apiBaseUrl)
      setToken(s.accessToken)
      setElevenKey(s.elevenLabsKey)
      setVoiceId(s.voiceId)
    })
  }, [])

  return (
    <div className="popup-wrap">
      <h1 className="popup-title">Inline</h1>
      <p className="popup-desc">Connect to your dashboard for AI and spatial save.</p>
      <label className="popup-label">API base URL</label>
      <input
        className="popup-input"
        value={apiBase}
        onChange={e => setApiBase(e.target.value)}
        placeholder="http://localhost:3000"
      />
      <label className="popup-label">Access token <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional — paste your Supabase access token)</span></label>
      <p className="popup-hint">Sign in at the dashboard first. Open browser DevTools → Application → Local Storage → find <code>sb-*-auth-token</code> and copy the <code>access_token</code> value (not the anon key).</p>
      <input
        className="popup-input"
        type="password"
        value={token}
        onChange={e => setToken(e.target.value)}
        placeholder="eyJhbGci…"
      />
      <label className="popup-label">ElevenLabs API key <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional if dashboard uses server key)</span></label>
      <p className="popup-hint">If your Next.js app has <code>ELEVENLABS_API_KEY</code> in <code>.env.local</code>, read-aloud uses it automatically via <code>/api/tts</code>. Add a key here as a fallback or when the server has no key.</p>
      <input
        className="popup-input"
        type="password"
        value={elevenKey}
        onChange={e => setElevenKey(e.target.value)}
        placeholder="sk_…"
      />
      <label className="popup-label">Voice</label>
      <select
        className="popup-input"
        value={voiceId}
        onChange={e => setVoiceId(e.target.value)}
      >
        {INLINE_VOICE_PRESETS.map(v => (
          <option key={v.id} value={v.id}>
            {v.name} ({v.gender === 'female' ? 'she/her' : 'he/him'}) — {v.subtitle}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="popup-save"
        onClick={async () => {
          await saveSettings({
            apiBaseUrl: apiBase,
            accessToken: token,
            elevenLabsKey: elevenKey,
            voiceId,
          })
          setSaved(true)
          setTimeout(() => setSaved(false), 1500)
        }}
      >
        Save settings
      </button>
      {saved && <p className="popup-saved">Saved.</p>}
    </div>
  )
}

export default App
