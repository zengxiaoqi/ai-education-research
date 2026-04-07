type DiagnoseInput = {
  answer: string;
  reasoning: string;
};

const weakSignals = ["不确定", "猜", "可能", "直接套", "不会", "没思路", "蒙", "不太确定"];
const formulaSignals = ["公式", "formula", "套公式", "顶点", "判别式"];
const conceptSignals = ["定义", "因为", "所以", "先", "再", "因此", "已知", "由此"];

export function diagnose(input: DiagnoseInput) {
  const answer = input.answer.trim();
  const reasoning = input.reasoning.trim();
  const text = `${answer} ${reasoning}`.toLowerCase();

  const hasWeakSignal = weakSignals.some((signal) => text.includes(signal));
  const hasFormulaSignal = formulaSignals.some((signal) => text.includes(signal));
  const conceptSignalCount = conceptSignals.filter((signal) => text.includes(signal)).length;
  const reasoningLength = reasoning.length;

  if (hasWeakSignal || reasoningLength < 24) {
    return {
      misconceptionType: hasFormulaSignal ? "formula_misuse" : "reasoning_gap",
      evidence: "学生答案中出现明显不确定表达，或推理过程过短，暂不适合直接自动反馈。",
      suggestion: "先补全关键推理步骤，再由教师确认误区归因与后续练习建议。",
      confidence: 0.58,
      needsReview: true,
    };
  }

  if (hasFormulaSignal && reasoningLength < 70) {
    return {
      misconceptionType: "formula_misuse",
      evidence: "作答提到了公式套用，但缺少足够的推导与校验步骤，存在公式误用风险。",
      suggestion: "回到公式适用条件，补写每一步依据，并对结果做一次反向校验。",
      confidence: 0.62,
      needsReview: true,
    };
  }

  if (reasoningLength >= 80 && conceptSignalCount >= 2) {
    return {
      misconceptionType: hasFormulaSignal ? "formula_misuse" : "concept_misunderstanding",
      evidence: "学生给出了相对完整的推理链条，系统可稳定生成自动反馈。",
      suggestion: "继续保留分步表达习惯，并针对薄弱概念做 1-2 道变式巩固。",
      confidence: 0.84,
      needsReview: false,
    };
  }

  return {
    misconceptionType: hasFormulaSignal ? "formula_misuse" : "reasoning_gap",
    evidence: "当前作答具备基础解释，但细节仍不充分，系统先给出自动反馈。",
    suggestion: "补充中间步骤与依据，下次尽量把结论和原因一一对应写清楚。",
    confidence: 0.74,
    needsReview: false,
  };
}
