"""Test endpoints for demonstrating error handling."""

from fastapi import APIRouter

from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
    UnauthorizedException,
)

router = APIRouter()


@router.get("/errors/400")
async def test_bad_request() -> None:
    """Test 400 Bad Request error."""
    raise BadRequestException("This is a test bad request error")


@router.get("/errors/401")
async def test_unauthorized() -> None:
    """Test 401 Unauthorized error."""
    raise UnauthorizedException("You must be logged in to access this resource")


@router.get("/errors/403")
async def test_forbidden() -> None:
    """Test 403 Forbidden error."""
    raise ForbiddenException("You don't have permission to access this resource")


@router.get("/errors/404")
async def test_not_found() -> None:
    """Test 404 Not Found error."""
    raise NotFoundException("The requested resource was not found")


@router.get("/errors/409")
async def test_conflict() -> None:
    """Test 409 Conflict error."""
    raise ConflictException("This resource already exists")


@router.get("/errors/500")
async def test_internal_error() -> None:
    """Test 500 Internal Server Error."""
    raise Exception("This is a test unhandled exception")
