import uuid
from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api")


class CreateUserRequest(BaseModel):
    household_size: int = Field(..., ge=1, le=20)
    dietary_prefs: List[str] = Field(default_factory=list)
    allergies: List[str] = Field(default_factory=list)
    budget: Decimal = Field(..., gt=0)
    cook_time_minutes: int = Field(..., ge=5, le=300)
    openai_api_key: Optional[str] = None


class CreateUserResponse(BaseModel):
    id: str


@router.post("/users", response_model=CreateUserResponse, status_code=201)
def create_user(body: CreateUserRequest) -> CreateUserResponse:
    return CreateUserResponse(id=str(uuid.uuid4()))
