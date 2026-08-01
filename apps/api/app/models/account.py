import uuid

from sqlalchemy import ForeignKey, Integer, Numeric, SmallInteger, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import UUIDTimestampMixin


class Account(UUIDTimestampMixin, Base):
    __tablename__ = "accounts"

    organization_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    campaign_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="SET NULL"), index=True)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    website: Mapped[str | None] = mapped_column(String(500))
    industry: Mapped[str | None] = mapped_column(String(120))
    headquarters: Mapped[str | None] = mapped_column(String(255))
    employee_count: Mapped[int | None] = mapped_column(Integer)
    annual_revenue: Mapped[float | None] = mapped_column(Numeric(18, 2))
    crm_stage: Mapped[str] = mapped_column(String(30), default="target", nullable=False)
    priority: Mapped[str] = mapped_column(String(20), default="medium", nullable=False)
    health_score: Mapped[int | None] = mapped_column(SmallInteger)
    relationship_score: Mapped[int | None] = mapped_column(SmallInteger)
    notes: Mapped[str | None] = mapped_column(Text)

    organization = relationship("Organization", back_populates="accounts")
    campaign = relationship("Campaign", back_populates="accounts")
    contacts = relationship("Contact", back_populates="account", cascade="all, delete-orphan")
