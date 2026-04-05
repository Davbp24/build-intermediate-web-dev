'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, CheckCircle } from 'lucide-react'

export default function UpdatePasswordPage() {
  const router  = useRouter()
  const [pw,      setPw]      = useState('')
  const [confirm, setConfirm] = useState('')
  const [show,    setShow]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (pw !== confirm) { setError('Passwords do not match.'); return }
    if (pw.length < 8)  { setError('Password must be at least 8 characters.'); return }

    setLoading(true)
    try {
      if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { error: sbErr } = await supabase.auth.updateUser({ password: pw })
        if (sbErr) throw new Error(sbErr.message)
      }
      setDone(true)
      setTimeout(() => router.push('/auth/login'), 2500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] text-[#1C1E26] px-4 selection:bg-stone-200 selection:text-[#1C1E26]">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#1C1E26]" aria-hidden>
            <span className="block h-4 w-1 rounded-full bg-white -rotate-12" />
          </div>
          <span className="font-semibold text-[15px] tracking-tight text-[#1C1E26]">
            inline<span className="text-stone-400 ml-0.5 text-xs align-top">~</span>
          </span>
        </Link>

        <div className="bg-white rounded-2xl border border-stone-200/50 p-8">
          {done ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200/50 flex items-center justify-center mx-auto">
                <CheckCircle className="w-7 h-7 text-emerald-600" />
              </div>
              <h1 className="text-lg font-semibold text-[#1C1E26]">Password updated</h1>
              <p className="text-sm text-stone-500">Redirecting you to sign in…</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-lg font-semibold text-[#1C1E26]">Set new password</h1>
                <p className="text-sm text-stone-500 mt-1">Choose a strong password for your account.</p>
              </div>

              {error && (
                <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200/80 rounded-xl text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {(['New password', 'Confirm password'] as const).map((label, idx) => (
                  <div key={label} className="space-y-1.5">
                    <label className="text-xs font-medium text-stone-600">{label}</label>
                    <div className="relative">
                      <input
                        type={show ? 'text' : 'password'}
                        required
                        minLength={8}
                        placeholder="••••••••"
                        value={idx === 0 ? pw : confirm}
                        onChange={e => idx === 0 ? setPw(e.target.value) : setConfirm(e.target.value)}
                        className="w-full h-11 px-4 pr-10 rounded-full border border-stone-200/50 bg-white text-sm text-[#1C1E26] placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
                      />
                      {idx === 0 && (
                        <button
                          type="button"
                          onClick={() => setShow(s => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                        >
                          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-full bg-[#1C1E26] text-white text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {loading ? 'Updating…' : 'Update password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
