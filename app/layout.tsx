import type { Metadata } from "next";
import "./globals.css";
import "./design.css";

export const metadata: Metadata = { title: "DA26TTNT — Cổng thông tin lớp", description: "Không gian kết nối của lớp DA26TTNT: thông báo, thành viên, cố vấn học tập và ban cán sự." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="vi"><body>{children}</body></html>; }
