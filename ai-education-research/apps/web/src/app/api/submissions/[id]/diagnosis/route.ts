import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getGradingService } from "@/lib/grading/gradingService";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // 查询现有诊断结果
  const existingDiagnosis = await prisma.diagnosis.findFirst({
    where: { submissionId: id },
  });

  // 如果有现有诊断，直接返回
  if (existingDiagnosis) {
    return NextResponse.json(existingDiagnosis);
  }

  // 如果没有诊断，返回提示需要生成
  return NextResponse.json({ 
    status: "pending",
    submissionId: id,
    message: "No diagnosis found. Use POST to generate diagnosis."
  }, { status: 404 });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  try {
    // 获取提交内容
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { assignment: true }
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // 使用 AI 批改引擎
    const gradingService = getGradingService();
    const result = await gradingService.diagnose(id, submission.answer);

    // 保存诊断结果到数据库
    const diagnosis = await prisma.diagnosis.upsert({
      where: { submissionId: id },
      create: {
        submissionId: id,
        evidence: result.feedback || "",
        suggestion: result.improvements.join("; ") || "",
        confidence: result.dimensions.立意?.score || 0,
        misconceptionType: result.dimensions.结构?.comment || "general",
        needsReview: result.needsReview,
        feedback: result.feedback,
        dimensionScores: JSON.stringify(result.dimensions),
        totalScore: result.totalScore,
        improvements: JSON.stringify(result.improvements),
      },
      update: {
        evidence: result.feedback || "",
        suggestion: result.improvements.join("; ") || "",
        confidence: result.dimensions.立意?.score || 0,
        misconceptionType: result.dimensions.结构?.comment || "general",
        needsReview: result.needsReview,
        feedback: result.feedback,
        dimensionScores: JSON.stringify(result.dimensions),
        totalScore: result.totalScore,
        improvements: JSON.stringify(result.improvements),
      },
    });

    return NextResponse.json(diagnosis);
  } catch (error) {
    console.error("Diagnosis error:", error);
    return NextResponse.json(
      { error: "Failed to diagnose", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}