import { useState, useEffect, useCallback, useRef } from 'react'
import StickyNote, { PALETTE } from './StickyNote'
import { loadNotes, saveNotes, generateNoteId, type StickyNoteData } from './storage'

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
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/>
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
  const [expanded, setExpanded] = useState(true)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    loadNotes(PAGE_URL).then(saved => { setNotes(saved); setLoaded(true) })
  }, [])

  useEffect(() => {
    if (!loaded) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveNotes(PAGE_URL, notes), SAVE_DEBOUNCE_MS)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
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
          alignItems: 'center',
          gap: 12,
          zIndex: 2147483647,
          pointerEvents: 'auto',
        }}
      >
        {/* eye button — toggles visibility AND expand/collapse */}
        <button
          type="button"
          className="launcher-eye"
          onClick={() => {
            if (expanded) {
              // collapse: hide the + button and hide notes
              setExpanded(false)
              setVisible(false)
            } else {
              // expand: show + button and show notes
              setExpanded(true)
              setVisible(true)
            }
          }}
          title={expanded ? 'Collapse (hide notes)' : 'Expand (show notes)'}
        >
          <IEye crossed={!expanded} />
        </button>

        {/* + button — only visible when expanded */}
        {expanded && (
          <button
            type="button"
            className="launcher-add"
            onClick={handleAddNote}
            title="Add sticky note"
          >
            <IPlus />
          </button>
        )}
      </div>
    </>
  )
}
