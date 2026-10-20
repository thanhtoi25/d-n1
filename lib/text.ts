import { removeVietnameseTones } from "./utils";

/** Chuẩn hóa chuỗi tìm kiếm không dấu. */
export const normalizeSearch = (v: string) => removeVietnameseTones(v).replace(/\s+/g, " ").trim();

/** Loại bỏ thẻ HTML/script và thuộc tính nguy hiểm; nội dung được lưu và render dưới dạng văn bản thuần. */
export function sanitizeText(input: string) {
  return input
    .replace(/<(script|style|iframe|object|embed)[\s\S]*?<\/\1>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/\u0000/g, "")
    .trim();
}

export function slugify(title: string) {
  const base = removeVietnameseTones(title).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "thong-bao";
  return `${base}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

/** Mã sinh viên luôn là chuỗi để giữ số 0 đầu. */
export const normalizeStudentCode = (v: unknown) => {
  const s = String(v ?? "").trim().replace(/\s+/g, "");
  return s.length ? s : null;
};
