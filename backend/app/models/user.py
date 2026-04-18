from sqlalchemy import Column, String, Boolean, Integer, DateTime, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from uuid6 import uuid7
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid7)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    nickname = Column(String(100), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    quota_daily = Column(Integer, default=10)
    quota_used = Column(Integer, default=0)

    # 父子账号关系
    parent_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # 关系定义
    children = relationship("User", backref="parent", remote_side=[id])
    generations = None  # Will be set by relationship in Generation model