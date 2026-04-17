/**
 * 豆包文生文 API 调用脚本
 * 基于 doubao-seed-2-0-pro-260215 模型
 */

interface ContentItem {
  type: string;
  text?: string;
  image_url?: string;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: ContentItem[] | string;
}

interface DoubaoResponse {
  id?: string;
  model?: string;
  output?: {
    role: string;
    content: ContentItem[];
  };
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

interface GenerateOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

class DoubaoTextGenerator {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://ark.cn-beijing.volces.com/api/v3/responses';
  }

  /**
   * 生成文本回复
   * @param prompt 用户输入的提示词
   * @param options 可选配置
   * @returns 生成的文本内容
   */
  async generateText(
    prompt: string,
    options: GenerateOptions = {}
  ): Promise<string> {
    const {
      model = 'doubao-seed-2-0-pro-260215',
      temperature = 0.7,
      max_tokens = 2048,
      stream = false
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
      ],
      temperature,
      max_tokens,
      stream
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

      const data: DoubaoResponse = await response.json();

      if (data.error) {
        throw new Error(`API error: ${data.error.message}`);
      }

      // 提取生成的文本
      if (data.output?.content && Array.isArray(data.output.content)) {
        const textItem = data.output.content.find(
          (item: ContentItem) => item.type === 'output_text'
        );
        return textItem?.text || '';
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
  async chat(
    messages: Message[],
    options: GenerateOptions = {}
  ): Promise<string> {
    const {
      model = 'doubao-seed-2-0-pro-260215',
      temperature = 0.7,
      max_tokens = 2048,
      stream = false
    } = options;

    const formattedInput = messages.map(msg => ({
      role: msg.role,
      content: typeof msg.content === 'string'
        ? [{ type: 'input_text', text: msg.content }]
        : msg.content
    }));

    const requestBody = {
      model,
      input: formattedInput,
      temperature,
      max_tokens,
      stream
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

      const data: DoubaoResponse = await response.json();

      if (data.error) {
        throw new Error(`API error: ${data.error.message}`);
      }

      if (data.output?.content && Array.isArray(data.output.content)) {
        const textItem = data.output.content.find(
          (item: ContentItem) => item.type === 'output_text'
        );
        return textItem?.text || '';
      }

      return '';
    } catch (error) {
      console.error('对话时出错:', error);
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

  const generator = new DoubaoTextGenerator(apiKey);

  // 示例 1: 简单的文生文
  console.log('=== 示例 1: 简单文生文 ===');
  try {
    const result = await generator.generateText(
      '请用一句话描述人工智能的未来发展'
    );
    console.log('生成结果:', result);
  } catch (error) {
    console.error('生成失败:', error);
  }

  // 示例 2: 带参数的文生文
  console.log('\n=== 示例 2: 带参数的文生文 ===');
  try {
    const result = await generator.generateText(
      '写一首关于春天的短诗',
      {
        temperature: 0.9,
        max_tokens: 500
      }
    );
    console.log('生成结果:', result);
  } catch (error) {
    console.error('生成失败:', error);
  }

  // 示例 3: 多轮对话
  console.log('\n=== 示例 3: 多轮对话 ===');
  try {
    const messages: Message[] = [
      { role: 'system', content: '你是一个乐于助人的助手' },
      { role: 'user', content: '你好，介绍一下自己' },
      { role: 'assistant', content: '你好！我是一个AI助手，很高兴为你服务。' },
      { role: 'user', content: '你能做什么？' }
    ];

    const result = await generator.chat(messages);
    console.log('回复:', result);
  } catch (error) {
    console.error('对话失败:', error);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main();
}

// 导出供其他模块使用
export { DoubaoTextGenerator };
export type { Message, GenerateOptions, DoubaoResponse };
