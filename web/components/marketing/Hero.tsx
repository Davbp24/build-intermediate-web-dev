'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94]

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: EASE },
})

/** Sweeping dashed arc with a paper airplane at the end — decorative background element. */
function DashedFlightPath() {
  const pathD =
    'M -100 400 C 120 300, 260 140, 420 100 C 620 60, 780 140, 980 300'

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-visible hidden sm:block"
      aria-hidden
    >
      <svg
        viewBox="0 0 900 560"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
      >
        {/* The dashed arc */}
        <motion.path
          d={pathD}
          stroke="rgb(168 162 158 / 0.35)"
          strokeWidth="1.5"
          strokeDasharray="8 8"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, delay: 0.4, ease: 'easeOut' }}
        />
        {/* Paper airplane at the end of the path */}
        <motion.g
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 2.2, ease: EASE }}
        >
          <g transform="translate(980,300) rotate(-20)">
            <path
              d="M 0 0 L -22 -8 L -6 -2 L -18 6 Z"
              fill="rgb(168 162 158 / 0.45)"
            />
            <line
              x1="-6"
              y1="-2"
              x2="-13"
              y2="2"
              stroke="rgb(168 162 158 / 0.35)"
              strokeWidth="0.8"
            />
          </g>
        </motion.g>
      </svg>
    </div>
  )
}

function BrowserMockup() {
  return (
    <div className="relative rounded-3xl  border-2 border-stone-500/60 p-2.5 md:p-3 bg-[#FDFBF7]">
      <div className="bg-white rounded-2xl border border-stone-200/50 overflow-hidden">
        <div className="relative flex items-center px-5 py-3 border-b border-stone-100">
          <div className="flex gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-stone-200" />
            <span className="w-2.5 h-2.5 rounded-full bg-stone-200" />
            <span className="w-2.5 h-2.5 rounded-full bg-stone-200" />
          </div>
          <div className="pointer-events-none absolute left-1/2 top-1/2 w-[calc(100%-5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex justify-center">
            <div className="bg-stone-50 rounded-md px-4 py-1.5 text-xs text-stone-400 font-mono text-center truncate">
              app.inline.dev/workspace/dashboard
            </div>
          </div>
        </div>

        <div className="flex min-h-[600px] md:min-h-[700px]">
        {/* Sidebar */}
        <div className="w-52 border-r border-stone-100 p-4 hidden md:block">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-6 h-6 rounded-md bg-pink-200" />
            <span className="text-xs font-semibold text-stone-700">Acme</span>
          </div>
          <div className="space-y-1">
            {['Search', 'Ask'].map(item => (
              <div key={item} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-stone-500">
                <div className="w-3 h-3 rounded bg-stone-200" />
                {item}
              </div>
            ))}
          </div>
          <div className="mt-5 mb-2 text-[10px] font-medium uppercase tracking-widest text-stone-400">
            My Channels
          </div>
          <div className="space-y-0.5">
            {['My Private Channel', 'Company Handbook', 'About the Team', 'Policies and Procedures', 'Recruitment', 'Performance & Development', 'Monthly Updates'].map((ch, i) => (
              <div key={ch} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs ${i === 1 ? 'bg-blue-50 text-blue-700 font-medium' : 'text-stone-500'}`}>
                <div className={`w-3 h-3 rounded ${i === 1 ? 'bg-blue-200' : 'bg-stone-200'}`} />
                <span className="truncate">{ch}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-[10px] text-stone-400">
            All Channels (21)
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-6 md:p-8">
          <div className="flex items-center gap-2 text-xs text-stone-400 mb-4">
            <span>Human Resources</span>
          </div>
          <div className="bg-pink-100 rounded-2xl h-60 mb-6 flex items-end justify-center overflow-hidden">
            <div className="flex gap-4 mb-4">
              <div className="w-20 h-24 bg-pink-200/60 rounded-lg" />
              <div className="w-20 h-24 bg-pink-200/60 rounded-lg" />
            </div>
          </div>
          <div className="mx-auto max-w-md w-full text-left">
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Verified
              </span>
              <span className="text-[10px] text-stone-400">until November 16, 2025</span>
            </div>
            <h2 className="text-3xl font-bold text-stone-800 mb-2">Company Handbook</h2>
            <p className="text-xs text-stone-500 leading-relaxed mb-6">
              Welcome to our Company Handbook, the go-to place for anything related to you and the way we work at Acme!
            </p>
            <p className="text-xs text-stone-500 leading-relaxed mb-4">
              At Acme, we&apos;re all about creating a workplace where everyone feels supported, valued, and inspired to do their best.
            </p>
            <h4 className="text-sm font-semibold text-stone-700 mb-2">Fast Track Links</h4>
            <div className="space-y-1.5">
              {['Onboarding checklist', 'Time off policy', 'Remote work guidelines'].map(link => (
                <div key={link} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-sm bg-stone-200 shrink-0" />
                  <span className="text-xs text-blue-500">{link}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Floating testimonial cards — outside overflow-hidden so they are not clipped */}
      <div className="hidden md:block absolute bottom-36 -left-4 lg:-left-15 bg-white rounded-2xl border border-stone-200/50 p-5 max-w-xs shadow-md shadow-stone-200/50 z-1">
        <p className="text-xs text-stone-600 leading-relaxed mb-3">
          &ldquo;The editing interface and document structure are SO simple and useful. It&rsquo;s been the best Knowledge Base experience we&rsquo;ve had.&rdquo;
        </p>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-stone-200" />
          <div>
            <p className="text-xs font-semibold text-stone-800">Martijn Hazelaar</p>
            <p className="text-[10px] text-stone-400">CTO at Flexdealer</p>
          </div>
        </div>
      </div>
      <div className="hidden md:block absolute bottom-24 lg:bottom-1/2 right-5 lg:-right-15 bg-white rounded-2xl border border-stone-200/50 p-5 max-w-xs shadow-md shadow-stone-200/50 z-1">
        <p className="text-xs text-stone-600 leading-relaxed mb-3">
          &ldquo;The editing interface and document structure are SO simple and useful. It&rsquo;s been the best Knowledge Base experience we&rsquo;ve had.&rdquo;
        </p>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-stone-200" />
          <div>
            <p className="text-xs font-semibold text-stone-800">Martijn Hazelaar</p>
            <p className="text-[10px] text-stone-400">CTO at Flexdealer</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const mockupParallaxY = useTransform(scrollYProgress, [0, 1], [0, 72])

  return (
    <section ref={heroRef} className="relative bg-[#FDFBF7] w-full overflow-hidden">
      <DashedFlightPath />
      <div className="relative z-1 max-w-5xl mx-auto px-6 lg:px-10 pt-12 pb-8 text-center">

        {/* Top pill badge */}
        <motion.div {...fade(0)} className="flex justify-center mb-8">
          <span className="inline-flex items-center gap-2.5 rounded-full border border-stone-200/60 bg-white px-4 py-1.5 text-sm text-stone-600">
            <span className="inline-flex items-center justify-center rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-semibold text-white uppercase tracking-wide">
              New
            </span>
            Your notes, right where you need them.
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1 {...fade(0.06)} className="text-5xl md:text-7xl font-semibold tracking-tight text-[#1C1E26] leading-[1.1] mb-6">
          Your thoughts, <br />
          deserve a home.
        </motion.h1>

        {/* Subtext */}
        <motion.p {...fade(0.12)} className="text-lg text-stone-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Save notes, highlight anything, and collaborate with your team —
          right on top of any website. Powered by AI.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div {...fade(0.18)} className="flex flex-col sm:flex-row justify-center gap-3 mb-6">
          <Link
            href="/app/dashboard"
            className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-transparent px-7 py-3 text-sm font-medium text-stone-800 transition-colors hover:border-stone-400 hover:bg-white"
          >
            Start for free
          </Link>
          <Link
            href="#"
            className="inline-flex items-center justify-center rounded-full bg-[#1C1E26] px-7 py-3 text-sm font-medium text-white transition-colors hover:bg-stone-800"
          >
            Book a demo
          </Link>
        </motion.div>
      </div>

      {/* Browser Mockup — entrance + smooth scroll parallax */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
        className="max-w-6xl mx-auto px-6 lg:px-10 pb-16 relative"
      >
        <motion.div style={{ y: mockupParallaxY }} className="will-change-transform">
          <BrowserMockup />
        </motion.div>
      </motion.div>
    </section>
  )
}
