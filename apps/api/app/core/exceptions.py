"""Application exceptions and global exception handlers.

All errors leave the API as a consistent payload:

    {"success": false, "message": "...", "details": [...]}
"""

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.logger import logger


class AppException(Exception):
    """Base class for application errors with a safe user-facing message."""

    status_code: int = status.HTTP_400_BAD_REQUEST
    message: str = "Something went wrong"

    def __init__(self, message: str | None = None, status_code: int | None = None):
        self.message = message or self.message
        self.status_code = status_code or self.status_code
        super().__init__(self.message)


class NotFoundException(AppException):
    status_code = status.HTTP_404_NOT_FOUND
    message = "Resource not found"


class ConflictException(AppException):
    status_code = status.HTTP_409_CONFLICT
    message = "Resource already exists"


class UnauthorizedException(AppException):
    status_code = status.HTTP_401_UNAUTHORIZED
    message = "Invalid credentials"


class ForbiddenException(AppException):
    status_code = status.HTTP_403_FORBIDDEN
    message = "You do not have permission to perform this action"


def _error_response(status_code: int, message: str, details: list | None = None) -> JSONResponse:
    payload: dict = {"success": False, "message": message}
    if details:
        payload["details"] = details
    return JSONResponse(status_code=status_code, content=payload)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        logger.warning(f"{request.method} {request.url.path} -> {exc.status_code}: {exc.message}")
        return _error_response(exc.status_code, exc.message)

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        logger.warning(f"{request.method} {request.url.path} -> {exc.status_code}: {exc.detail}")
        return _error_response(exc.status_code, str(exc.detail))

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        details = [
            {"field": ".".join(str(loc) for loc in error["loc"][1:]), "error": error["msg"]}
            for error in exc.errors()
        ]
        logger.warning(f"{request.method} {request.url.path} -> 422: validation failed")
        return _error_response(
            status.HTTP_422_UNPROCESSABLE_ENTITY, "Validation failed", details
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception(f"Unhandled error on {request.method} {request.url.path}: {exc}")
        return _error_response(
            status.HTTP_500_INTERNAL_SERVER_ERROR, "Internal server error"
        )
