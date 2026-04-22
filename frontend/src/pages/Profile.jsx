import { useNavigate } from 'react-router-dom'

export default function Profile() {
  const navigate = useNavigate()
  const email = localStorage.getItem('email') ?? ''
  const initials = email ? email[0].toUpperCase() : '?'

  const handleLogout = () => {
    localStorage.removeItem('user_id')
    localStorage.removeItem('email')
    navigate('/')
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-20">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold select-none"
          style={{ backgroundColor: 'var(--color-forest)', color: 'var(--color-cream)' }}
        >
          {initials}
        </div>

        <div className="w-full rounded-2xl border border-[var(--color-cream-dark)] p-6 flex flex-col gap-4"
          style={{ backgroundColor: 'var(--color-cream)' }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1"
              style={{ color: 'var(--color-ink-subtle)' }}>
              Email
            </p>
            <p className="text-base font-medium" style={{ color: 'var(--color-ink)' }}>
              {email || '—'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-colors border border-[var(--color-cream-dark)] hover:border-[var(--color-forest)] hover:text-[var(--color-forest)]"
          style={{ color: 'var(--color-ink-muted)' }}
        >
          Log out
        </button>
      </div>
    </div>
  )
}
