import { prisma } from "@/lib/prisma";
import { hasRole, type SessionUser } from "@/lib/auth";

/** Số liệu trang chủ từ CSDL thật. Khách (chưa đăng nhập) chỉ thấy nội dung được đánh dấu công khai. */
export async function homeData(viewer: SessionUser | null) {
  const published = { status: "PUBLISHED" as const, ...(viewer ? {} : { isPublic: true }) };
  const pick = { id: true, title: true, summary: true, category: true, importance: true, publishedAt: true, pinned: true };
  const [members, advisor, pinned, latest, unread, officers, totalPublished] = await Promise.all([
    viewer ? prisma.member.count() : Promise.resolve(null),
    prisma.advisor.findFirst({ select: { fullName: true, title: true, department: true, publicEmail: true, officeHours: true, avatarUrl: true } }),
    prisma.announcement.findMany({ where: { ...published, pinned: true }, select: pick, orderBy: { publishedAt: "desc" }, take: 3 }),
    prisma.announcement.findMany({ where: published, select: pick, orderBy: { publishedAt: "desc" }, take: 5 }),
    viewer ? prisma.announcement.count({ where: { status: "PUBLISHED", reads: { none: { userId: viewer.id } } } }) : Promise.resolve(null),
    prisma.classPosition.findMany({
      include: { member: { select: { id: true, fullName: true, studentCode: true, avatarUrl: true } } },
      orderBy: { createdAt: "asc" },
      take: 5,
    }),
    prisma.announcement.count({ where: { status: "PUBLISHED" } }),
  ]);
  return { members, advisor, pinned, latest, unread, officers, totalPublished };
}

export async function adminStats() {
  const [members, accounts, published, drafts] = await Promise.all([
    prisma.member.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.announcement.count({ where: { status: "PUBLISHED" } }),
    prisma.announcement.count({ where: { status: "DRAFT" } }),
  ]);
  return { members, accounts, published, drafts };
}

export const isStaff = (u: SessionUser | null) => !!u && hasRole(u.role, "CLASS_OFFICER");
