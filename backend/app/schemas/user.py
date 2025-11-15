"""User schemas for API requests and responses."""

from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    """Base user schema with common attributes."""

    email: EmailStr
    full_name: str | None = None
    currency: str = "USD"


class UserCreate(UserBase):
    """Schema for creating a new user."""

    password: str


class UserUpdate(BaseModel):
    """Schema for updating a user."""

    email: EmailStr | None = None
    full_name: str | None = None
    currency: str | None = None
    password: str | None = None


class UserResponse(UserBase):
    """Schema for user response (public data only)."""

    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserInDB(UserBase):
    """Schema for user as stored in database (includes password hash)."""

    id: int
    hashed_password: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProfileUpdate(BaseModel):
    """Schema for updating user profile (no password)."""

    full_name: str | None = None
    currency: str | None = None


class PasswordChange(BaseModel):
    """Schema for changing user password."""

    current_password: str
    new_password: str
