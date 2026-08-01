from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_organization_id
from app.core.database import get_db
from app.repositories.account_repository import AccountRepository
from app.schemas.account import AccountCreate, AccountResponse, AccountUpdate
from app.services.account_service import AccountService

router = APIRouter(prefix="/accounts", tags=["accounts"]); service = AccountService(); repository = AccountRepository()

@router.get("", response_model=list[AccountResponse])
def list_accounts(organization_id: UUID = Depends(get_organization_id), database: Session = Depends(get_db)): return repository.list(database, organization_id)
@router.get("/{account_id}", response_model=AccountResponse)
def get_account(account_id: UUID, organization_id: UUID = Depends(get_organization_id), database: Session = Depends(get_db)): return service.get_or_404(database, organization_id, account_id)
@router.post("", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
def create_account(payload: AccountCreate, organization_id: UUID = Depends(get_organization_id), database: Session = Depends(get_db)): return service.create(database, organization_id, payload.model_dump(exclude_none=True, mode="json"))
@router.put("/{account_id}", response_model=AccountResponse)
def update_account(account_id: UUID, payload: AccountUpdate, organization_id: UUID = Depends(get_organization_id), database: Session = Depends(get_db)): return service.update(database, organization_id, account_id, payload.model_dump(exclude_unset=True, mode="json"))
@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(account_id: UUID, organization_id: UUID = Depends(get_organization_id), database: Session = Depends(get_db)): service.delete(database, organization_id, account_id); return Response(status_code=status.HTTP_204_NO_CONTENT)
