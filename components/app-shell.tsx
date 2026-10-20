import Link from "next/link";
import Image from "next/image";
import { BrandLogo } from "@/components/brand-logo";
import { Bell, Calendar, ChevronDown, GraduationCap, Home, LogOut, Search, ShieldCheck, SlidersHorizontal, Users, CheckCircle } from "lucide-react";
import { currentUser, hasRole } from "@/lib/auth";
import { logout } from "@/app/dang-nhap/actions";
import { initials } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

const roleLabel = { MEMBER: "Thành viên", CLASS_OFFICER: "Ban Cán Sự Lớp", ADMIN: "Quản trị viên" } as const;

export async function AppShell({ children, active = "/" }: { children: React.ReactNode; active?: string }) {
  const user = await currentUser();
  const [memberCount, unreadCount] = await Promise.all([
    prisma.member.count(),
    user ? prisma.announcement.count({ where: { status: "PUBLISHED", reads: { none: { userId: user.id } } } }) : 0,
  ]);

  const navItems = [
    { href: "/", label: "Trang chủ", icon: Home },
    { href: "/thanh-vien", label: "Thành viên", icon: Users, badge: `${memberCount || 29} SV` },
    { href: "/co-van", label: "Cố vấn học tập", icon: GraduationCap },
    { href: "/ban-can-su", label: "Ban cán sự", icon: ShieldCheck },
    { href: "/thong-bao", label: "Thông báo", icon: Bell, dot: unreadCount > 0 },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/">
          <BrandLogo />
          <div>
            <strong>DA26TTNT</strong>
            <small>KHOA CÔNG NGHỆ THÔNG TIN</small>
          </div>
        </Link>
        <div className="nav-label">CỔNG THÔNG TIN LỚP</div>
        <nav className="nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.href;
            return (
              <Link key={item.href} href={item.href} className={isActive ? "active" : ""}>
                <Icon size={16} />
                <span>{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
                {item.dot && <span className="nav-dot" />}
              </Link>
            );
          })}
          {user && hasRole(user.role, "CLASS_OFFICER") && (
            <>
              <div className="nav-sep" />
              <Link href="/quan-tri" className={active.startsWith("/quan-tri") ? "active" : ""}>
                <SlidersHorizontal size={16} />
                <span>Quản trị & Nhập liệu BCS</span>
              </Link>
            </>
          )}
        </nav>

        <div className="side-card">
          <strong>
            <CheckCircle size={15} /> Dữ liệu chuẩn hóa
          </strong>
          <p style={{ margin: "4px 0 0" }}>Hệ cơ sở dữ liệu đã xác thực học kỳ I (2026 - 2027).</p>
          <div className="foot">
            <span>Hệ thống v1.0</span>
            <b>DA26TTNT</b>
          </div>
        </div>
      </aside>

      <main className="page">
        <header className="topbar">
          <form action="/thanh-vien" className="search">
            <Search size={15} />
            <input name="q" aria-label="Tìm kiếm" placeholder="Tìm kiếm sinh viên theo họ tên, MSSV, tổ chức..." />
          </form>

          <div className="top-actions">
            <div className="term-chip">
              <Calendar size={14} />
              <span>Học kỳ 1 • 2026 - 2027</span>
              <ChevronDown size={13} style={{ color: "var(--muted)" }} />
            </div>

            <Link href="/thong-bao" className="bell" aria-label="Thông báo">
              <Bell size={17} />
              {unreadCount > 0 && <span className="dot" />}
            </Link>

            {user ? (
              <details className="user-menu" style={{ position: "relative" }}>
                <summary>
                  <div className="user-chip">
                    <span className="avatar">{user.member?.avatarUrl ? <Image unoptimized src={user.member.avatarUrl} alt={`Ảnh ${user.displayName}`} width={32} height={32}/> : initials(user.displayName)}</span>
                    <div>
                      <strong>{user.displayName}</strong>
                      <small>{user.email}</small>
                    </div>
                  </div>
                </summary>
                <div className="menu">
                  <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", fontSize: "11px", color: "var(--muted)" }}>
                    Vai trò: <b>{roleLabel[user.role]}</b>
                  </div>
                  <form action={logout}>
                    <button type="submit">
                      <LogOut size={14} />
                      Đăng xuất
                    </button>
                  </form>
                </div>
              </details>
            ) : (
              <Link className="btn btn-primary" href="/dang-nhap">
                Đăng nhập
              </Link>
            )}
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
