/**
 * Universal Annotation Restore
 *
 * Single entry point that fetches ALL saved annotations for the current page
 * from Supabase (via background proxy → backend GET /api/annotations) and
 * applies each feature type back to the page:
 *   • highlights  → re-wraps matched text nodes
 *   • drawings    → renders SVG strokes onto the draw canvas
 *   • rewrites    → replaces original text with rewritten version
 *   • stickyNotes → dispatches event for Home.tsx to mount note panels
 */

import { restoreHighlights, type SavedHighlight } from '../content/highlightWrap'
import type { SavedStroke } from '../components/Draw'

export interface RestoredNote {
  id: string
  x: number
  y: number
  w: number
  h: number
  content: string
}

function normalizePageUrl(): string {
  try {
    const u = new URL(window.location.href)
    return `${u.origin}${u.pathname}`.replace(/\/$/, '')
  } catch { return window.location.href }
}

function renderDrawings(strokes: SavedStroke[]): void {
  if (!strokes.length) return
  let svg = document.getElementById('inline-draw-canvas') as unknown as SVGSVGElement | null
  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.id = 'inline-draw-canvas'
    svg.style.cssText =
      'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2147483640;pointer-events:none;'
    document.body.appendChild(svg)
  }
  for (const s of strokes) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('d', s.d)
    path.setAttribute('stroke', s.stroke)
    path.setAttribute('stroke-width', s.strokeWidth)
    path.setAttribute('fill', 'none')
    path.setAttribute('stroke-linecap', 'round')
    path.setAttribute('stroke-linejoin', 'round')
    if (s.opacity) path.setAttribute('opacity', s.opacity)
    path.setAttribute('data-inline-draw', 'true')
    svg.appendChild(path)
  }
}

/**
 * Cross-node text search: accumulate all visible text, find the match
 * position, then map it back to the exact text nodes + offsets so we
 * can build a DOM Range that may span multiple elements.
 */
function findTextRange(search: string): Range | null {
  const nodes: { node: Text; start: number }[] = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const el = node.parentElement
      if (!el) return NodeFilter.FILTER_REJECT
      if (el.hasAttribute('data-inline-highlight')) return NodeFilter.FILTER_REJECT
      if (el.closest('script, style, noscript')) return NodeFilter.FILTER_REJECT
      return NodeFilter.FILTER_ACCEPT
    },
  })

  let accumulated = ''
  let tn: Text | null
  while ((tn = walker.nextNode() as Text | null)) {
    const content = tn.textContent ?? ''
    if (!content) continue
    nodes.push({ node: tn, start: accumulated.length })
    accumulated += content
  }

  const matchIdx = accumulated.indexOf(search)
  if (matchIdx === -1) return null
  const matchEnd = matchIdx + search.length

  let startEntry: { node: Text; start: number } | undefined
  let endEntry: { node: Text; start: number } | undefined

  for (const entry of nodes) {
    const nodeEnd = entry.start + (entry.node.textContent?.length ?? 0)
    if (!startEntry && entry.start <= matchIdx && nodeEnd > matchIdx) {
      startEntry = entry
    }
    if (entry.start < matchEnd && nodeEnd >= matchEnd) {
      endEntry = entry
      break
    }
  }
  if (!startEntry || !endEntry) return null

  const range = document.createRange()
  range.setStart(startEntry.node, matchIdx - startEntry.start)
  range.setEnd(endEntry.node, matchEnd - endEntry.start)
  return range
}

function renderRewrites(rewrites: { original: string; replacement: string }[]): void {
  for (const r of rewrites) {
    if (!r.original || !r.replacement) continue
    const range = findTextRange(r.original)
    if (!range) continue

    try {
      const span = document.createElement('span')
      span.setAttribute('data-inline-highlight', 'rewrite')
      span.style.backgroundColor = 'rgba(191,219,254,0.92)'
      span.style.borderRadius = '4px'
      span.style.padding = '0 3px'
      span.title = 'Rewritten via Inline — double-click to revert'
      span.textContent = r.replacement
      range.deleteContents()
      range.insertNode(span)
      const orig = r.original
      span.addEventListener('dblclick', (e) => {
        e.preventDefault(); e.stopPropagation()
        const p = span.parentNode
        if (p) { p.replaceChild(document.createTextNode(orig), span); p.normalize() }
      })
    } catch { /* skip if DOM structure prevents it */ }
  }
}

/**
 * Fetch every annotation type for this page and apply them to the DOM.
 * Call once from content.tsx after the page has loaded.
 */
export function restoreAllAnnotations(): void {
  setTimeout(() => {
    chrome.runtime.sendMessage(
      { type: 'LOAD_ANNOTATIONS', payload: { pageUrl: normalizePageUrl() } },
      (response) => {
        if (chrome.runtime.lastError || !response?.ok) return
        const el = response.elements ?? {}

        const highlights = (el.highlights ?? []) as SavedHighlight[]
        if (highlights.length) restoreHighlights(highlights)

        const drawings = (el.drawings ?? []) as SavedStroke[]
        if (drawings.length) renderDrawings(drawings)

        const rewrites = (el.rewrites ?? []) as { original: string; replacement: string }[]
        if (rewrites.length) renderRewrites(rewrites)

        const stickyNotes = (el.stickyNotes ?? []) as RestoredNote[]
        if (stickyNotes.length) {
          document.dispatchEvent(
            new CustomEvent<RestoredNote[]>('inline:restoreNotes', { detail: stickyNotes }),
          )
        }
      },
    )
  }, 800)
}
