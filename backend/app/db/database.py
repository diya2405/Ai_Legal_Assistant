import os
import shutil
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

if os.getenv("VERCEL"):
    tmp_db_path = "/tmp/legalaid.db"
    # Copy pre-seeded production database to /tmp if not present or uninitialized
    if not os.path.exists(tmp_db_path) or os.path.getsize(tmp_db_path) < 10000:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        source_db = os.path.join(base_dir, "legalaid.db")
        if os.path.exists(source_db):
            try:
                shutil.copy2(source_db, tmp_db_path)
            except Exception as e:
                print(f"[DB] Copy to /tmp error: {e}")
    DATABASE_URL = f"sqlite:///{tmp_db_path}"
else:
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./legalaid.db")

# Sqlite requires check_same_thread=False for multithreaded FastAPI requests
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    engine = create_engine(DATABASE_URL, connect_args=connect_args)
else:
    engine = create_engine(
        DATABASE_URL,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
