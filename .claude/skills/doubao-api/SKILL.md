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

## 执行步骤

1. **确定项目目录**：询问用户要在哪个目录创建项目（默认当前目录）
2. **创建目录结构**：创建 lib/ 目录
3. **生成 lib/gentext.js**：文生文模块（参考 test/gentext.js）
4. **生成 lib/genpic.js**：文生图模块（参考 test/genpic.js）
5. **生成 .env.example**：环境变量模板
6. **生成 example.js**：完整使用示例
7. **提示输入 API Key**：询问用户是否有现成的 DOUBAO_API_KEY
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

// 运行示例
(async () => {
  try {
    await textExample();
    await imageExample();
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
- **API 基础 URL**: `https://ark.cn-beijing.volces.com/api/v3`
