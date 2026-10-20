import { NextResponse } from "next/server";
import { HttpError, route } from "@/lib/api";
import { commit, importOptions, analyze, readSheet, readWorkbook } from "@/lib/services/import";

/**
 * multipart/form-data:
 *  - file: tệp .xlsx/.xls/.csv
 *  - mode: "sheets" (liệt kê sheet+cột) | "preview" | "commit"
 *  - options: JSON { sheet?, mapping, policy, allowPossibleDuplicates }
 * Preview và commit đều chạy cùng bộ kiểm tra tại server.
 */
export const POST = route("ADMIN", async (req, { user }) => {
  const form = await req.formData().catch(() => {
    throw new HttpError(400, "Yêu cầu phải là multipart/form-data.");
  });
  const file = form.get("file");
  if (!(file instanceof File)) throw new HttpError(400, "Thiếu tệp tải lên.");
  const mode = String(form.get("mode") ?? "preview");

  const wb = await readWorkbook(file);

  if (mode === "sheets") {
    return {
      sheets: wb.SheetNames.map((name) => ({ name, headers: readSheet(wb, name).headers })),
    };
  }

  let rawOptions: unknown;
  try {
    rawOptions = JSON.parse(String(form.get("options") ?? "{}"));
  } catch {
    throw new HttpError(400, "Tùy chọn nhập không phải JSON hợp lệ.");
  }
  const opts = importOptions.parse(rawOptions);
  const { rows } = readSheet(wb, opts.sheet);

  if (mode === "preview") return analyze(rows, opts);
  if (mode === "commit") return NextResponse.json({ data: await commit(file, rows, opts, user) }, { status: 201 });
  throw new HttpError(400, "mode không hợp lệ.");
});
