import { describe, expect, it } from "vitest";
import { normalizeSearch, normalizeStudentCode, sanitizeText, slugify } from "@/lib/text";
import { safeNext, hasRole } from "@/lib/auth";
import { validateUpload } from "@/lib/storage";
import { RichText } from "@/components/rich-text";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

describe("text helpers", () => {
  it("tìm kiếm không dấu", () => {
    expect(normalizeSearch("  Nguyễn  Đình   Thịnh ")).toBe("nguyen dinh thinh");
  });
  it("giữ số 0 đầu của mã sinh viên", () => {
    expect(normalizeStudentCode(" 0012 345 ")).toBe("0012345");
    expect(normalizeStudentCode("  ")).toBeNull();
    expect(normalizeStudentCode(undefined)).toBeNull();
  });
  it("loại bỏ script/HTML (XSS)", () => {
    const out = sanitizeText(`Xin chào <script>alert(1)</script><img src=x onerror=alert(1)> <b>đậm</b> javascript:alert(1)`);
    expect(out).not.toMatch(/<|script|onerror|javascript:/i);
    expect(out).toContain("Xin chào");
  });
  it("slug duy nhất", () => {
    expect(slugify("Thông báo đặc biệt!")).toMatch(/^thong-bao-dac-biet-/);
    expect(slugify("Thông báo")).not.toBe(slugify("Thông báo"));
  });
});

describe("auth helpers", () => {
  it("safeNext chặn open redirect", () => {
    expect(safeNext("/thong-bao")).toBe("/thong-bao");
    for (const bad of ["//evil.com", "https://evil.com", "/\\evil.com", "javascript:alert(1)", undefined, 5])
      expect(safeNext(bad)).toBe("/");
  });
  it("thứ bậc vai trò", () => {
    expect(hasRole("ADMIN", "CLASS_OFFICER")).toBe(true);
    expect(hasRole("MEMBER", "CLASS_OFFICER")).toBe(false);
    expect(hasRole("CLASS_OFFICER", "ADMIN")).toBe(false);
  });
});

describe("kiểm tra file tải lên", () => {
  const file = (name: string, bytes: number[] | string) => new File([typeof bytes === "string" ? bytes : new Uint8Array(bytes)], name);
  it("chấp nhận PDF hợp lệ", async () => {
    expect((await validateUpload(file("a.pdf", "%PDF-1.4 ..."))).mimeType).toBe("application/pdf");
  });
  it("từ chối định dạng thực thi", async () => {
    await expect(validateUpload(file("a.exe", "MZ..."))).rejects.toMatchObject({ status: 415 });
    await expect(validateUpload(file("a.html", "<html>"))).rejects.toMatchObject({ status: 415 });
  });
  it("từ chối tệp giả đuôi (nội dung không khớp)", async () => {
    await expect(validateUpload(file("fake.pdf", "<script>alert(1)</script>"))).rejects.toMatchObject({ status: 415 });
    await expect(validateUpload(file("fake.png", "not a png"))).rejects.toMatchObject({ status: 415 });
  });
  it("từ chối tệp rỗng và quá lớn", async () => {
    await expect(validateUpload(file("a.pdf", ""))).rejects.toMatchObject({ status: 400 });
    const big = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "big.pdf");
    await expect(validateUpload(big)).rejects.toMatchObject({ status: 413 });
  });
});

describe("RichText", () => {
  const html = (t: string) => renderToStaticMarkup(createElement(RichText, { text: t }));
  it("render markdown an toàn", () => {
    const out = html("**đậm** và *nghiêng*\n\n- một\n- hai");
    expect(out).toContain("<strong>đậm</strong>");
    expect(out).toContain("<em>nghiêng</em>");
    expect(out).toContain("<li>một</li>");
  });
  it("không sinh HTML từ nội dung nguy hiểm", () => {
    const out = html("<script>alert(1)</script> [x](javascript:alert(1)) [ok](https://a.com)");
    expect(out).not.toContain("<script>");
    expect(out).not.toMatch(/href="javascript:/);
    expect(out).toContain('href="https://a.com"');
    expect(out).toContain('rel="noopener noreferrer nofollow"');
  });
});
