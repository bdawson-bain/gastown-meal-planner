import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const DIETARY_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Keto',
  'Paleo',
  'Halal',
  'Kosher',
]

const ALLERGY_OPTIONS = [
  'Peanuts',
  'Tree Nuts',
  'Shellfish',
  'Fish',
  'Eggs',
  'Dairy',
  'Wheat / Gluten',
  'Soy',
]

const COOK_TIME_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
  { value: 90, label: '90+ min' },
]

const STEPS = [
  'Household',
  'Diet',
  'Allergies',
  'Budget',
  'Cook Time',
  'API Key',
]

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function StepIndicator({ current, total }) {
  return (
    <div className="flex items-center gap-1 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-1">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
              i < current
                ? 'bg-green-500 text-white'
                : i === current
                  ? 'bg-green-50 text-green-700 border-2 border-green-500'
                  : 'bg-gray-100 text-gray-400'
            }`}
          >
            {i < current ? '✓' : i + 1}
          </div>
          {i < total - 1 && (
            <div
              className={`h-0.5 w-6 ${i < current ? 'bg-green-500' : 'bg-gray-200'}`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function CheckboxGroup({ options, selected, onChange }) {
  const toggle = (opt) => {
    onChange(
      selected.includes(opt) ? selected.filter((x) => x !== opt) : [...selected, opt]
    )
  }
  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((opt) => (
        <label
          key={opt}
          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
            selected.includes(opt)
              ? 'border-green-500 bg-green-50 text-green-800'
              : 'border-gray-200 hover:border-gray-300 text-gray-700'
          }`}
        >
          <input
            type="checkbox"
            checked={selected.includes(opt)}
            onChange={() => toggle(opt)}
            className="accent-green-500"
          />
          <span className="text-sm font-medium">{opt}</span>
        </label>
      ))}
    </div>
  )
}

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    household_size: 1,
    dietary_prefs: [],
    allergies: [],
    budget: '',
    cook_time_minutes: 30,
    openai_api_key: '',
  })

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const canAdvance = () => {
    if (step === 0) return form.household_size >= 1
    if (step === 3) return form.budget !== '' && Number(form.budget) > 0
    if (step === 5) return form.openai_api_key.trim().length > 0
    return true
  }

  const handleNext = () => setStep((s) => s + 1)
  const handleBack = () => setStep((s) => s - 1)

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          household_size: Number(form.household_size),
          dietary_prefs: form.dietary_prefs,
          allergies: form.allergies,
          budget: Number(form.budget),
          cook_time_minutes: form.cook_time_minutes,
          openai_api_key: form.openai_api_key.trim() || null,
        }),
      })
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}))
        throw new Error(detail?.detail ?? `Server error ${res.status}`)
      }
      const data = await res.json()
      localStorage.setItem('gastownmeals:user_id', data.id)
      navigate('/plan')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="max-w-lg mx-auto">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-1">Set up your profile</h1>
        <p className="text-gray-500 mb-8 text-sm">
          Step {step + 1} of {STEPS.length} — {STEPS[step]}
        </p>

        <StepIndicator current={step} total={STEPS.length} />

        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-md">
          {step === 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Household size</h2>
              <p className="text-gray-500 text-sm mb-6">
                How many people are you cooking for?
              </p>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => set('household_size', Math.max(1, form.household_size - 1))}
                  className="w-10 h-10 rounded-full border border-gray-200 text-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  −
                </button>
                <span className="text-4xl font-extrabold text-green-500 w-12 text-center">
                  {form.household_size}
                </span>
                <button
                  type="button"
                  onClick={() => set('household_size', Math.min(20, form.household_size + 1))}
                  className="w-10 h-10 rounded-full border border-gray-200 text-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  +
                </button>
                <span className="text-gray-500 text-sm ml-2">
                  {form.household_size === 1 ? 'person' : 'people'}
                </span>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Dietary preferences</h2>
              <p className="text-gray-500 text-sm mb-6">
                Select all that apply. You can skip if none fit.
              </p>
              <CheckboxGroup
                options={DIETARY_OPTIONS}
                selected={form.dietary_prefs}
                onChange={(v) => set('dietary_prefs', v)}
              />
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Allergies</h2>
              <p className="text-gray-500 text-sm mb-6">
                Select any foods you need to avoid.
              </p>
              <CheckboxGroup
                options={ALLERGY_OPTIONS}
                selected={form.allergies}
                onChange={(v) => set('allergies', v)}
              />
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Weekly grocery budget</h2>
              <p className="text-gray-500 text-sm mb-6">
                Approximate amount you spend on groceries each week.
              </p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
                  $
                </span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="150"
                  value={form.budget}
                  onChange={(e) => set('budget', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-3 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-shadow"
                />
              </div>
              <p className="text-gray-400 text-xs mt-2">USD per week</p>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Max cook time per meal</h2>
              <p className="text-gray-500 text-sm mb-6">
                How long are you willing to spend cooking a single meal?
              </p>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {COOK_TIME_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set('cook_time_minutes', value)}
                    className={`py-3 rounded-xl border text-sm font-semibold transition-colors ${
                      form.cook_time_minutes === value
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">OpenAI API key</h2>
              <p className="text-gray-500 text-sm mb-4">
                Used to generate personalised meal plans.{' '}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-green-600 underline"
                >
                  Get your key at openai.com
                </a>
                .
              </p>
              <input
                type="password"
                placeholder="sk-..."
                value={form.openai_api_key}
                onChange={(e) => set('openai_api_key', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-shadow"
                autoComplete="off"
                spellCheck={false}
              />
              <p className="text-gray-400 text-xs mt-2">
                Your key is stored encrypted and never leaves your server.
              </p>
            </div>
          )}

          {error && (
            <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-between mt-6">
          {step > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canAdvance()}
              className="px-6 py-2.5 rounded-xl bg-green-500 text-white font-bold text-sm hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canAdvance() || submitting}
              className="px-6 py-2.5 rounded-xl bg-green-500 text-white font-bold text-sm hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Saving…' : 'Finish setup'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
