"""Business logic for authentication."""

from sqlalchemy.orm import Session

from app.auth.hashing import hash_password, verify_password
from app.auth.jwt import create_access_token
from app.core.exceptions import ConflictException, UnauthorizedException
from app.core.logger import logger
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import Token, UserCreate, UserResponse


class AuthService:
    def __init__(self, db: Session):
        self.repository = UserRepository(db)

    def register(self, payload: UserCreate) -> UserResponse:
        if self.repository.get_by_email(payload.email):
            logger.warning(f"Registration rejected — email already exists: {payload.email}")
            raise ConflictException("A user with this email already exists")

        user = User(
            full_name=payload.full_name,
            email=payload.email,
            password_hash=hash_password(payload.password),
            role=payload.role,
        )
        user = self.repository.create(user)
        logger.info(f"User registered: {user.email} (role={user.role.value})")
        return UserResponse.model_validate(user)

    def login(self, email: str, password: str) -> Token:
        user = self.repository.get_by_email(email)
        if user is None or not verify_password(password, user.password_hash):
            logger.warning(f"Authentication failed for: {email}")
            raise UnauthorizedException("Invalid credentials")
        if not user.is_active:
            raise UnauthorizedException("Account is deactivated")

        token = create_access_token(subject=str(user.id), extra_claims={"role": user.role.value})
        logger.info(f"User logged in: {user.email}")
        return Token(access_token=token, user=UserResponse.model_validate(user))
