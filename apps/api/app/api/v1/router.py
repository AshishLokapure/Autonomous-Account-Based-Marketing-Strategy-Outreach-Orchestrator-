from fastapi import APIRouter

from app.api.v1 import accounts, auth, campaigns, contacts, health, users

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(accounts.router)
api_router.include_router(campaigns.router)
api_router.include_router(contacts.router)
