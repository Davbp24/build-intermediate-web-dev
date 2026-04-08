import { useState, useRef, useCallback } from 'react'
import { loadSettings } from '../lib/extensionSettings'
import { PANEL as C, FONT } from '../lib/extensionTheme'
import { PROMPT_TEMPLATES } from '../lib/promptTemplates'

/* ─── Icons ─── */
const ISparkle = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="#1C1E26">
    <path d="M7.657 6.247c.11-.33.576-.33.686 0l.645 1.937a2.89 2.89 0 0 0 1.829 1.828l1.936.645c.33.11.33.576 0 .686l-1.937.645a2.89 2.89 0 0 0-1.828 1.829l-.645 1.936a.361.361 0 0 1-.686 0l-.645-1.937a2.89 2.89 0 0 0-1.828-1.828l-1.937-.645a.361.361 0 0 1 0-.686l1.937-.645a2.89 2.89 0 0 0 1.828-1.829l.645-1.936zM3.794 1.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.61.955 1.128 1.128l1.162.387a.217.217 0 0 1 0 .412l-1.162.387A1.734 1.734 0 0 0 4.593 5.75l-.387 1.162a.217.217 0 0 1-.412 0L3.407 5.75a1.734 1.734 0 0 0-1.127-1.128l-1.163-.387a.217.217 0 0 1 0-.412l1.163-.387a1.734 1.734 0 0 0 1.127-1.128l.387-1.162z"/>
  </svg>
)
const IClose = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="#78716c">
    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
  </svg>
)
const ICopy = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="#78716c">
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

function computeWordDiff(oldText: string, newText: string) {
  const oldWords = oldText.split(/(\s+)/)
  const newWords = newText.split(/(\s+)/)

  let prefixLen = 0
  while (prefixLen < oldWords.length && prefixLen < newWords.length && oldWords[prefixLen] === newWords[prefixLen]) prefixLen++

  let oldSuffix = oldWords.length - 1
  let newSuffix = newWords.length - 1
  while (oldSuffix >= prefixLen && newSuffix >= prefixLen && oldWords[oldSuffix] === newWords[newSuffix]) { oldSuffix--; newSuffix-- }

  const parts: { type: 'same' | 'del' | 'add'; text: string }[] = []
  if (prefixLen > 0) parts.push({ type: 'same', text: oldWords.slice(0, prefixLen).join('') })
  const deleted = oldWords.slice(prefixLen, oldSuffix + 1).join('')
  const added = newWords.slice(prefixLen, newSuffix + 1).join('')
  if (deleted) parts.push({ type: 'del', text: deleted })
  if (added) parts.push({ type: 'add', text: added })
  const suffixStart = oldSuffix + 1
  if (suffixStart < oldWords.length) parts.push({ type: 'same', text: oldWords.slice(suffixStart).join('') })
  return parts
}

export default function Rewrite({ selectedText, originalRange, onClose }: RewriteProps) {
  const [tone, setTone] = useState<Tone>('Casual')
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [showDiff, setShowDiff] = useState(false)
  const [inserted, setInserted] = useState(false)
  const customRef = useRef<HTMLInputElement>(null)
  const originalContentRef = useRef<string | null>(null)

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
      originalContentRef.current = originalRange.toString()
      originalRange.deleteContents()

      const blockquote = document.createElement('blockquote')
      blockquote.setAttribute('data-inline-citation', 'true')
      blockquote.style.cssText =
        'border-left:4px solid #1C1E26;padding:8px 16px;margin:8px 0;' +
        'background:rgba(253,251,247,0.95);border-radius:0 8px 8px 0;' +
        'font-style:normal;line-height:1.6;'

      blockquote.appendChild(document.createTextNode(result))

      const attr = document.createElement('span')
      attr.className = 'inline-cite-attr'
      attr.style.cssText =
        'display:block;font-size:10px;color:#78716c;margin-top:6px;font-style:italic;'
      attr.textContent = `via Inline · ${new Date().toLocaleString()}`
      blockquote.appendChild(attr)

      originalRange.insertNode(blockquote)
      setInserted(true)
    } catch { /* range may be invalid if user navigated away */ }
  }

  function handleUndo() {
    if (!originalContentRef.current || !originalRange) return
    try {
      originalRange.deleteContents()
      originalRange.insertNode(document.createTextNode(originalContentRef.current))
      originalContentRef.current = null
      setInserted(false)
    } catch { /* range may be invalid */ }
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
        width: 252, background: C.bg, border: `1px solid ${C.border}`,
        borderRadius: C.radius, boxShadow: C.shadow, fontFamily: FONT,
        overflow: 'hidden', userSelect: 'none',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', background: C.headerBg,
          borderBottom: `1px solid ${C.divider}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ISparkle />
            <span style={{ fontSize: 13, fontWeight: 500, color: C.accent, letterSpacing: '-0.02em' }}>Rewrite</span>
          </div>
          <button type="button" onClick={onClose} style={btnIcon}><IClose /></button>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 18px 20px' }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: C.text, letterSpacing: '-0.02em' }}>Make any page yours</p>
          <p style={{ margin: '8px 0 18px', fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>
            Use AI tools to speed your workflow.
          </p>

          {/* Tone selector */}
          <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 500, color: C.text }}>Tone</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
            {TONES.map(t => (
              <button key={t} type="button" onClick={() => setTone(t)} style={{
                padding: '8px 16px', borderRadius: C.radiusPill,
                border: `1.5px solid ${tone === t ? C.accent : C.border}`,
                background: tone === t ? C.toneSelectedBg : C.surfaceBubble,
                color: tone === t ? C.accent : C.text,
                fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: FONT,
                boxShadow: tone === t ? C.shadowSoft : 'none',
                transition: 'background 0.15s, box-shadow 0.15s, border-color 0.15s',
              }}>{t}</button>
            ))}
          </div>

          {/* Actions */}
          {(['Rephrase', 'Shorten', 'Summarize'] as const).map(a => (
            <button key={a} type="button"
              onClick={() => runTask(a.toLowerCase(), `Tone: ${tone}`)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '11px 14px', border: 'none', borderRadius: C.radiusPill,
                background: 'transparent', fontSize: 13, color: C.text,
                cursor: 'pointer', fontWeight: 500, marginBottom: 6, fontFamily: FONT,
                transition: 'background 0.18s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = C.hoverBg)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >{a}</button>
          ))}

          {/* Template chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 0' }}>
            {PROMPT_TEMPLATES.map(t => (
              <button key={t.id} type="button"
                onClick={() => runTask('rewrite', t.prompt)}
                style={{
                  padding: '6px 12px', borderRadius: C.radiusPill,
                  border: `1px solid ${C.border}`, background: C.surfaceBubble,
                  fontSize: 11, fontWeight: 500, cursor: 'pointer',
                  color: C.text, fontFamily: FONT,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = C.hoverBg)}
                onMouseLeave={e => (e.currentTarget.style.background = C.surfaceBubble)}
              >{t.label}</button>
            ))}
          </div>

          {/* Custom prompt */}
          <div style={{ marginTop: 14, position: 'relative' }}>
            <input
              ref={customRef}
              value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && customPrompt.trim()) runTask('rewrite', customPrompt) }}
              placeholder="Custom prompt"
              style={{
                width: '100%', boxSizing: 'border-box', padding: '11px 16px',
                border: `1px solid ${C.border}`, borderRadius: C.radiusPill,
                fontSize: 13, outline: 'none', color: C.text,
                fontFamily: FONT, background: C.inputBg,
                boxShadow: C.shadowSoft,
                transition: 'border-color 0.15s',
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 16px', borderTop: `1px solid ${C.divider}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: C.surfaceMuted,
        }}>
          <span style={{ fontSize: 11, color: C.textLight, fontWeight: 500 }}>By Inline</span>
          <span style={{ fontSize: 11, color: C.textLight }}>⠿</span>
        </div>
      </div>
    )
  }

  /* ─── Result / Loading state ─── */
  return (
    <div style={{
      width: 288, background: C.bg, border: `1px solid ${C.border}`,
      borderRadius: C.radius, boxShadow: C.shadow, fontFamily: FONT,
      overflow: 'hidden', userSelect: 'none',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', background: C.headerBg,
        borderBottom: `1px solid ${C.divider}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ISparkle />
          <span style={{ fontSize: 13, fontWeight: 500, color: C.accent, letterSpacing: '-0.02em' }}>Rewrite</span>
        </div>
        <button type="button" onClick={onClose} style={btnIcon}><IClose /></button>
      </div>

      {/* Result body */}
      <div style={{ padding: 18 }}>
        <div style={{
          padding: 16, border: `1px solid ${C.border}`, borderRadius: C.radiusMd,
          fontSize: 13, lineHeight: 1.65, color: C.text, minHeight: 72,
          background: C.surfaceBubble, boxShadow: C.shadowSoft,
        }}>
          {loading ? (
            <span style={{ color: C.textMuted, fontStyle: 'italic' }}>Generating…</span>
          ) : showDiff && result ? (
            <span>
              {computeWordDiff(selectedText, result).map((p, i) =>
                p.type === 'del' ? (
                  <span key={i} style={{ color: '#ef4444', textDecoration: 'line-through', background: 'rgba(239,68,68,0.08)' }}>{p.text}</span>
                ) : p.type === 'add' ? (
                  <span key={i} style={{ color: '#22c55e', background: 'rgba(34,197,94,0.08)' }}>{p.text}</span>
                ) : (
                  <span key={i}>{p.text}</span>
                )
              )}
            </span>
          ) : result}
        </div>

        {/* Action row */}
        {!loading && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14, alignItems: 'center' }}>
            <button type="button" onClick={handleRetry} style={pillBtn}>Retry</button>
            <button type="button" onClick={() => { setResult(null); setShowDiff(false); setInserted(false); customRef.current?.focus() }} style={pillBtn}>Refine</button>
            <button type="button" onClick={() => setShowDiff(d => !d)} style={pillBtn}>{showDiff ? 'Hide diff' : 'Show diff'}</button>
            {!inserted ? (
              <button type="button" onClick={handleInsert} style={{
                ...pillBtn, background: C.accent, color: '#fff', borderColor: C.accent, fontWeight: 600,
                boxShadow: C.shadowSoft,
              }}>Insert</button>
            ) : (
              <button type="button" onClick={handleUndo} style={{
                ...pillBtn, background: '#ef4444', color: '#fff', borderColor: '#ef4444', fontWeight: 500,
                boxShadow: C.shadowSoft,
              }}>Undo</button>
            )}
            <button type="button" onClick={handleCopy} style={{ ...btnIcon, marginLeft: 'auto' }}><ICopy /></button>
          </div>
        )}

        {/* Custom prompt for refine */}
        <input
          placeholder="Customize with prompt"
          value={customPrompt}
          onChange={e => setCustomPrompt(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && customPrompt.trim()) runTask('rewrite', customPrompt) }}
          style={{
            width: '100%', boxSizing: 'border-box', marginTop: 14,
            padding: '11px 16px', border: `1px solid ${C.border}`, borderRadius: C.radiusPill,
            fontSize: 13, outline: 'none', color: C.text,
            fontFamily: FONT, background: C.inputBg, boxShadow: C.shadowSoft,
          }}
        />
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 16px', borderTop: `1px solid ${C.divider}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: C.surfaceMuted,
      }}>
        <span style={{ fontSize: 11, color: C.textLight, fontWeight: 500 }}>By Inline</span>
        <span style={{ fontSize: 11, color: C.textLight }}>⠿</span>
      </div>
    </div>
  )
}

/* shared button styles */
const btnIcon: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 32, height: 32, border: 'none', borderRadius: C.radiusSm,
  background: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: 0,
  transition: 'background 0.15s',
}

const pillBtn: React.CSSProperties = {
  padding: '8px 18px', borderRadius: C.radiusPill,
  border: `1px solid ${C.border}`, background: C.surfaceBubble,
  fontSize: 12, fontWeight: 500, cursor: 'pointer',
  color: C.text, fontFamily: FONT,
  boxShadow: C.shadowSoft,
  transition: 'transform 0.15s ease, background 0.15s',
}
