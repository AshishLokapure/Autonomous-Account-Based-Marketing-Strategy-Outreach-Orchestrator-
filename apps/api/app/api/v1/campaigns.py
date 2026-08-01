from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_organization_id, get_user_id
from app.core.database import get_db
from app.repositories.campaign_repository import CampaignRepository
from app.schemas.campaign import CampaignCreate, CampaignResponse, CampaignUpdate
from app.services.campaign_service import CampaignService

router = APIRouter(prefix="/campaigns", tags=["campaigns"]); service = CampaignService(); repository = CampaignRepository()
@router.get("", response_model=list[CampaignResponse])
def list_campaigns(organization_id: UUID = Depends(get_organization_id), database: Session = Depends(get_db)): return repository.list(database, organization_id)
@router.post("", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
def create_campaign(payload: CampaignCreate, organization_id: UUID = Depends(get_organization_id), user_id: UUID = Depends(get_user_id), database: Session = Depends(get_db)): return service.create(database, organization_id, user_id, payload.model_dump(mode="json"))
@router.put("/{campaign_id}", response_model=CampaignResponse)
def update_campaign(campaign_id: UUID, payload: CampaignUpdate, organization_id: UUID = Depends(get_organization_id), database: Session = Depends(get_db)): return service.update(database, organization_id, campaign_id, payload.model_dump(exclude_unset=True, mode="json"))
