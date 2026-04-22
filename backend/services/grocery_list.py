"""
Grocery list service: aggregates ingredients from all meals in a plan,
consolidates duplicates, and sorts by grocery category.

Returns items in the grocery_lists DB schema JSONB structure.
"""
from __future__ import annotations

from collections import defaultdict
from typing import Any


# ---------------------------------------------------------------------------
# Category configuration
# ---------------------------------------------------------------------------

CATEGORY_ORDER = ["proteins", "produce", "dairy_refrigerated", "pantry_dry"]

# (category, keywords) checked in order; first substring match wins.
# More specific strings appear before less specific ones within each list.
_CATEGORY_KEYWORDS: list[tuple[str, list[str]]] = [
    ("proteins", [
        "ground beef", "ground turkey", "ground pork", "ground chicken",
        "chicken", "turkey", "beef", "pork", "lamb", "bison", "venison",
        "salmon", "tuna", "cod", "tilapia", "shrimp", "crab", "lobster",
        "scallop", "sardine", "anchovy", "halibut", "mahi",
        "egg",
        "tofu", "tempeh", "edamame", "seitan",
        "whey", "protein powder", "casein",
        "greek yogurt", "cottage cheese",
        "lentil", "chickpea", "black bean", "kidney bean",
        "white bean", "cannellini", "navy bean", "pinto bean",
        "duck", "steak", "fillet", "filet",
    ]),
    ("produce", [
        "broccoli", "spinach", "kale", "lettuce", "arugula", "cabbage",
        "chard", "collard",
        "carrot", "celery", "cucumber", "zucchini", "squash", "pumpkin",
        "tomato", "bell pepper", "pepper", "onion", "garlic", "ginger",
        "shallot", "leek", "scallion", "green onion",
        "mushroom",
        "avocado", "banana", "apple", "orange", "lemon", "lime",
        "berry", "strawberr", "blueberr", "raspberr", "blackberr",
        "grape", "mango", "pineapple", "watermelon", "cantaloupe", "peach",
        "sweet potato", "potato", "yam",
        "beet", "asparagus", "green bean", "snap pea", "snow pea",
        "corn", "cauliflower", "brussels sprout", "artichoke",
        "eggplant", "radish", "turnip", "parsnip", "fennel",
        "cilantro", "parsley", "basil", "mint", "dill",
        "thyme", "rosemary", "chive", "sage",
    ]),
    ("dairy_refrigerated", [
        "almond milk", "oat milk", "soy milk", "rice milk",
        "milk", "half and half", "heavy cream", "whipping cream", "cream",
        "butter", "ghee",
        "cheddar", "mozzarella", "parmesan", "feta", "ricotta",
        "cream cheese", "sour cream", "cheese",
        "yogurt", "kefir",
    ]),
]

_DEFAULT_CATEGORY = "pantry_dry"


def _classify(ingredient_name: str) -> str:
    """Return the grocery category for an ingredient name."""
    name_lower = ingredient_name.lower()
    for category, keywords in _CATEGORY_KEYWORDS:
        if any(kw in name_lower for kw in keywords):
            return category
    return _DEFAULT_CATEGORY


# ---------------------------------------------------------------------------
# Core logic
# ---------------------------------------------------------------------------


def build_grocery_list(
    meals: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """
    Aggregate ingredients from all meals, consolidate duplicates, sort by category.

    Args:
        meals: List of meal dicts each containing an 'ingredients_json' key with
               a list of {name, quantity, unit} objects. Missing or null
               ingredients_json values are silently skipped.

    Returns:
        The grocery_lists.items JSONB structure — a list of category groups in
        CATEGORY_ORDER order (empty categories omitted), each containing:
            {"category": str, "items": [{"name", "quantity", "unit", "checked"}, ...]}
        Items within each category are sorted alphabetically by name.
        Ingredients with the same normalized name and unit have their quantities summed;
        same ingredient with different units remain as separate line items.
    """
    # Key: (name.lower(), unit.lower()) → {name, quantity, unit}
    consolidated: dict[tuple[str, str], dict[str, Any]] = {}

    for meal in meals:
        ingredients = meal.get("ingredients_json") or []
        if not isinstance(ingredients, list):
            continue
        for ing in ingredients:
            if not isinstance(ing, dict):
                continue
            name = str(ing.get("name") or "").strip()
            unit = str(ing.get("unit") or "").strip()
            qty_raw = ing.get("quantity")
            if not name or qty_raw is None:
                continue
            try:
                qty = float(qty_raw)
            except (TypeError, ValueError):
                continue

            key = (name.lower(), unit.lower())
            if key in consolidated:
                consolidated[key]["quantity"] += qty
            else:
                consolidated[key] = {"name": name, "quantity": qty, "unit": unit}

    by_category: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for item in consolidated.values():
        category = _classify(item["name"])
        by_category[category].append({
            "name": item["name"],
            "quantity": round(item["quantity"], 3),
            "unit": item["unit"],
            "checked": False,
        })

    for items in by_category.values():
        items.sort(key=lambda x: x["name"].lower())

    return [
        {"category": cat, "items": by_category[cat]}
        for cat in CATEGORY_ORDER
        if by_category.get(cat)
    ]
