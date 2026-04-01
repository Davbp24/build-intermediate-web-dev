'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Docs', href: '#docs' },
]

function InlineLogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#2564BC]',
        className
      )}
      aria-hidden
    >
      <span className="block h-4 w-1 rounded-full bg-white -rotate-12" />
    </div>
  )
}

export default function MarketingNav() {
  const [floating, setFloating] = useState(false)

  useEffect(() => {
    const onScroll = () => setFloating(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-5 left-0 right-0 z-50 pointer-events-none transition-[padding] duration-300 ease-out',
        floating ? 'px-4 sm:px-6 md:px-8' : 'px-0'
      )}
    >
      <nav
        className={cn(
          'pointer-events-auto relative mx-auto flex w-full max-w-8xl items-center transition-[border-radius,background-color,border-color,padding] duration-300 ease-out',
          floating
            ? 'rounded-2xl border-2 border-dashed border-slate-300 bg-white px-5 py-3 md:px-8 lg:px-4'
            : 'border-2 border-transparent bg-white px-5 py-4 md:px-8 lg:px-12'
        )}
      >
        <div className="flex min-w-0 flex-1 justify-start pr-4 lg:pr-8">
          <Link href="/" className="flex min-w-0 items-center gap-2.5 text-slate-900">
            <InlineLogoMark />
            <span className="font-semibold text-lg tracking-tight">Inline</span>
          </Link>
        </div>

        <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 lg:gap-10 md:flex">
          {NAV_LINKS.map(link => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 whitespace-nowrap"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center min-w-0 flex-1 justify-end gap-4 sm:gap-6 pl-4 lg:pl-8">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:inline"
          >
            Log in
          </Link>
          <Link
            href="/app/dashboard"
            className="inline-flex items-center justify-center rounded-lg bg-[#2564BC] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1e4fa3]"
          >
            Get Extension
          </Link>
        </div>
      </nav>
    </header>
  )
}
