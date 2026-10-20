import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import type { SessionUser } from "@/lib/auth";
import { HttpError, notFound } from "@/lib/api";
import { sanitizeText } from "@/lib/text";

const opt = (max: number) => z.string().trim().max(max).transform(sanitizeText).optional().nullable().transform((v) => v || null);

export const advisorInput = z.object({
  fullName: opt(120),
  title: opt(120),
  department: opt(200),
  introduction: opt(2000),
  avatarUrl: z.url().max(500).optional().nullable().or(z.literal("").transform(() => null)),
  publicEmail: z.email().max(254).optional().nullable().or(z.literal("").transform(() => null)),
  publicPhone: opt(30),
  officeHours: opt(500),
});

/** Chỉ có một hồ sơ cố vấn; chưa có thì trả null để UI hiển thị "Chưa cập nhật". */
export const getAdvisor = () => prisma.advisor.findFirst();

export async function saveAdvisor(data: z.infer<typeof advisorInput>, actor: SessionUser) {
  const existing = await prisma.advisor.findFirst();
  const advisor = existing
    ? await prisma.advisor.update({ where: { id: existing.id }, data })
    : await prisma.advisor.create({ data });
  await audit(actor.id, "ADVISOR_SAVE", "Advisor", advisor.id);
  return advisor;
}

export const positionInput = z.object({
  memberId: z.string().min(1),
  title: z.string().trim().min(1).max(100).transform(sanitizeText),
  duties: opt(1000),
  publicEmail: z.email().max(254).optional().nullable().or(z.literal("").transform(() => null)),
});

/** Danh sách ban cán sự nhóm theo chức vụ, kèm liên kết hồ sơ thành viên. */
export const listPositions = () =>
  prisma.classPosition.findMany({
    include: { member: { select: { id: true, fullName: true, studentCode: true, avatarUrl: true } } },
    orderBy: [{ title: "asc" }, { createdAt: "asc" }],
  });

export async function addPosition(data: z.infer<typeof positionInput>, actor: SessionUser) {
  if (!(await prisma.member.findUnique({ where: { id: data.memberId } }))) throw notFound("Không tìm thấy thành viên.");
  if (await prisma.classPosition.findUnique({ where: { memberId_title: { memberId: data.memberId, title: data.title } } }))
    throw new HttpError(409, "Thành viên đã giữ chức vụ này.");
  const p = await prisma.classPosition.create({ data });
  await audit(actor.id, "POSITION_ADD", "ClassPosition", p.id, { title: p.title });
  return p;
}

export async function removePosition(id: string, actor: SessionUser) {
  await prisma.classPosition.delete({ where: { id } });
  await audit(actor.id, "POSITION_REMOVE", "ClassPosition", id);
}
