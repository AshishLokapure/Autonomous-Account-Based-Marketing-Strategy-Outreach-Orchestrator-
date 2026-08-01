from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.schemas.common import ORMResponse


class ContactCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=120)
    last_name: str = Field(min_length=1, max_length=120)
    designation: str | None = None
    department: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    stakeholder_type: str = "unknown"
    decision_level: str = "unknown"
    influence_score: int | None = Field(default=None, ge=0, le=100)
    relationship_score: int | None = Field(default=None, ge=0, le=100)


class ContactUpdate(ContactCreate):
    first_name: str | None = Field(default=None, min_length=1, max_length=120)
    last_name: str | None = Field(default=None, min_length=1, max_length=120)


class ContactResponse(ORMResponse):
    account_id: UUID
    first_name: str
    last_name: str
    email: EmailStr | None
    stakeholder_type: str
    decision_level: str
