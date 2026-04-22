import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getMealImage } from '../utils/mealImage'

const MotionDiv = motion.div
const MotionSection = motion.section

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const USER_KEY = 'user_id'
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const SLOTS = ['breakfast', 'lunch', 'dinner']

function todayKey(weekStart) {
  if (weekStart) {
    const start = new Date(weekStart + 'T00:00:00')
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const dayIndex = Math.round((now - start) / (1000 * 60 * 60 * 24))
    if (dayIndex >= 0 && dayIndex <= 6) return DAYS[dayIndex]
  }
  return DAYS[(new Date().getDay() + 6) % 7]
}

function todayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' })
}

function formatDateHeader() {
  return new Date()
    .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    .toUpperCase()
}

function formatWeekRange(weekStart) {
  if (!weekStart) return ''
  const s = new Date(weekStart + 'T00:00:00')
  const e = new Date(s)
  e.setDate(e.getDate() + 6)
  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(s)} – ${fmt(e)}`
}

function getGreeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning.' : h < 17 ? 'Good afternoon.' : 'Good evening.'
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

function planAvgCal(meals) {
  if (!meals?.length) return null
  const withCal = meals.filter((m) => m.calories != null)
  if (!withCal.length) return null
  return Math.round(withCal.reduce((a, m) => a + m.calories, 0) / 7)
}

function goalLabel(fitnessGoal) {
  switch (fitnessGoal) {
    case 'cut': return 'Cut (-300 cal)'
    case 'bulk': return 'Bulk (+300 cal)'
    case 'performance': return 'Performance (+200 cal)'
    default: return 'Maintain'
  }
}

// ── Sub-components ──────────────────────────────────────────────────────────

function MacroRing({ label, value, target, color, delay = 0 }) {
  const [animated, setAnimated] = useState(false)
  const r = 52
  const circ = 2 * Math.PI * r
  const pct = target > 0 ? Math.min(1, (value ?? 0) / target) : 0
  const offset = circ * (1 - pct)
  const display =
    value == null ? '—' : value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(Math.round(value))

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), delay * 1000 + 60)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col items-center gap-2"
    >
      <div className="relative" style={{ width: 120, height: 120 }}>
        <svg viewBox="0 0 120 120" className="w-[120px] h-[120px] -rotate-90" aria-hidden="true">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#F0EDE6" strokeWidth="7" />
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={animated ? offset : circ}
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-[26px] leading-none text-ink">{display}</span>
        </div>
      </div>
      <p className="font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-ink-subtle">
        {label}
      </p>
    </MotionDiv>
  )
}

function SkeletonRing() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-[120px] h-[120px] rounded-full bg-cream-dark animate-pulse" />
      <div className="h-3 w-16 rounded-full bg-cream-dark animate-pulse" />
    </div>
  )
}

function MealPhotoCard({ meal, slot }) {
  if (!meal) {
    return (
      <div
        className="flex-shrink-0 flex flex-col rounded-2xl overflow-hidden border border-dashed border-cream-dark"
        style={{ width: 280, height: 200 }}
      >
        <div className="flex-1 bg-cream-dark flex items-center justify-center">
          <span className="text-3xl opacity-30">
            {slot === 'breakfast' ? '🌅' : slot === 'lunch' ? '☀️' : '🌙'}
          </span>
        </div>
        <div className="px-4 py-3 bg-white">
          <p className="font-sans text-[11px] uppercase tracking-widest text-ink-subtle capitalize">
            {slot}
          </p>
          <p className="font-sans text-sm text-ink-subtle italic mt-0.5">Not scheduled</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex-shrink-0 flex flex-col rounded-2xl overflow-hidden shadow-sm bg-white"
      style={{ width: 280, height: 200 }}
    >
      <div style={{ height: 120, overflow: 'hidden' }}>
        <img
          src={getMealImage(slot, meal.name)}
          alt={meal.name}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="px-4 py-3 flex-1 flex flex-col justify-center">
        <p className="font-sans text-[11px] uppercase tracking-widest text-ink-subtle capitalize">
          {slot}
        </p>
        <p className="font-sans text-sm font-medium text-ink leading-snug line-clamp-1 mt-0.5">
          {meal.name}
        </p>
        {meal.calories != null && (
          <p className="font-sans text-xs text-forest-muted mt-0.5">
            {meal.calories.toLocaleString()} cal
          </p>
        )}
      </div>
    </div>
  )
}

function SkeletonMealCard() {
  return (
    <div
      className="flex-shrink-0 rounded-2xl bg-cream-dark animate-pulse"
      style={{ width: 280, height: 200 }}
    />
  )
}

function CircleThumb({ src, alt, overlap }) {
  return (
    <div
      className="w-10 h-10 rounded-full overflow-hidden border-2 border-cream-dark ring-1 ring-white flex-shrink-0"
      style={overlap ? { marginLeft: '-12px' } : {}}
    >
      <img src={src} alt={alt} loading="lazy" className="w-full h-full object-cover" />
    </div>
  )
}

// ── Dashboard ───────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate()
  const userId = localStorage.getItem(USER_KEY)

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
        if (planRes.ok) {
          const planData = await planRes.json()
          if (!planData.week_start || !/^\d{4}-\d{2}-\d{2}$/.test(planData.week_start)) {
            console.warn('[Dashboard] active plan missing valid week_start — skipping render', planData)
          } else {
            setActivePlanFull(planData)
          }
        }
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

  const handleSetActive = useCallback(async (planId) => {
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
      if (planRes.ok) {
        const planData = await planRes.json()
        if (!planData.week_start || !/^\d{4}-\d{2}-\d{2}$/.test(planData.week_start)) {
          console.warn('[Dashboard] activated plan missing valid week_start — skipping render', planData)
        } else {
          setActivePlanFull(planData)
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setActivatingId(null)
    }
  }, [userId, activatingId])

  if (!userId) return null

  const tdee = user?.preferences?.tdee_estimate
  const fitnessGoal = user?.preferences?.fitness_goal
  const targets = macroTargets(tdee)
  const activePlan = plans.find((p) => p.is_active) ?? null
  const today = todayKey(activePlanFull?.week_start)
  const todayMeals = SLOTS.map(
    (slot) => activePlanFull?.meals.find((m) => m.day === today && m.meal_type === slot) ?? null,
  )
  const totals = activePlanFull ? todayTotals(activePlanFull.meals, today) : null
  const avgCal = planAvgCal(activePlanFull?.meals)
  const mealCount = activePlanFull?.meals?.length ?? 0
  const historyPlans = plans.slice(0, 4)
  const collageMeals = activePlanFull?.meals?.slice(0, 3) ?? []

  // Calorie status subtitle
  let calorieLine = 'Generate your first plan to get started.'
  if (activePlan && tdee) {
    calorieLine = totals
      ? `You're on track for ${totals.calories.toLocaleString()} cal today.`
      : `Your target: ${targets.calories.toLocaleString()} cal/day.`
  } else if (plans.length > 0) {
    calorieLine = 'Set an active plan to see today\'s meals.'
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-[1200px] mx-auto px-6 py-10 space-y-10">

        {/* ── 1. Greeting header ─────────────────────────────────────── */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
        >
          <div>
            <h1 className="font-display text-[56px] leading-[1.05] text-ink font-normal">
              {getGreeting()}
            </h1>
            <p className="font-sans text-[18px] text-forest-muted mt-2 leading-snug">
              {calorieLine}
            </p>
          </div>
          <div className="sm:text-right sm:pt-2 flex-shrink-0">
            <p className="font-sans text-[13px] uppercase tracking-[0.14em] text-ink-subtle">
              {formatDateHeader()}
            </p>
          </div>
        </MotionDiv>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 text-sm text-red-700 border border-red-100 font-sans">
            {error}
          </div>
        )}

        {/* ── 2. Macro ring row ──────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 justify-items-center">
            {[0, 1, 2, 3].map((i) => <SkeletonRing key={i} />)}
          </div>
        ) : activePlan ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 justify-items-center">
            <MacroRing label="CALORIES" value={totals?.calories}  target={targets.calories}  color="#1B4332" delay={0.0} />
            <MacroRing label="PROTEIN"  value={totals?.protein_g} target={targets.protein_g} color="#D4A853" delay={0.1} />
            <MacroRing label="CARBS"    value={totals?.carbs_g}   target={targets.carbs_g}   color="#2D6A4F" delay={0.2} />
            <MacroRing label="FAT"      value={totals?.fat_g}     target={targets.fat_g}     color="#E8C37A" delay={0.3} />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-4">
            <p className="font-sans text-sm text-ink-subtle">
              {plans.length === 0 ? 'Generate a plan to track your daily macros.' : 'Activate a plan to see your macro targets.'}
            </p>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-2 bg-forest text-cream font-sans text-sm font-medium px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? 'Generating…' : 'Generate your first plan →'}
            </button>
          </div>
        )}

        {/* ── 3. Today's meals strip ─────────────────────────────────── */}
        <MotionSection
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="font-sans text-[12px] uppercase tracking-[0.14em] text-ink-subtle mb-4">
            Today, {todayLabel()}
          </p>

          {loading ? (
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
              {[0, 1, 2].map((i) => <SkeletonMealCard key={i} />)}
            </div>
          ) : activePlanFull ? (
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
              {SLOTS.map((slot, i) => (
                <MealPhotoCard key={slot} meal={todayMeals[i]} slot={slot} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-cream-dark p-10 text-center">
              <p className="font-sans text-sm text-ink-subtle mb-5">
                {plans.length === 0
                  ? "You don't have a meal plan yet."
                  : 'No active plan — set one active from your history below.'}
              </p>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="inline-flex items-center gap-2 bg-forest text-cream font-sans text-sm font-medium px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? 'Generating…' : 'Generate your first plan →'}
              </button>
            </div>
          )}
        </MotionSection>

        {/* ── 4. Active plan card ────────────────────────────────────── */}
        {activePlan && (
          <MotionSection
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="bg-cream-dark rounded-3xl p-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-[28px] leading-tight text-ink font-normal">
                  {activePlan.name ?? 'Weekly Plan'}
                </h2>
                <p className="font-sans text-[14px] text-ink-subtle mt-1">
                  {formatWeekRange(activePlan.week_start)}
                </p>
              </div>

              <div className="flex items-center gap-5 flex-shrink-0">
                <div className="flex flex-wrap gap-2">
                  <Link
                    to="/plan"
                    className="font-sans text-sm font-medium text-forest border border-forest px-4 py-1.5 rounded-full hover:bg-forest hover:text-cream transition-colors"
                  >
                    View plan
                  </Link>
                  <Link
                    to="/plan"
                    className="font-sans text-sm font-medium text-forest border border-forest px-4 py-1.5 rounded-full hover:bg-forest hover:text-cream transition-colors"
                  >
                    Swap a meal
                  </Link>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={generating}
                    className="font-sans text-sm font-medium text-forest border border-forest px-4 py-1.5 rounded-full hover:bg-forest hover:text-cream transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generating ? 'Generating…' : 'Regenerate'}
                  </button>
                </div>

                {collageMeals.length > 0 && (
                  <div className="flex items-center flex-shrink-0">
                    {collageMeals.map((meal, i) => (
                      <CircleThumb
                        key={i}
                        src={getMealImage(meal.meal_type, meal.name, 80)}
                        alt={meal.name}
                        overlap={i > 0}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </MotionSection>
        )}

        {/* ── 5. Plan history strip ──────────────────────────────────── */}
        {historyPlans.length > 0 && (
          <section>
            <p className="font-sans text-[12px] uppercase tracking-[0.14em] text-ink-subtle mb-4">
              Recent plans
            </p>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
              {historyPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`flex-shrink-0 w-40 rounded-2xl p-4 ${
                    plan.is_active ? 'bg-forest' : 'bg-white border border-cream-dark'
                  }`}
                >
                  <p className={`font-sans text-xs font-medium leading-tight line-clamp-2 ${
                    plan.is_active ? 'text-cream' : 'text-ink'
                  }`}>
                    {plan.name ?? 'Plan'}
                  </p>
                  <p className={`font-sans text-[10px] mt-1 ${
                    plan.is_active ? 'text-cream opacity-60' : 'text-ink-subtle'
                  }`}>
                    {formatWeekRange(plan.week_start)}
                  </p>
                  <div className="mt-3">
                    {plan.is_active ? (
                      <span className="font-sans text-[10px] font-semibold uppercase tracking-wide bg-amber text-ink px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetActive(plan.id)}
                        disabled={!!activatingId}
                        className="font-sans text-[11px] font-medium text-forest-muted hover:text-forest transition-colors disabled:opacity-50"
                      >
                        {activatingId === plan.id ? 'Setting…' : 'Set active'}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="flex-shrink-0 w-40 rounded-2xl border border-dashed border-cream-dark flex flex-col items-center justify-center gap-2 p-4 hover:bg-cream-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="font-sans text-2xl text-ink-subtle leading-none">+</span>
                <span className="font-sans text-xs text-ink-subtle">Generate new plan</span>
              </button>
            </div>
          </section>
        )}

        {/* ── 6. Quick stats footer ──────────────────────────────────── */}
        {activePlan && !loading && (
          <div className="border-t border-cream-dark pt-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <p className="font-sans text-[13px] text-ink-subtle">
                {mealCount} meals planned
              </p>
              <p className="font-sans text-[13px] text-ink-subtle">
                {avgCal != null ? `avg ${avgCal.toLocaleString()} cal/day` : '—'}
              </p>
              <p className="font-sans text-[13px] text-ink-subtle">
                Goal: {goalLabel(fitnessGoal)}
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
