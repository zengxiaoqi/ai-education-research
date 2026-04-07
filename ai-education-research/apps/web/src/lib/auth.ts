import { cookies } from "next/headers";
import { prisma } from "./prisma";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("demo_user_id")?.value;

  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
  });
}

export async function requireRole(role: "teacher" | "student") {
  const user = await getCurrentUser();
  if (!user || user.role !== role) {
    return null;
  }
  return user;
}

// Allow either teacher or student
export async function requireAnyRole() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }
  return user;
}
