import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireRole("teacher");
  if (!user) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const items = await prisma.reviewTask.findMany({
    where: { status: "pending" },
    include: {
      diagnosis: {
        include: {
          submission: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(items);
}
