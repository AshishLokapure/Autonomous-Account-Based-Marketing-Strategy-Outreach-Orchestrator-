from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_organization_id
from app.core.database import get_db
from app.repositories.contact_repository import ContactRepository
from app.schemas.contact import ContactCreate, ContactResponse, ContactUpdate
from app.services.contact_service import ContactService

router = APIRouter(prefix="/accounts/{account_id}/contacts", tags=["contacts"]); service = ContactService(); repository = ContactRepository()
@router.get("", response_model=list[ContactResponse])
def list_contacts(account_id: UUID, organization_id: UUID = Depends(get_organization_id), database: Session = Depends(get_db)): service.accounts.get_or_404(database, organization_id, account_id); return repository.list(database, account_id)
@router.post("", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
def create_contact(account_id: UUID, payload: ContactCreate, organization_id: UUID = Depends(get_organization_id), database: Session = Depends(get_db)): return service.create(database, organization_id, account_id, payload.model_dump(mode="json"))
@router.put("/{contact_id}", response_model=ContactResponse)
def update_contact(account_id: UUID, contact_id: UUID, payload: ContactUpdate, organization_id: UUID = Depends(get_organization_id), database: Session = Depends(get_db)): return service.update(database, organization_id, account_id, contact_id, payload.model_dump(exclude_unset=True, mode="json"))
