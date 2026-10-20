import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  announcementInput, announcementListQuery, createAnnouncement, deleteAnnouncement, getAnnouncement, listAnnouncements, markRead,
  transitionAnnouncement, updateAnnouncement, announcementUpdate,
} from "@/lib/services/announcements";
import { addAttachment, deleteAttachment, readAttachment } from "@/lib/services/attachments";
import { makeUser, resetDb } from "./helpers";

beforeEach(resetDb);
const input = (o: object = {}) => announcementInput.parse({ title: "Thông báo thử", content: "Nội dung", category: "Học vụ", ...o });
const list = (viewer: Awaited<ReturnType<typeof makeUser>>, o: object = {}) => listAnnouncements(announcementListQuery.parse(o), viewer);

describe("thông báo: bản nháp và quyền", () => {
  it("bản nháp không xuất hiện cho người đọc, đăng xong thì có", async () => {
    const admin = await makeUser("ADMIN");
    const member = await makeUser("MEMBER");
    const a = await createAnnouncement(input(), admin);
    expect(a.status).toBe("DRAFT");
    expect((await list(member)).total).toBe(0);
    await expect(getAnnouncement(a.id, member)).rejects.toMatchObject({ status: 404 });
    await transitionAnnouncement(a.id, "publish", admin);
    expect((await list(member)).total).toBe(1);
    expect((await getAnnouncement(a.id, member)).content).toBe("Nội dung");
  });
  it("thành viên không được lọc theo trạng thái nháp", async () => {
    const member = await makeUser("MEMBER");
    await expect(list(member, { status: "DRAFT" })).rejects.toMatchObject({ status: 403 });
  });
  it("ban cán sự chỉ thấy nháp của chính mình", async () => {
    const o1 = await makeUser("CLASS_OFFICER");
    const o2 = await makeUser("CLASS_OFFICER");
    await createAnnouncement(input(), o1);
    expect((await list(o1)).total).toBe(1);
    expect((await list(o2)).total).toBe(0);
  });
  it("ban cán sự không đăng, ghim, công khai được (403)", async () => {
    const officer = await makeUser("CLASS_OFFICER");
    await expect(createAnnouncement(input({ pinned: true }), officer)).rejects.toMatchObject({ status: 403 });
    await expect(createAnnouncement(input({ isPublic: true }), officer)).rejects.toMatchObject({ status: 403 });
    const a = await createAnnouncement(input(), officer);
    await expect(transitionAnnouncement(a.id, "publish", officer)).rejects.toMatchObject({ status: 403 });
  });
  it("ban cán sự không sửa bài của người khác hoặc bài đã đăng", async () => {
    const admin = await makeUser("ADMIN");
    const officer = await makeUser("CLASS_OFFICER");
    const other = await createAnnouncement(input(), admin);
    await expect(updateAnnouncement(other.id, announcementUpdate.parse({ title: "Sửa trộm" }), officer)).rejects.toMatchObject({ status: 403 });
    const mine = await createAnnouncement(input(), officer);
    await updateAnnouncement(mine.id, announcementUpdate.parse({ title: "Tiêu đề mới" }), officer);
    await transitionAnnouncement(mine.id, "publish", admin);
    await expect(updateAnnouncement(mine.id, announcementUpdate.parse({ title: "Sau khi đăng" }), officer)).rejects.toMatchObject({ status: 403 });
  });
  it("chuyển trạng thái hợp lệ: lưu trữ chỉ khi đã đăng; thời gian đăng được giữ", async () => {
    const admin = await makeUser("ADMIN");
    const a = await createAnnouncement(input(), admin);
    await expect(transitionAnnouncement(a.id, "archive", admin)).rejects.toMatchObject({ status: 409 });
    const p = await transitionAnnouncement(a.id, "publish", admin);
    const archived = await transitionAnnouncement(a.id, "archive", admin);
    expect(archived.status).toBe("ARCHIVED");
    expect(archived.publishedAt).toEqual(p.publishedAt);
    await expect(transitionAnnouncement(a.id, "publish", admin).then((r) => r.status)).resolves.toBe("PUBLISHED");
  });
  it("làm sạch XSS trong tiêu đề và nội dung", async () => {
    const admin = await makeUser("ADMIN");
    const a = await createAnnouncement(input({ title: "Tiêu đề <script>x</script>sạch", content: "<img src=x onerror=alert(1)>Nội dung" }), admin);
    expect(a.title).toBe("Tiêu đề sạch");
    expect(a.content).toBe("Nội dung");
  });
  it("tiêu đề quá ngắn bị từ chối", () => {
    expect(announcementInput.safeParse({ title: "ab", content: "x", category: "c" }).success).toBe(false);
  });
  it("ghim lên đầu danh sách", async () => {
    const admin = await makeUser("ADMIN");
    const a = await createAnnouncement(input({ title: "Bài thường" }), admin);
    const b = await createAnnouncement(input({ title: "Bài ghim", pinned: true }), admin);
    await transitionAnnouncement(a.id, "publish", admin);
    await transitionAnnouncement(b.id, "publish", admin);
    expect((await list(admin, { status: "PUBLISHED" })).items[0].title).toBe("Bài ghim");
  });
  it("tìm kiếm không phân biệt hoa thường", async () => {
    const admin = await makeUser("ADMIN");
    const a = await createAnnouncement(input({ title: "Lịch thi cuối kỳ" }), admin);
    await transitionAnnouncement(a.id, "publish", admin);
    expect((await list(admin, { q: "LỊCH THI" })).total).toBe(1);
  });
});

describe("xác nhận đã đọc", () => {
  it("lưu theo tài khoản, idempotent, và nhãn 'mới' đổi sau khi đọc", async () => {
    const admin = await makeUser("ADMIN");
    const m1 = await makeUser("MEMBER");
    const m2 = await makeUser("MEMBER");
    const a = await createAnnouncement(input(), admin);
    await transitionAnnouncement(a.id, "publish", admin);
    expect((await getAnnouncement(a.id, m1)).isNew).toBe(true);
    await markRead(a.id, m1);
    await markRead(a.id, m1);
    expect(await prisma.announcementRead.count()).toBe(1);
    expect((await getAnnouncement(a.id, m1)).read).toBe(true);
    expect((await getAnnouncement(a.id, m1)).isNew).toBe(false);
    expect((await getAnnouncement(a.id, m2)).read).toBe(false); // không ảnh hưởng người khác
    expect((await getAnnouncement(a.id, m1))).not.toHaveProperty("readCount");
    expect((await getAnnouncement(a.id, admin)).readCount).toBe(1);
  });
  it("không xác nhận đọc bản nháp", async () => {
    const admin = await makeUser("ADMIN");
    const member = await makeUser("MEMBER");
    const a = await createAnnouncement(input(), admin);
    await expect(markRead(a.id, member)).rejects.toMatchObject({ status: 404 });
  });
  it("xóa thông báo xóa luôn lượt đọc (cascade)", async () => {
    const admin = await makeUser("ADMIN");
    const a = await createAnnouncement(input(), admin);
    await transitionAnnouncement(a.id, "publish", admin);
    await markRead(a.id, admin);
    await deleteAnnouncement(a.id, admin);
    expect(await prisma.announcementRead.count()).toBe(0);
  });
});

describe("file đính kèm", () => {
  const pdf = () => new File(["%PDF-1.4 test"], "báo cáo.pdf");
  it("file của bản nháp không tải được bởi thành viên; sau khi đăng thì tải được", async () => {
    const admin = await makeUser("ADMIN");
    const member = await makeUser("MEMBER");
    const a = await createAnnouncement(input(), admin);
    const att = await addAttachment(a.id, pdf(), admin);
    await expect(readAttachment(att.id, member)).rejects.toMatchObject({ status: 404 });
    await transitionAnnouncement(a.id, "publish", admin);
    const got = await readAttachment(att.id, member);
    expect(got.data.toString()).toBe("%PDF-1.4 test");
    expect(got.att.mimeType).toBe("application/pdf");
  });
  it("ban cán sự chỉ thêm file vào nháp của mình", async () => {
    const admin = await makeUser("ADMIN");
    const officer = await makeUser("CLASS_OFFICER");
    const a = await createAnnouncement(input(), admin);
    await expect(addAttachment(a.id, pdf(), officer)).rejects.toMatchObject({ status: 403 });
    const mine = await createAnnouncement(input(), officer);
    await addAttachment(mine.id, pdf(), officer);
  });
  it("từ chối file độc hại và không để lại bản ghi", async () => {
    const admin = await makeUser("ADMIN");
    const a = await createAnnouncement(input(), admin);
    await expect(addAttachment(a.id, new File(["MZ"], "virus.exe"), admin)).rejects.toMatchObject({ status: 415 });
    expect(await prisma.attachment.count()).toBe(0);
  });
  it("xóa file xóa bản ghi", async () => {
    const admin = await makeUser("ADMIN");
    const a = await createAnnouncement(input(), admin);
    const att = await addAttachment(a.id, pdf(), admin);
    await deleteAttachment(att.id, admin);
    expect(await prisma.attachment.count()).toBe(0);
  });
  it("giới hạn 10 file mỗi thông báo", async () => {
    const admin = await makeUser("ADMIN");
    const a = await createAnnouncement(input(), admin);
    for (let i = 0; i < 10; i++) await addAttachment(a.id, pdf(), admin);
    await expect(addAttachment(a.id, pdf(), admin)).rejects.toMatchObject({ status: 409 });
  });
});
