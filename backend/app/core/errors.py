"""Error handlers for the application."""

import logging
import traceback
from datetime import UTC, datetime

from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.core.exceptions import AppException
from app.schemas.error import ErrorDetail, ErrorResponse

logger = logging.getLogger(__name__)


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Handle custom application exceptions."""
    logger.warning(
        f"Application exception: {exc.message}",
        extra={"path": request.url.path, "status_code": exc.status_code},
    )

    error_response = ErrorResponse(
        error=exc.__class__.__name__,
        message=exc.message,
        path=request.url.path,
        timestamp=datetime.now(UTC).isoformat(),
    )

    # Add validation details if available
    if hasattr(exc, "errors") and exc.errors:
        error_response.details = [
            ErrorDetail(field=field, message=message, type="validation_error")
            for field, message in exc.errors.items()
        ]

    return JSONResponse(
        status_code=exc.status_code,
        content=error_response.model_dump(exclude_none=True),
    )


async def validation_exception_handler(
    request: Request, exc: RequestValidationError | ValidationError
) -> JSONResponse:
    """Handle Pydantic validation errors."""
    logger.warning(
        "Validation error",
        extra={"path": request.url.path, "errors": exc.errors()},
    )

    details = []
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error["loc"][1:]) if len(error["loc"]) > 1 else None
        details.append(
            ErrorDetail(
                field=field,
                message=error["msg"],
                type=error["type"],
            )
        )

    error_response = ErrorResponse(
        error="ValidationError",
        message="Request validation failed",
        details=details,
        path=request.url.path,
        timestamp=datetime.now(UTC).isoformat(),
    )

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=error_response.model_dump(exclude_none=True),
    )


async def database_exception_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    """Handle SQLAlchemy database errors."""
    logger.error(
        f"Database error: {str(exc)}",
        extra={"path": request.url.path},
        exc_info=True,
    )

    # Handle integrity constraint violations (e.g., unique constraint)
    if isinstance(exc, IntegrityError):
        message = "A record with this data already exists"
        if "unique constraint" in str(exc).lower():
            message = "This resource already exists"
        elif "foreign key constraint" in str(exc).lower():
            message = "Referenced resource not found"

        error_response = ErrorResponse(
            error="IntegrityError",
            message=message,
            path=request.url.path,
            timestamp=datetime.now(UTC).isoformat(),
        )

        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content=error_response.model_dump(exclude_none=True),
        )

    # Generic database error
    error_response = ErrorResponse(
        error="DatabaseError",
        message="A database error occurred",
        path=request.url.path,
        timestamp=datetime.now(UTC).isoformat(),
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=error_response.model_dump(exclude_none=True),
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle all uncaught exceptions."""
    logger.error(
        f"Unhandled exception: {str(exc)}",
        extra={"path": request.url.path, "traceback": traceback.format_exc()},
        exc_info=True,
    )

    error_response = ErrorResponse(
        error="InternalServerError",
        message="An unexpected error occurred",
        path=request.url.path,
        timestamp=datetime.now(UTC).isoformat(),
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=error_response.model_dump(exclude_none=True),
    )
