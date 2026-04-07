import { NextResponse } from "next/server";
import { requireAnyRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAnyRole();
  if (!user) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;

  if (user.role === "student") {
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        prompt: true,
        rubric: true,
        misconceptionTags: true,
        dueAt: true,
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({
      ...assignment,
      tags: assignment.misconceptionTags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
  }

  const assignment = await prisma.assignment.findFirst({
    where: {
      id,
      teacherId: user.id,
    },
    include: {
      classroom: {
        select: {
          id: true,
          name: true,
          subject: true,
          grade: true,
        },
      },
      submissions: {
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          diagnosis: {
            include: {
              reviewTask: {
                select: {
                  status: true,
                },
              },
            },
          },
        },
      },
      _count: {
        select: {
          submissions: true,
        },
      },
    },
  });

  if (!assignment) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const pendingReviews = await prisma.reviewTask.count({
    where: {
      status: "pending",
      diagnosis: {
        submission: {
          assignmentId: assignment.id,
        },
      },
    },
  });

  const totalSubmissions = assignment._count.submissions;

  return NextResponse.json({
    id: assignment.id,
    title: assignment.title,
    prompt: assignment.prompt,
    rubric: assignment.rubric,
    dueAt: assignment.dueAt,
    tags: assignment.misconceptionTags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    classroom: assignment.classroom,
    stats: {
      totalSubmissions,
      pendingReviews,
      reviewedSubmissions: Math.max(totalSubmissions - pendingReviews, 0),
    },
    recentSubmissions: assignment.submissions.map((submission) => {
      let status = "auto_feedback";
      if (submission.diagnosis?.needsReview) {
        status = submission.diagnosis.reviewTask?.status ?? "pending";
      }

      return {
        id: submission.id,
        submittedAt: submission.createdAt,
        student: {
          id: submission.student.id,
          name: submission.student.name || submission.student.email,
        },
        answer: submission.answer,
        reasoning: submission.reasoning,
        diagnosis: submission.diagnosis
          ? {
              misconceptionType: submission.diagnosis.misconceptionType,
              confidence: submission.diagnosis.confidence,
              needsReview: submission.diagnosis.needsReview,
            }
          : null,
        status,
      };
    }),
  });
}
