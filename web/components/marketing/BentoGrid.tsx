'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  Building2, Cpu, Zap, Globe, Heart, Briefcase,
  Headphones, BarChart3,
} from 'lucide-react'

function BentoParallaxSection({
  className,
  children,
  yRange = [20, -20] as [number, number],
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

/* ─── Social Proof Strip ─── */

const LOGOS =[
  { icon: Building2, name: 'BH' },
  { icon: Cpu,       name: 'Canon' },
  { icon: Headphones, name: 'logitech' },
  { icon: Globe,     name: 'Visma' },
  { icon: BarChart3, name: 'BambooHR' },
  { icon: Briefcase, name: 'Karbon' },
  { icon: Heart,     name: 'neo' },
  { icon: Zap,       name: 'Acme' },
]

function SocialProofStrip() {
  return (
    <BentoParallaxSection className="py-20 px-6 bg-[#FDFBF7]" yRange={[18, -18]}>
      <div className="max-w-5xl mx-auto text-center">
        <p className="text-sm text-stone-500 mb-10 font-medium">
          3,000+ leading companies trust Inline as their single source of truth.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {LOGOS.map(logo => {
            const Icon = logo.icon
            return (
              <div key={logo.name} className="flex items-center gap-2 text-stone-300 hover:text-stone-400 transition-colors">
                <Icon className="w-5 h-5" />
                <span className="text-sm font-semibold tracking-wide">{logo.name}</span>
              </div>
            )
          })}
        </div>
      </div>
    </BentoParallaxSection>
  )
}

/* ─── Alternating Feature Blocks ─── */

const FEATURES =[
  {
    eyebrow: 'Knowledge Management',
    headline: "Knowledge bases get messy.\nInline doesn't.",
    points:[
      'Document verification system with automated reminders',
      'Knowledge Management for bulk operations',
      'AI-suggested actions to maintain quality',
      'Ownership transfer when team members leave',
    ],
    visual: 'knowledge' as const,
    reverse: false,
  },
  {
    eyebrow: 'Docs that work for everyone',
    headline: 'Centralized, Always-Current Playbooks',
    points:[
      'Inline keeps every workflow, policy, and operational detail up-to-date',
      'One search away so hand-offs are simple',
      'Confident Audits and Handovers',
      "Everything's organized, accessible, and ready for compliance reviews",
    ],
    visual: 'docs' as const,
    reverse: true,
  },
]

function KnowledgeVisual() {
  const Row = ({ checked, text, icon, status }: { checked: boolean; text: string | null; icon: React.ReactNode; status: 'yellow' | 'green' | 'grey' | 'orange' }) => {
    return (
      <div className="flex items-center gap-4 py-0.5">
        {/* Checkbox */}
        <div className={`w-[18px] h-[18px] rounded-[4px] flex items-center justify-center shrink-0 ${checked ? 'bg-[#1877F2] border-[#1877F2]' : 'bg-white border-[#C9C9C9] border-[1.5px]'}`}>
          {checked && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1.5 4.5L3.5 6.5L8.5 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        
        {/* Icon */}
        <div className="text-[#666] shrink-0">
          {icon}
        </div>
        
        {/* Text / Skeleton */}
        <div className="flex-1 flex items-center">
          {text ? (
            <span className="text-[15px] font-medium text-[#3A3A3A]">{text}</span>
          ) : (
            <div className="w-36 h-2.5 rounded-full bg-[#EEEEEE]" />
          )}
        </div>
        
        {/* Pill Status */}
        <div className="shrink-0">
          {status === 'yellow' && (
            <div className="w-[66px] h-[22px] rounded-full bg-[#FCF6E3] flex items-center pl-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C4A052" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path strokeDasharray="3 3" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="M12 8v4l2.5 1.5" />
              </svg>
            </div>
          )}
          {status === 'green' && (
            <div className="w-[66px] h-[22px] rounded-full bg-[#E9F5ED] flex items-center pl-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4C9E62" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12l3 3 5-5" />
              </svg>
            </div>
          )}
          {status === 'grey' && (
            <div className="w-[66px] h-[22px] rounded-full bg-[#F3F3F3] flex items-center pl-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7A7A7A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4l2.5 1.5" />
              </svg>
            </div>
          )}
          {status === 'orange' && (
            <div className="w-[66px] h-[22px] rounded-full bg-[#FDF1E8] flex items-center pl-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D96B27" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M15 9l-6 6M9 9l6 6" />
              </svg>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center w-full">
      <div className="w-full max-w-[500px] rounded-[25px]  bg-[#EBBAC7] pl-6 pt-6 sm:pl-10 sm:pt-10 overflow-hidden shadow-sm">
        <div className="bg-white rounded-tl-[24px] border-t border-l border-[#222]  w-full h-full p-6 sm:p-8 sm:pb-10 flex flex-col relative">
          <h4 className="text-[24px] font-bold text-[#2B2B2B] mb-8 tracking-tight">Knowledge Management</h4>
          
          <div className="flex flex-col gap-4">
            {/* Group 1 */}
            <div className="-mx-3 bg-[#FAFAFA] rounded-[16px] p-3 flex flex-col gap-4">
              <Row 
                checked 
                text="Research plan" 
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 3h6" />
                    <path d="M10 3v8l-6 10h16l-6-10V3" />
                    <path d="M6 17h12" />
                  </svg>
                } 
                status="yellow" 
              />
              <Row 
                checked 
                text="Organization chart" 
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="8" y="3" width="8" height="6" rx="1" />
                    <path d="M12 9v4" />
                    <path d="M5 13h14" />
                    <path d="M5 13v3" />
                    <path d="M12 13v3" />
                    <path d="M19 13v3" />
                    <rect x="2" y="16" width="6" height="5" rx="1" />
                    <rect x="9" y="16" width="6" height="5" rx="1" />
                    <rect x="16" y="16" width="6" height="5" rx="1" />
                  </svg>
                } 
                status="green" 
              />
              <Row 
                checked 
                text="Time off policies" 
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                } 
                status="yellow" 
              />
            </div>
            
            {/* Row 4 */}
            <Row 
              checked={false}
              text={null}
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              }
              status="green"
            />

            {/* Group 2 */}
            <div className="-mx-3 bg-[#FAFAFA] rounded-[16px] p-3">
              <Row 
                checked 
                text="HR Handbook" 
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 21a9 9 0 0 0 9-9c0-5-4-9-9-9s-9 4-9 9c0 2 .5 4 1.5 5.5L12 21z" />
                  </svg>
                } 
                status="grey" 
              />
            </div>

            {/* Row 6 */}
            <Row 
              checked={false}
              text={null}
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 16l3-8 3 8c0 1.6-1.3 3-3 3s-3-1.4-3-3z" />
                  <path d="M2 16l3-8 3 8c0 1.6-1.3 3-3 3s-3-1.4-3-3z" />
                  <path d="M12 3v19" />
                  <path d="M5 8h14" />
                  <path d="M10 3h4" />
                </svg>
              }
              status="orange"
            />
          </div>

          {/* Action Bar */}
          <div className="mt-10 bg-[#F9F9FA] rounded-[12px] p-3 sm:px-4 flex items-center justify-between border border-[#F2F2F2] relative">
            <span className="text-[14.5px] text-[#7A7A7A] font-medium">4 selected docs</span>
            <button className="bg-[#EBEBEB] text-[#555] text-[14px] font-medium px-3 py-1.5 rounded-[6px] flex items-center shadow-sm">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5 text-[#555]">
                <rect width="20" height="5" x="2" y="4" rx="1" />
                <path d="M4 9v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9" />
                <path d="M10 13h4" />
              </svg>
              Archive
            </button>
            {/* Pointer Hand Cursor */}
            <svg 
              width="24" 
              height="26" 
              viewBox="0 0 24 26" 
              fill="white" 
              stroke="#333" 
              strokeWidth="1.5" 
              className="absolute -bottom-3 right-3 sm:right-4 z-10" 
              style={{ filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.25))' }}
            >
              <path d="M12.5 12V3.5C12.5 2.11929 11.3807 1 10 1C8.61929 1 7.5 2.11929 7.5 3.5V13.5M12.5 12V8.5C12.5 7.11929 13.6193 6 15 6C16.3807 6 17.5 7.11929 17.5 8.5V13.5M12.5 12H13.5M17.5 13.5V9.5C17.5 8.11929 18.6193 7 20 7C21.3807 7 22.5 8.11929 22.5 9.5V18.5C22.5 21.5376 20.0376 24 17 24H11.5C8.9065 24 6.5513 22.4279 5.38575 20.097L2.14645 13.618C1.5977 12.5205 2.39572 11.25 3.61917 11.25H4.5C5.88071 11.25 7 12.3693 7 13.75V16" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

function DocsVisual() {
  return (
    <div className="flex justify-center w-full">
      <div className="w-full max-w-[500px] rounded-[25px] b bg-[#C4D7D1] pl-6 pt-6 sm:pl-10 sm:pt-10 overflow-hidden shadow-sm">
        <div className="bg-white rounded-tl-[24px] border-t border-l border-[#222] w-full h-full p-6 sm:p-8 sm:pb-10 flex flex-col relative">
          
          <h4 className="text-[24px] font-bold text-[#2B2B2B] mb-8 tracking-tight">Playbook Library</h4>
          
          <div className="relative w-full mb-4">
            {/* Stacked offset background cards to create depth */}
            <div className="absolute inset-0 bg-[#F5F5F5] border border-[#222] rounded-[16px] translate-y-3 translate-x-3 z-0"></div>
            <div className="absolute inset-0 bg-[#FAFAFA] border border-[#222] rounded-[16px] translate-y-1.5 translate-x-1.5 z-10"></div>
            
            {/* Main Document Card */}
            <div className="bg-white border border-[#222] rounded-[16px] overflow-hidden relative z-20 flex flex-col w-full">
               
               {/* Browser/Editor Window Header */}
               <div className="bg-[#1C1E26] p-3.5 flex items-center justify-between border-b border-[#222]">
                  <div className="flex gap-1.5">
                     <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] border border-[#E0443E]"></div>
                     <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] border border-[#DEA123]"></div>
                     <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F] border border-[#1AAB29]"></div>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-8 h-1 bg-[#444] rounded-full"></div>
                    <div className="w-8 h-1 bg-[#444] rounded-full"></div>
                  </div>
               </div>
               
               {/* Document Body */}
               <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#E9F5ED] text-[#4C9E62] border border-[#CDEAE5] text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                        Verified
                      </span>
                      <span className="bg-[#F0F4F8] text-[#1877F2] border border-[#D1E4F9] text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">Template</span>
                    </div>
                  </div>

                  <h3 className="text-[20px] font-bold text-[#111] mb-2 leading-tight">Technical Documentation</h3>
                  <p className="text-[13px] text-[#666] leading-relaxed mb-6">
                    Comprehensive template for engineering teams to document APIs, architecture, and processes.
                  </p>

                  {/* Document structure preview rows */}
                  <div className="space-y-3">
                     <div className="p-3 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] flex items-center gap-3">
                       <div className="bg-white border border-[#E0E0E0] shadow-sm text-[#1877F2] p-2 rounded-lg shrink-0">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                       </div>
                       <div>
                         <div className="text-[13px] font-semibold text-[#333]">API Reference</div>
                         <div className="text-[11px] text-[#888] mt-0.5">Endpoints, payloads, auth</div>
                       </div>
                     </div>
                     <div className="p-3 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] flex items-center gap-3">
                       <div className="bg-white border border-[#E0E0E0] shadow-sm text-[#D96B27] p-2 rounded-lg shrink-0">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                       </div>
                       <div>
                         <div className="text-[13px] font-semibold text-[#333]">System Architecture</div>
                         <div className="text-[11px] text-[#888] mt-0.5">Diagrams and infrastructure</div>
                       </div>
                     </div>
                  </div>
               </div>
               
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}

function FeatureBlocks() {
  return (
    <BentoParallaxSection className="py-24 px-6 bg-[#F5EDE3]" yRange={[24, -24]}>
      <div className="max-w-6xl mx-auto space-y-28">
        {FEATURES.map((feature, idx) => (
          <motion.div
            key={feature.eyebrow}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={`grid md:grid-cols-2 gap-16 items-center ${feature.reverse ? 'md:[&>*:first-child]:order-2' : ''}`}
          >
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-stone-400 mb-4">
                {feature.eyebrow}
              </p>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#1C1E26] mb-5 leading-tight whitespace-pre-line">
                {feature.headline}
              </h2>
              <ul className="space-y-3">
                {feature.points.map(point => (
                  <li key={point} className="flex items-start gap-3 text-sm">
                    <div className="w-1 h-full min-h-[20px] bg-amber-300 rounded-full shrink-0 mt-0.5" />
                    <span className="text-stone-600">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>{feature.visual === 'knowledge' ? <KnowledgeVisual /> : <DocsVisual />}</div>
          </motion.div>
        ))}
      </div>
    </BentoParallaxSection>
  )
}

/* ─── Wave Divider (light cream → warm cream) ─── */

function WaveDividerDown() {
  return (
    <div className="relative w-full overflow-hidden bg-[#FDFBF7]" style={{ height: 160 }}>
      <svg
        viewBox="0 0 1440 160"
        className="absolute bottom-0 left-0 w-full block"
        preserveAspectRatio="none"
        style={{ height: 160 }}
      >
        <path
          d="M0,0 
             C360,120 1080,120 1440,0 
             L1440,200 
             L0,200 
             Z"
          fill="#F5EDE3"
        />
      </svg>
    </div>
  )
}

/* ─── Combined Export ─── */

export default function BentoGrid() {
  return (
    <>
      <SocialProofStrip />
      <WaveDividerDown />
      <FeatureBlocks />
    </>
  )
}