export type NoteType = 'text' | 'canvas' | 'ai-summary'

export interface Note {
  id: string
  pageUrl: string
  domain: string
  pageTitle: string
  pageContext: string
  content: string
  type: NoteType
  color: string
  x: number
  y: number
  width: number
  height: number
  lat?: number
  lng?: number
  tags: string[]
  /** From Supabase or client pin state */
  is_pinned?: boolean
  createdAt: string
  updatedAt: string
}

export interface Stroke {
  points: [number, number][]
  color: string
  width: number
}

export interface Drawing {
  id: string
  noteId?: string
  pageUrl: string
  domain: string
  strokes: Stroke[]
  lat?: number
  lng?: number
  createdAt: string
  updatedAt: string
}

export interface MapCoordinate {
  id: string
  lat: number
  lng: number
  noteId: string
  type: NoteType
  label: string
  domain: string
  color: string
}

export interface DomainStat {
  domain: string
  count: number
  percentage: number
  lastVisited: string
}

export interface DailyCapture {
  date: string
  count: number
}

export interface DashboardStats {
  notesThisWeek: number
  notesThisWeekDelta: number
  totalNotes: number
  totalDomains: number
  aiQueriesRun: number
  streakDays: number
  captureHistory: DailyCapture[]
  topDomains: DomainStat[]
}

export interface GraphNode {
  id: string
  label: string
  type: 'url' | 'note' | 'tag'
  domain?: string
  size: number
  color?: string
  x?: number
  y?: number
  vx?: number
  vy?: number
  fx?: number
  fy?: number
}

export interface GraphLink {
  source: string | GraphNode
  target: string | GraphNode
  strength: number
}

export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}
