/**
 * Content Script Entry Point
 *
 * Creates an isolated Shadow DOM container, injects scoped CSS,
 * and mounts SmartOverlay (selection toolbar, highlights, modals)
 * and StickyNotesManager inside it.
 */
import { createRoot } from 'react-dom/client'
import StickyNotesManager from './StickyNotesManager'
import SmartOverlay from './SmartOverlay'
import { restoreHighlights } from './highlightWrap'
import cssText from './content.css?inline'

setTimeout(restoreHighlights, 800)

const HOST_ID = 'inline-extension-root'
if (!document.getElementById(HOST_ID)) {
  const host = document.createElement('div')
  host.id = HOST_ID
  host.style.cssText =
    'position:fixed; top:0; left:0; width:0; height:0; z-index:2147483647; pointer-events:none;'
  document.body.appendChild(host)

  const shadow = host.attachShadow({ mode: 'open' })

  const style = document.createElement('style')
  style.textContent = cssText
  shadow.appendChild(style)

  const mountPoint = document.createElement('div')
  mountPoint.id = 'inline-mount'
  mountPoint.style.cssText =
    'position:fixed; top:0; left:0; width:100vw; height:100vh; pointer-events:none;'
  shadow.appendChild(mountPoint)

  /* pointer-events for all interactive overlays */
  const extraStyle = document.createElement('style')
  extraStyle.textContent = `
    .sticky-note, .add-note-button,
    .add-note-launcher, .add-note-launcher *,
    .launcher-eye, .launcher-add,
    .inline-toolbar, .inline-toolbar *,
    .inline-anchor, .inline-anchor *,
    .inline-modal-backdrop, .inline-modal-backdrop * {
      pointer-events: auto;
    }
  `
  shadow.appendChild(extraStyle)

  const root = createRoot(mountPoint)
  root.render(
    <>
      <SmartOverlay />
      <StickyNotesManager />
    </>,
  )
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'addNote') {
    document.dispatchEvent(new CustomEvent('inline:addNote'))
  }
})
