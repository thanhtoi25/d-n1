import { NextRequest, NextResponse } from "next/server";

const protectedPrefixes = ["/thanh-vien", "/thong-bao", "/co-van", "/ban-can-su", "/lich", "/tai-lieu", "/quan-tri"];

export function middleware(request: NextRequest) {
  const needsAuth = protectedPrefixes.some((path) => request.nextUrl.pathname.startsWith(path));
  if (needsAuth && !request.cookies.has("da26ttnt_session")) {
    const login = new URL("/dang-nhap", request.url);
    login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
