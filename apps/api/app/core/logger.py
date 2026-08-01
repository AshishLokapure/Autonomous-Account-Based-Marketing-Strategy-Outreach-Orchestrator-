"""Centralized Loguru logger configuration."""

import sys

from loguru import logger

from app.core.config import settings

logger.remove()

logger.add(
    sys.stderr,
    level="DEBUG" if settings.is_development else "INFO",
    format=(
        "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
        "<level>{message}</level>"
    ),
    backtrace=settings.is_development,
    diagnose=settings.is_development,
)

logger.add(
    "logs/app.log",
    level="INFO",
    rotation="10 MB",
    retention="7 days",
    compression="zip",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} | {message}",
)

__all__ = ["logger"]
