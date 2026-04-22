import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

const MotionDiv = motion.div

const DIETARY_OPTIONS = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free',
  'Keto', 'Paleo', 'Halal', 'Kosher',
]

const ALLERGY_OPTIONS = [
  'Peanuts', 'Tree Nuts', 'Shellfish', 'Fish',
  'Eggs', 'Dairy', 'Wheat / Gluten', 'Soy',
]

const COOK_TIME_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
  { value: 90, label: '90+ min' },
]

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', icon: '🖥️', label: 'Sedentary', description: 'Desk job, little exercise' },
  { value: 'lightly_active', icon: '🚶', label: 'Lightly active', description: 'Light exercise 1–3 days/week' },
  { value: 'moderately_active', icon: '🏃', label: 'Moderately active', description: 'Moderate exercise 3–5 days/week' },
  { value: 'very_active', icon: '🏋️', label: 'Very active', description: 'Hard exercise 6–7 days/week' },
  { value: 'extra_active', icon: '⚡', label: 'Extra active', description: 'Physical job or twice-daily training' },
]

const GOAL_CARDS = [
  {
    value: 'cut',
    label: 'Cut',
    descriptor: 'Lose fat',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80',
  },
  {
    value: 'bulk',
    label: 'Bulk',
    descriptor: 'Build muscle',
    image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80',
  },
  {
    value: 'maintain',
    label: 'Maintain',
    descriptor: 'Stay balanced',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
  },
  {
    value: 'performance',
    label: 'Performance',
    descriptor: 'Optimize output',
    image: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=600&q=80',
  },
]

const STEP_HEADLINES = [
  "Who's eating?",
  "Any foods to avoid?",
  "What's your week look like?",
  "Tell us about your body.",
  "What are you working toward?",
  "Your OpenAI key",
]

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function EyeIcon({ open }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

const inputClass =
  'w-full border border-ink/15 rounded-2xl px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-forest/40 focus:border-forest bg-transparent transition-shadow'

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [showKey, setShowKey] = useState(false)

  const [form, setForm] = useState({
    household_size: 1,
    dietary_prefs: [],
    allergies: [],
    budget: '',
    cook_time_minutes: 30,
    age: '',
    sex: '',
    height_unit: 'imperial',
    height_ft: '',
    height_in: '',
    height_cm_input: '',
    weight: '',
    weight_unit: 'lbs',
    activity_level: '',
    fitness_goal: '',
    email: '',
    openai_api_key: '',
  })

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const toggleDiet = (opt) =>
    set('dietary_prefs',
      form.dietary_prefs.includes(opt)
        ? form.dietary_prefs.filter((x) => x !== opt)
        : [...form.dietary_prefs, opt]
    )

  const toggleAllergy = (opt) =>
    set('allergies',
      form.allergies.includes(opt)
        ? form.allergies.filter((x) => x !== opt)
        : [...form.allergies, opt]
    )

  const canAdvance = () => {
    if (step === 2) return form.budget !== '' && Number(form.budget) > 0
    if (step === 3) {
      const ageOk = Number(form.age) >= 16
      const weightOk = Number(form.weight) > 0
      const heightOk = form.height_unit === 'imperial'
        ? parseInt(form.height_ft, 10) > 0
        : parseInt(form.height_cm_input, 10) > 0
      return ageOk && weightOk && heightOk
    }
    if (step === 4) return form.fitness_goal !== ''
    if (step === 5) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) &&
        form.openai_api_key.trim().length > 0
    }
    return true
  }

  const handleNext = () => {
    setDirection(1)
    setStep((s) => s + 1)
  }

  const handleBack = () => {
    setDirection(-1)
    setStep((s) => s - 1)
  }

  const buildBioPayload = () => {
    const bio = {}
    if (form.age !== '' && Number(form.age) >= 16 && Number(form.age) <= 99) {
      bio.age = Number(form.age)
    }
    if (form.sex) bio.sex = form.sex
    if (form.height_unit === 'imperial') {
      const ft = parseInt(form.height_ft, 10)
      const inches = parseInt(form.height_in, 10) || 0
      if (!isNaN(ft) && ft > 0) {
        bio.height_cm = Math.round((ft * 12 + inches) * 2.54)
      }
    } else {
      const cm = parseInt(form.height_cm_input, 10)
      if (!isNaN(cm) && cm >= 50 && cm <= 300) {
        bio.height_cm = cm
      }
    }
    if (form.weight !== '') {
      const w = parseFloat(form.weight)
      if (!isNaN(w) && w > 0) {
        bio.weight_kg = form.weight_unit === 'lbs' ? parseFloat((w / 2.20462).toFixed(2)) : w
      }
    }
    if (form.activity_level) bio.activity_level = form.activity_level
    if (form.fitness_goal) bio.fitness_goal = form.fitness_goal
    return bio
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim(),
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
      const bio = buildBioPayload()
      if (Object.keys(bio).length > 0) {
        const bioRes = await fetch(`${API_BASE}/api/users/${data.id}/preferences`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bio),
        })
        if (!bioRes.ok) {
          const detail = await bioRes.json().catch(() => ({}))
          throw new Error(detail?.detail ?? `Server error ${bioRes.status}`)
        }
      }
      localStorage.setItem('user_id', data.id)
      localStorage.setItem('email', data.email ?? form.email.trim())
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const progress = ((step + 1) / STEP_HEADLINES.length) * 100

  const variants = {
    enter: (dir) => ({ opacity: 0, x: dir * 30 }),
    center: { opacity: 1, x: 0 },
    exit: (dir) => ({ opacity: 0, x: dir * -20 }),
  }

  return (
    <div className="relative flex flex-col">
      {/* Decorative background food image */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
        <img
          src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1400&q=60"
          alt=""
          className="w-full h-full object-cover opacity-20"
          style={{ filter: 'blur(24px)', transform: 'scale(1.1)' }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center px-6 py-12">
        <div className="w-full max-w-lg">
          {/* Step counter */}
          <p className="text-right text-[11px] uppercase tracking-widest text-ink-subtle mb-2">
            Step {step + 1} of {STEP_HEADLINES.length}
          </p>

          {/* Progress bar */}
          <div className="h-0.5 bg-cream-dark rounded-full overflow-hidden mb-10">
            <MotionDiv
              className="h-full bg-forest rounded-full"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>

          {/* Step content with slide transitions */}
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <MotionDiv
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              {/* Headline */}
              <h1 className="font-display text-[40px] leading-tight text-ink mb-8">
                {STEP_HEADLINES[step]}
              </h1>

              {/* Step 0: Household size */}
              {step === 0 && (
                <div className="flex items-center gap-5">
                  <button
                    type="button"
                    onClick={() => set('household_size', Math.max(1, form.household_size - 1))}
                    className="w-12 h-12 rounded-full border border-ink/20 text-xl font-semibold text-ink hover:bg-cream-dark transition-colors"
                  >
                    −
                  </button>
                  <span className="font-display text-6xl text-forest w-16 text-center select-none">
                    {form.household_size}
                  </span>
                  <button
                    type="button"
                    onClick={() => set('household_size', Math.min(20, form.household_size + 1))}
                    className="w-12 h-12 rounded-full border border-ink/20 text-xl font-semibold text-ink hover:bg-cream-dark transition-colors"
                  >
                    +
                  </button>
                  <span className="text-ink-subtle text-base ml-1">
                    {form.household_size === 1 ? 'person' : 'people'}
                  </span>
                </div>
              )}

              {/* Step 1: Diet + Allergies */}
              {step === 1 && (
                <div className="space-y-8">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-widest text-ink-subtle mb-3">
                      Dietary preferences
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {DIETARY_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleDiet(opt)}
                          className={`px-4 py-3 rounded-xl border text-sm font-medium text-left transition-colors ${
                            form.dietary_prefs.includes(opt)
                              ? 'border-forest bg-forest text-cream'
                              : 'border-ink/15 text-ink hover:border-ink/30'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-widest text-ink-subtle mb-3">
                      Allergies
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {ALLERGY_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleAllergy(opt)}
                          className={`px-4 py-3 rounded-xl border text-sm font-medium text-left transition-colors ${
                            form.allergies.includes(opt)
                              ? 'border-forest bg-forest text-cream'
                              : 'border-ink/15 text-ink hover:border-ink/30'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Budget + Cook Time */}
              {step === 2 && (
                <div className="space-y-8">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-widest text-ink-subtle mb-3">
                      Weekly grocery budget
                    </p>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-subtle font-semibold text-lg">
                        $
                      </span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="150"
                        value={form.budget}
                        onChange={(e) => set('budget', e.target.value)}
                        className="w-full border border-ink/15 rounded-2xl pl-9 pr-4 py-4 font-display text-2xl focus:outline-none focus:ring-2 focus:ring-forest/40 focus:border-forest bg-transparent transition-shadow"
                      />
                    </div>
                    <p className="text-ink-subtle text-xs mt-2">USD per week</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-widest text-ink-subtle mb-3">
                      Max cook time per meal
                    </p>
                    <div className="grid grid-cols-5 gap-2">
                      {COOK_TIME_OPTIONS.map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => set('cook_time_minutes', value)}
                          className={`py-3 rounded-xl border text-sm font-medium transition-colors ${
                            form.cook_time_minutes === value
                              ? 'border-forest bg-forest text-cream'
                              : 'border-ink/15 text-ink hover:border-ink/30'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Bio data */}
              {step === 3 && (
                <div className="space-y-7">
                  {/* Age */}
                  <div>
                    <p className="text-xs font-medium uppercase tracking-widest text-ink-subtle mb-3">Age</p>
                    <input
                      type="number"
                      min="16"
                      max="99"
                      placeholder="30"
                      value={form.age}
                      onChange={(e) => set('age', e.target.value)}
                      className="border-b-2 border-ink/20 focus:border-forest bg-transparent focus:outline-none py-2 font-display text-center text-ink"
                      style={{ fontSize: '48px', width: '120px' }}
                    />
                  </div>

                  {/* Sex */}
                  <div>
                    <p className="text-xs font-medium uppercase tracking-widest text-ink-subtle mb-3">Sex</p>
                    <div className="flex gap-2">
                      {[
                        { value: 'male', label: 'Male' },
                        { value: 'female', label: 'Female' },
                        { value: 'other', label: 'Other' },
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => set('sex', form.sex === value ? '' : value)}
                          className={`px-5 py-2 rounded-full border text-sm font-medium transition-colors ${
                            form.sex === value
                              ? 'border-forest bg-forest text-cream'
                              : 'border-ink/20 text-ink hover:border-ink/40'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <p className="text-ink-subtle text-xs mt-2">Used for calorie calculation only</p>
                  </div>

                  {/* Height */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-medium uppercase tracking-widest text-ink-subtle">Height</p>
                      <div className="flex rounded-full border border-ink/20 overflow-hidden text-xs font-medium">
                        {[['imperial', 'ft / in'], ['metric', 'cm']].map(([val, lbl]) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => set('height_unit', val)}
                            className={`px-3 py-1.5 transition-colors ${
                              form.height_unit === val
                                ? 'bg-forest text-cream'
                                : 'text-ink-muted hover:bg-cream-dark'
                            }`}
                          >
                            {lbl}
                          </button>
                        ))}
                      </div>
                    </div>
                    {form.height_unit === 'imperial' ? (
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <input
                            type="number" min="1" max="8" placeholder="5"
                            value={form.height_ft}
                            onChange={(e) => set('height_ft', e.target.value)}
                            className={`${inputClass} pr-10`}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle text-sm">ft</span>
                        </div>
                        <div className="relative flex-1">
                          <input
                            type="number" min="0" max="11" placeholder="10"
                            value={form.height_in}
                            onChange={(e) => set('height_in', e.target.value)}
                            className={`${inputClass} pr-10`}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle text-sm">in</span>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="number" min="50" max="300" placeholder="178"
                          value={form.height_cm_input}
                          onChange={(e) => set('height_cm_input', e.target.value)}
                          className={`${inputClass} pr-12`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle text-sm">cm</span>
                      </div>
                    )}
                  </div>

                  {/* Weight */}
                  <div>
                    <p className="text-xs font-medium uppercase tracking-widest text-ink-subtle mb-3">Weight</p>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <input
                          type="number" min="1" step="0.1"
                          placeholder={form.weight_unit === 'lbs' ? '160' : '73'}
                          value={form.weight}
                          onChange={(e) => set('weight', e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div className="flex rounded-full border border-ink/20 overflow-hidden text-xs font-medium">
                        {['lbs', 'kg'].map((unit) => (
                          <button
                            key={unit}
                            type="button"
                            onClick={() => set('weight_unit', unit)}
                            className={`px-4 py-2 transition-colors ${
                              form.weight_unit === unit
                                ? 'bg-forest text-cream'
                                : 'text-ink-muted hover:bg-cream-dark'
                            }`}
                          >
                            {unit}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Activity level */}
                  <div>
                    <p className="text-xs font-medium uppercase tracking-widest text-ink-subtle mb-3">Activity level</p>
                    <div className="space-y-2">
                      {ACTIVITY_OPTIONS.map(({ value, icon, label, description }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => set('activity_level', form.activity_level === value ? '' : value)}
                          className={`w-full text-left px-4 py-3 rounded-2xl border flex items-center gap-4 transition-colors ${
                            form.activity_level === value
                              ? 'border-forest bg-forest text-cream'
                              : 'border-ink/15 text-ink hover:border-ink/30'
                          }`}
                        >
                          <span className="text-xl" aria-hidden="true">{icon}</span>
                          <div>
                            <p className="text-sm font-medium">{label}</p>
                            <p className={`text-xs ${form.activity_level === value ? 'text-cream/70' : 'text-ink-subtle'}`}>
                              {description}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Fitness goal cards */}
              {step === 4 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {GOAL_CARDS.map(({ value, label, descriptor, image }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => set('fitness_goal', value)}
                      style={{ aspectRatio: '3/4' }}
                      className={`relative rounded-2xl overflow-hidden transition-all duration-200 ${
                        form.fitness_goal === value
                          ? 'ring-[3px] ring-forest scale-[1.02]'
                          : 'hover:scale-[1.01]'
                      }`}
                    >
                      <img
                        src={image}
                        alt={label}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      {form.fitness_goal === value && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-forest flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="font-display text-2xl text-white leading-tight">{label}</p>
                        <p className="text-white/80 text-[13px] mt-0.5">{descriptor}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Step 5: Email + API Key */}
              {step === 5 && (
                <div className="space-y-6">
                  <div>
                    <label
                      htmlFor="email-input"
                      className="block text-xs font-medium uppercase tracking-widest text-ink-subtle mb-3"
                    >
                      Email address
                    </label>
                    <input
                      id="email-input"
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => set('email', e.target.value)}
                      autoComplete="email"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="apikey-input"
                      className="block text-xs font-medium uppercase tracking-widest text-ink-subtle mb-3"
                    >
                      OpenAI API key
                    </label>
                    <div className="relative">
                      <input
                        id="apikey-input"
                        type={showKey ? 'text' : 'password'}
                        placeholder="sk-..."
                        value={form.openai_api_key}
                        onChange={(e) => set('openai_api_key', e.target.value)}
                        autoComplete="off"
                        spellCheck={false}
                        className={`${inputClass} font-mono pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey((v) => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink transition-colors"
                        aria-label={showKey ? 'Hide API key' : 'Show API key'}
                      >
                        <EyeIcon open={showKey} />
                      </button>
                    </div>
                    <p className="text-ink-subtle text-xs mt-2">
                      Used to generate personalised meal plans.{' '}
                      <a
                        href="https://platform.openai.com/api-keys"
                        target="_blank"
                        rel="noreferrer"
                        className="text-forest underline underline-offset-2"
                      >
                        Get your key at openai.com
                      </a>
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <p className="mt-6 text-sm text-red-600 bg-red-50 rounded-2xl px-4 py-3">
                  {error}
                </p>
              )}
            </MotionDiv>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex flex-col gap-3 mt-10">
            {step < STEP_HEADLINES.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canAdvance()}
                className="w-full py-4 rounded-full bg-forest text-cream text-base font-medium hover:bg-forest-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Continue →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canAdvance() || submitting}
                className="w-full py-4 rounded-full bg-forest text-cream text-base font-medium hover:bg-forest-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Setting up…' : 'Get started →'}
              </button>
            )}

            {step > 0 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={submitting}
                className="text-sm font-medium text-ink-subtle hover:text-ink transition-colors text-left"
              >
                ← Back
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
