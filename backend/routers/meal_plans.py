import uuid
from datetime import date, datetime, timedelta
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.meal import Meal
from app.models.meal_plan import MealPlan
from app.models.user import User
from services.meal_generation import generate_weekly_meals

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


class MealPlanOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    week_start: date
    created_at: datetime
    meals: List[MealOut]


class MealPlanSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    week_start: date
    created_at: datetime


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
        )
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    plan = MealPlan(user_id=body.user_id, week_start=week_start)
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
) -> list[MealPlan]:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    plans = (
        db.query(MealPlan)
        .filter(MealPlan.user_id == user_id)
        .order_by(MealPlan.created_at.desc())
        .all()
    )
    return plans
