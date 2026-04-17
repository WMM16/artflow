import io
from minio import Minio
from minio.error import S3Error
from datetime import timedelta
from app.core.config import settings
import uuid


class MinioService:
    def __init__(self):
        self.client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE
        )
        self.bucket_name = settings.MINIO_BUCKET_NAME
        self._ensure_bucket()

    def _ensure_bucket(self):
        """确保bucket存在"""
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
        except S3Error as e:
            print(f"Error creating bucket: {e}")

    def upload_image(self, image_data: bytes, content_type: str = "image/png", prefix: str = "generations") -> str:
        """上传图片到MinIO"""
        object_name = f"{prefix}/{uuid.uuid4()}.png"
        try:
            self.client.put_object(
                self.bucket_name,
                object_name,
                io.BytesIO(image_data),
                length=len(image_data),
                content_type=content_type
            )
            return object_name
        except S3Error as e:
            print(f"Error uploading image: {e}")
            raise

    def get_presigned_url(self, object_name: str, expires: int = 3600) -> str:
        """获取预签名URL"""
        try:
            url = self.client.presigned_get_object(
                self.bucket_name,
                object_name,
                expires=timedelta(seconds=expires)
            )
            return url
        except S3Error as e:
            print(f"Error generating presigned URL: {e}")
            raise

    def delete_object(self, object_name: str) -> None:
        """删除对象"""
        try:
            self.client.remove_object(self.bucket_name, object_name)
        except S3Error as e:
            print(f"Error deleting object: {e}")
            raise


minio_service = MinioService()
