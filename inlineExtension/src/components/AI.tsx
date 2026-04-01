import { useState, useRef, useCallback } from 'react'
import { wrapSelectionWithHighlight } from '../content/highlightWrap'
import { loadSettings } from '../lib/extensionSettings'

const C = {
  bg: '#ffffff',
  headerBg: '#f0f9ff',
  border: '#e2e8f0',
  shadow: '4px 4px 0px #E2E8F0',
  text: '#0f172a',
  textMuted: '#64748b',
  textLight: '#94a3b8',
  accent: '#2563eb',
  hoverBg: '#f1f5f9',
  radius: 12,
}

const ISparkle = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="#2563eb">
    <path d="M7.657 6.247c.11-.33.576-.33.686 0l.645 1.937a2.89 2.89 0 0 0 1.829 1.828l1.936.645c.33.11.33.576 0 .686l-1.937.645a2.89 2.89 0 0 0-1.828 1.829l-.645 1.936a.361.361 0 0 1-.686 0l-.645-1.937a2.89 2.89 0 0 0-1.828-1.828l-1.937-.645a.361.361 0 0 1 0-.686l1.937-.645a2.89 2.89 0 0 0 1.828-1.829l.645-1.936zM3.794 1.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.61.955 1.128 1.128l1.162.387a.217.217 0 0 1 0 .412l-1.162.387A1.734 1.734 0 0 0 4.593 5.75l-.387 1.162a.217.217 0 0 1-.412 0L3.407 5.75a1.734 1.734 0 0 0-1.127-1.128l-1.163-.387a.217.217 0 0 1 0-.412l1.163-.387a1.734 1.734 0 0 0 1.127-1.128l.387-1.162z"/>
  </svg>
)
const IClose = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="#64748b">
    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
  </svg>
)

interface AIProps {
  selectedText: string
  onClose: () => void
}

export default function AI({ selectedText, onClose }: AIProps) {
  const [customPrompt, setCustomPrompt] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const runTask = useCallback(async (task: string, instruction?: string) => {
    wrapSelectionWithHighlight(task)
    try {
      const text = selectedText.slice(0, 8000)
      const { apiBaseUrl, accessToken } = await loadSettings()
      const h: Record<string, string> = { 'Content-Type': 'application/json' }
      if (accessToken) h.Authorization = `Bearer ${accessToken}`
      const res = await fetch(`${apiBaseUrl}/api/ai/extension-light`, {
        method: 'POST', headers: h,
        body: JSON.stringify({ task, text, instruction }),
      })
      if (res.ok) {
        const j = await res.json() as { result?: string }
        if (j.result) window.alert(j.result)
        else window.alert('No result returned.')
      } else {
        window.alert('AI request failed. Check settings.')
      }
    } catch {
      window.alert('Could not reach AI server.')
    }
    onClose()
  }, [selectedText, onClose])

  return (
    <div style={{
      width: 220, background: C.bg, border: `1.5px solid ${C.border}`,
      borderRadius: C.radius, boxShadow: C.shadow, fontFamily: 'system-ui, sans-serif',
      overflow: 'hidden', userSelect: 'none',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', background: C.headerBg,
        borderBottom: `1.5px solid ${C.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ISparkle />
          <span style={{ fontSize: 12, fontWeight: 700, color: C.accent }}>Ask AI</span>
        </div>
        <button onClick={onClose} style={btnIcon}><IClose /></button>
      </div>

      {/* Actions */}
      <div style={{ padding: '6px 6px 4px' }}>
        {(['Rephrase', 'Shorten', 'Summarize'] as const).map(a => (
          <button key={a}
            onClick={() => void runTask(a.toLowerCase())}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '7px 10px', border: 'none', borderRadius: 6,
              background: 'transparent', fontSize: 13, color: C.text,
              cursor: 'pointer', fontWeight: 500,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = C.hoverBg)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >{a}</button>
        ))}
      </div>

      {/* Custom prompt */}
      <div style={{ padding: '0 10px 10px' }}>
        <input
          ref={inputRef}
          value={customPrompt}
          onChange={e => setCustomPrompt(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && customPrompt.trim()) void runTask('rewrite', customPrompt) }}
          placeholder="Custom prompt"
          style={{
            width: '100%', boxSizing: 'border-box', padding: '7px 10px',
            border: `1.5px solid ${C.border}`, borderRadius: 8,
            fontSize: 12, outline: 'none', color: C.text,
            fontFamily: 'system-ui, sans-serif',
          }}
        />
      </div>
    </div>
  )
}

const btnIcon: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 26, height: 26, border: 'none', borderRadius: 6,
  background: 'transparent', cursor: 'pointer', padding: 0,
}
