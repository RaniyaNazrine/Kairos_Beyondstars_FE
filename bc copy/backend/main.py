from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import auth
import models
import schemas
from database import Base, engine, get_db

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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
