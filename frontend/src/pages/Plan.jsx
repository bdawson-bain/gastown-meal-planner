import { useState } from 'react'
import { Link } from 'react-router-dom'

const DAYS = [
  { label: 'Mon', date: 'Apr 21' },
  { label: 'Tue', date: 'Apr 22' },
  { label: 'Wed', date: 'Apr 23' },
  { label: 'Thu', date: 'Apr 24' },
  { label: 'Fri', date: 'Apr 25' },
  { label: 'Sat', date: 'Apr 26' },
  { label: 'Sun', date: 'Apr 27' },
]

const SLOT_TYPES = ['breakfast', 'lunch', 'dinner']
const SLOT_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' }

const MOCK_PLAN = {
  0: {
    breakfast: { name: 'Protein Oatmeal', description: 'Steel-cut oats with whey protein and sliced banana' },
    lunch: { name: 'Chicken Rice Bowl', description: 'Grilled chicken breast over jasmine rice with steamed broccoli' },
    dinner: { name: 'Ground Turkey Pasta', description: 'Whole-wheat penne with lean turkey in marinara sauce' },
  },
  1: {
    breakfast: { name: 'Greek Yogurt Parfait', description: 'Thick 2% Greek yogurt layered with granola and mixed berries' },
    lunch: { name: 'Tuna Avocado Wrap', description: 'Albacore tuna with avocado in a whole-wheat tortilla' },
    dinner: { name: 'Baked Salmon & Sweet Potato', description: 'Herb-seasoned salmon fillet with roasted sweet potato' },
  },
  2: {
    breakfast: { name: 'Egg White Omelette', description: 'Three-egg white omelette with spinach, mushroom, and feta' },
    lunch: { name: 'Chicken Caesar Salad', description: 'Grilled chicken over romaine with light Caesar dressing' },
    dinner: { name: 'Beef & Broccoli Stir-Fry', description: 'Lean flank steak with broccoli in a savory ginger-soy sauce' },
  },
  3: {
    breakfast: { name: 'Protein Pancakes', description: 'High-protein banana pancakes with a Greek yogurt drizzle' },
    lunch: { name: 'Turkey Quinoa Bowl', description: 'Seasoned ground turkey with quinoa, black beans, and salsa' },
    dinner: { name: 'Baked Cod & Asparagus', description: 'Herb-crusted cod fillet with lemon-roasted asparagus' },
  },
  4: {
    breakfast: { name: 'Overnight Oats', description: 'Rolled oats soaked overnight with chia seeds and blueberries' },
    lunch: { name: 'Shrimp Brown Rice Bowl', description: 'Garlic-sautéed shrimp over fiber-rich brown rice with edamame' },
    dinner: { name: 'Chicken Tikka Masala', description: 'Lean chicken breast in a light tomato-cream curry sauce' },
  },
  5: {
    breakfast: { name: 'Avocado Egg Toast', description: 'Whole-grain toast topped with mashed avocado and two poached eggs' },
    lunch: { name: 'Lean Beef Burger Bowl', description: 'Extra-lean beef patty over mixed greens with pickles and mustard' },
    dinner: { name: 'Pork Tenderloin & Veggies', description: 'Herb-marinated pork tenderloin with roasted seasonal vegetables' },
  },
  6: {
    breakfast: { name: 'Smoothie Bowl', description: 'Blended acai with protein powder, topped with granola and sliced fruit' },
    lunch: { name: 'Chicken Vegetable Soup', description: 'Hearty bone-broth soup with shredded chicken and root vegetables' },
    dinner: { name: 'Grilled Salmon & Quinoa', description: 'Atlantic salmon fillet with herb quinoa and lemon-dill sauce' },
  },
}

function MealCard({ meal }) {
  if (!meal) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 p-3 h-full flex items-center justify-center">
        <span className="text-xs text-gray-300">—</span>
      </div>
    )
  }
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-3 h-full shadow-sm">
      <p className="text-sm font-medium text-gray-900 leading-snug">{meal.name}</p>
      <p className="mt-1 text-xs text-gray-500 line-clamp-2">{meal.description}</p>
    </div>
  )
}

export default function Plan() {
  const [generating, setGenerating] = useState(false)

  const handleGenerate = () => {
    setGenerating(true)
    // TODO: POST /api/plans/current/generate once backend is ready
    setTimeout(() => setGenerating(false), 1500)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meal Plan</h1>
          <p className="text-gray-500 text-sm mt-1">Week of Apr 21 – 27, 2026</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            to="/grocery-list"
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Grocery list
          </Link>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {generating ? 'Generating…' : 'Generate new plan'}
          </button>
        </div>
      </div>

      {/* Mobile view — vertical day list */}
      <div className="space-y-6 lg:hidden">
        {DAYS.map(({ label, date }, dayIdx) => (
          <div key={dayIdx}>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-base font-semibold text-gray-900">{label}</span>
              <span className="text-xs text-gray-400">{date}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {SLOT_TYPES.map((slot) => (
                <div key={slot}>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                    {SLOT_LABELS[slot]}
                  </p>
                  <MealCard meal={MOCK_PLAN[dayIdx]?.[slot] ?? null} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop view — 7-column grid */}
      <div className="hidden lg:block overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Day headers */}
          <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-2 mb-2">
            <div />
            {DAYS.map(({ label, date }, i) => (
              <div key={i} className="text-center">
                <p className="text-sm font-semibold text-gray-900">{label}</p>
                <p className="text-xs text-gray-400">{date}</p>
              </div>
            ))}
          </div>

          {/* Meal rows */}
          {SLOT_TYPES.map((slot) => (
            <div key={slot} className="grid grid-cols-[80px_repeat(7,1fr)] gap-2 mb-2">
              <div className="flex items-start pt-3">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  {SLOT_LABELS[slot]}
                </span>
              </div>
              {DAYS.map((_, dayIdx) => (
                <MealCard key={dayIdx} meal={MOCK_PLAN[dayIdx]?.[slot] ?? null} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
