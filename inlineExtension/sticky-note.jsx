import { text } from "stream/consumers";
import "./StickyNote.css"

export default function StickyNote() {
  const {note, updateNote, clearNote, saving, lastSaved, loaded} = useNoteStorage();
  
  const handleCopy = () => {
    const content = [note.title, note.text].filter(Boolean).join("\n");
    navigator.clipboard.writeText(content);
  };

  const formattedTime = lastSaved
    ? lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;
  
  return (
    <div className="note">
      <div className="sticky-note-header">Sticky Note</div>
      <textarea name= "" id="" cols="30" rows="10" placeholder="Write your note here..."></textarea>
      
      <div className="tape" />

      <div className="header">
        <input
          className="title-input"
          value={note.title}
          onChange={(e) => updateNote({title: e.target.value})}
          placeholder="Note title..."
          maxLength={50}
          spellCheck={false}
        />
      <div className="header-actions">
          <button className="icon-button" onClick={handleCopy} title="Copy note">
          <CopyIcon />
          </button>
          <button className="icon-button" onClick={clearNote} title="Clear note">
            <TrashIcon />
          </button>
        </div>
      </div>

      <div className="body">
        <textarea
          className="text-input"
          value={note.text}
          onChange={(e) => updateNote({text: e.target.value})}
          placeholder="Start writing..."
          spellCheck={false}
        />
      </div>
      
      <div className="footer">  
        <div className="status">
          {saving ? (
            <span className="status-text saving">Saving...</span>
          ) : formattedTime ? (
            <span className="status-text saved">Last saved: {formattedTime}</span>
          ) : null}
        </div>
      </div>
    </div>
  )
}