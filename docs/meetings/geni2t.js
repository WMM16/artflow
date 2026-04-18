/**
 * 豆包图生文 API 调用脚本
 * 基于 doubao-seed-2-0-pro-260215 模型的视觉理解能力
 * 支持图片内容分析、描述生成、提示词反推
 */

const fs = require('fs');
const path = require('path');

class DoubaoImageAnalyzer {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://ark.cn-beijing.volces.com/api/v3/responses';
  }

  /**
   * 将本地图片文件转换为 Base64 编码
   * @param imagePath 图片文件路径
   * @returns Base64 编码的图片（带 data URI 前缀）
   */
  imageToBase64(imagePath) {
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Data = imageBuffer.toString('base64');
      const ext = path.extname(imagePath).toLowerCase();
      let mimeType = 'image/jpeg';

      switch (ext) {
        case '.png': mimeType = 'image/png'; break;
        case '.jpg':
        case '.jpeg': mimeType = 'image/jpeg'; break;
        case '.webp': mimeType = 'image/webp'; break;
        case '.bmp': mimeType = 'image/bmp'; break;
        case '.gif': mimeType = 'image/gif'; break;
      }

      return `data:${mimeType};base64,${base64Data}`;
    } catch (error) {
      console.error('转换图片为 Base64 失败:', error.message);
      throw error;
    }
  }

  /**
   * 分析图片内容并生成描述
   * @param imageInput 图片路径、Base64 字符串或 URL
   * @param prompt 分析提示词（可选，默认为"你看见了什么？"）
   * @param options 可选配置
   * @returns 分析结果文本
   */
  async analyze(imageInput, prompt = '你看见了什么？', options = {}) {
    // 判断输入类型，如果是路径则转为 base64
    let imageData = imageInput;

    if (fs.existsSync(imageInput)) {
      console.log('检测到本地文件，转换为 Base64...');
      imageData = this.imageToBase64(imageInput);
    } else if (!imageInput.startsWith('data:') && !imageInput.startsWith('http')) {
      throw new Error('图片输入必须是本地文件路径、Base64 字符串或 URL');
    }

    const {
      model = 'doubao-seed-2-0-pro-260215'
    } = options;

    const requestBody = {
      model,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_image',
              image_url: imageData
            },
            {
              type: 'input_text',
              text: prompt
            }
          ]
        }
      ]
    };

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
      }

      const data = JSON.parse(responseText);

      if (data.error) {
        throw new Error(`API error: ${data.error.message}`);
      }

      // 提取分析结果 - output 是数组
      if (Array.isArray(data.output)) {
        const messageItem = data.output.find((item) => item.type === 'message');
        if (messageItem?.content && Array.isArray(messageItem.content)) {
          const textItem = messageItem.content.find(
            (item) => item.type === 'output_text'
          );
          return textItem?.text || '';
        }
      }

      return '';
    } catch (error) {
      console.error('分析图片时出错:', error);
      throw error;
    }
  }

  /**
   * 反推图片的 AI 绘画提示词
   * @param imageInput 图片路径、Base64 字符串或 URL
   * @param options 可选配置
   * @returns 结构化的提示词对象 {prompt, negativePrompt, tags, style}
   */
  async reversePrompt(imageInput, options = {}) {
    const systemPrompt = `请分析这张图片，并生成用于 AI 绘画的详细提示词。请按以下 JSON 格式返回：
{
  "prompt": "详细的英文提示词，描述画面主体、场景、光线、色彩、构图、风格等",
  "negativePrompt": "应该避免的负面描述词",
  "tags": ["标签1", "标签2", "标签3"],
  "style": "整体风格描述"
}
要求：
1. prompt 必须足够详细，能够准确还原这张图片
2. 使用英文关键词，逗号分隔
3. 包含画质相关的词汇如 "high quality, detailed, 8k" 等
4. tags 使用中文标签`;

    const result = await this.analyze(imageInput, systemPrompt, options);

    // 尝试解析 JSON 响应
    try {
      // 提取 JSON 部分
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          prompt: parsed.prompt || parsed.prompts || '',
          negativePrompt: parsed.negativePrompt || parsed.negative_prompt || '',
          tags: parsed.tags || [],
          style: parsed.style || ''
        };
      }
    } catch (e) {
      console.log('JSON 解析失败，返回原始文本');
    }

    // 如果解析失败，返回原始结果
    return {
      prompt: result,
      negativePrompt: '',
      tags: [],
      style: ''
    };
  }

  /**
   * 批量分析多张图片
   * @param imageInputs 图片路径数组
   * @param prompt 分析提示词
   * @param options 可选配置
   * @returns 分析结果数组
   */
  async analyzeBatch(imageInputs, prompt = '你看见了什么？', options = {}) {
    const results = [];
    for (const imageInput of imageInputs) {
      try {
        const result = await this.analyze(imageInput, prompt, options);
        results.push({ imageInput, result, success: true });
      } catch (error) {
        results.push({ imageInput, error: error.message, success: false });
      }
    }
    return results;
  }

  /**
   * 生成图片的详细描述报告
   * @param imageInput 图片路径、Base64 字符串或 URL
   * @param options 可选配置
   * @returns 结构化描述对象
   */
  async generateDescription(imageInput, options = {}) {
    const prompt = `请详细描述这张图片，包括：
1. 主体内容
2. 场景环境
3. 光线和色彩
4. 构图和视角
5. 整体氛围
请用中文回答。`;

    return await this.analyze(imageInput, prompt, options);
  }
}

module.exports = { DoubaoImageAnalyzer };
