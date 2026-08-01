from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import UUIDTimestampMixin


class Organization(UUIDTimestampMixin, Base):
    __tablename__ = "organizations"

    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    industry: Mapped[str | None] = mapped_column(String(120))
    website: Mapped[str | None] = mapped_column(String(500))
    company_size: Mapped[str | None] = mapped_column(String(50))
    country: Mapped[str | None] = mapped_column(String(120))
    subscription_plan: Mapped[str] = mapped_column(String(30), default="free", nullable=False)
    logo_url: Mapped[str | None] = mapped_column(String(500))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    campaigns = relationship("Campaign", back_populates="organization", cascade="all, delete-orphan")
    accounts = relationship("Account", back_populates="organization", cascade="all, delete-orphan")
