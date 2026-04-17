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

// ==================== 使用示例 ====================

async function main() {
  // 从环境变量获取 API Key
  const apiKey = process.env.DOUBAO_API_KEY;

  if (!apiKey) {
    console.error('请设置环境变量 DOUBAO_API_KEY');
    console.error('示例: set DOUBAO_API_KEY=your-api-key');
    process.exit(1);
  }

  const generator = new DoubaoImageGenerator(apiKey);

  // 创建输出目录
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 示例 1: 简单的文生图（返回 URL）
  console.log('=== 示例 1: 简单文生图（URL 格式）===');
  try {
    const result = await generator.generateImage(
      '一只可爱的橘猫，在阳光下睡觉，超写实风格，柔和光线'
    );
    if (result) {
      console.log('图片 URL:', result.url);
      console.log('优化后的提示词:', result.revisedPrompt);
    }
  } catch (error) {
    console.error('生成失败:', error.message);
  }

  // 示例 2: 使用复杂提示词（类似文档示例）
  console.log('\n=== 示例 2: 复杂提示词文生图 ===');
  try {
    const result = await generator.generateImage(
      '星际穿越，黑洞，黑洞里冲出一辆快支离破碎的复古列车，抢视觉冲击力，电影大片，末日既视感，动感，对比色，oc渲染，光线追踪，动态模糊，景深，超现实主义，深蓝，画面通过细腻的丰富的色彩层次塑造主体与场景，质感真实，暗黑风背景的光影效果营造出氛围，整体兼具艺术幻想感，夸张的广角透视效果，耀光，反射，极致的光影，强引力，吞噬',
      {
        size: '2K',
        watermark: true
      }
    );
    if (result) {
      console.log('图片 URL:', result.url);

      // 下载图片到本地
      const outputPath = path.join(outputDir, 'seedream_output_1.png');
      await generator.downloadImage(result.url, outputPath);
    }
  } catch (error) {
    console.error('生成失败:', error.message);
  }

  // 示例 3: 返回 base64 格式
  console.log('\n=== 示例 3: 文生图（Base64 格式）===');
  try {
    const result = await generator.generateImage(
      '一座 futuristic 的城市夜景，霓虹灯闪烁，赛博朋克风格，高清画质',
      {
        responseFormat: 'b64_json',
        size: '2k'
      }
    );
    if (result && result.b64Json) {
      console.log('Base64 数据长度:', result.b64Json.length);

      // 保存 base64 图片
      const outputPath = path.join(outputDir, 'seedream_output_2.png');
      generator.saveBase64Image(result.b64Json, outputPath);
    }
  } catch (error) {
    console.error('生成失败:', error.message);
  }

  // 示例 4: 批量生成
  console.log('\n=== 示例 4: 批量文生图 ===');
  try {
    const prompts = [
      '一片樱花飘落的日本庭院，春天，柔和光线，水彩风格',
      '深海的鲸鱼，周围环绕着发光的水母，梦幻氛围，蓝色调'
    ];

    const results = await generator.generateImages(prompts, {
      size: '2k',
      watermark: false
    });

    results.forEach((item, index) => {
      console.log(`\n图片 ${index + 1}:`);
      console.log(`  提示词: ${item.prompt}`);
      if (item.success) {
        console.log(`  URL: ${item.result.url}`);
      } else {
        console.log(`  失败: ${item.error}`);
      }
    });
  } catch (error) {
    console.error('批量生成失败:', error.message);
  }

  // ==================== 图生图示例 ====================
  console.log('\n\n========== 图生图示例 ==========\n');

  // 本地图片路径
  const inputImagePath = path.join(__dirname, '..', 'assets', 'puppy_kitten_fight_001.jpg');

  // 检查图片是否存在
  if (!fs.existsSync(inputImagePath)) {
    console.error(`图片不存在: ${inputImagePath}`);
  } else {
    console.log(`使用图片: ${inputImagePath}\n`);

    // 示例 5: 抽象画风格
    console.log('=== 示例 5: 抽象画风格转换 ===');
    console.log('提示词: 将这幅画转成抽象画的风格\n');
    try {
      const result = await generator.imageToImage(
        inputImagePath,
        '将这幅画转成抽象画的风格，保留主体轮廓，使用大胆的色块和几何形状，现代艺术风格',
        {
          size: '2k',
          watermark: false,
          outputFormat: 'png'
        }
      );

      if (result && result.url) {
        console.log('✅ 生成成功!');
        console.log(`图片 URL: ${result.url}`);
        console.log(`尺寸: ${result.size}`);

        const outputPath = path.join(outputDir, 'abstract_style.png');
        await generator.downloadImage(result.url, outputPath);
      }
    } catch (error) {
      console.error('❌ 生成失败:', error.message);
    }

    // 示例 6: 动画风格化
    console.log('\n=== 示例 6: 动画风格化处理 ===');
    console.log('提示词: 对这张图片进行动画风格化处理\n');
    try {
      const result = await generator.imageToImage(
        inputImagePath,
        '对这张图片进行动画风格化处理，变成迪士尼皮克斯风格，色彩鲜艳，毛发细节丰富，3D渲染效果',
        {
          size: '2k',
          watermark: false,
          outputFormat: 'png'
        }
      );

      if (result && result.url) {
        console.log('✅ 生成成功!');
        console.log(`图片 URL: ${result.url}`);
        console.log(`尺寸: ${result.size}`);

        const outputPath = path.join(outputDir, 'animation_style.png');
        await generator.downloadImage(result.url, outputPath);
      }
    } catch (error) {
      console.error('❌ 生成失败:', error.message);
    }
  }

  console.log('\n=== 所有示例运行完毕 ===');
}

// 如果直接运行此文件
if (require.main === module) {
  main();
}

// 导出供其他模块使用
module.exports = { DoubaoImageGenerator };
