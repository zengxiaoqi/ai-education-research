import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("demo_user_id", "", { maxAge: 0, path: "/" });
  res.cookies.set("demo_role", "", { maxAge: 0, path: "/" });
  return res;
}
