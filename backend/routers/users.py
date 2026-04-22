import uuid
from decimal import Decimal
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.user_preferences import UserPreferences

router = APIRouter(prefix="/api")


class CreateUserRequest(BaseModel):
    email: Optional[str] = None
    household_size: int = Field(..., ge=1, le=20)
    dietary_prefs: List[str] = Field(default_factory=list)
    allergies: List[str] = Field(default_factory=list)
    budget: Decimal = Field(..., gt=0)
    cook_time_minutes: int = Field(..., ge=5, le=300)
    openai_api_key: Optional[str] = None


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
    )
    db.add(prefs)
    db.commit()
    db.refresh(user)
    return CreateUserResponse(id=str(user.id), email=prefs.email)


@router.get("/users/{user_id}", response_model=UserOut)
def get_user(user_id: uuid.UUID, db: Session = Depends(get_db)) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/users/{user_id}/preferences", response_model=PreferencesOut)
def update_preferences(
    user_id: uuid.UUID,
    body: UpdatePreferencesRequest,
    db: Session = Depends(get_db),
) -> UserPreferences:
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
    return prefs
