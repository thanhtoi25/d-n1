import { route } from "@/lib/api";
import { deleteAttachment, readAttachment } from "@/lib/services/attachments";

type P = { id: string };

/** Tải file: luôn kiểm tra quyền, buộc tải xuống (không render inline) và chặn MIME sniffing. */
export const GET = route<P>("MEMBER", async (_req, { user, params }) => {
  const { att, data } = await readAttachment(params.id, user);
  return new Response(new Uint8Array(data), {
    headers: {
      "content-type": att.mimeType,
      "content-length": String(data.length),
      "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(att.originalName)}`,
      "x-content-type-options": "nosniff",
      "cache-control": "private, no-store",
    },
  });
});

export const DELETE = route<P>("CLASS_OFFICER", async (_req, { user, params }) => {
  await deleteAttachment(params.id, user);
  return { deleted: true };
});
