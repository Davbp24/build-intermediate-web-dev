export interface SavedRewrite {
  original: string
  replacement: string
  timestamp: number
}

let rewriteCache: SavedRewrite[] = []

function isContextValid(): boolean {
  try { return !!chrome.runtime?.id } catch { return false }
}

function safeSendMessage(message: unknown): void {
  if (!isContextValid()) return
  try {
    chrome.runtime.sendMessage(message, () => {
      try { void chrome.runtime.lastError } catch { /* swallow */ }
    })
  } catch { /* extension context invalidated */ }
}

function normalizePageUrl(): string {
  try {
    const u = new URL(window.location.href)
    return `${u.origin}${u.pathname}`.replace(/\/$/, '')
  } catch { return window.location.href }
}

export function setRewriteCache(rewrites: SavedRewrite[]): void {
  rewriteCache = [...rewrites]
}

export function addRewrite(entry: SavedRewrite): void {
  const existingIdx = rewriteCache.findIndex(r => r.original === entry.original)
  if (existingIdx !== -1) {
    rewriteCache[existingIdx] = entry
  } else {
    rewriteCache.push(entry)
  }
  syncRewritesToBackend()
}

function syncRewritesToBackend(): void {
  safeSendMessage({
    type: 'SAVE_ANNOTATIONS',
    payload: { pageUrl: normalizePageUrl(), featureKey: 'rewrites', data: rewriteCache },
  })
}

/**
 * Restore rewrites by finding original text in the DOM and replacing it.
 * Returns true if every rewrite was applied successfully.
 */
export function restoreRewrites(saved?: SavedRewrite[]): boolean {
  const items = saved ?? rewriteCache
  if (items.length === 0) return true
  if (saved) rewriteCache = [...saved]

  const body = document.body
  if (!body) return false

  let allRestored = true
  for (const r of items) {
    if (!r.original || !r.replacement || r.original.length < 2) continue
    if (!replaceTextInDom(body, r.original, r.replacement)) {
      allRestored = false
    }
  }
  return allRestored
}

function replaceTextInDom(root: HTMLElement, original: string, replacement: string): boolean {
  // Fast path: single text-node match
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let node: Text | null
  while ((node = walker.nextNode() as Text | null)) {
    const parent = node.parentElement
    if (parent?.hasAttribute('data-inline-highlight')) continue
    if (parent?.closest('#inline-extension-root')) continue

    const idx = node.textContent?.indexOf(original) ?? -1
    if (idx === -1) continue

    const before = node.textContent!.substring(0, idx)
    const after = node.textContent!.substring(idx + original.length)
    node.textContent = before + replacement + after
    parent?.normalize()
    return true
  }

  // Slow path: match across multiple text nodes within a block element
  const BLOCK_SELECTOR =
    'p, div, h1, h2, h3, h4, h5, h6, li, td, th, blockquote, article, section, main, aside, figcaption, details, summary'
  const blocks = root.querySelectorAll(BLOCK_SELECTOR)

  for (const block of blocks) {
    if ((block as HTMLElement).closest('#inline-extension-root')) continue
    const textContent = block.textContent ?? ''
    if (!textContent.includes(original)) continue
    if (replaceAcrossTextNodes(block as HTMLElement, original, replacement)) return true
  }

  return false
}

function replaceAcrossTextNodes(el: HTMLElement, original: string, replacement: string): boolean {
  const textNodes: Text[] = []
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  let node: Text | null
  while ((node = walker.nextNode() as Text | null)) {
    if (node.parentElement?.hasAttribute('data-inline-highlight')) continue
    textNodes.push(node)
  }

  // Build a concatenated string and map each char back to its source node
  let concat = ''
  const ranges: { node: Text; start: number; end: number }[] = []
  for (const tn of textNodes) {
    const start = concat.length
    concat += tn.textContent ?? ''
    ranges.push({ node: tn, start, end: concat.length })
  }

  const idx = concat.indexOf(original)
  if (idx === -1) return false

  const endIdx = idx + original.length
  const affected = ranges.filter(r => r.end > idx && r.start < endIdx)
  if (affected.length === 0) return false

  if (affected.length === 1) {
    const r = affected[0]
    const localIdx = idx - r.start
    const before = r.node.textContent!.substring(0, localIdx)
    const after = r.node.textContent!.substring(localIdx + original.length)
    r.node.textContent = before + replacement + after
    r.node.parentElement?.normalize()
    return true
  }

  // Multi-node: put replacement in first node, trim remaining nodes
  const first = affected[0]
  const localStart = idx - first.start
  first.node.textContent = first.node.textContent!.substring(0, localStart) + replacement

  for (let i = 1; i < affected.length; i++) {
    const r = affected[i]
    if (i < affected.length - 1) {
      r.node.textContent = ''
    } else {
      const localEnd = endIdx - r.start
      r.node.textContent = r.node.textContent!.substring(localEnd)
    }
  }

  // Remove empty text nodes left behind
  for (let i = 1; i < affected.length; i++) {
    if (!affected[i].node.textContent && affected[i].node.parentNode) {
      affected[i].node.parentNode!.removeChild(affected[i].node)
    }
  }

  first.node.parentElement?.normalize()
  return true
}
