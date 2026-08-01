import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import UUIDTimestampMixin


class Campaign(UUIDTimestampMixin, Base):
    __tablename__ = "campaigns"

    organization_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    campaign_name: Mapped[str] = mapped_column(String(255), nullable=False)
    campaign_goal: Mapped[str | None] = mapped_column(Text)
    product_name: Mapped[str | None] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(30), default="draft", nullable=False)
    budget: Mapped[float | None] = mapped_column(Numeric(14, 2))
    target_industries: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)
    target_countries: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)
    target_company_size: Mapped[str | None] = mapped_column(String(50))
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)

    organization = relationship("Organization", back_populates="campaigns")
    accounts = relationship("Account", back_populates="campaign")
