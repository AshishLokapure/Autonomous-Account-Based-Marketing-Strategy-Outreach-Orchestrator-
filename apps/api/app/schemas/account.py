from uuid import UUID

from pydantic import AnyHttpUrl, BaseModel, ConfigDict, Field

from app.schemas.common import ORMResponse


class AccountCreate(BaseModel):
    company_name: str = Field(min_length=1, max_length=255)
    campaign_id: UUID | None = None
    website: AnyHttpUrl | None = None
    industry: str | None = Field(default=None, max_length=120)
    headquarters: str | None = None
    employee_count: int | None = Field(default=None, ge=0)
    annual_revenue: float | None = Field(default=None, ge=0)
    crm_stage: str = "target"
    priority: str = "medium"
    health_score: int | None = Field(default=None, ge=0, le=100)
    relationship_score: int | None = Field(default=None, ge=0, le=100)
    notes: str | None = None


class AccountUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    company_name: str | None = Field(default=None, min_length=1, max_length=255)
    campaign_id: UUID | None = None
    industry: str | None = None
    crm_stage: str | None = None
    priority: str | None = None
    health_score: int | None = Field(default=None, ge=0, le=100)
    relationship_score: int | None = Field(default=None, ge=0, le=100)
    notes: str | None = None


class AccountResponse(ORMResponse):
    organization_id: UUID
    campaign_id: UUID | None
    company_name: str
    website: AnyHttpUrl | None
    industry: str | None
    crm_stage: str
    priority: str
    health_score: int | None
    relationship_score: int | None
