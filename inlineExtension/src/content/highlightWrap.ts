const ACTION_META: Record<string, { bg: string; title: string }> = {
  summarize: { bg: 'rgba(187,247,208,0.92)', title: 'Summarized via Inline' },
  rewrite:   { bg: 'rgba(191,219,254,0.92)', title: 'Rewritten via Inline' },
  shorten:   { bg: 'rgba(254,215,170,0.92)', title: 'Shortened via Inline' },
  extract:   { bg: 'rgba(233,213,255,0.92)', title: 'Extracted via Inline' },
  risk:      { bg: 'rgba(254,202,202,0.92)', title: 'Risk-flagged via Inline' },
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
  return { text, title: meta.title }
}
