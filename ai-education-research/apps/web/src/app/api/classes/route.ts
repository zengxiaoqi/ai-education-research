import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(2),
  subject: z.string().min(1),
  grade: z.string().min(1),
});

export async function GET() {
  const user = await requireRole("teacher");
  if (!user) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const data = await prisma.classroom.findMany({
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
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();

    const data = await prisma.classroom.create({
      data: {
        ...body,
        code,
        teacherId: user.id,
      },
    });

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
}
