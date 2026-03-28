'use client'

import Link from 'next/link'
import { Chrome, Globe } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Hero() {
  return (
    <section className="bg-slate-50 w-full">
      <div className="flex flex-col items-center text-center mt-10 md:mt-14 px-4 w-full max-w-7xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center rounded-full bg-[#2564BC]/10 text-[#2564BC] px-4 py-1 text-sm font-medium mb-6"
        >
          Trusted by 2,400+ researchers &amp; engineers
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="text-5xl md:text-6xl font-bold text-slate-900 tracking-tight leading-tight max-w-[700px]"
        >
          Context that sticks with you
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="text-lg md:text-xl text-slate-600 max-w-[600px] mt-6 leading-relaxed"
        >
          Your thoughts, insights, and context—saved exactly where you found them.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8"
        >
          <Link
            href="/app/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2564BC] px-8 py-3 text-sm font-medium text-white hover:bg-[#1e4fa3] transition-colors w-full sm:w-auto"
          >
            <Chrome className="w-4 h-4 shrink-0" aria-hidden />
            Add to Chrome — it&apos;s free
          </Link>
          <Link
            href="/app/dashboard"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-8 py-3 text-sm font-medium text-slate-900 hover:bg-slate-50 transition-colors w-full sm:w-auto"
          >
            View Dashboard →
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="text-sm text-slate-500 mt-4"
        >
          Free for individuals • No signup required
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35 }}
        className="mt-16 w-full max-w-7xl mx-auto px-4 pb-24"
      >
        <div className="rounded-t-3xl border-t border-l border-r border-slate-200 bg-slate-50 overflow-hidden">
          <div className="h-10 flex items-center gap-3 border-b border-slate-200 bg-white px-3 sm:px-4">
            <div className="flex shrink-0 gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" aria-hidden />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" aria-hidden />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" aria-hidden />
            </div>
            <div className="flex h-7 min-w-0 flex-1 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3">
              <Globe className="w-3.5 h-3.5 shrink-0 text-slate-500" aria-hidden />
              <span className="truncate text-xs text-slate-600">github.com/vercel/next.js</span>
            </div>
          </div>

          <div className="p-8 md:p-10 min-h-[240px] bg-slate-100">
            <div className="mx-auto max-w-4xl space-y-3">
              <div className="h-5 w-40 bg-slate-300/80 rounded-sm" />
              <div className="h-3 w-full bg-slate-300/60 rounded-sm" />
              <div className="h-3 w-[92%] bg-slate-300/60 rounded-sm" />
              <div className="h-3 w-[78%] bg-slate-300/60 rounded-sm" />
              <div className="pt-4 space-y-2">
                <div className="h-3 w-full bg-slate-300/50 rounded-sm" />
                <div className="h-3 w-[70%] bg-slate-300/50 rounded-sm" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
