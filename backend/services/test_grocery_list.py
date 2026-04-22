"""
Unit tests for grocery_list service.
"""
from __future__ import annotations

import unittest
from typing import Any

from grocery_list import CATEGORY_ORDER, _classify, build_grocery_list


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _ing(name: str, quantity: float, unit: str) -> dict[str, Any]:
    return {"name": name, "quantity": quantity, "unit": unit}


def _meal(*ingredients: dict[str, Any]) -> dict[str, Any]:
    return {"ingredients_json": list(ingredients)}


def _items_in(result: list[dict], category: str) -> list[dict]:
    group = next((g for g in result if g["category"] == category), None)
    return group["items"] if group else []


# ---------------------------------------------------------------------------
# _classify
# ---------------------------------------------------------------------------

class TestClassify(unittest.TestCase):
    def test_chicken_is_protein(self):
        self.assertEqual(_classify("Chicken breast"), "proteins")

    def test_salmon_is_protein(self):
        self.assertEqual(_classify("Salmon fillet"), "proteins")

    def test_eggs_are_protein(self):
        self.assertEqual(_classify("Eggs"), "proteins")

    def test_greek_yogurt_is_protein(self):
        self.assertEqual(_classify("Greek yogurt (2%)"), "proteins")

    def test_tofu_is_protein(self):
        self.assertEqual(_classify("Firm tofu"), "proteins")

    def test_black_beans_are_protein(self):
        self.assertEqual(_classify("Canned black beans"), "proteins")

    def test_lentils_are_protein(self):
        self.assertEqual(_classify("Red lentils"), "proteins")

    def test_broccoli_is_produce(self):
        self.assertEqual(_classify("Broccoli"), "produce")

    def test_spinach_is_produce(self):
        self.assertEqual(_classify("Baby spinach"), "produce")

    def test_lemon_is_produce(self):
        self.assertEqual(_classify("Lemon"), "produce")

    def test_garlic_is_produce(self):
        self.assertEqual(_classify("Garlic cloves"), "produce")

    def test_onion_is_produce(self):
        self.assertEqual(_classify("Yellow onion"), "produce")

    def test_sweet_potato_is_produce(self):
        self.assertEqual(_classify("Sweet potato"), "produce")

    def test_milk_is_dairy(self):
        self.assertEqual(_classify("Whole milk"), "dairy_refrigerated")

    def test_almond_milk_is_dairy(self):
        self.assertEqual(_classify("Almond milk"), "dairy_refrigerated")

    def test_cheese_is_dairy(self):
        self.assertEqual(_classify("Cheddar cheese"), "dairy_refrigerated")

    def test_butter_is_dairy(self):
        self.assertEqual(_classify("Butter"), "dairy_refrigerated")

    def test_sour_cream_is_dairy(self):
        self.assertEqual(_classify("Sour cream"), "dairy_refrigerated")

    def test_rice_is_pantry(self):
        self.assertEqual(_classify("Brown rice"), "pantry_dry")

    def test_oats_are_pantry(self):
        self.assertEqual(_classify("Rolled oats"), "pantry_dry")

    def test_olive_oil_is_pantry(self):
        self.assertEqual(_classify("Olive oil"), "pantry_dry")

    def test_unknown_ingredient_defaults_to_pantry(self):
        self.assertEqual(_classify("xylitol crystals"), "pantry_dry")

    def test_classify_is_case_insensitive(self):
        self.assertEqual(_classify("CHICKEN BREAST"), "proteins")
        self.assertEqual(_classify("BROCCOLI"), "produce")
        self.assertEqual(_classify("BUTTER"), "dairy_refrigerated")
        self.assertEqual(_classify("ROLLED OATS"), "pantry_dry")


# ---------------------------------------------------------------------------
# build_grocery_list — output structure
# ---------------------------------------------------------------------------

class TestBuildGroceryListStructure(unittest.TestCase):
    def test_empty_meals_returns_empty_list(self):
        self.assertEqual(build_grocery_list([]), [])

    def test_returns_list(self):
        result = build_grocery_list([_meal(_ing("Chicken breast", 1.0, "lbs"))])
        self.assertIsInstance(result, list)

    def test_category_group_has_category_key(self):
        result = build_grocery_list([_meal(_ing("Chicken breast", 1.0, "lbs"))])
        self.assertIn("category", result[0])

    def test_category_group_has_items_key(self):
        result = build_grocery_list([_meal(_ing("Chicken breast", 1.0, "lbs"))])
        self.assertIn("items", result[0])

    def test_item_has_name(self):
        result = build_grocery_list([_meal(_ing("Chicken breast", 1.0, "lbs"))])
        self.assertIn("name", result[0]["items"][0])

    def test_item_has_quantity(self):
        result = build_grocery_list([_meal(_ing("Chicken breast", 1.0, "lbs"))])
        self.assertIn("quantity", result[0]["items"][0])

    def test_item_has_unit(self):
        result = build_grocery_list([_meal(_ing("Chicken breast", 1.0, "lbs"))])
        self.assertIn("unit", result[0]["items"][0])

    def test_item_checked_is_false(self):
        result = build_grocery_list([_meal(_ing("Chicken breast", 1.0, "lbs"))])
        self.assertFalse(result[0]["items"][0]["checked"])

    def test_category_values_are_valid(self):
        meals = [
            _meal(
                _ing("Chicken breast", 1.0, "lbs"),
                _ing("Broccoli", 200.0, "g"),
                _ing("Whole milk", 240.0, "ml"),
                _ing("Brown rice", 80.0, "g"),
            )
        ]
        result = build_grocery_list(meals)
        for group in result:
            self.assertIn(group["category"], CATEGORY_ORDER)


# ---------------------------------------------------------------------------
# build_grocery_list — category ordering
# ---------------------------------------------------------------------------

class TestBuildGroceryListCategoryOrder(unittest.TestCase):
    def test_categories_in_canonical_order(self):
        meals = [
            _meal(
                _ing("Rolled oats", 80.0, "g"),
                _ing("Broccoli", 200.0, "g"),
                _ing("Greek yogurt", 150.0, "g"),
                _ing("Almond milk", 240.0, "ml"),
            )
        ]
        result = build_grocery_list(meals)
        cats = [g["category"] for g in result]
        indices = [CATEGORY_ORDER.index(c) for c in cats]
        self.assertEqual(indices, sorted(indices))

    def test_empty_categories_omitted(self):
        result = build_grocery_list([_meal(_ing("Chicken breast", 1.0, "lbs"))])
        cats = [g["category"] for g in result]
        self.assertIn("proteins", cats)
        self.assertNotIn("produce", cats)
        self.assertNotIn("dairy_refrigerated", cats)
        self.assertNotIn("pantry_dry", cats)

    def test_all_four_categories_present_when_populated(self):
        meals = [
            _meal(
                _ing("Chicken breast", 1.0, "lbs"),
                _ing("Broccoli", 200.0, "g"),
                _ing("Whole milk", 240.0, "ml"),
                _ing("Brown rice", 80.0, "g"),
            )
        ]
        result = build_grocery_list(meals)
        cats = [g["category"] for g in result]
        self.assertEqual(set(cats), {"proteins", "produce", "dairy_refrigerated", "pantry_dry"})


# ---------------------------------------------------------------------------
# build_grocery_list — consolidation
# ---------------------------------------------------------------------------

class TestBuildGroceryListConsolidation(unittest.TestCase):
    def test_same_ingredient_same_unit_quantities_summed(self):
        meals = [
            _meal(_ing("Chicken breast", 1.0, "lbs")),
            _meal(_ing("Chicken breast", 0.5, "lbs")),
        ]
        items = _items_in(build_grocery_list(meals), "proteins")
        chicken = next(i for i in items if "chicken" in i["name"].lower())
        self.assertAlmostEqual(chicken["quantity"], 1.5)

    def test_case_insensitive_name_consolidation(self):
        meals = [
            _meal(_ing("Chicken Breast", 1.0, "lbs")),
            _meal(_ing("chicken breast", 0.5, "lbs")),
        ]
        items = _items_in(build_grocery_list(meals), "proteins")
        chicken_items = [i for i in items if "chicken" in i["name"].lower()]
        self.assertEqual(len(chicken_items), 1)
        self.assertAlmostEqual(chicken_items[0]["quantity"], 1.5)

    def test_display_name_preserved_from_first_occurrence(self):
        meals = [
            _meal(_ing("Chicken Breast", 1.0, "lbs")),
            _meal(_ing("chicken breast", 0.5, "lbs")),
        ]
        items = _items_in(build_grocery_list(meals), "proteins")
        chicken = next(i for i in items if "chicken" in i["name"].lower())
        self.assertEqual(chicken["name"], "Chicken Breast")

    def test_same_ingredient_different_units_kept_separate(self):
        meals = [
            _meal(_ing("Chicken breast", 1.0, "lbs")),
            _meal(_ing("Chicken breast", 400.0, "g")),
        ]
        items = _items_in(build_grocery_list(meals), "proteins")
        chicken_items = [i for i in items if "chicken" in i["name"].lower()]
        self.assertEqual(len(chicken_items), 2)

    def test_unit_matching_is_case_insensitive(self):
        meals = [
            _meal(_ing("Brown rice", 80.0, "G")),
            _meal(_ing("Brown rice", 80.0, "g")),
        ]
        items = _items_in(build_grocery_list(meals), "pantry_dry")
        rice_items = [i for i in items if "rice" in i["name"].lower()]
        self.assertEqual(len(rice_items), 1)
        self.assertAlmostEqual(rice_items[0]["quantity"], 160.0)

    def test_aggregates_across_multiple_meals(self):
        meals = [
            _meal(_ing("Chicken breast", 0.3, "lbs"), _ing("Broccoli", 100.0, "g")),
            _meal(_ing("Chicken breast", 0.3, "lbs"), _ing("Brown rice", 60.0, "g")),
            _meal(_ing("Chicken breast", 0.3, "lbs"), _ing("Broccoli", 100.0, "g")),
        ]
        result = build_grocery_list(meals)
        protein_items = _items_in(result, "proteins")
        produce_items = _items_in(result, "produce")
        pantry_items = _items_in(result, "pantry_dry")

        chicken = next(i for i in protein_items if "chicken" in i["name"].lower())
        broccoli = next(i for i in produce_items if "broccoli" in i["name"].lower())
        rice = next(i for i in pantry_items if "rice" in i["name"].lower())

        self.assertAlmostEqual(chicken["quantity"], 0.9)
        self.assertAlmostEqual(broccoli["quantity"], 200.0)
        self.assertAlmostEqual(rice["quantity"], 60.0)

    def test_quantity_rounded_to_three_decimal_places(self):
        q = 1.0 / 3.0
        meals = [_meal(_ing("Olive oil", q, "tbsp")), _meal(_ing("Olive oil", q, "tbsp"))]
        items = _items_in(build_grocery_list(meals), "pantry_dry")
        oil = next(i for i in items if "olive oil" in i["name"].lower())
        # quantity stored with at most 3 decimal places
        self.assertEqual(oil["quantity"], round(q * 2, 3))


# ---------------------------------------------------------------------------
# build_grocery_list — sorting
# ---------------------------------------------------------------------------

class TestBuildGroceryListSorting(unittest.TestCase):
    def test_items_sorted_alphabetically_within_category(self):
        meals = [
            _meal(
                _ing("Zucchini", 200.0, "g"),
                _ing("Asparagus", 150.0, "g"),
                _ing("Broccoli", 100.0, "g"),
            )
        ]
        items = _items_in(build_grocery_list(meals), "produce")
        names = [i["name"].lower() for i in items]
        self.assertEqual(names, sorted(names))


# ---------------------------------------------------------------------------
# build_grocery_list — edge cases
# ---------------------------------------------------------------------------

class TestBuildGroceryListEdgeCases(unittest.TestCase):
    def test_missing_ingredients_json_key_skipped(self):
        self.assertEqual(build_grocery_list([{"name": "Mystery meal"}]), [])

    def test_null_ingredients_json_skipped(self):
        self.assertEqual(build_grocery_list([{"ingredients_json": None}]), [])

    def test_non_list_ingredients_json_skipped(self):
        self.assertEqual(build_grocery_list([{"ingredients_json": "not a list"}]), [])

    def test_ingredient_without_quantity_skipped(self):
        meals = [_meal({"name": "Chicken breast", "unit": "lbs"})]
        self.assertEqual(build_grocery_list(meals), [])

    def test_ingredient_with_none_quantity_skipped(self):
        meals = [_meal({"name": "Chicken breast", "quantity": None, "unit": "lbs"})]
        self.assertEqual(build_grocery_list(meals), [])

    def test_ingredient_without_name_skipped(self):
        meals = [_meal({"quantity": 1.0, "unit": "lbs"})]
        self.assertEqual(build_grocery_list(meals), [])

    def test_non_dict_ingredient_skipped(self):
        meals = [{"ingredients_json": ["oats", None, 42]}]
        self.assertEqual(build_grocery_list(meals), [])

    def test_non_numeric_quantity_skipped(self):
        meals = [_meal({"name": "Chicken breast", "quantity": "lots", "unit": "lbs"})]
        self.assertEqual(build_grocery_list(meals), [])

    def test_valid_and_invalid_ingredients_mixed(self):
        meals = [
            {
                "ingredients_json": [
                    _ing("Chicken breast", 1.0, "lbs"),
                    {"name": "bad", "unit": "g"},   # missing quantity
                    _ing("Broccoli", 200.0, "g"),
                ]
            }
        ]
        result = build_grocery_list(meals)
        cats = [g["category"] for g in result]
        self.assertIn("proteins", cats)
        self.assertIn("produce", cats)


if __name__ == "__main__":
    unittest.main()
