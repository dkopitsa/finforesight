"""Financial Institution schemas for API requests and responses."""

from datetime import datetime

from pydantic import BaseModel, Field


class FinancialInstitutionBase(BaseModel):
    """Base financial institution schema with common attributes."""

    name: str = Field(..., min_length=1, max_length=255, description="Financial institution name")


class FinancialInstitutionCreate(FinancialInstitutionBase):
    """Schema for creating a new financial institution."""

    pass


class FinancialInstitutionUpdate(BaseModel):
    """Schema for updating a financial institution."""

    name: str | None = Field(
        None, min_length=1, max_length=255, description="Financial institution name"
    )


class FinancialInstitutionResponse(FinancialInstitutionBase):
    """Schema for financial institution response."""

    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
