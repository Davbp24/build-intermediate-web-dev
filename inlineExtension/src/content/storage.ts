/**
 * Sticky Note Storage Layer
 *
 * Currently uses chrome.storage.local for persistence.
 * This module is the ONLY place that touches the storage backend,
 * so swapping to Supabase later means changing ONLY this file.
 *
 * TODO: Replace chrome.storage.local calls with Supabase client
 * when the backend is ready. The interface (loadNotes, saveNotes,
 * deleteNote) stays the same — only the implementation changes.
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
  mediaTimestamp?: number
}

/**
 * Normalize a URL to a consistent storage key.
 * Strips query params, hash, and trailing slash so the same
 * page always maps to the same key.
 */
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    return `${parsed.origin}${parsed.pathname}`.replace(/\/$/, '')
  } catch {
    return url
  }
}

/** Build the chrome.storage key for a given page URL */
function storageKey(pageUrl: string): string {
  return `stickyNotes:${normalizeUrl(pageUrl)}`
}

/**
 * Load all sticky notes for a given page URL.
 * Returns an empty array if no notes are saved.
 */
export async function loadNotes(pageUrl: string): Promise<StickyNoteData[]> {
  const key = storageKey(pageUrl)

  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      const notes = result[key]
      if (Array.isArray(notes)) {
        resolve(notes as StickyNoteData[])
      } else {
        resolve([])
      }
    })
  })
}

/**
 * Save all sticky notes for a given page URL.
 * Overwrites the entire array for that URL.
 */
export async function saveNotes(pageUrl: string, notes: StickyNoteData[]): Promise<void> {
  const key = storageKey(pageUrl)

  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: notes }, () => {
      resolve()
    })
  })
}

/**
 * Delete a single sticky note by ID for a given page URL.
 * Loads existing notes, filters out the target, and saves back.
 */
export async function deleteNote(pageUrl: string, noteId: string): Promise<void> {
  const notes = await loadNotes(pageUrl)
  const filtered = notes.filter((n) => n.id !== noteId)
  await saveNotes(pageUrl, filtered)
}

/**
 * Generate a unique ID for a new sticky note.
 * Uses crypto.randomUUID() which is available in modern browsers.
 */
export function generateNoteId(): string {
  return crypto.randomUUID()
}
