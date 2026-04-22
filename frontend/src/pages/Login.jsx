import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      if (res.status === 404) {
        setError('No account found with that email. Try setting up a new profile.')
        return
      }
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}))
        throw new Error(detail?.detail ?? `Server error ${res.status}`)
      }
      const data = await res.json()
      localStorage.setItem('user_id', data.user_id)
      localStorage.setItem('email', data.email)
      navigate('/plan')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[82vh] flex flex-col items-center justify-center px-6 py-20">
      <div className="w-full max-w-sm">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">Welcome back</h1>
        <p className="text-gray-500 text-sm mb-8">Enter your email to access your meal plan.</p>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-8 shadow-md">
          <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-shadow mb-4"
            autoComplete="email"
          />

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={!email.trim() || submitting}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold text-sm py-3 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          New here?{' '}
          <Link to="/onboarding" className="text-green-600 font-semibold hover:underline">
            Set up your profile
          </Link>
        </p>
      </div>
    </div>
  )
}
