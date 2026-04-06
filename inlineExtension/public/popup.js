const $ = id => document.getElementById(id)
chrome.storage.local.get(['inlineApiBase', 'inlineAccessToken'], r => {
  $('apiBase').value = r.inlineApiBase || 'http://localhost:3001'
  $('token').value   = r.inlineAccessToken || ''
})
$('save').addEventListener('click', () => {
  const base = ($('apiBase').value || 'http://localhost:3001').replace(/\/$/, '')
  chrome.storage.local.set({ inlineApiBase: base, inlineAccessToken: $('token').value }, () => {
    $('savedMsg').style.display = 'block'
    setTimeout(() => { $('savedMsg').style.display = 'none' }, 2000)
  })
})
