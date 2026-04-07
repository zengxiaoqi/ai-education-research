import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.email(),
  role: z.enum(["teacher", "student"]),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());

    const user = await prisma.user.upsert({
      where: { email: body.email },
      update: { role: body.role },
      create: {
        email: body.email,
        role: body.role,
        name: body.email.split("@")[0],
      },
    });

    const res = NextResponse.json({ id: user.id, email: user.email, role: user.role });
    res.cookies.set("demo_user_id", user.id, { httpOnly: true, sameSite: "lax", path: "/", secure: false });
    res.cookies.set("demo_role", user.role, { httpOnly: true, sameSite: "lax", path: "/", secure: false });
    return res;
  } catch {
    return NextResponse.json({ error: "invalid_login_payload" }, { status: 400 });
  }
}
