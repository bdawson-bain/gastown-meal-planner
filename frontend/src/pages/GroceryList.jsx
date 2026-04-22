import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const USER_KEY = 'user_id'
const CHECKED_KEY = 'gastownmeals:grocery-checked'

const CATEGORY_ICONS = {
  produce: '🥦',
  protein: '🥩',
  dairy: '🥛',
  grains: '🌾',
  pantry: '🫙',
  other: '🛒',
}

const CATEGORY_LABELS = {
  produce: 'Produce',
  protein: 'Proteins',
  dairy: 'Dairy',
  grains: 'Grains & Bread',
  pantry: 'Pantry',
  other: 'Other',
}

const CATEGORY_ORDER = ['produce', 'protein', 'dairy', 'grains', 'pantry', 'other']

function groupByCategory(items) {
  const map = {}
  for (const item of items) {
    const cat = item.category ?? 'other'
    if (!map[cat]) map[cat] = []
    map[cat].push(item)
  }
  return CATEGORY_ORDER
    .map((cat) => ({ category: cat, items: map[cat] ?? [] }))
    .filter((g) => g.items.length > 0)
}

function loadChecked() {
  try {
    return new Set(JSON.parse(localStorage.getItem(CHECKED_KEY) ?? '[]'))
  } catch {
    return new Set()
  }
}

function saveChecked(set) {
  try {
    localStorage.setItem(CHECKED_KEY, JSON.stringify([...set]))
  } catch {} // eslint-disable-line no-empty
}

function formatQty(item) {
  if (!item.quantity && !item.unit) return ''
  if (!item.unit || item.unit === 'unit' || item.unit === 'units') return String(item.quantity)
  return `${item.quantity} ${item.unit}`
}

export default function GroceryList() {
  const navigate = useNavigate()
  const userId = localStorage.getItem(USER_KEY)

  const [items, setItems] = useState([])
  const [weekLabel, setWeekLabel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [checked, setChecked] = useState(loadChecked)

  useEffect(() => {
    saveChecked(checked)
  }, [checked])

  useEffect(() => {
    if (!userId) { navigate('/login', { replace: true }); return }

    async function load() {
      const plansRes = await fetch(`${API_BASE}/api/users/${userId}/meal-plans`)
      if (!plansRes.ok) throw new Error('Could not load meal plans')
      const plans = await plansRes.json()
      if (!plans.length) { setLoading(false); return }

      const plan = plans[0]

      // Build week label from week_start
      if (plan.week_start) {
        const start = new Date(plan.week_start + 'T00:00:00')
        const end = new Date(start)
        end.setDate(end.getDate() + 6)
        const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        setWeekLabel(`${fmt(start)} – ${fmt(end)}, ${start.getFullYear()}`)
      }

      const groceryRes = await fetch(`${API_BASE}/api/meal-plans/${plan.id}/grocery-list`)
      if (!groceryRes.ok) throw new Error('Could not load grocery list')
      const grocery = await groceryRes.json()
      setItems(grocery.items ?? [])
    }

    load()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [userId, navigate])

  const toggle = (key) => {
    setChecked((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const toggleCategory = (catItems) => {
    const keys = catItems.map((i) => i.name + i.unit)
    const allChecked = keys.every((k) => checked.has(k))
    setChecked((prev) => {
      const next = new Set(prev)
      for (const k of keys) allChecked ? next.delete(k) : next.add(k)
      return next
    })
  }

  const clearAll = () => setChecked(new Set())

  const groups = groupByCategory(items)
  const totalCount = items.length
  const checkedCount = items.filter((i) => checked.has(i.name + i.unit)).length

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6">
      <Link
        to="/plan"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to meal plan
      </Link>

      <div className="flex items-start justify-between mb-6 print:mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Grocery List</h1>
          {weekLabel && <p className="text-sm text-gray-500 mt-1">Week of {weekLabel}</p>}
        </div>
        <div className="flex items-center gap-2 print:hidden">
          {checkedCount > 0 && (
            <button
              onClick={clearAll}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z" />
            </svg>
            Print
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-24">
          <svg className="w-8 h-8 text-green-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 text-sm text-red-700 border border-red-100">
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-gray-500 mb-4">No grocery list yet — generate a meal plan first.</p>
          <Link to="/plan" className="text-sm text-green-600 font-semibold hover:underline">
            Go to Meal Plan →
          </Link>
        </div>
      )}

      {!loading && items.length > 0 && (
        <>
          <div className="mb-8 print:hidden">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-gray-500">
                {checkedCount === totalCount
                  ? 'All items gotten!'
                  : `${checkedCount} of ${totalCount} items gotten`}
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {Math.round((checkedCount / totalCount) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-300"
                style={{ width: `${(checkedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-6">
            {groups.map(({ category, items: catItems }) => {
              const catKeys = catItems.map((i) => i.name + i.unit)
              const catChecked = catKeys.filter((k) => checked.has(k)).length
              const allCatChecked = catChecked === catItems.length

              return (
                <div key={category} className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                  <button
                    onClick={() => toggleCategory(catItems)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left print:bg-white print:pointer-events-none"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg" aria-hidden="true">{CATEGORY_ICONS[category]}</span>
                      <span className="font-semibold text-gray-900 text-sm">{CATEGORY_LABELS[category]}</span>
                      <span className="text-xs text-gray-400 font-medium">{catChecked}/{catItems.length}</span>
                    </div>
                    <span className={`text-xs font-medium print:hidden ${allCatChecked ? 'text-green-600' : 'text-gray-400'}`}>
                      {allCatChecked ? 'All gotten' : 'Mark all'}
                    </span>
                  </button>

                  <ul className="divide-y divide-gray-100">
                    {catItems.map((item) => {
                      const key = item.name + item.unit
                      const isChecked = checked.has(key)
                      return (
                        <li key={key}>
                          <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors print:hover:bg-white">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggle(key)}
                              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 focus:ring-offset-0 flex-shrink-0 print:hidden"
                            />
                            <span className="hidden print:inline-flex h-4 w-4 rounded border border-gray-400 flex-shrink-0" />
                            <span className={`flex-1 text-sm ${isChecked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                              {item.name}
                            </span>
                            <span className={`text-xs flex-shrink-0 ${isChecked ? 'text-gray-300' : 'text-gray-400'}`}>
                              {formatQty(item)}
                            </span>
                          </label>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </div>
        </>
      )}

      <div className="mt-8 text-center print:hidden">
        <Link to="/plan" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
          ← Back to meal plan
        </Link>
      </div>
    </div>
  )
}
