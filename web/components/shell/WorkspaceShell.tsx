'use client'

import { AnimatePresence } from 'framer-motion'
import { useSidebar } from '@/lib/sidebar-context'
import Sidebar from './Sidebar'
import CommandPalette from './CommandPalette'
import RightContextPanel from './RightContextPanel'
import WorkspaceChatPanel from './WorkspaceChatPanel'

export default function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <main className="flex-1 overflow-y-auto scrollbar-minimal">
          {children}
        </main>
      </div>

      {/* Right context panel slides in when sidebar collapses */}
      <AnimatePresence>
        {collapsed && <RightContextPanel key="right-panel" />}
      </AnimatePresence>

      <CommandPalette />
      <WorkspaceChatPanel />
    </div>
  )
}
