import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const USER_KEY = 'user_id'
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const SLOTS = ['breakfast', 'lunch', 'dinner']
const SLOT_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' }
const SLOT_ICONS = { breakfast: '🌅', lunch: '☀️', dinner: '🌙' }

function todayKey() {
  return DAYS[(new Date().getDay() + 6) % 7]
}

function greeting(name) {
  const h = new Date().getHours()
  const salutation = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
  return `Good ${salutation}${name ? `, ${name}` : ''}`
}

function nameFromEmail(email) {
  if (!email) return null
  const local = email.split('@')[0]
  const part = local.split(/[._+]/)[0]
  return part.charAt(0).toUpperCase() + part.slice(1)
}

function formatToday() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function formatWeekRange(weekStart) {
  if (!weekStart) return ''
  const s = new Date(weekStart + 'T00:00:00')
  const e = new Date(s)
  e.setDate(e.getDate() + 6)
  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(s)} – ${fmt(e)}`
}

function macroTargets(tdee) {
  const cal = tdee ?? 2000
  return {
    calories: cal,
    protein_g: Math.round((cal * 0.25) / 4),
    carbs_g: Math.round((cal * 0.45) / 4),
    fat_g: Math.round((cal * 0.30) / 9),
  }
}

function todayTotals(meals, day) {
  const dayMeals = SLOTS
    .map((s) => meals.find((m) => m.day === day && m.meal_type === s))
    .filter(Boolean)
  if (!dayMeals.length) return null
  if (!dayMeals.some((m) => m.calories != null)) return null
  return dayMeals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories ?? 0),
      protein_g: acc.protein_g + (m.protein_g ?? 0),
      carbs_g: acc.carbs_g + (m.carbs_g ?? 0),
      fat_g: acc.fat_g + (m.fat_g ?? 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  )
}

// SVG circular progress ring
function MacroRing({ label, value, target, unit, color }) {
  const r = 24
  const circ = 2 * Math.PI * r // ≈ 150.8
  const pct = target > 0 ? Math.min(1, (value ?? 0) / target) : 0
  const dash = pct * circ
  const hasValue = value != null && value > 0
  const display =
    value == null ? '—' : value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(Math.round(value))

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-16 h-16">
        <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
          <circle cx="32" cy="32" r={r} fill="none" stroke="#f3f4f6" strokeWidth="6" />
          {hasValue && (
            <circle
              cx="32"
              cy="32"
              r={r}
              fill="none"
              stroke={color}
              strokeWidth="6"
              strokeDasharray={`${dash} ${circ}`}
              strokeLinecap="round"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-bold text-gray-700 leading-none">{display}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold text-gray-800">{label}</p>
        <p className="text-[10px] text-gray-400">
          of {target}
          {unit}
        </p>
      </div>
    </div>
  )
}

function TodayMealCard({ meal, slot }) {
  const [expanded, setExpanded] = useState(false)

  if (!meal) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-4 flex flex-col items-center justify-center min-h-[108px]">
        <span className="text-2xl mb-1.5">{SLOT_ICONS[slot]}</span>
        <p className="text-xs font-medium text-gray-400">{SLOT_LABELS[slot]}</p>
        <p className="text-[10px] text-gray-300 mt-0.5">Not scheduled</p>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setExpanded((e) => !e)}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-left w-full hover:border-gray-200 transition-colors"
    >
      <div className="flex items-start gap-2 mb-1">
        <span className="text-xl flex-shrink-0">{SLOT_ICONS[slot]}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
            {SLOT_LABELS[slot]}
          </p>
          <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{meal.name}</p>
        </div>
      </div>
      {meal.calories != null && (
        <p className="text-xs text-orange-600 font-medium mt-1.5">
          {meal.calories.toLocaleString()} cal
        </p>
      )}
      {expanded && (
        <div className="mt-2 flex gap-1.5 flex-wrap">
          {meal.protein_g != null && (
            <span className="text-[10px] font-medium text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full">
              {Math.round(meal.protein_g)}g P
            </span>
          )}
          {meal.carbs_g != null && (
            <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
              {Math.round(meal.carbs_g)}g C
            </span>
          )}
          {meal.fat_g != null && (
            <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
              {Math.round(meal.fat_g)}g F
            </span>
          )}
          {meal.calories == null && (
            <span className="text-[10px] text-gray-400 italic">Macro data unavailable</span>
          )}
        </div>
      )}
    </button>
  )
}

function LoadingSpinner() {
  return (
    <svg className="w-8 h-8 text-green-400 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function SmallSpinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const userId = localStorage.getItem(USER_KEY)
  const name = nameFromEmail(localStorage.getItem('email'))

  const [user, setUser] = useState(null)
  const [plans, setPlans] = useState([])
  const [activePlanFull, setActivePlanFull] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [activatingId, setActivatingId] = useState(null)

  useEffect(() => {
    if (!userId) {
      navigate('/login', { replace: true })
      return
    }

    async function load() {
      const [userRes, plansRes] = await Promise.all([
        fetch(`${API_BASE}/api/users/${userId}`),
        fetch(`${API_BASE}/api/users/${userId}/meal-plans`),
      ])
      if (!userRes.ok) throw new Error('Failed to load user data')
      if (!plansRes.ok) throw new Error('Failed to load plans')

      const [userData, plansData] = await Promise.all([userRes.json(), plansRes.json()])
      setUser(userData)
      setPlans(plansData)

      const active = plansData.find((p) => p.is_active)
      if (active) {
        const planRes = await fetch(`${API_BASE}/api/meal-plans/${active.id}`)
        if (planRes.ok) setActivePlanFull(await planRes.json())
      }
    }

    load()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [userId, navigate])

  const handleGenerate = useCallback(async () => {
    if (!userId || generating) return
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/meal-plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.detail ?? `Server error ${res.status}`)
      }
      navigate('/plan')
    } catch (err) {
      setError(err.message)
      setGenerating(false)
    }
  }, [userId, generating, navigate])

  const handleSetActive = useCallback(
    async (planId) => {
      if (activatingId) return
      setActivatingId(planId)
      setError(null)
      try {
        const res = await fetch(`${API_BASE}/api/meal-plans/${planId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: true }),
        })
        if (!res.ok) throw new Error('Failed to set active plan')

        const [plansRes, planRes] = await Promise.all([
          fetch(`${API_BASE}/api/users/${userId}/meal-plans`),
          fetch(`${API_BASE}/api/meal-plans/${planId}`),
        ])
        if (plansRes.ok) setPlans(await plansRes.json())
        if (planRes.ok) setActivePlanFull(await planRes.json())
      } catch (err) {
        setError(err.message)
      } finally {
        setActivatingId(null)
      }
    },
    [userId, activatingId],
  )

  if (!userId) return null

  const tdee = user?.preferences?.tdee_estimate
  const targets = macroTargets(tdee)
  const today = todayKey()
  const activePlan = plans.find((p) => p.is_active) ?? null
  const todayMeals = SLOTS.map(
    (slot) =>
      activePlanFull?.meals.find((m) => m.day === today && m.meal_type === slot) ?? null,
  )
  const totals = activePlanFull ? todayTotals(activePlanFull.meals, today) : null
  const historyPlans = plans.slice(0, 4)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{greeting(name)}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{formatToday()}</p>
        </div>
        {tdee && (
          <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-4 py-2 rounded-full self-start sm:self-auto">
            <span>🎯</span>
            Your target: ~{tdee.toLocaleString()} cal/day
          </div>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 text-sm text-red-700 border border-red-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {/* Today's meals */}
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">Today's Meals</h2>
            {activePlanFull ? (
              <div className="grid grid-cols-3 gap-3">
                {SLOTS.map((slot, i) => (
                  <TodayMealCard key={slot} meal={todayMeals[i]} slot={slot} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                <p className="text-gray-500 text-sm mb-4">
                  {plans.length === 0
                    ? "You don't have a meal plan yet."
                    : 'No active plan — set one active from your history below.'}
                </p>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <>
                      <SmallSpinner />
                      Generating…
                    </>
                  ) : (
                    'Generate your first plan →'
                  )}
                </button>
              </div>
            )}
          </section>

          {/* Daily macro rings */}
          {activePlanFull && (
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-900">Today's Macros</h2>
                {totals == null && (
                  <span className="text-xs text-gray-400 italic">Macro data not yet available</span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-4 justify-items-center">
                <MacroRing
                  label="Calories"
                  value={totals?.calories}
                  target={targets.calories}
                  unit=""
                  color="#22c55e"
                />
                <MacroRing
                  label="Protein"
                  value={totals?.protein_g}
                  target={targets.protein_g}
                  unit="g"
                  color="#f43f5e"
                />
                <MacroRing
                  label="Carbs"
                  value={totals?.carbs_g}
                  target={targets.carbs_g}
                  unit="g"
                  color="#f59e0b"
                />
                <MacroRing
                  label="Fat"
                  value={totals?.fat_g}
                  target={targets.fat_g}
                  unit="g"
                  color="#10b981"
                />
              </div>
            </section>
          )}

          {/* Active plan card */}
          {activePlan && (
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full">
                    Active Plan
                  </span>
                  <h2 className="text-lg font-bold text-gray-900 mt-1.5">
                    {activePlan.name ?? 'Meal Plan'}
                  </h2>
                  <p className="text-sm text-gray-400">{formatWeekRange(activePlan.week_start)}</p>
                </div>
                <Link
                  to="/plan"
                  className="flex-shrink-0 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  View full plan
                </Link>
              </div>
              <div className="flex gap-2 mt-4">
                <Link
                  to="/plan"
                  className="flex-1 text-center px-4 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-sm font-semibold text-gray-700 transition-colors"
                >
                  Swap a meal
                </Link>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex-1 text-center px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-sm font-semibold text-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? 'Generating…' : 'Regenerate'}
                </button>
              </div>
            </section>
          )}

          {/* Plan history strip */}
          {historyPlans.length > 0 && (
            <section>
              <h2 className="text-base font-bold text-gray-900 mb-3">Plan History</h2>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                {historyPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`flex-shrink-0 w-40 bg-white rounded-2xl border p-4 shadow-sm ${
                      plan.is_active ? 'border-green-300' : 'border-gray-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <p className="text-xs font-bold text-gray-900 leading-tight line-clamp-2 flex-1">
                        {plan.name ?? 'Plan'}
                      </p>
                      {plan.is_active && (
                        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500 mt-0.5" />
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 mb-3">{formatWeekRange(plan.week_start)}</p>
                    {!plan.is_active && (
                      <button
                        type="button"
                        onClick={() => handleSetActive(plan.id)}
                        disabled={!!activatingId}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-50"
                      >
                        {activatingId === plan.id ? 'Setting…' : 'Set active'}
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex-shrink-0 w-40 bg-gray-50 hover:bg-gray-100 rounded-2xl border border-dashed border-gray-300 p-4 flex flex-col items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-2xl text-gray-400">+</span>
                  <span className="text-xs font-semibold text-gray-500">New plan</span>
                </button>
              </div>
            </section>
          )}

          {/* Quick actions */}
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">Quick Actions</h2>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col items-center gap-2 hover:border-green-300 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-2xl">✨</span>
                <span className="text-xs font-semibold text-gray-700 text-center leading-snug">
                  {generating ? 'Generating…' : 'Generate New Plan'}
                </span>
              </button>
              <Link
                to="/grocery-list"
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col items-center gap-2 hover:border-green-300 hover:bg-green-50 transition-colors"
              >
                <span className="text-2xl">🛒</span>
                <span className="text-xs font-semibold text-gray-700 text-center">
                  View Grocery List
                </span>
              </Link>
              <Link
                to="/onboarding"
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col items-center gap-2 hover:border-green-300 hover:bg-green-50 transition-colors"
              >
                <span className="text-2xl">⚙️</span>
                <span className="text-xs font-semibold text-gray-700 text-center">Update Goals</span>
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
