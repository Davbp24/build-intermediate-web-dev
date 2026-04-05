/* Extension popup logic — external file for MV3 CSP (no inline scripts). */
function $(id) {
  return document.getElementById(id)
}

chrome.storage.local.get(['inlineApiBase', 'inlineAccessToken'], (r) => {
  const api = $('apiBase')
  const tok = $('token')
  if (api) api.value = r.inlineApiBase || 'http://localhost:3000'
  if (tok) tok.value = r.inlineAccessToken || ''
})

const saveBtn = $('save')
if (saveBtn) {
  saveBtn.addEventListener('click', () => {
    const apiEl = $('apiBase')
    const tokEl = $('token')
    const msg = $('savedMsg')
    const base = ((apiEl && apiEl.value) || 'http://localhost:3000').replace(/\/$/, '')
    const token = tokEl ? tokEl.value : ''
    chrome.storage.local.set({ inlineApiBase: base, inlineAccessToken: token }, () => {
      if (msg) {
        msg.style.display = 'block'
        setTimeout(() => { msg.style.display = 'none' }, 2000)
      }
    })
  })
}
