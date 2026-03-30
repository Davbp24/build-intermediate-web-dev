'use client'

import Link from 'next/link'
import { Chrome } from 'lucide-react'
import { motion } from 'framer-motion'

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay },
})

export default function Hero() {
  return (
    <section className="bg-white w-full border-b-2 border-slate-900">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-28 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* ── LEFT: The Pitch ── */}
        <div className="flex flex-col items-start">

          {/* Badge */}
          <motion.span {...fade(0)}
            className="inline-flex items-center gap-2 rounded-md border-2 border-slate-900 bg-amber-300 text-slate-900 px-3 py-1 text-xs font-bold tracking-wide mb-6 uppercase"
          >
            Chrome Extension · Free
          </motion.span>

          {/* Headline */}
          <motion.h1 {...fade(0.06)}
            className="text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-tight"
          >
            Notes that live <br />on the web.
          </motion.h1>

          {/* Subtext */}
          <motion.p {...fade(0.12)}
            className="text-lg text-slate-600 max-w-md mt-5 leading-relaxed"
          >
            Save notes, highlight anything, and collaborate with your team &mdash;
            right on top of any website. Powered by AI.
          </motion.p>

          {/* CTAs */}
          <motion.div {...fade(0.18)} className="flex flex-col sm:flex-row gap-3 mt-8">
            <Link
              href="/app/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#191919] border-2 border-transparent px-6 py-3 text-sm font-semibold text-white hover:border-slate-900 hover:-translate-y-0.5 transition-all duration-150"
            >
              <Chrome className="w-4 h-4 shrink-0" />
              Add to Chrome — it&apos;s free
            </Link>
            <Link
              href="/app/dashboard"
              className="inline-flex items-center justify-center rounded-lg border-2 border-slate-900 bg-transparent px-6 py-3 text-sm font-semibold text-slate-900 hover:-translate-y-0.5 transition-all duration-150"
            >
              View Dashboard →
            </Link>
          </motion.div>

          <motion.p {...fade(0.24)} className="text-xs text-slate-400 mt-4 font-medium">
            Free for everyone &middot; Works with any website
          </motion.p>
        </div>

        {/* ── RIGHT: Structured DOM Mockup ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="w-full"
        >
          <div className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden">

            {/* Browser chrome bar */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b-2 border-slate-200 bg-white">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
              </div>
              <span className="text-[11px] text-slate-400 font-mono ml-1 truncate">github.com/acme/api-client/blob/main/fetch.ts</span>
            </div>

            {/* Two-column body: code (60%) + annotation gutter (40%) */}
            <div className="flex">

              {/* ── Code column ── */}
              <div className="w-[60%] p-5 bg-white font-mono text-[12px] leading-7 text-slate-700">
                <p className="text-slate-400">// fetch.ts — rate-limited API wrapper</p>
                <p>
                  <span className="text-[#37352F] font-semibold">const</span>{' '}
                  <span className="text-slate-900">rateLimitPerMin</span> ={' '}
                  <span className="text-amber-600 font-bold">100</span>;
                </p>
                <p className="text-slate-500 mt-1">
                  <span className="text-[#37352F] font-semibold">async function</span>{' '}
                  <span className="text-slate-900">fetchBatch</span>
                  {'(items: string[]) {'}
                </p>

                {/* Toolbar — inline, above the highlighted line */}
                <div className="mt-2 mb-1.5">
                  <span
                    className="inline-flex items-center gap-0.5 bg-[#191919] border-2 border-slate-900 rounded-md px-2 py-1"
                    style={{ boxShadow: '3px 3px 0px #F59E0B' }}
                  >
                    {['Rewrite', 'Summarize', 'Tag'].map((label, i) => (
                      <span key={label} className="flex items-center">
                        <span className="text-[10px] font-semibold text-white px-2 py-0.5 rounded whitespace-nowrap">
                          {label}
                        </span>
                        {i < 2 && <span className="w-px h-3 bg-white/20 inline-block mx-0.5" />}
                      </span>
                    ))}
                  </span>
                </div>

                {/* Highlighted line */}
                <p className="pl-4">
                  <span className="text-[#37352F] font-semibold">if</span> (items.length &gt;{' '}
                  <mark className="bg-amber-300 text-amber-900 rounded-sm px-0.5 font-bold" style={{ fontStyle: 'normal' }}>
                    rateLimitPerMin
                  </mark>
                  ) {'{'}
                </p>

                <p className="pl-8 text-slate-400">// split into chunks…</p>
                <p className="pl-4">{'}'}</p>

                <p className="mt-1 text-slate-500">
                  <span className="text-[#37352F] font-semibold">const</span>{' '}
                  <span className="text-slate-900">results</span> ={' '}
                  <span className="text-[#37352F] font-semibold">await</span> Promise.all(batches);
                </p>
                <p>
                  <span className="text-[#37352F] font-semibold">return</span> results.flat();
                </p>
                <p>{'}'}</p>
              </div>

              {/* ── Annotation gutter ── */}
              <div className="w-[40%] p-4 bg-slate-50 border-l-2 border-slate-200 flex flex-col gap-4">

                {/* Horizontal connector — dashed line bridging the gutter border */}
                <div className="flex items-center gap-0 -ml-4 mt-16">
                  <div className="w-4 border-t-2 border-dashed border-[#8EB4DC]" />
                  <span className="w-2 h-2 rounded-full bg-[#4B83C4] shrink-0 -ml-1" />
                </div>

                {/* Indigo note — aligned with highlighted code line */}
                <div
                  className="bg-[#F1F1EF] border-2 border-[#4B83C4] rounded-lg p-3 -mt-1"
                  style={{ boxShadow: '4px 4px 0px #6366F1' }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#4B83C4] shrink-0" />
                    <span className="text-[10px] font-bold text-[#4B83C4] uppercase tracking-wider">Inline Note</span>
                  </div>
                  <p className="text-[12px] text-[#37352F] leading-relaxed font-medium">
                    Wait — the API rate limit here is <span className="font-bold">50/min</span>, not 100.
                    We need to batch these requests.
                  </p>
                  <p className="text-[10px] text-[#787774] mt-2 font-mono">@you · just now</p>
                </div>

                {/* Amber note — further down in the gutter */}
                <div
                  className="bg-amber-50 border-2 border-amber-400 rounded-lg p-3"
                  style={{ boxShadow: '3px 3px 0px #F59E0B' }}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Highlight</span>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                    Summarized: batching strategy needed for pagination calls.
                  </p>
                  <p className="text-[10px] text-amber-400 mt-1.5 font-mono">auto · 2m ago</p>
                </div>

              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
