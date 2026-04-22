import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()

  useEffect(() => {
    if (localStorage.getItem('user_id')) {
      navigate('/plan', { replace: true })
    }
  }, [navigate])

  return (
    <div className="min-h-[82vh] flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-8 tracking-widest uppercase">
        Calibrated to your body and goals
      </div>
      <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 mb-6 leading-[1.08]">
        Eat well.<br />
        <span className="text-green-500">Every week.</span>
      </h1>
      <p className="text-lg sm:text-xl text-gray-500 max-w-lg mb-10 leading-relaxed">
        Personalised meal plans and grocery lists built around your diet, budget,
        and schedule — generated in seconds.
      </p>
      <Link
        to="/onboarding"
        className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold text-base px-8 py-4 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 shadow-lg"
        style={{ boxShadow: '0 8px 24px rgba(34,197,94,0.3)' }}
      >
        Build my plan →
      </Link>
      <p className="mt-5 text-sm text-gray-400">Takes about 2 minutes. No credit card required.</p>
      <p className="mt-3 text-sm text-gray-400">
        Already have an account?{' '}
        <Link to="/login" className="text-green-600 font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
