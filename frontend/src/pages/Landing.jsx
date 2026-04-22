import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const MotionDiv = motion.div
const MotionH1 = motion.h1
const MotionH2 = motion.h2
const MotionP = motion.p

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
}

const STEPS = [
  {
    n: '01',
    title: 'Tell us about you',
    desc: 'Height, weight, activity level, and your goal — cut, bulk, or maintain.',
  },
  {
    n: '02',
    title: 'Get your plan',
    desc: 'AI generates 7 days of meals with full macros in under a minute.',
  },
  {
    n: '03',
    title: 'Shop smart',
    desc: 'A consolidated grocery list, sorted by aisle, ready to go.',
  },
]

const FEATURES = [
  {
    title: 'Macro-aware meals',
    desc: 'Every meal comes with precise protein, carbs, and fat targets.',
  },
  {
    title: 'Swap any meal in one click',
    desc: "Don't like dinner? Regenerate a single meal without touching the rest.",
  },
  {
    title: 'Grocery list by category',
    desc: 'Ingredients grouped by aisle — produce, proteins, pantry — for fast shopping.',
  },
  {
    title: 'Bring your own OpenAI key',
    desc: 'Your API key, your data. We never store it after the session ends.',
  },
]

const STRIP_PHOTOS = [
  '1490645935967-10de6ba17061',
  '1512621776951-a57141f2eefd',
  '1571019613454-1cb2f99b2d8b',
  '1484723091739-30a097e8f929',
]

export default function Landing() {
  const navigate = useNavigate()

  useEffect(() => {
    if (localStorage.getItem('user_id')) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

  return (
    <div>
      {/* Hero */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1800&q=75)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center gap-6">
          <MotionH1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: 'easeOut' }}
            className="font-display font-semibold leading-tight"
            style={{ fontSize: 'clamp(3rem, 8vw, 5.5rem)', color: '#FAF9F6' }}
          >
            Eat to your goals.<br />Every week.
          </MotionH1>

          <MotionP
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.2, ease: 'easeOut' }}
            className="text-xl sm:text-2xl max-w-xl leading-relaxed"
            style={{ color: 'rgba(250,249,246,0.82)' }}
          >
            AI-generated meal plans calibrated to your body — delivered in under 60 seconds.
          </MotionP>

          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.4, ease: 'easeOut' }}
          >
            <Link
              to="/onboarding"
              className="inline-flex items-center gap-2 font-semibold text-lg px-10 py-4 rounded-full transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
              style={{ backgroundColor: '#D4A853', color: '#1B4332' }}
            >
              Build my plan — free
            </Link>
          </MotionDiv>
        </div>

        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.6 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10"
        >
          <MotionDiv
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
            style={{ color: 'rgba(250,249,246,0.55)' }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </MotionDiv>
        </MotionDiv>
      </section>

      {/* How it works */}
      <section className="py-28 px-6" style={{ backgroundColor: '#FAF9F6' }}>
        <div className="max-w-5xl mx-auto">
          <MotionH2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="font-display font-semibold text-center"
            style={{ fontSize: 'clamp(2.25rem, 4vw, 3.25rem)', color: '#1B4332' }}
          >
            Three steps to eating right
          </MotionH2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-16">
            {STEPS.map((step, i) => (
              <MotionDiv
                key={step.n}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.15, ease: 'easeOut' }}
                className="flex flex-col gap-4"
              >
                <span
                  className="font-display font-bold leading-none"
                  style={{ fontSize: '5rem', color: '#D4A853' }}
                >
                  {step.n}
                </span>
                <h3 className="font-display font-semibold text-xl" style={{ color: '#1B4332' }}>
                  {step.title}
                </h3>
                <p className="text-base leading-relaxed" style={{ color: '#4A4A4A' }}>
                  {step.desc}
                </p>
              </MotionDiv>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-28 px-6" style={{ backgroundColor: '#1B4332' }}>
        <div className="max-w-5xl mx-auto">
          <MotionH2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="font-display font-semibold text-center mb-16"
            style={{ fontSize: 'clamp(2.25rem, 4vw, 3.25rem)', color: '#FAF9F6' }}
          >
            Everything you need.<br />Nothing you don't.
          </MotionH2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feat, i) => (
              <MotionDiv
                key={feat.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: 'easeOut' }}
                className="flex flex-col gap-4 p-6 rounded-2xl"
                style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: '#D4A853' }}
                />
                <h3
                  className="font-display font-semibold text-lg leading-snug"
                  style={{ color: '#FAF9F6' }}
                >
                  {feat.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(250,249,246,0.65)' }}>
                  {feat.desc}
                </p>
              </MotionDiv>
            ))}
          </div>
        </div>
      </section>

      {/* Photo strip */}
      <div className="flex h-64 sm:h-80 lg:h-96">
        {STRIP_PHOTOS.map((id) => (
          <div
            key={id}
            className="flex-1 bg-cover bg-center"
            style={{
              backgroundImage: `url(https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&q=80)`,
            }}
          />
        ))}
      </div>

      {/* Final CTA */}
      <section className="py-28 px-6 text-center" style={{ backgroundColor: '#FAF9F6' }}>
        <MotionDiv
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="max-w-lg mx-auto flex flex-col items-center gap-8"
        >
          <h2
            className="font-display font-semibold leading-tight"
            style={{ fontSize: 'clamp(2.75rem, 5vw, 4rem)', color: '#1B4332' }}
          >
            Ready to eat well?
          </h2>
          <Link
            to="/onboarding"
            className="inline-flex items-center gap-2 font-semibold text-lg px-10 py-4 rounded-full transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
            style={{ backgroundColor: '#D4A853', color: '#1B4332' }}
          >
            Get started — it's free
          </Link>
          <p className="text-sm" style={{ color: '#8A8A8A' }}>
            Takes 2 minutes. Bring your own OpenAI key.
          </p>
        </MotionDiv>
      </section>
    </div>
  )
}
