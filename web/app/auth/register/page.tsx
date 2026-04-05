'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const[loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setDone(true)
  }

  return (
    <div className="min-h-screen flex bg-[#FDFBF7] text-[#1C1E26] selection:bg-stone-200 selection:text-[#1C1E26]">
      
      {/* LEFT COLUMN: FORM */}
      <div className="w-full md:w-[45%] lg:w-[40%] flex flex-col justify-center px-8 sm:px-16 lg:px-24 relative z-10 bg-[#FDFBF7]">
        
        {/* Logo */}
        <Link
          href="/"
          className="absolute top-8 left-8 sm:left-16 lg:left-24 flex items-center gap-2"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#1C1E26]" aria-hidden>
            <span className="block h-4 w-1 rounded-full bg-white -rotate-12" />
          </div>
          <span className="font-semibold text-xl tracking-tight text-[#1C1E26]">
            inline<span className="text-stone-400 ml-0.5 text-sm align-top">~</span>
          </span>
        </Link>

        <div className="w-full max-w-sm mt-16 md:mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {done ? (
            <div className="space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-200/50">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1C1E26]">
                Check your inbox
              </h1>
              <p className="text-[15px] text-stone-500 leading-relaxed">
                We sent a confirmation link to <strong className="text-[#1C1E26] font-medium">{email}</strong>.
                Click it to activate your account.
              </p>
              <div className="pt-4">
                <Link
                  href="/auth/login"
                  className="text-[15px] font-medium text-[#1C1E26] hover:text-stone-700 transition-colors"
                >
                  ← Back to log in
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1C1E26] mb-3">
                  Create account
                </h1>
                <p className="text-[15px] text-stone-500">
                  Already have an account?{' '}
                  <Link href="/auth/login" className="text-[#1C1E26] font-medium hover:text-stone-700 transition-colors">
                    Log in
                  </Link>
                </p>
              </div>

              {error && (
                <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200/80 rounded-xl text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <input
                    id="name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Full name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full h-12 px-5 rounded-full border border-stone-200/50 bg-white text-[15px] text-[#1C1E26] placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="Work email address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full h-12 px-5 rounded-full border border-stone-200/50 bg-white text-[15px] text-[#1C1E26] placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-all"
                  />
                </div>

                <div className="space-y-2 relative pb-2">
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="Password (min 8 characters)"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full h-12 pl-5 pr-12 rounded-full border border-stone-200/50 bg-white text-[15px] text-[#1C1E26] placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 -mt-1 text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-full bg-[#1C1E26] text-white text-sm font-medium hover:bg-stone-800 active:scale-[0.98] transition-all disabled:opacity-70 cursor-pointer"
                >
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
              </form>

              <div className="mt-8 text-center text-[13px] text-stone-500 leading-relaxed">
                By creating an account, you agree with Inline&apos;s<br />
                <a href="#" className="text-[#1C1E26] font-medium hover:underline">Privacy Policy</a> and <a href="#" className="text-[#1C1E26] font-medium hover:underline">Terms of Service</a>.
              </div>
            </>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: ILLUSTRATION (unchanged artwork — same bg + SVG as before) */}
      <div className="hidden md:flex flex-1 relative overflow-hidden items-center justify-center pointer-events-none bg-[#252525]">
        
        {/* Subtle noise/texture overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

        {/* The Illustration SVG */}
        <div className="w-[80%] max-w-[800px] h-auto relative">
          <svg viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            
            {/* --- PALETTE BASE --- */}
            {/* Puddle shadow */}
            <path d="M 100 450 C 50 450, 150 510, 300 510 C 450 510, 600 520, 680 490 C 720 470, 750 420, 680 430 C 600 440, 400 430, 100 450 Z" fill="#202020" />
            
            {/* Palette Outline */}
            <path d="M 120 440 C 60 430, 80 480, 180 490 C 300 500, 500 500, 650 470 C 730 450, 700 410, 630 420 C 530 430, 480 420, 480 390 C 480 350, 350 360, 250 380 C 180 390, 150 440, 120 440 Z" stroke="#E5E7EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
            <path d="M 130 445 C 70 435, 90 485, 190 495 C 310 505, 510 505, 660 475" stroke="#E5E7EB" strokeWidth="1" opacity="0.5" strokeLinecap="round" fill="transparent" />

            {/* Color Blobs on Palette */}
            {/* Orange/Peach */}
            <path d="M 210 430 C 180 420, 200 440, 230 440 C 260 440, 250 420, 210 430 Z" fill="#DFB2A9" />
            {/* Yellow */}
            <path d="M 280 460 C 250 450, 260 470, 300 470 C 340 470, 330 450, 280 460 Z" fill="#EAC16D" />
            {/* Teal */}
            <path d="M 400 480 C 370 470, 380 490, 420 490 C 460 490, 440 470, 400 480 Z" fill="#4A8B88" />
            {/* Pink */}
            <path d="M 540 470 C 510 460, 520 480, 560 480 C 600 480, 580 460, 540 470 Z" fill="#DFB2A9" />


            {/* --- COMPUTER SECTION --- */}
            {/* Base block */}
            <path d="M 410 420 L 580 420 L 560 450 L 390 450 Z" fill="#252525" stroke="#E5E7EB" strokeWidth="2" strokeLinejoin="round" />
            <path d="M 390 450 L 410 460 L 580 460 L 560 450" fill="transparent" stroke="#E5E7EB" strokeWidth="2" strokeLinejoin="round" />
            {/* Disk drive slot */}
            <line x1="500" y1="435" x2="540" y2="435" stroke="#E5E7EB" strokeWidth="2" strokeLinecap="round" />
            <circle cx="420" cy="435" r="3" fill="none" stroke="#E5E7EB" strokeWidth="1.5" />

            {/* Monitor Back / Casing */}
            <path d="M 580 300 L 610 320 L 600 390 L 570 400 Z" fill="#252525" stroke="#E5E7EB" strokeWidth="2" strokeLinejoin="round" />
            {/* Monitor Front Box */}
            <path d="M 430 280 L 580 290 L 570 400 L 410 390 Z" fill="#252525" stroke="#E5E7EB" strokeWidth="2" strokeLinejoin="round" />
            
            {/* Screen border */}
            <path d="M 440 295 L 565 305 L 555 385 L 420 375 Z" fill="#252525" stroke="#E5E7EB" strokeWidth="1.5" strokeLinejoin="round" />
            
            {/* Screen interior (darker) */}
            <path d="M 445 300 L 560 310 L 550 380 L 425 370 Z" fill="#1E1E1E" stroke="#E5E7EB" strokeWidth="1" strokeLinejoin="round" opacity="0.8" />

            {/* Screen Content Details */}
            <g opacity="0.9">
              {/* Green code lines */}
              <line x1="460" y1="320" x2="480" y2="322" stroke="#4A8B88" strokeWidth="3" strokeLinecap="round" />
              <line x1="490" y1="323" x2="520" y2="325" stroke="#4A8B88" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 4" />
              {/* Red code lines */}
              <line x1="465" y1="335" x2="475" y2="336" stroke="#D46E56" strokeWidth="3" strokeLinecap="round" />
              <line x1="485" y1="337" x2="510" y2="339" stroke="#D46E56" strokeWidth="3" strokeLinecap="round" />
              {/* Green dashed lines */}
              <line x1="470" y1="350" x2="530" y2="355" stroke="#4A8B88" strokeWidth="3" strokeLinecap="round" strokeDasharray="8 6" />
              {/* Brackets */}
              <text x="455" y="375" fill="#E5E7EB" fontSize="16" fontFamily="monospace" transform="rotate(3 455 375)">[</text>
              <text x="495" y="378" fill="#E5E7EB" fontSize="16" fontFamily="monospace" transform="rotate(3 495 378)">]</text>
              <circle cx="480" cy="372" r="1.5" fill="#E5E7EB" />
            </g>

            {/* Monitor knobs */}
            <circle cx="530" cy="392" r="2" fill="#D46E56" />
            <circle cx="545" cy="393" r="2" fill="#4A8B88" />


            {/* --- BIRDHOUSE CLOCKS --- */}
            
            {/* Birdhouse 1 (Left, lower) */}
            <g transform="translate(320, 220) rotate(-10)">
              {/* Wings */}
              <path d="M -10 30 C -30 20, -40 40, -10 50 Z" fill="transparent" stroke="#E5E7EB" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M -10 40 C -30 35, -35 55, -10 60 Z" fill="transparent" stroke="#E5E7EB" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M 50 30 C 70 20, 80 40, 50 50 Z" fill="transparent" stroke="#E5E7EB" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M 50 40 C 70 35, 75 55, 50 60 Z" fill="transparent" stroke="#E5E7EB" strokeWidth="1.5" strokeLinejoin="round" />
              
              {/* Box */}
              <rect x="0" y="20" width="40" height="40" fill="#252525" stroke="#E5E7EB" strokeWidth="1.5" strokeLinejoin="round" />
              {/* Side perspective */}
              <path d="M 40 20 L 50 10 L 50 50 L 40 60 Z" fill="#252525" stroke="#E5E7EB" strokeWidth="1.5" strokeLinejoin="round" />
              
              {/* Roof */}
              <path d="M -5 20 L 20 -10 L 45 20 Z" fill="#D46E56" stroke="#E5E7EB" strokeWidth="1.5" strokeLinejoin="round" />
              {/* Roof perspective */}
              <path d="M 20 -10 L 35 -20 L 55 10 L 40 20" fill="#252525" stroke="#E5E7EB" strokeWidth="1.5" strokeLinejoin="round" />
              {/* Roof stripes */}
              <line x1="5" y1="10" x2="15" y2="-2" stroke="#E5E7EB" strokeWidth="1" />
              <line x1="15" y1="18" x2="25" y2="6" stroke="#E5E7EB" strokeWidth="1" />
              
              {/* Clock face */}
              <circle cx="20" cy="40" r="12" fill="transparent" stroke="#E5E7EB" strokeWidth="1.5" />
              <circle cx="20" cy="40" r="1.5" fill="#E5E7EB" />
              <line x1="20" y1="40" x2="20" y2="32" stroke="#E5E7EB" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="20" y1="40" x2="25" y2="45" stroke="#E5E7EB" strokeWidth="1.5" strokeLinecap="round" />
              
              {/* Little door/hole */}
              <path d="M 12 10 C 12 5, 28 5, 28 10 L 28 18 L 12 18 Z" fill="transparent" stroke="#E5E7EB" strokeWidth="1.5" strokeLinejoin="round" />
              
              {/* Pendulum */}
              <line x1="20" y1="60" x2="20" y2="80" stroke="#E5E7EB" strokeWidth="1.5" />
              <circle cx="20" cy="85" r="5" fill="#EAC16D" stroke="#E5E7EB" strokeWidth="1.5" />
            </g>

            {/* Birdhouse 2 (Right, higher, smaller) */}
            <g transform="translate(480, 170) scale(0.7) rotate(5)">
              {/* Wings */}
              <path d="M -10 30 C -30 20, -40 40, -10 50 Z" fill="transparent" stroke="#E5E7EB" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M 50 30 C 70 20, 80 40, 50 50 Z" fill="transparent" stroke="#E5E7EB" strokeWidth="1.5" strokeLinejoin="round" />
              
              {/* Box */}
              <rect x="0" y="20" width="40" height="40" fill="#252525" stroke="#E5E7EB" strokeWidth="1.5" strokeLinejoin="round" />
              {/* Side perspective */}
              <path d="M 0 20 L -10 10 L -10 50 L 0 60 Z" fill="#252525" stroke="#E5E7EB" strokeWidth="1.5" strokeLinejoin="round" />
              
              {/* Roof */}
              <path d="M -5 20 L 20 -10 L 45 20 Z" fill="#D46E56" stroke="#E5E7EB" strokeWidth="1.5" strokeLinejoin="round" />
              {/* Roof perspective */}
              <path d="M -5 20 L -15 10 L 10 -20 L 20 -10 Z" fill="#252525" stroke="#E5E7EB" strokeWidth="1.5" strokeLinejoin="round" />
              
              {/* Clock face */}
              <circle cx="20" cy="40" r="10" fill="transparent" stroke="#E5E7EB" strokeWidth="1.5" />
              <line x1="20" y1="40" x2="25" y2="35" stroke="#E5E7EB" strokeWidth="1.5" strokeLinecap="round" />
              
              {/* Little door/hole */}
              <path d="M 15 10 C 15 5, 25 5, 25 10 L 25 15 L 15 15 Z" fill="transparent" stroke="#E5E7EB" strokeWidth="1.5" strokeLinejoin="round" />
              
              {/* Pendulum */}
              <line x1="20" y1="60" x2="20" y2="75" stroke="#E5E7EB" strokeWidth="1.5" />
              <circle cx="20" cy="78" r="4" fill="#EAC16D" stroke="#E5E7EB" strokeWidth="1.5" />
            </g>

            {/* Ambient motion lines/sparkles */}
            <path d="M 300 150 C 310 140, 320 160, 330 150" stroke="#E5E7EB" strokeWidth="1" strokeLinecap="round" fill="transparent" opacity="0.6" />
            <path d="M 600 200 C 620 180, 610 220, 630 200" stroke="#E5E7EB" strokeWidth="1" strokeLinecap="round" fill="transparent" opacity="0.6" />
            <path d="M 200 300 C 220 310, 210 280, 230 290" stroke="#E5E7EB" strokeWidth="1" strokeLinecap="round" fill="transparent" opacity="0.4" />

            {/* A few little stars */}
            <g stroke="#E5E7EB" strokeWidth="1.5" strokeLinecap="round" opacity="0.7">
              <line x1="380" y1="120" x2="380" y2="130" />
              <line x1="375" y1="125" x2="385" y2="125" />
              
              <line x1="680" y1="300" x2="680" y2="306" />
              <line x1="677" y1="303" x2="683" y2="303" />
            </g>

          </svg>
        </div>
      </div>
    </div>
  )
}