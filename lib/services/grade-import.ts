import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { HttpError } from "@/lib/api";
import type { SessionUser } from "@/lib/auth";
import { normalizeStudentCode, sanitizeText } from "@/lib/text";

/**
 * Tệp điểm: mỗi dòng = 1 sinh viên × 1 môn.
 * Cột: MSSV | Mã MH | Nhóm | Tên môn học | Số tín chỉ | ĐTK L1 | ĐTK L2 | T3 | Điểm TK (10)
 */
const COLS: Record<string, RegExp> = {
  studentCode: /mssv|m[aã]\s*(sv|sinh)/i,
  subjectCode: /m[aã]\s*(mh|m[oô]n)/i,
  groupCode: /nh[oó]m|t[oổ]/i,
  subjectName: /t[eê]n\s*m[oô]n/i,
  credits: /t[ií]n\s*ch[iỉ]/i,
  l1: /l\s*1/i,
  l2: /l\s*2/i,
  t3: /^\s*t\s*3\s*$/i,
  final10: /(tk|t[oổ]ng\s*k[eế]t).*10|đi[eể]m\s*tk\s*$/i,
};
export const GRADE_COLUMNS = ["MSSV", "Mã MH", "Nhóm", "Tên môn học", "Số tín chỉ", "ĐTK L1", "ĐTK L2", "T3", "Điểm TK (10)"];

const scoreOk = (v: string) => !v || /^m$/i.test(v) || (/^\d+([.,]\d+)?$/.test(v) && Number(v.replace(",", ".")) <= 10);

type Row = { row: number; status: "ok" | "error"; messages: string[]; studentCode?: string; subjectName?: string };

export async function analyzeGrades(headers: string[], rows: Record<string, unknown>[]) {
  const map: Record<string, string> = {};
  for (const [k, re] of Object.entries(COLS)) {
    const h = headers.find((x) => re.test(x) && !Object.values(map).includes(x));
    if (h) map[k] = h;
  }
  const missing = ["studentCode", "subjectCode", "subjectName", "credits", "final10"].filter((k) => !map[k]);
  if (missing.length) throw new HttpError(400, `Thiếu cột bắt buộc. Cần có: ${GRADE_COLUMNS.join(", ")}.`);
  const get = (r: Record<string, unknown>, k: string) => (map[k] ? String(r[map[k]] ?? "").trim() : "");

  const members = new Map((await prisma.member.findMany({ where: { studentCode: { not: null } }, select: { id: true, studentCode: true } })).map((m) => [m.studentCode!, m.id]));
  const seen = new Set<string>();
  const results: (Row & { data?: { memberId: string; subjectCode: string; groupCode: string | null; subjectName: string; credits: number; l1: string | null; l2: string | null; t3: string | null; final10: string | null } })[] = [];

  rows.forEach((r, i) => {
    if (!Object.values(r).some((v) => String(v ?? "").trim())) return;
    const row = i + 2, messages: string[] = [];
    const code = normalizeStudentCode(get(r, "studentCode"));
    const subjectCode = sanitizeText(get(r, "subjectCode"));
    const subjectName = sanitizeText(get(r, "subjectName"));
    const credits = Number(get(r, "credits"));
    const sc = { l1: get(r, "l1"), l2: get(r, "l2"), t3: get(r, "t3"), final10: get(r, "final10") };
    const memberId = code ? members.get(code) : undefined;
    if (!code) messages.push("Thiếu MSSV.");
    else if (!memberId) messages.push(`Không tìm thấy sinh viên ${code}.`);
    if (!subjectCode) messages.push("Thiếu mã môn.");
    if (!subjectName) messages.push("Thiếu tên môn.");
    if (!Number.isInteger(credits) || credits < 0 || credits > 20) messages.push("Số tín chỉ không hợp lệ.");
    for (const [k, v] of Object.entries(sc)) if (!scoreOk(v)) messages.push(`Điểm ${k.toUpperCase()} không hợp lệ (0–10 hoặc M).`);
    const key = `${code}|${subjectCode}`;
    if (seen.has(key)) messages.push("Trùng sinh viên + môn trong tệp."); else seen.add(key);
    if (messages.length) return results.push({ row, status: "error", messages, studentCode: code ?? undefined, subjectName });
    const norm = (v: string) => (v ? v.toUpperCase().replace(",", ".") : null);
    results.push({ row, status: "ok", messages: [], studentCode: code!, subjectName, data: { memberId: memberId!, subjectCode, groupCode: get(r, "groupCode") || null, subjectName, credits, l1: norm(sc.l1), l2: norm(sc.l2), t3: norm(sc.t3), final10: norm(sc.final10) } });
  });
  const error = results.filter((r) => r.status === "error").length;
  return { results, summary: { total: results.length, ok: results.length - error, error } };
}

export async function commitGrades(fileName: string, headers: string[], rows: Record<string, unknown>[], actor: SessionUser) {
  const { results, summary } = await analyzeGrades(headers, rows);
  if (summary.error) throw new HttpError(422, "Tệp còn dòng lỗi, hãy sửa trước khi nhập.");
  await prisma.$transaction(async (tx) => {
    for (const r of results) {
      if (!r.data) continue;
      const { memberId, subjectCode, ...rest } = r.data;
      await tx.subjectGrade.upsert({ where: { memberId_subjectCode: { memberId, subjectCode } }, create: r.data, update: rest });
    }
  }, { timeout: 30_000 });
  await audit(actor.id, "GRADE_IMPORT", "SubjectGrade", fileName.slice(0, 200), summary);
  return { summary: { ...summary, fileName: fileName.slice(0, 200) } };
}
