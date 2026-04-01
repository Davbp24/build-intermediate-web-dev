import { createRoot } from 'react-dom/client'
import { useState, useEffect, useRef, type JSX } from 'react'
import { FaRegNoteSticky } from "react-icons/fa6";
import { FaHighlighter } from "react-icons/fa";
import { FaPencil } from "react-icons/fa6";
import { HiMiniSparkles } from "react-icons/hi2";

// ─── Types ────────────────────────────────────────────────────────────────────

// Stores the x/y coordinates of where the menu should appear on the page
interface MenuPosition {
  x: number
  y: number
}

// Defines the shape of each feature button in the floating menu
interface Feature {
  id: string    // unique identifier used to know which feature was clicked
  label: string // text shown under the icon
  icon: JSX.Element  // React element icon shown above the label
}

// ─── Feature Definitions ──────────────────────────────────────────────────────

// This is the list of features that appear in the floating toolbar.
// To add a new feature, just add a new object to this array.
const FEATURES: Feature[] = [
  { id: 'notes',     label: 'Note',      icon: <FaRegNoteSticky /> },
  { id: 'highlight', label: 'Highlight', icon: <FaHighlighter /> },
  { id: 'rewrite',   label: 'Rewrite',   icon: <FaPencil /> },
  { id: 'ai',        label: 'Ask AI',    icon: <HiMiniSparkles /> },
]

// ─── FloatingMenu Component ───────────────────────────────────────────────────

// This is the React component that renders the floating toolbar.
// It gets injected directly into whatever webpage the user is on.
function FloatingMenu() {

  // `position` holds the x/y coordinates for where to show the menu.
  // When null, the menu is hidden. When set, the menu renders at that position.
  const [position, setPosition] = useState<MenuPosition | null>(null)

  // `selectedText` stores the text the user has highlighted on the page.
  // This gets passed to whichever feature the user clicks.
  const [selectedText, setSelectedText] = useState<string>('')

  // `menuRef` gives us a direct reference to the menu's DOM node.
  // We use this to detect clicks outside the menu so we can close it.
  const menuRef = useRef<HTMLDivElement>(null)

  // ─── Event Listeners ────────────────────────────────────────────────────────

  useEffect(() => {

    // Fires every time the user releases the mouse button anywhere on the page
    function handleMouseUp(e: MouseEvent) {

      // We wait 10ms before checking the selection.
      // This is because the browser finalizes the selected text slightly
      // after the mouseup event fires — without this delay we'd read
      // an empty or incomplete selection.
      setTimeout(() => {

        // `window.getSelection()` reads whatever text the user has highlighted
        const selection = window.getSelection()

        // `.toString().trim()` converts the selection to a plain string
        // and removes any leading/trailing whitespace
        const text = selection?.toString().trim()

        if (text && text.length > 0) {
          // User has highlighted some text — save it and show the menu
          // at the position where they released the mouse
          setSelectedText(text)
          setPosition({ x: e.pageX, y: e.pageY })
        } else {
          // Nothing is selected — hide the menu
          setPosition(null)
        }
      }, 10)
    }

    // ─── Right-Click Context Menu Listener ───────────────────────────────────────

    useEffect(() => {

    // Listen for messages sent from background.ts.
    // Chrome's message passing system lets the background service worker
    // communicate with this content script running on the page.
    function handleMessage(message: {
        type: string
        featureId: string
        selectedText: string
    }) {

        // Only handle messages that are meant for us.
        // Using a `type` field is a good pattern so you can add other
        // message types in the future without conflicts.
        if (message.type !== 'INLINE_FEATURE') return

        // Update state with the text from the right-click selection.
        // This is the same selectedText used by the floating toolbar.
        setSelectedText(message.selectedText)

        // Trigger the feature directly — no need to show the floating menu
        // since the user already picked a feature from the context menu.
        handleFeatureClick(message.featureId)
    }

    // Register the listener with Chrome's runtime messaging system
    chrome.runtime.onMessage.addListener(handleMessage)

    // Cleanup — remove the listener when the component unmounts
    // to prevent memory leaks and duplicate listeners
    return () => {
        chrome.runtime.onMessage.removeListener(handleMessage)
    }

    }, []) // runs once on mount

    // Fires every time the user presses the mouse button down anywhere on the page
    function handleMouseDown(e: MouseEvent) {

      // `menuRef.current.contains(e.target)` checks if the click happened
      // inside the menu. If the click was OUTSIDE the menu, we hide it.
      // This is how "click outside to close" behavior works.
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setPosition(null)
      }
    }

    // Attach both listeners to the entire document so they fire
    // no matter where on the page the user clicks or releases
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mousedown', handleMouseDown)

    // Cleanup function — runs when the component unmounts.
    // We remove the listeners to prevent memory leaks. Without this,
    // old listeners would stack up every time the component re-mounts.
    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mousedown', handleMouseDown)
    }

  }, []) // Empty array means this effect runs once when the component first mounts

  // ─── Feature Click Handler ──────────────────────────────────────────────────

  // Called when the user clicks one of the feature buttons.
  // `featureId` will be 'notes', 'highlight', 'rewrite', or 'ai'
  function handleFeatureClick(featureId: string) {

    // Right now this just logs to the console.
    // Replace each case with the actual feature logic as you build them out.
    console.log(`Feature: ${featureId}, Text: "${selectedText}"`)

    // Hide the menu after the user picks a feature
    setPosition(null)
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  // If there's no position set (no text selected), render nothing at all.
  // The menu is completely absent from the DOM when not needed.
  if (!position) return null

  return (
    <div
      ref={menuRef} // attach our ref so we can detect outside clicks
      style={{
        position: 'absolute',         // positions relative to the whole page (not viewport)
        top: position.y + 12,         // 12px below where the mouse was released
        left: position.x,             // horizontally aligned to mouse position
        transform: 'translateX(-50%)', // shift left by 50% of its own width to center it
        zIndex: 2147483647,           // maximum possible z-index so it always appears on top
        background: '#1a1a1a',
        borderRadius: '10px',
        padding: '6px 8px',
        display: 'flex',
        gap: '4px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        fontFamily: '-apple-system, sans-serif',
      }}
    >
      {/* Loop through the FEATURES array and render a button for each one */}
      {FEATURES.map((f) => (
        <button
          key={f.id} // React needs a unique key when rendering lists
          onClick={() => handleFeatureClick(f.id)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            transition: 'background 0.15s',
          }}
          // Inline hover effects — we manually set the background style
          // because we can't use CSS classes inside a Shadow DOM without a stylesheet
          onMouseEnter={e => (e.currentTarget.style.background = '#333')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
          <span style={{ fontSize: '16px' }}>{f.icon}</span>
          <span>{f.label}</span>
        </button>
      ))}
    </div>
  )
}

// ─── Shadow DOM Injection ─────────────────────────────────────────────────────

// Create a plain div that will be our "host" element on the page.
// This sits in the real DOM but its contents are isolated inside a Shadow DOM.
const host = document.createElement('div')
host.id = 'inline-extension-root'
document.body.appendChild(host) // attach it to the page's body

// `attachShadow({ mode: 'open' })` creates an isolated Shadow DOM inside our host.
// Shadow DOM is like a mini-document — styles from the webpage can't leak in
// and our styles can't leak out. This prevents conflicts with any page's CSS.
const shadow = host.attachShadow({ mode: 'open' })

// Create the actual mount point div inside the shadow root.
// React will render our FloatingMenu component into this element.
const mountPoint = document.createElement('div')
shadow.appendChild(mountPoint)

// Mount the React app into the shadow DOM mount point.
// This is the same as what main.tsx does for the popup —
// except here it's injected into the live page instead of the extension popup.
createRoot(mountPoint).render(<FloatingMenu />)