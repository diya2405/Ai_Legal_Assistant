from fastapi import APIRouter
from app.db import check_db_connection

router = APIRouter()


@router.get("/health")
async def health_check():
    """Health check endpoint that verifies database connectivity."""
    db_connected = await check_db_connection()
    
    if db_connected:
        return {
            "status": "ok",
            "db": "connected",
            "service": "legalaid-backend",
            "version": "1.0.0",
        }
    else:
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=503,
            content={
                "status": "degraded",
                "db": "disconnected",
                "service": "legalaid-backend",
                "version": "1.0.0",
            },
        )
