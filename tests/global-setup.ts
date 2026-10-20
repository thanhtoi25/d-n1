import { execSync } from "child_process";
import { rmSync } from "fs";
import path from "path";
import { testDbUrl } from "./db-url";

export default function setup() {
  const url = testDbUrl();
  // Tạo CSDL _test nếu chưa có và áp dụng toàn bộ migration từ đầu (đồng thời kiểm chứng migration).
  execSync("npx prisma migrate deploy", { stdio: "inherit", env: { ...process.env, DATABASE_URL: url }, shell: process.platform === "win32" ? "cmd.exe" : undefined });
  return () => rmSync(path.resolve(__dirname, "../storage/test-uploads"), { recursive: true, force: true });
}
