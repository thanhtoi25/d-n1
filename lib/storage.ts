import { randomBytes } from "crypto";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import { HttpError } from "./api";

/** Adapter lưu file. Local: thư mục ngoài `public`, không thực thi được. Có thể thay bằng S3 cùng giao diện. */
export interface StorageAdapter {
  put(key: string, data: Buffer): Promise<void>;
  get(key: string): Promise<Buffer>;
  remove(key: string): Promise<void>;
}

const root = path.resolve(process.env.STORAGE_DIR ?? "storage/uploads");

const safePath = (key: string) => {
  const full = path.resolve(root, key);
  if (!full.startsWith(root + path.sep)) throw new Error("Khóa lưu trữ không hợp lệ");
  return full;
};

export const storage: StorageAdapter = {
  async put(key, data) {
    const full = safePath(key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, data, { mode: 0o600 });
  },
  get: (key) => readFile(safePath(key)),
  remove: (key) => unlink(safePath(key)).catch(() => undefined),
};

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
/** Phần mở rộng → MIME hợp lệ. Danh sách trắng, không có định dạng thực thi. */
const ALLOWED: Record<string, string[]> = {
  pdf: ["application/pdf"],
  png: ["image/png"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  pptx: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  txt: ["text/plain"],
};

/** Kiểm tra chữ ký (magic bytes) để không tin hoàn toàn vào tên/MIME do client gửi. */
function signatureOk(ext: string, b: Buffer) {
  const starts = (s: string | number[]) => (typeof s === "string" ? b.subarray(0, s.length).toString("latin1") === s : s.every((v, i) => b[i] === v));
  switch (ext) {
    case "pdf": return starts("%PDF");
    case "png": return starts([0x89, 0x50, 0x4e, 0x47]);
    case "jpg": case "jpeg": return starts([0xff, 0xd8, 0xff]);
    case "docx": case "xlsx": case "pptx": return starts("PK");
    case "txt": return !b.includes(0);
    default: return false;
  }
}

export async function validateUpload(file: File) {
  if (file.size === 0) throw new HttpError(400, "Tệp rỗng.");
  if (file.size > MAX_UPLOAD_BYTES) throw new HttpError(413, "Tệp vượt quá 10 MB.");
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mimes = ALLOWED[ext];
  if (!mimes) throw new HttpError(415, `Định dạng .${ext || "?"} không được hỗ trợ.`);
  const buf = Buffer.from(await file.arrayBuffer());
  if (!signatureOk(ext, buf)) throw new HttpError(415, "Nội dung tệp không khớp định dạng.");
  return { buf, mimeType: mimes[0], ext };
}

export const newStorageKey = (ext: string) => `${new Date().getUTCFullYear()}/${randomBytes(16).toString("hex")}.${ext}`;
