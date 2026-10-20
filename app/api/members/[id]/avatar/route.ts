import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { HttpError, notFound, route } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { storage, validateUpload } from "@/lib/storage";

type P = { id: string };

function avatarKey(id: string, ext: string) {
  if (!/^(png|jpg|jpeg)$/.test(ext)) throw notFound("Không tìm thấy ảnh đại diện.");
  return `avatars/${id}.${ext}`;
}

export const GET = route<P>("MEMBER", async (_req, { params }) => {
  const member = await prisma.member.findUnique({ where: { id: params.id }, select: { avatarUrl: true } });
  if (!member?.avatarUrl) throw notFound("Không tìm thấy ảnh đại diện.");
  const url = new URL(member.avatarUrl, "http://local");
  const ext = url.searchParams.get("ext") ?? "";
  const data = await storage.get(avatarKey(params.id, ext)).catch(() => null);
  if (!data) throw notFound("Không tìm thấy ảnh đại diện.");
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "content-type": ext === "png" ? "image/png" : "image/jpeg",
      "cache-control": "private, max-age=86400",
      "x-content-type-options": "nosniff",
    },
  });
});

export const POST = route<P>("ADMIN", async (req, { user, params }) => {
  if (!(await prisma.member.findUnique({ where: { id: params.id }, select: { id: true } })))
    throw notFound("Không tìm thấy thành viên.");
  const form = await req.formData().catch(() => {
    throw new HttpError(400, "Yêu cầu phải là multipart/form-data.");
  });
  const file = form.get("file");
  if (!(file instanceof File)) throw new HttpError(400, "Thiếu ảnh tải lên.");
  const { buf, ext } = await validateUpload(file);
  if (!/^(png|jpg|jpeg)$/.test(ext)) throw new HttpError(415, "Ảnh đại diện chỉ hỗ trợ PNG hoặc JPEG.");
  if (buf.length > 5 * 1024 * 1024) throw new HttpError(413, "Ảnh đại diện vượt quá 5 MB.");

  await storage.put(avatarKey(params.id, ext), buf);
  const avatarUrl = `/api/members/${params.id}/avatar?ext=${ext}&v=${Date.now()}`;
  await prisma.member.update({ where: { id: params.id }, data: { avatarUrl } });
  await audit(user.id, "MEMBER_AVATAR_UPDATE", "Member", params.id);
  return NextResponse.json({ data: { avatarUrl } });
});
