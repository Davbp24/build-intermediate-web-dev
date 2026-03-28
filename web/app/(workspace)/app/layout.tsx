import { SidebarProvider } from '@/lib/sidebar-context'
import WorkspaceShell from '@/components/shell/WorkspaceShell'

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <WorkspaceShell>
        {children}
      </WorkspaceShell>
    </SidebarProvider>
  )
}
