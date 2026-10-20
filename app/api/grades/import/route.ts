import { HttpError, route } from "@/lib/api";
import { readSheet, readWorkbook } from "@/lib/services/import";
import { analyzeGrades, commitGrades } from "@/lib/services/grade-import";

/** multipart: file, mode = "preview" | "commit", sheet? */
export const POST = route("ADMIN", async (req, { user }) => {
  const form = await req.formData().catch(() => { throw new HttpError(400, "Yêu cầu phải là multipart/form-data."); });
  const file = form.get("file");
  if (!(file instanceof File)) throw new HttpError(400, "Thiếu tệp tải lên.");
  const { headers, rows } = readSheet(await readWorkbook(file), (form.get("sheet") as string) || undefined);
  const mode = String(form.get("mode") ?? "preview");
  if (mode === "preview") return analyzeGrades(headers, rows);
  if (mode === "commit") return commitGrades(file.name, headers, rows, user);
  throw new HttpError(400, "mode không hợp lệ.");
});
