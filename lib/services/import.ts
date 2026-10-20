import * as XLSX from "xlsx";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { HttpError } from "@/lib/api";
import type { SessionUser } from "@/lib/auth";
import { normalizeSearch, normalizeStudentCode, sanitizeText } from "@/lib/text";

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 2000;
const ALLOWED_EXT = /\.(xlsx|xls|csv)$/i;

export const FIELDS = ["fullName", "studentCode", "publicEmail", "publicPhone", "birthDate", "residence", "bio"] as const;
export type Field = (typeof FIELDS)[number];

export const importOptions = z.object({
  sheet: z.string().max(100).optional(),
  mapping: z.partialRecord(z.enum(FIELDS), z.string().max(200)),
  policy: z.enum(["skip", "update"]).default("skip"),
  allowPossibleDuplicates: z.boolean().default(false),
});

export async function readWorkbook(file: File) {
  if (!ALLOWED_EXT.test(file.name)) throw new HttpError(415, "Chỉ hỗ trợ tệp .xlsx, .xls hoặc .csv.");
  if (file.size === 0) throw new HttpError(400, "Tệp rỗng.");
  if (file.size > MAX_IMPORT_BYTES) throw new HttpError(413, "Tệp vượt quá 5 MB.");
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    if (/\.csv$/i.test(file.name)) {
      // Giải mã UTF-8 thủ công, bỏ BOM; raw:true giữ mọi ô dạng chuỗi (không mất số 0 đầu).
      const text = new TextDecoder("utf-8").decode(buf).replace(/^\uFEFF/, "");
      return XLSX.read(text, { type: "string", raw: true });
    }
    return XLSX.read(buf, { type: "buffer", cellDates: true });
  } catch {
    throw new HttpError(422, "Không đọc được tệp. Hãy kiểm tra định dạng.");
  }
}

export function readSheet(wb: XLSX.WorkBook, sheet?: string) {
  const name = sheet ?? wb.SheetNames[0];
  const ws = wb.Sheets[name];
  if (!ws) throw new HttpError(400, "Sheet không tồn tại.");
  // Đọc dạng mảng, giữ dòng trống để số dòng khớp với tệp; analyze() sẽ bỏ qua dòng trống.
  const grid = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "", raw: false, blankrows: true });
  const headers = (grid[0] ?? []).map((h) => String(h ?? "").replace(/^\uFEFF/, "").trim());
  const body = grid.slice(1);
  while (body.length && body[body.length - 1].every((v) => String(v ?? "").trim() === "")) body.pop();
  if (body.length > MAX_ROWS) throw new HttpError(413, `Tối đa ${MAX_ROWS} dòng mỗi lần nhập.`);
  const rows = body.map((cells) => Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? ""])) as Record<string, unknown>);
  return { sheet: name, headers, rows };
}

type Opts = z.infer<typeof importOptions>;
type RowResult = {
  row: number;
  status: "new" | "update" | "skip" | "error";
  messages: string[];
  data?: { fullName: string; studentCode: string | null; publicEmail: string | null; publicPhone: string | null; birthDate: string | null; residence: string | null; bio: string | null };
  existingId?: string;
};

const emailOk = z.email();

/** Chuẩn hóa ngày sinh về dd/mm/yyyy (nhận dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd, m/d/yy của Excel). */
function normalizeDate(raw: string): string | null | undefined {
  if (!raw) return null;
  let d: number, m: number, y: number;
  let x = raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (x) { y = +x[1]; m = +x[2]; d = +x[3]; }
  else if ((x = raw.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/))) { d = +x[1]; m = +x[2]; y = +x[3]; if (y < 100) y += y > 50 ? 1900 : 2000; }
  else return undefined;
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return undefined;
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

/** Kiểm tra toàn bộ dữ liệu tại server — dùng chung cho preview và commit. */
export async function analyze(rows: Record<string, unknown>[], opts: Opts) {
  if (!opts.mapping.fullName) throw new HttpError(400, "Cần ghép cột cho Họ và tên.");
  const get = (r: Record<string, unknown>, f: Field) => (opts.mapping[f] ? String(r[opts.mapping[f]!] ?? "").trim() : "");

  const parsed = rows
    .map((r, i) => ({ r, row: i + 2 })) // +2: dòng 1 là tiêu đề
    .filter(({ r }) => Object.values(r).some((v) => String(v ?? "").trim() !== ""));

  const codes = parsed.map(({ r }) => normalizeStudentCode(get(r, "studentCode"))).filter((c): c is string => !!c);
  const existingByCode = new Map((await prisma.member.findMany({ where: { studentCode: { in: codes } }, select: { id: true, studentCode: true } })).map((m) => [m.studentCode!, m.id]));
  const existingNames = new Set((await prisma.member.findMany({ where: { studentCode: null }, select: { searchName: true } })).map((m) => m.searchName));
  const allNames = new Set((await prisma.member.findMany({ select: { searchName: true } })).map((m) => m.searchName));

  const seenCodes = new Map<string, number>();
  const results: RowResult[] = parsed.map(({ r, row }) => {
    const messages: string[] = [];
    const fullName = sanitizeText(get(r, "fullName")).replace(/\s+/g, " ");
    const studentCode = normalizeStudentCode(get(r, "studentCode"));
    const email = get(r, "publicEmail");
    const phone = sanitizeText(get(r, "publicPhone"));
    const birthDate = normalizeDate(get(r, "birthDate"));
    const residence = sanitizeText(get(r, "residence"));
    const bio = sanitizeText(get(r, "bio"));

    if (birthDate === undefined) messages.push("Ngày sinh không hợp lệ (dd/mm/yyyy).");
    if (residence.length > 120) messages.push("Trạng thái cư trú quá dài.");
    if (bio.length > 1000) messages.push("Nội dung giới thiệu quá 1000 ký tự.");
    if (!fullName) messages.push("Thiếu họ tên.");
    if (fullName.length > 120) messages.push("Họ tên quá dài.");
    if (email && !emailOk.safeParse(email).success) messages.push("Email không hợp lệ.");
    if (phone && !/^[0-9+().\-\s]{6,30}$/.test(phone)) messages.push("Số điện thoại không hợp lệ.");
    if (studentCode) {
      const first = seenCodes.get(studentCode);
      if (first) messages.push(`Mã sinh viên trùng với dòng ${first} trong tệp.`);
      else seenCodes.set(studentCode, row);
    }
    if (messages.length) return { row, status: "error", messages } as RowResult;

    const data = { fullName, studentCode, publicEmail: email || null, publicPhone: phone || null, birthDate: birthDate ?? null, residence: residence || null, bio: bio || null };
    if (studentCode && existingByCode.has(studentCode)) {
      return opts.policy === "update"
        ? { row, status: "update", messages: ["Trùng mã sinh viên trong CSDL — sẽ cập nhật."], data, existingId: existingByCode.get(studentCode) }
        : { row, status: "skip", messages: ["Trùng mã sinh viên trong CSDL — bỏ qua."], data };
    }
    if (!studentCode && (existingNames.has(normalizeSearch(fullName)) || allNames.has(normalizeSearch(fullName)))) {
      return opts.allowPossibleDuplicates
        ? { row, status: "new", messages: ["Thiếu mã sinh viên, có thể trùng người đã có — cần xem lại."], data }
        : { row, status: "skip", messages: ["Thiếu mã sinh viên và trùng họ tên người đã có — bỏ qua để xem lại."], data };
    }
    return { row, status: "new", messages: studentCode ? [] : ["Thiếu mã sinh viên."], data };
  });

  const count = (s: RowResult["status"]) => results.filter((x) => x.status === s).length;
  return { results, summary: { total: results.length, new: count("new"), update: count("update"), skip: count("skip"), error: count("error") } };
}

/** Nhập trong một transaction: lỗi bất kỳ sẽ rollback toàn bộ. Không ghi đè khi policy = skip. */
export async function commit(file: File, rows: Record<string, unknown>[], opts: Opts, actor: SessionUser) {
  const { results, summary } = await analyze(rows, opts);
  if (summary.error > 0) throw new HttpError(422, "Tệp còn dòng lỗi, hãy sửa trước khi nhập.", results.filter((r) => r.status === "error"));

  const job = await prisma.$transaction(
    async (tx) => {
      for (const r of results) {
        if (!r.data) continue;
        const base = { ...r.data, searchName: normalizeSearch(r.data.fullName) };
        if (r.status === "new") await tx.member.create({ data: base });
        else if (r.status === "update" && r.existingId) {
          // Khi cập nhật: cột để trống trong tệp không xóa dữ liệu đã có.
          const patch = Object.fromEntries(Object.entries(base).filter(([, v]) => v !== null));
          await tx.member.update({ where: { id: r.existingId }, data: patch });
        }
      }
      return tx.importJob.create({
        data: {
          fileName: file.name.slice(0, 200),
          status: "COMPLETED",
          totalRows: summary.total,
          successRows: summary.new + summary.update,
          errorRows: summary.error,
          report: JSON.parse(JSON.stringify({ summary, skipped: results.filter((r) => r.status === "skip") })),
          createdById: actor.id,
        },
      });
    },
    { timeout: 30_000 },
  );
  await audit(actor.id, "MEMBER_IMPORT", "ImportJob", job.id, summary);
  return { jobId: job.id, summary };
}
