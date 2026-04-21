"""
Meal generation module using OpenAI chat completions.

Builds a prompt from user macro preferences, calls the OpenAI API,
parses the structured JSON response into typed dataclasses, and handles
common API errors gracefully.

Requires: openai SDK  (pip install openai)
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from typing import Any

import openai


# ---------------------------------------------------------------------------
# Data models
# ---------------------------------------------------------------------------

@dataclass
class UserPreferences:
    """User's nutritional targets and dietary constraints."""

    calories_target: int
    protein_target_g: int
    carbs_target_g: int
    fat_target_g: int
    training_phase: str          # "cut", "bulk", or "maintenance"
    dietary_restrictions: list[str] = field(default_factory=list)
    num_meals: int = 3           # meals to generate per day


@dataclass
class GeneratedMeal:
    """A single AI-generated meal with nutritional metadata."""

    name: str
    description: str
    ingredients: list[str]
    calories: int
    protein_g: int
    carbs_g: int
    fat_g: int
    prep_time_minutes: int


@dataclass
class MealPlan:
    """A daily meal plan with aggregate macro totals."""

    meals: list[GeneratedMeal]
    total_calories: int
    total_protein_g: int
    total_carbs_g: int
    total_fat_g: int


# ---------------------------------------------------------------------------
# Custom exceptions
# ---------------------------------------------------------------------------

class MealGenerationError(Exception):
    """Base exception for all meal-generation failures."""


class ApiKeyError(MealGenerationError):
    """Raised when the OpenAI API key is missing or invalid."""


class RateLimitError(MealGenerationError):
    """Raised when the OpenAI API rate limit is exceeded."""


class MalformedResponseError(MealGenerationError):
    """Raised when the API response cannot be parsed into meals."""


# ---------------------------------------------------------------------------
# Prompt construction
# ---------------------------------------------------------------------------

def build_prompt(preferences: UserPreferences) -> str:
    """Return a chat prompt that asks the model for a macro-compliant meal plan."""
    restrictions = (
        ", ".join(preferences.dietary_restrictions)
        if preferences.dietary_restrictions
        else "none"
    )
    return (
        f"You are a sports nutrition assistant. "
        f"Generate exactly {preferences.num_meals} meals for a fitness-focused individual "
        f"on a {preferences.training_phase} phase.\n\n"
        f"Daily targets:\n"
        f"  Calories: {preferences.calories_target} kcal\n"
        f"  Protein:  {preferences.protein_target_g}g\n"
        f"  Carbs:    {preferences.carbs_target_g}g\n"
        f"  Fat:      {preferences.fat_target_g}g\n"
        f"Dietary restrictions: {restrictions}\n\n"
        f"The combined meals should closely match the daily targets above.\n\n"
        f"Respond with ONLY a valid JSON array. Each element must have these exact keys:\n"
        f"  name (string), description (string), ingredients (array of strings),\n"
        f"  calories (int), protein_g (int), carbs_g (int), fat_g (int),\n"
        f"  prep_time_minutes (int)\n\n"
        f"No markdown fences, no explanation — only the JSON array."
    )


# ---------------------------------------------------------------------------
# Response parsing
# ---------------------------------------------------------------------------

def _parse_meal(raw: dict[str, Any], index: int) -> GeneratedMeal:
    """Parse one meal dict; raises MalformedResponseError if fields are missing."""
    required = {
        "name", "description", "ingredients",
        "calories", "protein_g", "carbs_g", "fat_g", "prep_time_minutes",
    }
    missing = required - raw.keys()
    if missing:
        raise MalformedResponseError(
            f"Meal at index {index} is missing required fields: {sorted(missing)}"
        )
    return GeneratedMeal(
        name=str(raw["name"]),
        description=str(raw["description"]),
        ingredients=[str(i) for i in raw["ingredients"]],
        calories=int(raw["calories"]),
        protein_g=int(raw["protein_g"]),
        carbs_g=int(raw["carbs_g"]),
        fat_g=int(raw["fat_g"]),
        prep_time_minutes=int(raw["prep_time_minutes"]),
    )


def parse_meal_response(json_text: str) -> list[GeneratedMeal]:
    """Parse a JSON string from the API into a list of GeneratedMeal objects."""
    try:
        data = json.loads(json_text)
    except json.JSONDecodeError as exc:
        raise MalformedResponseError(
            f"Response is not valid JSON: {exc}"
        ) from exc

    if not isinstance(data, list):
        raise MalformedResponseError(
            f"Expected a JSON array at the top level, got {type(data).__name__}"
        )

    meals: list[GeneratedMeal] = []
    for idx, item in enumerate(data):
        if not isinstance(item, dict):
            raise MalformedResponseError(
                f"Item at index {idx} is not a JSON object: {item!r}"
            )
        meals.append(_parse_meal(item, idx))
    return meals


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def generate_meal_plan(
    preferences: UserPreferences,
    *,
    api_key: str | None = None,
    model: str = "gpt-4o-mini",
) -> MealPlan:
    """
    Generate a macro-compliant meal plan via OpenAI chat completions.

    Args:
        preferences: User's nutritional targets and restrictions.
        api_key: OpenAI API key. Falls back to OPENAI_API_KEY env var.
        model: Chat completion model name.

    Returns:
        MealPlan with generated meals and aggregate daily totals.

    Raises:
        ApiKeyError: API key is absent or rejected by OpenAI.
        RateLimitError: OpenAI rate limit was hit.
        MalformedResponseError: Response JSON could not be parsed into meals.
    """
    key = api_key or os.environ.get("OPENAI_API_KEY")
    if not key:
        raise ApiKeyError(
            "No API key provided. Pass api_key= or set the OPENAI_API_KEY env var."
        )

    client = openai.OpenAI(api_key=key)
    prompt = build_prompt(preferences)

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
        )
    except openai.AuthenticationError as exc:
        raise ApiKeyError(f"OpenAI rejected the API key: {exc}") from exc
    except openai.RateLimitError as exc:
        raise RateLimitError(f"OpenAI rate limit exceeded: {exc}") from exc

    raw_text = response.choices[0].message.content or ""
    meals = parse_meal_response(raw_text)

    return MealPlan(
        meals=meals,
        total_calories=sum(m.calories for m in meals),
        total_protein_g=sum(m.protein_g for m in meals),
        total_carbs_g=sum(m.carbs_g for m in meals),
        total_fat_g=sum(m.fat_g for m in meals),
    )
