from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.contact import Contact


class ContactRepository:
    def list(self, database: Session, account_id: UUID) -> list[Contact]:
        return list(database.scalars(select(Contact).where(Contact.account_id == account_id).order_by(Contact.last_name, Contact.first_name)))

    def get(self, database: Session, account_id: UUID, contact_id: UUID) -> Contact | None:
        return database.scalar(select(Contact).where(Contact.id == contact_id, Contact.account_id == account_id))

    def create(self, database: Session, account_id: UUID, values: dict) -> Contact:
        contact = Contact(account_id=account_id, **values); database.add(contact); database.flush(); return contact
