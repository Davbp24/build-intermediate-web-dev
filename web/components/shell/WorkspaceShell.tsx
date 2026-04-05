'use client'

import { AnimatePresence } from 'framer-motion'
import { useSidebar } from '@/lib/sidebar-context'
import { ChatPanelProvider } from '@/lib/chat-panel-context'
import Sidebar from './Sidebar'
import CommandPalette from './CommandPalette'
import RightContextPanel from './RightContextPanel'
import WorkspaceChatPanel from './WorkspaceChatPanel'

export default function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const { rightPanelOpen } = useSidebar()

  return (
    <ChatPanelProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <main className="flex-1 overflow-y-auto scrollbar-minimal">
            {children}
          </main>
        </div>

        <AnimatePresence mode="sync">
          {rightPanelOpen && <RightContextPanel key="right-panel" />}
        </AnimatePresence>

        <CommandPalette />
        <WorkspaceChatPanel />
      </div>
    </ChatPanelProvider>
  )
}
