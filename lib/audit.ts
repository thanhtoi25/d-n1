import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

type Db = Pick<typeof prisma, "auditLog">;

/** Ghi nhật ký thao tác quan trọng. Không bao giờ truyền mật khẩu/token vào metadata. */
export async function audit(
  actorId: string | null,
  action: string,
  entity: string,
  entityId?: string | null,
  metadata?: Prisma.InputJsonValue,
  db: Db = prisma,
) {
  try {
    await db.auditLog.create({ data: { actorId, action, entity, entityId: entityId ?? null, metadata } });
  } catch (error) {
    console.error("[audit] ghi log thất bại", action, error instanceof Error ? error.message : "");
  }
}
