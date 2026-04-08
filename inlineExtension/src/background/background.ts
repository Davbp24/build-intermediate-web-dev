/**
 * Service worker: registers context menus, relays messages to the content
 * script, and proxies backend API calls for content scripts.
 */

import { enqueue, getQueue } from '../lib/syncQueue'

const BACKEND_URL = 'http://localhost:3000';

// ─── Context Menus ──────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('inline-sync-retry', { periodInMinutes: 2 })

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

    chrome.contextMenus.create({
      id: 'clip-to-workspace',
      parentId: 'inline-root',
      title: '📎 Clip to Workspace',
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
  if (message.type === 'CAPTURE_TAB') {
    chrome.tabs.captureVisibleTab({ format: 'png' }, (dataUrl) => {
      sendResponse({ ok: true, dataUrl })
    })
    return true
  }

  if (message.type === 'CLIP_TO_WORKSPACE') {
    const { pageUrl, pageTitle, selection, highlights, workspaceId } = message.payload

    fetch(`${BACKEND_URL}/api/clip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageUrl, pageTitle, selection, highlights, workspaceId }),
    })
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok) {
          sendResponse({ ok: false, error: json.error ?? `HTTP ${res.status}` })
          return
        }
        sendResponse({ ok: true, data: json })
      })
      .catch((err: Error) => sendResponse({ ok: false, error: err.message }))

    return true
  }

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
      .catch(async (_err: Error) => {
        try {
          await enqueue({ pageUrl, featureKey, data, timestamp: Date.now() })
        } catch { /* storage full – best-effort */ }
        sendResponse({ ok: false, error: 'Queued for retry (offline)' })
      })

    return true;
  }

  if (message.type === 'LOAD_ANNOTATIONS') {
    const { pageUrl } = message.payload;

    fetch(`${BACKEND_URL}/api/annotations?url=${encodeURIComponent(pageUrl)}`)
      .then(async (res) => {
        const text = await res.text()
        let json: unknown
        try {
          json = JSON.parse(text) as unknown
        } catch {
          sendResponse({
            ok: false,
            error: 'Server did not return JSON (check API URL / is the app running?).',
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

  if (message.type === 'SHARE_ANNOTATIONS') {
    const { pageUrl, layers } = message.payload as { pageUrl: string; layers: string[] }

    fetch(`${BACKEND_URL}/api/annotations?url=${encodeURIComponent(pageUrl)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = (await res.json()) as { elements?: Record<string, unknown> }
        const allElements = json.elements ?? {}

        const filteredLayers: Record<string, unknown> = {}
        for (const key of layers) {
          if (key in allElements) filteredLayers[key] = allElements[key]
        }

        const shareRes = await fetch(`${BACKEND_URL}/api/share`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageUrl, layers: filteredLayers }),
        })
        const shareJson = (await shareRes.json()) as { shareUrl?: string; error?: string }
        if (!shareRes.ok) {
          sendResponse({ ok: false, error: shareJson.error ?? `HTTP ${shareRes.status}` })
          return
        }
        sendResponse({ ok: true, shareUrl: shareJson.shareUrl })
      })
      .catch((err: Error) => sendResponse({ ok: false, error: err.message }))

    return true
  }
});

// ─── Keyboard Shortcuts ─────────────────────────────────────────────────────

chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0]?.id
    if (tabId == null) return
    chrome.tabs.sendMessage(tabId, { type: 'INLINE_COMMAND', command })
  })
})

// ─── Offline Sync Retry ─────────────────────────────────────────────────────

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'inline-sync-retry') return

  const queue = await getQueue()
  if (queue.length === 0) return

  const remaining = [...queue]

  for (let i = 0; i < remaining.length; i++) {
    const item = remaining[i]
    try {
      const res = await fetch(`${BACKEND_URL}/api/annotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageUrl: item.pageUrl,
          featureKey: item.featureKey,
          data: item.data,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      remaining.splice(i, 1)
      i--
    } catch {
      break
    }
  }

  await chrome.storage.local.set({ inlineSyncQueue: remaining })
})
