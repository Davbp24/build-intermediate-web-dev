import { useState, useEffect, useCallback, useRef } from 'react'
import StickyNote, { PALETTE } from './StickyNote'
import {
  generateNoteId,
  type StickyNoteData,
} from './storage'

const PAGE_URL = window.location.href
const SAVE_DEBOUNCE_MS = 500

/* ─── eye icon ─── */
const IEye = ({ crossed }: { crossed?: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    {!crossed ? (
      <>
        <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
        <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
      </>
    ) : (
      <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709zm-3.283-3.283L10 7.879A2 2 0 0 1 7.879 10l-.076.076zM2.64 1.933l-.708.707L4.29 5.006A7.023 7.023 0 0 0 2 8s3 5.5 8 5.5a7.03 7.03 0 0 0 3.79-1.102l1.342 1.342.708-.707L2.64 1.933zM5.999 12.467A5.944 5.944 0 0 1 8 12.5c2.12 0 3.879-1.168 5.168-2.457A13.135 13.135 0 0 0 14.828 8c-.058-.087-.122-.183-.195-.288-.335-.48-.83-1.12-1.465-1.755a9.32 9.32 0 0 0-.517-.486L5.999 12.467z"/>
    )}
  </svg>
)

const IPlus = () => (
  <svg width="16" height="16" viewBox="0 0 16 16">
    <line x1="8" y1="3" x2="8" y2="13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="3" y1="8" x2="13" y2="8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
)

/* ─── blue palette for new note ─── */
const NEXT_COLOR = (() => {
  let i = 0
  return () => { const c = PALETTE[i % PALETTE.length].bg; i++; return c }
})()

export default function StickyNotesManager() {
  const [notes, setNotes] = useState<StickyNoteData[]>([])
  const [loaded, setLoaded] = useState(false)
  const [visible, setVisible] = useState(true)
  const [hovered, setHovered] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // --- Mark as loaded on mount (retrieval from Supabase will be added later) ---
  useEffect(() => {
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return

    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
    }
    saveTimer.current = setTimeout(() => {
      chrome.runtime.sendMessage(
        {
          type: 'SAVE_ANNOTATIONS',
          payload: { pageUrl: PAGE_URL, featureKey: 'stickyNotes', data: notes },
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error('[Inline] Message failed:', chrome.runtime.lastError.message)
          } else if (!response?.ok) {
            console.error('[Inline] Backend sync failed:', response?.error)
          }
        },
      )
    }, SAVE_DEBOUNCE_MS)

    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
      }
    }
  }, [notes, loaded])

  const handleAddNote = useCallback(() => {
    const now = Date.now()
    const offset = notes.length * 18
    setNotes(prev => [...prev, {
      id: generateNoteId(),
      pageUrl: PAGE_URL,
      x: Math.min(window.innerWidth - 260, window.innerWidth / 2 - 120 + offset),
      y: Math.min(window.innerHeight - 220, window.innerHeight / 2 - 100 + offset),
      width: 240,
      height: 190,
      content: '',
      color: NEXT_COLOR(),
      title: 'Note',
      createdAt: now,
      updatedAt: now,
    }])
  }, [notes.length])

  const handleUpdateNote = useCallback(
    (id: string, updates: Partial<StickyNoteData>) =>
      setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n)),
    [],
  )

  const handleDeleteNote = useCallback(
    (id: string) => setNotes(prev => prev.filter(n => n.id !== id)),
    [],
  )

  return (
    <>
      {visible && notes.map(note => (
        <StickyNote key={note.id} note={note} onUpdate={handleUpdateNote} onDelete={handleDeleteNote} />
      ))}

      {/* ── bottom-right launcher ── */}
      <div
        className="add-note-launcher"
        style={{
          position: 'fixed',
          right: 20,
          bottom: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 10,
          zIndex: 2147483647,
          pointerEvents: 'auto',
        }}
      >

        {/* eye button — always fixed at the bottom, only toggles note visibility */}
        <button
          type="button"
          className="launcher-eye"
          onClick={() => setVisible(v => !v)}
          title={visible ? 'Hide notes' : 'Show notes'}
        >
          <IEye crossed={!visible} />
        </button>

        {/* + button — always visible, expands leftward on hover */}
        <button
          type="button"
          className="launcher-add"
          onClick={handleAddNote}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 48,
            borderRadius: 999,
            background: '#6A8EBE',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            width: hovered ? 140 : 48,
            padding: hovered ? '0 14px' : '0',
          }}
          title="Add sticky note"
        >
          <IPlus />
          <span
            style={{
              opacity: hovered ? 1 : 0,
              marginLeft: hovered ? 8 : 0,
              transform: hovered ? 'translateX(0)' : 'translateX(8px)',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
          >
            Add Note
          </span>
        </button>

        
      </div>
    </>
  )
}
