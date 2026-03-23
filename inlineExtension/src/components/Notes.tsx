function Notes() {

async function handleAddNote() {
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true})

  if (tab.id !== undefined) {
    chrome.tabs.sendMessage(tab.id, {action: 'addNote'})
  }
}

  return (
    <div className="notes-screen">
      <h2>Notes</h2>
      <button onClick={handleAddNote}>
      Add Sticky formNoValidate
      </button>
    </div>
  )
}

export default Notes;