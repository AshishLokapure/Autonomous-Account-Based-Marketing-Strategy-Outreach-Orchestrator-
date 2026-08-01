from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.contact_repository import ContactRepository
from app.services.account_service import AccountService


class ContactService:
    def __init__(self) -> None: self.repository = ContactRepository(); self.accounts = AccountService()

    def create(self, database: Session, organization_id: UUID, account_id: UUID, values: dict):
        self.accounts.get_or_404(database, organization_id, account_id)
        contact = self.repository.create(database, account_id, values); database.commit(); database.refresh(contact); return contact

    def update(self, database: Session, organization_id: UUID, account_id: UUID, contact_id: UUID, values: dict):
        self.accounts.get_or_404(database, organization_id, account_id)
        contact = self.repository.get(database, account_id, contact_id)
        if contact is None: raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
        for field, value in values.items(): setattr(contact, field, value)
        database.commit(); database.refresh(contact); return contact
