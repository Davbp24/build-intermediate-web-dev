'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react'
import { sendPasswordReset } from '@/lib/actions/auth'

export default function ResetPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await sendPasswordReset(email)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-xl bg-[#6C91C2] flex items-center justify-center">
            <span className="block h-4 w-1 rounded-full bg-white -rotate-12" />
          </div>
          <span className="font-bold text-[15px] tracking-tight text-slate-800">Inline</span>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#E6F4F2] flex items-center justify-center mx-auto">
                <CheckCircle className="w-7 h-7 text-[#5FA8A1]" />
              </div>
              <h1 className="text-lg font-semibold text-slate-800">Check your inbox</h1>
              <p className="text-sm text-slate-500 leading-relaxed">
                We&apos;ve sent a password reset link to <strong className="text-slate-700">{email}</strong>.
                It may take a minute to arrive.
              </p>
              <Link
                href="/auth/login"
                className="block mt-4 text-sm text-[#6C91C2] hover:text-[#5A7FB0] transition-colors font-medium"
              >
                ← Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-lg font-semibold text-slate-800">Reset your password</h1>
                <p className="text-sm text-slate-500 mt-1">
                  Enter your email and we&apos;ll send you a reset link.
                </p>
              </div>

              {error && (
                <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-sm focus:outline-none focus:ring-2 focus:ring-[#6C91C2]/40 focus:border-[#6C91C2] transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 rounded-lg bg-[#6C91C2] text-white text-sm font-semibold hover:bg-[#5A7FB0] transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>

              <Link
                href="/auth/login"
                className="flex items-center justify-center gap-1.5 mt-5 text-sm text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
