"""Application-wide constants."""

from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    SALES_DIRECTOR = "sales_director"
    ACCOUNT_EXECUTIVE = "account_executive"
    MARKETING_MANAGER = "marketing_manager"
    SALES_REPRESENTATIVE = "sales_representative"


# Roles allowed to manage other users
MANAGEMENT_ROLES = (UserRole.ADMIN, UserRole.SALES_DIRECTOR)
