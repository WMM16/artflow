from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from pydantic import BaseModel

router = APIRouter(prefix="/upgrade", tags=["upgrade"])


class PurchaseRequest(BaseModel):
    package_id: str


class PurchaseResponse(BaseModel):
    success: bool
    message: str
    quota_added: int
    quota_remaining: int


# 套餐配置
PACKAGES = {
    "basic": {"name": "基础包", "price": 1, "quota": 10},
    "standard": {"name": "标准包", "price": 5, "quota": 60},
    "premium": {"name": "高级包", "price": 10, "quota": 150},
    "unlimited": {"name": "无限包", "price": 30, "quota": 999},
}


@router.post("/purchase", response_model=PurchaseResponse)
def purchase_quota(
    request: PurchaseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """购买额度套餐"""
    package = PACKAGES.get(request.package_id)
    if not package:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid package ID"
        )

    # 增加用户额度
    # 注意：这里应该是增加额外额度，而不是修改每日基础额度
    # 我们需要一个新的字段来存储购买的额外额度

    # 暂时增加 quota_daily 作为当日可用额度
    current_user.quota_daily += package["quota"]

    db.commit()

    return PurchaseResponse(
        success=True,
        message=f"成功购买 {package['name']}，增加 {package['quota']} 张额度",
        quota_added=package["quota"],
        quota_remaining=current_user.quota_daily - current_user.quota_used
    )


@router.get("/packages")
def get_packages():
    """获取所有可用套餐"""
    return [
        {"id": k, **v} for k, v in PACKAGES.items()
    ]
