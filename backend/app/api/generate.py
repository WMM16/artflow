import asyncio
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
import httpx
import io
from app.api.deps import get_db, get_current_user
from app.schemas.generation import (
    TextGenerationRequest, ImageGenerationRequest,
    GenerationResponse, TaskStatus
)
from app.models.generation import Generation, GenerationType, GenerationStatus
from app.models.user import User
from app.core.redis import set_task_status, get_task_status
from app.services.doubao_service import doubao_service
from app.services.minio_service import minio_service
from uuid6 import uuid7
from uuid import UUID

router = APIRouter(prefix="/generate", tags=["generate"])


@router.post("/text", response_model=GenerationResponse)
async def generate_from_text(
    request: TextGenerationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """文生图"""
    # 检查配额
    if current_user.quota_used >= current_user.quota_daily:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Daily quota exceeded"
        )

    # 创建生成记录
    generation = Generation(
        id=uuid7(),
        user_id=current_user.id,
        type=GenerationType.TEXT2IMG,
        prompt=request.prompt,
        negative_prompt=request.negative_prompt,
        width=request.width,
        height=request.height,
        image_count=request.image_count,
        status=GenerationStatus.PENDING
    )
    db.add(generation)
    db.commit()

    # 异步生成图片
    asyncio.create_task(
        _generate_images_task(
            generation.id,
            request.prompt,
            request.negative_prompt,
            request.width,
            request.height,
            request.image_count,
            None,
            None,
            current_user.id
        )
    )

    # 更新用户配额
    current_user.quota_used += request.image_count
    db.commit()

    return GenerationResponse(
        id=generation.id,
        task_id=generation.id,
        status=generation.status,
        created_at=generation.created_at
    )


@router.post("/image", response_model=GenerationResponse)
async def generate_from_image(
    prompt: str = Form(...),
    file: UploadFile = File(...),
    negative_prompt: Optional[str] = Form(None),
    width: int = Form(1024),
    height: int = Form(1024),
    image_count: int = Form(1),
    strength: float = Form(0.7),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """图生图"""
    # 检查配额
    if current_user.quota_used >= current_user.quota_daily:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Daily quota exceeded"
        )

    # 验证文件类型
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files are allowed"
        )

    # 读取图片数据
    image_data = await file.read()

    # 创建生成记录
    generation = Generation(
        id=uuid7(),
        user_id=current_user.id,
        type=GenerationType.IMG2IMG,
        prompt=prompt,
        negative_prompt=negative_prompt,
        width=width,
        height=height,
        image_count=image_count,
        strength=strength,
        status=GenerationStatus.PENDING
    )
    db.add(generation)
    db.commit()

    # 异步生成图片
    asyncio.create_task(
        _generate_images_task(
            generation.id,
            prompt,
            negative_prompt,
            width,
            height,
            image_count,
            strength,
            image_data,
            current_user.id
        )
    )

    # 更新用户配额
    current_user.quota_used += image_count
    db.commit()

    return GenerationResponse(
        id=generation.id,
        task_id=generation.id,
        status=generation.status,
        created_at=generation.created_at
    )


@router.get("/status/{task_id}")
def get_generation_status(
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """查询任务状态"""
    # 先从缓存获取
    cached = get_task_status(str(task_id))
    if cached:
        # Ensure status is string format for consistent response
        cached_copy = cached.copy()
        if isinstance(cached_copy.get('status'), GenerationStatus):
            cached_copy['status'] = cached_copy['status'].value
        return cached_copy

    # 从数据库获取
    generation = db.query(Generation).filter(
        Generation.id == task_id,
        Generation.user_id == current_user.id
    ).first()

    if not generation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    progress = 0
    if generation.status == GenerationStatus.PENDING:
        progress = 0
    elif generation.status == GenerationStatus.PROCESSING:
        progress = 50
    elif generation.status == GenerationStatus.COMPLETED:
        progress = 100

    # Convert datetime to ISO format string for consistent response
    created_at_str = generation.created_at.isoformat() if generation.created_at else None
    completed_at_str = generation.completed_at.isoformat() if generation.completed_at else None

    return {
        "task_id": str(generation.id),
        "status": generation.status.value if isinstance(generation.status, GenerationStatus) else generation.status,
        "progress": progress,
        "result_urls": generation.result_urls if generation.result_urls else None,
        "error_message": generation.error_message,
        "created_at": created_at_str,
        "completed_at": completed_at_str
    }


async def _generate_images_task(
    generation_id: UUID,
    prompt: str,
    negative_prompt: Optional[str],
    width: int,
    height: int,
    image_count: int,
    strength: Optional[float],
    image_data: Optional[bytes],
    user_id: UUID
):
    """后台任务：生成图片"""
    from app.core.database import SessionLocal
    db = SessionLocal()

    try:
        # 更新状态为处理中
        generation = db.query(Generation).filter(Generation.id == generation_id).first()
        generation.status = GenerationStatus.PROCESSING
        db.commit()

        set_task_status(str(generation_id), {
            "task_id": str(generation_id),
            "status": GenerationStatus.PROCESSING,
            "progress": 50,
            "result_urls": None,
            "error_message": None,
            "created_at": generation.created_at.isoformat(),
            "completed_at": None
        })

        # 调用豆包API生成图片
        if image_data and strength is not None:
            # 图生图
            urls = await doubao_service.generate_image_from_image(
                image_data=image_data,
                prompt=prompt,
                negative_prompt=negative_prompt,
                width=width,
                height=height,
                strength=strength,
                n=image_count
            )
        else:
            # 文生图
            urls = await doubao_service.generate_image_from_text(
                prompt=prompt,
                negative_prompt=negative_prompt,
                width=width,
                height=height,
                n=image_count
            )

        # 下载并上传到MinIO
        result_urls = []
        async with httpx.AsyncClient() as client:
            for url in urls:
                try:
                    response = await client.get(url, timeout=30.0)
                    response.raise_for_status()
                    object_name = minio_service.upload_image(response.content)
                    presigned_url = minio_service.get_presigned_url(object_name, expires=86400 * 7)
                    result_urls.append(presigned_url)
                except Exception as e:
                    print(f"Error downloading/uploading image: {e}")
                    result_urls.append(url)  # 使用原始URL

        # 更新完成状态
        generation.result_urls = result_urls
        generation.status = GenerationStatus.COMPLETED
        generation.completed_at = datetime.utcnow()
        db.commit()

        set_task_status(str(generation_id), {
            "task_id": str(generation_id),
            "status": GenerationStatus.COMPLETED,
            "progress": 100,
            "result_urls": result_urls,
            "error_message": None,
            "created_at": generation.created_at.isoformat(),
            "completed_at": generation.completed_at.isoformat()
        })

    except Exception as e:
        generation.status = GenerationStatus.FAILED
        generation.error_message = str(e)
        db.commit()

        set_task_status(str(generation_id), {
            "task_id": str(generation_id),
            "status": GenerationStatus.FAILED,
            "progress": 0,
            "result_urls": None,
            "error_message": str(e),
            "created_at": generation.created_at.isoformat(),
            "completed_at": None
        })

    finally:
        db.close()
