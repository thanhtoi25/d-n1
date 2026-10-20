import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { hasRole, type SessionUser } from "@/lib/auth";
import { HttpError, notFound } from "@/lib/api";
import { sanitizeText, slugify } from "@/lib/text";

export const announcementListQuery = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().max(50).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

export const announcementInput = z.object({
  title: z.string().trim().min(3).max(200).transform(sanitizeText),
  summary: z.string().trim().max(500).transform(sanitizeText).optional().nullable().transform((v) => v || null),
  content: z.string().trim().min(1).max(20000).transform(sanitizeText),
  category: z.string().trim().min(1).max(50).transform(sanitizeText),
  importance: z.enum(["NORMAL", "IMPORTANT", "URGENT"]).default("NORMAL"),
  isPublic: z.boolean().default(false),
  pinned: z.boolean().default(false),
  deadline: z.coerce.date().optional().nullable(),
});
export const announcementUpdate = announcementInput.partial();

const NEW_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;
const isStaff = (u: SessionUser) => hasRole(u.role, "CLASS_OFFICER");

function present(
  a: Prisma.AnnouncementGetPayload<{ include: { author: { select: { displayName: true } }; attachments: true; reads: { select: { userId: true } } } }>,
  viewer: SessionUser,
) {
  const read = a.reads.some((r) => r.userId === viewer.id);
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    summary: a.summary,
    content: a.content,
    category: a.category,
    importance: a.importance,
    status: a.status,
    pinned: a.pinned,
    isPublic: a.isPublic,
    deadline: a.deadline,
    publishedAt: a.publishedAt,
    updatedAt: a.updatedAt,
    author: a.author.displayName,
    attachments: a.attachments.map(({ id, originalName, mimeType, size }) => ({ id, originalName, mimeType, size })),
    read,
    // "Mới" dựa trên thời điểm đăng và trạng thái đã đọc của chính tài khoản này.
    isNew: !read && !!a.publishedAt && Date.now() - a.publishedAt.getTime() < NEW_WINDOW_MS,
    ...(isStaff(viewer) ? { readCount: a.reads.length } : {}),
  };
}
const include = {
  author: { select: { displayName: true } },
  attachments: true,
  reads: { select: { userId: true } },
} satisfies Prisma.AnnouncementInclude;

/** Người đọc thường chỉ thấy thông báo đã đăng; bản nháp/lưu trữ chỉ tác giả hoặc admin. */
function visibility(viewer: SessionUser): Prisma.AnnouncementWhereInput {
  if (viewer.role === "ADMIN") return {};
  if (viewer.role === "CLASS_OFFICER") return { OR: [{ status: "PUBLISHED" }, { authorId: viewer.id }] };
  return { status: "PUBLISHED" };
}

export async function listAnnouncements(query: z.infer<typeof announcementListQuery>, viewer: SessionUser) {
  const and: Prisma.AnnouncementWhereInput[] = [visibility(viewer)];
  if (query.q) and.push({ OR: [{ title: { contains: query.q, mode: "insensitive" } }, { summary: { contains: query.q, mode: "insensitive" } }] });
  if (query.category) and.push({ category: query.category });
  if (query.status) {
    // Thành viên không được lọc theo trạng thái khác "đã đăng".
    if (!isStaff(viewer) && query.status !== "PUBLISHED") throw new HttpError(403, "Bạn không có quyền xem trạng thái này.");
    and.push({ status: query.status });
  }
  const where = { AND: and };
  const [total, rows] = await prisma.$transaction([
    prisma.announcement.count({ where }),
    prisma.announcement.findMany({
      where,
      include,
      orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);
  return {
    items: rows.map((a) => ({ ...present(a, viewer), content: undefined })),
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

async function loadVisible(id: string, viewer: SessionUser) {
  const a = await prisma.announcement.findFirst({ where: { AND: [{ id }, visibility(viewer)] }, include });
  if (!a) throw notFound("Không tìm thấy thông báo.");
  return a;
}

export async function getAnnouncement(id: string, viewer: SessionUser) {
  return present(await loadVisible(id, viewer), viewer);
}

/** Ban cán sự chỉ được ghim/đăng khi là admin; ban cán sự chỉ tạo và sửa bản nháp của mình. */
function assertCanPublishFlags(data: { pinned?: boolean; isPublic?: boolean }, actor: SessionUser) {
  if (actor.role !== "ADMIN" && (data.pinned || data.isPublic))
    throw new HttpError(403, "Chỉ quản trị viên được ghim hoặc công khai thông báo.");
}

export async function createAnnouncement(data: z.infer<typeof announcementInput>, actor: SessionUser) {
  assertCanPublishFlags(data, actor);
  const a = await prisma.announcement.create({
    data: { ...data, slug: slugify(data.title), status: "DRAFT", authorId: actor.id },
    include,
  });
  await audit(actor.id, "ANNOUNCEMENT_CREATE", "Announcement", a.id);
  return present(a, actor);
}

export async function updateAnnouncement(id: string, data: z.infer<typeof announcementUpdate>, actor: SessionUser) {
  const current = await prisma.announcement.findUnique({ where: { id } });
  if (!current) throw notFound("Không tìm thấy thông báo.");
  if (actor.role !== "ADMIN") {
    if (current.authorId !== actor.id) throw new HttpError(403, "Bạn chỉ được sửa thông báo của mình.");
    if (current.status !== "DRAFT") throw new HttpError(403, "Ban cán sự chỉ được sửa bản nháp.");
  }
  assertCanPublishFlags(data, actor);
  const a = await prisma.announcement.update({ where: { id }, data, include });
  await audit(actor.id, "ANNOUNCEMENT_UPDATE", "Announcement", id, { fields: Object.keys(data) });
  return present(a, actor);
}

const transitions = {
  publish: { from: ["DRAFT", "ARCHIVED"], to: "PUBLISHED" },
  archive: { from: ["PUBLISHED"], to: "ARCHIVED" },
  unpublish: { from: ["PUBLISHED", "ARCHIVED"], to: "DRAFT" },
} as const;
export type Transition = keyof typeof transitions;
export const transitionSchema = z.object({ action: z.enum(["publish", "archive", "unpublish"]) });

export async function transitionAnnouncement(id: string, action: Transition, actor: SessionUser) {
  const current = await prisma.announcement.findUnique({ where: { id } });
  if (!current) throw notFound("Không tìm thấy thông báo.");
  // Đăng/lưu trữ cần quyền quản trị viên cấp; mặc định chỉ ADMIN.
  if (actor.role !== "ADMIN") throw new HttpError(403, "Chỉ quản trị viên được đăng hoặc lưu trữ thông báo.");
  const t = transitions[action];
  if (!(t.from as readonly string[]).includes(current.status))
    throw new HttpError(409, "Trạng thái hiện tại không cho phép thao tác này.");
  const a = await prisma.announcement.update({
    where: { id },
    data: { status: t.to, publishedAt: t.to === "PUBLISHED" ? (current.publishedAt ?? new Date()) : current.publishedAt },
    include,
  });
  await audit(actor.id, `ANNOUNCEMENT_${action.toUpperCase()}`, "Announcement", id);
  return present(a, actor);
}

export async function deleteAnnouncement(id: string, actor: SessionUser) {
  await prisma.announcement.delete({ where: { id } });
  await audit(actor.id, "ANNOUNCEMENT_DELETE", "Announcement", id);
}

/** Xác nhận đã đọc: idempotent, chỉ với thông báo người dùng được phép xem. */
export async function markRead(id: string, viewer: SessionUser) {
  const a = await loadVisible(id, viewer);
  if (a.status !== "PUBLISHED") throw new HttpError(409, "Chỉ xác nhận đọc thông báo đã đăng.");
  await prisma.announcementRead.upsert({
    where: { userId_announcementId: { userId: viewer.id, announcementId: id } },
    update: {},
    create: { userId: viewer.id, announcementId: id },
  });
  return { read: true };
}
