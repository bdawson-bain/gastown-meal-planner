export default function GroceryList() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">Grocery List</h1>
      <p className="text-gray-500 mb-12">Everything you need for the week, in one place.</p>
      <div className="flex flex-col items-center justify-center py-24 rounded-2xl border-2 border-dashed border-gray-200 text-center">
        <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-5 text-3xl">
          🛒
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No grocery list yet</h2>
        <p className="text-gray-500 text-sm max-w-xs">
          Your grocery list will appear here once your meal plan has been generated.
        </p>
      </div>
    </div>
  )
}
