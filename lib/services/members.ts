import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { hasRole, type SessionUser } from "@/lib/auth";
import { HttpError, notFound } from "@/lib/api";
import { normalizeSearch, normalizeStudentCode, sanitizeText } from "@/lib/text";

export const memberListQuery = z.object({
  q: z.string().trim().max(100).optional(),
  position: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const optionalText = (max: number) =>
  z.string().trim().max(max).transform(sanitizeText).optional().nullable().transform((v) => v || null);

/** Điểm thang 10, nhận chuỗi "8,5" hoặc số. */
const scoreField = z
  .union([z.number(), z.string().trim()])
  .transform((v, ctx) => {
    if (v === "") return null;
    const n = typeof v === "number" ? v : Number(v.replace(",", "."));
    if (!Number.isFinite(n) || n < 0 || n > 10) { ctx.addIssue({ code: "custom", message: "Điểm phải từ 0 đến 10" }); return z.NEVER; }
    return Math.round(n * 100) / 100;
  })
  .optional()
  .nullable();

export const memberInput = z.object({
  fullName: z.string().trim().min(1, "Họ tên là bắt buộc").max(120).transform(sanitizeText),
  studentCode: z.string().trim().max(30).optional().nullable().transform((v) => normalizeStudentCode(v)),
  publicEmail: z.email().max(254).optional().nullable().or(z.literal("").transform(() => null)),
  publicPhone: optionalText(30),
  bio: optionalText(1000),
  avatarUrl: z.url().max(500).optional().nullable().or(z.literal("").transform(() => null)),
  birthDate: z.string().trim().regex(/^\d{1,2}\/\d{1,2}\/\d{4}$/, "Ngày sinh dạng dd/mm/yyyy").optional().nullable().or(z.literal("").transform(() => null)),
  residence: optionalText(120),
  score: scoreField,
  attendanceScore: scoreField,
  rewardScore: scoreField,
});
export const memberUpdate = memberInput.partial();
/** Trường thành viên được tự sửa trên hồ sơ của mình. */
export const SELF_EDITABLE = ["publicEmail", "publicPhone", "bio", "avatarUrl"] as const;

/** Chỉ trả về các trường được phép công bố. Thông tin tài khoản chỉ dành cho ban cán sự/quản trị. */
function present(m: Prisma.MemberGetPayload<{ include: { positions: true; user: { select: { status: true; role: true } } } }>, viewer: SessionUser) {
  const privileged = hasRole(viewer.role, "CLASS_OFFICER");
  return {
    id: m.id,
    studentCode: m.studentCode,
    fullName: m.fullName,
    avatarUrl: m.avatarUrl,
    publicEmail: m.publicEmail,
    publicPhone: m.publicPhone,
    bio: m.bio,
    birthDate: m.birthDate,
    residence: m.residence,
    score: m.score,
    attendanceScore: m.attendanceScore,
    rewardScore: m.rewardScore,
    positions: m.positions.map((p) => ({ id: p.id, title: p.title, duties: p.duties })),
    ...(privileged ? { accountStatus: m.user?.status ?? null, hasAccount: !!m.user } : {}),
    ...(viewer.role === "ADMIN" ? { role: m.user?.role ?? null, updatedAt: m.updatedAt } : {}),
  };
}
const include = { positions: true, user: { select: { status: true, role: true } } } satisfies Prisma.MemberInclude;

export async function listMembers(query: z.infer<typeof memberListQuery>, viewer: SessionUser) {
  const where: Prisma.MemberWhereInput = {};
  if (query.q) {
    const term = normalizeSearch(query.q);
    where.OR = [{ searchName: { contains: term } }, { studentCode: { contains: query.q.trim() } }];
  }
  if (query.position) where.positions = { some: { title: query.position } };

  const [total, rows] = await prisma.$transaction([
    prisma.member.count({ where }),
    prisma.member.findMany({
      where,
      include,
      orderBy: [{ studentCode: "asc" }, { fullName: "asc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);
  return {
    items: rows.map((m) => present(m, viewer)),
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

export async function getMember(id: string, viewer: SessionUser) {
  const m = await prisma.member.findUnique({ where: { id }, include });
  if (!m) throw notFound("Không tìm thấy thành viên.");
  return present(m, viewer);
}

export async function createMember(data: z.infer<typeof memberInput>, actor: SessionUser) {
  if (data.studentCode) {
    const dup = await prisma.member.findUnique({ where: { studentCode: data.studentCode } });
    if (dup) throw new HttpError(409, `Mã sinh viên ${data.studentCode} đã tồn tại.`);
  }
  const m = await prisma.member.create({
    data: { ...data, searchName: normalizeSearch(data.fullName) },
    include,
  });
  await audit(actor.id, "MEMBER_CREATE", "Member", m.id);
  return present(m, actor);
}

/**
 * Quản trị viên sửa mọi trường; thành viên khác chỉ sửa hồ sơ của mình và chỉ các trường trong SELF_EDITABLE.
 */
export async function updateMember(id: string, data: z.infer<typeof memberUpdate>, actor: SessionUser) {
  const current = await prisma.member.findUnique({ where: { id } });
  if (!current) throw notFound("Không tìm thấy thành viên.");

  const isAdmin = actor.role === "ADMIN";
  if (!isAdmin) {
    if (current.userId !== actor.id) throw new HttpError(403, "Bạn chỉ được sửa hồ sơ của chính mình.");
    const forbidden = Object.keys(data).filter((k) => !(SELF_EDITABLE as readonly string[]).includes(k));
    if (forbidden.length) throw new HttpError(403, `Bạn không được sửa trường: ${forbidden.join(", ")}.`);
  }
  if (data.studentCode && data.studentCode !== current.studentCode) {
    const dup = await prisma.member.findUnique({ where: { studentCode: data.studentCode } });
    if (dup) throw new HttpError(409, `Mã sinh viên ${data.studentCode} đã tồn tại.`);
  }
  const m = await prisma.member.update({
    where: { id },
    data: { ...data, ...(data.fullName ? { searchName: normalizeSearch(data.fullName) } : {}) },
    include,
  });
  await audit(actor.id, "MEMBER_UPDATE", "Member", id, { fields: Object.keys(data) });
  return present(m, actor);
}

export async function deleteMember(id: string, actor: SessionUser) {
  await prisma.member.delete({ where: { id } });
  await audit(actor.id, "MEMBER_DELETE", "Member", id);
}
