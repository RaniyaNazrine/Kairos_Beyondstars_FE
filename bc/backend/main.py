import os
import random
import string
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import auth
import models
import schemas
from database import Base, engine, get_db

# ── Postmark configuration ─────────────────────────────────────────────────
POSTMARK_API_KEY = os.getenv("POSTMARK_API_KEY", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "no-reply@gokulp.online")
OTP_EXPIRE_MINUTES = 15


def _generate_otp(length: int = 6) -> str:
    """Generate a numeric OTP of the given length."""
    return "".join(random.choices(string.digits, k=length))


async def _send_postmark_email(to: str, subject: str, body: str) -> None:
    """Send a transactional email via the Postmark HTTP API."""
    if not POSTMARK_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email service is not configured (missing POSTMARK_API_KEY)",
        )
    payload = {
        "From": FROM_EMAIL,
        "To": to,
        "Subject": subject,
        "TextBody": body,
        "MessageStream": "outbound",
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.postmarkapp.com/email",
            json=payload,
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json",
                "X-Postmark-Server-Token": POSTMARK_API_KEY,
            },
            timeout=10,
        )
    if resp.status_code not in (200, 201):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Postmark error {resp.status_code}: {resp.text}",
        )

# Create FastAPI application instance.
app = FastAPI(title="Beyond Stars API")

# Enable CORS for development (allow all origins).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    """Create database tables automatically when app starts."""
    Base.metadata.create_all(bind=engine)


@app.get("/api/health")
def health_check() -> dict:
    """Simple health check endpoint under /api."""
    return {"status": "ok"}


@app.post("/api/signup", response_model=schemas.MessageResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: schemas.SignupRequest, db: Session = Depends(get_db)):
    """Create a user with unique email and hashed password."""
    normalized_email = payload.email.strip().lower()

    existing_user = db.query(models.User).filter(models.User.email == normalized_email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists")

    new_user = models.User(
        email=normalized_email,
        password_hash=auth.hash_password(payload.password),
    )
    db.add(new_user)
    db.commit()

    return {"message": "Signup successful"}


@app.post("/api/login", response_model=schemas.TokenResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    """Authenticate a user and return a JWT access token."""
    normalized_email = payload.email.strip().lower()
    user = db.query(models.User).filter(models.User.email == normalized_email).first()

    if not user or not auth.verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = auth.create_access_token(data={"sub": user.email})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "email": user.email,
    }


@app.get("/api/profile", response_model=schemas.ProfileResponse)
def profile(current_user: models.User = Depends(auth.get_current_user)):
    """Protected profile endpoint that returns logged-in user's email."""
    return {"email": current_user.email}


@app.post("/api/forgot-password", response_model=schemas.MessageResponse)
async def forgot_password(payload: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Generate a 6-digit OTP and email it via Postmark. Always returns 200."""
    normalized_email = payload.email.strip().lower()

    # Invalidate any existing unused OTPs for this email
    db.query(models.PasswordResetOTP).filter(
        models.PasswordResetOTP.email == normalized_email,
        models.PasswordResetOTP.used == False,  # noqa: E712
    ).update({"used": True})
    db.commit()

    user = db.query(models.User).filter(models.User.email == normalized_email).first()
    if user:
        otp = _generate_otp()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRE_MINUTES)
        record = models.PasswordResetOTP(
            email=normalized_email,
            otp_hash=auth.hash_password(otp),
            expires_at=expires_at,
        )
        db.add(record)
        db.commit()

        body = (
            f"Your Beyond Stars password reset code is: {otp}\n\n"
            f"This code expires in {OTP_EXPIRE_MINUTES} minutes.\n"
            "If you did not request this, you can safely ignore this email."
        )
        await _send_postmark_email(
            to=normalized_email,
            subject="Beyond Stars — Password Reset Code",
            body=body,
        )

    # Always return 200 to prevent email enumeration
    return {"message": "If that email exists, a reset code has been sent."}


@app.post("/api/reset-password", response_model=schemas.MessageResponse)
def reset_password(payload: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    """Verify OTP and update the user's password."""
    normalized_email = payload.email.strip().lower()
    now = datetime.now(timezone.utc)

    record = (
        db.query(models.PasswordResetOTP)
        .filter(
            models.PasswordResetOTP.email == normalized_email,
            models.PasswordResetOTP.used == False,  # noqa: E712
            models.PasswordResetOTP.expires_at > now,
        )
        .order_by(models.PasswordResetOTP.expires_at.desc())
        .first()
    )

    if not record or not auth.verify_password(payload.otp, record.otp_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset code",
        )

    # Mark OTP as used
    record.used = True

    # Update password
    user = db.query(models.User).filter(models.User.email == normalized_email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.password_hash = auth.hash_password(payload.new_password)
    db.commit()

    return {"message": "Password updated successfully"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
