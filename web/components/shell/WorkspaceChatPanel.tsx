'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, Loader2, Bot, User, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChatPanel } from '@/lib/chat-panel-context'
import { loadFolderDocuments } from '@/lib/workspace-library'

const EASE = [0.22, 1, 0.36, 1] as const
const PANEL_DURATION = 0.32

interface Message {
  role: 'user' | 'assistant'
  content: string
}

function getWsId(pathname: string): string {
  const m = pathname.match(/\/app\/(ws-[^/]+)/)
  return m ? m[1] : 'ws-1'
}

function useIsApplePlatform() {
  const [apple, setApple] = useState(false)
  useEffect(() => {
    setApple(typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent))
  }, [])
  return apple
}

export default function WorkspaceChatPanel() {
  const pathname = usePathname()
  const wsId = getWsId(pathname)
  const { open, setOpen, toggle } = useChatPanel()
  const isApple = useIsApplePlatform()

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        const t = e.target as HTMLElement
        if (t.closest('[data-radix-dialog-content], [role="alertdialog"]')) return
        if (t.closest('[data-chat-panel]')) {
          e.preventDefault()
          setOpen(false)
        }
      }
      const isMod = e.metaKey || e.ctrlKey
      if (!isMod || !e.shiftKey || e.key.toLowerCase() !== 'l') return
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, [contenteditable="true"]') && !t.closest('[data-chat-panel]')) {
        return
      }
      e.preventDefault()
      toggle()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, setOpen, toggle])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    setMessages(prev => [...prev, { role: 'user', content: text }])
    setInput('')
    setLoading(true)

    try {
      const docs = loadFolderDocuments().map(d => ({ title: d.title, content: d.content }))
      const res = await fetch('/api/ai/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, workspaceId: wsId, libraryDocs: docs }),
      })

      if (!res.ok || !res.body) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: 'Sorry, something went wrong. The AI service may be temporarily unavailable.',
          },
        ])
        return
      }

      const reader = res.body.getReader()
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  return (
    <div
      data-chat-panel
      className="fixed bottom-0 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-0 pb-4"
      style={{ width: 'min(680px, calc(100vw - 48px))' }}
    >
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 14, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.985 }}
            transition={{ duration: PANEL_DURATION, ease: EASE }}
            className="w-full overflow-hidden rounded-2xl border border-border bg-card shadow-[0_12px_40px_-12px_rgba(28,30,38,0.18)]"
            style={{ maxHeight: 420, willChange: 'transform, opacity' }}
          >
            <div className="flex items-center justify-between border-b border-border bg-[#FAF5EE] px-4 py-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1C1E26]/10">
                  <Bot className="h-3.5 w-3.5 text-[#1C1E26]" />
                </div>
                <span className="truncate text-xs font-semibold tracking-tight text-foreground">
                  Workspace AI
                </span>
                <span className="shrink-0 rounded-md bg-white/80 px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground ring-1 ring-border/60">
                  {wsId}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setMessages([])}
                    className="cursor-pointer rounded-md px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-white/80 hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/80 hover:text-foreground"
                  aria-label="Minimize chat"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div
              className="scrollbar-minimal space-y-3 overflow-y-auto px-4 py-3"
              style={{ maxHeight: 300 }}
            >
              {messages.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <Sparkles className="h-6 w-6 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">Ask anything about your captured notes</p>
                  {[
                    'What did I save about React hooks?',
                    'Summarize my recent captures',
                    'What domains do I visit most?',
                  ].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setInput(s)
                        setTimeout(() => inputRef.current?.focus(), 50)
                      }}
                      className="cursor-pointer text-[11px] text-[#57534e] underline decoration-border underline-offset-2 transition-colors hover:text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex items-start gap-2',
                    m.role === 'user' ? 'flex-row-reverse' : 'flex-row',
                  )}
                >
                  <div
                    className={cn(
                      'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md',
                      m.role === 'user' ? 'bg-secondary' : 'bg-muted',
                    )}
                  >
                    {m.role === 'user' ? (
                      <User className="h-2.5 w-2.5 text-foreground" />
                    ) : (
                      <Bot className="h-2.5 w-2.5 text-muted-foreground" />
                    )}
                  </div>
                  <div
                    className={cn(
                      'max-w-[82%] rounded-xl px-3 py-2 text-xs leading-relaxed',
                      m.role === 'user'
                        ? 'rounded-tr-sm bg-primary text-primary-foreground'
                        : 'rounded-tl-sm border border-border bg-muted/60 text-foreground',
                    )}
                  >
                    {m.content ||
                      (loading && i === messages.length - 1 ? (
                        <span className="animate-pulse opacity-60">…</span>
                      ) : (
                        '…'
                      ))}
                  </div>
                </div>
              ))}
              {loading && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-muted">
                    <Bot className="h-2.5 w-2.5 text-muted-foreground" />
                  </div>
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={cn(
          'flex w-full items-center gap-2 rounded-2xl border border-border bg-card/95 px-4 py-2.5 shadow-[0_4px_24px_-8px_rgba(28,30,38,0.12)] backdrop-blur-md transition-[border-radius,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          open && 'rounded-t-none border-t-0',
        )}
      >
        <Sparkles className="h-4 w-4 shrink-0 text-[#78716c]" />
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => !open && setOpen(true)}
          placeholder="Ask your workspace…"
          className="flex-1 border-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
          disabled={loading}
          aria-label="Workspace AI message"
        />
        <div className="flex shrink-0 items-center gap-1.5">
          {open && input.trim() && (
            <button
              type="button"
              onClick={() => void send()}
              disabled={loading}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </button>
          )}
          {!open && (
            <span
              className="hidden items-center gap-0.5 text-[10px] text-muted-foreground sm:inline-flex"
              title={isApple ? 'Open workspace AI (⌘⇧L)' : 'Open workspace AI (Ctrl+Shift+L)'}
            >
              <kbd className="rounded border border-border bg-muted/80 px-1 py-px font-mono text-[10px] text-muted-foreground">
                {isApple ? '⌘' : 'Ctrl'}
              </kbd>
              <kbd className="rounded border border-border bg-muted/80 px-1 py-px font-mono text-[10px] text-muted-foreground">
                ⇧
              </kbd>
              <kbd className="rounded border border-border bg-muted/80 px-1 py-px font-mono text-[10px] text-muted-foreground">
                L
              </kbd>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
