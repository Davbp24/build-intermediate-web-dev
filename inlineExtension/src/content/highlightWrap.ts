const ACTION_META: Record<string, { bg: string; title: string }> = {
  summarize: { bg: 'rgba(187,247,208,0.92)', title: 'Summarized via Inline' },
  rewrite:   { bg: 'rgba(191,219,254,0.92)', title: 'Rewritten via Inline' },
  shorten:   { bg: 'rgba(254,215,170,0.92)', title: 'Shortened via Inline' },
  extract:   { bg: 'rgba(233,213,255,0.92)', title: 'Extracted via Inline' },
  risk:      { bg: 'rgba(254,202,202,0.92)', title: 'Risk-flagged via Inline' },
}

interface SavedHighlight {
  text: string
  action: string
  bg: string
  title: string
  timestamp: number
}

function highlightStorageKey(): string {
  try {
    const u = new URL(window.location.href)
    return `inlineHighlights:${u.origin}${u.pathname}`.replace(/\/$/, '')
  } catch {
    return `inlineHighlights:${window.location.href}`
  }
}

function loadSavedHighlights(): SavedHighlight[] {
  try {
    const raw = localStorage.getItem(highlightStorageKey())
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveHighlight(highlight: SavedHighlight): void {
  try {
    const existing = loadSavedHighlights()
    existing.push(highlight)
    localStorage.setItem(highlightStorageKey(), JSON.stringify(existing))
  } catch { /* ignore in sandboxed contexts */ }
}

export function wrapSelectionWithHighlight(action: string): { text: string; title: string } | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null
  const text = sel.toString()
  if (!text.trim()) return null

  const range = sel.getRangeAt(0)
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

  sel.removeAllRanges()

  saveHighlight({
    text: text.trim(),
    action,
    bg: meta.bg,
    title: meta.title,
    timestamp: Date.now(),
  })

  return { text, title: meta.title }
}

export function restoreHighlights(): void {
  const saved = loadSavedHighlights()
  if (saved.length === 0) return

  const body = document.body
  if (!body) return

  for (const h of saved) {
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
      } catch { /* skip if DOM structure doesn't allow it */ }

      break
    }
  }
}
