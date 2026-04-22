import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const MotionDiv = motion.div

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

const ACTIVITY_OPTIONS = [
  { value: 'sedentary',        icon: '🪑', label: 'Sedentary',        description: 'Desk job, little exercise' },
  { value: 'lightly_active',   icon: '🚶', label: 'Lightly active',   description: 'Light exercise 1–3 days/week' },
  { value: 'moderately_active',icon: '🏃', label: 'Moderately active',description: 'Moderate exercise 3–5 days/week' },
  { value: 'very_active',      icon: '💪', label: 'Very active',      description: 'Hard exercise 6–7 days/week' },
  { value: 'extra_active',     icon: '⚡', label: 'Extra active',     description: 'Physical job or twice daily training' },
]

const GOAL_OPTIONS = [
  {
    value: 'cut',
    label: 'Cut',
    descriptor: 'Lose fat — calorie deficit',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80',
  },
  {
    value: 'bulk',
    label: 'Bulk',
    descriptor: 'Build muscle — calorie surplus',
    image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80',
  },
  {
    value: 'maintain',
    label: 'Maintain',
    descriptor: 'Stay balanced — at maintenance',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
  },
  {
    value: 'performance',
    label: 'Performance',
    descriptor: 'Optimize performance — high-carb focus',
    image: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=600&q=80',
  },
]

const STEPS = [
  { key: 'household', headline: "Who's eating?" },
  { key: 'diet',      headline: "Any foods to avoid?" },
  { key: 'allergies', headline: "Any allergies?" },
  { key: 'week',      headline: "What's your week look like?" },
  { key: 'body',      headline: "Tell us about your body." },
  { key: 'goal',      headline: "What are you working toward?" },
  { key: 'email',     headline: "Your email." },
  { key: 'apikey',    headline: "Your OpenAI key." },
]

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function ProgressBar({ current, total }) {
  return (
    <div className="w-full mb-10">
      <div className="flex justify-end mb-2">
        <span className="font-dm-sans text-[11px] uppercase tracking-widest text-ink-subtle">
          Step {current + 1} of {total}
        </span>
      </div>
      <div className="h-0.5 w-full bg-ink/10 rounded-full overflow-hidden">
        <MotionDiv
          className="h-full bg-forest rounded-full"
          initial={false}
          animate={{ width: `${((current + 1) / total) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        />
      </div>
    </div>
  )
}

function PillToggle({ options, value, onChange }) {
  return (
    <div className="inline-flex rounded-full border border-ink/15 overflow-hidden text-sm font-dm-sans">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2 font-medium transition-colors ${
            value === opt.value ? 'bg-forest text-cream' : 'text-ink-subtle hover:text-ink'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function CheckboxGroup({ options, selected, onChange }) {
  const toggle = (opt) =>
    onChange(selected.includes(opt) ? selected.filter((x) => x !== opt) : [...selected, opt])
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {options.map((opt) => (
        <label
          key={opt}
          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
            selected.includes(opt)
              ? 'border-forest bg-forest/8 text-forest'
              : 'border-ink/10 hover:border-ink/20 text-ink'
          }`}
        >
          <input
            type="checkbox"
            checked={selected.includes(opt)}
            onChange={() => toggle(opt)}
            className="accent-forest"
          />
          <span className="text-sm font-medium font-dm-sans">{opt}</span>
        </label>
      ))}
    </div>
  )
}

const slideVariants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 30 : -30 }),
  center: { opacity: 1, x: 0 },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -20 : 20 }),
}

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
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

  const canAdvance = () => {
    if (step === 0) return form.household_size >= 1
    if (step === 3) return form.budget !== '' && Number(form.budget) > 0
    if (step === 6) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    if (step === 7) return form.openai_api_key.trim().length > 0
    return true
  }

  const handleNext = () => { setDir(1); setStep((s) => s + 1) }
  const handleBack = () => { setDir(-1); setStep((s) => s - 1) }

  const buildBioPayload = () => {
    const bio = {}
    if (form.age !== '' && Number(form.age) >= 16 && Number(form.age) <= 99) {
      bio.age = Number(form.age)
    }
    if (form.sex) bio.sex = form.sex
    if (form.height_unit === 'imperial') {
      const ft = parseInt(form.height_ft, 10)
      const inches = parseInt(form.height_in, 10) || 0
      if (!isNaN(ft) && ft > 0) bio.height_cm = Math.round((ft * 12 + inches) * 2.54)
    } else {
      const cm = parseInt(form.height_cm_input, 10)
      if (!isNaN(cm) && cm >= 50 && cm <= 300) bio.height_cm = cm
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
          ...buildBioPayload(),
        }),
      })
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}))
        throw new Error(detail?.detail ?? `Server error ${res.status}`)
      }
      const data = await res.json()
      localStorage.setItem('user_id', data.id)
      localStorage.setItem('email', data.email ?? form.email.trim())
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative bg-cream">
      {/* Decorative blurred background */}
      <div className="fixed inset-0 pointer-events-none select-none z-0">
        <img
          src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover opacity-20 blur-sm scale-105"
        />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-6 py-12 min-h-[calc(100vh-73px)] flex flex-col">
        <ProgressBar current={step} total={STEPS.length} />

        <div className="flex-1">
          <AnimatePresence mode="wait" custom={dir}>
            <MotionDiv
              key={step}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <h1 className="font-fraunces text-[40px] leading-tight text-ink mb-8">
                {STEPS[step].headline}
              </h1>

              {/* Step 0: Household size */}
              {step === 0 && (
                <div className="flex items-center gap-5">
                  <button
                    type="button"
                    onClick={() => set('household_size', Math.max(1, form.household_size - 1))}
                    className="w-12 h-12 rounded-full border border-ink/15 text-xl font-semibold text-ink hover:bg-ink/5 transition-colors"
                  >
                    −
                  </button>
                  <span className="font-fraunces text-[64px] text-forest w-16 text-center leading-none">
                    {form.household_size}
                  </span>
                  <button
                    type="button"
                    onClick={() => set('household_size', Math.min(20, form.household_size + 1))}
                    className="w-12 h-12 rounded-full border border-ink/15 text-xl font-semibold text-ink hover:bg-ink/5 transition-colors"
                  >
                    +
                  </button>
                  <span className="text-ink-subtle text-base font-dm-sans ml-1">
                    {form.household_size === 1 ? 'person' : 'people'}
                  </span>
                </div>
              )}

              {/* Step 1: Dietary preferences */}
              {step === 1 && (
                <div>
                  <p className="text-ink-subtle text-sm font-dm-sans mb-6">
                    Select all that apply — skip if none fit.
                  </p>
                  <CheckboxGroup
                    options={DIETARY_OPTIONS}
                    selected={form.dietary_prefs}
                    onChange={(v) => set('dietary_prefs', v)}
                  />
                </div>
              )}

              {/* Step 2: Allergies */}
              {step === 2 && (
                <div>
                  <p className="text-ink-subtle text-sm font-dm-sans mb-6">
                    Select any foods you need to avoid.
                  </p>
                  <CheckboxGroup
                    options={ALLERGY_OPTIONS}
                    selected={form.allergies}
                    onChange={(v) => set('allergies', v)}
                  />
                </div>
              )}

              {/* Step 3: Budget + Cook time */}
              {step === 3 && (
                <div>
                  <div className="mb-8">
                    <label className="block font-dm-sans text-sm font-medium text-ink-subtle mb-3">
                      Weekly grocery budget
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-subtle font-semibold font-dm-sans">
                        $
                      </span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="150"
                        value={form.budget}
                        onChange={(e) => set('budget', e.target.value)}
                        className="w-full border border-ink/10 rounded-2xl bg-transparent pl-9 pr-4 py-3.5 text-lg font-medium text-ink focus:outline-none focus:ring-2 focus:ring-forest/50 focus:border-forest transition-shadow"
                      />
                    </div>
                    <p className="text-ink-subtle text-xs font-dm-sans mt-1.5">USD per week</p>
                  </div>

                  <div>
                    <label className="block font-dm-sans text-sm font-medium text-ink-subtle mb-3">
                      Max cook time per meal
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {COOK_TIME_OPTIONS.map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => set('cook_time_minutes', value)}
                          className={`px-4 py-2.5 rounded-full border text-sm font-medium font-dm-sans transition-colors ${
                            form.cook_time_minutes === value
                              ? 'border-forest bg-forest text-cream'
                              : 'border-ink/15 text-ink-subtle hover:border-ink/30'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Bio data */}
              {step === 4 && (
                <div className="space-y-6">
                  {/* Age */}
                  <div>
                    <label className="block font-dm-sans text-sm font-medium text-ink-subtle mb-3">Age</label>
                    <input
                      type="number"
                      min="16"
                      max="99"
                      placeholder="30"
                      value={form.age}
                      onChange={(e) => set('age', e.target.value)}
                      className="w-28 text-center font-fraunces text-[48px] bg-transparent border-b-2 border-ink/15 focus:border-forest outline-none pb-1 text-ink leading-none"
                    />
                  </div>

                  {/* Sex */}
                  <div>
                    <label className="block font-dm-sans text-sm font-medium text-ink-subtle mb-3">
                      Biological sex{' '}
                      <span className="font-normal text-ink-subtle/60">(for calorie calculation)</span>
                    </label>
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
                          className={`px-5 py-2.5 rounded-full border text-sm font-medium font-dm-sans transition-colors ${
                            form.sex === value
                              ? 'border-forest bg-forest text-cream'
                              : 'border-ink/15 text-ink-subtle hover:border-ink/30'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Height */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="font-dm-sans text-sm font-medium text-ink-subtle">Height</label>
                      <PillToggle
                        options={[
                          { value: 'imperial', label: 'ft / in' },
                          { value: 'metric', label: 'cm' },
                        ]}
                        value={form.height_unit}
                        onChange={(v) => set('height_unit', v)}
                      />
                    </div>
                    {form.height_unit === 'imperial' ? (
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <input
                            type="number"
                            min="1"
                            max="8"
                            placeholder="5"
                            value={form.height_ft}
                            onChange={(e) => set('height_ft', e.target.value)}
                            className="w-full border border-ink/10 rounded-2xl bg-transparent px-4 py-3 pr-10 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest/50 focus:border-forest transition-shadow"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle text-sm font-dm-sans">ft</span>
                        </div>
                        <div className="relative flex-1">
                          <input
                            type="number"
                            min="0"
                            max="11"
                            placeholder="10"
                            value={form.height_in}
                            onChange={(e) => set('height_in', e.target.value)}
                            className="w-full border border-ink/10 rounded-2xl bg-transparent px-4 py-3 pr-10 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest/50 focus:border-forest transition-shadow"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle text-sm font-dm-sans">in</span>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="number"
                          min="50"
                          max="300"
                          placeholder="178"
                          value={form.height_cm_input}
                          onChange={(e) => set('height_cm_input', e.target.value)}
                          className="w-full border border-ink/10 rounded-2xl bg-transparent px-4 py-3 pr-12 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest/50 focus:border-forest transition-shadow"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle text-sm font-dm-sans">cm</span>
                      </div>
                    )}
                  </div>

                  {/* Weight */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="font-dm-sans text-sm font-medium text-ink-subtle">Weight</label>
                      <PillToggle
                        options={[
                          { value: 'lbs', label: 'lbs' },
                          { value: 'kg', label: 'kg' },
                        ]}
                        value={form.weight_unit}
                        onChange={(v) => set('weight_unit', v)}
                      />
                    </div>
                    <input
                      type="number"
                      min="1"
                      step="0.1"
                      placeholder={form.weight_unit === 'lbs' ? '160' : '73'}
                      value={form.weight}
                      onChange={(e) => set('weight', e.target.value)}
                      className="w-full border border-ink/10 rounded-2xl bg-transparent px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest/50 focus:border-forest transition-shadow"
                    />
                  </div>

                  {/* Activity level */}
                  <div>
                    <label className="block font-dm-sans text-sm font-medium text-ink-subtle mb-3">Activity level</label>
                    <div className="space-y-2">
                      {ACTIVITY_OPTIONS.map(({ value, icon, label, description }) => {
                        const active = form.activity_level === value
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => set('activity_level', active ? '' : value)}
                            className={`w-full text-left flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-colors ${
                              active
                                ? 'bg-forest border-forest text-cream'
                                : 'border-ink/10 hover:border-ink/20'
                            }`}
                          >
                            <span className="text-2xl">{icon}</span>
                            <div>
                              <div className={`text-sm font-semibold font-dm-sans ${active ? 'text-cream' : 'text-ink'}`}>
                                {label}
                              </div>
                              <div className={`text-xs font-dm-sans ${active ? 'text-cream/70' : 'text-ink-subtle'}`}>
                                {description}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Fitness goal cards */}
              {step === 5 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {GOAL_OPTIONS.map(({ value, label, descriptor, image }) => {
                    const selected = form.fitness_goal === value
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => set('fitness_goal', selected ? '' : value)}
                        className={`relative h-48 rounded-2xl overflow-hidden transition-transform focus:outline-none ${
                          selected ? 'ring-[3px] ring-forest scale-[1.02]' : 'hover:scale-[1.01]'
                        }`}
                      >
                        <img
                          src={image}
                          alt={label}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        {selected && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-forest rounded-full flex items-center justify-center">
                            <span className="text-cream text-xs font-bold">✓</span>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                          <div className="font-fraunces text-2xl text-white leading-tight">{label}</div>
                          <div className="font-dm-sans text-[13px] text-white/80 mt-0.5">{descriptor}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Step 6: Email */}
              {step === 6 && (
                <div>
                  <p className="text-ink-subtle text-sm font-dm-sans mb-6">
                    Used to log back in. We'll never send you spam.
                  </p>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    autoComplete="email"
                    className="w-full border border-ink/10 rounded-2xl bg-transparent px-4 py-3.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest/50 focus:border-forest transition-shadow"
                  />
                </div>
              )}

              {/* Step 7: API key */}
              {step === 7 && (
                <div>
                  <p className="text-ink-subtle text-sm font-dm-sans mb-6">
                    Used to generate personalised meal plans.{' '}
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noreferrer"
                      className="text-forest underline underline-offset-2"
                    >
                      Get your key at openai.com
                    </a>
                    .
                  </p>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      placeholder="sk-..."
                      value={form.openai_api_key}
                      onChange={(e) => set('openai_api_key', e.target.value)}
                      autoComplete="off"
                      spellCheck={false}
                      className="w-full border border-ink/10 rounded-2xl bg-transparent px-4 py-3.5 pr-12 font-mono text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest/50 focus:border-forest transition-shadow"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink transition-colors p-1"
                      aria-label={showKey ? 'Hide key' : 'Show key'}
                    >
                      {showKey ? (
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="text-ink-subtle/60 text-xs font-dm-sans mt-2">
                    Your key is stored encrypted and never leaves your server.
                  </p>
                </div>
              )}
            </MotionDiv>
          </AnimatePresence>
        </div>

        {error && (
          <div className="mt-6 text-sm text-red-700 bg-red-50/80 rounded-2xl px-4 py-3 font-dm-sans">
            {error}
          </div>
        )}

        <div className="mt-8 space-y-3">
          {step > 0 && (
            <button
              type="button"
              onClick={handleBack}
              disabled={submitting}
              className="text-ink-subtle text-sm font-dm-sans hover:text-ink transition-colors"
            >
              ← Back
            </button>
          )}
          <button
            type="button"
            onClick={step < STEPS.length - 1 ? handleNext : handleSubmit}
            disabled={!canAdvance() || submitting}
            className="w-full bg-forest text-cream font-dm-sans text-base font-medium rounded-full py-4 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity hover:bg-forest-dark"
          >
            {step < STEPS.length - 1 ? 'Continue →' : submitting ? 'Saving…' : 'Finish setup'}
          </button>
        </div>
      </div>
    </div>
  )
}
