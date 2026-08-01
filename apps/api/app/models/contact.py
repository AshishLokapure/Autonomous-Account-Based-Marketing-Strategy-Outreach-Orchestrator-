import uuid

from sqlalchemy import ForeignKey, SmallInteger, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import UUIDTimestampMixin


class Contact(UUIDTimestampMixin, Base):
    __tablename__ = "contacts"

    account_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    first_name: Mapped[str] = mapped_column(String(120), nullable=False)
    last_name: Mapped[str] = mapped_column(String(120), nullable=False)
    designation: Mapped[str | None] = mapped_column(String(160))
    department: Mapped[str | None] = mapped_column(String(120))
    email: Mapped[str | None] = mapped_column(String(320))
    phone: Mapped[str | None] = mapped_column(String(50))
    linkedin_url: Mapped[str | None] = mapped_column(String(500))
    stakeholder_type: Mapped[str] = mapped_column(String(50), default="unknown", nullable=False)
    decision_level: Mapped[str] = mapped_column(String(50), default="unknown", nullable=False)
    influence_score: Mapped[int | None] = mapped_column(SmallInteger)
    relationship_score: Mapped[int | None] = mapped_column(SmallInteger)

    account = relationship("Account", back_populates="contacts")
