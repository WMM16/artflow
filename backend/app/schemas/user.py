from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class UserBase(BaseModel):
    email: EmailStr
    nickname: Optional[str] = None
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    nickname: Optional[str] = None
    avatar_url: Optional[str] = None


class UserInDB(UserBase):
    id: UUID
    is_admin: bool
    is_active: bool
    quota_daily: int
    quota_used: int
    parent_id: Optional[UUID] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserResponse(UserBase):
    id: UUID
    is_admin: bool
    is_active: bool
    quota_daily: int
    quota_used: int
    parent_id: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserAdminUpdate(BaseModel):
    is_active: Optional[bool] = None
    quota_daily: Optional[int] = None


# 子账号相关 Schema
class SubAccountCreate(BaseModel):
    email: EmailStr
    nickname: Optional[str] = None
    password: str = Field(..., min_length=6)
    quota_daily: int = Field(default=10, ge=1, le=1000)


class SubAccountUpdate(BaseModel):
    nickname: Optional[str] = None
    is_active: Optional[bool] = None
    quota_daily: Optional[int] = Field(None, ge=1, le=1000)
    password: Optional[str] = Field(None, min_length=6)


class SubAccountResponse(UserResponse):
    children_count: Optional[int] = 0


class PasswordChange(BaseModel):
    old_password: str
    new_password: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    type: Optional[str] = None
