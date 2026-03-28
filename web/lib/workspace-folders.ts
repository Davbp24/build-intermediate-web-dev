/**
 * Workspace folders (sidebar + library). Optional parentId enables nesting.
 * Stored in localStorage as `inline-folders` until Supabase backs it.
 */

export interface WorkspaceFolder {
  id: string
  workspaceId: string
  name: string
  /** null / undefined = root folder under the workspace */
  parentId: string | null
}

const STORAGE_KEY = 'inline-folders'

function parseFolders(raw: unknown): WorkspaceFolder[] {
  if (!Array.isArray(raw)) return []
  const out: WorkspaceFolder[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    if (typeof o.id !== 'string' || typeof o.workspaceId !== 'string' || typeof o.name !== 'string') continue
    let parentId: string | null = null
    if (o.parentId !== undefined && o.parentId !== null && o.parentId !== '') {
      parentId = String(o.parentId)
    }
    out.push({ id: o.id, workspaceId: o.workspaceId, name: o.name, parentId })
  }
  return out
}

export function loadWorkspaceFolders(): WorkspaceFolder[] {
  if (typeof window === 'undefined') return []
  try {
    const r = localStorage.getItem(STORAGE_KEY)
    return r ? parseFolders(JSON.parse(r)) : []
  } catch {
    return []
  }
}

export function saveWorkspaceFolders(folders: WorkspaceFolder[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(folders))
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('inline-folders-changed'))
  }
}

export function getRootFolders(folders: WorkspaceFolder[], workspaceId: string): WorkspaceFolder[] {
  return folders.filter(f => f.workspaceId === workspaceId && !f.parentId)
}

export function getChildFolders(
  folders: WorkspaceFolder[],
  workspaceId: string,
  parentId: string,
): WorkspaceFolder[] {
  return folders.filter(f => f.workspaceId === workspaceId && f.parentId === parentId)
}

/** All folder ids in subtree rooted at rootId (including rootId). */
export function collectSubtreeFolderIds(folders: WorkspaceFolder[], rootId: string): Set<string> {
  const ids = new Set<string>()
  function walk(id: string) {
    ids.add(id)
    for (const f of folders) {
      if (f.parentId === id) walk(f.id)
    }
  }
  walk(rootId)
  return ids
}

export function removeFolderSubtree(all: WorkspaceFolder[], rootId: string): WorkspaceFolder[] {
  const remove = collectSubtreeFolderIds(all, rootId)
  return all.filter(f => !remove.has(f.id))
}

/** Path from root to folder (inclusive), in order root → leaf. */
export function getFolderPath(all: WorkspaceFolder[], folderId: string): WorkspaceFolder[] {
  const byId = new Map(all.map(f => [f.id, f]))
  const path: WorkspaceFolder[] = []
  let cur: WorkspaceFolder | undefined = byId.get(folderId)
  const guard = new Set<string>()
  while (cur && !guard.has(cur.id)) {
    guard.add(cur.id)
    path.unshift(cur)
    cur = cur.parentId ? byId.get(cur.parentId) : undefined
  }
  return path
}

export function findFolder(
  folders: WorkspaceFolder[],
  workspaceId: string,
  folderId: string,
): WorkspaceFolder | undefined {
  return folders.find(f => f.id === folderId && f.workspaceId === workspaceId)
}
