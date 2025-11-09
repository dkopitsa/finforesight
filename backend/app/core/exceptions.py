"""Custom exceptions for the application."""


class AppException(Exception):
    """Base exception for application errors."""

    def __init__(self, message: str, status_code: int = 500) -> None:
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class NotFoundException(AppException):
    """Exception raised when a resource is not found."""

    def __init__(self, message: str = "Resource not found") -> None:
        super().__init__(message, status_code=404)


class BadRequestException(AppException):
    """Exception raised for bad requests."""

    def __init__(self, message: str = "Bad request") -> None:
        super().__init__(message, status_code=400)


class UnauthorizedException(AppException):
    """Exception raised when user is not authenticated."""

    def __init__(self, message: str = "Unauthorized") -> None:
        super().__init__(message, status_code=401)


class ForbiddenException(AppException):
    """Exception raised when user doesn't have permission."""

    def __init__(self, message: str = "Forbidden") -> None:
        super().__init__(message, status_code=403)


class ConflictException(AppException):
    """Exception raised when there's a conflict (e.g., duplicate resource)."""

    def __init__(self, message: str = "Conflict") -> None:
        super().__init__(message, status_code=409)


class ValidationException(AppException):
    """Exception raised for validation errors."""

    def __init__(self, message: str = "Validation error", errors: dict | None = None) -> None:
        super().__init__(message, status_code=422)
        self.errors = errors or {}
