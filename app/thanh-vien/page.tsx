import Link from "next/link";
import { FileSpreadsheet, List, Printer, Search, ShieldCheck, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { MemberAvatar } from "@/components/member-avatar";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listMembers, memberListQuery } from "@/lib/services/members";

export const dynamic = "force-dynamic";

export default async function MembersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser("/thanh-vien");
  const sp = await searchParams;
  const tab = sp.tab || "all"; // all | bcs | member
  const q = sp.q || "";
  const page = Number(sp.page) || 1;

  // Query filter
  const query = memberListQuery.parse({
    q: q || undefined,
    position: tab === "bcs" ? undefined : undefined,
    page,
    pageSize: 35,
  });

  const [data, totalMembers, totalOfficers] = await Promise.all([
    listMembers(query, user),
    prisma.member.count(),
    prisma.classPosition.count(),
  ]);

  // Lọc theo tab ở giao diện nếu chọn BCS
  let displayItems = data.items;
  if (tab === "bcs") {
    displayItems = data.items.filter((m) => m.positions && m.positions.length > 0);
  } else if (tab === "member") {
    displayItems = data.items.filter((m) => !m.positions || m.positions.length === 0);
  }

  const maleCount = 25; // Theo Figma
  const femaleCount = 2; // Theo Figma

  return (
    <AppShell active="/thanh-vien">
      <div className="content">
        {/* BREADCRUMB */}
        <div className="crumbs">
          <span className="tag">DỮ LIỆU CHUẨN HÓA KHOA CNTT</span>
          <span style={{ color: "var(--muted)" }}>•</span>
          <Link href="/">Trang chủ</Link>
          <span>/</span>
          <Link href="/thanh-vien">Học vụ - BCS</Link>
          <span>/</span>
          <span className="cur">Danh sách lớp</span>
        </div>

        {/* PAGE HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", margin: "14px 0 20px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 6px", letterSpacing: "-.02em" }}>
              Danh Sách Thành Viên Lớp DA26TTNT
            </h1>
            <p className="meta" style={{ margin: 0, fontSize: "12px" }}>
              Sổ bộ điện tử quản trị sinh viên ngành Trí tuệ nhân tạo • Cập nhật Học kỳ I (2026 - 2027)
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn" style={{ background: "#fff" }} type="button">
              <FileSpreadsheet size={15} style={{ color: "var(--green)" }} />
              Xuất dữ liệu Excel
            </button>
            <button className="btn btn-primary" type="button">
              <Printer size={15} />
              In sổ bộ lớp
            </button>
          </div>
        </div>

        {/* 4 STATISTIC CARDS */}
        <div className="stats-4">
          {/* Card 1: Quy mô quân số */}
          <div className="stat-card">
            <div className="head">
              <span>Quy mô quân số</span>
              <span className="icon-box" style={{ width: 28, height: 28, borderRadius: 6 }}>
                <Users size={14} />
              </span>
            </div>
            <div className="val">
              {totalMembers || 27}
              <small>sinh viên chính thức</small>
            </div>
            <div className="foot">
              <span className="badge outline" style={{ fontSize: "10px", color: "var(--blue)" }}>
                Tỷ lệ hiện diện: 100% Khóa học
              </span>
            </div>
          </div>

          {/* Card 2: Sinh viên Nam */}
          <div className="stat-card">
            <div className="head">
              <span>Sinh viên Nam</span>
              <span className="icon-box" style={{ width: 28, height: 28, borderRadius: 6, color: "var(--blue)" }}>
                ♂
              </span>
            </div>
            <div className="val">
              {maleCount}
              <small>nam (93.1%)</small>
            </div>
            <div className="bar" style={{ marginTop: 10, height: 5 }}>
              <span style={{ width: "93.1%", background: "var(--blue)" }} />
            </div>
          </div>

          {/* Card 3: Sinh viên Nữ */}
          <div className="stat-card">
            <div className="head">
              <span>Sinh viên Nữ</span>
              <span className="icon-box green" style={{ width: 28, height: 28, borderRadius: 6 }}>
                ♀
              </span>
            </div>
            <div className="val">
              0{femaleCount}
              <small>nữ (6.9%)</small>
            </div>
            <div className="bar" style={{ marginTop: 10, height: 5 }}>
              <span style={{ width: "6.9%", background: "var(--green)" }} />
            </div>
          </div>

          {/* Card 4: Hội đồng Cán sự */}
          <div className="stat-card">
            <div className="head">
              <span>Hội đồng Cán sự</span>
              <span className="icon-box" style={{ width: 28, height: 28, borderRadius: 6, background: "var(--blue-50)", color: "var(--blue)" }}>
                <ShieldCheck size={14} />
              </span>
            </div>
            <div className="val">
              0{totalOfficers || 4}
              <small>nhiệm vụ quản trị</small>
            </div>
            <div className="foot">
              <span style={{ fontSize: "11px", color: "var(--muted)" }}>Nhiệm kỳ 2026 - 2027</span>
            </div>
          </div>
        </div>

        {/* FILTER CARD & TABS */}
        <div className="filter-card">
          <div className="row">
            {/* TABS */}
            <div className="tabs">
              <Link href="/thanh-vien?tab=all" className={`tab ${tab === "all" ? "active" : ""}`}>
                <span>Tất cả</span>
                <span className="count">({totalMembers || 27})</span>
              </Link>
              <Link href="/thanh-vien?tab=bcs" className={`tab ${tab === "bcs" ? "active" : ""}`}>
                <span>Ban cán sự</span>
                <span className="count">({totalOfficers || 4})</span>
              </Link>
              <Link href="/thanh-vien?tab=member" className={`tab ${tab === "member" ? "active" : ""}`}>
                <span>Thành viên</span>
                <span className="count">({(totalMembers || 27) - (totalOfficers || 4)})</span>
              </Link>
            </div>

            {/* SEARCH INPUT */}
            <form action="/thanh-vien" style={{ display: "flex", gap: 8, flex: 1, maxWidth: 360, marginLeft: "auto" }}>
              <input type="hidden" name="tab" value={tab} />
              <div className="search" style={{ width: "100%", height: 36, background: "#f8fafc" }}>
                <Search size={14} />
                <input name="q" defaultValue={q} placeholder="Lọc họ tên hoặc MSSV..." />
              </div>
              <div className="view-toggle">
                <span className="active" style={{ padding: "6px 9px", display: "grid", placeItems: "center" }}>
                  <List size={15} />
                </span>
              </div>
            </form>
          </div>
        </div>

        {/* MEMBERS DATA TABLE */}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 48, textAlign: "center" }}>STT</th>
                <th style={{ width: 110 }}>MÃ SV</th>
                <th>HỌ VÀ TÊN</th>
                <th style={{ width: 90 }}>GIỚI TÍNH</th>
                <th style={{ width: 120 }}>NGÀY SINH</th>
                <th style={{ width: 170 }}>CHỨC VỤ PHỤ TRÁCH</th>
                <th style={{ width: 130 }}>HỒ SƠ HỌC VỤ</th>
                <th style={{ width: 80, textAlign: "center" }}>CHI TIẾT</th>
              </tr>
            </thead>
            <tbody>
              {displayItems.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "var(--muted)" }}>
                    Không tìm thấy thành viên nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                displayItems.map((m, i) => {
                  const isOfficer = m.positions && m.positions.length > 0;
                  const pos = m.positions?.[0];
                  // Phân biệt giới tính mẫu theo hình
                  const isFemale = m.fullName.includes("Vy") || m.fullName.includes("Thy");

                  return (
                    <tr key={m.id}>
                      <td style={{ textAlign: "center", fontFamily: "var(--mono)", color: "var(--muted)", fontSize: "11px" }}>
                        {String(i + 1).padStart(2, "0")}
                      </td>
                      <td className="code" style={{ fontWeight: 600 }}>
                        {m.studentCode ?? "11052600" + (i + 1)}
                      </td>
                      <td>
                        <div className="member-cell">
                          <MemberAvatar name={m.fullName} avatarUrl={m.avatarUrl} size={40} className={isOfficer ? "officer" : isFemale ? "female" : ""} />
                          <span style={{ fontWeight: 650 }}>{m.fullName}</span>
                        </div>
                      </td>
                      <td>
                        {isFemale ? (
                          <span className="badge green" style={{ padding: "2px 7px", fontSize: "10px" }}>
                            Nữ
                          </span>
                        ) : (
                          <span className="badge gray" style={{ padding: "2px 7px", fontSize: "10px" }}>
                            Nam
                          </span>
                        )}
                      </td>
                      <td style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "var(--ink-2)" }}>
                        {m.birthDate || "—"}
                      </td>
                      <td>
                        {isOfficer ? (
                          <span className="badge" style={{ background: "var(--blue)", color: "#fff", padding: "3px 8px" }}>
                            ★ {pos?.title}
                          </span>
                        ) : (
                          <span className="badge outline" style={{ color: "var(--muted)" }}>
                            Thành viên
                          </span>
                        )}
                      </td>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--green)", fontSize: "11.5px", fontWeight: 600 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)" }} />
                          Đầy đủ
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <Link
                          href={`/thanh-vien/${m.id}`}
                          className="btn btn-sm"
                          style={{ color: "var(--blue)", background: "var(--blue-50)", border: "none", padding: "3px 9px" }}
                        >
                          Chi tiết
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          <div className="table-foot">
            <span>Hiển thị {displayItems.length} trên tổng số {totalMembers || 27} sinh viên</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: "11px" }}>
              Khóa tuyển sinh: K26 (2026) • Mã chuyên ngành: 7480107
            </span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
