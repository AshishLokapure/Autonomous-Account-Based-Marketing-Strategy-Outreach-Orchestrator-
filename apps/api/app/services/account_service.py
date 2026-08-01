from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.account_repository import AccountRepository


class AccountService:
    def __init__(self) -> None: self.repository = AccountRepository()

    def get_or_404(self, database: Session, organization_id: UUID, account_id: UUID):
        account = self.repository.get(database, organization_id, account_id)
        if account is None: raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
        return account

    def create(self, database: Session, organization_id: UUID, values: dict):
        account = self.repository.create(database, organization_id, values); database.commit(); database.refresh(account); return account

    def update(self, database: Session, organization_id: UUID, account_id: UUID, values: dict):
        account = self.get_or_404(database, organization_id, account_id)
        for field, value in values.items(): setattr(account, field, value)
        database.commit(); database.refresh(account); return account

    def delete(self, database: Session, organization_id: UUID, account_id: UUID) -> None:
        self.repository.delete(database, self.get_or_404(database, organization_id, account_id)); database.commit()
