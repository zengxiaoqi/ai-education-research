// LLM Service for AI Grading

interface LLMResponse {
  立意: { score: number; comment: string };
  结构: { score: number; comment: string };
  表达: { score: number; comment: string };
  创新: { score: number; comment: string };
  feedback: string;
  improvements: string[];
}

const GRADING_PROMPT = `你是一位专业的语文作文评分专家。请根据以下标准对学生的作文进行评分（每项满分25分）：

评分维度：
1. 立意（25分）：主题是否明确、立意是否深刻、观点是否新颖
2. 结构（25分）：文章结构是否完整、层次是否分明、逻辑是否清晰
3. 表达（25分）：语言是否流畅、用词是否恰当、句式是否多样
4. 创新（25分）：是否有独特见解、素材是否新鲜、表达是否有创意

请以JSON格式返回评分结果，格式如下：
{
  "立意": { "score": 22, "comment": "立意深刻，观点新颖" },
  "结构": { "score": 21, "comment": "层次分明，逻辑清晰" },
  "表达": { "score": 20, "comment": "语言流畅，用词恰当" },
  "创新": { "score": 22, "comment": "有独特见解，素材新鲜" },
  "feedback": "总体评语，100字左右",
  "improvements": ["建议1", "建议2", "建议3"]
}

请只返回JSON，不要包含其他文字。`;

export class LLMGradingService {
  private apiKey: string | undefined;
  private baseURL: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || process.env.LLM_API_KEY;
    this.baseURL = process.env.LLM_BASE_URL || 'https://api.deepseek.com';
    this.model = process.env.LLM_MODEL || 'deepseek-chat';
  }

  async gradeEssay(content: string): Promise<LLMResponse> {
    if (!this.apiKey) {
      throw new Error('LLM API Key not configured. Please set DEEPSEEK_API_KEY or LLM_API_KEY in .env');
    }

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: '你是一位专业的语文作文评分专家。严格按照要求输出JSON格式，不包含任何其他文字。'
            },
            {
              role: 'user',
              content: `${GRADING_PROMPT}\n\n学生作文内容：\n${content}`
            }
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' }
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`LLM API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);

      // Validate response structure
      this.validateResponse(result);

      return result;
    } catch (error) {
      console.error('LLM grading failed:', error);
      throw error;
    }
  }

  private validateResponse(response: unknown): void {
    if (!response || typeof response !== 'object') {
      throw new Error('Invalid LLM response: not an object');
    }

    const result = response as Record<string, unknown>;

    const requiredFields = ['立意', '结构', '表达', '创新', 'feedback', 'improvements'];

    for (const field of requiredFields) {
      if (!result[field]) {
        throw new Error(`Invalid LLM response: missing field "${field}"`);
      }
    }

    for (const dimension of ['立意', '结构', '表达', '创新']) {
      const d = result[dimension];
      if (!d || typeof d !== 'object') {
        throw new Error(`Invalid ${dimension} data`);
      }
      const dimData = d as { score: number; comment: string };
      if (typeof dimData.score !== 'number' || dimData.score < 0 || dimData.score > 25) {
        throw new Error(`Invalid score for ${dimension}: ${dimData.score}`);
      }
      if (typeof dimData.comment !== 'string') {
        throw new Error(`Invalid comment for ${dimension}`);
      }
    }

    if (!Array.isArray(result.improvements)) {
      throw new Error('Invalid improvements field');
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

// Singleton instance
let llmServiceInstance: LLMGradingService | null = null;

export function getLLMService(): LLMGradingService {
  if (!llmServiceInstance) {
    llmServiceInstance = new LLMGradingService();
  }
  return llmServiceInstance;
}
