from sqlalchemy import Column, String, Text, Integer, Float, DateTime, ForeignKey, Enum, JSON, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from uuid6 import uuid7
from app.core.database import Base


class GenerationType(str, enum.Enum):
    TEXT2IMG = "text2img"
    IMG2IMG = "img2img"


class GenerationStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Generation(Base):
    __tablename__ = "generations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid7)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(Enum(GenerationType), nullable=False)
    prompt = Column(Text, nullable=False)
    negative_prompt = Column(Text, nullable=True)
    width = Column(Integer, default=1024)
    height = Column(Integer, default=1024)
    image_count = Column(Integer, default=1)
    strength = Column(Float, nullable=True)  # For img2img
    status = Column(Enum(GenerationStatus), default=GenerationStatus.PENDING)
    result_urls = Column(JSON, default=list)
    seed = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", backref="generations")