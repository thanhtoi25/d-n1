import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { hasRole, type SessionUser } from "@/lib/auth";
import { HttpError, notFound } from "@/lib/api";
import { newStorageKey, storage, validateUpload } from "@/lib/storage";

const MAX_PER_ANNOUNCEMENT = 10;

async function loadForWrite(announcementId: string, actor: SessionUser) {
  const a = await prisma.announcement.findUnique({ where: { id: announcementId }, include: { _count: { select: { attachments: true } } } });
  if (!a) throw notFound("Không tìm thấy thông báo.");
  if (actor.role !== "ADMIN" && (a.authorId !== actor.id || a.status !== "DRAFT"))
    throw new HttpError(403, "Bạn chỉ được sửa file của bản nháp do mình tạo.");
  return a;
}

export async function addAttachment(announcementId: string, file: File, actor: SessionUser) {
  const a = await loadForWrite(announcementId, actor);
  if (a._count.attachments >= MAX_PER_ANNOUNCEMENT) throw new HttpError(409, `Tối đa ${MAX_PER_ANNOUNCEMENT} file mỗi thông báo.`);
  const { buf, mimeType, ext } = await validateUpload(file);
  const storageKey = newStorageKey(ext);
  await storage.put(storageKey, buf);
  try {
    const att = await prisma.attachment.create({
      data: { announcementId, originalName: file.name.replace(/[\\/\u0000-\u001f]/g, "_").slice(0, 200), storageKey, mimeType, size: buf.length },
      select: { id: true, originalName: true, mimeType: true, size: true },
    });
    await audit(actor.id, "ATTACHMENT_ADD", "Attachment", att.id, { announcementId });
    return att;
  } catch (e) {
    await storage.remove(storageKey); // không để file mồ côi nếu ghi CSDL lỗi
    throw e;
  }
}

/** Chỉ cho tải khi người dùng được phép xem thông báo chứa file. */
export async function readAttachment(id: string, viewer: SessionUser) {
  const att = await prisma.attachment.findUnique({ where: { id }, include: { announcement: true } });
  if (!att) throw notFound("Không tìm thấy tệp.");
  const a = att.announcement;
  const allowed = viewer.role === "ADMIN" || (a.status === "PUBLISHED") || (hasRole(viewer.role, "CLASS_OFFICER") && a.authorId === viewer.id);
  if (!allowed) throw notFound("Không tìm thấy tệp."); // không lộ sự tồn tại của file nháp
  return { att, data: await storage.get(att.storageKey) };
}

export async function deleteAttachment(id: string, actor: SessionUser) {
  const att = await prisma.attachment.findUnique({ where: { id } });
  if (!att) throw notFound("Không tìm thấy tệp.");
  await loadForWrite(att.announcementId, actor);
  await prisma.attachment.delete({ where: { id } });
  await storage.remove(att.storageKey);
  await audit(actor.id, "ATTACHMENT_DELETE", "Attachment", id);
}
