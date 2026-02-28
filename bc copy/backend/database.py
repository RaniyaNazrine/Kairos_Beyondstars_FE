from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# SQLite database URL. The DB file will be created in the backend folder.
DATABASE_URL = "sqlite:///./beyond_stars.db"

# SQLite requires this flag for usage across multiple threads in FastAPI.
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Session factory used by request-scoped DB sessions.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all SQLAlchemy models.
Base = declarative_base()


def get_db():
    """Reusable database dependency that provides a DB session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
