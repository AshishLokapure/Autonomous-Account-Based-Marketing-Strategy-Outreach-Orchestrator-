"""Health check endpoint for Docker and deployment probes."""

from fastapi import APIRouter

from app.core.database import check_database_connection

router = APIRouter()


@router.get("/health")
def health_check() -> dict[str, str]:
    database_connected = check_database_connection()
    return {
        "status": "healthy" if database_connected else "degraded",
        "database": "connected" if database_connected else "disconnected",
    }
