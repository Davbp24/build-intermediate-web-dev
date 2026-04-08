import { useState, useEffect, useRef, useCallback } from 'react'
import { PANEL as C, FONT } from '../lib/extensionTheme'

interface Action {
  id: string
  label: string
  icon: React.ReactNode
  shortcut?: string
}

interface CommandPaletteProps {
  onClose: () => void
  onAction: (actionId: string) => void
}

const IRewrite = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
  </svg>
)
const IAi = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"/>
  </svg>
)
const INotes = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <line x1="10" y1="9" x2="8" y2="9"/>
  </svg>
)
const IDraw = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19l7-7 3 3-7 7-3-3z"/>
    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
    <path d="M2 2l7.586 7.586"/>
    <circle cx="11" cy="11" r="2"/>
  </svg>
)
const IHighlight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l-6 6v3h9l3-3"/>
    <path d="M22 12l-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>
  </svg>
)
const ISettings = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
  </svg>
)
const ICollapse = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 14 10 14 10 20"/>
    <polyline points="20 10 14 10 14 4"/>
    <line x1="14" y1="10" x2="21" y2="3"/>
    <line x1="3" y1="21" x2="10" y2="14"/>
  </svg>
)
const IPause = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="4" width="4" height="16"/>
    <rect x="14" y="4" width="4" height="16"/>
  </svg>
)

const ACTIONS: Action[] = [
  { id: 'rewrite', label: 'Rewrite', icon: <IRewrite /> },
  { id: 'ai', label: 'Ask AI', icon: <IAi /> },
  { id: 'notes', label: 'Notes', icon: <INotes /> },
  { id: 'draw', label: 'Draw', icon: <IDraw /> },
  { id: 'highlighter', label: 'Highlighter', icon: <IHighlight /> },
  { id: 'settings', label: 'Settings', icon: <ISettings /> },
  { id: 'collapse', label: 'Collapse Toolbar', icon: <ICollapse /> },
  { id: 'pause', label: 'Pause Extension', icon: <IPause /> },
]

export default function CommandPalette({ onClose, onAction }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const filtered = ACTIONS.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase()),
  )

  useEffect(() => {
    setSelectedIdx(0)
  }, [query])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const row = listRef.current?.children[selectedIdx] as HTMLElement | undefined
    row?.scrollIntoView({ block: 'nearest' })
  }, [selectedIdx])

  const execute = useCallback(
    (id: string) => {
      onAction(id)
      onClose()
    },
    [onAction, onClose],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIdx((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filtered[selectedIdx]) execute(filtered[selectedIdx].id)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    },
    [filtered, selectedIdx, execute, onClose],
  )

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483647,
        pointerEvents: 'auto',
        background: 'rgba(0,0,0,0.18)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: '20vh',
        fontFamily: FONT,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        style={{
          width: 320,
          maxHeight: 400,
          background: C.bg,
          borderRadius: C.radius,
          boxShadow: C.shadow,
          border: `1px solid ${C.border}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Search input */}
        <div style={{ padding: '14px 14px 8px' }}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command…"
            style={{
              width: '100%',
              padding: '10px 16px',
              border: `1px solid ${C.border}`,
              borderRadius: C.radiusPill,
              background: C.inputBg,
              fontSize: 14,
              fontFamily: FONT,
              color: C.text,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: C.divider, margin: '0 14px' }} />

        {/* Action list */}
        <div
          ref={listRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '6px 6px 8px',
          }}
        >
          {filtered.length === 0 && (
            <div
              style={{
                padding: '18px 12px',
                textAlign: 'center',
                color: C.textMuted,
                fontSize: 13,
              }}
            >
              No matching commands
            </div>
          )}
          {filtered.map((action, idx) => (
            <button
              key={action.id}
              onClick={() => execute(action.id)}
              onMouseEnter={() => setSelectedIdx(idx)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '9px 12px',
                border: 'none',
                borderRadius: C.radiusSm,
                background: idx === selectedIdx ? C.hoverBg : 'transparent',
                color: C.text,
                cursor: 'pointer',
                fontFamily: FONT,
                fontSize: 13.5,
                textAlign: 'left',
                transition: 'background 0.1s',
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: C.radiusSm,
                  background: idx === selectedIdx ? C.surfaceMuted : 'transparent',
                  color: C.textMuted,
                  flexShrink: 0,
                  transition: 'background 0.1s',
                }}
              >
                {action.icon}
              </span>
              <span style={{ flex: 1 }}>{action.label}</span>
              {action.shortcut && (
                <span
                  style={{
                    fontSize: 11,
                    color: C.textLight,
                    background: C.surfaceMuted,
                    padding: '2px 7px',
                    borderRadius: 6,
                  }}
                >
                  {action.shortcut}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
