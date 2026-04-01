/**
 * Service worker: registers context menus and relays messages to the content script.
 */
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'inline-analyze-risk',
      title: 'Analyze page risk (Inline)',
      contexts: ['page'],
    })
  })
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== 'inline-analyze-risk' || tab?.id == null) return
  chrome.tabs.sendMessage(tab.id, { type: 'INLINE_PAGE_RISK' }).catch(() => {
    /* tab may not have content script injected yet */
  })
})



// ─── Background Service Worker ────────────────────────────────────────────────
// This file runs as a Chrome "service worker" in the background.
// It has access to Chrome APIs that content scripts can't use directly,
// like chrome.contextMenus. It acts as a message broker between
// Chrome's native menus and your content script running on the page.

// ─── Create Context Menu Items ───────────────────────────────────────────────

// `chrome.runtime.onInstalled` fires when the extension is first installed
// or updated. We create our menu items here so they're only registered once —
// calling create() on every page load would cause duplicate menu errors.
chrome.runtime.onInstalled.addListener(() => {

  // Create a parent menu item that appears when the user right-clicks
  // on selected text. All our features will be nested under this.
  // `contexts: ['selection']` means it ONLY appears when text is highlighted.
  chrome.contextMenus.create({
    id: 'inline-root',
    title: 'Inline',
    contexts: ['selection'], // only show when text is selected
  })

  // ── Child menu items ────────────────────────────────────────────
  // Each feature is a sub-item nested under the parent 'inline-root' menu.
  // `parentId` links them to the parent item above.
  // The `id` matches the feature IDs in content.tsx so both sides speak
  // the same language when passing messages.

  chrome.contextMenus.create({
    id: 'notes',
    parentId: 'inline-root',
    title: '📝 Add Note',
    contexts: ['selection'],
  })

  chrome.contextMenus.create({
    id: 'highlight',
    parentId: 'inline-root',
    title: '🖊️ Highlight',
    contexts: ['selection'],
  })

  chrome.contextMenus.create({
    id: 'rewrite',
    parentId: 'inline-root',
    title: '✏️ Rewrite',
    contexts: ['selection'],
  })

  chrome.contextMenus.create({
    id: 'ai',
    parentId: 'inline-root',
    title: '✨ Ask AI',
    contexts: ['selection'],
  })
})

// ─── Handle Menu Item Clicks ─────────────────────────────────────────────────

// This fires whenever any of our context menu items are clicked.
// `info` contains details about what was clicked and what text was selected.
// `tab` contains details about which browser tab triggered the click.
chrome.contextMenus.onClicked.addListener((info, tab) => {

  // `info.menuItemId` is the `id` we set when creating the menu item above.
  // `info.selectionText` is the text the user had highlighted when they right-clicked.
  // We only care about our feature items, not the parent 'inline-root' item.
  if (!tab?.id || info.menuItemId === 'inline-root') return

  // Send a message to the content script running on the active page.
  // Content scripts can't create context menus, and background scripts
  // can't touch the DOM — so we use message passing to bridge the two.
  // The content script listens for this message and handles the feature logic.
  chrome.tabs.sendMessage(tab.id, {
    type: 'INLINE_FEATURE',         // identifier so content.tsx knows what kind of message this is
    featureId: info.menuItemId,     // which feature was clicked (notes, highlight, rewrite, ai)
    selectedText: info.selectionText ?? '', // the highlighted text, fallback to empty string
  })
})