---
name: doubao-api
description: |
  初始化豆包 API 项目结构，用于火山引擎豆包大模型的文生文和文生图功能。
  当用户提到"豆包API"、"doubao-api"、"创建豆包项目"、"火山引擎API"、"豆包文生文"、"豆包文生图"、"seedream"、"豆包seed"时触发此技能。
  此技能会创建完整的项目结构，包括文本生成模块、图片生成模块、环境变量配置和使用示例。
  适用于需要快速搭建豆包 API 调用环境的场景。
---

# 豆包 API 项目初始化技能

此技能帮助用户快速创建基于火山引擎豆包大模型的 API 项目结构。

## 支持的功能

1. **文生文** (doubao-seed-2-0-pro-260215) - 基于 DoubaoTextGenerator 类
   - 单轮文本生成
   - 多轮对话

2. **文生图/图生图** (doubao-seedream-5-0-260128) - 基于 DoubaoImageGenerator 类
   - 文本生成图片
   - 图片生成图片（风格转换）
   - 批量生成
   - 图片下载和保存

3. **图生文** (doubao-seed-2-0-pro-260215) - 基于 DoubaoImageAnalyzer 类
   - 图片内容分析
   - AI 绘画提示词反推
   - 批量图片分析
   - 生成详细描述报告

## 执行步骤

1. **确定项目目录**：询问用户要在哪个目录创建项目（默认当前目录）
2. **创建目录结构**：创建 lib/ 目录
3. **生成 lib/gentext.js**：文生文模块（参考 docs/meetings/gentext.js）
4. **生成 lib/genpic.js**：文生图模块（参考 docs/meetings/genpic.js）
5. **生成 lib/geni2t.js**：图生文模块（参考 docs/meetings/geni2t.js）- 新增视觉理解功能
6. **生成 .env.example**：环境变量模板
7. **生成 example.js**：完整使用示例
8. **提示输入 API Key**：询问用户是否有现成的 DOUBAO_API_KEY
   - 如果有，提示用户输入密钥
   - 将密钥保存到 .env 文件
   - 提醒用户 .env 文件不应提交到版本控制

## 生成的文件内容

### lib/gentext.js

```javascript
/**
 * 豆包文生文 API 调用脚本
 * 基于 doubao-seed-2-0-pro-260215 模型
 */

class DoubaoTextGenerator {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://ark.cn-beijing.volces.com/api/v3/responses';
  }

  /**
   * 生成文本回复
   * @param prompt 用户输入的提示词
   * @param options 可选配置
   * @returns 生成的文本内容
   */
  async generateText(prompt, options = {}) {
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

      // 提取生成的文本 - output 是数组
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
      console.error('生成文本时出错:', error);
      throw error;
    }
  }

  /**
   * 多轮对话
   * @param messages 消息历史
   * @param options 可选配置
   * @returns 生成的文本内容
   */
  async chat(messages, options = {}) {
    const {
      model = 'doubao-seed-2-0-pro-260215'
    } = options;

    const formattedInput = messages.map(msg => ({
      role: msg.role,
      content: typeof msg.content === 'string'
        ? [{ type: 'input_text', text: msg.content }]
        : msg.content
    }));

    const requestBody = {
      model,
      input: formattedInput
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`API error: ${data.error.message}`);
      }

      // 提取生成的文本 - output 是数组
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
      console.error('对话时出错:', error);
      throw error;
    }
  }
}

module.exports = { DoubaoTextGenerator };
```

### lib/geni2t.js

```javascript
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
}

module.exports = { DoubaoImageAnalyzer };
```

### lib/genpic.js

```javascript
/**
 * 豆包文生图 API 调用脚本
 * 基于 doubao-seedream-5-0-260128 模型
 */

const fs = require('fs');
const path = require('path');

class DoubaoImageGenerator {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://ark.cn-beijing.volces.com/api/v3/images/generations';
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
   * 图生图 - 基于参考图片生成新图片
   * @param imageInput 图片路径、Base64 字符串或 URL
   * @param prompt 生成提示词
   * @param options 可选配置
   * @returns 生成的图片信息
   */
  async imageToImage(imageInput, prompt, options = {}) {
    // 判断输入类型，如果是路径则转为 base64
    let imageData = imageInput;

    if (fs.existsSync(imageInput)) {
      console.log('检测到本地文件，转换为 Base64...');
      imageData = this.imageToBase64(imageInput);
    } else if (!imageInput.startsWith('data:') && !imageInput.startsWith('http')) {
      throw new Error('图片输入必须是本地文件路径、Base64 字符串或 URL');
    }

    const {
      model = 'doubao-seedream-5-0-260128',
      sequentialImageGeneration = 'disabled',
      responseFormat = 'url',
      size = '2k',
      stream = false,
      watermark = true,
      outputFormat = 'jpeg'
    } = options;

    const requestBody = {
      model,
      prompt,
      image: imageData,
      sequential_image_generation: sequentialImageGeneration,
      response_format: responseFormat,
      size,
      stream,
      watermark,
      output_format: outputFormat
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

      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        const imageItem = data.data[0];
        return {
          url: imageItem.url,
          b64Json: imageItem.b64_json,
          size: imageItem.size,
          model: data.model,
          created: data.created,
          usage: data.usage
        };
      }

      return null;
    } catch (error) {
      console.error('图生图生成失败:', error);
      throw error;
    }
  }

  /**
   * 生成图片（文生图）
   * @param prompt 图片描述（提示词）
   * @param options 可选配置
   * @returns 生成的图片 URL 或 base64 数据
   */
  async generateImage(prompt, options = {}) {
    const {
      model = 'doubao-seedream-5-0-260128',
      sequentialImageGeneration = 'disabled',
      responseFormat = 'url',
      size = '2k',
      stream = false,
      watermark = true
    } = options;

    const requestBody = {
      model,
      prompt,
      sequential_image_generation: sequentialImageGeneration,
      response_format: responseFormat,
      size,
      stream,
      watermark
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

      // 提取生成的图片数据
      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        const imageItem = data.data[0];
        return {
          url: imageItem.url,
          b64Json: imageItem.b64_json,
          revisedPrompt: imageItem.revised_prompt
        };
      }

      return null;
    } catch (error) {
      console.error('生成图片时出错:', error);
      throw error;
    }
  }

  /**
   * 批量生成图片
   * @param prompts 图片描述数组
   * @param options 可选配置
   * @returns 生成的图片数组
   */
  async generateImages(prompts, options = {}) {
    const results = [];
    for (const prompt of prompts) {
      try {
        const result = await this.generateImage(prompt, options);
        results.push({ prompt, result, success: true });
      } catch (error) {
        results.push({ prompt, error: error.message, success: false });
      }
    }
    return results;
  }

  /**
   * 下载图片到本地（Node.js 环境）
   * @param url 图片 URL
   * @param outputPath 输出路径
   */
  async downloadImage(url, outputPath) {
    const fs = require('fs');
    const path = require('path');

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`下载失败: ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      fs.writeFileSync(outputPath, Buffer.from(buffer));
      console.log(`图片已保存到: ${outputPath}`);
      return true;
    } catch (error) {
      console.error('下载图片失败:', error);
      throw error;
    }
  }

  /**
   * 保存 base64 图片到本地
   * @param b64Data base64 编码的图片数据
   * @param outputPath 输出路径
   */
  saveBase64Image(b64Data, outputPath) {
    const fs = require('fs');

    try {
      // 移除 data:image/png;base64, 前缀（如果存在）
      const base64Data = b64Data.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(outputPath, buffer);
      console.log(`图片已保存到: ${outputPath}`);
      return true;
    } catch (error) {
      console.error('保存图片失败:', error);
      throw error;
    }
  }
}

module.exports = { DoubaoImageGenerator };
```

### .env.example

```
# 豆包 API 密钥
# 从火山引擎控制台获取: https://console.volcengine.com/
DOUBAO_API_KEY=your_api_key_here
```

### example.js

```javascript
/**
 * 豆包 API 使用示例
 */

require('dotenv').config();
const { DoubaoTextGenerator } = require('./lib/gentext');
const { DoubaoImageGenerator } = require('./lib/genpic');
const { DoubaoImageAnalyzer } = require('./lib/geni2t');
const fs = require('fs');
const path = require('path');

async function textExample() {
  const apiKey = process.env.DOUBAO_API_KEY;
  if (!apiKey) {
    console.error('请设置 DOUBAO_API_KEY 环境变量');
    return;
  }

  // 文生文示例
  const textGen = new DoubaoTextGenerator(apiKey);

  console.log('=== 文生文示例 ===');
  const result = await textGen.generateText('请用一句话描述人工智能的未来发展');
  console.log('生成结果:', result);

  // 多轮对话示例
  console.log('\n=== 多轮对话示例 ===');
  const messages = [
    { role: 'system', content: '你是一个乐于助人的助手' },
    { role: 'user', content: '你好，介绍一下自己' }
  ];
  const chatResult = await textGen.chat(messages);
  console.log('回复:', chatResult);
}

async function imageExample() {
  const apiKey = process.env.DOUBAO_API_KEY;
  if (!apiKey) {
    console.error('请设置 DOUBAO_API_KEY 环境变量');
    return;
  }

  const imageGen = new DoubaoImageGenerator(apiKey);

  // 创建输出目录
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('\n=== 文生图示例 ===');
  const result = await imageGen.generateImage(
    '一只可爱的橘猫，在阳光下睡觉，超写实风格，柔和光线'
  );

  if (result) {
    console.log('图片 URL:', result.url);

    // 下载图片
    const outputPath = path.join(outputDir, 'cat.png');
    await imageGen.downloadImage(result.url, outputPath);
  }
}

async function imageAnalysisExample() {
  const apiKey = process.env.DOUBAO_API_KEY;
  if (!apiKey) {
    console.error('请设置 DOUBAO_API_KEY 环境变量');
    return;
  }

  const analyzer = new DoubaoImageAnalyzer(apiKey);

  console.log('\n=== 图生文示例 - 图片分析 ===');
  const imagePath = './test-image.jpg'; // 替换为你的图片路径
  if (fs.existsSync(imagePath)) {
    const description = await analyzer.analyze(imagePath, '请详细描述这张图片');
    console.log('图片描述:', description);
  }

  console.log('\n=== 图生文示例 - 提示词反推 ===');
  if (fs.existsSync(imagePath)) {
    const promptInfo = await analyzer.reversePrompt(imagePath);
    console.log('提示词:', promptInfo.prompt);
    console.log('负面提示词:', promptInfo.negativePrompt);
    console.log('标签:', promptInfo.tags.join(', '));
    console.log('风格:', promptInfo.style);
  }
}

// 运行示例
(async () => {
  try {
    await textExample();
    await imageExample();
    await imageAnalysisExample();
  } catch (error) {
    console.error('运行示例出错:', error);
  }
})();
```

## API Key 处理流程（关键步骤）

在创建项目后，**必须执行以下步骤**：

1. **询问用户**："您有现成的豆包 API Key 吗？"
2. **如果用户有密钥**：
   - 提示用户输入密钥
   - 创建 `.env` 文件，内容为：
     ```
     DOUBAO_API_KEY=用户输入的密钥
     ```
3. **提醒用户**：`.env` 文件包含敏感信息，不应提交到 git 仓库

## 模型信息

- **文生文模型**: `doubao-seed-2-0-pro-260215`
- **文生图模型**: `doubao-seedream-5-0-260128`
- **视觉理解模型** (图生文): `doubao-seed-2-0-pro-260215`（支持多模态输入）
- **API 基础 URL**: `https://ark.cn-beijing.volces.com/api/v3`

## 使用说明

### 图生文功能

图生文（Image-to-Text）功能基于豆包的视觉理解能力，可以：

1. **图片内容分析** - 识别图片中的物体、场景、人物等
2. **提示词反推** - 生成用于 AI 绘画的详细提示词
3. **批量处理** - 同时分析多张图片

**使用示例**:
```javascript
const { DoubaoImageAnalyzer } = require('./lib/geni2t');

const analyzer = new DoubaoImageAnalyzer(apiKey);

// 简单分析
const description = await analyzer.analyze('./image.jpg', '描述这张图片');

// 提示词反推
const promptInfo = await analyzer.reversePrompt('./image.jpg');
console.log(promptInfo.prompt);        // 英文提示词
console.log(promptInfo.negativePrompt); // 负面提示词
console.log(promptInfo.tags);          // 中文标签
```
