import uuid
from decimal import Decimal
from typing import Any, List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.user_preferences import UserPreferences

router = APIRouter(prefix="/api")

_ACTIVITY_MULTIPLIERS = {
    "sedentary": 1.2,
    "lightly_active": 1.375,
    "moderately_active": 1.55,
    "very_active": 1.725,
    "extra_active": 1.9,
}


def _compute_tdee(
    height_cm: Optional[int],
    weight_kg: Optional[Decimal],
    age: Optional[int],
    sex: Optional[str],
    activity_level: Optional[str],
) -> Optional[int]:
    if any(v is None for v in (height_cm, weight_kg, age, sex, activity_level)):
        return None
    multiplier = _ACTIVITY_MULTIPLIERS.get(activity_level)
    if multiplier is None:
        return None
    w = float(weight_kg)
    h = float(height_cm)
    a = float(age)
    if sex == "male":
        bmr = 10 * w + 6.25 * h - 5 * a + 5
    elif sex == "female":
        bmr = 10 * w + 6.25 * h - 5 * a - 161
    else:
        bmr = 10 * w + 6.25 * h - 5 * a - 78  # average of +5 and -161
    return round(bmr * multiplier)


SexLiteral = Literal["male", "female", "other"]
ActivityLiteral = Literal["sedentary", "lightly_active", "moderately_active", "very_active", "extra_active"]
GoalLiteral = Literal["cut", "bulk", "maintain", "performance"]


class CreateUserRequest(BaseModel):
    email: Optional[str] = None
    household_size: int = Field(..., ge=1, le=20)
    dietary_prefs: List[str] = Field(default_factory=list)
    allergies: List[str] = Field(default_factory=list)
    budget: Decimal = Field(..., gt=0)
    cook_time_minutes: int = Field(..., ge=5, le=300)
    openai_api_key: Optional[str] = None
    height_cm: Optional[int] = Field(None, ge=50, le=300)
    weight_kg: Optional[Decimal] = Field(None, gt=0, le=500)
    age: Optional[int] = Field(None, ge=1, le=120)
    sex: Optional[SexLiteral] = None
    activity_level: Optional[ActivityLiteral] = None
    fitness_goal: Optional[GoalLiteral] = None


class CreateUserResponse(BaseModel):
    id: str
    email: Optional[str] = None


class PreferencesOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    household_size: Optional[int]
    dietary_prefs: Optional[Any]
    allergies: Optional[Any]
    budget: Optional[float]
    cook_time_minutes: Optional[int]
    openai_api_key: Optional[str]
    height_cm: Optional[int] = None
    weight_kg: Optional[float] = None
    age: Optional[int] = None
    sex: Optional[str] = None
    activity_level: Optional[str] = None
    fitness_goal: Optional[str] = None
    tdee_estimate: Optional[int] = None

    @classmethod
    def from_orm_with_tdee(cls, prefs: UserPreferences) -> "PreferencesOut":
        obj = cls.model_validate(prefs)
        obj.tdee_estimate = _compute_tdee(
            prefs.height_cm, prefs.weight_kg, prefs.age, prefs.sex, prefs.activity_level
        )
        return obj


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    preferences: Optional[PreferencesOut]


class UpdatePreferencesRequest(BaseModel):
    household_size: Optional[int] = Field(None, ge=1, le=20)
    dietary_prefs: Optional[List[str]] = None
    allergies: Optional[List[str]] = None
    budget: Optional[Decimal] = Field(None, gt=0)
    cook_time_minutes: Optional[int] = Field(None, ge=5, le=300)
    openai_api_key: Optional[str] = None
    height_cm: Optional[int] = Field(None, ge=50, le=300)
    weight_kg: Optional[Decimal] = Field(None, gt=0, le=500)
    age: Optional[int] = Field(None, ge=1, le=120)
    sex: Optional[SexLiteral] = None
    activity_level: Optional[ActivityLiteral] = None
    fitness_goal: Optional[GoalLiteral] = None


@router.post("/users", response_model=CreateUserResponse, status_code=201)
def create_user(body: CreateUserRequest, db: Session = Depends(get_db)) -> CreateUserResponse:
    user = User()
    db.add(user)
    db.flush()

    prefs = UserPreferences(
        user_id=user.id,
        email=body.email,
        household_size=body.household_size,
        dietary_prefs=body.dietary_prefs,
        allergies=body.allergies,
        budget=body.budget,
        cook_time_minutes=body.cook_time_minutes,
        openai_api_key=body.openai_api_key,
        height_cm=body.height_cm,
        weight_kg=body.weight_kg,
        age=body.age,
        sex=body.sex,
        activity_level=body.activity_level,
        fitness_goal=body.fitness_goal,
    )
    db.add(prefs)
    db.commit()
    db.refresh(user)
    return CreateUserResponse(id=str(user.id), email=prefs.email)


@router.get("/users/{user_id}", response_model=UserOut)
def get_user(user_id: uuid.UUID, db: Session = Depends(get_db)) -> UserOut:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    prefs_out = PreferencesOut.from_orm_with_tdee(user.preferences) if user.preferences else None
    return UserOut(id=user.id, preferences=prefs_out)


@router.put("/users/{user_id}/preferences", response_model=PreferencesOut)
def update_preferences(
    user_id: uuid.UUID,
    body: UpdatePreferencesRequest,
    db: Session = Depends(get_db),
) -> PreferencesOut:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    prefs = user.preferences
    if prefs is None:
        prefs = UserPreferences(user_id=user_id)
        db.add(prefs)

    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(prefs, key, value)

    db.commit()
    db.refresh(prefs)
    return PreferencesOut.from_orm_with_tdee(prefs)
