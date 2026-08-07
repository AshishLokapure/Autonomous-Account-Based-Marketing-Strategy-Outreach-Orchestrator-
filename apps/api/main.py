# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware

# from app.api.v1.router import api_router
# from app.core.config import get_settings

# settings = get_settings()

# app = FastAPI(
#     title=settings.app_name,
#     version="0.1.0",
#     docs_url="/docs",
#     openapi_url="/openapi.json",
# )

# app.add_middleware(
#     CORSMiddleware,

#     # Stable production domains
#     allow_origins=[
#         "https://innovahack-zeta.vercel.app",
#         "http://localhost:3000",
#     ],

#     # Allow Vercel preview/deployment URLs
#     allow_origin_regex=r"https://.*\.vercel\.app",

#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# app.include_router(api_router, prefix="/api/v1")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    docs_url="/docs",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")