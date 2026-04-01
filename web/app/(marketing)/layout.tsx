import { Inter } from 'next/font/google'
import MarketingNav from '@/components/marketing/MarketingNav'
import MarketingFooter from '@/components/marketing/MarketingFooter'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${inter.className} bg-slate-50 text-slate-900 min-h-screen antialiased`}>
      <MarketingNav />
      <main className="pt-24 md:pt-28">{children}</main>
      <MarketingFooter />
    </div>
  )
}
