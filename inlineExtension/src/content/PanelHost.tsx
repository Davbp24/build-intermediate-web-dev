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
    function handleFeature(e: Event) {
      const detail = (e as CustomEvent).detail as { featureId: string; selectedText: string }
      if (detail.selectedText) {
        setSelectedText(detail.selectedText)
      }
    }
    document.addEventListener('mouseup', capture)
    document.addEventListener('keyup', capture)
    document.addEventListener('inline:feature', handleFeature)
    return () => {
      document.removeEventListener('mouseup', capture)
      document.removeEventListener('keyup', capture)
      document.removeEventListener('inline:feature', handleFeature)
    }
  }, [])

  return (
    <div data-panel-host="">
      <Home selectedText={selectedText} originalRange={rangeRef.current} />
    </div>
  )
}
