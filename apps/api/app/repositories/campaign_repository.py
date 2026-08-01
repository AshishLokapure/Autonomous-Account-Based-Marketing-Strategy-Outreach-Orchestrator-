from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.campaign import Campaign


class CampaignRepository:
    def list(self, database: Session, organization_id: UUID) -> list[Campaign]:
        return list(database.scalars(select(Campaign).where(Campaign.organization_id == organization_id).order_by(Campaign.created_at.desc())))

    def get(self, database: Session, organization_id: UUID, campaign_id: UUID) -> Campaign | None:
        return database.scalar(select(Campaign).where(Campaign.id == campaign_id, Campaign.organization_id == organization_id))

    def create(self, database: Session, organization_id: UUID, user_id: UUID, values: dict) -> Campaign:
        campaign = Campaign(organization_id=organization_id, created_by=user_id, **values); database.add(campaign); database.flush(); return campaign
