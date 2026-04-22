import { NavLink, Outlet, useNavigate } from 'react-router-dom'

const guestLinks = [
  { to: '/onboarding', label: 'Get Started' },
  { to: '/login', label: 'Sign in' },
]
const authLinks = [
  { to: '/', label: 'Dashboard' },
  { to: '/plans', label: 'My Plans' },
  { to: '/plan', label: 'Meal Plan' },
  { to: '/grocery-list', label: 'Grocery List' },
]

export default function Layout() {
  const navigate = useNavigate()
  const isLoggedIn = !!localStorage.getItem('user_id')
  const navLinks = isLoggedIn ? authLinks : guestLinks

  const handleLogout = () => {
    localStorage.removeItem('user_id')
    localStorage.removeItem('email')
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fafaf9' }}>
      <header className="sticky top-0 z-50 border-b border-gray-100" style={{ backgroundColor: 'rgba(250,250,249,0.92)', backdropFilter: 'blur(8px)' }}>
        <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <NavLink to="/" className="text-xl font-extrabold tracking-tight text-gray-900">
            GasTown<span className="text-green-500">.</span>
          </NavLink>
          <ul className="flex gap-6 list-none m-0 p-0 items-center">
            {navLinks.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    isActive
                      ? 'text-green-600 font-semibold text-sm'
                      : 'text-gray-500 hover:text-gray-900 font-medium text-sm transition-colors duration-150'
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
            {isLoggedIn && (
              <li>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-gray-900 font-medium text-sm transition-colors duration-150"
                >
                  Log out
                </button>
              </li>
            )}
          </ul>
        </nav>
      </header>
      <main className="flex-1 w-full">
        <Outlet />
      </main>
    </div>
  )
}
