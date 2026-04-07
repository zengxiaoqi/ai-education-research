import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireRole("student");
  if (!user) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;

  const submission = await prisma.submission.findFirst({
    where: { id, studentId: user.id },
    include: {
      assignment: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  if (!submission) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    id: submission.id,
    assignmentTitle: submission.assignment.title,
    answer: submission.answer,
    reasoning: submission.reasoning,
    submittedAt: submission.createdAt,
  });
}
