import { NavLink, Outlet } from 'react-router-dom'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/onboarding', label: 'Onboarding' },
  { to: '/plan', label: 'Meal Plan' },
  { to: '/grocery-list', label: 'Grocery List' },
]

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      <header className="border-b border-gray-200 px-6 py-4">
        <nav className="max-w-4xl mx-auto flex items-center gap-6">
          <span className="font-semibold text-lg">GasTown Meals</span>
          <ul className="flex gap-4 list-none m-0 p-0">
            {navLinks.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    isActive
                      ? 'text-indigo-600 font-medium'
                      : 'text-gray-600 hover:text-gray-900'
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
