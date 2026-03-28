/**
 * Service worker: registers context menus and relays messages to the content script.
 */
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'inline-analyze-risk',
      title: 'Analyze page risk (Inline)',
      contexts: ['page'],
    })
  })
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== 'inline-analyze-risk' || tab?.id == null) return
  chrome.tabs.sendMessage(tab.id, { type: 'INLINE_PAGE_RISK' }).catch(() => {
    /* tab may not have content script injected yet */
  })
})
