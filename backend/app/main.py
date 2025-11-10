import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError

from app.api.router import api_router
from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.errors import (
    app_exception_handler,
    database_exception_handler,
    generic_exception_handler,
    validation_exception_handler,
)
from app.core.exceptions import AppException
from app.core.logging import setup_logging
from app.core.seed_categories import seed_categories

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan events."""
    # Startup
    setup_logging()
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}")
    logger.info(f"Environment: {'Development' if settings.DEBUG else 'Production'}")

    # Seed system categories
    async with AsyncSessionLocal() as db:
        await seed_categories(db)

    yield

    # Shutdown
    logger.info(f"Shutting down {settings.PROJECT_NAME}")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url=f"{settings.API_V1_PREFIX}/docs",
    redoc_url=f"{settings.API_V1_PREFIX}/redoc",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register exception handlers
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(ValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, database_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to FinForesight API",
        "docs": f"{settings.API_V1_PREFIX}/docs",
    }
