import uuid
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.meal import Meal
from app.models.meal_feedback import MealFeedback
from app.models.meal_plan import MealPlan

router = APIRouter(prefix="/api")

VALID_RATINGS = {"liked", "disliked"}


class FeedbackRequest(BaseModel):
    rating: Literal["liked", "disliked"]


class FeedbackOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    meal_name: str
    rating: str


@router.post("/meals/{meal_id}/feedback", response_model=FeedbackOut, status_code=201)
def submit_meal_feedback(
    meal_id: uuid.UUID,
    body: FeedbackRequest,
    db: Session = Depends(get_db),
) -> MealFeedback:
    meal = db.get(Meal, meal_id)
    if meal is None:
        raise HTTPException(status_code=404, detail="Meal not found")

    plan = db.get(MealPlan, meal.meal_plan_id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Meal plan not found")

    feedback = MealFeedback(
        user_id=plan.user_id,
        meal_name=meal.name,
        rating=body.rating,
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback
