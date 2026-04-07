import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  classroomId: z.string().min(1),
  title: z.string().min(2),
  prompt: z.string().min(5),
  rubric: z.string().min(2),
  misconceptionTags: z.array(z.string()).default([]),
  dueAt: z.string(),
});

export async function GET() {
  const user = await requireRole("teacher");
  if (!user) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const data = await prisma.assignment.findMany({
    where: { teacherId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const user = await requireRole("teacher");
  if (!user) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  try {
    const body = schema.parse(await req.json());
    const data = await prisma.assignment.create({
      data: {
        classroomId: body.classroomId,
        title: body.title,
        prompt: body.prompt,
        rubric: body.rubric,
        misconceptionTags: body.misconceptionTags.join(","),
        dueAt: new Date(body.dueAt),
        teacherId: user.id,
      },
    });

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
}
