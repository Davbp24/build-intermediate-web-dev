export type ExtensionSettings = {
  apiBaseUrl: string
  accessToken: string
  blockedDomains: string[]
  focusMode: boolean
}

const DEFAULT_BASE = 'http://localhost:3000'

export async function loadSettings(): Promise<ExtensionSettings> {
  return new Promise(resolve => {
    chrome.storage.local.get(
      ['inlineApiBase', 'inlineAccessToken', 'inlineBlockedDomains', 'inlineFocusMode'],
      r => {
        let blockedDomains: string[] = []
        try {
          const raw = r.inlineBlockedDomains
          if (typeof raw === 'string') blockedDomains = JSON.parse(raw)
        } catch { /* invalid JSON, keep default */ }

        resolve({
          apiBaseUrl: typeof r.inlineApiBase === 'string' && r.inlineApiBase ? r.inlineApiBase : DEFAULT_BASE,
          accessToken: typeof r.inlineAccessToken === 'string' ? r.inlineAccessToken : '',
          blockedDomains: Array.isArray(blockedDomains) ? blockedDomains : [],
          focusMode: r.inlineFocusMode === 'true' || r.inlineFocusMode === true,
        })
      },
    )
  })
}

export async function saveSettings(s: Partial<ExtensionSettings>): Promise<void> {
  const patch: Record<string, string> = {}
  if (s.apiBaseUrl !== undefined) patch.inlineApiBase = s.apiBaseUrl.replace(/\/$/, '')
  if (s.accessToken !== undefined) patch.inlineAccessToken = s.accessToken
  if (s.blockedDomains !== undefined) patch.inlineBlockedDomains = JSON.stringify(s.blockedDomains)
  if (s.focusMode !== undefined) patch.inlineFocusMode = String(s.focusMode)
  await chrome.storage.local.set(patch)
}
