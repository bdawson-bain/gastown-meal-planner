const MEAL_IMAGES = {
  breakfast: [
    'photo-1533089860892-a7c6f0a88666',
    'photo-1482049016688-2d3e1b311543',
    'photo-1525351484163-7529414344d8',
  ],
  lunch: [
    'photo-1512621776951-a57141f2eefd',
    'photo-1546069901-ba9599a7e63c',
    'photo-1490645935967-10de6ba17061',
  ],
  dinner: [
    'photo-1467003909585-2f8a72700288',
    'photo-1414235077428-338989a2e8c0',
    'photo-1504674900247-0877df9cc836',
  ],
}

export function getMealImage(mealType, mealName) {
  const photos = MEAL_IMAGES[mealType] ?? MEAL_IMAGES.lunch
  const idx = mealName ? mealName.charCodeAt(0) % photos.length : 0
  return `https://images.unsplash.com/${photos[idx]}?auto=format&fit=crop&w=600&q=80`
}
