import { createHash, randomBytes } from "crypto";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { revokeAllSessions, type SessionUser } from "@/lib/auth";
import { HttpError, notFound } from "@/lib/api";
import { sendMail } from "@/lib/mail";
import { sanitizeText } from "@/lib/text";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const sha = (v: string) => createHash("sha256").update(v).digest("hex");

export const inviteInput = z.object({
  email: z.email().max(254).transform((v) => v.trim().toLowerCase()),
  displayName: z.string().trim().min(1).max(120).transform(sanitizeText),
  role: z.enum(["MEMBER", "CLASS_OFFICER", "ADMIN"]).default("MEMBER"),
  memberId: z.string().optional(),
});
export const accountUpdate = z.object({
  role: z.enum(["MEMBER", "CLASS_OFFICER", "ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
});
export const accountAction = z.object({ action: z.literal("reinvite") });

const select = { id: true, email: true, displayName: true, role: true, status: true, createdAt: true, member: { select: { id: true, fullName: true, studentCode: true } } } as const;

export const listAccounts = () => prisma.user.findMany({ select, orderBy: { createdAt: "desc" } });

async function issueInvite(userId: string, email: string, origin: string) {
  const token = randomBytes(32).toString("hex");
  await prisma.user.update({ where: { id: userId }, data: { inviteTokenHash: sha(token), inviteExpiresAt: new Date(Date.now() + INVITE_TTL_MS), status: "INVITED", passwordHash: null } });
  const link = `${origin}/kich-hoat?token=${token}`;
  const mail = await sendMail(email, "Lời mời tham gia cổng thông tin lớp DA26TTNT", `Bạn được mời kích hoạt tài khoản. Mở liên kết (hiệu lực 7 ngày): ${link}`);
  // Liên kết chỉ trả cho quản trị viên vừa tạo; không ghi vào log.
  return { link, emailSent: mail.sent, emailNote: mail.reason };
}

export async function inviteUser(data: z.infer<typeof inviteInput>, actor: SessionUser, origin: string) {
  if (data.memberId) {
    const m = await prisma.member.findUnique({ where: { id: data.memberId } });
    if (!m) throw notFound("Không tìm thấy thành viên để liên kết.");
    if (m.userId) throw new HttpError(409, "Thành viên này đã có tài khoản.");
  }
  if (await prisma.user.findUnique({ where: { email: data.email } })) throw new HttpError(409, "Email đã được sử dụng.");
  const user = await prisma.user.create({
    data: { email: data.email, displayName: data.displayName, role: data.role, status: "INVITED", ...(data.memberId ? { member: { connect: { id: data.memberId } } } : {}) },
    select,
  });
  await audit(actor.id, "ACCOUNT_INVITE", "User", user.id, { role: data.role });
  return { user, invite: await issueInvite(user.id, user.email, origin) };
}

export async function reinvite(id: string, actor: SessionUser, origin: string) {
  const user = await prisma.user.findUnique({ where: { id }, select });
  if (!user) throw notFound("Không tìm thấy tài khoản.");
  if (user.status === "ACTIVE") throw new HttpError(409, "Tài khoản đã kích hoạt.");
  await audit(actor.id, "ACCOUNT_REINVITE", "User", id);
  return { user, invite: await issueInvite(id, user.email, origin) };
}

export async function updateAccount(id: string, data: z.infer<typeof accountUpdate>, actor: SessionUser) {
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw notFound("Không tìm thấy tài khoản.");
  if (id === actor.id) throw new HttpError(400, "Không thể tự đổi quyền hoặc khóa chính mình.");
  if (data.status && target.status === "INVITED") throw new HttpError(409, "Tài khoản chưa kích hoạt.");
  const losingAdmin = target.role === "ADMIN" && (data.role && data.role !== "ADMIN" || data.status === "SUSPENDED");
  if (losingAdmin && (await prisma.user.count({ where: { role: "ADMIN", status: "ACTIVE" } })) <= 1)
    throw new HttpError(409, "Phải còn ít nhất một quản trị viên hoạt động.");
  const user = await prisma.user.update({ where: { id }, data, select });
  await revokeAllSessions(id); // buộc đăng nhập lại để quyền mới có hiệu lực
  await audit(actor.id, "ACCOUNT_UPDATE", "User", id, data);
  return user;
}

export const activateInput = z.object({
  token: z.string().length(64).regex(/^[0-9a-f]+$/),
  password: z.string().min(10, "Mật khẩu tối thiểu 10 ký tự").max(200),
});

export async function activate(data: z.infer<typeof activateInput>) {
  const user = await prisma.user.findUnique({ where: { inviteTokenHash: sha(data.token) } });
  if (!user || !user.inviteExpiresAt || user.inviteExpiresAt < new Date() || user.status !== "INVITED")
    throw new HttpError(400, "Liên kết kích hoạt không hợp lệ hoặc đã hết hạn.");
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hash(data.password, 12), status: "ACTIVE", inviteTokenHash: null, inviteExpiresAt: null },
  });
  await audit(user.id, "ACCOUNT_ACTIVATE", "User", user.id);
  return user.email;
}
