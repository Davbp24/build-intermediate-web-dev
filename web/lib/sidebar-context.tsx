'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface SidebarContextType {
  collapsed:    boolean
  setCollapsed: (v: boolean) => void
  toggle:       () => void
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed:    false,
  setCollapsed: () => {},
  toggle:       () => {},
})

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsedState] = useState(false)

  const setCollapsed = useCallback((v: boolean) => setCollapsedState(v), [])
  const toggle = useCallback(() => setCollapsedState(c => !c), [])

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, toggle }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  return useContext(SidebarContext)
}
