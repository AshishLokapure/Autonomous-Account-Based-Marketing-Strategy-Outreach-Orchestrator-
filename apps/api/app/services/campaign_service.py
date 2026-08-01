from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.campaign_repository import CampaignRepository


class CampaignService:
    def __init__(self) -> None: self.repository = CampaignRepository()

    def get_or_404(self, database: Session, organization_id: UUID, campaign_id: UUID):
        campaign = self.repository.get(database, organization_id, campaign_id)
        if campaign is None: raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
        return campaign

    def create(self, database: Session, organization_id: UUID, user_id: UUID, values: dict):
        campaign = self.repository.create(database, organization_id, user_id, values); database.commit(); database.refresh(campaign); return campaign

    def update(self, database: Session, organization_id: UUID, campaign_id: UUID, values: dict):
        campaign = self.get_or_404(database, organization_id, campaign_id)
        for field, value in values.items(): setattr(campaign, field, value)
        database.commit(); database.refresh(campaign); return campaign
