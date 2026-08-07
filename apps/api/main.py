from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings

settings = get_settings()

# Create the actual FastAPI application
fastapi_app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    docs_url="/docs",
    openapi_url="/openapi.json",
)

# API routes
fastapi_app.include_router(api_router, prefix="/api/v1")


@fastapi_app.get("/")
async def root():
    return {
        "status": "ok",
        "service": "AccountPilot AI"
    }


# IMPORTANT:
# CORS wraps the ENTIRE FastAPI application.
app = CORSMiddleware(
    app=fastapi_app,
    allow_origins=[
        "https://innovahack-zeta.vercel.app",
    ],
    allow_origin_regex=r"https://[a-zA-Z0-9-]+\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)