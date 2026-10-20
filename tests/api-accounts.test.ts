import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { z } from "zod";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { activate, inviteInput, inviteUser, reinvite, updateAccount } from "@/lib/services/accounts";
import { addPosition, getAdvisor, positionInput, saveAdvisor, advisorInput } from "@/lib/services/advisor";
import { makeUser, resetDb } from "./helpers";

let current: SessionUser | null = null;
vi.mock("@/lib/auth", async (orig) => ({ ...(await orig<typeof import("@/lib/auth")>()), currentUser: async () => current }));
const { route, parseBody } = await import("@/lib/api");

beforeEach(async () => { await resetDb(); current = null; });
const origin = "http://localhost:3000";
const tokenOf = (link: string) => new URL(link).searchParams.get("token")!;

describe("route(): xác thực, phân quyền, validate", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const call = async (handler: (req: NextRequest, ctx: { params: Promise<any> }) => Promise<Response>, init: { method?: string; body?: unknown; origin?: string } = {}) => {
    const req = new NextRequest("http://localhost:3000/api/x", {
      method: init.method ?? "GET",
      headers: { "content-type": "application/json", ...(init.origin ? { origin: init.origin } : {}) },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    const res = await handler(req, { params: Promise.resolve({}) });
    return { status: res.status, json: await res.json() };
  };
  it("401 khi chưa đăng nhập", async () => {
    expect((await call(route("MEMBER", async () => "ok"))).status).toBe(401);
  });
  it("403 khi thiếu quyền; 200 khi đủ", async () => {
    const h = route("ADMIN", async () => "ok");
    current = await makeUser("MEMBER");
    expect((await call(h)).status).toBe(403);
    current = await makeUser("CLASS_OFFICER");
    expect((await call(h)).status).toBe(403);
    current = await makeUser("ADMIN");
    expect(await call(h)).toEqual({ status: 200, json: { data: "ok" } });
  });
  it("403 với yêu cầu ghi từ origin khác (CSRF)", async () => {
    current = await makeUser("ADMIN");
    const h = route("ADMIN", async () => "ok");
    expect((await call(h, { method: "POST", origin: "https://evil.com", body: {} })).status).toBe(403);
    expect((await call(h, { method: "POST", origin, body: {} })).status).toBe(200);
  });
  it("422 với lỗi theo trường, 400 với JSON hỏng, 500 không lộ chi tiết", async () => {
    current = await makeUser("ADMIN");
    const schema = z.object({ email: z.email() });
    const r = await call(route("ADMIN", async (req) => parseBody(req, schema)), { method: "POST", body: { email: "x" } });
    expect(r.status).toBe(422);
    expect(r.json.details[0].path).toBe("email");
    const bad = new NextRequest("http://localhost:3000/api/x", { method: "POST", body: "{hỏng" });
    const res = await route("ADMIN", async (req) => parseBody(req, schema))(bad, { params: Promise.resolve({}) });
    expect(res.status).toBe(400);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const boom = await call(route("ADMIN", async () => { throw new Error("mật khẩu db = secret123"); }));
    expect(boom.status).toBe(500);
    expect(JSON.stringify(boom.json)).not.toContain("secret123");
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain("secret123");
    errorSpy.mockRestore();
  });
});

describe("tài khoản: mời, kích hoạt, phân quyền", () => {
  it("mời → kích hoạt → trạng thái ACTIVE, token dùng một lần, không lưu token thô", async () => {
    const admin = await makeUser("ADMIN");
    const { user, invite } = await inviteUser(inviteInput.parse({ email: "New@Test.local", displayName: "Mới" }), admin, origin);
    expect(user.status).toBe("INVITED");
    expect(invite.emailSent).toBe(false); // chưa cấu hình email → báo trung thực
    const token = tokenOf(invite.link);
    const stored = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(JSON.stringify(stored)).not.toContain(token);
    expect(await activate({ token, password: "mat-khau-dai-12" })).toBe("new@test.local");
    expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).status).toBe("ACTIVE");
    await expect(activate({ token, password: "mat-khau-dai-12" })).rejects.toMatchObject({ status: 400 });
  });
  it("token sai hoặc hết hạn bị từ chối", async () => {
    const admin = await makeUser("ADMIN");
    const { user, invite } = await inviteUser(inviteInput.parse({ email: "x@test.local", displayName: "X" }), admin, origin);
    await expect(activate({ token: "a".repeat(64), password: "mat-khau-dai-12" })).rejects.toMatchObject({ status: 400 });
    await prisma.user.update({ where: { id: user.id }, data: { inviteExpiresAt: new Date(Date.now() - 1000) } });
    await expect(activate({ token: tokenOf(invite.link), password: "mat-khau-dai-12" })).rejects.toMatchObject({ status: 400 });
    const again = await reinvite(user.id, admin, origin); // gửi lại lời mời cấp token mới
    await activate({ token: tokenOf(again.invite.link), password: "mat-khau-dai-12" });
  });
  it("trùng email bị từ chối; liên kết hồ sơ thành viên chỉ một lần", async () => {
    const admin = await makeUser("ADMIN");
    const m = await prisma.member.create({ data: { fullName: "A", searchName: "a" } });
    await inviteUser(inviteInput.parse({ email: "a@test.local", displayName: "A", memberId: m.id }), admin, origin);
    await expect(inviteUser(inviteInput.parse({ email: "a@test.local", displayName: "A2" }), admin, origin)).rejects.toMatchObject({ status: 409 });
    await expect(inviteUser(inviteInput.parse({ email: "b@test.local", displayName: "B", memberId: m.id }), admin, origin)).rejects.toMatchObject({ status: 409 });
    expect((await prisma.member.findUniqueOrThrow({ where: { id: m.id } })).userId).not.toBeNull();
  });
  it("không tự đổi quyền chính mình, không hạ quản trị viên cuối cùng", async () => {
    const admin = await makeUser("ADMIN");
    await expect(updateAccount(admin.id, { role: "MEMBER" }, admin)).rejects.toMatchObject({ status: 400 });
    const second = await makeUser("ADMIN");
    await updateAccount(admin.id, { role: "MEMBER" }, second); // còn `second` hoạt động → hợp lệ
    // `second` là quản trị viên hoạt động duy nhất; phiên cũ (đã bị khóa trong CSDL) cố hạ chính họ qua actor khác.
    const stale = await makeUser("ADMIN");
    await prisma.user.update({ where: { id: stale.id }, data: { status: "SUSPENDED" } });
    await expect(updateAccount(second.id, { role: "MEMBER" }, stale)).rejects.toMatchObject({ status: 409 });
    await expect(updateAccount(second.id, { status: "SUSPENDED" }, stale)).rejects.toMatchObject({ status: 409 });
  });
  it("đổi quyền/khóa thu hồi mọi phiên đăng nhập", async () => {
    const admin = await makeUser("ADMIN");
    const member = await makeUser("MEMBER");
    await prisma.session.create({ data: { tokenHash: "h1", userId: member.id, expiresAt: new Date(Date.now() + 1e6) } });
    await updateAccount(member.id, { role: "CLASS_OFFICER" }, admin);
    expect(await prisma.session.count({ where: { userId: member.id } })).toBe(0);
  });
  it("mật khẩu ngắn bị từ chối khi kích hoạt (schema)", async () => {
    const { activateInput } = await import("@/lib/services/accounts");
    expect(activateInput.safeParse({ token: "a".repeat(64), password: "ngan" }).success).toBe(false);
  });
});

describe("cố vấn và ban cán sự", () => {
  it("chưa có hồ sơ cố vấn thì null; lưu rồi cập nhật vẫn là một bản ghi", async () => {
    const admin = await makeUser("ADMIN");
    expect(await getAdvisor()).toBeNull();
    await saveAdvisor(advisorInput.parse({ fullName: "Cô A" }), admin);
    await saveAdvisor(advisorInput.parse({ fullName: "Cô A", title: "TS." }), admin);
    expect(await prisma.advisor.count()).toBe(1);
    expect((await getAdvisor())?.title).toBe("TS.");
  });
  it("một thành viên kiêm nhiều chức vụ, không trùng chức vụ", async () => {
    const admin = await makeUser("ADMIN");
    const m = await prisma.member.create({ data: { fullName: "A", searchName: "a" } });
    await addPosition(positionInput.parse({ memberId: m.id, title: "Lớp phó học tập" }), admin);
    await addPosition(positionInput.parse({ memberId: m.id, title: "Bí thư" }), admin);
    await expect(addPosition(positionInput.parse({ memberId: m.id, title: "Bí thư" }), admin)).rejects.toMatchObject({ status: 409 });
    await expect(addPosition(positionInput.parse({ memberId: "khong-co", title: "X" }), admin)).rejects.toMatchObject({ status: 404 });
  });
});
