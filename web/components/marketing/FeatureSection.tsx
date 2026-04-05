'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  Lock, Users, Settings, Shield, Eye, BarChart3,
  Database, FileCheck, Key, Github, UserCheck, Languages, Package,
} from 'lucide-react'

/** Smooth vertical parallax on scroll — not used on Knowledge Suite / DarkCurveSection. */
function MarketingParallaxSection({
  className,
  children,
  yRange = [22, -22] as [number, number],
}: {
  className: string
  children: ReactNode
  yRange?: [number, number]
}) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], yRange)
  return (
    <section ref={ref} className={className}>
      <motion.div style={{ y }} className="will-change-transform">
        {children}
      </motion.div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   1. DARK CURVE KINETIC SECTION
   ═══════════════════════════════════════════════════════════════════ */

const ORBIT_NODES =[
  // Ring 1 (Inner)
  { id: 'intercom', ring: 1, angle: 165, icon: IntercomLogo },
  { id: 'github',   ring: 1, angle: 215, icon: GithubLogo },
  { id: 'notion',   ring: 1, angle: 115, icon: NotionLogo },
  // Ring 2 (Middle)
  { id: 'slack',    ring: 2, angle: 185, icon: SlackLogo },
  { id: 'jira',     ring: 2, angle: 240, icon: JiraLogo },
  { id: 'asana',    ring: 2, angle: 135, icon: AsanaLogo },
  // Ring 3 (Outer)
  { id: 'linear',   ring: 3, angle: 205, icon: LinearLogo },
  { id: 'generic1', ring: 3, angle: 155, icon: GenericDotLogo },
]

// Custom Logo Components to match the reference
function IntercomLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <rect width="24" height="24" rx="12" fill="#0057FF" />
      <path d="M7 11v4 M10 9v8 M14 9v8 M17 11v4" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function GithubLogo() {
  return <Github className="w-5 h-5 text-white" fill="currentColor" />
}

function NotionLogo() {
  return (
    <div className="w-5 h-5 bg-white rounded-[4px] flex items-center justify-center">
      <span className="text-black text-[11px] font-bold font-serif leading-none">N</span>
    </div>
  )
}

function SlackLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <rect x="5" y="10" width="4" height="4" rx="2" fill="#E01E5A" />
      <rect x="10" y="10" width="9" height="4" rx="2" fill="#36C5F0" />
      <rect x="10" y="5" width="4" height="4" rx="2" fill="#2EB67D" />
      <rect x="10" y="15" width="4" height="4" rx="2" fill="#ECB22E" />
    </svg>
  )
}

function JiraLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <path d="M12 2L2 12l10 10 10-10L12 2z" fill="#0052CC" />
      <path d="M12 2L2 12l10 10V2z" fill="#2684FF" />
    </svg>
  )
}

function AsanaLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <circle cx="12" cy="6" r="3" fill="#F06A6A" />
      <circle cx="6" cy="16" r="3" fill="#F06A6A" />
      <circle cx="18" cy="16" r="3" fill="#F06A6A" />
    </svg>
  )
}

function LinearLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
      <path d="M12 2v20 M2 12h20" stroke="white" strokeWidth="1" strokeDasharray="2 2" />
    </svg>
  )
}

function GenericDotLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <circle cx="12" cy="12" r="8" fill="#FFF" opacity="0.2" />
      <circle cx="12" cy="12" r="4" fill="#FFF" />
    </svg>
  )
}

function OrbitVisual() {
  const center = { x: 750, y: 400 }
  const radii =[220, 360, 500]

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {/* 1000x800 coordinate space for precise absolute positioning */}
      <div className="absolute top-1/2 right-0 w-[1000px] h-[800px] -translate-y-1/2">
        
        {/* SVG Orbits */}
        <svg className="absolute inset-0 w-full h-full">
          {radii.map((r, i) => (
            <circle
              key={`ring-${i}`}
              cx={center.x}
              cy={center.y}
              r={r}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
              strokeDasharray="4 6"
              fill="none"
            />
          ))}
          {/* Subtle center glow/dot */}
          <circle cx={center.x} cy={center.y} r="4" fill="rgba(255,255,255,0.1)" />
        </svg>

        {/* Floating Icons */}
        {ORBIT_NODES.map((node, i) => {
          const r = radii[node.ring - 1]
          const rad = (node.angle * Math.PI) / 180
          const x = center.x + r * Math.cos(rad)
          const y = center.y + r * Math.sin(rad)
          const Icon = node.icon

          return (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.1, type: "spring", stiffness: 200, damping: 20 }}
              className="absolute w-[44px] h-[44px] rounded-full bg-[#272A35] border border-white/5 shadow-2xl flex items-center justify-center backdrop-blur-md"
              style={{
                left: `${x}px`,
                top: `${y}px`,
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
              }}
            >
              <Icon />
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function DarkCurveSection() {
  return (
    <section className="relative bg-[#F5EDE3]">
      {/* 
        The dark container itself 
        Using padding to ensure content doesn't hit the curved masks 
      */}
      <div className="relative bg-[#23252E] overflow-hidden">
        
        {/* Top Curve Mask (Cream color to match background above) */}
        <svg 
          viewBox="0 0 1440 120" 
          className="absolute top-0 left-0 w-full text-[#F5EDE3] z-10 pointer-events-none" 
          preserveAspectRatio="none" 
          style={{ height: '8vw', minHeight: '60px' }}
        >
          {/* Sweeps down in the middle to create a concave dark shape */}
          <path d="M0,0 L1440,0 L1440,20 C1000,120 400,120 0,20 Z" fill="currentColor" />
        </svg>

        {/* Bottom Curve Mask (Cream color to match background below) */}
        <svg 
          viewBox="0 0 1440 120" 
          className="absolute bottom-0 left-0 w-full text-[#FDFBF7] z-10 pointer-events-none" 
          preserveAspectRatio="none" 
          style={{ height: '8vw', minHeight: '60px' }}
        >
          {/* Sweeps up in the middle */}
          <path d="M0,120 L1440,120 L1440,100 C1000,0 400,0 0,100 Z" fill="currentColor" />
        </svg>

        {/* Background gradient overlay for depth */}
        <div 
          className="absolute inset-0 pointer-events-none" 
          style={{ background: 'linear-gradient(140deg, rgba(35,37,46,0) 0%, rgba(20,21,26,0.8) 100%)' }} 
        />

        <OrbitVisual />

        {/* Content Container */}
        <div className="relative z-20 max-w-[1200px] mx-auto px-6 py-40 md:py-56 flex flex-col justify-center min-h-[700px]">
          <div className="max-w-[480px]">
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C48CB3] mb-5"
            >
              Knowledge Suite
            </motion.p>
            
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-[44px] font-medium tracking-tight text-white leading-[1.15] mb-6"
            >
              Ask beyond Slite,<br />across all your tools
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-[15px] text-stone-300 leading-relaxed mb-6"
            >
              Our Knowledge Suite plan combines Slite&apos;s Knowledge base with world&apos;s best company search and orchestration solution, at discounted price.
            </motion.p>
            
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-[15px] text-stone-300 leading-relaxed mb-10"
            >
              Meet Super. The ultimate way to find any data across all your tools, reduce questions from your teammate, automate complex workflows and power your agents&apos; context retrieval.
            </motion.p>
            
            <motion.a
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              href="#"
              className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-[15px] font-medium text-[#1C1E26] transition-colors hover:bg-stone-100 shadow-lg shadow-white/5"
            >
              Explore Super
            </motion.a>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   2. ASK AI SECTION
   ═══════════════════════════════════════════════════════════════════ */

function AskSection() {
  return (
    <MarketingParallaxSection
      className="relative z-1 -mt-[2px] pt-[calc(6rem+2px)] pb-24 px-6 bg-[#FDFBF7]"
      yRange={[28, -28]}
    >
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-semibold text-[#1C1E26] mb-2 leading-tight">
          What&apos;s the use of knowledge if you can&apos;t find it?
        </h2>
        <p className="text-2xl md:text-3xl font-semibold leading-tight mb-12">
          <span className="text-blue-500">Ask</span>
          <span className="text-blue-500 text-lg align-super ml-0.5">✦</span>
          <span className="text-[#1C1E26]"> transforms scattered knowledge into instant answers,</span>
          <br />
          <span className="text-[#1C1E26]">delivering the right information in seconds.</span>
        </p>

        <div className="bg-blue-100 rounded-3xl p-8 md:p-12">
          <div className="bg-white rounded-2xl border border-stone-200/50 overflow-hidden">
            <div className="p-6 border-b border-stone-100">
              <p className="text-sm text-stone-700">How do I log my days off?</p>
              <div className="flex items-center gap-4 mt-3">
                {['Source', 'Date range', 'Contributors'].map(f => (
                  <span key={f} className="text-[11px] text-stone-400 flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-stone-200 inline-block" />
                    {f}
                  </span>
                ))}
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-emerald-100 inline-flex items-center justify-center text-[8px]">✓</span>
                  Verified
                </span>
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm text-stone-700 mb-3">To log days off, you should:</p>
              <ul className="text-sm text-stone-600 space-y-2">
                <li>- Log them in BambooHR (choosing the right type of time off),</li>
                <li>- Add them to your personal Google Calendar (mark yourself as OOO),</li>
                <li>- Update your status on Slack (🌴 + return date).</li>
                <li>- If more than 3 days, notify your manager via the #time-off channel.</li>
                <li>- For international travel, submit the travel request form separately.</li>
              </ul>
              <div className="flex items-center gap-4 mt-5">
                <div className="flex items-center gap-2">
                  {['⊡', '⇧', '⇩'].map(icon => (
                    <span key={icon} className="w-6 h-6 rounded border border-stone-200 flex items-center justify-center text-stone-400 text-xs">
                      {icon}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-5 pt-4 border-t border-stone-100">
                <span className="text-[11px] text-stone-400">2 sources</span>
                {['Remote policies', 'Paid time off'].map(src => (
                  <span key={src} className="text-[11px] text-stone-600 flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-stone-200 inline-block" />
                    {src}
                    <span className="text-emerald-500 text-[10px]">✓</span>
                  </span>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-stone-100">
                <p className="text-[11px] text-stone-400 mb-2">Follow-up questions</p>
                <div className="flex flex-wrap gap-2">
                  {['What holidays are company-wide?', 'How do I check my PTO balance?', 'Can I carry over unused days?'].map(q => (
                    <span key={q} className="text-[11px] text-stone-500 bg-stone-50 rounded-full px-3 py-1 border border-stone-200/50">
                      {q}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature icons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
          {(
            [
              {
                text: 'Powered by verified, trusted documentation',
                Icon: FileCheck,
              },
              {
                text: 'Based on info each user has access to',
                Icon: UserCheck,
              },
              {
                text: 'Speaks your language',
                Icon: Languages,
              },
              {
                text: 'Ask is part of all our paid plans, at no extra cost',
                Icon: Package,
              },
            ] as const
          ).map(({ text, Icon }) => (
            <div key={text} className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-white rounded-2xl border border-stone-200/50 flex items-center justify-center">
                <Icon className="w-6 h-6 text-stone-400" strokeWidth={1.75} aria-hidden />
              </div>
              <p className="text-xs text-stone-500 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>

        {/* Quote */}
        <div className="mt-16 text-center max-w-2xl mx-auto">
          <p className="text-lg text-stone-700 leading-relaxed mb-6">
            &ldquo;Since we implemented <span className="text-blue-500 font-medium">Ask</span>, that amount of questions has been divided
            by 10, and it&apos;s really amazing because everyone is able to get the
            information they need.&rdquo;
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-stone-200" />
            <p className="text-sm text-stone-500">
              <span className="text-stone-700 font-medium">Alexis Dupont</span>, Principal Product at Agorapulse
            </p>
          </div>
        </div>
      </div>
    </MarketingParallaxSection>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   3. ENTERPRISE BENTO GRID
   ═══════════════════════════════════════════════════════════════════ */

const BENTO_CARDS =[
  { icon: Key,       title: 'SSO Integration',         body: 'Enable secure, seamless access with single sign-on (SSO) through providers like Okta, Google Workspace, and Azure AD.',                               badge: 'Security',      badgeColor: 'bg-yellow-100 text-yellow-700' },
  { icon: Users,     title: 'Advanced provisioning',   body: 'Automate user lifecycle management with SCIM provisioning for faster, safer onboarding and offboarding.',                                              badge: 'Security',      badgeColor: 'bg-yellow-100 text-yellow-700' },
  { icon: Settings,  title: 'Personalized onboarding', body: 'Kickstart adoption with onboarding tailored to your workflows, guided by your customer success team.',                                                 badge: 'Customization', badgeColor: 'bg-stone-100 text-stone-600'   },
  { icon: Eye,       title: 'Reader-only roles',       body: 'Share knowledge broadly while maintaining control by assigning read-only access to specific users.',                                                    badge: 'Customization', badgeColor: 'bg-stone-100 text-stone-600'   },
  { icon: Shield,    title: 'SOC 2 type II compliance', body: 'Meet rigorous security standards with SOC II Type II certification, ensuring enterprise-grade data protection.',                                       badge: 'Compliance',    badgeColor: 'bg-pink-100 text-pink-700'     },
  { icon: Lock,      title: 'HIPAA compliance',        body: 'Option to execute a Business Associate Agreement (BAA) to ensure HIPAA-compliant infrastructure with encryption, access controls, and breach notification support.', badge: 'Customization', badgeColor: 'bg-stone-100 text-stone-600' },
  { icon: Shield,    title: 'GDPR compliance',         body: 'Operate confidently across regions with GDPR-compliant practices that safeguard data privacy.',                                                        badge: 'Compliance',    badgeColor: 'bg-pink-100 text-pink-700'     },
  { icon: Database,  title: 'SLA',                     body: 'Count on guaranteed uptime and response times with a service-level agreement built for enterprise reliability.',                                        badge: 'Customization', badgeColor: 'bg-stone-100 text-stone-600'   },
  { icon: Users,     title: 'Dedicated support',       body: 'Access priority, hands-on support from specialists who understand your team\'s needs.',                                                                 badge: 'Customization', badgeColor: 'bg-stone-100 text-stone-600'   },
  { icon: BarChart3, title: 'Analytics',               body: 'Measure adoption and engagement with usage insights to keep your documentation effective.',                                                             badge: 'Control',       badgeColor: 'bg-stone-100 text-stone-600'   },
  { icon: Database,  title: 'Backups',                 body: 'Protect your knowledge base with automated backups and fast recovery when needed.',                                                                     badge: 'Control',       badgeColor: 'bg-stone-100 text-stone-600'   },
  { icon: Lock,      title: 'Granular permissions',    body: 'Control access at every level with flexible, detailed permissions for teams and projects.',                                                              badge: 'Security',      badgeColor: 'bg-green-100 text-green-700'   },
  { icon: FileCheck, title: 'Audit logs',              body: 'Maintain accountability with complete visibility into who accessed and modified content.',                                                               badge: 'Control',       badgeColor: 'bg-stone-100 text-stone-600'   },
]

function WaveDivider({ from, to, flip = false }: { from: string; to: string, flip?: boolean }) {
  return (
    <div className="relative w-full overflow-hidden" style={{ height: 160, backgroundColor: from }}>
      <svg
        viewBox="0 0 1440 160"
        className="absolute bottom-0 left-0 w-full"
        preserveAspectRatio="none"
        style={flip ? { transform: 'scaleX(-1)' } : {}}
      >
        <path
         d="M0,110 
   C320,80 820,140 1440,120 
   L1440,160 
   L0,160 
   Z"
          fill={to}
        />
      </svg>
    </div>
  )
}

function EnterpriseBentoGrid() {
  return (
    <MarketingParallaxSection className="py-24 px-6 bg-[#F5EDE3]" yRange={[20, -20]}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#1C1E26] mb-4">
            Scales with your ambitions
          </h2>
          <p className="text-stone-500 max-w-2xl mx-auto leading-relaxed">
            Inline&apos;s Enterprise plan gives organizations the security, control, and flexibility they need to scale
            knowledge-sharing with confidence. From compliance and analytics to tailored onboarding and support,
            it&apos;s designed to meet the needs of growing teams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {BENTO_CARDS.map((card, i) => {
            const Icon = card.icon
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.35, delay: i * 0.03 }}
                className="bg-white rounded-2xl p-6 border border-stone-200/50 relative"
              >
                <div className="flex justify-end mb-4">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${card.badgeColor}`}>
                    {card.badge}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 mb-2">
                  <Icon className="w-4 h-4 text-stone-600 shrink-0" />
                  <h3 className="text-sm font-semibold text-[#1C1E26]">{card.title}</h3>
                </div>
                <p className="text-xs text-stone-500 leading-relaxed">{card.body}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </MarketingParallaxSection>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   4. TESTIMONIALS — "Trusted by teams like yours"
   ═══════════════════════════════════════════════════════════════════ */

const TESTIMONIALS =[
  {
    stat: '75% faster',
    statLabel: 'team onboarding',
    type: 'stat' as const,
  },
  {
    quote: 'Everybody on the team adapted quickly to Inline and actively uses it. The software is highly intuitive, with frequent updates that delight the entire team!',
    name: 'Daniel Hanemann',
    role: 'CEO & Founder at Wundertax',
    type: 'quote' as const,
  },
  {
    quote: 'Inline helped us significantly reduce escalation times by making our documentation easy to find, always up-to-date, and accessible to everyone. It\'s become the single source of truth for our company.',
    name: 'Miguel Herrero',
    role: 'Product Manager at PVCase',
    type: 'quote' as const,
  },
  {
    stat: '3x more',
    statLabel: 'productive team meeting',
    type: 'stat' as const,
  },
  {
    quote: 'Our team has grown from 250 people to over 700 in the last year, across different offices. Inline supports our fast growth by giving us a structured place to route people when they have questions.',
    name: 'Josselin Raguenet de Saint Albin',
    role: 'Head of Customer Service at Meero',
    type: 'quote' as const,
  },
  {
    quote: 'Inline transformed how we manage knowledge. It\'s the perfect balance between simplicity and power — intuitive enough for everyone to use, yet robust enough to handle all our documentation needs.',
    name: 'Thomas D\'Hoe',
    role: 'Chief Operating Officer at Premium Plus',
    type: 'quote' as const,
  },
  {
    stat: '90% fewer',
    statLabel: 'repeated questions',
    type: 'stat' as const,
  },
]

/** 3×3 bento: row1 [stat | quote span2], row2 [quote | stat | quote], row3 [quote span2 | stat] */
const TESTIMONIAL_MD_GRID = [
  'md:col-start-1 md:row-start-1',
  'md:col-start-2 md:col-span-2 md:row-start-1',
  'md:col-start-1 md:row-start-2',
  'md:col-start-2 md:row-start-2',
  'md:col-start-3 md:row-start-2',
  'md:col-start-1 md:col-span-2 md:row-start-3',
  'md:col-start-3 md:row-start-3',
] as const

/** Stat tiles white; quote tiles #FAF5EE on section bg #FDFBF7 */
const TESTIMONIAL_CARD_SURFACE = [
  'bg-white border-stone-200/50',
  'bg-[#FAF5EE] border-stone-200/55',
  'bg-[#FAF5EE] border-stone-200/55',
  'bg-white border-stone-200/50',
  'bg-[#FAF5EE] border-stone-200/55',
  'bg-[#FAF5EE] border-stone-200/55',
  'bg-white border-stone-200/50',
] as const

const CASE_STUDIES =[
  { title: 'Leveraging AI for growth', switched: 'Switched from Tettra & Google Docs', name: 'Sebastien Gendreau', role: 'Head of Product at Agora Pulse', color: 'bg-red-500' },
  { title: 'Scaling global teams', switched: 'Switched from Five Tools', name: 'Martijn Hazelaar', role: 'Digital Manager at Vanmoof', color: 'bg-green-500' },
]

function TestimonialsSection() {
  return (
    <MarketingParallaxSection className="py-24 px-6 bg-[#FDFBF7]" yRange={[24, -24]}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#1C1E26] text-center mb-16">
          Trusted by teams like yours
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-3 gap-4 mb-16 auto-rows-fr">
          {TESTIMONIALS.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
              className={`rounded-2xl border p-6 flex flex-col justify-center ${TESTIMONIAL_CARD_SURFACE[i] ?? 'bg-white border-stone-200/50'} ${TESTIMONIAL_MD_GRID[i] ?? ''}`}
            >
              {item.type === 'stat' ? (
                <div className="text-center py-4">
                  <p className="text-3xl md:text-4xl font-semibold text-[#1C1E26] mb-1">{item.stat}</p>
                  <p className="text-sm text-stone-400">{item.statLabel}</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-stone-600 leading-relaxed mb-4">
                    {item.quote}
                  </p>
                  <div className="flex items-center gap-2.5 mt-auto">
                    <div className="w-8 h-8 rounded-full bg-stone-200 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-[#1C1E26]">{item.name}</p>
                      <p className="text-[10px] text-stone-400">{item.role}</p>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </div>

        {/* Case studies */}
        <h3 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#1C1E26] text-center mb-10">
          The Inline edge, in our customer words
        </h3>
        <div className="space-y-3 max-w-3xl mx-auto">
          {CASE_STUDIES.map(cs => (
            <div key={cs.title} className="bg-white rounded-2xl border border-stone-200/50 p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${cs.color} shrink-0 flex items-center justify-center`}>
                <span className="text-white font-semibold text-sm">{cs.title[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1C1E26]">{cs.title}</p>
                <p className="text-[10px] text-stone-400 uppercase tracking-wider font-medium">{cs.switched}</p>
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-xs text-stone-600">{cs.name}</p>
                <p className="text-[10px] text-stone-400">{cs.role}</p>
              </div>
              <a href="#" className="text-sm font-medium text-stone-600 hover:text-[#1C1E26] flex items-center gap-1 shrink-0 whitespace-nowrap">
                Case study <span className="text-xs">↗</span>
              </a>
            </div>
          ))}
        </div>

        {/* Support CTA */}
        <div className="mt-24 grid md:grid-cols-2 gap-16 items-center bg-[#FAF5EE] rounded-3xl p-10 md:p-16">
          <div>
            <h3 className="text-2xl md:text-3xl font-semibold text-[#1C1E26] mb-6">
              Your success is our priority
            </h3>
            <ul className="space-y-3">
              {[
                'Dedicated support when needed',
                'Thriving product community',
                'Live Q&A sessions and expert best practices',
                'Tailored, one-on-one onboarding',
                'Direct access to the Inline team, every step of the way',
              ].map(item => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-stone-600">
                  <span className="text-blue-400 text-xs">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex gap-3 mt-8">
              <a href="#" className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-transparent px-6 py-2.5 text-sm font-medium text-stone-800 hover:border-stone-400 hover:bg-white transition-colors">
                Book a demo
              </a>
              <a href="/app/dashboard" className="inline-flex items-center justify-center rounded-full bg-[#1C1E26] px-6 py-2.5 text-sm font-medium text-white hover:bg-stone-800 transition-colors">
                Start for free
              </a>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { quote: "We're super impressed with your support team, how fast and efficient they are in replying to all of their questions.", name: 'Katsiaryna Karliuk', role: 'Project & Change Manager at Enteractive' },
              { quote: "As always, very swift response from the team with the fix exactly as requested.", name: 'Oskar Grochowalski', role: 'CEO at Remote Sensei' },
              { quote: "We're really grateful for the partnership we've built with Inline.", name: 'Jill Ferrie', role: 'Learning & Development Manager at GrandPad' },
            ].map(t => (
              <div key={t.name} className="bg-white rounded-2xl border border-stone-200/50 p-5">
                <p className="text-sm text-stone-600 leading-relaxed mb-3">{t.quote}</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-stone-200 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-[#1C1E26]">{t.name}</p>
                    <p className="text-[10px] text-stone-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MarketingParallaxSection>
  )
}

/* ─── Combined Export ─── */

export default function FeatureSection() {
  return (
    <>
      <DarkCurveSection />
      <AskSection />
      <WaveDivider from="#FDFBF7" to="#F5EDE3" />
      <EnterpriseBentoGrid />
      <WaveDivider from="#F5EDE3" to="#FDFBF7" flip />
      <TestimonialsSection />
    </>
  )
}