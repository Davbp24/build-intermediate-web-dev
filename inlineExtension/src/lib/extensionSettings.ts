export type ExtensionSettings = {
  apiBaseUrl: string
  accessToken: string
}

const DEFAULT_BASE = 'http://localhost:3000'

export async function loadSettings(): Promise<ExtensionSettings> {
  return new Promise(resolve => {
    chrome.storage.local.get(['inlineApiBase', 'inlineAccessToken'], r => {
      resolve({
        apiBaseUrl: typeof r.inlineApiBase === 'string' && r.inlineApiBase ? r.inlineApiBase : DEFAULT_BASE,
        accessToken: typeof r.inlineAccessToken === 'string' ? r.inlineAccessToken : '',
      })
    })
  })
}

export async function saveSettings(s: Partial<ExtensionSettings>): Promise<void> {
  const patch: Record<string, string> = {}
  if (s.apiBaseUrl !== undefined) patch.inlineApiBase = s.apiBaseUrl.replace(/\/$/, '')
  if (s.accessToken !== undefined) patch.inlineAccessToken = s.accessToken
  await chrome.storage.local.set(patch)
}
