import { useEffect, useState } from 'react'
import './App.css'
import { loadSettings, saveSettings } from './lib/extensionSettings'

function App() {
  const [apiBase, setApiBase] = useState('http://localhost:3000')
  const [token, setToken] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    void loadSettings().then(s => {
      setApiBase(s.apiBaseUrl)
      setToken(s.accessToken)
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
      <label className="popup-label">Access token (optional)</label>
      <p className="popup-hint">Paste a Supabase session access token for authenticated API calls.</p>
      <input
        className="popup-input"
        type="password"
        value={token}
        onChange={e => setToken(e.target.value)}
        placeholder="Bearer token"
      />
      <button
        type="button"
        className="popup-save"
        onClick={async () => {
          await saveSettings({ apiBaseUrl: apiBase, accessToken: token })
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
