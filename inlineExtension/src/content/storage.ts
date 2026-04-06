/**
 * Sticky Note Storage Layer (legacy)
 *
 * Used by the old StickyNotesManager / StickyNote components.
 * The active note system now lives in Home.tsx + Notes.tsx and saves
 * directly via SAVE_ANNOTATIONS. This file is kept for type exports.
 */

export interface StickyNoteData {
  id: string
  pageUrl: string
  x: number
  y: number
  width: number
  height: number
  content: string
  color: string
  title?: string
  createdAt: number
  updatedAt: number
}

export function generateNoteId(): string {
  return crypto.randomUUID()
}
