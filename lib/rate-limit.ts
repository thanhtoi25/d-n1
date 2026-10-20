import { prisma } from "./prisma";

/**
 * Giới hạn tần suất lưu trong PostgreSQL nên dùng chung được giữa nhiều instance (không cần Redis).
 * Cửa sổ cố định: khóa `key` được đếm đến `resetAt`, hết hạn thì bắt đầu lại.
 * Nếu CSDL lỗi thì cho qua (fail-open) và ghi log, để lỗi hạ tầng không khóa toàn bộ người dùng.
 */
export async function rateLimit(key: string, limit: number, windowMs: number) {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);
  try {
    const rows = await prisma.$queryRaw<{ count: number; resetAt: Date }[]>`
      INSERT INTO "RateLimit" ("key", "count", "resetAt") VALUES (${key}, 1, ${resetAt})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "RateLimit"."resetAt" <= ${now} THEN 1 ELSE "RateLimit"."count" + 1 END,
        "resetAt" = CASE WHEN "RateLimit"."resetAt" <= ${now} THEN ${resetAt} ELSE "RateLimit"."resetAt" END
      RETURNING "count", "resetAt"`;
    const { count, resetAt: until } = rows[0];
    if (count > limit) return { ok: false as const, retryAfter: Math.max(1, Math.ceil((until.getTime() - now.getTime()) / 1000)) };
    return { ok: true as const, retryAfter: 0 };
  } catch (error) {
    console.error("[rate-limit] lỗi CSDL, cho qua:", error instanceof Error ? error.message : "");
    return { ok: true as const, retryAfter: 0 };
  }
}

export const resetRateLimit = (key: string) => prisma.rateLimit.deleteMany({ where: { key } }).catch(() => undefined);

/** Dọn các bản ghi đã hết hạn (gọi định kỳ hoặc khi đăng nhập thành công). */
export const purgeRateLimits = () => prisma.rateLimit.deleteMany({ where: { resetAt: { lt: new Date() } } }).catch(() => undefined);
