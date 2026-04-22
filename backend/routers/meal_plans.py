import uuid
from collections import defaultdict
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.grocery_list import GroceryList
from app.models.meal import Meal
from app.models.meal_plan import MealPlan
from app.models.user import User
from services.meal_generation import (
    MealGenerationError,
    MealPreferences,
    generate_single_meal,
    generate_weekly_meals,
)

router = APIRouter(prefix="/api")


def _next_monday(reference: date) -> date:
    """Return the Monday of the current week (or today if Monday)."""
    return reference - timedelta(days=reference.weekday())


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------


class CreateMealPlanRequest(BaseModel):
    user_id: uuid.UUID
    week_start: Optional[date] = None


class MealOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    day: str
    meal_type: str
    name: str
    description: Optional[str]
    ingredients_json: Optional[Any]
    calories: Optional[int] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None


class MealPlanOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    week_start: date
    created_at: datetime
    meals: List[MealOut]


class MealPlanSummary(BaseModel):
    id: uuid.UUID
    week_start: date
    name: Optional[str]
    is_active: bool
    meal_count: int
    avg_calories_per_day: Optional[float]


class UpdateMealPlanRequest(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None


class GroceryItem(BaseModel):
    name: str
    quantity: float
    unit: str
    category: str


class GroceryListOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    meal_plan_id: uuid.UUID
    items: List[GroceryItem]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _plan_to_summary(plan: MealPlan) -> MealPlanSummary:
    meal_count = len(plan.meals)
    cals = [m.calories for m in plan.meals if m.calories is not None]
    avg_cal = round(sum(cals) / 7, 1) if cals else None
    return MealPlanSummary(
        id=plan.id,
        week_start=plan.week_start,
        name=plan.name,
        is_active=plan.is_active,
        meal_count=meal_count,
        avg_calories_per_day=avg_cal,
    )


# ---------------------------------------------------------------------------
# Grocery list helpers
# ---------------------------------------------------------------------------

_PRODUCE_KEYWORDS = {
    "apple", "banana", "berry", "berries", "broccoli", "carrot", "celery",
    "garlic", "ginger", "herb", "kale", "lemon", "lettuce", "lime", "mango",
    "mushroom", "onion", "orange", "pepper", "potato", "spinach", "tomato",
    "zucchini", "cucumber", "avocado", "corn", "pea", "bean", "squash",
    "eggplant", "asparagus", "cabbage", "cauliflower", "radish", "beet",
}
_PROTEIN_KEYWORDS = {
    "beef", "chicken", "turkey", "pork", "lamb", "salmon", "tuna", "shrimp",
    "egg", "tofu", "tempeh", "lentil", "chickpea", "edamame", "fish",
    "bacon", "sausage", "ham", "steak",
}
_DAIRY_KEYWORDS = {
    "milk", "cheese", "butter", "cream", "yogurt", "ghee", "parmesan",
    "mozzarella", "cheddar", "feta", "ricotta",
}
_GRAIN_KEYWORDS = {
    "flour", "bread", "pasta", "rice", "oat", "quinoa", "barley", "noodle",
    "tortilla", "cracker", "cereal", "couscous", "polenta",
}
_PANTRY_KEYWORDS = {
    "oil", "salt", "pepper", "sugar", "honey", "sauce", "vinegar", "soy",
    "stock", "broth", "spice", "seasoning", "cumin", "paprika", "cinnamon",
    "oregano", "basil", "thyme", "rosemary", "bay", "mustard", "ketchup",
    "mayo", "sriracha", "paste", "extract", "baking", "yeast",
}


def _categorise(name: str) -> str:
    lower = name.lower()
    for keyword in _PRODUCE_KEYWORDS:
        if keyword in lower:
            return "produce"
    for keyword in _PROTEIN_KEYWORDS:
        if keyword in lower:
            return "protein"
    for keyword in _DAIRY_KEYWORDS:
        if keyword in lower:
            return "dairy"
    for keyword in _GRAIN_KEYWORDS:
        if keyword in lower:
            return "grains"
    for keyword in _PANTRY_KEYWORDS:
        if keyword in lower:
            return "pantry"
    return "other"


def _consolidate_ingredients(meals: list) -> List[Dict[str, Any]]:
    """Merge ingredient lists from all meals, summing quantities for same (name, unit) pairs."""
    totals: Dict[tuple, Dict[str, Any]] = defaultdict(lambda: {"quantity": 0.0})
    for meal in meals:
        for ing in (meal.ingredients_json or []):
            key = (ing["name"].strip().lower(), ing.get("unit", "").strip().lower())
            entry = totals[key]
            entry["name"] = ing["name"].strip()
            entry["unit"] = ing.get("unit", "")
            entry["quantity"] = entry["quantity"] + float(ing.get("quantity", 0))
            entry["category"] = _categorise(ing["name"])
    return [
        {
            "name": v["name"],
            "quantity": v["quantity"],
            "unit": v["unit"],
            "category": v["category"],
        }
        for v in totals.values()
    ]


def _generate_and_store(plan: MealPlan, db: Session) -> GroceryList:
    items = _consolidate_ingredients(plan.meals)
    grocery = GroceryList(meal_plan_id=plan.id, items_json=items)
    db.add(grocery)
    db.commit()
    db.refresh(grocery)
    return grocery


def _grocery_list_to_out(grocery: GroceryList) -> GroceryListOut:
    items = [GroceryItem(**item) for item in (grocery.items_json or [])]
    return GroceryListOut(id=grocery.id, meal_plan_id=grocery.meal_plan_id, items=items)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post("/meal-plans", response_model=MealPlanOut, status_code=201)
def create_meal_plan(
    body: CreateMealPlanRequest,
    db: Session = Depends(get_db),
) -> MealPlan:
    user = db.get(User, body.user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    prefs = user.preferences
    if prefs is None or not prefs.openai_api_key:
        raise HTTPException(
            status_code=422,
            detail="User has no OpenAI API key configured",
        )

    week_start = body.week_start or _next_monday(date.today())

    try:
        meal_dicts = generate_weekly_meals(
            api_key=prefs.openai_api_key,
            household_size=prefs.household_size or 1,
            dietary_prefs=list(prefs.dietary_prefs or []),
            allergies=list(prefs.allergies or []),
            budget=float(prefs.budget) if prefs.budget else None,
            cook_time_minutes=prefs.cook_time_minutes,
            height_cm=prefs.height_cm,
            weight_kg=float(prefs.weight_kg) if prefs.weight_kg else None,
            age=prefs.age,
            sex=prefs.sex,
            activity_level=prefs.activity_level,
            fitness_goal=prefs.fitness_goal,
        )
    except (MealGenerationError, ValueError) as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    # Deactivate any existing active plan for this user before creating a new one
    db.query(MealPlan).filter(
        MealPlan.user_id == body.user_id,
        MealPlan.is_active.is_(True),
    ).update({"is_active": False})

    plan_name = f"Week of {week_start.strftime('%-b %-d')}"
    plan = MealPlan(user_id=body.user_id, week_start=week_start, name=plan_name, is_active=True)
    db.add(plan)
    db.flush()

    for m in meal_dicts:
        db.add(
            Meal(
                meal_plan_id=plan.id,
                day=m["day"],
                meal_type=m["meal_type"],
                name=m["name"],
                description=m.get("description"),
                ingredients_json=m.get("ingredients"),
                calories=m.get("calories"),
                protein_g=m.get("protein_g"),
                carbs_g=m.get("carbs_g"),
                fat_g=m.get("fat_g"),
            )
        )

    db.commit()
    db.refresh(plan)
    return plan


@router.get("/meal-plans/{plan_id}", response_model=MealPlanOut)
def get_meal_plan(plan_id: uuid.UUID, db: Session = Depends(get_db)) -> MealPlan:
    plan = db.get(MealPlan, plan_id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Meal plan not found")
    return plan


@router.get("/users/{user_id}/meal-plans", response_model=List[MealPlanSummary])
def list_user_meal_plans(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> List[MealPlanSummary]:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    plans = (
        db.query(MealPlan)
        .filter(MealPlan.user_id == user_id)
        .order_by(MealPlan.week_start.desc())
        .all()
    )
    return [_plan_to_summary(p) for p in plans]


@router.put("/meal-plans/{plan_id}", response_model=MealPlanSummary)
def update_meal_plan(
    plan_id: uuid.UUID,
    body: UpdateMealPlanRequest,
    db: Session = Depends(get_db),
) -> MealPlanSummary:
    plan = db.get(MealPlan, plan_id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Meal plan not found")

    if body.name is not None:
        plan.name = body.name

    if body.is_active is True:
        db.query(MealPlan).filter(
            MealPlan.user_id == plan.user_id,
            MealPlan.id != plan_id,
        ).update({"is_active": False})
        plan.is_active = True
    elif body.is_active is False:
        plan.is_active = False

    db.commit()
    db.refresh(plan)
    return _plan_to_summary(plan)


@router.get("/meal-plans/{plan_id}/grocery-list", response_model=GroceryListOut)
def get_grocery_list(plan_id: uuid.UUID, db: Session = Depends(get_db)) -> GroceryListOut:
    plan = db.get(MealPlan, plan_id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Meal plan not found")

    if plan.grocery_lists:
        return _grocery_list_to_out(plan.grocery_lists[0])

    grocery = _generate_and_store(plan, db)
    return _grocery_list_to_out(grocery)


@router.post("/meal-plans/{plan_id}/grocery-list/regenerate", response_model=GroceryListOut)
def regenerate_grocery_list(plan_id: uuid.UUID, db: Session = Depends(get_db)) -> GroceryListOut:
    plan = db.get(MealPlan, plan_id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Meal plan not found")

    for existing in plan.grocery_lists:
        db.delete(existing)
    db.flush()

    grocery = _generate_and_store(plan, db)
    return _grocery_list_to_out(grocery)


_VALID_DAYS = {"monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"}
_VALID_MEAL_TYPES = {"breakfast", "lunch", "dinner"}


@router.put("/meal-plans/{plan_id}/meals/{day}/{meal_type}", response_model=MealOut)
def swap_meal(
    plan_id: uuid.UUID,
    day: str,
    meal_type: str,
    db: Session = Depends(get_db),
) -> Meal:
    if day not in _VALID_DAYS:
        raise HTTPException(status_code=422, detail=f"Invalid day: {day!r}")
    if meal_type not in _VALID_MEAL_TYPES:
        raise HTTPException(status_code=422, detail=f"Invalid meal_type: {meal_type!r}")

    plan = db.get(MealPlan, plan_id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Meal plan not found")

    user = db.get(User, plan.user_id)
    prefs = user.preferences if user else None
    if prefs is None or not prefs.openai_api_key:
        raise HTTPException(status_code=422, detail="User has no OpenAI API key configured")

    meal_prefs = MealPreferences(
        household_size=prefs.household_size or 1,
        dietary_prefs=list(prefs.dietary_prefs or []),
        allergies=list(prefs.allergies or []),
        budget=float(prefs.budget) if prefs.budget else None,
        cook_time_minutes=prefs.cook_time_minutes,
    )

    try:
        generated = generate_single_meal(day, meal_type, meal_prefs, api_key=prefs.openai_api_key)
    except MealGenerationError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    meal = (
        db.query(Meal)
        .filter(Meal.meal_plan_id == plan_id, Meal.day == day, Meal.meal_type == meal_type)
        .first()
    )
    if meal is None:
        meal = Meal(meal_plan_id=plan_id, day=day, meal_type=meal_type)
        db.add(meal)

    meal.name = generated.name
    meal.description = generated.description
    meal.ingredients_json = generated.ingredients_json

    db.commit()
    db.refresh(meal)
    return meal
