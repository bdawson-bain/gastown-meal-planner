import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const SLOT_TYPES = ['breakfast', 'lunch', 'dinner']
const SLOT_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' }

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const USER_KEY = 'user_id'

function getDayDate(weekStart, dayIndex) {
  if (!weekStart) return ''
  const d = new Date(weekStart + 'T00:00:00')
  d.setDate(d.getDate() + dayIndex)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatWeekRange(weekStart) {
  if (!weekStart) return ''
  const start = new Date(weekStart + 'T00:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}, ${start.getFullYear()}`
}

function mealsToMap(meals) {
  const map = {}
  for (const meal of (meals ?? [])) {
    map[`${meal.day}-${meal.meal_type}`] = meal
  }
  return map
}

function ThumbUp() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
      <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.777zM4.5 10.5a1.5 1.5 0 00-1.5 1.5v6a1.5 1.5 0 001.5 1.5h.75a.75.75 0 00.75-.75v-7.5a.75.75 0 00-.75-.75H4.5z" />
    </svg>
  )
}

function ThumbDown() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
      <path d="M15.73 5.25h1.035A7.465 7.465 0 0118 9.375a7.465 7.465 0 01-1.235 4.125h-.148c-.806 0-1.534.446-2.031 1.08a9.04 9.04 0 01-2.861 2.4c-.723.384-1.35.956-1.653 1.715a4.498 4.498 0 00-.322 1.672V21a.75.75 0 01-.75.75 2.25 2.25 0 01-2.25-2.25c0-1.152.26-2.243.723-3.218.266-.558-.107-1.282-.725-1.282H3.622c-1.026 0-1.945-.694-2.054-1.715A12.134 12.134 0 011.5 12c0-.476.024-.947.072-1.41.133-1.303 1.218-2.215 2.473-2.09h.734c.483 0 .964.078 1.423.23l3.114 1.04a4.5 4.5 0 001.423.23h.777zM19.5 13.5a1.5 1.5 0 001.5-1.5v-6a1.5 1.5 0 00-1.5-1.5h-.75a.75.75 0 00-.75.75v7.5c0 .414.336.75.75.75h.75z" />
    </svg>
  )
}

function SwapIcon({ spinning }) {
  if (spinning) {
    return (
      <svg className="w-3.5 h-3.5 text-indigo-500 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    )
  }
  return (
    <svg className="w-3.5 h-3.5 text-gray-400 group-hover/btn:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0114.83-3.83M20 15a9 9 0 01-14.83 3.83" />
    </svg>
  )
}

function MacroStrip({ meal }) {
  if (meal.calories == null) return null
  return (
    <div className="flex items-center gap-1 mt-2 flex-wrap">
      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded-full">
        🔥 {meal.calories.toLocaleString()} cal
      </span>
      {meal.protein_g != null && (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-full">
          🥩 {Math.round(meal.protein_g)}g P
        </span>
      )}
      {meal.carbs_g != null && (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full">
          🍚 {Math.round(meal.carbs_g)}g C
        </span>
      )}
      {meal.fat_g != null && (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
          🫒 {Math.round(meal.fat_g)}g F
        </span>
      )}
    </div>
  )
}

function getDayTotals(mealMap, day) {
  const meals = SLOT_TYPES.map((slot) => mealMap[`${day}-${slot}`])
  if (meals.some((m) => !m || m.calories == null)) return null
  return meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein_g: acc.protein_g + (m.protein_g ?? 0),
      carbs_g: acc.carbs_g + (m.carbs_g ?? 0),
      fat_g: acc.fat_g + (m.fat_g ?? 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  )
}

function getWeeklyAvg(mealMap) {
  const dayTotals = DAYS_OF_WEEK.map((day) => getDayTotals(mealMap, day)).filter(Boolean)
  if (!dayTotals.length) return null
  const n = dayTotals.length
  return {
    calories: Math.round(dayTotals.reduce((s, d) => s + d.calories, 0) / n),
    protein_g: dayTotals.reduce((s, d) => s + d.protein_g, 0) / n,
    carbs_g: dayTotals.reduce((s, d) => s + d.carbs_g, 0) / n,
    fat_g: dayTotals.reduce((s, d) => s + d.fat_g, 0) / n,
  }
}

function MealCard({ meal, onSwap, swapping }) {
  const [feedback, setFeedback] = useState(null)

  const handleFeedback = async (rating) => {
    const next = feedback === rating ? null : rating
    setFeedback(next)
    if (meal?.id && next !== null) {
      try {
        await fetch(`${API_BASE}/api/meals/${meal.id}/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating: next }),
        })
      } catch {
        // non-critical — feedback is best-effort
      }
    }
  }

  if (!meal) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 p-3 h-full flex items-center justify-center min-h-[72px]">
        <span className="text-xs text-gray-300">—</span>
      </div>
    )
  }
  return (
    <div className="group relative rounded-lg border border-gray-100 bg-white p-3 h-full shadow-sm min-h-[72px] flex flex-col">
      <p className="text-sm font-medium text-gray-900 leading-snug pr-6">{meal.name}</p>
      <p className="mt-1 text-xs text-gray-500 line-clamp-2 flex-1">{meal.description}</p>
      <MacroStrip meal={meal} />
      <div className="flex gap-0.5 mt-1.5 justify-end">
        <button
          onClick={() => handleFeedback('liked')}
          title="Like"
          className={`p-1 rounded transition-colors ${
            feedback === 'liked'
              ? 'text-green-600 bg-green-50'
              : 'text-gray-300 hover:text-green-500 hover:bg-green-50'
          }`}
        >
          <ThumbUp />
        </button>
        <button
          onClick={() => handleFeedback('disliked')}
          title="Dislike"
          className={`p-1 rounded transition-colors ${
            feedback === 'disliked'
              ? 'text-red-500 bg-red-50'
              : 'text-gray-300 hover:text-red-400 hover:bg-red-50'
          }`}
        >
          <ThumbDown />
        </button>
      </div>
      <button
        onClick={onSwap}
        disabled={swapping}
        title="Swap this meal"
        className="group/btn absolute top-2 right-2 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1 rounded-md hover:bg-indigo-50 disabled:cursor-not-allowed"
        aria-label="Swap meal"
      >
        <SwapIcon spinning={swapping} />
      </button>
    </div>
  )
}

export default function Plan() {
  const userId = localStorage.getItem(USER_KEY)
  const [searchParams] = useSearchParams()
  const planIdParam = searchParams.get('plan_id')

  const [plan, setPlan] = useState(null)
  const [mealMap, setMealMap] = useState({})
  const [loading, setLoading] = useState(!!userId)
  const [generating, setGenerating] = useState(false)
  const [swapping, setSwapping] = useState(new Set())
  const [error, setError] = useState(null)

  const loadPlan = useCallback(async (uid) => {
    if (planIdParam) {
      const res = await fetch(`${API_BASE}/api/meal-plans/${planIdParam}`)
      if (!res.ok) throw new Error('Failed to load meal plan')
      return res.json()
    }
    const plansRes = await fetch(`${API_BASE}/api/users/${uid}/meal-plans`)
    if (!plansRes.ok) throw new Error('Failed to load meal plans')
    const plans = await plansRes.json()
    if (!plans.length) return null
    const active = plans.find((p) => p.is_active) ?? plans[0]
    const planRes = await fetch(`${API_BASE}/api/meal-plans/${active.id}`)
    if (!planRes.ok) throw new Error('Failed to load meal plan')
    return planRes.json()
  }, [planIdParam])

  useEffect(() => {
    if (!userId) return
    loadPlan(userId)
      .then((p) => {
        if (p) {
          setPlan(p)
          setMealMap(mealsToMap(p.meals))
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [userId, loadPlan])

  const handleGenerate = async () => {
    if (!userId) return
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
      const newPlan = await res.json()
      setPlan(newPlan)
      setMealMap(mealsToMap(newPlan.meals))
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleSwap = async (day, mealType) => {
    if (!plan) return
    const key = `${day}-${mealType}`
    setSwapping((prev) => new Set([...prev, key]))
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/meal-plans/${plan.id}/meals/${day}/${mealType}`, {
        method: 'PUT',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.detail ?? `Server error ${res.status}`)
      }
      const updatedMeal = await res.json()
      setMealMap((prev) => ({ ...prev, [key]: updatedMeal }))
    } catch (err) {
      setError(err.message)
    } finally {
      setSwapping((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  const weekLabel = plan?.week_start ? formatWeekRange(plan.week_start) : null

  const days = DAYS_OF_WEEK.map((day, i) => ({
    key: day,
    label: DAY_LABELS[i],
    date: plan?.week_start ? getDayDate(plan.week_start, i) : '',
  }))

  const weeklyAvg = getWeeklyAvg(mealMap)

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{plan?.name ?? 'Meal Plan'}</h1>
          {weekLabel && <p className="text-gray-500 text-sm mt-1">Week of {weekLabel}</p>}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            to="/plans"
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            My Plans
          </Link>
          {plan && (
            <Link
              to="/grocery-list"
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Grocery list
            </Link>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating || loading}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {generating ? 'Generating your plan (this may take ~60s)…' : plan ? 'Generate new plan' : 'Generate plan'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 text-sm text-red-700 border border-red-100">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-24">
          <svg className="w-8 h-8 text-indigo-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      {!loading && !plan && !generating && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-gray-500 mb-4">No meal plan yet. Generate one to get started.</p>
          {!userId && (
            <Link to="/onboarding" className="text-sm text-indigo-600 underline">
              Complete setup first
            </Link>
          )}
        </div>
      )}

      {(plan || generating) && (
        <>
          {/* Mobile view */}
          <div className="space-y-6 lg:hidden">
            {days.map(({ key: day, label, date }) => {
              const dayTotals = getDayTotals(mealMap, day)
              return (
                <div key={day}>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-base font-semibold text-gray-900">{label}</span>
                    {date && <span className="text-xs text-gray-400">{date}</span>}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {SLOT_TYPES.map((slot) => {
                      const key = `${day}-${slot}`
                      return (
                        <div key={slot}>
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                            {SLOT_LABELS[slot]}
                          </p>
                          <MealCard
                            meal={mealMap[key] ?? null}
                            onSwap={() => handleSwap(day, slot)}
                            swapping={swapping.has(key)}
                          />
                        </div>
                      )
                    })}
                  </div>
                  {dayTotals && (
                    <p className="mt-2 text-xs text-gray-400">
                      Day total: {dayTotals.calories.toLocaleString()} cal / {Math.round(dayTotals.protein_g)}g P / {Math.round(dayTotals.carbs_g)}g C / {Math.round(dayTotals.fat_g)}g F
                    </p>
                  )}
                </div>
              )
            })}
            {weeklyAvg && (
              <p className="text-xs text-gray-400 border-t border-gray-100 pt-4">
                Weekly avg: {weeklyAvg.calories.toLocaleString()} cal/day — {Math.round(weeklyAvg.protein_g)}g P / {Math.round(weeklyAvg.carbs_g)}g C / {Math.round(weeklyAvg.fat_g)}g F
              </p>
            )}
          </div>

          {/* Desktop view */}
          <div className="hidden lg:block overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-2 mb-2">
                <div />
                {days.map(({ key: day, label, date }) => (
                  <div key={day} className="text-center">
                    <p className="text-sm font-semibold text-gray-900">{label}</p>
                    {date && <p className="text-xs text-gray-400">{date}</p>}
                  </div>
                ))}
              </div>

              {SLOT_TYPES.map((slot) => (
                <div key={slot} className="grid grid-cols-[80px_repeat(7,1fr)] gap-2 mb-2">
                  <div className="flex items-start pt-3">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      {SLOT_LABELS[slot]}
                    </span>
                  </div>
                  {days.map(({ key: day }) => {
                    const key = `${day}-${slot}`
                    return (
                      <MealCard
                        key={day}
                        meal={mealMap[key] ?? null}
                        onSwap={() => handleSwap(day, slot)}
                        swapping={swapping.has(key)}
                      />
                    )
                  })}
                </div>
              ))}

              {days.some(({ key: day }) => getDayTotals(mealMap, day) !== null) && (
                <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-2 mt-1 border-t border-gray-100 pt-2">
                  <div className="flex items-center">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Total</span>
                  </div>
                  {days.map(({ key: day }) => {
                    const totals = getDayTotals(mealMap, day)
                    return (
                      <div key={day} className="text-center px-1">
                        {totals ? (
                          <p className="text-[10px] text-gray-400 leading-snug">
                            {totals.calories.toLocaleString()} cal
                            <br />
                            {Math.round(totals.protein_g)}P / {Math.round(totals.carbs_g)}C / {Math.round(totals.fat_g)}F
                          </p>
                        ) : (
                          <span className="text-[10px] text-gray-200">—</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {weeklyAvg && (
                <p className="mt-3 text-xs text-gray-400 text-right">
                  Weekly avg: {weeklyAvg.calories.toLocaleString()} cal/day — {Math.round(weeklyAvg.protein_g)}g P / {Math.round(weeklyAvg.carbs_g)}g C / {Math.round(weeklyAvg.fat_g)}g F
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
