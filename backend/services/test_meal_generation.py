"""
Unit tests for meal_generation service.

openai is mocked at the sys.modules level before the module under test is
imported, so these tests run without a network connection or real API key.
"""
from __future__ import annotations

import json
import sys
import unittest
from decimal import Decimal
from unittest.mock import MagicMock

# ── Mock the openai package BEFORE importing the module under test ──────────
_mock_openai = MagicMock()
_mock_openai.AuthenticationError = type("AuthenticationError", (Exception,), {})
_mock_openai.RateLimitError = type("RateLimitError", (Exception,), {})
_mock_openai.APIStatusError = type("APIStatusError", (Exception,), {"status_code": 500})
_mock_openai.APITimeoutError = type("APITimeoutError", (Exception,), {})
sys.modules["openai"] = _mock_openai
# ───────────────────────────────────────────────────────────────────────────

from meal_generation import (  # noqa: E402
    ApiKeyError,
    FeedbackHints,
    GeneratedMealRow,
    GenerationTimeoutError,
    MalformedResponseError,
    MealPreferences,
    OpenAIServiceError,
    RateLimitError,
    build_system_prompt,
    build_user_prompt,
    generate_week_meal_plan,
    parse_meal_plan_response,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _prefs(**overrides) -> MealPreferences:
    defaults = dict(
        household_size=1,
        dietary_prefs=[],
        allergies=[],
        budget=None,
        cook_time_minutes=None,
    )
    defaults.update(overrides)
    return MealPreferences(**defaults)


def _meal_dict(**overrides) -> dict:
    base = dict(
        day="monday",
        meal_type="breakfast",
        name="Oat Bowl",
        description="Cook oats with milk, top with berries.",
        ingredients=[
            {"name": "rolled oats", "quantity": 80, "unit": "g"},
            {"name": "milk", "quantity": 200, "unit": "ml"},
        ],
    )
    base.update(overrides)
    return base


def _fake_completion(content: str) -> MagicMock:
    choice = MagicMock()
    choice.message.content = content
    resp = MagicMock()
    resp.choices = [choice]
    return resp


def _setup_client(meals_data: list[dict]) -> MagicMock:
    content = json.dumps({"meals": meals_data})
    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = _fake_completion(content)
    _mock_openai.OpenAI.return_value = mock_client
    return mock_client


def _full_plan() -> list[dict]:
    days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    meal_types = ["breakfast", "lunch", "dinner"]
    return [
        _meal_dict(day=d, meal_type=mt, name=f"{d} {mt}")
        for d in days
        for mt in meal_types
    ]


# ---------------------------------------------------------------------------
# build_system_prompt
# ---------------------------------------------------------------------------

class TestBuildSystemPrompt(unittest.TestCase):
    def test_contains_household_size(self):
        prompt = build_system_prompt(_prefs(household_size=3))
        self.assertIn("3", prompt)

    def test_contains_dietary_prefs(self):
        prompt = build_system_prompt(_prefs(dietary_prefs=["vegan", "gluten-free"]))
        self.assertIn("vegan", prompt)
        self.assertIn("gluten-free", prompt)

    def test_no_dietary_prefs_shows_none(self):
        prompt = build_system_prompt(_prefs(dietary_prefs=[]))
        self.assertIn("none", prompt)

    def test_contains_allergies(self):
        prompt = build_system_prompt(_prefs(allergies=["nuts", "shellfish"]))
        self.assertIn("nuts", prompt)
        self.assertIn("shellfish", prompt)

    def test_no_allergies_shows_none(self):
        prompt = build_system_prompt(_prefs(allergies=[]))
        self.assertIn("none", prompt)

    def test_contains_budget(self):
        prompt = build_system_prompt(_prefs(budget=Decimal("75.00")))
        self.assertIn("75.00", prompt)

    def test_no_budget_shows_not_specified(self):
        prompt = build_system_prompt(_prefs(budget=None))
        self.assertIn("not specified", prompt)

    def test_contains_cook_time(self):
        prompt = build_system_prompt(_prefs(cook_time_minutes=30))
        self.assertIn("30", prompt)

    def test_no_cook_time_shows_no_limit(self):
        prompt = build_system_prompt(_prefs(cook_time_minutes=None))
        self.assertIn("no limit", prompt)


# ---------------------------------------------------------------------------
# build_user_prompt
# ---------------------------------------------------------------------------

class TestBuildUserPrompt(unittest.TestCase):
    def test_mentions_21_meals(self):
        prompt = build_user_prompt()
        self.assertIn("21", prompt)

    def test_mentions_all_days(self):
        prompt = build_user_prompt()
        for day in ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]:
            self.assertIn(day, prompt)

    def test_mentions_meal_types(self):
        prompt = build_user_prompt()
        for mt in ["breakfast", "lunch", "dinner"]:
            self.assertIn(mt, prompt)


# ---------------------------------------------------------------------------
# parse_meal_plan_response
# ---------------------------------------------------------------------------

class TestParseMealPlanResponse(unittest.TestCase):
    def test_valid_single_meal(self):
        meals = parse_meal_plan_response(json.dumps({"meals": [_meal_dict()]}))
        self.assertEqual(len(meals), 1)
        self.assertIsInstance(meals[0], GeneratedMealRow)
        self.assertEqual(meals[0].day, "monday")
        self.assertEqual(meals[0].meal_type, "breakfast")
        self.assertEqual(meals[0].name, "Oat Bowl")

    def test_full_21_meal_plan(self):
        meals = parse_meal_plan_response(json.dumps({"meals": _full_plan()}))
        self.assertEqual(len(meals), 21)

    def test_day_is_lowercased(self):
        meals = parse_meal_plan_response(json.dumps({"meals": [_meal_dict(day="MONDAY")]}))
        self.assertEqual(meals[0].day, "monday")

    def test_meal_type_is_lowercased(self):
        meals = parse_meal_plan_response(json.dumps({"meals": [_meal_dict(meal_type="BREAKFAST")]}))
        self.assertEqual(meals[0].meal_type, "breakfast")

    def test_ingredients_json_structure(self):
        meals = parse_meal_plan_response(json.dumps({"meals": [_meal_dict()]}))
        ing = meals[0].ingredients_json[0]
        self.assertIn("name", ing)
        self.assertIn("quantity", ing)
        self.assertIn("unit", ing)
        self.assertIsInstance(ing["quantity"], float)

    def test_invalid_json_raises(self):
        with self.assertRaises(MalformedResponseError):
            parse_meal_plan_response("not json")

    def test_missing_meals_key_raises(self):
        with self.assertRaises(MalformedResponseError):
            parse_meal_plan_response(json.dumps({"data": []}))

    def test_meals_not_array_raises(self):
        with self.assertRaises(MalformedResponseError):
            parse_meal_plan_response(json.dumps({"meals": "oops"}))

    def test_non_object_meal_raises(self):
        with self.assertRaises(MalformedResponseError):
            parse_meal_plan_response(json.dumps({"meals": ["a_string"]}))

    def test_missing_required_field_raises(self):
        bad = _meal_dict()
        del bad["name"]
        with self.assertRaises(MalformedResponseError):
            parse_meal_plan_response(json.dumps({"meals": [bad]}))

    def test_error_message_names_missing_fields(self):
        bad = _meal_dict()
        del bad["day"]
        del bad["description"]
        try:
            parse_meal_plan_response(json.dumps({"meals": [bad]}))
            self.fail("Expected MalformedResponseError")
        except MalformedResponseError as exc:
            self.assertIn("day", str(exc))
            self.assertIn("description", str(exc))

    def test_invalid_day_raises(self):
        with self.assertRaises(MalformedResponseError):
            parse_meal_plan_response(json.dumps({"meals": [_meal_dict(day="friday13th")]}))

    def test_invalid_meal_type_raises(self):
        with self.assertRaises(MalformedResponseError):
            parse_meal_plan_response(json.dumps({"meals": [_meal_dict(meal_type="snack")]}))

    def test_ingredients_not_array_raises(self):
        with self.assertRaises(MalformedResponseError):
            parse_meal_plan_response(json.dumps({"meals": [_meal_dict(ingredients="oops")]}))

    def test_ingredient_missing_field_raises(self):
        bad_ing = {"name": "oats", "quantity": 80}  # missing unit
        with self.assertRaises(MalformedResponseError):
            parse_meal_plan_response(json.dumps({"meals": [_meal_dict(ingredients=[bad_ing])]}))

    def test_ingredient_error_mentions_missing_field(self):
        bad_ing = {"name": "oats"}  # missing quantity and unit
        try:
            parse_meal_plan_response(json.dumps({"meals": [_meal_dict(ingredients=[bad_ing])]}))
            self.fail("Expected MalformedResponseError")
        except MalformedResponseError as exc:
            self.assertIn("quantity", str(exc))
            self.assertIn("unit", str(exc))


# ---------------------------------------------------------------------------
# generate_week_meal_plan
# ---------------------------------------------------------------------------

class TestGenerateWeekMealPlan(unittest.TestCase):
    def test_returns_list_of_generated_meal_rows(self):
        _setup_client(_full_plan())
        rows = generate_week_meal_plan(_prefs(), api_key="sk-test")
        self.assertEqual(len(rows), 21)
        self.assertIsInstance(rows[0], GeneratedMealRow)

    def test_authentication_error_becomes_api_key_error(self):
        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = (
            _mock_openai.AuthenticationError("bad key")
        )
        _mock_openai.OpenAI.return_value = mock_client
        with self.assertRaises(ApiKeyError):
            generate_week_meal_plan(_prefs(), api_key="sk-bad")

    def test_rate_limit_error_becomes_rate_limit_error(self):
        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = (
            _mock_openai.RateLimitError("quota exceeded")
        )
        _mock_openai.OpenAI.return_value = mock_client
        with self.assertRaises(RateLimitError):
            generate_week_meal_plan(_prefs(), api_key="sk-test")

    def test_api_status_error_becomes_openai_service_error(self):
        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = (
            _mock_openai.APIStatusError("server error")
        )
        _mock_openai.OpenAI.return_value = mock_client
        with self.assertRaises(OpenAIServiceError):
            generate_week_meal_plan(_prefs(), api_key="sk-test")

    def test_timeout_error_becomes_generation_timeout_error(self):
        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = (
            _mock_openai.APITimeoutError("timed out")
        )
        _mock_openai.OpenAI.return_value = mock_client
        with self.assertRaises(GenerationTimeoutError):
            generate_week_meal_plan(_prefs(), api_key="sk-test")

    def test_malformed_json_response_raises(self):
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = _fake_completion(
            "Here are your meals: <broken json>"
        )
        _mock_openai.OpenAI.return_value = mock_client
        with self.assertRaises(MalformedResponseError):
            generate_week_meal_plan(_prefs(), api_key="sk-test")

    def test_openai_client_receives_api_key(self):
        _setup_client(_full_plan())
        generate_week_meal_plan(_prefs(), api_key="sk-mykey")
        _mock_openai.OpenAI.assert_called_with(api_key="sk-mykey", timeout=120.0)

    def test_custom_timeout_is_passed(self):
        _setup_client(_full_plan())
        generate_week_meal_plan(_prefs(), api_key="sk-test", timeout=15.0)
        _mock_openai.OpenAI.assert_called_with(api_key="sk-test", timeout=15.0)

    def test_json_object_response_format_is_requested(self):
        client = _setup_client(_full_plan())
        generate_week_meal_plan(_prefs(), api_key="sk-test")
        call_kwargs = client.chat.completions.create.call_args[1]
        self.assertEqual(call_kwargs["response_format"], {"type": "json_object"})

    def test_temperature_is_low(self):
        client = _setup_client(_full_plan())
        generate_week_meal_plan(_prefs(), api_key="sk-test")
        call_kwargs = client.chat.completions.create.call_args[1]
        self.assertLessEqual(call_kwargs["temperature"], 0.5)


# ---------------------------------------------------------------------------
# build_system_prompt — feedback hints
# ---------------------------------------------------------------------------

class TestBuildSystemPromptFeedback(unittest.TestCase):
    def test_no_feedback_omits_feedback_section(self):
        prompt = build_system_prompt(_prefs())
        self.assertNotIn("liked", prompt)
        self.assertNotIn("disliked", prompt)
        self.assertNotIn("More like these", prompt)

    def test_empty_feedback_omits_feedback_section(self):
        prompt = build_system_prompt(_prefs(), FeedbackHints())
        self.assertNotIn("More like these", prompt)
        self.assertNotIn("Avoid these", prompt)

    def test_liked_meals_appear_in_prompt(self):
        fb = FeedbackHints(liked=["Chicken Stir Fry", "Oat Bowl"])
        prompt = build_system_prompt(_prefs(), fb)
        self.assertIn("Chicken Stir Fry", prompt)
        self.assertIn("Oat Bowl", prompt)
        self.assertIn("More like these", prompt)

    def test_disliked_meals_appear_in_prompt(self):
        fb = FeedbackHints(disliked=["Kale Salad"])
        prompt = build_system_prompt(_prefs(), fb)
        self.assertIn("Kale Salad", prompt)
        self.assertIn("Avoid these", prompt)

    def test_liked_and_disliked_both_included(self):
        fb = FeedbackHints(liked=["Pasta"], disliked=["Tofu Scramble"])
        prompt = build_system_prompt(_prefs(), fb)
        self.assertIn("Pasta", prompt)
        self.assertIn("Tofu Scramble", prompt)

    def test_liked_capped_at_10(self):
        names = [f"Meal {i}" for i in range(15)]
        fb = FeedbackHints(liked=names)
        prompt = build_system_prompt(_prefs(), fb)
        self.assertIn("Meal 9", prompt)
        self.assertNotIn("Meal 10", prompt)

    def test_disliked_capped_at_10(self):
        names = [f"Bad Meal {i}" for i in range(15)]
        fb = FeedbackHints(disliked=names)
        prompt = build_system_prompt(_prefs(), fb)
        self.assertIn("Bad Meal 9", prompt)
        self.assertNotIn("Bad Meal 10", prompt)

    def test_liked_adds_rule(self):
        fb = FeedbackHints(liked=["Salmon Bowl"])
        prompt = build_system_prompt(_prefs(), fb)
        self.assertIn("similar in style to the liked meals", prompt)

    def test_disliked_adds_rule(self):
        fb = FeedbackHints(disliked=["Brussels Sprouts"])
        prompt = build_system_prompt(_prefs(), fb)
        self.assertIn("similar to the disliked meals", prompt)


# ---------------------------------------------------------------------------
# generate_week_meal_plan — feedback threading
# ---------------------------------------------------------------------------

class TestGenerateWeekMealPlanFeedback(unittest.TestCase):
    def _get_system_prompt(self, client: MagicMock) -> str:
        messages = client.chat.completions.create.call_args[1]["messages"]
        return next(m["content"] for m in messages if m["role"] == "system")

    def test_liked_meals_reach_system_prompt(self):
        client = _setup_client(_full_plan())
        fb = FeedbackHints(liked=["Chicken Curry"])
        generate_week_meal_plan(_prefs(), api_key="sk-test", feedback=fb)
        self.assertIn("Chicken Curry", self._get_system_prompt(client))

    def test_disliked_meals_reach_system_prompt(self):
        client = _setup_client(_full_plan())
        fb = FeedbackHints(disliked=["Plain Rice"])
        generate_week_meal_plan(_prefs(), api_key="sk-test", feedback=fb)
        self.assertIn("Plain Rice", self._get_system_prompt(client))

    def test_no_feedback_still_works(self):
        _setup_client(_full_plan())
        rows = generate_week_meal_plan(_prefs(), api_key="sk-test", feedback=None)
        self.assertEqual(len(rows), 21)


if __name__ == "__main__":
    unittest.main()
