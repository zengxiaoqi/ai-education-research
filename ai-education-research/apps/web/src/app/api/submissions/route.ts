import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { diagnose } from "@/lib/diagnose";

const schema = z.object({
  assignmentId: z.string().min(1),
  answer: z.string().min(1),
  reasoning: z.string().min(1),
});

export async function POST(req: Request) {
  const user = await requireRole("student");
  if (!user) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  try {
    const body = schema.parse(await req.json());

    const submission = await prisma.submission.create({
      data: {
        assignmentId: body.assignmentId,
        studentId: user.id,
        answer: body.answer,
        reasoning: body.reasoning,
      },
    });

    const result = diagnose({ answer: body.answer, reasoning: body.reasoning });

    const diagnosis = await prisma.diagnosis.create({
      data: {
        submissionId: submission.id,
        misconceptionType: result.misconceptionType,
        evidence: result.evidence,
        suggestion: result.suggestion,
        confidence: result.confidence,
        needsReview: result.needsReview,
      },
    });

    if (diagnosis.needsReview) {
      await prisma.reviewTask.create({
        data: {
          diagnosisId: diagnosis.id,
        },
      });
    }

    return NextResponse.json({ submissionId: submission.id, status: "submitted" }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
}
