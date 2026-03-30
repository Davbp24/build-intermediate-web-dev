import type { Metadata } from 'next'
import Hero from '@/components/marketing/Hero'
import BentoGrid from '@/components/marketing/BentoGrid'
import FeatureSection from '@/components/marketing/FeatureSection'
import Link from 'next/link'
import { Chrome, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Inline — Your notes, right where you need them',
}

const TESTIMONIALS = [
  {
    quote: "Our product team uses Inline to leave feedback directly on staging sites. No more screenshots in Slack — everyone sees the note exactly where the issue is.",
    name: 'Amir Patel',
    role: 'Head of Product, Loom',
  },
  {
    quote: "I save recipes, travel tips, and apartment listings while I browse. When I come back a week later, all my notes are still right there on the page.",
    name: 'Jessica Torres',
    role: 'Freelance Designer',
  },
  {
    quote: "We replaced three tools with Inline. Bug reports, competitor research, and client deliverables — all annotated in context, shared across the team.",
    name: 'David Kim',
    role: 'VP of Engineering, Figma',
  },
]

export default function HomePage() {
  return (
    <>
      <Hero />
      <BentoGrid />
      <FeatureSection />

      {/* Testimonials */}
      <section className="py-24 px-6 bg-white border-t-2 border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
              People love it
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4">
              Used by teams and individuals alike
            </h2>
            <p className="text-slate-600 max-w-lg mx-auto">
              From product managers shipping features to people planning vacations — Inline fits any workflow.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.name}
                className="rounded-xl border-2 border-slate-200 bg-white p-6 space-y-4"
                style={{
                  boxShadow: i === 0
                    ? '4px 4px 0px #6366F1'
                    : i === 1
                    ? '4px 4px 0px #F59E0B'
                    : '4px 4px 0px #1E293B',
                }}
              >
                <p className="text-sm text-slate-600 leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 text-center bg-white border-t-2 border-slate-200">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-slate-900">
            Your thoughts deserve<br />a home on the web.
          </h2>
          <p className="text-slate-600 mb-10 text-lg max-w-md mx-auto">
            Free for individuals. Team plans for orgs that need shared workspaces and admin controls.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/app/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#191919] border-2 border-transparent px-7 py-3.5 text-sm font-semibold text-white hover:border-slate-900 hover:-translate-y-0.5 transition-all duration-150"
            >
              <Chrome className="w-4 h-4 shrink-0" />
              Add to Chrome — it&apos;s free
            </Link>
            <Link
              href="/app/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-slate-900 bg-transparent px-7 py-3.5 text-sm font-semibold text-slate-900 hover:-translate-y-0.5 transition-all duration-150"
            >
              Open Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
