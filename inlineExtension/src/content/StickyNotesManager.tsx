import {
  useState,
  useEffect,
  useCallback,
  useRef,
  createContext,
  useContext,
  type ReactNode,
} from 'react'
import StickyNote, { PALETTE } from './StickyNote'
import {
  generateNoteId,
  type StickyNoteData,
} from './storage'
import { findMediaElements } from '../lib/mediaDetect'

const PAGE_URL = window.location.href
const SAVE_DEBOUNCE_MS = 500

/* ─── eye icon ─── */
const IEye = ({ crossed }: { crossed?: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
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
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
    <line x1="8" y1="3" x2="8" y2="13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="3" y1="8" x2="13" y2="8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
)

const NEXT_COLOR = (() => {
  let i = 0
  return () => { const c = PALETTE[i % PALETTE.length].bg; i++; return c }
})()

type StickyNotesCtx = {
  notes: StickyNoteData[]
  notesVisible: boolean
  setNotesVisible: (v: boolean | ((p: boolean) => boolean)) => void
  handleAddNote: () => void
  handleUpdateNote: (id: string, updates: Partial<StickyNoteData>) => void
  handleDeleteNote: (id: string) => void
}

const StickyNotesContext = createContext<StickyNotesCtx | null>(null)

/** Notes only — visibility toggled elsewhere; never unmounts the rest of the extension. */
function StickyNotesLayer() {
  const ctx = useContext(StickyNotesContext)
  if (!ctx) return null
  const { notes, notesVisible, handleUpdateNote, handleDeleteNote } = ctx
  return (
    <>
      {notesVisible && notes.map(note => (
        <StickyNote key={note.id} note={note} onUpdate={handleUpdateNote} onDelete={handleDeleteNote} />
      ))}
    </>
  )
}

function useGlobalHide() {
  const [globalHidden, setGlobalHidden] = useState(false)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ hidden: boolean }>).detail
      setGlobalHidden(detail.hidden)
    }
    document.addEventListener('inline:hideAll', handler)
    return () => document.removeEventListener('inline:hideAll', handler)
  }, [])
  return globalHidden
}

/**
 * Launcher is a separate subtree from the note layer so toggling note visibility
 * cannot affect this UI (eye + add). Matches site typography / colors.
 */
function StickyNoteLauncherBar() {
  const ctx = useContext(StickyNotesContext)
  const [hovered, setHovered] = useState(false)
  if (!ctx) return null
  const { handleAddNote } = ctx

  return (
    <div
      className="add-note-launcher"
      data-inline-sticky-launcher=""
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
        isolation: 'isolate',
      }}
      onMouseDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
    >
      <button
        type="button"
        className="launcher-eye"
        onClick={e => {
          e.preventDefault()
          e.stopPropagation()
          document.dispatchEvent(new CustomEvent('inline:hideAll', { detail: { hidden: true } }))
        }}
        title="Hide extension"
      >
        <IEye crossed />
      </button>

      <button
        type="button"
        className="launcher-add"
        onClick={e => {
          e.preventDefault()
          e.stopPropagation()
          handleAddNote()
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: hovered ? 140 : 48,
          padding: hovered ? '0 14px' : '0',
        }}
        title="Add sticky note"
      >
        <IPlus />
        <span
          className="launcher-add-label"
          style={{
            opacity: hovered ? 1 : 0,
            marginLeft: hovered ? 8 : 0,
            transform: hovered ? 'translateX(0)' : 'translateX(8px)',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", system-ui, sans-serif',
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Add Note
        </span>
      </button>
    </div>
  )
}

function StickyNotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<StickyNoteData[]>([])
  const [loaded, setLoaded] = useState(false)
  const [notesVisible, setNotesVisible] = useState(true)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    chrome.runtime.sendMessage(
      { type: 'LOAD_ANNOTATIONS', payload: { pageUrl: PAGE_URL } },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('[Inline] Load failed:', chrome.runtime.lastError.message)
        } else if (response?.ok && Array.isArray(response.data?.elements?.stickyNotes)) {
          setNotes(response.data.elements.stickyNotes)
        }
        setLoaded(true)
      },
    )
  }, [])

  useEffect(() => {
    if (!loaded) return

    if (saveTimer.current) clearTimeout(saveTimer.current)
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
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [notes, loaded])

  const handleAddNote = useCallback(() => {
    const now = Date.now()
    const media = findMediaElements()
    const playingMedia = media.find(m => !m.element.paused)
    const mediaTimestamp = playingMedia ? playingMedia.currentTime : undefined
    setNotes(prev => {
      const offset = prev.length * 18
      return [...prev, {
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
        ...(mediaTimestamp !== undefined && { mediaTimestamp }),
      }]
    })
  }, [])

  const handleUpdateNote = useCallback(
    (id: string, updates: Partial<StickyNoteData>) =>
      setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n)),
    [],
  )

  const handleDeleteNote = useCallback(
    (id: string) => setNotes(prev => prev.filter(n => n.id !== id)),
    [],
  )

  const value: StickyNotesCtx = {
    notes,
    notesVisible,
    setNotesVisible,
    handleAddNote,
    handleUpdateNote,
    handleDeleteNote,
  }

  return (
    <StickyNotesContext.Provider value={value}>
      {children}
    </StickyNotesContext.Provider>
  )
}

function HideAwareWrapper() {
  const globalHidden = useGlobalHide()
  if (globalHidden) return null
  return (
    <>
      <StickyNotesLayer />
      <StickyNoteLauncherBar />
    </>
  )
}

export default function StickyNotesManager() {
  return (
    <StickyNotesProvider>
      <HideAwareWrapper />
    </StickyNotesProvider>
  )
}
