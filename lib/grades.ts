/** Quy đổi điểm theo thang tín chỉ: điểm hệ 10 → hệ 4 và điểm chữ. */
export type GradeRow = { subjectCode: string; groupCode: string | null; subjectName: string; credits: number; l1: string | null; l2: string | null; t3: string | null; final10: string | null };

const SCALE: [number, number, string][] = [
  [9, 4.0, "A+"], [8, 3.5, "A"], [7, 3.0, "B+"], [6, 2.5, "B"], [5, 2.0, "C+"], [4, 1.5, "C"], [3, 1.0, "D+"], [0, 0, "F"],
];

/** "M" = miễn (đạt, không tính vào điểm trung bình). Trống = chưa có điểm. */
export function convert(final10: string | null) {
  const raw = (final10 ?? "").trim().toUpperCase();
  if (!raw) return { score10: null, score4: null, letter: null, passed: false, exempt: false, pending: true };
  if (raw === "M") return { score10: null, score4: null, letter: "M", passed: true, exempt: true, pending: false };
  const n = Number(raw.replace(",", "."));
  if (!Number.isFinite(n)) return { score10: null, score4: null, letter: null, passed: false, exempt: false, pending: true };
  const [, s4, letter] = SCALE.find(([min]) => n >= min)!;
  return { score10: n, score4: s4, letter, passed: n >= 4, exempt: false, pending: false };
}

export function summarize(rows: GradeRow[]) {
  let w = 0, sum10 = 0, sum4 = 0, passedCredits = 0;
  for (const r of rows) {
    const c = convert(r.final10);
    if (c.passed) passedCredits += r.credits;
    if (c.score10 !== null && c.score4 !== null) { w += r.credits; sum10 += c.score10 * r.credits; sum4 += c.score4 * r.credits; }
  }
  const gpa4 = w ? Math.round((sum4 / w) * 100) / 100 : null;
  const gpa10 = w ? Math.round((sum10 / w) * 100) / 100 : null;
  const rank = gpa4 === null ? "—" : gpa4 >= 3.6 ? "Xuất sắc" : gpa4 >= 3.2 ? "Giỏi" : gpa4 >= 2.5 ? "Khá" : gpa4 >= 2.0 ? "Trung bình" : gpa4 >= 1.0 ? "Yếu" : "Kém";
  return { gpa4, gpa10, passedCredits, rank };
}
