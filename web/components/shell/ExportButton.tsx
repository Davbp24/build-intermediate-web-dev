'use client'

import { useState } from 'react'
import { Download, Check, Loader2 } from 'lucide-react'
import { exportWorkspaceNotes } from '@/lib/actions/export'

interface ExportButtonProps {
  workspaceId?: string
  className?:   string
}

export default function ExportButton({ workspaceId, className }: ExportButtonProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle')

  async function handleExport() {
    if (state !== 'idle') return
    setState('loading')
    try {
      const { csv, filename } = await exportWorkspaceNotes(workspaceId)

      // Trigger native browser download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setState('done')
      setTimeout(() => setState('idle'), 2500)
    } catch {
      setState('idle')
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={state === 'loading'}
      className={`flex items-center gap-2 cursor-pointer disabled:opacity-60 ${className ?? ''}`}
    >
      {state === 'loading' ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
      ) : state === 'done' ? (
        <Check className="w-3.5 h-3.5 text-emerald-500" />
      ) : (
        <Download className="w-3.5 h-3.5 text-muted-foreground" />
      )}
      <span>{state === 'done' ? 'Downloaded!' : 'Export CSV'}</span>
    </button>
  )
}
