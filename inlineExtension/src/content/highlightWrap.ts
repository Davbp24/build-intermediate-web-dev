const ACTION_META: Record<string, { bg: string; title: string }> = {
  summarize: { bg: 'rgba(187,247,208,0.92)', title: 'Summarized via Inline' },
  rewrite:   { bg: 'rgba(191,219,254,0.92)', title: 'Rewritten via Inline' },
  shorten:   { bg: 'rgba(254,215,170,0.92)', title: 'Shortened via Inline' },
  extract:   { bg: 'rgba(233,213,255,0.92)', title: 'Extracted via Inline' },
  risk:      { bg: 'rgba(254,202,202,0.92)', title: 'Risk-flagged via Inline' },
  }
  
  export interface SavedHighlight {
    text: string
    action: string
    bg: string
    title: string
    timestamp: number
  }

  let highlightCache: SavedHighlight[] = []

  function normalizePageUrl(): string {
    try {
      const u = new URL(window.location.href)
      return `${u.origin}${u.pathname}`.replace(/\/$/, '')
    } catch { return window.location.href }
  }

  export function setHighlightCache(highlights: SavedHighlight[]): void {
    highlightCache = highlights
  }

  function syncHighlightsToBackend(): void {
    chrome.runtime.sendMessage({
      type: 'SAVE_ANNOTATIONS',
      payload: { pageUrl: normalizePageUrl(), featureKey: 'highlights', data: highlightCache },
    }, () => { if (chrome.runtime.lastError) console.error('[Inline] Highlight save failed:', chrome.runtime.lastError.message) })
  }

  function saveHighlight(highlight: SavedHighlight): void {
    highlightCache.push(highlight)
    syncHighlightsToBackend()
  }
  
  export function wrapSelectionWithHighlight(action: string, savedRange?: Range): { text: string; title: string; span: HTMLSpanElement } | null {
  let range: Range
  let text: string

  if (savedRange) {
  range = savedRange
  text = range.toString()
  } else {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null
  text = sel.toString()
  range = sel.getRangeAt(0)
  }
  if (!text.trim()) return null
  const meta = ACTION_META[action] ?? { bg: 'rgba(226,232,240,0.95)', title: 'Highlighted by Inline' }
  
  const span = document.createElement('span')
  span.setAttribute('data-inline-highlight', action)
  span.style.backgroundColor = meta.bg
  span.style.borderRadius = '4px'
  span.style.padding = '0 3px'
  span.title = meta.title
  
  try {
  range.surroundContents(span)
  } catch {
  const contents = range.extractContents()
  span.appendChild(contents)
  range.insertNode(span)
  }

  attachUnhighlightListener(span)
  const sel = window.getSelection()
  sel?.removeAllRanges()

    saveHighlight({
      text: text.trim(),
      action,
      bg: meta.bg,
      title: meta.title,
      timestamp: Date.now(),
    })
  
  return { text, title: meta.title, span }
  }
  
  function removeSavedHighlight(text: string, action: string): void {
    const idx = highlightCache.findIndex(h => h.text === text && h.action === action)
    if (idx !== -1) {
      highlightCache.splice(idx, 1)
      syncHighlightsToBackend()
    }
  }

  function attachUnhighlightListener(span: HTMLSpanElement): void {
    span.style.cursor = 'pointer'
    span.addEventListener('dblclick', (e) => {
      e.preventDefault()
      e.stopPropagation()
      const text = span.textContent ?? ''
      const action = span.getAttribute('data-inline-highlight') ?? ''
      const parent = span.parentNode
      if (parent) {
        // Replace span with its text content
        const textNode = document.createTextNode(text)
        parent.replaceChild(textNode, span)
        // Merge adjacent text nodes
        parent.normalize()
      }
      removeSavedHighlight(text.trim(), action)
    })
  }

  export function restoreHighlights(saved?: SavedHighlight[]): void {
    const items = saved ?? highlightCache
    if (items.length === 0) return
    if (saved) highlightCache = [...saved]
  
    const body = document.body
    if (!body) return
  
    for (const h of items) {
      if (!h.text || h.text.length < 3) continue
  
      const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT)
      let node: Text | null
      while ((node = walker.nextNode() as Text | null)) {
        const idx = node.textContent?.indexOf(h.text) ?? -1
        if (idx === -1) continue
  
        const parent = node.parentElement
        if (parent?.hasAttribute('data-inline-highlight')) continue
  
        try {
          const range = document.createRange()
          range.setStart(node, idx)
          range.setEnd(node, idx + h.text.length)
  
          const span = document.createElement('span')
          span.setAttribute('data-inline-highlight', h.action)
          span.style.backgroundColor = h.bg
          span.style.borderRadius = '4px'
          span.style.padding = '0 3px'
          span.title = h.title
  
          range.surroundContents(span)
          attachUnhighlightListener(span)
        } catch { /* skip if DOM structure doesn't allow it */ }

        break
      }
    }
  }