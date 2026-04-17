import { useState, useRef, useCallback } from 'react'
import { wrapSelectionWithHighlight } from '../content/highlightWrap'
import { loadSettings } from '../lib/extensionSettings'
import { speakWithElevenLabs, stopSpeaking } from '../lib/elevenLabsTts'
import { PANEL as C, FONT } from '../lib/extensionTheme'
import { PROMPT_TEMPLATES } from '../lib/promptTemplates'
import { fetchViaBackground } from '../lib/backgroundFetch'
import { saveAIResultToHistory } from '../lib/historyApi'
import { buildAIInsertMark } from '../lib/insertBadge'

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
const IVolume = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#78716c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
  </svg>
)
const IVolumeOff = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
  </svg>
)

interface AIProps {
  selectedText: string
  originalRange: Range | null
  onClose: () => void
}

export default function AI({ selectedText, originalRange, onClose }: AIProps) {
  const [customPrompt, setCustomPrompt] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [lastTask, setLastTask] = useState<string>('')
  const [lastInstruction, setLastInstruction] = useState<string | undefined>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSpeak() {
    if (speaking) { stopSpeaking(); setSpeaking(false); return }
    if (!result) return
    void speakWithElevenLabs(result, { onStart: () => setSpeaking(true), onEnd: () => setSpeaking(false) })
  }

  const runTask = useCallback(async (task: string, instruction?: string) => {
    wrapSelectionWithHighlight(task)
    setLoading(true)
    setResult(null)
    setLastTask(task)
    setLastInstruction(instruction)
    try {
      const text = selectedText.slice(0, 8000)
      const { apiBaseUrl, accessToken } = await loadSettings()
      const h: Record<string, string> = { 'Content-Type': 'application/json' }
      if (accessToken) h.Authorization = `Bearer ${accessToken}`
      const res = await fetchViaBackground(`${apiBaseUrl}/api/ai/extension-light`, {
        method: 'POST', headers: h,
        body: JSON.stringify({ task, text, instruction }),
      })
      if (res.ok) {
        const j = await res.json<{ result?: string }>()
        const output = j.result ?? 'No result returned.'
        setResult(output)
        if (j.result) {
          const kindMap: Record<string, 'ai-rephrase' | 'ai-shorten' | 'ai-summarize' | 'ai-rewrite' | 'ai-custom'> = {
            rephrase:  'ai-rephrase',
            shorten:   'ai-shorten',
            summarize: 'ai-summarize',
            rewrite:   instruction ? 'ai-custom' : 'ai-rewrite',
          }
          void saveAIResultToHistory({
            kind: kindMap[task] ?? 'ai-custom',
            selection: text,
            result: output,
          })
        }
      } else {
        setResult('AI request failed. Check settings.')
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
      const mark = buildAIInsertMark(result, lastTask, lastInstruction)
      originalRange.insertNode(mark)
    } catch { /* range may be invalid if user navigated away */ }
    onClose()
  }

  function handleCopy() {
    if (result) navigator.clipboard.writeText(result)
  }

  /* ─── Input form (before result) ─── */
  if (!result && !loading) {
    return (
      <div style={{
        width: 204, background: C.bg, border: `1px solid ${C.border}`,
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
            <span style={{ fontSize: 13, fontWeight: 500, color: C.accent, letterSpacing: '-0.02em' }}>Ask AI</span>
          </div>
          <button type="button" onClick={onClose} title="Close" aria-label="Close" style={btnIcon}><IClose /></button>
        </div>

        {/* Actions */}
        <div style={{ padding: '12px 12px 8px' }}>
          {(['Rephrase', 'Shorten', 'Summarize'] as const).map(a => (
            <button key={a} type="button"
              onClick={() => void runTask(a.toLowerCase())}
              title={a}
              aria-label={a}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '11px 14px', border: 'none', borderRadius: C.radiusPill,
                background: 'transparent', fontSize: 13, color: C.text,
                cursor: 'pointer', fontWeight: 500, fontFamily: FONT,
                marginBottom: 6,
                transition: 'background 0.18s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = C.hoverBg)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >{a}</button>
          ))}
        </div>

        {/* Template chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 12px' }}>
          {PROMPT_TEMPLATES.map(t => (
            <button key={t.id} type="button"
              onClick={() => void runTask('rewrite', t.prompt)}
              title={t.label}
              aria-label={t.label}
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
        <div style={{ padding: '4px 14px 16px' }}>
          <input
            ref={inputRef}
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && customPrompt.trim()) void runTask('rewrite', customPrompt) }}
            placeholder="Custom prompt"
            style={{
              width: '100%', boxSizing: 'border-box', padding: '11px 16px',
              border: `1px solid ${C.border}`, borderRadius: C.radiusPill,
              fontSize: 13, outline: 'none', color: C.text,
              fontFamily: FONT, background: C.inputBg, boxShadow: C.shadowSoft,
            }}
          />
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
          <span style={{ fontSize: 13, fontWeight: 500, color: C.accent, letterSpacing: '-0.02em' }}>Ask AI</span>
        </div>
        <button type="button" onClick={onClose} title="Close" aria-label="Close" style={btnIcon}><IClose /></button>
      </div>

      {/* Result body */}
      <div style={{ padding: 18 }}>
        <div style={{
          padding: 16, border: `1px solid ${C.border}`, borderRadius: C.radiusMd,
          fontSize: 13, lineHeight: 1.65, color: C.text, minHeight: 72,
          background: C.surfaceBubble, boxShadow: C.shadowSoft,
          maxHeight: 260, overflowY: 'auto',
        }}>
          {loading ? (
            <span style={{ color: C.textMuted, fontStyle: 'italic' }}>Generating…</span>
          ) : result}
        </div>

        {/* Action row */}
        {!loading && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14, alignItems: 'center' }}>
            <button type="button" onClick={() => setResult(null)} title="Back" aria-label="Back" style={pillBtn}>Back</button>
            <button type="button" onClick={handleInsert} title="Insert into page" aria-label="Insert into page" style={{
              ...pillBtn, background: C.accent, color: '#fff', borderColor: C.accent, fontWeight: 600,
              boxShadow: C.shadowSoft,
            }}>Insert</button>
            <button type="button" onClick={handleSpeak} title={speaking ? 'Stop speaking' : 'Speak'} aria-label={speaking ? 'Stop speaking' : 'Speak'} style={{ ...btnIcon, marginLeft: 'auto' }}>{speaking ? <IVolumeOff /> : <IVolume />}</button>
            <button type="button" onClick={handleCopy} title="Copy" aria-label="Copy" style={btnIcon}><ICopy /></button>
          </div>
        )}
      </div>
    </div>
  )
}

const btnIcon: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 32, height: 32, border: 'none', borderRadius: C.radiusSm,
  background: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: 0,
}

const pillBtn: React.CSSProperties = {
  padding: '8px 18px', borderRadius: C.radiusPill,
  border: `1px solid ${C.border}`, background: C.surfaceBubble,
  fontSize: 12, fontWeight: 500, cursor: 'pointer',
  color: C.text, fontFamily: FONT,
  boxShadow: C.shadowSoft,
  transition: 'transform 0.15s ease, background 0.15s',
}
