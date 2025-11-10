"""Category schemas for API requests and responses."""

from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.models.category import CategoryType


class CategoryBase(BaseModel):
    """Base category schema with common attributes."""

    name: str = Field(..., min_length=1, max_length=255, description="Category name")
    type: CategoryType = Field(..., description="Category type (income, expense, transfer)")
    icon: str | None = Field(None, max_length=50, description="Icon identifier")
    color: str | None = Field(None, max_length=7, description="Color in hex format (#RRGGBB)")

    @field_validator("color")
    @classmethod
    def validate_color(cls, v: str | None) -> str | None:
        """Validate color is in hex format."""
        if v is not None:
            if not v.startswith("#"):
                v = f"#{v}"
            if len(v) != 7:
                raise ValueError("color must be in hex format (#RRGGBB)")
            # Validate hex characters
            try:
                int(v[1:], 16)
            except ValueError:
                raise ValueError("color must contain valid hex characters") from None
        return v


class CategoryCreate(CategoryBase):
    """Schema for creating a new category."""

    pass


class CategoryUpdate(BaseModel):
    """Schema for updating a category."""

    name: str | None = Field(None, min_length=1, max_length=255)
    type: CategoryType | None = None
    icon: str | None = Field(None, max_length=50)
    color: str | None = Field(None, max_length=7)

    @field_validator("color")
    @classmethod
    def validate_color(cls, v: str | None) -> str | None:
        """Validate color is in hex format."""
        if v is not None:
            if not v.startswith("#"):
                v = f"#{v}"
            if len(v) != 7:
                raise ValueError("color must be in hex format (#RRGGBB)")
            try:
                int(v[1:], 16)
            except ValueError:
                raise ValueError("color must contain valid hex characters") from None
        return v


class CategoryResponse(CategoryBase):
    """Schema for category response."""

    id: int
    user_id: int | None
    is_system: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
