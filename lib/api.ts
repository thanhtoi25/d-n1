import { NextRequest, NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import type { Role } from "@prisma/client";
import { currentUser, hasRole, type SessionUser } from "./auth";

export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}
export const notFound = (what = "Không tìm thấy dữ liệu.") => new HttpError(404, what);
export const badRequest = (msg: string, details?: unknown) => new HttpError(400, msg, details);

type Ctx<P> = { params: Promise<P> };
type Handler<P> = (req: NextRequest, ctx: { user: SessionUser; params: P }) => Promise<unknown>;

/**
 * Bọc route handler. `min` là vai trò tối thiểu; kiểm tra đặt ở server, không phụ thuộc UI.
 * Với phương thức ghi, yêu cầu cùng origin để chống CSRF (cookie SameSite=Lax là lớp bảo vệ thứ hai).
 */
export function route<P = Record<string, never>>(min: Role, handler: Handler<P>) {
  return async (req: NextRequest, ctx: Ctx<P>) => {
    try {
      if (!["GET", "HEAD"].includes(req.method)) {
        const origin = req.headers.get("origin");
        if (origin && origin !== req.nextUrl.origin) throw new HttpError(403, "Yêu cầu không hợp lệ.");
      }
      const user = await currentUser();
      if (!user) throw new HttpError(401, "Bạn cần đăng nhập.");
      if (!hasRole(user.role, min)) throw new HttpError(403, "Bạn không có quyền thực hiện thao tác này.");
      const result = await handler(req, { user, params: await ctx.params });
      return result instanceof Response ? result : NextResponse.json({ data: result });
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

export function toErrorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message, details: error.details }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ.", details: error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) },
      { status: 422 },
    );
  }
  const code = (error as { code?: string })?.code;
  if (code === "P2002") return NextResponse.json({ error: "Dữ liệu bị trùng với bản ghi đã có." }, { status: 409 });
  if (code === "P2025") return NextResponse.json({ error: "Không tìm thấy dữ liệu." }, { status: 404 });
  // Không ghi message/payload thô: lỗi từ CSDL hoặc dịch vụ ngoài có thể chứa
  // mật khẩu, token hay dữ liệu cá nhân. Chỉ giữ loại lỗi để phục vụ giám sát.
  const errorType = error instanceof Error ? error.name : typeof error;
  console.error("[api] lỗi không xác định", { type: errorType });
  return NextResponse.json({ error: "Đã có lỗi hệ thống. Vui lòng thử lại sau." }, { status: 500 });
}

export async function parseBody<T>(req: NextRequest, schema: ZodType<T>): Promise<T> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw badRequest("Nội dung yêu cầu không phải JSON hợp lệ.");
  }
  return schema.parse(json);
}

export const parseQuery = <T>(req: NextRequest, schema: ZodType<T>): T =>
  schema.parse(Object.fromEntries(req.nextUrl.searchParams));
