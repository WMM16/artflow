from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.api.deps import get_db, get_current_user
from app.schemas.user import (
    SubAccountCreate, SubAccountUpdate, SubAccountResponse
)
from app.models.user import User
from app.core.security import get_password_hash
import uuid

router = APIRouter(prefix="/subaccounts", tags=["subaccounts"])


@router.get("", response_model=List[SubAccountResponse])
def list_subaccounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取当前用户的所有子账号"""
    # 获取子账号列表，并统计每个子账号的下级数量
    subaccounts = db.query(User).filter(User.parent_id == current_user.id).all()

    result = []
    for sub in subaccounts:
        children_count = db.query(func.count(User.id)).filter(User.parent_id == sub.id).scalar()
        sub_dict = {
            "id": sub.id,
            "email": sub.email,
            "nickname": sub.nickname,
            "avatar_url": sub.avatar_url,
            "is_admin": sub.is_admin,
            "is_active": sub.is_active,
            "quota_daily": sub.quota_daily,
            "quota_used": sub.quota_used,
            "parent_id": sub.parent_id,
            "created_at": sub.created_at,
            "children_count": children_count
        }
        result.append(sub_dict)

    return result


@router.post("", response_model=SubAccountResponse, status_code=status.HTTP_201_CREATED)
def create_subaccount(
    data: SubAccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """创建子账号"""
    # 检查邮箱是否已存在
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该邮箱已被注册"
        )

    # 检查当前用户额度是否足够分配给子账号
    subaccounts = db.query(User).filter(User.parent_id == current_user.id).all()
    total_sub_quota = sum(sub.quota_daily for sub in subaccounts)

    # 获取当前用户可用额度（自己的额度减去已分配给子账号的额度）
    available_quota = current_user.quota_daily - total_sub_quota

    if data.quota_daily > available_quota:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"可用额度不足，当前可用额度: {available_quota}"
        )

    # 创建子账号
    new_user = User(
        id=uuid.uuid4(),
        email=data.email,
        password_hash=get_password_hash(data.password),
        nickname=data.nickname,
        parent_id=current_user.id,
        quota_daily=data.quota_daily,
        quota_used=0,
        is_active=True,
        is_admin=False
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "id": new_user.id,
        "email": new_user.email,
        "nickname": new_user.nickname,
        "avatar_url": new_user.avatar_url,
        "is_admin": new_user.is_admin,
        "is_active": new_user.is_active,
        "quota_daily": new_user.quota_daily,
        "quota_used": new_user.quota_used,
        "parent_id": new_user.parent_id,
        "created_at": new_user.created_at,
        "children_count": 0
    }


@router.get("/{subaccount_id}", response_model=SubAccountResponse)
def get_subaccount(
    subaccount_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取子账号详情"""
    subaccount = db.query(User).filter(
        User.id == subaccount_id,
        User.parent_id == current_user.id
    ).first()

    if not subaccount:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="子账号不存在"
        )

    children_count = db.query(func.count(User.id)).filter(User.parent_id == subaccount.id).scalar()

    return {
        "id": subaccount.id,
        "email": subaccount.email,
        "nickname": subaccount.nickname,
        "avatar_url": subaccount.avatar_url,
        "is_admin": subaccount.is_admin,
        "is_active": subaccount.is_active,
        "quota_daily": subaccount.quota_daily,
        "quota_used": subaccount.quota_used,
        "parent_id": subaccount.parent_id,
        "created_at": subaccount.created_at,
        "children_count": children_count
    }


@router.put("/{subaccount_id}", response_model=SubAccountResponse)
def update_subaccount(
    subaccount_id: str,
    data: SubAccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """更新子账号信息"""
    subaccount = db.query(User).filter(
        User.id == subaccount_id,
        User.parent_id == current_user.id
    ).first()

    if not subaccount:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="子账号不存在"
        )

    # 检查配额调整
    if data.quota_daily is not None and data.quota_daily != subaccount.quota_daily:
        subaccounts = db.query(User).filter(
            User.parent_id == current_user.id,
            User.id != subaccount_id
        ).all()
        total_sub_quota = sum(sub.quota_daily for sub in subaccounts)
        available_quota = current_user.quota_daily - total_sub_quota

        if data.quota_daily > available_quota:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"可用额度不足，当前可用额度: {available_quota}"
            )

        subaccount.quota_daily = data.quota_daily

    # 更新其他字段
    if data.nickname is not None:
        subaccount.nickname = data.nickname
    if data.is_active is not None:
        subaccount.is_active = data.is_active
    if data.password is not None:
        subaccount.password_hash = get_password_hash(data.password)

    db.commit()
    db.refresh(subaccount)

    children_count = db.query(func.count(User.id)).filter(User.parent_id == subaccount.id).scalar()

    return {
        "id": subaccount.id,
        "email": subaccount.email,
        "nickname": subaccount.nickname,
        "avatar_url": subaccount.avatar_url,
        "is_admin": subaccount.is_admin,
        "is_active": subaccount.is_active,
        "quota_daily": subaccount.quota_daily,
        "quota_used": subaccount.quota_used,
        "parent_id": subaccount.parent_id,
        "created_at": subaccount.created_at,
        "children_count": children_count
    }


@router.delete("/{subaccount_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subaccount(
    subaccount_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除子账号（仅当子账号没有下级时）"""
    subaccount = db.query(User).filter(
        User.id == subaccount_id,
        User.parent_id == current_user.id
    ).first()

    if not subaccount:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="子账号不存在"
        )

    # 检查是否有下级账号
    children_count = db.query(func.count(User.id)).filter(User.parent_id == subaccount.id).scalar()
    if children_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该账号下有下级账号，无法删除"
        )

    db.delete(subaccount)
    db.commit()

    return None


@router.get("/stats/overview")
def get_subaccount_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取子账号统计信息"""
    # 获取所有子账号
    subaccounts = db.query(User).filter(User.parent_id == current_user.id).all()

    total_subaccounts = len(subaccounts)
    active_subaccounts = sum(1 for sub in subaccounts if sub.is_active)
    total_quota_used = sum(sub.quota_used for sub in subaccounts)
    total_quota_allocated = sum(sub.quota_daily for sub in subaccounts)

    return {
        "total_subaccounts": total_subaccounts,
        "active_subaccounts": active_subaccounts,
        "inactive_subaccounts": total_subaccounts - active_subaccounts,
        "total_quota_used": total_quota_used,
        "total_quota_allocated": total_quota_allocated,
        "available_quota": current_user.quota_daily - total_quota_allocated
    }
