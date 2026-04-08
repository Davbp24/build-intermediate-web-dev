/**
 * Content Script Entry Point
 *
 * Creates an isolated Shadow DOM container, injects scoped CSS,
 * and mounts SmartOverlay (selection toolbar, highlights, modals),
 * StickyNotesManager, and the floating panel toolbar (Home) inside it.
 */
import { createRoot } from 'react-dom/client'
import StickyNotesManager from './StickyNotesManager'
import SmartOverlay from './SmartOverlay'
import PanelHost from './PanelHost'
import { restoreHighlights } from './highlightWrap'
import { enableReaderMode, disableReaderMode } from '../lib/readerMode'
import cssText from './content.css?inline'

;(async () => {
  const stored = await new Promise<Record<string, unknown>>(resolve =>
    chrome.storage.local.get(['inlineBlockedDomains', 'inlineFocusMode'], r => resolve(r)),
  )

  let blockedDomains: string[] = []
  try {
    const raw = stored.inlineBlockedDomains
    if (typeof raw === 'string') blockedDomains = JSON.parse(raw)
  } catch { /* keep default */ }

  const hostname = window.location.hostname
  if (Array.isArray(blockedDomains) && blockedDomains.some(d => hostname === d || hostname.endsWith(`.${d}`))) {
    return
  }

  const focusMode = stored.inlineFocusMode === 'true' || stored.inlineFocusMode === true
  if (focusMode) enableReaderMode()

  setTimeout(restoreHighlights, 800)

  const HOST_ID = 'inline-extension-root'
  if (!document.getElementById(HOST_ID)) {
    const host = document.createElement('div')
    host.id = HOST_ID
    host.style.cssText =
      'position:fixed; top:0; left:0; width:0; height:0; z-index:2147483647; pointer-events:none;'
    if (focusMode) host.dataset.inlineFocus = 'true'
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
      .inline-modal-backdrop, .inline-modal-backdrop *,
      [data-panel-host], [data-panel-host] * {
        pointer-events: auto;
      }
      *::-webkit-scrollbar { display: none; }
      * { scrollbar-width: none; }
    `
    shadow.appendChild(extraStyle)

    const offlineBadge = document.createElement('div')
    offlineBadge.id = 'inline-offline-badge'
    offlineBadge.textContent = 'Offline'
    offlineBadge.style.cssText = [
      'position:fixed', 'bottom:72px', 'right:24px',
      'padding:4px 12px', 'border-radius:9999px',
      'background:#ef4444', 'color:#fff',
      'font:600 12px/1.4 system-ui,sans-serif',
      'pointer-events:none', 'display:none', 'z-index:2147483647',
    ].join(';')
    shadow.appendChild(offlineBadge)

    const showBadge = () => { offlineBadge.style.display = 'block' }
    const hideBadge = () => { offlineBadge.style.display = 'none' }

    window.addEventListener('offline', showBadge)
    window.addEventListener('online', hideBadge)
    if (!navigator.onLine) showBadge()

    const root = createRoot(mountPoint)
    root.render(
      <>
        <SmartOverlay />
        <StickyNotesManager />
        {/* After sticky layer so the right toolbar paints above any full-page hit areas */}
        <PanelHost />
      </>,
    )
  }

  document.addEventListener('inline:focusMode', ((e: CustomEvent<{ enabled: boolean }>) => {
    const host = document.getElementById('inline-extension-root')
    if (!host) return
    if (e.detail.enabled) {
      host.dataset.inlineFocus = 'true'
      enableReaderMode()
    } else {
      delete host.dataset.inlineFocus
      disableReaderMode()
    }
  }) as EventListener)

  document.addEventListener('inline:saveResult', ((e: CustomEvent<{ error?: string }>) => {
    const badge = document
      .getElementById('inline-extension-root')
      ?.shadowRoot?.getElementById('inline-offline-badge')
    if (!badge) return
    const err = e.detail?.error ?? ''
    if (/offline|queued/i.test(err)) {
      badge.style.display = 'block'
    }
  }) as EventListener)

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'addNote') {
      document.dispatchEvent(new CustomEvent('inline:addNote'))
    }
    if (message.type === 'INLINE_COMMAND') {
      document.dispatchEvent(
        new CustomEvent('inline:command', { detail: { command: message.command } }),
      )
    }
  })
})()