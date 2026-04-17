import httpx
import base64
import io
from typing import List, Optional
from app.core.config import settings


class DoubaoService:
    def __init__(self):
        self.api_key = settings.DOUBAO_API_KEY
        self.text_model = settings.DOUBAO_TEXT_MODEL
        self.image_model = settings.DOUBAO_IMAGE_MODEL
        self.base_url = "https://ark.cn-beijing.volces.com/api/v3"

    def _is_configured(self) -> bool:
        """检查是否配置了有效的API密钥"""
        if not self.api_key or not self.text_model:
            return False
        # 排除占位符值
        placeholder_values = ['your-doubao-api-key', 'your-text-model-endpoint', 'your-image-model-endpoint', '']
        if self.api_key.lower() in placeholder_values:
            return False
        return True

    async def generate_image_from_text(
        self,
        prompt: str,
        negative_prompt: Optional[str] = None,
        width: int = 1024,
        height: int = 1024,
        n: int = 1
    ) -> List[str]:
        """文生图"""
        if not self._is_configured():
            # 模拟生成，返回示例图片URL
            print(f"[Mock] 生成图片: {prompt}, 尺寸: {width}x{height}")
            return [f"https://picsum.photos/{width}/{height}?random={i}" for i in range(n)]

        async with httpx.AsyncClient() as client:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }

            payload = {
                "model": self.text_model,
                "prompt": prompt,
                "width": width,
                "height": height,
                "n": n
            }

            if negative_prompt:
                payload["negative_prompt"] = negative_prompt

            response = await client.post(
                f"{self.base_url}/images/generations",
                headers=headers,
                json=payload,
                timeout=120.0
            )
            response.raise_for_status()

            data = response.json()
            return [item["url"] for item in data.get("data", [])]

    async def generate_image_from_image(
        self,
        image_data: bytes,
        prompt: str,
        negative_prompt: Optional[str] = None,
        width: int = 1024,
        height: int = 1024,
        strength: float = 0.7,
        n: int = 1
    ) -> List[str]:
        """图生图 - 豆包API不支持图生图，使用文生图替代或返回Mock图片"""
        # 豆包API没有 images/edits 端点，暂时使用Mock模式
        print(f"[Mock] 图生图: {prompt}, 尺寸: {width}x{height}")
        return [f"https://picsum.photos/{width}/{height}?random={i+100}" for i in range(n)]


doubao_service = DoubaoService()
