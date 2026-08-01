from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.account import Account


class AccountRepository:
    def list(self, database: Session, organization_id: UUID) -> list[Account]:
        return list(database.scalars(select(Account).where(Account.organization_id == organization_id).order_by(Account.company_name)))

    def get(self, database: Session, organization_id: UUID, account_id: UUID) -> Account | None:
        return database.scalar(select(Account).where(Account.id == account_id, Account.organization_id == organization_id))

    def create(self, database: Session, organization_id: UUID, values: dict) -> Account:
        account = Account(organization_id=organization_id, **values); database.add(account); database.flush(); return account

    def delete(self, database: Session, account: Account) -> None:
        database.delete(account)
