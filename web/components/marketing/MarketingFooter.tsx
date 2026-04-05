import Link from 'next/link'

const LINK_COLUMNS = {
  'How it works': ['Features', 'Integrations', 'Pricing', 'Changelog', 'Help center', 'Contact support'],
  'Solutions for': ['Knowledge Suite', 'IT & Operations', 'Product & Engineering', 'Customer Support', 'Human Resources'],
  'Resources': ['Templates', 'Learn', 'Download apps', 'Chrome extension'],
  'Inline': ['About us', 'Blog', 'Careers', 'Customers', 'Press kit'],
  'Compare': ['Notion', 'Confluence', 'Guru', 'Google Docs'],
}

export default function MarketingFooter() {
  return (
    <footer className="bg-[#14161C] border-t border-white/10 text-stone-300">
      <div className="max-w-6xl mx-auto px-6 lg:px-10 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center ring-1 ring-white/10" aria-hidden>
                <span className="block h-4 w-1 rounded-full bg-white -rotate-12" />
              </div>
              <span className="font-semibold text-sm text-white">inline</span>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed max-w-[180px] mb-5">
              Your notes, right where you need them.
            </p>
            {/* Ratings */}
            <div className="flex items-center gap-1 mb-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="text-amber-400 text-xs">★</span>
              ))}
            </div>
            <div className="flex items-center gap-4 text-[10px] text-stone-500 mb-1">
              <span><span className="font-semibold text-stone-300">4.7/5</span> on G2 Crowd</span>
              <span><span className="font-semibold text-stone-300">4.7/5</span> on Capterra</span>
            </div>
            <p className="text-[10px] text-stone-500">
              <span className="font-semibold text-stone-300">4.9/5</span> on Product Hunt
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(LINK_COLUMNS).map(([section, items]) => (
            <div key={section}>
              <p className="text-xs font-semibold text-white mb-4">{section}</p>
              <ul className="space-y-2.5">
                {items.map(item => (
                  <li key={item}>
                    <Link
                      href="#"
                      className="text-xs text-stone-500 hover:text-white transition-colors"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6 text-xs text-stone-500">
            {['Legal Information', 'Privacy', 'Security', 'User terms', 'Customer terms'].map(link => (
              <Link key={link} href="#" className="hover:text-white transition-colors">
                {link}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <p className="text-xs text-stone-500">&copy;{new Date().getFullYear()} Inline, Inc.</p>
            <div className="flex items-center gap-3 text-stone-500">
              <a href="#" className="hover:text-white transition-colors text-sm" aria-label="X/Twitter">𝕏</a>
              <a href="#" className="hover:text-white transition-colors text-sm" aria-label="LinkedIn">in</a>
            </div>
            <span className="text-xs text-stone-500 ml-2">Cookie settings</span>
          </div>
        </div>

        {/* Language selector */}
        <div className="mt-6 flex flex-wrap gap-4 text-xs text-stone-500">
          {['English', 'Français', 'Español', 'Deutsch', 'Nederlands', '日本語'].map(lang => (
            <span key={lang} className={lang === 'English' ? 'text-white font-medium' : 'hover:text-white cursor-pointer transition-colors'}>
              {lang}
            </span>
          ))}
        </div>
      </div>
    </footer>
  )
}
