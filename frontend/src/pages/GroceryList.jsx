import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const GROCERY_ITEMS = [
  // Produce
  { id: 'p1',  category: 'Produce',          name: 'Bananas',                      qty: '3' },
  { id: 'p2',  category: 'Produce',          name: 'Avocados',                     qty: '2' },
  { id: 'p3',  category: 'Produce',          name: 'Broccoli',                     qty: '2 heads' },
  { id: 'p4',  category: 'Produce',          name: 'Baby spinach',                 qty: '5 oz bag' },
  { id: 'p5',  category: 'Produce',          name: 'Mushrooms',                    qty: '8 oz' },
  { id: 'p6',  category: 'Produce',          name: 'Asparagus',                    qty: '1 bunch' },
  { id: 'p7',  category: 'Produce',          name: 'Romaine lettuce',              qty: '1 head' },
  { id: 'p8',  category: 'Produce',          name: 'Mixed salad greens',           qty: '5 oz bag' },
  { id: 'p9',  category: 'Produce',          name: 'Blueberries',                  qty: '1 pint' },
  { id: 'p10', category: 'Produce',          name: 'Mixed berries',                qty: '10 oz' },
  { id: 'p11', category: 'Produce',          name: 'Lemons',                       qty: '3' },
  { id: 'p12', category: 'Produce',          name: 'Ginger root',                  qty: '1 knob' },
  { id: 'p13', category: 'Produce',          name: 'Root vegetables (carrots, parsnips)', qty: '1 lb' },
  { id: 'p14', category: 'Produce',          name: 'Seasonal vegetables (mixed)',   qty: '1 lb' },
  { id: 'p15', category: 'Produce',          name: 'Fresh fruit (for smoothie bowl)', qty: 'assorted' },

  // Proteins
  { id: 'r1',  category: 'Proteins',         name: 'Chicken breast',               qty: '3 lbs' },
  { id: 'r2',  category: 'Proteins',         name: 'Ground turkey',                qty: '2 lbs' },
  { id: 'r3',  category: 'Proteins',         name: 'Salmon fillets',               qty: '3' },
  { id: 'r4',  category: 'Proteins',         name: 'Albacore tuna (canned)',        qty: '2 cans' },
  { id: 'r5',  category: 'Proteins',         name: 'Eggs',                         qty: '1 dozen' },
  { id: 'r6',  category: 'Proteins',         name: 'Shrimp',                       qty: '1 lb' },
  { id: 'r7',  category: 'Proteins',         name: 'Cod fillet',                   qty: '1' },
  { id: 'r8',  category: 'Proteins',         name: 'Flank steak',                  qty: '1 lb' },
  { id: 'r9',  category: 'Proteins',         name: 'Extra-lean ground beef',       qty: '1 lb' },
  { id: 'r10', category: 'Proteins',         name: 'Pork tenderloin',              qty: '1' },
  { id: 'r11', category: 'Proteins',         name: 'Acai packets (frozen)',         qty: '2 packets' },

  // Dairy
  { id: 'd1',  category: 'Dairy',            name: 'Greek yogurt, 2%',             qty: '32 oz' },
  { id: 'd2',  category: 'Dairy',            name: 'Feta cheese',                  qty: '4 oz' },
  { id: 'd3',  category: 'Dairy',            name: 'Heavy cream',                  qty: 'small carton' },

  // Grains & Bread
  { id: 'g1',  category: 'Grains & Bread',   name: 'Steel-cut oats',               qty: '1 lb' },
  { id: 'g2',  category: 'Grains & Bread',   name: 'Rolled oats',                  qty: '1 lb' },
  { id: 'g3',  category: 'Grains & Bread',   name: 'Granola',                      qty: '12 oz bag' },
  { id: 'g4',  category: 'Grains & Bread',   name: 'Whole-wheat penne',            qty: '12 oz box' },
  { id: 'g5',  category: 'Grains & Bread',   name: 'Jasmine rice',                 qty: '2 cups' },
  { id: 'g6',  category: 'Grains & Bread',   name: 'Brown rice',                   qty: '2 cups' },
  { id: 'g7',  category: 'Grains & Bread',   name: 'Quinoa',                       qty: '2 cups' },
  { id: 'g8',  category: 'Grains & Bread',   name: 'Whole-wheat tortillas',        qty: '1 pack' },
  { id: 'g9',  category: 'Grains & Bread',   name: 'Whole-grain bread',            qty: '1 loaf' },
  { id: 'g10', category: 'Grains & Bread',   name: 'Chia seeds',                   qty: '4 oz' },

  // Pantry
  { id: 'n1',  category: 'Pantry',           name: 'Marinara sauce (jarred)',       qty: '24 oz jar' },
  { id: 'n2',  category: 'Pantry',           name: 'Black beans (canned)',          qty: '1 can' },
  { id: 'n3',  category: 'Pantry',           name: 'Bone broth',                   qty: '32 oz' },
  { id: 'n4',  category: 'Pantry',           name: 'Soy sauce',                    qty: 'small bottle' },
  { id: 'n5',  category: 'Pantry',           name: 'Salsa',                        qty: '16 oz jar' },
  { id: 'n6',  category: 'Pantry',           name: 'Olive oil',                    qty: 'as needed' },
  { id: 'n7',  category: 'Pantry',           name: 'Whey protein powder',           qty: '1 container' },
  { id: 'n8',  category: 'Pantry',           name: 'Tikka masala spice blend',     qty: '2 oz' },
  { id: 'n9',  category: 'Pantry',           name: 'Mixed dried herbs',            qty: 'as needed' },
  { id: 'n10', category: 'Pantry',           name: 'Garlic',                       qty: '1 bulb' },
  { id: 'n11', category: 'Pantry',           name: 'Caesar dressing (light)',      qty: '8 oz' },
  { id: 'n12', category: 'Pantry',           name: 'Mustard',                      qty: 'as needed' },
  { id: 'n13', category: 'Pantry',           name: 'Pickles',                      qty: '1 jar' },
  { id: 'n14', category: 'Pantry',           name: 'Edamame (frozen)',              qty: '10 oz' },
]

const CATEGORY_ICONS = {
  'Produce':       '🥦',
  'Proteins':      '🥩',
  'Dairy':         '🥛',
  'Grains & Bread':'🌾',
  'Pantry':        '🫙',
}

const CATEGORY_ORDER = ['Produce', 'Proteins', 'Dairy', 'Grains & Bread', 'Pantry']

function groupByCategory(items) {
  const map = {}
  for (const item of items) {
    if (!map[item.category]) map[item.category] = []
    map[item.category].push(item)
  }
  return CATEGORY_ORDER.map((cat) => ({ category: cat, items: map[cat] ?? [] })).filter((g) => g.items.length > 0)
}

const STORAGE_KEY = 'gastownmeals:grocery-checked'

function loadChecked() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'))
  } catch {
    return new Set()
  }
}

function saveChecked(set) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
  } catch {
    // localStorage unavailable (private browsing, quota exceeded)
  }
}

export default function GroceryList() {
  const [checked, setChecked] = useState(loadChecked)

  useEffect(() => {
    saveChecked(checked)
  }, [checked])

  const toggle = (id) => {
    setChecked((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleCategory = (items) => {
    const allChecked = items.every((i) => checked.has(i.id))
    setChecked((prev) => {
      const next = new Set(prev)
      for (const item of items) {
        allChecked ? next.delete(item.id) : next.add(item.id)
      }
      return next
    })
  }

  const clearAll = () => setChecked(new Set())

  const totalCount = GROCERY_ITEMS.length
  const checkedCount = GROCERY_ITEMS.filter((i) => checked.has(i.id)).length
  const groups = groupByCategory(GROCERY_ITEMS)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6">
      {/* Back link */}
      <Link
        to="/plan"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to meal plan
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 print:mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Grocery List</h1>
          <p className="text-sm text-gray-500 mt-1">Week of Apr 21 – 27, 2026</p>
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

      {/* Progress bar */}
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

      {/* Category groups */}
      <div className="space-y-6">
        {groups.map(({ category, items }) => {
          const catChecked = items.filter((i) => checked.has(i.id)).length
          const allCatChecked = catChecked === items.length

          return (
            <div key={category} className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
              {/* Category header */}
              <button
                onClick={() => toggleCategory(items)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left print:bg-white print:pointer-events-none"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg" aria-hidden="true">{CATEGORY_ICONS[category]}</span>
                  <span className="font-semibold text-gray-900 text-sm">{category}</span>
                  <span className="text-xs text-gray-400 font-medium">
                    {catChecked}/{items.length}
                  </span>
                </div>
                <span className={`text-xs font-medium print:hidden ${allCatChecked ? 'text-green-600' : 'text-gray-400'}`}>
                  {allCatChecked ? 'All gotten' : 'Mark all'}
                </span>
              </button>

              {/* Items */}
              <ul className="divide-y divide-gray-100">
                {items.map((item) => {
                  const isChecked = checked.has(item.id)
                  return (
                    <li key={item.id}>
                      <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors print:hover:bg-white">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggle(item.id)}
                          className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 focus:ring-offset-0 flex-shrink-0 print:hidden"
                        />
                        {/* Print-only checkbox circle */}
                        <span className="hidden print:inline-flex h-4 w-4 rounded border border-gray-400 flex-shrink-0" />
                        <span className={`flex-1 text-sm ${isChecked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                          {item.name}
                        </span>
                        <span className={`text-xs flex-shrink-0 ${isChecked ? 'text-gray-300' : 'text-gray-400'}`}>
                          {item.qty}
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

      {/* Footer */}
      <div className="mt-8 text-center print:hidden">
        <Link
          to="/plan"
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Back to meal plan
        </Link>
      </div>
    </div>
  )
}
