from uuid import UUID

from fastapi import Header, HTTPException, status


def get_organization_id(x_organization_id: UUID | None = Header(default=None)) -> UUID:
    """Temporary tenant context until Supabase JWT claim extraction is connected."""
    if x_organization_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="X-Organization-ID header is required")
    return x_organization_id


def get_user_id(x_user_id: UUID | None = Header(default=None)) -> UUID:
    if x_user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="X-User-ID header is required")
    return x_user_id
