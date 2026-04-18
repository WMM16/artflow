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
    GenerationResponse, TaskStatus,
    Text2TextRequest, Text2TextResponse, Text2TextMode
)
from app.models.generation import Generation, GenerationType, GenerationStatus
from app.models.user import User
from app.core.redis import set_task_status, get_task_status
from app.services.doubao_service import doubao_service
from app.services.storage_service import minio_service
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


@router.post("/text2text", response_model=Text2TextResponse)
async def generate_text_to_text(
    request: Text2TextRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """文生文 - 使用豆包大模型生成文本"""
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
        type=GenerationType.TEXT2TEXT,
        prompt=request.prompt,
        status=GenerationStatus.PROCESSING
    )
    db.add(generation)
    db.commit()

    try:
        # 调用豆包API生成文本
        result = await doubao_service.generate_text(
            prompt=request.prompt,
            mode=request.mode.value,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )

        # 更新完成状态
        generation.status = GenerationStatus.COMPLETED
        generation.completed_at = datetime.utcnow()
        # 存储结果到 result_urls 字段（存储文本内容）
        generation.result_urls = [result["content"]]
        db.commit()

        # 更新用户配额
        current_user.quota_used += 1
        db.commit()

        return Text2TextResponse(
            id=generation.id,
            content=result["content"],
            mode=request.mode,
            usage=result.get("usage", {}),
            created_at=generation.created_at
        )

    except Exception as e:
        generation.status = GenerationStatus.FAILED
        generation.error_message = str(e)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Text generation failed: {str(e)}"
        )


@router.get("/text2text/history")
def get_text2text_history(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取文生文历史记录"""
    generations = db.query(Generation).filter(
        Generation.user_id == current_user.id,
        Generation.type == GenerationType.TEXT2TEXT
    ).order_by(Generation.created_at.desc()).offset(skip).limit(limit).all()

    return [
        {
            "id": g.id,
            "prompt": g.prompt,
            "content": g.result_urls[0] if g.result_urls else None,
            "status": g.status.value if hasattr(g.status, 'value') else g.status,
            "created_at": g.created_at,
            "completed_at": g.completed_at
        }
        for g in generations
    ]


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
        object_names = []
        async with httpx.AsyncClient(follow_redirects=True) as client:
            for url in urls:
                try:
                    response = await client.get(url, timeout=30.0)
                    response.raise_for_status()
                    print(f"Downloaded {len(response.content)} bytes from {url[:50]}...")
                    try:
                        object_name = minio_service.upload_image(response.content)
                        object_names.append(object_name)
                        print(f"Uploaded to MinIO: {object_name}")
                    except Exception as e:
                        print(f"MinIO upload error: {e}")
                        object_names.append(None)
                except Exception as e:
                    print(f"Error downloading image: {e}")
                    object_names.append(None)  # 标记为失败

        # 生成预签名URL用于立即返回
        result_urls = []
        for obj_name in object_names:
            if obj_name:
                try:
                    url = minio_service.get_presigned_url(obj_name, expires=86400 * 7)
                    result_urls.append(url)
                except Exception as e:
                    print(f"Error generating presigned URL: {e}")

        # 更新完成状态 - 保存object_names而不是URLs
        generation.result_urls = object_names
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




async def reverse_prompt(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """图片反推提示词 - 使用豆包视觉模型分析图片"""
    try:
        # 验证文件类型
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only image files are allowed"
            )

        # 读取图片数据
        image_data = await file.read()

        # 调用豆包视觉模型分析图片
        result = await doubao_service.analyze_image(image_data)

        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"Reverse prompt error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze image: {str(e)}"
        )

