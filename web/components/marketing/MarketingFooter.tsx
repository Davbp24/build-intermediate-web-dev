import Link from 'next/link'

const LINKS = {
  Product: ['Features', 'Pricing', 'Changelog', 'Roadmap'],
  Resources: ['Help Center', 'Getting Started', 'API Docs', 'GitHub'],
  Company: ['About', 'Blog', 'Careers', 'Privacy'],
}

export default function MarketingFooter() {
  return (
    <footer className="border-t-2 border-slate-200 bg-white py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-md bg-[#191919] border-2 border-[#191919] flex items-center justify-center">
                <span className="block h-4 w-1 rounded-full bg-white -rotate-12" />
              </div>
              <span className="font-bold text-sm text-slate-900">Inline</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
              Your notes, right where you need them. Built for individuals who browse and teams who ship.
            </p>
          </div>

          {Object.entries(LINKS).map(([section, items]) => (
            <div key={section}>
              <p className="text-xs font-bold text-slate-900 mb-4 uppercase tracking-wider">{section}</p>
              <ul className="space-y-2.5">
                {items.map(item => (
                  <li key={item}>
                    <Link
                      href="#"
                      className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} Inline, Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="#" className="hover:text-slate-900 transition-colors">Terms</Link>
            <Link href="#" className="hover:text-slate-900 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-slate-900 transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
