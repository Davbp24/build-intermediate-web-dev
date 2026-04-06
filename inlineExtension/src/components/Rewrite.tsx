import type React from 'react'
import { useState, useRef, useCallback } from 'react'
import { loadSettings } from '../lib/extensionSettings'

/* ─── Flat Design Tokens ─── */
const C = {
  bg: '#ffffff',
  headerBg: '#f0f9ff',
  border: '#e2e8f0',
  shadow: '4px 4px 0px #E2E8F0',
  text: '#0f172a',
  textMuted: '#64748b',
  textLight: '#94a3b8',
  accent: '#2563eb',
  accentHover: '#1d4ed8',
  hoverBg: '#f1f5f9',
  radius: 12,
}

/* ─── Icons ─── */
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
const ICopy = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="#64748b">
    <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
    <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
  </svg>
)

const TONES = ['Formal', 'Casual', 'Concise'] as const
type Tone = typeof TONES[number]

interface RewriteProps {
  selectedText: string
  originalRange: Range | null
  onClose: () => void
}

export default function Rewrite({ selectedText, originalRange, onClose }: RewriteProps) {
  const [tone, setTone] = useState<Tone>('Casual')
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const customRef = useRef<HTMLInputElement>(null)

  const runTask = useCallback(async (task: string, instruction?: string) => {
    setLoading(true)
    setResult(null)
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
        setResult(j.result ?? 'No result returned.')
      } else {
        setResult('AI request failed. Check your API settings.')
      }
    } catch {
      setResult('Could not reach AI server.')
    } finally {
      setLoading(false)
    }
  }, [selectedText])

  function handleInsert() {
    if (!result || !originalRange) return
    try {
      originalRange.deleteContents()
      originalRange.insertNode(document.createTextNode(result))
    } catch { /* range may be invalid if user navigated away */ }
    onClose()
  }

  function handleCopy() {
    if (result) navigator.clipboard.writeText(result)
  }

  function handleRetry() {
    setResult(null)
  }

  /* ─── Config state (before AI result) ─── */
  if (!result && !loading) {
    return (
      <div style={{
        width: 280, background: C.bg, border: `1.5px solid ${C.border}`,
        borderRadius: C.radius, boxShadow: C.shadow, fontFamily: 'system-ui, sans-serif',
        overflow: 'hidden', userSelect: 'none',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', background: C.headerBg,
          borderBottom: `1.5px solid ${C.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ISparkle />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>Rewrite</span>
          </div>
          <button onClick={onClose} style={btnIcon}><IClose /></button>
        </div>

        {/* Body */}
        <div style={{ padding: '14px 14px 16px' }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text }}>Make any page yours</p>
          <p style={{ margin: '4px 0 14px', fontSize: 11, color: C.textMuted, lineHeight: 1.4 }}>
            Use AI tools to speed your workflow.
          </p>

          {/* Tone selector */}
          <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: C.text }}>Tone</p>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {TONES.map(t => (
              <button key={t} onClick={() => setTone(t)} style={{
                padding: '5px 14px', borderRadius: 999, border: `1.5px solid ${tone === t ? C.accent : C.border}`,
                background: tone === t ? '#eff6ff' : C.bg, color: tone === t ? C.accent : C.text,
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>{t}</button>
            ))}
          </div>

          {/* Actions */}
          {(['Rephrase', 'Shorten', 'Summarize'] as const).map(a => (
            <button key={a}
              onClick={() => runTask(a.toLowerCase(), `Tone: ${tone}`)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 10px', border: 'none', borderRadius: 6,
                background: 'transparent', fontSize: 13, color: C.text,
                cursor: 'pointer', fontWeight: 500, marginBottom: 2,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = C.hoverBg)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >{a}</button>
          ))}

          {/* Custom prompt */}
          <div style={{ marginTop: 10, position: 'relative' }}>
            <input
              ref={customRef}
              value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && customPrompt.trim()) runTask('rewrite', customPrompt) }}
              placeholder="Custom prompt"
              style={{
                width: '100%', boxSizing: 'border-box', padding: '8px 10px',
                border: `1.5px solid ${C.border}`, borderRadius: 8,
                fontSize: 12, outline: 'none', color: C.text,
                fontFamily: 'system-ui, sans-serif',
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '8px 14px', borderTop: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 10, color: C.textLight }}>By Inline</span>
          <span style={{ fontSize: 10, color: C.textLight }}>⠿</span>
        </div>
      </div>
    )
  }

  /* ─── Result / Loading state ─── */
  return (
    <div style={{
      width: 320, background: C.bg, border: `1.5px solid ${C.border}`,
      borderRadius: C.radius, boxShadow: C.shadow, fontFamily: 'system-ui, sans-serif',
      overflow: 'hidden', userSelect: 'none',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', background: C.headerBg,
        borderBottom: `1.5px solid ${C.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ISparkle />
          <span style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>Rewrite</span>
        </div>
        <button onClick={onClose} style={btnIcon}><IClose /></button>
      </div>

      {/* Result body */}
      <div style={{ padding: 14 }}>
        <div style={{
          padding: 12, border: `1.5px solid ${C.border}`, borderRadius: 8,
          fontSize: 13, lineHeight: 1.6, color: C.text, minHeight: 60,
          background: '#fafafa',
        }}>
          {loading ? (
            <span style={{ color: C.textMuted, fontStyle: 'italic' }}>Generating…</span>
          ) : result}
        </div>

        {/* Action row */}
        {!loading && (
          <div style={{ display: 'flex', gap: 6, marginTop: 12, alignItems: 'center' }}>
            <button onClick={handleRetry} style={pillBtn}>Retry</button>
            <button onClick={() => { setResult(null); customRef.current?.focus() }} style={pillBtn}>Refine</button>
            <button onClick={handleInsert} style={{
              ...pillBtn, background: C.accent, color: '#fff', borderColor: C.accent, fontWeight: 700,
            }}>Insert</button>
            <button onClick={handleCopy} style={{ ...btnIcon, marginLeft: 'auto' }}><ICopy /></button>
          </div>
        )}

        {/* Custom prompt for refine */}
        <input
          placeholder="Customize with prompt"
          value={customPrompt}
          onChange={e => setCustomPrompt(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && customPrompt.trim()) runTask('rewrite', customPrompt) }}
          style={{
            width: '100%', boxSizing: 'border-box', marginTop: 10,
            padding: '8px 10px', border: `1.5px solid ${C.border}`, borderRadius: 8,
            fontSize: 12, outline: 'none', color: C.text,
            fontFamily: 'system-ui, sans-serif',
          }}
        />
      </div>

      {/* Footer */}
      <div style={{
        padding: '8px 14px', borderTop: `1px solid ${C.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 10, color: C.textLight }}>By Inline</span>
        <span style={{ fontSize: 10, color: C.textLight }}>⠿</span>
      </div>
    </div>
  )
}

/* shared button styles */
const btnIcon: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 28, height: 28, border: 'none', borderRadius: 6,
  background: 'transparent', cursor: 'pointer', padding: 0,
}

const pillBtn: React.CSSProperties = {
  padding: '6px 16px', borderRadius: 999,
  border: '1.5px solid #e2e8f0', background: '#ffffff',
  fontSize: 12, fontWeight: 600, cursor: 'pointer',
  color: '#0f172a', fontFamily: 'system-ui, sans-serif',
}
