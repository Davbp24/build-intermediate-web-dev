import type { Metadata } from 'next'
import Hero from '@/components/marketing/Hero'
import BentoGrid from '@/components/marketing/BentoGrid'
import FeatureSection from '@/components/marketing/FeatureSection'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Inline — Spatial Memory Layer for the Web',
}

const TESTIMONIALS = [
  {
    quote: "I've tried every annotation tool. Inline is the only one where my notes are still attached after a week. The DOM anchoring actually works.",
    name: 'Sarah Chen',
    role: 'Senior Engineer, Vercel',
  },
  {
    quote: "The map view changed how I do real estate research. I can see all my Zillow notes spatially. It's a genuinely different way to think.",
    name: 'Marcus Johnson',
    role: 'Real Estate Analyst',
  },
  {
    quote: 'The AI summary feature saves me 20 minutes a day. Highlight any dense paragraph and get a crisp 3-sentence digest pinned right there.',
    name: 'Priya Nair',
    role: 'Research Lead, a16z',
  },
]

export default function HomePage() {
  return (
    <>
      <Hero />
      <BentoGrid />
      <FeatureSection />

      {/* Testimonials */}
      <section className="py-24 px-6 border-t border-border bg-card/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Trusted by researchers and engineers
            </h2>
            <p className="text-muted-foreground">
              People who spend their days consuming information on the web.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div
                key={t.name}
                className="rounded-xl border border-border bg-card p-6 space-y-4"
              >
                <p className="text-sm text-muted-foreground leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 text-center bg-slate-50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-slate-900">
            Start building your spatial memory.
          </h2>
          <p className="text-muted-foreground mb-10 text-lg">
            Free for individuals. No signup required to start capturing.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/app/dashboard">
              <Button
                size="lg"
                className="h-11 px-8 gap-2 bg-[#2564BC] text-white hover:bg-[#1e4fa3] [a]:hover:bg-[#1e4fa3]"
              >
                Open Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
