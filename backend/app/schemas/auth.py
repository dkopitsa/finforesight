"""Authentication schemas for API requests and responses."""

from pydantic import BaseModel, EmailStr

from app.schemas.user import UserResponse


class LoginRequest(BaseModel):
    """Schema for login request."""

    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    """Schema for user registration request."""

    email: EmailStr
    password: str
    full_name: str | None = None
    currency: str = "USD"


class TokenResponse(BaseModel):
    """Schema for token response."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefreshRequest(BaseModel):
    """Schema for token refresh request."""

    refresh_token: str


class TokenRefreshResponse(BaseModel):
    """Schema for token refresh response."""

    access_token: str
    token_type: str = "bearer"


class AuthResponse(BaseModel):
    """Schema for authentication response (includes user data and tokens)."""

    user: UserResponse
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
