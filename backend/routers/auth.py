import uuid
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user_preferences import UserPreferences

router = APIRouter(prefix="/api/auth")


class LoginRequest(BaseModel):
    email: str


class PreferencesOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    email: Optional[str]
    household_size: Optional[int]
    dietary_prefs: Optional[Any]
    allergies: Optional[Any]
    budget: Optional[float]
    cook_time_minutes: Optional[int]


class LoginResponse(BaseModel):
    user_id: str
    email: str
    preferences: Optional[PreferencesOut]


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    prefs = db.query(UserPreferences).filter(UserPreferences.email == body.email).first()
    if prefs is None:
        raise HTTPException(status_code=404, detail="User not found")
    return LoginResponse(
        user_id=str(prefs.user_id),
        email=prefs.email,
        preferences=prefs,
    )


@router.get("/me", response_model=LoginResponse)
def me(
    x_user_id: Optional[str] = Header(None),
    user_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
) -> LoginResponse:
    uid_str = x_user_id or user_id
    if not uid_str:
        raise HTTPException(status_code=401, detail="No user_id provided")
    try:
        uid = uuid.UUID(uid_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user_id")
    prefs = db.get(UserPreferences, uid)
    if prefs is None:
        raise HTTPException(status_code=404, detail="User not found")
    return LoginResponse(
        user_id=str(prefs.user_id),
        email=prefs.email or "",
        preferences=prefs,
    )
