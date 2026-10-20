import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { rateLimit, resetRateLimit } from "@/lib/rate-limit";
import { createMember, deleteMember, getMember, listMembers, memberInput, memberListQuery, memberUpdate, updateMember } from "@/lib/services/members";
import { makeUser, resetDb } from "./helpers";

beforeEach(resetDb);
const q = (o: object = {}) => memberListQuery.parse(o);

describe("rate limit (PostgreSQL)", () => {
  it("chặn sau khi vượt ngưỡng và có retryAfter", async () => {
    for (let i = 0; i < 3; i++) expect((await rateLimit("k1", 3, 60_000)).ok).toBe(true);
    const r = await rateLimit("k1", 3, 60_000);
    expect(r.ok).toBe(false);
    expect(r.retryAfter).toBeGreaterThan(0);
  });
  it("khóa khác nhau độc lập, reset hoạt động", async () => {
    await rateLimit("a", 1, 60_000);
    expect((await rateLimit("a", 1, 60_000)).ok).toBe(false);
    expect((await rateLimit("b", 1, 60_000)).ok).toBe(true);
    await resetRateLimit("a");
    expect((await rateLimit("a", 1, 60_000)).ok).toBe(true);
  });
  it("hết cửa sổ thì đếm lại", async () => {
    await rateLimit("c", 1, 1);
    await new Promise((r) => setTimeout(r, 20));
    expect((await rateLimit("c", 1, 60_000)).ok).toBe(true);
  });
  it("đồng thời vẫn đếm chính xác (nguyên tử)", async () => {
    const results = await Promise.all(Array.from({ length: 10 }, () => rateLimit("race", 5, 60_000)));
    expect(results.filter((r) => r.ok)).toHaveLength(5);
  });
});

describe("thành viên", () => {
  it("tạo, trùng mã sinh viên bị từ chối (409)", async () => {
    const admin = await makeUser("ADMIN");
    await createMember(memberInput.parse({ fullName: "Nguyễn Văn A", studentCode: "001234" }), admin);
    await expect(createMember(memberInput.parse({ fullName: "Người Khác", studentCode: "001234" }), admin)).rejects.toMatchObject({ status: 409 });
  });
  it("cho phép trùng họ tên (không dùng tên làm khóa)", async () => {
    const admin = await makeUser("ADMIN");
    await createMember(memberInput.parse({ fullName: "Trần B", studentCode: "1" }), admin);
    await createMember(memberInput.parse({ fullName: "Trần B", studentCode: "2" }), admin);
    expect((await listMembers(q(), admin)).total).toBe(2);
  });
  it("họ tên bắt buộc và email phải hợp lệ", () => {
    expect(memberInput.safeParse({ fullName: "  " }).success).toBe(false);
    expect(memberInput.safeParse({ fullName: "A", publicEmail: "không-phải-email" }).success).toBe(false);
  });
  it("tìm không dấu, theo mã SV, và giữ số 0 đầu", async () => {
    const admin = await makeUser("ADMIN");
    await createMember(memberInput.parse({ fullName: "Nguyễn Đình Thịnh", studentCode: "000123" }), admin);
    await createMember(memberInput.parse({ fullName: "Lê Hoa", studentCode: "999" }), admin);
    expect((await listMembers(q({ q: "dinh thinh" }), admin)).items.map((m) => m.fullName)).toEqual(["Nguyễn Đình Thịnh"]);
    expect((await listMembers(q({ q: "000123" }), admin)).items[0].studentCode).toBe("000123");
    expect((await listMembers(q({ q: "khong co" }), admin)).total).toBe(0);
  });
  it("phân trang", async () => {
    const admin = await makeUser("ADMIN");
    for (let i = 0; i < 5; i++) await createMember(memberInput.parse({ fullName: `SV ${i}`, studentCode: `${100 + i}` }), admin);
    const p = await listMembers(q({ pageSize: 2, page: 3 }), admin);
    expect(p.items).toHaveLength(1);
    expect(p.totalPages).toBe(3);
  });
  it("trường theo vai trò: thành viên không thấy thông tin tài khoản", async () => {
    const admin = await makeUser("ADMIN");
    const m = await createMember(memberInput.parse({ fullName: "X", studentCode: "5" }), admin);
    const member = await makeUser("MEMBER");
    const officer = await makeUser("CLASS_OFFICER");
    expect(await getMember(m.id, member)).not.toHaveProperty("accountStatus");
    expect(await getMember(m.id, member)).not.toHaveProperty("role");
    expect(await getMember(m.id, officer)).toHaveProperty("accountStatus");
    expect(await getMember(m.id, officer)).not.toHaveProperty("role");
    expect(await getMember(m.id, admin)).toHaveProperty("role");
  });
  it("thành viên không sửa được hồ sơ người khác (403)", async () => {
    const me = await makeUser("MEMBER", true);
    const other = await makeUser("MEMBER", true);
    const otherMember = await prisma.member.findUniqueOrThrow({ where: { userId: other.id } });
    await expect(updateMember(otherMember.id, memberUpdate.parse({ bio: "hack" }), me)).rejects.toMatchObject({ status: 403 });
  });
  it("thành viên chỉ sửa trường được phép của chính mình", async () => {
    const me = await makeUser("MEMBER", true);
    const mine = await prisma.member.findUniqueOrThrow({ where: { userId: me.id } });
    const ok = await updateMember(mine.id, memberUpdate.parse({ bio: "Xin chào" }), me);
    expect(ok.bio).toBe("Xin chào");
    await expect(updateMember(mine.id, memberUpdate.parse({ fullName: "Đổi tên" }), me)).rejects.toMatchObject({ status: 403 });
    await expect(updateMember(mine.id, memberUpdate.parse({ studentCode: "777" }), me)).rejects.toMatchObject({ status: 403 });
  });
  it("làm sạch bio chứa HTML", async () => {
    const admin = await makeUser("ADMIN");
    const m = await createMember(memberInput.parse({ fullName: "Y", bio: "<script>alert(1)</script>an toàn" }), admin);
    expect(m.bio).toBe("an toàn");
  });
  it("xóa và ghi audit log", async () => {
    const admin = await makeUser("ADMIN");
    const m = await createMember(memberInput.parse({ fullName: "Z" }), admin);
    await deleteMember(m.id, admin);
    expect(await prisma.member.count()).toBe(0);
    expect((await prisma.auditLog.findMany({ select: { action: true } })).map((a) => a.action)).toEqual(expect.arrayContaining(["MEMBER_CREATE", "MEMBER_DELETE"]));
  });
});
