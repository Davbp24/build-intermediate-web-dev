'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, Send, Loader2, Bot, User, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { loadFolderDocuments } from '@/lib/workspace-library'

interface Message {
  role:    'user' | 'assistant'
  content: string
}

function getWsId(pathname: string): string {
  const m = pathname.match(/\/app\/(ws-[^/]+)/)
  return m ? m[1] : 'ws-1'
}

export default function WorkspaceChatPanel() {
  const pathname = usePathname()
  const wsId     = getWsId(pathname)

  const [open,     setOpen]     = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80)
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    setMessages(prev => [...prev, { role: 'user', content: text }])
    setInput('')
    setLoading(true)

    try {
      const docs = loadFolderDocuments().map(d => ({ title: d.title, content: d.content }))
      const res  = await fetch('/api/ai/rag', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: text, workspaceId: wsId, libraryDocs: docs }),
      })

      if (!res.ok || !res.body) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Make sure your OpenAI key is configured.' }])
        return
      }

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setMessages(prev => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content: accumulated }
          return next
        })
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Network error.' }])
    } finally {
      setLoading(false)
    }
  }, [input, loading, wsId])

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send() }
  }

  return (
    /* Centered at bottom of the viewport, above the workspace chrome */
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2" style={{ width: 'min(680px, calc(100vw - 48px))' }}>

      {/* ── Expanded panel — slides up ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            className="w-full rounded-2xl border border-slate-200 bg-white overflow-hidden"
            style={{ maxHeight: 420 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bot className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground tracking-tight">Workspace AI</span>
                <span className="text-[10px] text-muted-foreground/60 bg-slate-100 px-1.5 py-0.5 rounded font-medium">{wsId}</span>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setMessages([])}
                    className="text-[10px] text-muted-foreground hover:text-foreground px-2 py-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="overflow-y-auto px-4 py-3 space-y-3 scrollbar-minimal" style={{ maxHeight: 300 }}>
              {messages.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <Sparkles className="w-6 h-6 text-slate-200" />
                  <p className="text-xs text-muted-foreground">Ask anything about your captured notes</p>
                  {['What did I save about React hooks?', 'Summarize my recent captures', 'What domains do I visit most?'].map(s => (
                    <button key={s} type="button"
                      onClick={() => { setInput(s); setTimeout(() => inputRef.current?.focus(), 50) }}
                      className="text-[11px] text-primary hover:underline cursor-pointer"
                    >{s}</button>
                  ))}
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={cn('flex gap-2 items-start', m.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                  <div className={cn('w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5',
                    m.role === 'user' ? 'bg-primary/10' : 'bg-slate-100')}>
                    {m.role === 'user'
                      ? <User className="w-2.5 h-2.5 text-primary" />
                      : <Bot  className="w-2.5 h-2.5 text-slate-500" />}
                  </div>
                  <div className={cn('rounded-xl px-3 py-2 text-xs leading-relaxed max-w-[82%]',
                    m.role === 'user'
                      ? 'bg-primary text-white rounded-tr-sm'
                      : 'bg-slate-50 border border-slate-200 text-foreground rounded-tl-sm',
                  )}>
                    {m.content || (loading && i === messages.length - 1 ? <span className="animate-pulse opacity-60">…</span> : '…')}
                  </div>
                </div>
              ))}
              {loading && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex gap-2 items-center">
                  <div className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center">
                    <Bot className="w-2.5 h-2.5 text-slate-400" />
                  </div>
                  <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom bar (always visible) ── */}
      <div className={cn(
        'w-full flex items-center gap-2 px-4 py-2.5 rounded-2xl border bg-white transition-all duration-150',
        open ? 'border-slate-200 rounded-t-none border-t-0' : 'border-slate-200',
      )}>
        <Sparkles className="w-4 h-4 text-primary shrink-0" />
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => !open && setOpen(true)}
          placeholder="Ask your workspace…"
          className="flex-1 text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground/50 text-foreground"
          disabled={loading}
        />
        <div className="flex items-center gap-1 shrink-0">
          {open && input.trim() && (
            <button
              type="button"
              onClick={() => void send()}
              disabled={loading}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-white disabled:opacity-40 hover:bg-[#1e4fa3] transition-colors cursor-pointer"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            </button>
          )}
          {!open && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer px-1"
            >
              ⌘K
            </button>
          )}
          {open && !input.trim() && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
