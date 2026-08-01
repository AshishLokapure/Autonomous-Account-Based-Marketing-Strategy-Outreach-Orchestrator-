"""User management endpoints (RBAC-protected)."""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.dependencies import require_roles
from app.core.constants import MANAGEMENT_ROLES
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse

router = APIRouter()


@router.get(
    "",
    response_model=list[UserResponse],
    dependencies=[Depends(require_roles(*MANAGEMENT_ROLES))],
)
def list_users(db: Session = Depends(get_db)) -> list[UserResponse]:
    """List all users. Restricted to Admin and Sales Director roles."""
    users = db.scalars(select(User).order_by(User.id)).all()
    return [UserResponse.model_validate(user) for user in users]
