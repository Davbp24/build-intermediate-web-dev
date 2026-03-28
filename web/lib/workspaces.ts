// Shared workspace definitions — used by both Sidebar (client) and server pages
export interface WorkspaceDef {
  id:    string
  label: string
  color: string
  icon:  string
}

export const DEFAULT_WORKSPACES: WorkspaceDef[] = [
  { id: 'ws-1', label: 'Marketing Team',      color: '#f43f5e', icon: 'Megaphone'    },
  { id: 'ws-2', label: 'Product Development', color: '#6C91C2', icon: 'Package'      },
  { id: 'ws-3', label: 'Sales Strategy',      color: '#f59e0b', icon: 'TrendingUp'   },
  { id: 'ws-4', label: 'Project Management',  color: '#5FA8A1', icon: 'FolderKanban' },
  { id: 'ws-5', label: 'Research & Insights', color: '#a855f7', icon: 'Lightbulb'    },
]

export function getWorkspaceName(id: string): string {
  const ws = DEFAULT_WORKSPACES.find(w => w.id === id)
  if (ws) return ws.label
  // Attempt a graceful fallback for dynamically created workspaces
  return id.replace(/^ws-/, 'Workspace ')
}

export function getWorkspaceColor(id: string): string {
  return DEFAULT_WORKSPACES.find(w => w.id === id)?.color ?? '#6C91C2'
}
