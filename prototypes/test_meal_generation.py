"""
Unit tests for meal_generation module.

openai is mocked at the sys.modules level before the module under test is
imported, so these tests run without a network connection or real API key.
"""

from __future__ import annotations

import json
import sys
import unittest
from unittest.mock import MagicMock, patch

# ── Mock the openai package BEFORE importing the module under test ──────────
# Concrete exception classes are needed so except-clauses resolve correctly.
_mock_openai = MagicMock()
_mock_openai.AuthenticationError = type("AuthenticationError", (Exception,), {})
_mock_openai.RateLimitError = type("RateLimitError", (Exception,), {})
sys.modules["openai"] = _mock_openai
# ───────────────────────────────────────────────────────────────────────────

import meal_generation  # noqa: E402
from meal_generation import (
    ApiKeyError,
    GeneratedMeal,
    MalformedResponseError,
    MealPlan,
    RateLimitError as MealRateLimitError,
    UserPreferences,
    build_prompt,
    generate_meal_plan,
    parse_meal_response,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _prefs(**overrides) -> UserPreferences:
    defaults = dict(
        calories_target=2600,
        protein_target_g=190,
        carbs_target_g=260,
        fat_target_g=80,
        training_phase="bulk",
        dietary_restrictions=[],
        num_meals=3,
    )
    defaults.update(overrides)
    return UserPreferences(**defaults)


def _meal_dict(**overrides) -> dict:
    base = dict(
        name="Grilled Chicken & Rice",
        description="Lean protein with complex carbs.",
        ingredients=["200g chicken breast", "150g brown rice", "1 tbsp olive oil"],
        calories=520,
        protein_g=48,
        carbs_g=52,
        fat_g=12,
        prep_time_minutes=25,
    )
    base.update(overrides)
    return base


def _fake_completion(content: str) -> MagicMock:
    """Build a minimal fake openai ChatCompletion response object."""
    choice = MagicMock()
    choice.message.content = content
    resp = MagicMock()
    resp.choices = [choice]
    return resp


def _setup_client(meals_data: list[dict]) -> MagicMock:
    """Wire _mock_openai.OpenAI to return a client that responds with meals_data."""
    content = json.dumps(meals_data)
    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = _fake_completion(content)
    _mock_openai.OpenAI.return_value = mock_client
    return mock_client


# ---------------------------------------------------------------------------
# build_prompt
# ---------------------------------------------------------------------------

class TestBuildPrompt(unittest.TestCase):
    def test_contains_calorie_target(self):
        prompt = build_prompt(_prefs(calories_target=2600))
        self.assertIn("2600", prompt)

    def test_contains_macro_targets(self):
        prompt = build_prompt(_prefs(protein_target_g=190, carbs_target_g=260, fat_target_g=80))
        self.assertIn("190", prompt)
        self.assertIn("260", prompt)
        self.assertIn("80", prompt)

    def test_contains_training_phase(self):
        prompt = build_prompt(_prefs(training_phase="cut"))
        self.assertIn("cut", prompt)

    def test_lists_dietary_restrictions(self):
        prompt = build_prompt(_prefs(dietary_restrictions=["gluten-free", "no dairy"]))
        self.assertIn("gluten-free", prompt)
        self.assertIn("no dairy", prompt)

    def test_no_restrictions_shows_none(self):
        prompt = build_prompt(_prefs(dietary_restrictions=[]))
        self.assertIn("none", prompt)

    def test_num_meals_in_prompt(self):
        prompt = build_prompt(_prefs(num_meals=5))
        self.assertIn("5", prompt)


# ---------------------------------------------------------------------------
# parse_meal_response
# ---------------------------------------------------------------------------

class TestParseMealResponse(unittest.TestCase):
    def test_valid_single_meal(self):
        meals = parse_meal_response(json.dumps([_meal_dict()]))
        self.assertEqual(len(meals), 1)
        self.assertIsInstance(meals[0], GeneratedMeal)
        self.assertEqual(meals[0].name, "Grilled Chicken & Rice")
        self.assertEqual(meals[0].protein_g, 48)

    def test_valid_multiple_meals(self):
        data = [_meal_dict(), _meal_dict(name="Oat Bowl", calories=400)]
        meals = parse_meal_response(json.dumps(data))
        self.assertEqual(len(meals), 2)
        self.assertEqual(meals[1].name, "Oat Bowl")
        self.assertEqual(meals[1].calories, 400)

    def test_ingredients_cast_to_strings(self):
        data = _meal_dict(ingredients=["chicken", "rice"])
        meals = parse_meal_response(json.dumps([data]))
        self.assertIsInstance(meals[0].ingredients[0], str)

    def test_invalid_json_raises(self):
        with self.assertRaises(MalformedResponseError):
            parse_meal_response("not json at all")

    def test_json_object_not_array_raises(self):
        with self.assertRaises(MalformedResponseError):
            parse_meal_response(json.dumps({"name": "oops"}))

    def test_non_object_item_raises(self):
        with self.assertRaises(MalformedResponseError):
            parse_meal_response(json.dumps(["a_string"]))

    def test_missing_required_field_raises(self):
        bad = _meal_dict()
        del bad["protein_g"]
        with self.assertRaises(MalformedResponseError):
            parse_meal_response(json.dumps([bad]))

    def test_error_message_names_missing_fields(self):
        bad = _meal_dict()
        del bad["fat_g"]
        del bad["calories"]
        try:
            parse_meal_response(json.dumps([bad]))
            self.fail("Expected MalformedResponseError")
        except MalformedResponseError as exc:
            self.assertIn("fat_g", str(exc))
            self.assertIn("calories", str(exc))


# ---------------------------------------------------------------------------
# generate_meal_plan
# ---------------------------------------------------------------------------

class TestGenerateMealPlan(unittest.TestCase):
    def test_returns_meal_plan(self):
        _setup_client([_meal_dict() for _ in range(3)])
        plan = generate_meal_plan(_prefs(), api_key="sk-test")
        self.assertIsInstance(plan, MealPlan)
        self.assertEqual(len(plan.meals), 3)

    def test_aggregate_totals_are_correct(self):
        _setup_client([
            _meal_dict(calories=500, protein_g=40, carbs_g=50, fat_g=10),
            _meal_dict(calories=500, protein_g=40, carbs_g=50, fat_g=10),
        ])
        plan = generate_meal_plan(_prefs(num_meals=2), api_key="sk-test")
        self.assertEqual(plan.total_calories, 1000)
        self.assertEqual(plan.total_protein_g, 80)
        self.assertEqual(plan.total_carbs_g, 100)
        self.assertEqual(plan.total_fat_g, 20)

    def test_missing_api_key_raises(self):
        with patch.dict("os.environ", {}, clear=True):
            with self.assertRaises(ApiKeyError):
                generate_meal_plan(_prefs(), api_key=None)

    def test_env_var_api_key_is_used(self):
        _setup_client([_meal_dict()])
        with patch.dict("os.environ", {"OPENAI_API_KEY": "sk-from-env"}):
            generate_meal_plan(_prefs(num_meals=1))
        _mock_openai.OpenAI.assert_called_with(api_key="sk-from-env")

    def test_authentication_error_becomes_api_key_error(self):
        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = (
            _mock_openai.AuthenticationError("bad key")
        )
        _mock_openai.OpenAI.return_value = mock_client
        with self.assertRaises(ApiKeyError):
            generate_meal_plan(_prefs(), api_key="sk-bad")

    def test_rate_limit_error_becomes_meal_rate_limit_error(self):
        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = (
            _mock_openai.RateLimitError("quota exceeded")
        )
        _mock_openai.OpenAI.return_value = mock_client
        with self.assertRaises(MealRateLimitError):
            generate_meal_plan(_prefs(), api_key="sk-test")

    def test_malformed_json_response_raises(self):
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = _fake_completion(
            "Here are your meals: <broken json>"
        )
        _mock_openai.OpenAI.return_value = mock_client
        with self.assertRaises(MalformedResponseError):
            generate_meal_plan(_prefs(), api_key="sk-test")

    def test_valid_json_but_missing_fields_raises(self):
        bad_meal = _meal_dict()
        del bad_meal["prep_time_minutes"]
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = _fake_completion(
            json.dumps([bad_meal])
        )
        _mock_openai.OpenAI.return_value = mock_client
        with self.assertRaises(MalformedResponseError):
            generate_meal_plan(_prefs(num_meals=1), api_key="sk-test")

    def test_explicit_api_key_overrides_env(self):
        _setup_client([_meal_dict()])
        with patch.dict("os.environ", {"OPENAI_API_KEY": "sk-env"}):
            generate_meal_plan(_prefs(num_meals=1), api_key="sk-explicit")
        _mock_openai.OpenAI.assert_called_with(api_key="sk-explicit")


if __name__ == "__main__":
    unittest.main()
