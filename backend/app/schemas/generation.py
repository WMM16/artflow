from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID
import enum


class GenerationType(str, enum.Enum):
    TEXT2IMG = "text2img"
    IMG2IMG = "img2img"
    TEXT2TEXT = "text2text"


class GenerationStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class TextGenerationRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000)
    negative_prompt: Optional[str] = Field(None, max_length=1000)
    width: int = Field(1024, ge=512, le=2048)
    height: int = Field(1024, ge=512, le=2048)
    image_count: int = Field(1, ge=1, le=4)


class ImageGenerationRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000)
    negative_prompt: Optional[str] = Field(None, max_length=1000)
    width: int = Field(1024, ge=512, le=2048)
    height: int = Field(1024, ge=512, le=2048)
    image_count: int = Field(1, ge=1, le=4)
    strength: float = Field(0.7, ge=0.1, le=1.0)


class GenerationResponse(BaseModel):
    id: UUID
    task_id: UUID
    status: GenerationStatus
    created_at: datetime

    class Config:
        from_attributes = True


class GenerationResult(BaseModel):
    id: UUID
    type: GenerationType
    prompt: str
    negative_prompt: Optional[str]
    width: int
    height: int
    image_count: int
    strength: Optional[float]
    status: GenerationStatus
    result_urls: List[str]
    seed: Optional[int]
    error_message: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class TaskStatus(BaseModel):
    task_id: UUID
    status: GenerationStatus
    progress: int = Field(0, ge=0, le=100)
    result_urls: Optional[List[str]] = None
    error_message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class HistoryFilter(BaseModel):
    type: Optional[GenerationType] = None
    days: Optional[int] = None
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)


# 文生文相关 Schema
class Text2TextMode(str, enum.Enum):
    WRITE = "write"           # 文章写作
    CONTINUE = "continue"     # 续写
    POLISH = "polish"         # 润色
    SUMMARY = "summary"       # 摘要
    TRANSLATE = "translate"   # 翻译
    CREATIVE = "creative"     # 创意写作
    CODE = "code"             # 代码生成
    CHAT = "chat"             # 自由对话


class Text2TextRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=5000, description="输入提示")
    mode: Text2TextMode = Field(Text2TextMode.WRITE, description="生成模式")
    temperature: float = Field(0.7, ge=0.0, le=1.0, description="创意程度(0-1)")
    max_tokens: int = Field(2000, ge=100, le=4000, description="最大生成字数")


class Text2TextResponse(BaseModel):
    id: UUID
    content: str
    mode: Text2TextMode
    usage: dict
    created_at: datetime

    class Config:
        from_attributes = True
