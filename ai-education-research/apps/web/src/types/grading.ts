// Grading Types

export interface DimensionScore {
  score: number;
  maxScore: number;
  comment: string;
}

export interface Dimensions {
  立意: DimensionScore;
  结构: DimensionScore;
  表达: DimensionScore;
  创新: DimensionScore;
}

export interface DiagnosisResponse {
  submissionId: string;
  overallScore: number;
  dimensions: Dimensions;
  totalScore: number;
  needsReview: boolean;
  feedback: string;
  improvements: string[];
}

export interface Submission {
  id: string;
  content: string;
  studentName?: string;
  submitTime?: string;
}

export interface GradingConfig {
  useLLM: boolean;
  llmProvider?: 'deepseek' | 'doubao' | 'openai';
  fallbackToRules: boolean;
}
