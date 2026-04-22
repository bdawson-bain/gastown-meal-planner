import { useState, useEffect, useRef } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const MotionDiv = motion.div

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

const authLinks = [
  { to: '/plan', label: 'My Plan' },
  { to: '/plans', label: 'Plans' },
  { to: '/grocery-list', label: 'Grocery List' },
]

const guestLinks = [
  { to: '/onboarding', label: 'Get Started' },
  { to: '/login', label: 'Sign in' },
]

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const isLoggedIn = !!localStorage.getItem('user_id')
  const email = localStorage.getItem('email') ?? ''
  const initials = email ? email[0].toUpperCase() : '?'
  const navLinks = isLoggedIn ? authLinks : guestLinks

  // Transparent nav only on the landing page (/) before scrolling
  const isLanding = location.pathname === '/'
  const transparent = isLanding && !scrolled

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  const handleLogout = () => {
    localStorage.removeItem('user_id')
    localStorage.removeItem('email')
    setDropdownOpen(false)
    navigate('/')
  }

  const logoTo = isLoggedIn ? '/dashboard' : '/'

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-cream)' }}>
      <ScrollToTop />

      <header
        className={`sticky top-0 z-50 transition-all duration-150 ${
          transparent
            ? 'bg-transparent border-b border-transparent'
            : 'border-b border-[var(--color-cream-dark)]'
        }`}
        style={
          transparent
            ? {}
            : { backgroundColor: 'rgba(250,249,246,0.80)', backdropFilter: 'blur(12px)' }
        }
      >
        <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          {/* Logo */}
          <NavLink
            to={logoTo}
            className={`font-display font-normal transition-colors duration-150 ${
              transparent ? 'text-white' : 'text-[var(--color-ink)]'
            }`}
            style={{ fontSize: '22px' }}
          >
            Forma
          </NavLink>

          {/* Desktop links */}
          <ul className="hidden md:flex gap-6 list-none m-0 p-0 items-center">
            {navLinks.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `text-sm font-medium transition-colors duration-150 border-b-2 pb-0.5 ${
                      isActive
                        ? 'text-[var(--color-forest)] border-[var(--color-forest)]'
                        : transparent
                          ? 'text-white/80 hover:text-white border-transparent'
                          : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] border-transparent'
                    }`
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}

            {/* Avatar + dropdown (logged in, desktop) */}
            {isLoggedIn && (
              <li className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold select-none"
                  style={{ backgroundColor: 'var(--color-forest)', color: 'var(--color-cream)' }}
                >
                  {initials}
                </button>
                <AnimatePresence>
                  {dropdownOpen && (
                    <MotionDiv
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 mt-2 w-36 rounded-xl shadow-lg border border-[var(--color-cream-dark)] overflow-hidden"
                      style={{ backgroundColor: 'var(--color-cream)' }}
                    >
                      <NavLink
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-3 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-cream-dark)] transition-colors"
                      >
                        Profile
                      </NavLink>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-cream-dark)] transition-colors"
                      >
                        Log out
                      </button>
                    </MotionDiv>
                  )}
                </AnimatePresence>
              </li>
            )}
          </ul>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className={`md:hidden flex flex-col gap-1.5 p-2 transition-colors ${
              transparent ? 'text-white' : 'text-[var(--color-ink)]'
            }`}
          >
            <span className="block w-5 h-0.5 bg-current rounded" />
            <span className="block w-5 h-0.5 bg-current rounded" />
            <span className="block w-5 h-0.5 bg-current rounded" />
          </button>
        </nav>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
              onClick={() => setDrawerOpen(false)}
            />
            <MotionDiv
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed top-0 right-0 bottom-0 z-50 w-72 flex flex-col py-8 px-6 shadow-2xl md:hidden"
              style={{ backgroundColor: 'var(--color-cream)' }}
            >
              <div className="flex items-center justify-between mb-8">
                <span
                  className="font-display font-normal text-[var(--color-ink)]"
                  style={{ fontSize: '22px' }}
                >
                  Forma
                </span>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                  className="p-2 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
                >
                  ✕
                </button>
              </div>

              <nav className="flex flex-col gap-1">
                {navLinks.map(({ to, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setDrawerOpen(false)}
                    className={({ isActive }) =>
                      `px-3 py-4 rounded-xl text-base font-semibold transition-colors ${
                        isActive
                          ? 'text-[var(--color-forest)] bg-[var(--color-cream-dark)]'
                          : 'text-[var(--color-ink)] hover:bg-[var(--color-cream-dark)]'
                      }`
                    }
                  >
                    {label}
                  </NavLink>
                ))}
                {isLoggedIn && (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-3 py-4 rounded-xl text-base font-semibold text-left text-[var(--color-ink)] hover:bg-[var(--color-cream-dark)] transition-colors"
                  >
                    Log out
                  </button>
                )}
              </nav>
            </MotionDiv>
          </>
        )}
      </AnimatePresence>

      {/* Page content with transitions */}
      <main className="flex-1 w-full">
        <AnimatePresence mode="wait">
          <MotionDiv
            key={location.pathname}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <Outlet />
          </MotionDiv>
        </AnimatePresence>
      </main>
    </div>
  )
}
