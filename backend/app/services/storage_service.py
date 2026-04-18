import os
import shutil
import uuid
from datetime import datetime, timedelta
from typing import Optional
from fastapi.responses import FileResponse
from app.core.config import settings
import base64

# 本地存储路径
STORAGE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "storage", "images")

class StorageService:
    """本地文件存储服务（作为MinIO的替代）"""

    def __init__(self):
        self.base_url = f"http://localhost:8000/storage/images"
        os.makedirs(STORAGE_DIR, exist_ok=True)
        print(f"Storage directory: {STORAGE_DIR}")

    def upload_image(self, image_data: bytes, content_type: str = "image/png", prefix: str = "generations") -> str:
        """上传图片到本地存储"""
        try:
            # 创建子目录
            subdir = os.path.join(STORAGE_DIR, prefix)
            os.makedirs(subdir, exist_ok=True)

            # 生成唯一文件名
            filename = f"{uuid.uuid4()}.png"
            filepath = os.path.join(subdir, filename)

            # 写入文件
            with open(filepath, 'wb') as f:
                f.write(image_data)

            object_name = f"{prefix}/{filename}"
            print(f"Saved image: {object_name} ({len(image_data)} bytes)")
            return object_name
        except Exception as e:
            print(f"Error saving image: {e}")
            raise

    def get_image_url(self, object_name: str) -> str:
        """获取图片访问URL"""
        # 返回本地访问URL
        return f"{self.base_url}/{object_name}"

    def get_image_path(self, object_name: str) -> str:
        """获取图片本地路径"""
        return os.path.join(STORAGE_DIR, object_name)

    def delete_image(self, object_name: str) -> None:
        """删除图片"""
        try:
            filepath = os.path.join(STORAGE_DIR, object_name)
            if os.path.exists(filepath):
                os.remove(filepath)
                print(f"Deleted: {object_name}")
        except Exception as e:
            print(f"Error deleting image: {e}")
            raise


# 单例实例
storage_service = StorageService()

# 为了保持兼容性，保留minio_service接口
class MinioCompatService:
    """兼容MinIO接口的包装器"""

    def __init__(self):
        self.storage = storage_service

    def upload_image(self, image_data: bytes, content_type: str = "image/png", prefix: str = "generations") -> str:
        return self.storage.upload_image(image_data, content_type, prefix)

    def get_presigned_url(self, object_name: str, expires: int = 3600) -> str:
        """返回可访问的URL（本地存储不需要签名）"""
        return self.storage.get_image_url(object_name)

    def delete_object(self, object_name: str) -> None:
        self.storage.delete_image(object_name)


# 创建兼容实例
minio_service = MinioCompatService()
