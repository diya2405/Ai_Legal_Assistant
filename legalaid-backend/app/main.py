from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import json

from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from app.config import settings
from app.db import check_db_connection, engine
from app.core.rate_limit import limiter
from app.routers import health, session, intake, classification, explanation, document, chat

# Configure structured JSON logging
class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if hasattr(record, "session_id"):
            log_record["session_id"] = record.session_id
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_record)


handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())
logging.basicConfig(level=logging.INFO, handlers=[handler])
logger = logging.getLogger("legalaid")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    logger.info("LegalAId backend starting up...")
    
    # Check DB connection on startup
    db_connected = await check_db_connection()
    if db_connected:
        logger.info("Database connection verified successfully")
    else:
        logger.error("Database connection failed on startup")
    
    yield
    
    # Shutdown
    logger.info("LegalAId backend shutting down...")
    await engine.dispose()


# Create FastAPI application
app = FastAPI(
    title="LegalAId",
    description="AI Legal Rights Assistant for First-Generation Litigants",
    version="1.0.0",
    lifespan=lifespan,
)

# Attach rate limiter to app state & add exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(session.router, prefix="/api", tags=["session"])
app.include_router(intake.router, prefix="/api", tags=["intake"])
app.include_router(classification.router, prefix="/api", tags=["classification"])
app.include_router(explanation.router, prefix="/api", tags=["explanation"])
app.include_router(document.router, prefix="/api", tags=["document"])
app.include_router(chat.router, prefix="/api", tags=["chat"])


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred. Please try again later."},
    )
