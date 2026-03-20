import { useRef, useCallback, useEffect, useState } from 'react'
import type { StickyNoteData } from './storage'

interface StickyNoteProps {
  note: StickyNoteData
  onUpdate: (id: string, updates: Partial<StickyNoteData>) => void
  onDelete: (id: string) => void
}

export default function StickyNote({ note, onUpdate, onDelete }: StickyNoteProps) {
  const [isDragging, setIsDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const noteRef = useRef<HTMLDivElement>(null)

  // --- Drag handling ---
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      setIsDragging(true)
      dragOffset.current = {
        x: e.clientX - note.x,
        y: e.clientY - note.y,
      }
      // Capture pointer so we get events even outside the element
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [note.x, note.y],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return
      const newX = e.clientX - dragOffset.current.x
      const newY = e.clientY - dragOffset.current.y
      onUpdate(note.id, { x: newX, y: newY })
    },
    [isDragging, note.id, onUpdate],
  )

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // --- Text editing ---
  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onUpdate(note.id, { content: e.target.value })
    },
    [note.id, onUpdate],
  )

  // --- Auto-focus textarea on new notes ---
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    // Focus if the note was just created (empty content, recent timestamp)
    if (!note.content && Date.now() - note.createdAt < 1000) {
      textareaRef.current?.focus()
    }
  }, [note.content, note.createdAt])

  return (
    <div
      ref={noteRef}
      className="sticky-note"
      style={{
        position: 'fixed',
        left: `${note.x}px`,
        top: `${note.y}px`,
        width: `${note.width}px`,
        minHeight: `${note.height}px`,
        backgroundColor: note.color,
        zIndex: isDragging ? 2147483647 : 2147483646,
      }}
    >
      {/* Header bar — drag handle */}
      <div
        className="sticky-note-header"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <span className="sticky-note-title">Note</span>
        <button
          className="sticky-note-delete"
          onClick={() => onDelete(note.id)}
          title="Delete note"
        >
          x
        </button>
      </div>

      {/* Body — editable text area */}
      <textarea
        ref={textareaRef}
        className="sticky-note-body"
        value={note.content}
        onChange={handleContentChange}
        placeholder="Type your note here..."
      />
    </div>
  )
}
