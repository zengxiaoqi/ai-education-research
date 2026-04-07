// Rule-based grading service (fallback)

import { Dimensions } from '@/types/grading';

interface RuleGradingResult {
  dimensions: Dimensions;
  feedback: string;
  improvements: string[];
}

export class RuleGradingService {
  private readonly MIN_LENGTH = 200; // Minimum characters for a valid essay

  gradeEssay(content: string): RuleGradingResult {
    const words = content.split('').length; // Chinese characters
    const sentences = content.split(/[。！？]/).filter(s => s.trim().length > 0).length;
    const paragraphs = content.split('\n').filter(p => p.trim().length > 0).length;

    // Initialize scores
    const dimensions: Dimensions = {
      立意: { score: 0, maxScore: 25, comment: '' },
      结构: { score: 0, maxScore: 25, comment: '' },
      表达: { score: 0, maxScore: 25, comment: '' },
      创新: { score: 0, maxScore: 25, comment: '' }
    };

    const improvements: string[] = [];

    // Grade 立意 (Thematic depth)
    const themeScore = this.gradeTheme(content);
    dimensions.立意 = themeScore;

    // Grade 结构 (Structure)
    const structureScore = this.gradeStructure(content, sentences, paragraphs);
    dimensions.结构 = structureScore;

    // Grade 表达 (Expression)
    const expressionScore = this.gradeExpression(content, words);
    dimensions.表达 = expressionScore;

    // Grade 创新 (Innovation)
    const innovationScore = this.gradeInnovation(content);
    dimensions.创新 = innovationScore;

    // Generate feedback
    const totalScore = Object.values(dimensions).reduce((sum, d) => sum + d.score, 0);
    const feedback = this.generateFeedback(dimensions, totalScore);

    return {
      dimensions,
      feedback,
      improvements
    };
  }

  private gradeTheme(content: string): { score: number; maxScore: number; comment: string } {
    const keywords = ['观点', '看法', '认为', '想法', '思想', '主题', '核心', '重要', '意义', '价值'];
    let keywordCount = 0;

    for (const keyword of keywords) {
      if (content.includes(keyword)) {
        keywordCount++;
      }
    }

    let score = 15; // Base score
    let comment = '';

    if (keywordCount >= 4) {
      score = 22;
      comment = '主题明确，观点较为明确，有一定的立意深度';
    } else if (keywordCount >= 2) {
      score = 19;
      comment = '主题基本明确，有一些观点表述';
    } else {
      score = 15;
      comment = '主题不够明确，观点表述需要加强';
      return { score, maxScore: 25, comment };
    }

    if (content.length > 500) {
      score += 2;
    }
    if (content.length > 800) {
      score += 1;
    }

    score = Math.min(score, 25);

    if (score >= 23) {
      comment = '立意深刻，观点新颖，主题突出';
    }

    return { score, maxScore: 25, comment };
  }

  private gradeStructure(
    content: string,
    sentences: number,
    paragraphs: number
  ): { score: number; maxScore: number; comment: string } {
    let score = 15;
    let comment = '';

    if (paragraphs >= 4) {
      score = 22;
      comment = '结构完整，段落层次分明';
    } else if (paragraphs >= 3) {
      score = 19;
      comment = '结构基本完整，有一定层次感';
    } else {
      score = 15;
      comment = '结构不够完整，建议增加段落';
    }

    // Check for logical connectors
    const connectors = ['因此', '所以', '但是', '然而', '而且', '此外', '首先', '其次', '最后', '总之'];
    let connectorCount = 0;

    for (const connector of connectors) {
      if (content.includes(connector)) {
        connectorCount++;
      }
    }

    if (connectorCount >= 3) {
      score += 2;
      comment += '，逻辑清晰';
    } else if (connectorCount >= 1) {
      score += 1;
    }

    // Check for intro and conclusion
    const hasIntro = content.substring(0, 100).includes('我') || content.substring(0, 100).includes('这是');
    const hasConclusion = content.substring(Math.max(0, content.length - 100)).includes('总之') ||
                         content.substring(Math.max(0, content.length - 100)).includes('综上所述');

    if (hasIntro && hasConclusion) {
      score += 1;
    }

    score = Math.min(score, 25);

    return { score, maxScore: 25, comment };
  }

  private gradeExpression(content: string, words: number): { score: number; maxScore: number; comment: string } {
    let score = 15;
    let comment = '';

    if (words >= 400) {
      score = 20;
      comment = '语言较为流畅，表达较为清晰';
    } else if (words >= 300) {
      score = 18;
      comment = '语言基本流畅，表达清晰';
    } else {
      score = 15;
      comment = '语言表达需要加强，建议增加内容';
    }

    // Check for vocabulary variety
    const uniqueChars = new Set(content.split('')).size;
    const varietyRatio = uniqueChars / words;

    if (varietyRatio > 0.7) {
      score += 3;
      comment = '词汇丰富，用词恰当';
    } else if (varietyRatio > 0.5) {
      score += 2;
      comment += '，用词较为丰富';
    }

    // Check for sentence variety
    const sentences = content.split(/[。！？]/);
    const avgSentenceLength = words / sentences.length;

    if (avgSentenceLength > 15 && avgSentenceLength < 40) {
      score += 2;
    }

    score = Math.min(score, 25);

    return { score, maxScore: 25, comment };
  }

  private gradeInnovation(content: string): { score: number; maxScore: number; comment: string } {
    // This is harder to grade with rules, so we give a conservative score
    let score = 18;
    let comment = '基本完成写作要求，素材较为常见';

    // Check for unusual or specific vocabulary (indicator of unique content)
    const advancedWords = ['独特', '创新', '新颖', '别致', '罕见', '非凡', '卓越', '杰出', '独创'];
    let advancedWordCount = 0;

    for (const word of advancedWords) {
      if (content.includes(word)) {
        advancedWordCount++;
      }
    }

    if (advancedWordCount >= 2) {
      score = 22;
      comment = '有独特的表达方式，展现了一定的创新思维';
    } else if (advancedWordCount >= 1) {
      score = 20;
      comment = '有一些独特的表达，有一定的新意';
    }

    // Length bonus for longer essays (more room for innovation)
    if (content.length > 800) {
      score += 1;
    }

    score = Math.min(score, 25);

    return { score, maxScore: 25, comment };
  }

  private generateFeedback(dimensions: Dimensions, totalScore: number): string {
    if (totalScore >= 90) {
      return '这是一篇优秀的作文，在各个方面都表现出色，值得表扬！';
    } else if (totalScore >= 80) {
      return '这是一篇良好的作文，整体表现不错，在一些细节上还有提升空间。';
    } else if (totalScore >= 70) {
      return '这是一篇中等的作文，基本达到了写作要求，需要在多个方面继续努力。';
    } else if (totalScore >= 60) {
      return '这篇作文达到了及格标准，但在多个方面需要加强练习。';
    } else {
      return '这篇作文需要在多个方面大幅提升，建议多阅读范文，加强写作练习。';
    }
  }
}

// Singleton instance
let ruleServiceInstance: RuleGradingService | null = null;

export function getRuleGradingService(): RuleGradingService {
  if (!ruleServiceInstance) {
    ruleServiceInstance = new RuleGradingService();
  }
  return ruleServiceInstance;
}
