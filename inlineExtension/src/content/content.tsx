/**
 * Content Script Entry Point
 *
 * Injected into every webpage by the Chrome extension manifest.
 * Creates an isolated Shadow DOM container, injects scoped CSS,
 * and mounts the React StickyNotesManager inside it.
 */
import { createRoot } from 'react-dom/client'
import StickyNotesManager from './StickyNotesManager'
import cssText from './content.css?inline'

// Prevent double-injection if the script somehow runs twice
const HOST_ID = 'inline-extension-root'
if (!document.getElementById(HOST_ID)) {
  // 1. Create the host element on the page
  const host = document.createElement('div')
  host.id = HOST_ID
  host.style.cssText =
    'position:fixed; top:0; left:0; width:0; height:0; z-index:2147483647; pointer-events:none;'
  document.body.appendChild(host)

  // 2. Attach Shadow DOM for style isolation
  const shadow = host.attachShadow({ mode: 'open' })

  // 3. Inject our scoped CSS into the shadow root
  const style = document.createElement('style')
  style.textContent = cssText
  shadow.appendChild(style)

  // 4. Create a mount point inside the shadow root
  const mountPoint = document.createElement('div')
  mountPoint.id = 'inline-mount'
  mountPoint.style.cssText =
    'position:fixed; top:0; left:0; width:100vw; height:100vh; pointer-events:none;'
  shadow.appendChild(mountPoint)

  // Allow pointer events on the actual interactive elements inside
  const globalStyle = document.createElement('style')
  globalStyle.textContent = `
    .sticky-note, .add-note-button {
      pointer-events: auto;
    }
  `
  shadow.appendChild(globalStyle)

  // 5. Mount React
  const root = createRoot(mountPoint)
  root.render(<StickyNotesManager />)
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'addNote') {
    document.dispatchEvent(new CustomEvent('inline:addNote'))
  }
})
