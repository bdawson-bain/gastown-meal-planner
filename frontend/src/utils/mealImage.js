const MEAL_IMAGES = {
  breakfast: [
    'photo-1484723091739-30a097e8f929',
    'photo-1533089860892-a7c6f0a88666',
    'photo-1528735602780-2552fd46c7af',
    'photo-1565299624946-b28f40a0ae38',
  ],
  lunch: [
    'photo-1512621776951-a57141f2eefd',
    'photo-1546069901-ba9599a7e63c',
    'photo-1555939594-58d7cb561ad1',
    'photo-1504674900247-0877df9cc836',
  ],
  dinner: [
    'photo-1467003909585-2f8a72700288',
    'photo-1414235077428-338989a2e8c0',
    'photo-1476224203421-9ac39bcb3327',
    'photo-1485963631004-f2f00b1d6606',
  ],
}

export function getMealImage(mealType, mealName, w = 600) {
  const photos = MEAL_IMAGES[mealType] ?? MEAL_IMAGES.dinner
  const hash = mealName ? [...mealName].reduce((a, c) => a + c.charCodeAt(0), 0) : 0
  const h = Math.round(w * 0.75)
  return `https://images.unsplash.com/${photos[hash % photos.length]}?w=${w}&h=${h}&fit=crop&q=80`
}
