from fastapi import APIRouter
from pydantic import BaseModel
from openai import OpenAI, AuthenticationError, PermissionDeniedError

router = APIRouter(prefix="/api")


class ValidateKeyRequest(BaseModel):
    api_key: str


class ValidateKeyResponse(BaseModel):
    valid: bool
    error: str | None


@router.post("/validate-key", response_model=ValidateKeyResponse)
def validate_key(body: ValidateKeyRequest) -> ValidateKeyResponse:
    try:
        client = OpenAI(api_key=body.api_key)
        client.models.list()
        return ValidateKeyResponse(valid=True, error=None)
    except AuthenticationError:
        return ValidateKeyResponse(valid=False, error="Invalid API key")
    except PermissionDeniedError:
        return ValidateKeyResponse(valid=False, error="API key lacks required permissions")
    except Exception as e:
        return ValidateKeyResponse(valid=False, error=str(e))
