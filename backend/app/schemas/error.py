"""Error response schemas."""

from pydantic import BaseModel, Field


class ErrorDetail(BaseModel):
    """Single error detail."""

    field: str | None = Field(None, description="Field that caused the error")
    message: str = Field(..., description="Error message")
    type: str | None = Field(None, description="Error type")


class ErrorResponse(BaseModel):
    """Standard error response."""

    error: str = Field(..., description="Error type or title")
    message: str = Field(..., description="Human-readable error message")
    details: list[ErrorDetail] | None = Field(None, description="Detailed error information")
    path: str | None = Field(None, description="Request path that caused the error")
    timestamp: str | None = Field(None, description="ISO 8601 timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "error": "ValidationError",
                "message": "Request validation failed",
                "details": [
                    {"field": "email", "message": "Invalid email format", "type": "value_error"}
                ],
                "path": "/api/v1/auth/register",
                "timestamp": "2025-11-09T12:00:00Z",
            }
        }
