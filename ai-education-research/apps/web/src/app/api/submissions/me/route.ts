import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireRole("student");
  if (!user) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const submissions = await prisma.submission.findMany({
    where: { studentId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      assignment: {
        select: {
          id: true,
          title: true,
          dueAt: true,
        },
      },
      diagnosis: {
        include: {
          reviewTask: {
            select: {
              id: true,
              status: true,
              updatedAt: true,
            },
          },
        },
      },
    },
  });

  const data = submissions.map((sub) => ({
    id: sub.id,
    assignmentId: sub.assignment.id,
    assignmentTitle: sub.assignment.title,
    dueAt: sub.assignment.dueAt,
    submittedAt: sub.createdAt,
    answer: sub.answer,
    reasoning: sub.reasoning,
    diagnosis: sub.diagnosis
      ? {
          id: sub.diagnosis.id,
          misconceptionType: sub.diagnosis.misconceptionType,
          confidence: sub.diagnosis.confidence,
          needsReview: sub.diagnosis.needsReview,
          evidence: sub.diagnosis.evidence,
          suggestion: sub.diagnosis.suggestion,
        }
      : null,
    reviewStatus: sub.diagnosis?.reviewTask?.status || null,
    reviewUpdatedAt: sub.diagnosis?.reviewTask?.updatedAt || null,
  }));

  return NextResponse.json(data);
}
