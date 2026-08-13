import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base
from app.db.seed_kb import seed_data
from app.api.routes import router

# Initialize database schema and seed data on startup
Base.metadata.create_all(bind=engine)
try:
    seed_data()
except Exception as e:
    print(f"[SEED] Info: {e}")

app = FastAPI(
    title="LegalAId API",
    description="AI Legal Rights Assistant for First-Generation Litigants",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
def root():
    return {
        "message": "Welcome to LegalAId API",
        "docs": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
