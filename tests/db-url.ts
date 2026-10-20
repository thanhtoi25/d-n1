import { readFileSync } from "fs";
import path from "path";

/**
 * CSDL kiểm thử: dùng schema PostgreSQL riêng `test` trong cùng database (tài khoản ứng dụng không có quyền tạo
 * database mới), nên không đụng tới dữ liệu thật ở schema `public`.
 */
export function testDbUrl() {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  const env = readFileSync(path.resolve(__dirname, "../.env"), "utf8");
  const url = /^DATABASE_URL="?([^"\r\n]+)"?/m.exec(env)?.[1];
  if (!url) throw new Error("Thiếu DATABASE_URL trong .env");
  const u = new URL(url);
  u.searchParams.set("schema", "test");
  const test = u.toString();
  if (new URL(test).searchParams.get("schema") !== "test") throw new Error("DATABASE_URL kiểm thử phải dùng schema=test");
  return test;
}
