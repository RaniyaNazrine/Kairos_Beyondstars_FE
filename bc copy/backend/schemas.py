from pydantic import BaseModel, Field


class SignupRequest(BaseModel):
    """Request body for signup."""

    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=6, max_length=128)


class LoginRequest(BaseModel):
    """Request body for login."""

    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=6, max_length=128)


class MessageResponse(BaseModel):
    """Generic message response schema."""

    message: str


class TokenResponse(BaseModel):
    """Response body returned after successful login."""

    access_token: str
    token_type: str
    email: str


class ProfileResponse(BaseModel):
    """Response body for profile endpoint."""

    email: str
