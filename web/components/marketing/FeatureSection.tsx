import { Check } from 'lucide-react'

const FEATURES = [
  {
    id: 'dom',
    eyebrow: 'The Capture Layer',
    headline: 'Notes that actually stay where you put them.',
    description:
      'Most annotation tools use brittle CSS selectors that break the moment a page updates. Inline uses a multi-signal heuristic — XPath, text content fingerprinting, and semantic position — so your notes survive redesigns, A/B tests, and full page re-renders.',
    points: [
      'XPath + content-hash anchoring survives DOM mutations',
      'Shadow DOM injection means zero style bleed, in or out',
      'IndexedDB via Dexie.js for sub-10ms read latency',
      'Offline-first with background sync to your workspace',
    ],
    visual: 'code',
    reverse: false,
  },
  {
    id: 'spatial',
    eyebrow: 'The Intelligence Layer',
    headline: 'Every insight, placed in space.',
    description:
      'When you research real estate on Zillow, your notes carry the coordinates of the property. When you read about a conference, your notes are pinned to that city. The result: a living map of your intelligence that grows naturally as you browse.',
    points: [
      'Auto-extracts geo-coordinates from URL context and page metadata',
      'Clustering at zoom-out, full note preview on tap',
      'Force-directed knowledge graph groups notes by domain and tag',
      'Export to GeoJSON, CSV, or your Notion workspace',
    ],
    visual: 'map',
    reverse: true,
  },
]

function CodeVisual() {
  return (
    <div className="rounded-xl border border-border bg-background/80 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-card">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
        </div>
        <span className="text-xs text-muted-foreground ml-1">storage.ts</span>
      </div>
      <pre className="p-5 text-xs leading-relaxed overflow-hidden">
        <code>
          <span className="text-muted-foreground">{'// Single swap point for Supabase\n'}</span>
          <span className="text-violet-400">{'export '}</span>
          <span className="text-sky-400">{'async function '}</span>
          <span className="text-emerald-400">{'loadNotes'}</span>
          <span className="text-foreground">{'(\n  pageUrl: '}</span>
          <span className="text-amber-300">{'string'}</span>
          <span className="text-foreground">{'): '}</span>
          <span className="text-violet-400">{'Promise'}</span>
          <span className="text-foreground">{'<'}</span>
          <span className="text-amber-300">{'StickyNoteData'}</span>
          <span className="text-foreground">{'[]> {\n'}</span>
          <span className="text-foreground">{'  '}</span>
          <span className="text-violet-400">{'const '}</span>
          <span className="text-foreground">{'key = storageKey(pageUrl)\n'}</span>
          <span className="text-foreground">{'  '}</span>
          <span className="text-violet-400">{'return '}</span>
          <span className="text-foreground">{'new '}</span>
          <span className="text-sky-400">{'Promise'}</span>
          <span className="text-foreground">{'(res => {\n'}</span>
          <span className="text-foreground">{'    chrome.storage.local.'}</span>
          <span className="text-emerald-400">{'get'}</span>
          <span className="text-foreground">{'(key, data => {\n'}</span>
          <span className="text-foreground">{'      res(data[key] ?? [])\n'}</span>
          <span className="text-foreground">{'    })\n  })\n}'}</span>
        </code>
      </pre>
    </div>
  )
}

function MapVisual() {
  const pins = [
    { label: 'Austin, TX', x: 38, y: 58, size: 'large' },
    { label: 'Denver, CO', x: 28, y: 42, size: 'medium' },
    { label: 'Seattle, WA', x: 12, y: 22, size: 'medium' },
    { label: '', x: 65, y: 35, size: 'small' },
    { label: '', x: 75, y: 52, size: 'small' },
    { label: '', x: 82, y: 28, size: 'small' },
  ]
  return (
    <div className="rounded-xl border border-border overflow-hidden bg-zinc-950 relative aspect-[4/3]">
      {/* Dark map tiles simulation */}
      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 300">
        <path d="M0 100 Q100 60 200 100 Q300 140 400 100" stroke="#6366f1" strokeWidth="1" fill="none" />
        <path d="M0 160 Q80 120 200 150 Q320 180 400 160" stroke="#6366f1" strokeWidth="1" fill="none" />
        <path d="M0 220 Q150 190 250 220 Q350 250 400 220" stroke="#6366f1" strokeWidth="0.5" fill="none" />
        <path d="M80 0 Q90 150 100 300" stroke="#6366f1" strokeWidth="0.5" fill="none" />
        <path d="M200 0 Q210 150 220 300" stroke="#6366f1" strokeWidth="0.5" fill="none" />
        <path d="M320 0 Q330 150 310 300" stroke="#6366f1" strokeWidth="0.5" fill="none" />
      </svg>
      {pins.map((pin, i) => (
        <div
          key={i}
          className="absolute"
          style={{ left: `${pin.x}%`, top: `${pin.y}%`, transform: 'translate(-50%,-50%)' }}
        >
          <div
            className="rounded-full bg-primary ring-2 ring-primary/40"
            style={{
              width: pin.size === 'large' ? 14 : pin.size === 'medium' ? 10 : 6,
              height: pin.size === 'large' ? 14 : pin.size === 'medium' ? 10 : 6,
            }}
          />
          {pin.label && (
            <div className="absolute left-4 top-0 bg-card border border-border rounded px-2 py-1 text-xs whitespace-nowrap">
              {pin.label}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function FeatureSection() {
  return (
    <section id="features" className="py-24 px-6 border-t border-border">
      <div className="max-w-6xl mx-auto space-y-32">
        {FEATURES.map(feature => (
          <div
            key={feature.id}
            className={`grid md:grid-cols-2 gap-16 items-center ${feature.reverse ? 'md:[&>*:first-child]:order-2' : ''}`}
          >
            {/* Text */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">
                {feature.eyebrow}
              </p>
              <h2 className="text-3xl font-bold tracking-tight mb-5 leading-tight">
                {feature.headline}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                {feature.description}
              </p>
              <ul className="space-y-3">
                {feature.points.map(point => (
                  <li key={point} className="flex items-start gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-muted-foreground">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Visual */}
            <div>{feature.visual === 'code' ? <CodeVisual /> : <MapVisual />}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
