import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { analyze, commit, importOptions, readSheet, readWorkbook } from "@/lib/services/import";
import { makeUser, resetDb } from "./helpers";

beforeEach(resetDb);
const csv = (text: string, name = "ds.csv") => new File(["\uFEFF" + text], name, { type: "text/csv" });
const mapping = { fullName: "Họ và tên", studentCode: "Mã SV", publicEmail: "Email" };
const opts = (o: object = {}) => importOptions.parse({ mapping, ...o });
async function rowsOf(file: File) { return readSheet(await readWorkbook(file)).rows; }

describe("nhập danh sách", () => {
  const header = "Họ và tên,Mã SV,Email\n";
  it("đọc tiếng Việt và giữ số 0 đầu mã sinh viên", async () => {
    const rows = await rowsOf(csv(header + "Nguyễn Đình Thịnh,00123,a@x.com\n"));
    const { results } = await analyze(rows, opts());
    expect(results[0].data).toMatchObject({ fullName: "Nguyễn Đình Thịnh", studentCode: "00123" });
    expect(results[0].status).toBe("new");
  });
  it("bỏ qua dòng trống; số dòng tính theo tệp", async () => {
    const rows = await rowsOf(csv(header + "A,1,\n,,\nB,2,\n"));
    const { results, summary } = await analyze(rows, opts());
    expect(summary.total).toBe(2);
    expect(results.map((r) => r.row)).toEqual([2, 4]);
  });
  it("báo lỗi: thiếu họ tên, email sai, mã trùng trong tệp", async () => {
    const rows = await rowsOf(csv(header + ",1,\nB,2,khong-phai-email\nC,3,\nD,3,\n"));
    const { results, summary } = await analyze(rows, opts());
    expect(results[0].messages.join()).toMatch(/Thiếu họ tên/);
    expect(results[1].messages.join()).toMatch(/Email không hợp lệ/);
    expect(results[3].messages.join()).toMatch(/trùng với dòng 4/);
    expect(summary.error).toBe(3);
  });
  it("phát hiện trùng mã trong CSDL: skip không ghi đè, update thì cập nhật", async () => {
    const admin = await makeUser("ADMIN");
    await prisma.member.create({ data: { fullName: "Tên Cũ", searchName: "ten cu", studentCode: "7" } });
    const file = csv(header + "Tên Mới,7,\n");
    const rows = await rowsOf(file);
    expect((await analyze(rows, opts({ policy: "skip" }))).results[0].status).toBe("skip");
    await commit(file, rows, opts({ policy: "skip" }), admin);
    expect((await prisma.member.findUniqueOrThrow({ where: { studentCode: "7" } })).fullName).toBe("Tên Cũ");
    expect((await analyze(rows, opts({ policy: "update" }))).results[0].status).toBe("update");
    await commit(file, rows, opts({ policy: "update" }), admin);
    expect((await prisma.member.findUniqueOrThrow({ where: { studentCode: "7" } })).fullName).toBe("Tên Mới");
  });
  it("thiếu mã SV mà trùng họ tên: bỏ qua trừ khi được cho phép", async () => {
    await prisma.member.create({ data: { fullName: "Lê Hoa", searchName: "le hoa", studentCode: "1" } });
    const rows = await rowsOf(csv(header + "Lê Hoa,,\n"));
    expect((await analyze(rows, opts())).results[0].status).toBe("skip");
    expect((await analyze(rows, opts({ allowPossibleDuplicates: true }))).results[0].status).toBe("new");
  });
  it("commit ghi thành viên + ImportJob + audit; lưu mã dạng chuỗi", async () => {
    const admin = await makeUser("ADMIN");
    const file = csv(header + "A,001,\nB,002,b@x.com\n");
    const res = await commit(file, await rowsOf(file), opts(), admin);
    expect(res.summary.new).toBe(2);
    expect((await prisma.member.findMany({ orderBy: { studentCode: "asc" } })).map((m) => m.studentCode)).toEqual(["001", "002"]);
    const job = await prisma.importJob.findUniqueOrThrow({ where: { id: res.jobId } });
    expect(job).toMatchObject({ status: "COMPLETED", successRows: 2, createdById: admin.id });
    expect(await prisma.auditLog.count({ where: { action: "MEMBER_IMPORT" } })).toBe(1);
  });
  it("từ chối commit khi còn dòng lỗi và không ghi gì (không nhập dở dang)", async () => {
    const admin = await makeUser("ADMIN");
    const file = csv(header + "Hợp lệ,1,\n,2,\n");
    await expect(commit(file, await rowsOf(file), opts(), admin)).rejects.toMatchObject({ status: 422 });
    expect(await prisma.member.count()).toBe(0);
    expect(await prisma.importJob.count()).toBe(0);
  });
  it("rollback toàn bộ nếu transaction lỗi giữa chừng", async () => {
    const admin = await makeUser("ADMIN");
    const file = csv(header + "A,1,\nB,2,\n");
    const rows = await rowsOf(file);
    // Chèn mã 2 sau khi phân tích để gây xung đột unique ở dòng thứ hai trong lúc commit.
    const original = prisma.member.findMany.bind(prisma.member);
    let raced = false;
    (prisma.member as unknown as { findMany: unknown }).findMany = async (...args: Parameters<typeof original>) => {
      const out = await original(...args);
      if (!raced) { raced = true; await prisma.member.create({ data: { fullName: "Race", searchName: "race", studentCode: "2" } }); }
      return out;
    };
    try { await expect(commit(file, rows, opts(), admin)).rejects.toBeTruthy(); }
    finally { (prisma.member as unknown as { findMany: unknown }).findMany = original; }
    expect(await prisma.member.findFirst({ where: { studentCode: "1" } })).toBeNull(); // dòng 1 đã bị rollback
    expect(await prisma.importJob.count()).toBe(0);
  });
  it("từ chối định dạng sai, tệp rỗng, tệp quá lớn", async () => {
    await expect(readWorkbook(new File(["x"], "a.txt"))).rejects.toMatchObject({ status: 415 });
    await expect(readWorkbook(new File([""], "a.csv"))).rejects.toMatchObject({ status: 400 });
    await expect(readWorkbook(new File([new Uint8Array(5 * 1024 * 1024 + 1)], "a.csv"))).rejects.toMatchObject({ status: 413 });
  });
  it("bắt buộc ghép cột họ tên", async () => {
    const rows = await rowsOf(csv(header + "A,1,\n"));
    await expect(analyze(rows, importOptions.parse({ mapping: { studentCode: "Mã SV" } }))).rejects.toMatchObject({ status: 400 });
  });
  it("làm sạch HTML trong họ tên khi nhập", async () => {
    const rows = await rowsOf(csv(header + "<b>Tên</b> <script>x</script>Sạch,1,\n"));
    expect((await analyze(rows, opts())).results[0].data?.fullName).toBe("Tên Sạch");
  });
});
