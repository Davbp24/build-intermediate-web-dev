import { useState, useCallback, useRef, useEffect } from 'react'
import { PANEL as C, FONT } from '../lib/extensionTheme'
import { loadSettings } from '../lib/extensionSettings'

const IClose = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="#78716c">
    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
  </svg>
)

const ISearch = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="#78716c">
    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
  </svg>
)

interface SearchResult {
  id: string
  page_url: string
  page_title: string
  content: string
  type: string
  created_at: string
}

interface SearchProps {
  onClose: () => void
}

export default function Search({ onClose }: SearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searchAll, setSearchAll] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const searchBackend = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    try {
      const { apiBaseUrl, accessToken } = await loadSettings()
      const h: Record<string, string> = {}
      if (accessToken) h.Authorization = `Bearer ${accessToken}`
      const res = await fetch(
        `${apiBaseUrl}/api/search?q=${encodeURIComponent(q)}`,
        { headers: h },
      )
      if (res.ok) {
        const json = await res.json() as { results: SearchResult[] }
        setResults(json.results ?? [])
      }
    } catch { /* network error */ }
    finally { setLoading(false) }
  }, [])

  const searchLocal = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    try {
      const pageUrl = window.location.href
      const response = await new Promise<{ ok: boolean; data?: any }>((resolve) => {
        if (!chrome.runtime?.id) { resolve({ ok: false }); return }
        chrome.runtime.sendMessage(
          { type: 'LOAD_ANNOTATIONS', payload: { pageUrl } },
          (res) => resolve(res ?? { ok: false }),
        )
      })
      if (response.ok && response.data) {
        const annotations = response.data as Record<string, any>
        const matched: SearchResult[] = []
        const lowerQ = q.toLowerCase()

        for (const [key, value] of Object.entries(annotations)) {
          if (typeof value === 'object' && value !== null) {
            const str = JSON.stringify(value).toLowerCase()
            if (str.includes(lowerQ)) {
              matched.push({
                id: key,
                page_url: pageUrl,
                page_title: document.title,
                content: typeof value === 'string' ? value : JSON.stringify(value).slice(0, 200),
                type: 'annotation',
                created_at: new Date().toISOString(),
              })
            }
          }
        }
        setResults(matched)
      }
    } catch { /* network error */ }
    finally { setLoading(false) }
  }, [])

  const handleInput = useCallback((value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (searchAll) searchBackend(value)
      else searchLocal(value)
    }, 300)
  }, [searchAll, searchBackend, searchLocal])

  const handleToggle = useCallback((v: boolean) => {
    setSearchAll(v)
    if (query.trim()) {
      if (v) searchBackend(query)
      else searchLocal(query)
    }
  }, [query, searchBackend, searchLocal])

  const snippet = (text: string) => {
    const max = 120
    if (text.length <= max) return text
    const lower = text.toLowerCase()
    const idx = lower.indexOf(query.toLowerCase())
    if (idx < 0) return text.slice(0, max) + '…'
    const start = Math.max(0, idx - 40)
    return (start > 0 ? '…' : '') + text.slice(start, start + max) + '…'
  }

  return (
    <div style={{
      width: 280, background: C.bg, border: `1px solid ${C.border}`,
      borderRadius: C.radius, boxShadow: C.shadow, fontFamily: FONT,
      overflow: 'hidden', userSelect: 'none', display: 'flex', flexDirection: 'column',
      maxHeight: 480,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', background: C.headerBg,
        borderBottom: `1px solid ${C.divider}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ISearch />
          <span style={{ fontSize: 13, fontWeight: 500, color: C.accent, letterSpacing: '-0.02em' }}>Search</span>
        </div>
        <button type="button" onClick={onClose} style={btnIcon}><IClose /></button>
      </div>

      {/* Search input */}
      <div style={{ padding: '14px 16px 10px' }}>
        <input
          ref={inputRef}
          value={query}
          onChange={e => handleInput(e.target.value)}
          placeholder="Search notes…"
          style={{
            width: '100%', boxSizing: 'border-box', padding: '10px 16px',
            border: `1px solid ${C.border}`, borderRadius: C.radiusPill,
            fontSize: 13, outline: 'none', color: C.text,
            fontFamily: FONT, background: C.inputBg, boxShadow: C.shadowSoft,
          }}
        />
        <label style={{
          display: 'flex', alignItems: 'center', gap: 8, marginTop: 10,
          fontSize: 12, color: C.textMuted, cursor: 'pointer', fontWeight: 500,
        }}>
          <input
            type="checkbox"
            checked={searchAll}
            onChange={e => handleToggle(e.target.checked)}
            style={{ accentColor: C.accent }}
          />
          Search all pages
        </label>
      </div>

      {/* Results */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 14px' }}>
        {loading && (
          <p style={{ fontSize: 12, color: C.textMuted, fontStyle: 'italic', margin: '8px 0' }}>
            Searching…
          </p>
        )}
        {!loading && query.trim() && results.length === 0 && (
          <p style={{ fontSize: 12, color: C.textMuted, margin: '8px 0' }}>
            No results found.
          </p>
        )}
        {results.map(r => (
          <div key={r.id} style={{
            padding: '10px 12px', marginBottom: 8,
            border: `1px solid ${C.border}`, borderRadius: C.radiusMd,
            background: C.surfaceBubble, boxShadow: C.shadowSoft,
            cursor: 'pointer',
          }}
            onClick={() => {
              if (r.page_url) window.open(r.page_url, '_blank')
            }}
          >
            <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: C.text, lineHeight: 1.4 }}>
              {r.page_title || 'Untitled'}
            </p>
            <p style={{
              margin: '4px 0 0', fontSize: 11, color: C.textMuted, lineHeight: 1.5,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {snippet(r.content)}
            </p>
            {r.page_url && (
              <p style={{ margin: '4px 0 0', fontSize: 10, color: C.textLight, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.page_url}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const btnIcon: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 32, height: 32, border: 'none', borderRadius: 12,
  background: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: 0,
}
