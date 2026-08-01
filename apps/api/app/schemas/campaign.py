from datetime import date
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ORMResponse


class CampaignCreate(BaseModel):
    campaign_name: str = Field(min_length=1, max_length=255)
    campaign_goal: str | None = None
    product_name: str | None = None
    description: str | None = None
    budget: float | None = Field(default=None, ge=0)
    target_industries: list[str] = []
    target_countries: list[str] = []
    target_company_size: str | None = None
    start_date: date | None = None
    end_date: date | None = None


class CampaignUpdate(CampaignCreate):
    campaign_name: str | None = Field(default=None, min_length=1, max_length=255)
    status: str | None = None


class CampaignResponse(ORMResponse):
    organization_id: UUID
    campaign_name: str
    status: str
    budget: float | None
