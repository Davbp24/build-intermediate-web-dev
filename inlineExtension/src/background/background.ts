/**
 * Service worker: registers context menus, relays messages to the content
 * script, and proxies backend API calls for content scripts.
 */

const BACKEND_URL = 'http://localhost:3000';

// ─── Context Menus ──────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'inline-analyze-risk',
      title: 'Analyze page risk (Inline)',
      contexts: ['page'],
    })

    chrome.contextMenus.create({
      id: 'inline-root',
      title: 'Inline',
      contexts: ['selection'],
    })

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
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'inline-analyze-risk' && tab?.id != null) {
    chrome.tabs.sendMessage(tab.id, { type: 'INLINE_PAGE_RISK' }).catch(() => {})
    return
  }

  if (!tab?.id || info.menuItemId === 'inline-root') return

  chrome.tabs.sendMessage(tab.id, {
    type: 'INLINE_FEATURE',
    featureId: info.menuItemId,
    selectedText: info.selectionText ?? '',
  })
})

// ─── Backend API Proxy ──────────────────────────────────────────────────────
// Content scripts on public HTTPS pages cannot fetch localhost due to Chrome's
// Private Network Access policy. Background service workers are exempt, so all
// backend calls are routed through here.

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'SAVE_ANNOTATIONS') {
    const { pageUrl, featureKey, data } = message.payload;

    fetch(`${BACKEND_URL}/api/annotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageUrl, featureKey, data }),
    })
      .then(async (res) => {
        const text = await res.text()
        let json: unknown
        try {
          json = JSON.parse(text) as unknown
        } catch {
          sendResponse({
            ok: false,
            error:
              'Server did not return JSON (check API URL / is the app running?).',
          })
          return
        }
        if (!res.ok) {
          const err =
            typeof json === 'object' && json !== null && 'error' in json
              ? String((json as { error?: string }).error)
              : `HTTP ${res.status}`
          sendResponse({ ok: false, error: err })
          return
        }
        sendResponse({ ok: true, data: json })
      })
      .catch((err: Error) => sendResponse({ ok: false, error: err.message }))

    return true;
  }
});
