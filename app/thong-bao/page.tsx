import Link from "next/link";
import {
  Bell,
  BookOpen,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Megaphone,
  Pin,
  Search,
  Share2,
  SlidersHorizontal,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { announcementListQuery, listAnnouncements } from "@/lib/services/announcements";
import { formatDate, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser("/thong-bao");
  const sp = await searchParams;
  const q = sp.q || "";
  const cat = sp.cat || "all"; // all | study | schedule | activity | other
  const selectedId = sp.id;

  const query = announcementListQuery.parse({
    q: q || undefined,
    category: undefined,
    page: 1,
    pageSize: 30,
  });

  const [data, pinnedCount] = await Promise.all([
    listAnnouncements(query, user),
    prisma.announcement.count({ where: { status: "PUBLISHED", pinned: true } }),
  ]);

  // Selected announcement for the right detail panel
  const selectedNotice =
    (selectedId ? data.items.find((a) => a.id === selectedId) : null) || data.items[0] || null;

  return (
    <AppShell active="/thong-bao">
      <div className="content">
        {/* BANNER HEADER CARD */}
        <div className="notice-head">
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <span className="badge" style={{ background: "var(--blue-50)", color: "var(--blue)", fontWeight: 750 }}>
                BẢNG TIN CHÍNH THỨC
              </span>
              <span className="meta" style={{ fontFamily: "var(--mono)", fontSize: "11px" }}>
                KHOA CÔNG NGHỆ THÔNG TIN • HỌC KỲ I (2026 - 2027)
              </span>
            </div>
            <h1>Trung tâm Thông báo Học vụ & Hoạt động Lớp</h1>
            <p>Kênh điều hành, cập nhật biểu mẫu đồ án, lịch học bù và thông báo quan trọng từ Ban Cán sự DA26TTNT.</p>
          </div>

          <div className="kpis">
            <div className="kpi">
              <Pin size={18} />
              <div>
                <small>ĐANG GHIM</small>
                <strong>{String(pinnedCount || 1).padStart(2, "0")} Thông báo</strong>
              </div>
            </div>

            <div className="kpi" style={{ background: "var(--green-50)" }}>
              <CheckCircle size={18} style={{ color: "var(--green)" }} />
              <div>
                <small style={{ color: "var(--green)" }}>ĐÃ XÁC NHẬN</small>
                <strong style={{ color: "var(--green)" }}>28/29 SV</strong>
              </div>
            </div>
          </div>
        </div>

        {/* TABS & CATEGORIES BAR */}
        <div className="filter-card" style={{ marginBottom: 16 }}>
          <div className="row">
            <div className="tabs">
              <Link href="/thong-bao?cat=all" className={`tab ${cat === "all" ? "active" : ""}`}>
                <Megaphone size={14} />
                <span>Tất cả thông báo</span>
              </Link>
              <Link href="/thong-bao?cat=study" className={`tab ${cat === "study" ? "active" : ""}`}>
                <BookOpen size={14} />
                <span>Học tập</span>
              </Link>
              <Link href="/thong-bao?cat=schedule" className={`tab ${cat === "schedule" ? "active" : ""}`}>
                <Calendar size={14} />
                <span>Lịch sinh hoạt</span>
              </Link>
              <Link href="/thong-bao?cat=activity" className={`tab ${cat === "activity" ? "active" : ""}`}>
                <SlidersHorizontal size={14} />
                <span>Hoạt động lớp</span>
              </Link>
              <Link href="/thong-bao?cat=other" className={`tab ${cat === "other" ? "active" : ""}`}>
                <span>... Khác</span>
              </Link>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: "auto" }}>
              <span className="meta" style={{ fontSize: "11px", fontWeight: 700 }}>
                Nhãn lọc:
              </span>
              <span className="chip">
                <Pin size={12} /> Đã ghim
              </span>
              <span className="chip" style={{ color: "var(--red)" }}>
                ! Quan trọng
              </span>
              <span className="chip" style={{ color: "var(--blue)" }}>
                ● Mới
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <form action="/thong-bao" style={{ flex: 1 }}>
              <input type="hidden" name="cat" value={cat} />
              <div className="search" style={{ width: "100%", background: "#f8fafc" }}>
                <Search size={14} />
                <input name="q" defaultValue={q} placeholder="Tìm theo tiêu đề, người đăng, mã học phần, nội dung văn bản..." />
              </div>
            </form>
            <div className="term-chip" style={{ height: 38, cursor: "pointer" }}>
              <span>Thời gian: Mới nhất</span>
            </div>
          </div>
        </div>

        {/* MASTER-DETAIL SPLIT GRID */}
        <div className="notice-layout">
          {/* LEFT LIST */}
          <div className="stack" style={{ gap: 12 }}>
            {data.items.length === 0 ? (
              <div className="card card-body" style={{ textAlign: "center", padding: "40px" }}>
                Không có thông báo nào phù hợp.
              </div>
            ) : (
              data.items.map((item, idx) => {
                const isSelected = selectedNotice?.id === item.id;
                const isUrgent = item.importance === "URGENT";

                return (
                  <Link
                    key={item.id}
                    href={`/thong-bao?id=${item.id}${cat !== "all" ? `&cat=${cat}` : ""}${q ? `&q=${q}` : ""}`}
                    className={`notice-card c-${idx % 4} ${isUrgent ? "urgent" : ""} ${isSelected ? "selected" : ""}`}
                  >
                    <div className="top">
                      <div className="badges">
                        {item.pinned && (
                          <span className="badge red" style={{ padding: "2px 7px" }}>
                            <Pin size={10} /> ĐÃ GHIM
                          </span>
                        )}
                        {item.importance !== "NORMAL" && (
                          <span className="badge dark" style={{ padding: "2px 7px" }}>
                            ! QUAN TRỌNG
                          </span>
                        )}
                        <span className="badge outline" style={{ padding: "2px 7px" }}>
                          {item.category}
                        </span>
                      </div>
                      <span className="date">
                        <Clock size={12} /> {formatDate(item.publishedAt)}
                      </span>
                    </div>

                    <h3>{item.title}</h3>
                    {item.summary && <p>{item.summary}</p>}

                    <div className="bottom">
                      <div className="who">
                        <span className="avatar">{initials(item.author)}</span>
                        <span>
                          <b>{item.author}</b> • Tổng hợp học vụ
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <span className="files">
                          <FileText size={13} /> 2 tệp (.xlsx, .pdf)
                        </span>
                        {item.deadline && (
                          <span className="deadline">
                            <Clock size={13} /> Hạn chót: {formatDate(item.deadline)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {/* RIGHT PREVIEW / DETAIL VIEW */}
          {selectedNotice && (
            <div className="preview">
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                {selectedNotice.pinned && <span className="badge red">ĐÃ GHIM</span>}
                <span className="badge dark">QUAN TRỌNG</span>
                <span className="meta" style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: "11px" }}>
                  {formatDate(selectedNotice.publishedAt)}
                </span>
              </div>

              <h2>{selectedNotice.title}</h2>

              <div className="author-box">
                <div className="who">
                  <span className="avatar">{initials(selectedNotice.author)}</span>
                  <div>
                    <strong>{selectedNotice.author}</strong>
                    <small>Phụ trách Giáo vụ DA26TTNT</small>
                  </div>
                </div>
                <span className="badge green" style={{ display: "inline-flex", gap: 4 }}>
                  <CheckCircle size={12} /> Đã xác thực
                </span>
              </div>

              <div className="summary-box">
                <b>Kính gửi:</b> Toàn thể sinh viên khóa 2026 chuyên ngành Trí tuệ nhân tạo, lớp DA26TTNT.
              </div>

              <div className="prose">
                {selectedNotice.summary && <p>{selectedNotice.summary}</p>}
                <p>
                  Căn cứ theo đề cương chi tiết học phần <b>Nhập môn ngành Trí tuệ nhân tạo (Mã HP: 220284)</b> do Khoa phê
                  duyệt, Ban Cán sự xin thông báo tiến độ và quy cách thu nhận sản phẩm cuối kỳ như sau:
                </p>
                <ul>
                  <li>
                    <b>Hình thức thực hiện:</b> Mỗi nhóm từ 3 đến 5 thành viên (đã chốt danh sách tại Sheet 1 kèm theo).
                  </li>
                  <li>
                    <b>Yêu cầu hồ sơ nộp:</b> 01 file Báo cáo thuyết minh (.PDF), 01 Source code dự án hoàn chỉnh và video demo
                    sản phẩm tối đa 5 phút.
                  </li>
                  <li>
                    <b>Quy cách đặt tên file:</b> <br />
                    <code style={{ background: "#eef4ff", color: "var(--blue)", padding: "2px 6px", borderRadius: 4 }}>
                      [DA26TTNT]_[NhomXX]_[TenDeTai].zip
                    </code>
                  </li>
                </ul>
              </div>

              {/* TÀI LIỆU ĐÍNH KÈM */}
              <div style={{ marginTop: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <strong style={{ fontSize: "12.5px" }}>Tài liệu đính kèm (2)</strong>
                  <button type="button" className="btn btn-sm" style={{ border: "none", color: "var(--blue)" }}>
                    <Download size={13} /> Tải tất cả
                  </button>
                </div>

                <div className="file-list">
                  <div className="file-item">
                    <span className="icon-box green" style={{ width: 32, height: 32, borderRadius: 6 }}>
                      <FileSpreadsheet size={16} />
                    </span>
                    <div className="main">
                      <strong style={{ fontSize: "12px", display: "block" }}>Danh_sach_nhom_va_de_tai_220284.xlsx</strong>
                      <span className="meta">Microsoft Excel • 245 KB</span>
                    </div>
                    <Download size={15} style={{ color: "var(--muted)", cursor: "pointer" }} />
                  </div>

                  <div className="file-item">
                    <span className="icon-box red" style={{ width: 32, height: 32, borderRadius: 6 }}>
                      <FileText size={16} />
                    </span>
                    <div className="main">
                      <strong style={{ fontSize: "12px", display: "block" }}>De_cuong_chi_tiet_Do_An_AI_K26.pdf</strong>
                      <span className="meta">Tài liệu PDF • 1.8 MB</span>
                    </div>
                    <Download size={15} style={{ color: "var(--muted)", cursor: "pointer" }} />
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, marginTop: 18 }}>
                <button className="btn btn-primary" type="button" style={{ justifyContent: "center" }}>
                  <Check size={15} />
                  Xác nhận đã đọc thông báo
                </button>
                <button className="btn" type="button" style={{ background: "#fff" }}>
                  <Share2 size={15} /> Chia sẻ
                </button>
              </div>

              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid var(--line)",
                  borderRadius: 10,
                  padding: "12px",
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  marginTop: 16,
                }}
              >
                <div className="icon-box" style={{ width: 34, height: 34, borderRadius: 8 }}>
                  <Bell size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ fontSize: "12px", display: "block" }}>Cần hỗ trợ học vụ gấp?</strong>
                  <span className="meta" style={{ fontSize: "10.5px" }}>
                    Liên hệ Văn phòng Khoa hoặc BCS lớp
                  </span>
                </div>
                <Link href="/co-van" className="btn btn-sm btn-soft">
                  Gửi yêu cầu →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
