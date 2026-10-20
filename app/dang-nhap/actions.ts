"use server";
import { compare, hashSync } from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { createSession, destroySession, safeNext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, resetRateLimit } from "@/lib/rate-limit";

// Hash giả để thời gian phản hồi không tiết lộ email có tồn tại hay không.
const DUMMY_HASH = hashSync("dummy-password-for-timing", 12);
const GENERIC_ERROR = "Email hoặc mật khẩu không đúng, hoặc tài khoản chưa kích hoạt.";

const schema = z.object({
  email: z.email().max(254),
  password: z.string().min(8).max(200),
  next: z.string().optional(),
});

export async function login(_: unknown, formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Email hoặc mật khẩu không hợp lệ." };

  const email = parsed.data.email.trim().toLowerCase();
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  const ipKey = `login:ip:${ip}`;
  const accountKey = `login:acc:${email}`;

  const limited = await rateLimit(ipKey, 20, 15 * 60_000);
  const limitedAcc = await rateLimit(accountKey, 5, 15 * 60_000);
  if (!limited.ok || !limitedAcc.ok) {
    const wait = Math.max(limited.retryAfter, limitedAcc.retryAfter);
    return { error: `Quá nhiều lần thử. Vui lòng thử lại sau ${Math.ceil(wait / 60)} phút.` };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = await compare(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid || user.status !== "ACTIVE") {
    await audit(user?.id ?? null, "LOGIN_FAILED", "User", user?.id, { ip });
    return { error: GENERIC_ERROR };
  }

  await resetRateLimit(accountKey);
  await createSession(user.id);
  await audit(user.id, "LOGIN", "User", user.id, { ip });
  redirect(safeNext(parsed.data.next));
}

export async function logout() {
  await destroySession();
  redirect("/dang-nhap");
}
