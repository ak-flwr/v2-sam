'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        router.push('/')
        router.refresh()
      } else {
        setError(data.error || 'Invalid password')
      }
    } catch (err) {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: '#0a1525',
        backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(35,213,171,0.15), transparent)'
      }}
    >
      <div className="w-full max-w-sm">
        {/* Main Card - Glass morphism */}
        <div
          className="rounded-[24px] border border-white/10 bg-white/5 backdrop-blur-xl p-8"
          style={{
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)'
          }}
        >
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
              style={{
                background: 'linear-gradient(135deg, rgba(35,213,171,0.3), rgba(35,213,171,0.1))',
                border: '1px solid rgba(35,213,171,0.3)'
              }}
            >
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-white/95 tracking-tight">SND v2</h1>
            <p className="text-[13px] text-white/50 mt-1">Delivery Control Link</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="password" className="block text-[11px] font-medium text-white/50 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white/95 text-[14px] placeholder-white/30 focus:outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/25 transition-all"
                placeholder="Enter access password"
                autoFocus
                required
              />
            </div>

            {error && (
              <div className="rounded-xl border border-orange-400/30 bg-orange-500/10 px-4 py-3 text-orange-300 text-[13px]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 px-4 bg-emerald-500/20 hover:bg-emerald-500/30 disabled:bg-white/5 border border-emerald-400/30 hover:border-emerald-400/50 disabled:border-white/10 text-emerald-300 disabled:text-white/30 font-medium rounded-xl transition-all duration-200 text-[14px]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Verifying...
                </span>
              ) : (
                'Continue'
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-white/30 text-[11px] mt-6">
            Protected Access
          </p>
        </div>
      </div>
    </div>
  )
}
