import type { Metadata } from 'next'
import Hero from '@/components/marketing/Hero'
import BentoGrid from '@/components/marketing/BentoGrid'
import FeatureSection from '@/components/marketing/FeatureSection'

export const metadata: Metadata = {
  title: 'Inline — Your notes, right where you need them',
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <BentoGrid />
      <FeatureSection />
    </>
  )
}
