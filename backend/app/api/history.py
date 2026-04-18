from typing import List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.api.deps import get_db, get_current_user
from app.schemas.generation import GenerationResult, HistoryFilter
from app.models.generation import Generation
from app.models.user import User
from app.services.storage_service import minio_service

router = APIRouter(prefix="/history", tags=["history"])


@router.get("", response_model=List[GenerationResult])
def get_history(
    type: str = None,
    days: int = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取生成历史"""
    query = db.query(Generation).filter(Generation.user_id == current_user.id)

    # 按类型筛选
    if type:
        query = query.filter(Generation.type == type)

    # 按时间筛选
    if days:
        start_date = datetime.utcnow() - timedelta(days=days)
        query = query.filter(Generation.created_at >= start_date)

    # 分页
    total = query.count()
    generations = query.order_by(desc(Generation.created_at)) \
        .offset((page - 1) * page_size) \
        .limit(page_size) \
        .all()

    # 动态生成预签名URL
    for gen in generations:
        if gen.result_urls and isinstance(gen.result_urls, list):
            fresh_urls = []
            for obj_name in gen.result_urls:
                if obj_name and isinstance(obj_name, str):
                    try:
                        # 如果存储的是object_name，生成新的URL
                        if not obj_name.startswith('http'):
                            url = minio_service.get_presigned_url(obj_name, expires=3600 * 24 * 7)
                            fresh_urls.append(url)
                        else:
                            # 兼容旧数据（存储的是完整URL）
                            fresh_urls.append(obj_name)
                    except Exception as e:
                        print(f"Error generating URL for {obj_name}: {e}")
                        fresh_urls.append(None)
            gen.result_urls = [u for u in fresh_urls if u]

    return generations


@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取生成统计"""
    total = db.query(Generation).filter(Generation.user_id == current_user.id).count()
    completed = db.query(Generation).filter(
        Generation.user_id == current_user.id,
        Generation.status == "completed"
    ).count()

    # 今日生成数量
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_count = db.query(Generation).filter(
        Generation.user_id == current_user.id,
        Generation.created_at >= today
    ).count()

    return {
        "total": total,
        "completed": completed,
        "today": today_count,
        "quota_daily": current_user.quota_daily,
        "quota_used": current_user.quota_used,
        "quota_remaining": max(0, current_user.quota_daily - current_user.quota_used)
    }


@router.delete("/{generation_id}")
def delete_history(
    generation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除单条历史记录"""
    generation = db.query(Generation).filter(
        Generation.id == generation_id,
        Generation.user_id == current_user.id
    ).first()

    if not generation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found"
        )

    db.delete(generation)
    db.commit()

    return {"message": "Deleted successfully"}


@router.delete("")
def delete_batch_history(
    ids: List[str],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """批量删除历史记录"""
    deleted = db.query(Generation).filter(
        Generation.id.in_(ids),
        Generation.user_id == current_user.id
    ).delete(synchronize_session=False)

    db.commit()

    return {"message": f"Deleted {deleted} records"}
