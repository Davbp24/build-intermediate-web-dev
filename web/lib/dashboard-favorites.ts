/**
 * Client-side pinned items on the dashboard (notes + folder documents).
 * Scoped per workspace in localStorage until backed by API.
 */

const NOTES_KEY = 'inline-dashboard-pinned-notes'
const DOCS_KEY = 'inline-dashboard-pinned-docs'

type IdMap = Record<string, string[]>

function loadMap(key: string): IdMap {
  if (typeof window === 'undefined') return {}
  try {
    const r = localStorage.getItem(key)
    const p = r ? JSON.parse(r) : {}
    return p && typeof p === 'object' ? p : {}
  } catch {
    return {}
  }
}

function saveMap(key: string, m: IdMap) {
  localStorage.setItem(key, JSON.stringify(m))
  window.dispatchEvent(new CustomEvent('inline-dashboard-pins-changed'))
}

export function getPinnedNoteIds(workspaceId: string): string[] {
  const raw = loadMap(NOTES_KEY)[workspaceId] ?? []
  return [...new Set(raw)]
}

export function getPinnedDocumentIds(workspaceId: string): string[] {
  const raw = loadMap(DOCS_KEY)[workspaceId] ?? []
  return [...new Set(raw)]
}

export function togglePinnedNote(workspaceId: string, noteId: string): string[] {
  const m = { ...loadMap(NOTES_KEY) }
  const cur = new Set(m[workspaceId] ?? [])
  if (cur.has(noteId)) cur.delete(noteId)
  else cur.add(noteId)
  m[workspaceId] = [...cur]
  saveMap(NOTES_KEY, m)
  return m[workspaceId]!
}

export function togglePinnedDocument(workspaceId: string, docId: string): string[] {
  const m = { ...loadMap(DOCS_KEY) }
  const cur = new Set(m[workspaceId] ?? [])
  if (cur.has(docId)) cur.delete(docId)
  else cur.add(docId)
  m[workspaceId] = [...cur]
  saveMap(DOCS_KEY, m)
  return m[workspaceId]!
}

export function isPinnedNote(workspaceId: string, noteId: string, serverPinned?: boolean): boolean {
  if (serverPinned) return true
  return getPinnedNoteIds(workspaceId).includes(noteId)
}

export function isPinnedDocument(workspaceId: string, docId: string): boolean {
  return getPinnedDocumentIds(workspaceId).includes(docId)
}
