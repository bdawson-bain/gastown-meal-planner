"""
Unit tests for grocery list helpers and endpoints (GET + POST regenerate).

DB and SQLAlchemy are mocked so no database connection is required.
"""
from __future__ import annotations

import sys
import unittest
import uuid
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

# ── Stub heavy dependencies before importing the module under test ──────────
sys.modules.setdefault("openai", MagicMock())
# Stub app.* and services.* modules
for mod in [
    "app", "app.database", "app.models", "app.models.grocery_list",
    "app.models.meal", "app.models.meal_feedback", "app.models.meal_plan",
    "app.models.user",
    "services", "services.meal_generation",
]:
    sys.modules.setdefault(mod, MagicMock())

# Provide real GroceryList class for isinstance checks
import app.models.grocery_list as _gl_mod  # noqa: E402

class _GroceryList:
    def __init__(self, *, meal_plan_id, items_json):
        self.id = uuid.uuid4()
        self.meal_plan_id = meal_plan_id
        self.items_json = items_json

_gl_mod.GroceryList = _GroceryList

from routers.meal_plans import (  # noqa: E402
    GroceryItem,
    GroceryListOut,
    _categorise,
    _consolidate_ingredients,
    _grocery_list_to_out,
)


# ---------------------------------------------------------------------------
# _categorise
# ---------------------------------------------------------------------------

class TestCategorise(unittest.TestCase):
    def test_produce(self):
        self.assertEqual(_categorise("garlic cloves"), "produce")
        self.assertEqual(_categorise("Cherry Tomatoes"), "produce")

    def test_protein(self):
        self.assertEqual(_categorise("chicken breast"), "protein")
        self.assertEqual(_categorise("large eggs"), "protein")

    def test_dairy(self):
        self.assertEqual(_categorise("whole milk"), "dairy")
        self.assertEqual(_categorise("shredded cheddar"), "dairy")

    def test_grains(self):
        self.assertEqual(_categorise("brown rice"), "grains")
        self.assertEqual(_categorise("whole wheat flour"), "grains")

    def test_pantry(self):
        self.assertEqual(_categorise("olive oil"), "pantry")
        self.assertEqual(_categorise("soy sauce"), "pantry")

    def test_other(self):
        self.assertEqual(_categorise("xylitol"), "other")


# ---------------------------------------------------------------------------
# _consolidate_ingredients
# ---------------------------------------------------------------------------

def _meal(ingredients: list[dict]) -> object:
    m = SimpleNamespace()
    m.ingredients_json = ingredients
    return m


class TestConsolidateIngredients(unittest.TestCase):
    def test_empty_meals(self):
        result = _consolidate_ingredients([])
        self.assertEqual(result, [])

    def test_single_meal_single_ingredient(self):
        result = _consolidate_ingredients([_meal([{"name": "oats", "quantity": 80, "unit": "g"}])])
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["name"], "oats")
        self.assertAlmostEqual(result[0]["quantity"], 80.0)
        self.assertEqual(result[0]["unit"], "g")

    def test_sums_same_ingredient_across_meals(self):
        meals = [
            _meal([{"name": "garlic", "quantity": 2, "unit": "cloves"}]),
            _meal([{"name": "garlic", "quantity": 3, "unit": "cloves"}]),
        ]
        result = _consolidate_ingredients(meals)
        self.assertEqual(len(result), 1)
        self.assertAlmostEqual(result[0]["quantity"], 5.0)

    def test_different_units_not_merged(self):
        meals = [
            _meal([{"name": "milk", "quantity": 200, "unit": "ml"}]),
            _meal([{"name": "milk", "quantity": 1, "unit": "cup"}]),
        ]
        result = _consolidate_ingredients(meals)
        self.assertEqual(len(result), 2)

    def test_case_insensitive_name_matching(self):
        meals = [
            _meal([{"name": "Garlic", "quantity": 2, "unit": "cloves"}]),
            _meal([{"name": "garlic", "quantity": 1, "unit": "cloves"}]),
        ]
        result = _consolidate_ingredients(meals)
        self.assertEqual(len(result), 1)
        self.assertAlmostEqual(result[0]["quantity"], 3.0)

    def test_category_assigned(self):
        result = _consolidate_ingredients([_meal([{"name": "spinach", "quantity": 100, "unit": "g"}])])
        self.assertEqual(result[0]["category"], "produce")

    def test_meal_with_none_ingredients_skipped(self):
        meals = [
            _meal(None),
            _meal([{"name": "salt", "quantity": 1, "unit": "tsp"}]),
        ]
        result = _consolidate_ingredients(meals)
        self.assertEqual(len(result), 1)


# ---------------------------------------------------------------------------
# _grocery_list_to_out
# ---------------------------------------------------------------------------

class TestGroceryListToOut(unittest.TestCase):
    def test_converts_items(self):
        gl = _GroceryList(
            meal_plan_id=uuid.uuid4(),
            items_json=[
                {"name": "oats", "quantity": 80.0, "unit": "g", "category": "grains"}
            ],
        )
        out = _grocery_list_to_out(gl)
        self.assertIsInstance(out, GroceryListOut)
        self.assertEqual(len(out.items), 1)
        self.assertIsInstance(out.items[0], GroceryItem)
        self.assertEqual(out.items[0].name, "oats")
        self.assertEqual(out.items[0].category, "grains")

    def test_empty_items_json(self):
        gl = _GroceryList(meal_plan_id=uuid.uuid4(), items_json=None)
        out = _grocery_list_to_out(gl)
        self.assertEqual(out.items, [])


if __name__ == "__main__":
    unittest.main()
