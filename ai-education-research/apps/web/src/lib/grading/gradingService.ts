// Main grading service that combines LLM and rule-based grading

import { DiagnosisResponse } from '@/types/grading';
import { getLLMService } from './llmGradingService';
import { getRuleGradingService } from './ruleGradingService';

export class GradingService {
  private llmService = getLLMService();
  private ruleService = getRuleGradingService();

  async diagnose(submissionId: string, content: string, useAI: boolean = true): Promise<DiagnosisResponse> {
    let diagnosis: DiagnosisResponse;

    // Try LLM first if enabled and configured
    if (useAI && this.llmService.isConfigured()) {
      try {
        diagnosis = await this.gradeWithLLM(submissionId, content);
        console.log('✅ LLM grading successful');
        return diagnosis;
      } catch (error) {
        console.warn('⚠️ LLM grading failed, falling back to rule-based grading:', error);
        // Fall through to rule-based grading
      }
    }

    // Fallback to rule-based grading
    console.log('📝 Using rule-based grading');
    diagnosis = await this.gradeWithRules(submissionId, content);
    return diagnosis;
  }

  private async gradeWithLLM(submissionId: string, content: string): Promise<DiagnosisResponse> {
    const result = await this.llmService.gradeEssay(content);

    const dimensions = {
      立意: {
        score: result.立意.score,
        maxScore: 25,
        comment: result.立意.comment
      },
      结构: {
        score: result.结构.score,
        maxScore: 25,
        comment: result.结构.comment
      },
      表达: {
        score: result.表达.score,
        maxScore: 25,
        comment: result.表达.comment
      },
      创新: {
        score: result.创新.score,
        maxScore: 25,
        comment: result.创新.comment
      }
    };

    const totalScore = Object.values(dimensions).reduce((sum, d) => sum + d.score, 0);
    const needsReview = totalScore < 60 || this.hasLowScores(dimensions);

    return {
      submissionId,
      overallScore: totalScore,
      dimensions,
      totalScore: 100, // Standardized to 100-point scale
      needsReview,
      feedback: result.feedback,
      improvements: result.improvements
    };
  }

  private async gradeWithRules(submissionId: string, content: string): Promise<DiagnosisResponse> {
    const result = this.ruleService.gradeEssay(content);

    const totalScore = Object.values(result.dimensions).reduce((sum, d) => sum + d.score, 0);
    const needsReview = totalScore < 60 || content.length < 200;

    // Add improvements based on low scores
    const improvements = [...result.improvements];
    if (result.dimensions.立意.score < 20) {
      improvements.push('主题立意需要更加明确和深刻');
    }
    if (result.dimensions.结构.score < 20) {
      improvements.push('文章结构需要更加完整和清晰');
    }
    if (result.dimensions.表达.score < 20) {
      improvements.push('语言表达需要更加流畅和丰富');
    }
    if (result.dimensions.创新.score < 20) {
      improvements.push('尝试用新颖的素材和表达方式');
    }

    return {
      submissionId,
      overallScore: totalScore,
      dimensions: result.dimensions,
      totalScore: 100,
      needsReview,
      feedback: result.feedback,
      improvements
    };
  }

  private hasLowScores(dimensions: Record<string, { score: number; maxScore: number; comment: string }>): boolean {
    const lowDimensions = Object.values(dimensions).filter((d) => d.score < 15);
    return lowDimensions.length >= 2;
  }
}

// Singleton instance
let gradingServiceInstance: GradingService | null = null;

export function getGradingService(): GradingService {
  if (!gradingServiceInstance) {
    gradingServiceInstance = new GradingService();
  }
  return gradingServiceInstance;
}
