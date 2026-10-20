import { hash } from "bcryptjs";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";

export async function resetDb() {
  await prisma.$executeRawUnsafe(
    `TRUNCATE "AuditLog","AnnouncementRead","Attachment","Announcement","ClassPosition","Member","Session","ImportJob","Advisor","RateLimit","User" RESTART IDENTITY CASCADE`,
  );
}

let n = 0;
export async function makeUser(role: Role = "MEMBER", withMember = false): Promise<SessionUser> {
  n++;
  const u = await prisma.user.create({
    data: { email: `u${n}-${Date.now()}@test.local`, displayName: `User ${n}`, role, status: "ACTIVE", passwordHash: await hash("password-1234", 4) },
    include: { member: { select: { id: true, avatarUrl: true } } },
  });
  if (withMember) {
    await prisma.member.create({ data: { fullName: `Thành Viên ${n}`, searchName: `thanh vien ${n}`, userId: u.id } });
  }
  const full = await prisma.user.findUniqueOrThrow({ where: { id: u.id }, include: { member: { select: { id: true, avatarUrl: true } } } });
  const { passwordHash, ...rest } = full;
  void passwordHash;
  return rest;
}
