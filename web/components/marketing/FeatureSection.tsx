import { Check } from 'lucide-react'

const FEATURES = [
  {
    id: 'capture',
    eyebrow: 'For everyday browsing',
    headline: 'Your notes stay where you left them.',
    description:
      'Leave a note on a recipe, a product listing, or a news article. Come back days later and it\'s still there — attached to the exact spot on the page. No bookmarks to dig through, no screenshots to organize.',
    points: [
      'Notes survive page refreshes, redesigns, and updates',
      'Works on any website — no integrations needed',
      'Saves instantly, even when you\'re offline',
      'Your data stays private on your device until you choose to sync',
    ],
    visual: 'capture',
    reverse: false,
  },
  {
    id: 'teams',
    eyebrow: 'For teams and organizations',
    headline: 'One workspace. Everyone on the same page.',
    description:
      'Product managers flag issues on staging. Designers leave feedback on live sites. Researchers share findings across the org. Every note is pinned to the exact context it references — no more "see screenshot attached."',
    points: [
      'Shared workspaces with role-based access',
      'Notes and highlights visible to the whole team in real time',
      'Map view for location-based research (real estate, travel, logistics)',
      'Export to CSV, PDF, or connect to tools you already use',
    ],
    visual: 'teams',
    reverse: true,
  },
]

function CaptureVisual() {
  return (
    <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b-2 border-slate-200">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
          <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
          <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
        </div>
        <span className="text-[11px] text-slate-400 font-mono ml-1">cooking.nytimes.com/recipes/pasta</span>
      </div>
      <div className="flex">
        <div className="w-[60%] p-4 space-y-2">
          <div className="h-2.5 w-3/4 bg-slate-200 rounded" />
          <div className="h-2 w-full bg-slate-100 rounded" />
          <div className="flex items-center gap-1">
            <div className="h-2 w-1/2 bg-amber-300 rounded" />
          </div>
          <div className="h-2 w-5/6 bg-slate-100 rounded" />
          <div className="h-2 w-2/3 bg-slate-100 rounded" />
        </div>
        <div className="w-[40%] p-3 bg-slate-50 border-l-2 border-slate-200">
          <div
            className="bg-[#F1F1EF] border-2 border-[#4B83C4] rounded-lg p-2.5"
            style={{ boxShadow: '3px 3px 0px #4B83C4' }}
          >
            <p className="text-[10px] font-bold text-[#4B83C4] uppercase tracking-wider mb-1">Note</p>
            <p className="text-[11px] text-[#37352F] leading-relaxed font-medium">
              Use half the salt — last time was way too salty.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function TeamsVisual() {
  const members = [
    { name: 'AP', color: 'bg-[#4B83C4]' },
    { name: 'JT', color: 'bg-amber-500' },
    { name: 'DK', color: 'bg-emerald-500' },
  ]
  return (
    <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b-2 border-slate-200">
        <span className="text-[11px] text-slate-700 font-semibold">Product Team Workspace</span>
        <div className="flex -space-x-1.5">
          {members.map(m => (
            <div key={m.name} className={`w-5 h-5 rounded-full ${m.color} border-2 border-white flex items-center justify-center`}>
              <span className="text-[7px] font-bold text-white">{m.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="p-4 space-y-3">
        {[
          { author: 'AP', note: 'CTA button contrast is too low on mobile', border: 'border-[#8EB4DC]', bg: 'bg-[#F1F1EF]', shadow: '#4B83C4' },
          { author: 'JT', note: 'Love this layout — ship it', border: 'border-amber-400', bg: 'bg-amber-50', shadow: '#F59E0B' },
          { author: 'DK', note: 'API response is 2s here, needs caching', border: 'border-emerald-400', bg: 'bg-emerald-50', shadow: '#10B981' },
        ].map(item => (
          <div
            key={item.author}
            className={`${item.bg} border-2 ${item.border} rounded-lg p-2.5`}
            style={{ boxShadow: `3px 3px 0px ${item.shadow}` }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[9px] font-bold text-slate-500">@{item.author}</span>
            </div>
            <p className="text-[11px] text-slate-800 leading-relaxed font-medium">{item.note}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function FeatureSection() {
  return (
    <section id="features" className="py-24 px-6 bg-white border-t-2 border-slate-200">
      <div className="max-w-6xl mx-auto space-y-32">
        {FEATURES.map(feature => (
          <div
            key={feature.id}
            className={`grid md:grid-cols-2 gap-16 items-center ${feature.reverse ? 'md:[&>*:first-child]:order-2' : ''}`}
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#37352F] mb-4">
                {feature.eyebrow}
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-5 leading-tight">
                {feature.headline}
              </h2>
              <p className="text-slate-600 leading-relaxed mb-8">
                {feature.description}
              </p>
              <ul className="space-y-3">
                {feature.points.map(point => (
                  <li key={point} className="flex items-start gap-3 text-sm">
                    <div className="w-5 h-5 rounded-md border-2 border-[#E3E2DE] bg-[#F1F1EF] flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-[#37352F]" />
                    </div>
                    <span className="text-slate-600">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>{feature.visual === 'capture' ? <CaptureVisual /> : <TeamsVisual />}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
