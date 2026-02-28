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


class ForgotPasswordRequest(BaseModel):
    """Request body for forgot-password — sends OTP email via Postmark."""

    email: str = Field(..., min_length=3, max_length=255)


class ResetPasswordRequest(BaseModel):
    """Request body for password reset — verifies OTP and sets new password."""

    email: str = Field(..., min_length=3, max_length=255)
    otp: str = Field(..., min_length=1, max_length=16)
    new_password: str = Field(..., min_length=8, max_length=128)
