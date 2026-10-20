import { createHash, randomBytes } from "crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { prisma } from "./prisma";

export const SESSION_COOKIE = "da26ttnt_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const hash = (value: string) => createHash("sha256").update(value).digest("hex");

/** Thứ bậc quyền: ADMIN > CLASS_OFFICER > MEMBER. */
const ROLE_RANK: Record<Role, number> = { MEMBER: 1, CLASS_OFFICER: 2, ADMIN: 3 };
export const hasRole = (role: Role, min: Role) => ROLE_RANK[role] >= ROLE_RANK[min];

/** Chỉ cho phép đường dẫn nội bộ để tránh open redirect. */
export function safeNext(value: unknown, fallback = "/") {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await prisma.session.create({ data: { tokenHash: hash(token), userId, expiresAt } });
  // Dọn session hết hạn của user (không chặn đăng nhập nếu lỗi).
  prisma.session.deleteMany({ where: { userId, expiresAt: { lt: new Date() } } }).catch(() => undefined);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

/** Lấy người dùng hiện tại; chỉ chấp nhận tài khoản ACTIVE. Cache trong một request. */
export const currentUser = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hash(token) },
    include: { user: { include: { member: { select: { id: true, avatarUrl: true } } } } },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  if (session.user.status !== "ACTIVE") return null;
  const { passwordHash: _omit, ...user } = session.user;
  void _omit;
  return user;
});

export type SessionUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

/** Dùng trong server component / server action: chuyển hướng nếu thiếu quyền. */
export async function requireRole(min: Role, next = "/") {
  const user = await currentUser();
  if (!user || !hasRole(user.role, min)) redirect(`/dang-nhap?next=${encodeURIComponent(safeNext(next))}`);
  return user;
}
export const requireUser = (next = "/") => requireRole("MEMBER", next);
export const requireAdmin = () => requireRole("ADMIN", "/quan-tri");

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: hash(token) } });
  store.delete(SESSION_COOKIE);
}

/** Thu hồi mọi phiên của một user (khi đổi quyền, khóa tài khoản, đổi mật khẩu). */
export const revokeAllSessions = (userId: string) => prisma.session.deleteMany({ where: { userId } });
