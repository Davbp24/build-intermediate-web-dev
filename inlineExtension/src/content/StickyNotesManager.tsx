import { useState, useEffect, useCallback, useRef } from 'react'
import StickyNote from './StickyNote'
import {
  loadNotes,
  saveNotes,
  generateNoteId,
  type StickyNoteData,
} from './storage'

const PAGE_URL = window.location.href

/** Default color for new sticky notes */
const DEFAULT_COLOR = '#FFEB3B'

/** Debounce delay for saving to storage (ms) */
const SAVE_DEBOUNCE_MS = 500

export default function StickyNotesManager() {
  const [notes, setNotes] = useState<StickyNoteData[]>([])
  const [loaded, setLoaded] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // --- Load notes on mount ---
  useEffect(() => {
    loadNotes(PAGE_URL).then((savedNotes) => {
      setNotes(savedNotes)
      setLoaded(true)
    })
  }, [])

  // --- Debounced save whenever notes change (after initial load) ---
  useEffect(() => {
    if (!loaded) return

    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
    }
    saveTimer.current = setTimeout(() => {
      saveNotes(PAGE_URL, notes)
    }, SAVE_DEBOUNCE_MS)

    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
      }
    }
  }, [notes, loaded])

  // --- Create a new note ---
  const handleAddNote = useCallback(() => {
    const now = Date.now()
    const newNote: StickyNoteData = {
      id: generateNoteId(),
      pageUrl: PAGE_URL,
      x: window.innerWidth / 2 - 110,
      y: window.innerHeight / 2 - 80,
      width: 220,
      height: 160,
      content: '',
      color: DEFAULT_COLOR,
      createdAt: now,
      updatedAt: now,
    }
    setNotes((prev) => [...prev, newNote])
  }, [])

  // --- Update a note ---
  const handleUpdateNote = useCallback(
    (id: string, updates: Partial<StickyNoteData>) => {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n,
        ),
      )
    },
    [],
  )

  // --- Delete a note ---
  const handleDeleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }, [])

  return (
    <>
      {/* Render all sticky notes */}
      {notes.map((note) => (
        <StickyNote
          key={note.id}
          note={note}
          onUpdate={handleUpdateNote}
          onDelete={handleDeleteNote}
        />
      ))}

    </>
  )
}
