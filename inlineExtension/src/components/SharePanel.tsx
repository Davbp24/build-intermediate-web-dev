import { useState, useCallback } from 'react'
import { PANEL as C, FONT } from '../lib/extensionTheme'

const IShare = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1C1E26" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
)
const IClose = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="#78716c">
    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
  </svg>
)
const ICopy = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

const LAYER_OPTIONS = [
  { key: 'highlights', label: 'Highlights' },
  { key: 'drawPaths', label: 'Drawings' },
  { key: 'stickies', label: 'Sticky notes' },
  { key: 'stamps', label: 'Stamps' },
  { key: 'handwriting', label: 'Handwriting' },
] as const

interface SharePanelProps {
  onClose: () => void
}

export default function SharePanel({ onClose }: SharePanelProps) {
  const [layers, setLayers] = useState<Record<string, boolean>>(
    Object.fromEntries(LAYER_OPTIONS.map(l => [l.key, true])),
  )
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const toggleLayer = useCallback((key: string) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const handleShare = useCallback(() => {
    setLoading(true)
    setError(null)
    const selectedLayers = Object.entries(layers)
      .filter(([, v]) => v)
      .map(([k]) => k)

    try {
      chrome.runtime.sendMessage(
        {
          type: 'SHARE_ANNOTATIONS',
          payload: { pageUrl: window.location.href, layers: selectedLayers },
        },
        (response) => {
          setLoading(false)
          if (chrome.runtime.lastError) {
            setError('Extension error')
            return
          }
          if (!response?.ok) {
            setError(response?.error ?? 'Failed to create share link')
            return
          }
          setShareUrl(response.shareUrl)
        },
      )
    } catch {
      setLoading(false)
      setError('Extension context unavailable')
    }
  }, [layers])

  const handleCopy = useCallback(() => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [shareUrl])

  return (
    <div style={{
      width: 220, background: C.bg, border: `1px solid ${C.border}`,
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
          <IShare />
          <span style={{ fontSize: 13, fontWeight: 500, color: C.accent, letterSpacing: '-0.02em' }}>Share</span>
        </div>
        <button type="button" onClick={onClose} style={btnIcon}><IClose /></button>
      </div>

      {/* Layer checkboxes */}
      <div style={{ padding: '14px 16px 8px' }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: C.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Include layers
        </div>
        {LAYER_OPTIONS.map(l => (
          <label key={l.key} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '5px 0', cursor: 'pointer', fontSize: 13, color: C.text,
          }}>
            <input
              type="checkbox"
              checked={layers[l.key]}
              onChange={() => toggleLayer(l.key)}
              style={{ accentColor: C.accent, width: 15, height: 15, cursor: 'pointer' }}
            />
            {l.label}
          </label>
        ))}
      </div>

      <div style={{ padding: '0 16px 16px' }}>
        {!shareUrl ? (
          <button
            type="button"
            onClick={handleShare}
            disabled={loading}
            style={{
              width: '100%', padding: '10px 0', fontSize: 13, fontWeight: 500,
              borderRadius: C.radiusSm, border: 'none',
              background: C.accent, color: '#fff', cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.6 : 1, transition: 'opacity 0.15s',
              letterSpacing: '-0.01em',
            }}
          >
            {loading ? 'Creating link...' : 'Share annotations'}
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: C.surfaceMuted, borderRadius: C.radiusSm,
              padding: '8px 10px', border: `1px solid ${C.divider}`,
            }}>
              <input
                readOnly
                value={shareUrl}
                style={{
                  flex: 1, border: 'none', background: 'transparent',
                  fontSize: 11, color: C.text, fontFamily: FONT,
                  outline: 'none', minWidth: 0,
                }}
              />
              <button
                type="button"
                onClick={handleCopy}
                title="Copy link"
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 30, height: 30, border: `1px solid ${C.border}`,
                  borderRadius: C.radiusSm, background: C.surfaceBubble,
                  cursor: 'pointer', color: copied ? '#16a34a' : C.textMuted,
                  transition: 'color 0.15s', padding: 0, flexShrink: 0,
                }}
              >
                <ICopy />
              </button>
            </div>
            <div style={{ fontSize: 11, color: copied ? '#16a34a' : C.textLight, textAlign: 'center' }}>
              {copied ? 'Copied to clipboard!' : 'Anyone with this link can view your annotations'}
            </div>
          </div>
        )}

        {error && (
          <div style={{ fontSize: 11, color: '#dc2626', marginTop: 8, textAlign: 'center' }}>
            {error}
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
