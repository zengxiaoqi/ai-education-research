import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, requireAnyRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  status: z.enum(["confirmed", "revised", "rejected"]),
  note: z.string().optional(),
});

// GET review task by submission ID (for student to check review status)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Allow both teacher and student to view
  const user = await requireAnyRole();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id: submissionId } = await params;

  // Find diagnosis by submissionId
  const diagnosis = await prisma.diagnosis.findUnique({
    where: { submissionId },
  });

  if (!diagnosis) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Find review task
  const reviewTask = await prisma.reviewTask.findUnique({
    where: { diagnosisId: diagnosis.id },
  });

  if (!reviewTask) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(reviewTask);
}

// PATCH to update review task status (teacher only)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("teacher");
  if (!user) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;

  try {
    const body = schema.parse(await req.json());
    const data = await prisma.reviewTask.update({
      where: { id },
      data: {
        status: body.status,
        note: body.note,
        reviewerId: user.id,
      },
    });

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
}
