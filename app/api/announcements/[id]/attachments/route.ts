import { NextResponse } from "next/server";
import { HttpError, route } from "@/lib/api";
import { addAttachment } from "@/lib/services/attachments";

export const POST = route<{ id: string }>("CLASS_OFFICER", async (req, { user, params }) => {
  const form = await req.formData().catch(() => {
    throw new HttpError(400, "Yêu cầu phải là multipart/form-data.");
  });
  const file = form.get("file");
  if (!(file instanceof File)) throw new HttpError(400, "Thiếu tệp tải lên.");
  return NextResponse.json({ data: await addAttachment(params.id, file, user) }, { status: 201 });
});
