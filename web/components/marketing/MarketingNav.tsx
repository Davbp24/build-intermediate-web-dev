'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Product', href: '#features', hasDropdown: true },
  { label: 'Solutions', href: '#solutions', hasDropdown: true },
  { label: 'Pricing', href: '#pricing', hasDropdown: false },
  { label: 'Resources', href: '#resources', hasDropdown: true },
]

function InlineLogo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn('flex items-center gap-2', className)}>
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#1C1E26]" aria-hidden>
        <span className="block h-4 w-1 rounded-full bg-white -rotate-12" />
      </div>
      <span className="font-semibold text-lg tracking-tight text-[#1C1E26]">
        inline<span className="text-stone-400 ml-0.5 text-sm align-top">~</span>
      </span>
    </Link>
  )
}

export default function MarketingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled ? 'bg-[#FDFBF7]/90 backdrop-blur-md border-b border-stone-200/60' : 'bg-transparent'
      )}
    >
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 lg:px-10 py-3.5">
        <InlineLogo />

        <ul className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(link => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="inline-flex items-center gap-1 px-3.5 py-2 text-sm font-medium text-stone-600 transition-colors hover:text-[#1C1E26] rounded-full"
              >
                {link.label}
                {link.hasDropdown && <ChevronDown className="w-3 h-3 opacity-50" />}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-stone-600 hover:text-[#1C1E26] transition-colors hidden sm:inline px-3 py-2"
          >
            Sign in
          </Link>
          <Link
            href="#"
            className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-transparent px-5 py-2 text-sm font-medium text-stone-800 transition-colors hover:border-stone-400 hover:bg-white"
          >
            Book a demo
          </Link>
          <Link
            href="/app/dashboard"
            className="inline-flex items-center justify-center rounded-full bg-[#1C1E26] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-800"
          >
            Start for free
          </Link>
        </div>
      </nav>
    </header>
  )
}
