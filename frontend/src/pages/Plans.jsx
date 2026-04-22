import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const USER_KEY = 'user_id'

function formatWeekRange(weekStart) {
  if (!weekStart) return ''
  const start = new Date(weekStart + 'T00:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}`
}

function PencilIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6.536-6.536a2 2 0 012.828 2.828L11.828 13.828a2 2 0 01-.828.5l-3.5.875.875-3.5a2 2 0 01.5-.828z" />
    </svg>
  )
}

function Spinner({ small }) {
  return (
    <svg className={`${small ? 'w-4 h-4' : 'w-8 h-8'} text-indigo-400 animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function PlanRow({ plan, onSetActive, onRename, onView, settingActive }) {
  const [editing, setEditing] = useState(false)
  const [nameVal, setNameVal] = useState(plan.name ?? '')
  const [saving, setSaving] = useState(false)

  const handleBlur = async () => {
    setEditing(false)
    const trimmed = nameVal.trim()
    if (!trimmed || trimmed === plan.name) {
      setNameVal(plan.name ?? '')
      return
    }
    setSaving(true)
    try {
      await onRename(plan.id, trimmed)
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') e.target.blur()
    if (e.key === 'Escape') {
      setNameVal(plan.name ?? '')
      setEditing(false)
    }
  }

  const weekRange = formatWeekRange(plan.week_start)
  const mealInfo = [
    plan.meal_count != null ? `${plan.meal_count} meals` : null,
    plan.avg_calories_per_day != null ? `~${Math.round(plan.avg_calories_per_day).toLocaleString()} cal/day avg` : null,
  ].filter(Boolean).join(' · ')

  return (
    <div className={`flex items-center gap-4 px-5 py-4 rounded-xl border transition-colors ${
      plan.is_active ? 'border-green-200 bg-green-50/40' : 'border-gray-100 bg-white'
    }`}>
      {/* Name + week info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {editing ? (
            <input
              autoFocus
              value={nameVal}
              onChange={(e) => setNameVal(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="text-sm font-semibold text-gray-900 bg-white border border-indigo-300 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 w-52"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="group flex items-center gap-1 text-sm font-semibold text-gray-900 hover:text-indigo-700 transition-colors"
              title="Click to rename"
            >
              {saving ? <Spinner small /> : (plan.name || 'Untitled plan')}
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400">
                <PencilIcon />
              </span>
            </button>
          )}
          {plan.is_active && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-700">
              Active
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-gray-500">
          {weekRange}
          {mealInfo ? ` · ${mealInfo}` : ''}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {!plan.is_active && (
          <button
            type="button"
            onClick={() => onSetActive(plan.id)}
            disabled={settingActive}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {settingActive ? <Spinner small /> : 'Set Active'}
          </button>
        )}
        <button
          type="button"
          onClick={() => onView(plan.id)}
          className="px-3 py-1.5 rounded-lg bg-indigo-600 text-xs font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          View
        </button>
      </div>
    </div>
  )
}

export default function Plans() {
  const userId = localStorage.getItem(USER_KEY)
  const navigate = useNavigate()

  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [settingActive, setSettingActive] = useState(null)
  const [error, setError] = useState(null)

  const loadPlans = useCallback(async () => {
    if (!userId) return
    const res = await fetch(`${API_BASE}/api/users/${userId}/meal-plans`)
    if (!res.ok) throw new Error('Failed to load plans')
    return res.json()
  }, [userId])

  useEffect(() => {
    async function fetch() {
      try {
        const data = await loadPlans()
        setPlans(data ?? [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [userId, loadPlans])

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
      navigate(`/plan?plan_id=${newPlan.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleSetActive = async (planId) => {
    setSettingActive(planId)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/meal-plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: true }),
      })
      if (!res.ok) throw new Error('Failed to set active plan')
      const updated = await res.json()
      setPlans((prev) =>
        prev.map((p) =>
          p.id === planId ? updated : { ...p, is_active: false }
        )
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setSettingActive(null)
    }
  }

  const handleRename = async (planId, name) => {
    const res = await fetch(`${API_BASE}/api/meal-plans/${planId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (!res.ok) throw new Error('Failed to rename plan')
    const updated = await res.json()
    setPlans((prev) => prev.map((p) => (p.id === planId ? updated : p)))
  }

  const handleView = (planId) => {
    navigate(`/plan?plan_id=${planId}`)
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Meal Plans</h1>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="px-4 py-2 rounded-lg bg-green-500 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {generating ? 'Generating… (~60s)' : 'Generate New Plan'}
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 text-sm text-red-700 border border-red-100">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-24">
          <Spinner />
        </div>
      )}

      {!loading && plans.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-gray-500 text-sm">No plans yet — generate your first one</p>
        </div>
      )}

      {!loading && plans.length > 0 && (
        <div className="space-y-2">
          {plans.map((plan) => (
            <PlanRow
              key={plan.id}
              plan={plan}
              onSetActive={handleSetActive}
              onRename={handleRename}
              onView={handleView}
              settingActive={settingActive === plan.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
