import httpx
import base64
import io
import hashlib
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
            # 使用 prompt 的 hash 作为 seed，确保相同 prompt 生成相同图片
            prompt_hash = int(hashlib.md5(prompt.encode()).hexdigest(), 16) % 10000
            return [f"https://picsum.photos/seed/{prompt_hash + i}/{width}/{height}" for i in range(n)]

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
        # 使用 prompt 的 hash 作为 seed，确保相同 prompt 生成相同图片
        prompt_hash = int(hashlib.md5(prompt.encode()).hexdigest(), 16) % 10000
        return [f"https://picsum.photos/seed/{prompt_hash + i}/{width}/{height}" for i in range(n)]

    async def analyze_image(self, image_data: bytes) -> dict:
        """分析图片内容，返回提示词描述（使用豆包视觉模型）"""
        if not self._is_configured():
            # 未配置API时返回模拟数据
            print("[Mock] 图片分析（API未配置）")
            return {
                "prompt": "A beautiful scene captured in the image, high quality, detailed",
                "negative_prompt": "blur, low quality, distorted",
                "tags": ["摄影", "风景"],
                "style": "写实风格"
            }

        try:
            # 将图片转为base64
            image_base64 = base64.b64encode(image_data).decode('utf-8')

            async with httpx.AsyncClient() as client:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }

                # 使用豆包视觉模型分析图片
                payload = {
                    "model": self.text_model,  # 使用支持视觉的模型
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/png;base64,{image_base64}"
                                    }
                                },
                                {
                                    "type": "text",
                                    "text": """请详细描述这张图片的内容，并生成用于AI绘画的提示词。请按以下JSON格式返回：
{
    "prompt": "详细的中文提示词，描述画面主体、场景、光线、色彩、风格等",
    "negative_prompt": "应该避免的负面描述词",
    "tags": ["标签1", "标签2", "标签3"],
    "style": "整体风格描述"
}
请确保prompt足够详细，能够准确还原这张图片。"""
                                }
                            ]
                        }
                    ],
                    "temperature": 0.7
                }

                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=60.0
                )
                response.raise_for_status()

                data = response.json()
                content = data["choices"][0]["message"]["content"]

                # 尝试解析JSON响应
                import json
                import re

                # 提取JSON部分
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    try:
                        result = json.loads(json_match.group())
                        return {
                            "prompt": result.get("prompt", ""),
                            "negative_prompt": result.get("negative_prompt", ""),
                            "tags": result.get("tags", []),
                            "style": result.get("style", "")
                        }
                    except json.JSONDecodeError:
                        pass

                # 如果JSON解析失败，使用内容作为prompt
                return {
                    "prompt": content.strip(),
                    "negative_prompt": "blur, low quality, distorted, oversaturated",
                    "tags": ["AI生成"],
                    "style": "根据内容自动识别"
                }

        except Exception as e:
            print(f"Error analyzing image: {e}")
            # 失败时返回基础描述
            return {
                "prompt": "A beautiful image with various elements, high quality, detailed composition",
                "negative_prompt": "blur, low quality, distorted, dark, noise",
                "tags": ["图片"],
                "style": "写实风格"
            }


    async def generate_text(
        self,
        prompt: str,
        mode: str = "write",
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> dict:
        """文生文 - 使用豆包大模型生成文本

        Args:
            prompt: 用户输入的提示
            mode: 生成模式 (write-文章写作, continue-续写, polish-润色, summary-摘要,
                  translate-翻译, creative-创意写作, code-代码生成, chat-自由对话)
            temperature: 温度参数，控制创意程度 (0-1)
            max_tokens: 最大生成token数
        """
        if not self._is_configured():
            # 模拟生成，返回示例文本
            print(f"[Mock] 文生文: {prompt[:50]}..., 模式: {mode}")
            modes_mock = {
                "write": f"这是一篇关于\"{prompt[:30]}\"的文章。\n\n在Mock模式下，我为你生成了一段示例文章。在实际使用时，豆包大模型会根据你的提示词生成高质量的文章内容。\n\n你可以描述文章主题、风格、长度要求等，AI会为你创作出符合要求的内容。",
                "continue": f"{prompt}\n\n[续写内容]\n\n这是续写的示例内容。在实际使用时，AI会基于上文语境，自然流畅地延续故事或论述。",
                "polish": f"【润色后的版本】\n\n{prompt}\n\n这是润色后的示例。实际使用时，AI会优化原文的表达、语法和结构，使内容更加流畅专业。",
                "summary": "【摘要】\n\n这是文章的核心要点摘要。实际使用时，AI会提炼原文的关键信息，生成简洁明了的摘要。",
                "translate": f"【翻译结果】\n\nTranslation of: {prompt[:50]}...\n\n这是翻译的示例。实际使用时，AI会提供准确自然的翻译。",
                "creative": f"【创意作品】\n\n基于\"{prompt[:30]}\"，我为你创作了一个故事。\n\n在实际使用时，AI会发挥创意，为你生成独特的诗歌、故事或其他创意内容。",
                "code": f"```python\n# 基于你的需求生成的示例代码\ndef example():\n    print('这是代码生成的示例')\n    print('实际使用时，AI会生成符合需求的代码')\n\nexample()\n```",
                "chat": f"关于\"{prompt[:30]}\"，我的想法是...\n\n这是对话的示例回复。实际使用时，AI会基于你的问题给出详细、有帮助的回答。"
            }
            return {
                "content": modes_mock.get(mode, modes_mock["write"]),
                "usage": {"prompt_tokens": 100, "completion_tokens": 200, "total_tokens": 300}
            }

        # 根据模式构建系统提示词
        system_prompts = {
            "write": "你是一位专业的写作助手。根据用户的要求，撰写高质量的文章。注意文章结构清晰、语言流畅、内容丰富。",
            "continue": "你是一位擅长续写的AI助手。请基于用户提供的上下文，自然地延续内容，保持风格一致，衔接流畅。",
            "polish": "你是一位专业的文本编辑。请对用户提供的文本进行润色，优化语法、用词和结构，使其更加专业流畅，但保持原意不变。",
            "summary": "你是一位擅长总结的AI助手。请对用户提供的文本提取关键信息，生成简洁清晰的摘要。",
            "translate": "你是一位专业翻译。请将用户提供的文本翻译成目标语言，确保准确、自然、地道。",
            "creative": "你是一位富有创意的作家。请根据用户的提示，发挥想象力创作独特的内容，可以是故事、诗歌、剧本等。",
            "code": "你是一位专业的程序员。请根据用户描述的需求，编写高质量、注释清晰的代码，并解释关键部分。",
            "chat": "你是一位 helpful 的AI助手。请基于用户的问题，给出详细、准确、有用的回答。"
        }

        async with httpx.AsyncClient() as client:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }

            payload = {
                "model": self.text_model,
                "messages": [
                    {
                        "role": "system",
                        "content": system_prompts.get(mode, system_prompts["write"])
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": temperature,
                "max_tokens": max_tokens
            }

            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=120.0
            )
            response.raise_for_status()

            data = response.json()
            content = data["choices"][0]["message"]["content"]
            usage = data.get("usage", {})

            return {
                "content": content,
                "usage": usage
            }


doubao_service = DoubaoService()
