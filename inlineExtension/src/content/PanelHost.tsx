import { useState, useEffect, useRef } from 'react'
import Home from '../components/Home'

/**
 * PanelHost bridges the content script world with the panel components.
 * It captures the current text selection and range so panels (Rewrite, AI)
 * can operate on the user's highlighted text.
 */
export default function PanelHost() {
  const [selectedText, setSelectedText] = useState('')
  const rangeRef = useRef<Range | null>(null)

  useEffect(() => {
    function capture() {
      const sel = window.getSelection()
      if (sel && !sel.isCollapsed && sel.toString().trim()) {
        setSelectedText(sel.toString())
        rangeRef.current = sel.getRangeAt(0).cloneRange()
      }
    }
    document.addEventListener('mouseup', capture)
    document.addEventListener('keyup', capture)
    return () => {
      document.removeEventListener('mouseup', capture)
      document.removeEventListener('keyup', capture)
    }
  }, [])

  return (
    <div data-panel-host="">
      <Home selectedText={selectedText} originalRange={rangeRef.current} />
    </div>
  )
}
