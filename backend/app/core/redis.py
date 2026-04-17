import redis
import json
from typing import Optional, Any
from app.core.config import settings

redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)


def set_cache(key: str, value: Any, expire: int = 3600) -> None:
    """设置缓存"""
    redis_client.setex(key, expire, json.dumps(value))


def get_cache(key: str) -> Optional[Any]:
    """获取缓存"""
    value = redis_client.get(key)
    if value:
        return json.loads(value)
    return None


def delete_cache(key: str) -> None:
    """删除缓存"""
    redis_client.delete(key)


def set_task_status(task_id: str, status: dict, expire: int = 3600) -> None:
    """设置任务状态"""
    redis_client.setex(f"task:{task_id}", expire, json.dumps(status))


def get_task_status(task_id: str) -> Optional[dict]:
    """获取任务状态"""
    value = redis_client.get(f"task:{task_id}")
    if value:
        return json.loads(value)
    return None