"""
Meal generation service: builds OpenAI prompt from user preferences,
calls chat completions API, parses structured 7-day meal plan.

Returns typed GeneratedMealRow objects whose fields match the meals DB schema
(day, meal_type, name, description, ingredients_json).
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any, Optional

import openai

DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
MEAL_TYPES = ["breakfast", "lunch", "dinner"]


# ---------------------------------------------------------------------------
# Input / output types
# ---------------------------------------------------------------------------

@dataclass
class MealPreferences:
    """Subset of UserPreferences fields relevant to meal generation."""

    household_size: int = 1
    dietary_prefs: list[str] = field(default_factory=list)
    allergies: list[str] = field(default_factory=list)
    budget: Optional[Decimal] = None
    cook_time_minutes: Optional[int] = None


@dataclass
class FeedbackHints:
    """Meal names from recent feedback used to personalize the generation prompt."""

    liked: list[str] = field(default_factory=list)
    disliked: list[str] = field(default_factory=list)


@dataclass
class GeneratedMealRow:
    """A single generated meal — fields match the meals table schema."""

    day: str                          # "monday" … "sunday"
    meal_type: str                    # "breakfast" | "lunch" | "dinner"
    name: str
    description: str
    ingredients_json: list[dict[str, Any]]  # [{name, quantity, unit}, …]


# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------

class MealGenerationError(Exception):
    """Base exception for all meal generation failures."""

class ApiKeyError(MealGenerationError):
    """API key missing or rejected by OpenAI."""

class RateLimitError(MealGenerationError):
    """OpenAI rate limit exceeded."""

class OpenAIServiceError(MealGenerationError):
    """OpenAI returned a 5xx error."""

class GenerationTimeoutError(MealGenerationError):
    """Request to OpenAI timed out."""

class MalformedResponseError(MealGenerationError):
    """Response JSON could not be parsed into meals."""


# ---------------------------------------------------------------------------
# Prompt construction
# ---------------------------------------------------------------------------

def build_system_prompt(
    prefs: MealPreferences,
    feedback: Optional["FeedbackHints"] = None,
) -> str:
    dietary = ", ".join(prefs.dietary_prefs) if prefs.dietary_prefs else "none"
    allergies = ", ".join(prefs.allergies) if prefs.allergies else "none"
    budget = f"${prefs.budget:.2f}/week" if prefs.budget else "not specified"
    cook_time = f"{prefs.cook_time_minutes} minutes max" if prefs.cook_time_minutes else "no limit"

    prompt = (
        "You are a meal planning assistant. Generate a 7-day meal plan as valid JSON.\n\n"
        "User profile:\n"
        f"- Household size: {prefs.household_size} person(s)\n"
        f"- Dietary preferences: {dietary}\n"
        f"- Allergies: {allergies}\n"
        f"- Weekly grocery budget: {budget}\n"
        f"- Max cook time per meal: {cook_time}\n"
    )

    if feedback and (feedback.liked or feedback.disliked):
        prompt += "\nMeal feedback from recent weeks:\n"
        if feedback.liked:
            liked_str = ", ".join(feedback.liked[:10])
            prompt += f"- More like these (user enjoyed): {liked_str}\n"
        if feedback.disliked:
            disliked_str = ", ".join(feedback.disliked[:10])
            prompt += f"- Avoid these patterns (user disliked): {disliked_str}\n"

    prompt += (
        "\nRules:\n"
        "1. Respect all dietary preferences and allergies absolutely.\n"
        "2. Scale ingredient quantities for the household size.\n"
        "3. Keep each meal within the stated cook time.\n"
        "4. Prefer budget-friendly ingredients when a budget is given.\n"
        "5. Vary meals across the week — do not repeat the same meal twice.\n"
    )
    if feedback and feedback.liked:
        prompt += "6. Favour meals similar in style to the liked meals listed above.\n"
    if feedback and feedback.disliked:
        prompt += "7. Do not suggest meals similar to the disliked meals listed above.\n"

    prompt += "- Respond with ONLY valid JSON — no prose, no markdown fences."
    return prompt


def build_user_prompt() -> str:
    return (
        "Generate exactly 21 meals: breakfast, lunch, and dinner for each of the 7 days "
        "(monday through sunday).\n\n"
        'Return a JSON object with a single key "meals" whose value is an array of 21 objects. '
        "Each object must have exactly these fields:\n"
        '  "day": one of ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]\n'
        '  "meal_type": one of ["breakfast","lunch","dinner"]\n'
        '  "name": meal name (string)\n'
        '  "description": one-sentence prep description (string)\n'
        '  "ingredients": array where each element has "name" (string), "quantity" (number), '
        '"unit" (string)\n\n'
        "Cover exactly 7 days × 3 meal types = 21 meals. Do not include snacks."
    )


# ---------------------------------------------------------------------------
# Response parsing
# ---------------------------------------------------------------------------

def _parse_ingredient(raw: Any, meal_index: int, ing_index: int) -> dict[str, Any]:
    if not isinstance(raw, dict):
        raise MalformedResponseError(
            f"Ingredient {ing_index} of meal {meal_index} is not a JSON object: {raw!r}"
        )
    missing = {"name", "quantity", "unit"} - raw.keys()
    if missing:
        raise MalformedResponseError(
            f"Ingredient {ing_index} of meal {meal_index} missing fields: {sorted(missing)}"
        )
    return {
        "name": str(raw["name"]),
        "quantity": float(raw["quantity"]),
        "unit": str(raw["unit"]),
    }


def _parse_meal(raw: dict[str, Any], index: int) -> GeneratedMealRow:
    required = {"day", "meal_type", "name", "description", "ingredients"}
    missing = required - raw.keys()
    if missing:
        raise MalformedResponseError(
            f"Meal at index {index} missing fields: {sorted(missing)}"
        )

    day = str(raw["day"]).lower()
    if day not in DAYS:
        raise MalformedResponseError(
            f"Meal at index {index} has invalid day: {day!r}"
        )

    meal_type = str(raw["meal_type"]).lower()
    if meal_type not in MEAL_TYPES:
        raise MalformedResponseError(
            f"Meal at index {index} has invalid meal_type: {meal_type!r}"
        )

    if not isinstance(raw["ingredients"], list):
        raise MalformedResponseError(
            f"Meal at index {index} 'ingredients' must be a JSON array"
        )

    ingredients = [
        _parse_ingredient(ing, index, i)
        for i, ing in enumerate(raw["ingredients"])
    ]

    return GeneratedMealRow(
        day=day,
        meal_type=meal_type,
        name=str(raw["name"]),
        description=str(raw["description"]),
        ingredients_json=ingredients,
    )


def parse_meal_plan_response(json_text: str) -> list[GeneratedMealRow]:
    """Parse a JSON string from the API into a list of GeneratedMealRow objects."""
    try:
        data = json.loads(json_text)
    except json.JSONDecodeError as exc:
        raise MalformedResponseError(f"Response is not valid JSON: {exc}") from exc

    if not isinstance(data, dict) or "meals" not in data:
        raise MalformedResponseError(
            "Expected a JSON object with a 'meals' key"
        )

    meals_raw = data["meals"]
    if not isinstance(meals_raw, list):
        raise MalformedResponseError("'meals' must be a JSON array")

    result: list[GeneratedMealRow] = []
    for i, item in enumerate(meals_raw):
        if not isinstance(item, dict):
            raise MalformedResponseError(
                f"Item at index {i} is not a JSON object: {item!r}"
            )
        result.append(_parse_meal(item, i))

    return result


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def generate_week_meal_plan(
    prefs: MealPreferences,
    *,
    api_key: str,
    model: str = "gpt-4o-mini",
    timeout: float = 120.0,
    feedback: Optional[FeedbackHints] = None,
) -> list[GeneratedMealRow]:
    """
    Generate a 7-day meal plan via OpenAI chat completions.

    Returns 21 GeneratedMealRow objects (7 days × 3 meal types).

    Raises:
        ApiKeyError: key rejected by OpenAI.
        RateLimitError: OpenAI rate limit exceeded.
        OpenAIServiceError: OpenAI 5xx error.
        GenerationTimeoutError: request timed out.
        MalformedResponseError: response could not be parsed into meals.
    """
    client = openai.OpenAI(api_key=api_key, timeout=timeout)

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": build_system_prompt(prefs, feedback)},
                {"role": "user", "content": build_user_prompt()},
            ],
            response_format={"type": "json_object"},
            temperature=0.4,
            max_tokens=4096,
        )
    except openai.AuthenticationError as exc:
        raise ApiKeyError(f"OpenAI rejected the API key: {exc}") from exc
    except openai.RateLimitError as exc:
        raise RateLimitError(f"OpenAI rate limit exceeded: {exc}") from exc
    except openai.APIStatusError as exc:
        raise OpenAIServiceError(f"OpenAI service error ({exc.status_code}): {exc}") from exc
    except openai.APITimeoutError as exc:
        raise GenerationTimeoutError(f"OpenAI request timed out: {exc}") from exc

    raw_text = response.choices[0].message.content or ""
    return parse_meal_plan_response(raw_text)


# ---------------------------------------------------------------------------
# Single-meal generation
# ---------------------------------------------------------------------------

def _build_swap_system_prompt(prefs: MealPreferences) -> str:
    dietary = ", ".join(prefs.dietary_prefs) if prefs.dietary_prefs else "none"
    allergies = ", ".join(prefs.allergies) if prefs.allergies else "none"
    budget = f"${prefs.budget:.2f}/week" if prefs.budget else "not specified"
    cook_time = f"{prefs.cook_time_minutes} minutes max" if prefs.cook_time_minutes else "no limit"

    return (
        "You are a meal planning assistant. Generate a single meal as valid JSON.\n\n"
        "User profile:\n"
        f"- Household size: {prefs.household_size} person(s)\n"
        f"- Dietary preferences: {dietary}\n"
        f"- Allergies: {allergies}\n"
        f"- Weekly grocery budget: {budget}\n"
        f"- Max cook time per meal: {cook_time}\n\n"
        "Rules:\n"
        "1. Respect all dietary preferences and allergies absolutely.\n"
        "2. Scale ingredient quantities for the household size.\n"
        "3. Keep the meal within the stated cook time.\n"
        "4. Prefer budget-friendly ingredients when a budget is given.\n"
        "5. Respond with ONLY valid JSON — no prose, no markdown fences."
    )


def _build_swap_user_prompt(day: str, meal_type: str) -> str:
    return (
        f"Generate ONE {meal_type} meal suitable for {day}.\n\n"
        'Return a JSON object with a single key "meal" whose value is an object with exactly these fields:\n'
        f'  "day": "{day}"\n'
        f'  "meal_type": "{meal_type}"\n'
        '  "name": meal name (string)\n'
        '  "description": one-sentence prep description (string)\n'
        '  "ingredients": array where each element has "name" (string), "quantity" (number), "unit" (string)'
    )


def generate_single_meal(
    day: str,
    meal_type: str,
    prefs: MealPreferences,
    *,
    api_key: str,
    model: str = "gpt-4o-mini",
    timeout: float = 60.0,
) -> GeneratedMealRow:
    """Generate one replacement meal via OpenAI chat completions."""
    client = openai.OpenAI(api_key=api_key, timeout=timeout)

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": _build_swap_system_prompt(prefs)},
                {"role": "user", "content": _build_swap_user_prompt(day, meal_type)},
            ],
            response_format={"type": "json_object"},
            temperature=0.8,
            max_tokens=512,
        )
    except openai.AuthenticationError as exc:
        raise ApiKeyError(f"OpenAI rejected the API key: {exc}") from exc
    except openai.RateLimitError as exc:
        raise RateLimitError(f"OpenAI rate limit exceeded: {exc}") from exc
    except openai.APIStatusError as exc:
        raise OpenAIServiceError(f"OpenAI service error ({exc.status_code}): {exc}") from exc
    except openai.APITimeoutError as exc:
        raise GenerationTimeoutError(f"OpenAI request timed out: {exc}") from exc

    raw_text = response.choices[0].message.content or ""

    try:
        data = json.loads(raw_text)
    except json.JSONDecodeError as exc:
        raise MalformedResponseError(f"Response is not valid JSON: {exc}") from exc

    if not isinstance(data, dict) or "meal" not in data:
        raise MalformedResponseError("Expected a JSON object with a 'meal' key")

    return _parse_meal(data["meal"], 0)


# ---------------------------------------------------------------------------
# Compatibility adapter used by routers/meal_plans.py
# ---------------------------------------------------------------------------

def generate_weekly_meals(
    api_key: str,
    household_size: int = 1,
    dietary_prefs: list[str] | None = None,
    allergies: list[str] | None = None,
    budget: float | None = None,
    cook_time_minutes: int | None = None,
    liked_meals: list[str] | None = None,
    disliked_meals: list[str] | None = None,
) -> list[dict[str, Any]]:
    """Flat-kwargs wrapper around generate_week_meal_plan; returns dicts."""
    prefs = MealPreferences(
        household_size=household_size,
        dietary_prefs=dietary_prefs or [],
        allergies=allergies or [],
        budget=Decimal(str(budget)) if budget is not None else None,
        cook_time_minutes=cook_time_minutes,
    )
    feedback: Optional[FeedbackHints] = None
    if liked_meals or disliked_meals:
        feedback = FeedbackHints(liked=liked_meals or [], disliked=disliked_meals or [])
    rows = generate_week_meal_plan(prefs, api_key=api_key, feedback=feedback)
    return [
        {
            "day": r.day,
            "meal_type": r.meal_type,
            "name": r.name,
            "description": r.description,
            "ingredients": r.ingredients_json,
        }
        for r in rows
    ]
