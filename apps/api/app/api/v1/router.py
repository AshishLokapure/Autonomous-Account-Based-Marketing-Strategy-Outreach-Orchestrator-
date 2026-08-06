from fastapi import APIRouter

from app.api.v1 import accounts, agent_runs, agents, auth, campaign_pipeline, campaigns, contacts, health, users, outreach, settings

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(settings.router, prefix="/settings", tags=["Settings"])
api_router.include_router(settings.logs_router, prefix="/email-logs", tags=["Email Logs"])
api_router.include_router(accounts.router)
api_router.include_router(campaigns.router)
api_router.include_router(contacts.router)
api_router.include_router(campaign_pipeline.router)
api_router.include_router(agents.router)
api_router.include_router(agent_runs.router)
api_router.include_router(outreach.router)
