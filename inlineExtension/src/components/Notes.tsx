function Notes() {

  async function handleAddNote() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

    // Only works on real web pages — content script can't run on chrome:// or new tab pages
    if (tab.id === undefined || !tab.url?.startsWith('http')) {
      alert('Please navigate to a webpage first.')
      return
    }

    try {
      await chrome.tabs.sendMessage(tab.id, { action: 'addNote' })
    } catch {
      alert('Could not connect to the page. Try refreshing the tab first.')
    }
  }

  return (
    <div className="notes-screen">
      <h2>Notes</h2>
      <button onClick={handleAddNote}>
        Add Sticky Note
      </button>
    </div>
  )
}

export default Notes