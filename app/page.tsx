import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  GraduationCap,
  Mail,
  Megaphone,
  Pin,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { MemberAvatar } from "@/components/member-avatar";
import { currentUser } from "@/lib/auth";
import { homeData } from "@/lib/services/home";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await currentUser();
  const d = await homeData(user);

  const pinnedNotice = d.pinned[0];

  return (
    <AppShell active="/">
      <div className="content">
        {/* HERO BANNER SECTION */}
        <section className="home-top">
          <div className="hero">
            <div>
              <div className="eyebrow-pill">
                <CheckCircle size={13} />
                <span>Cổng thông tin nội bộ</span>
              </div>
              <h1>DA26TTNT — Không gian kết nối của lớp</h1>
              <p>
                Kênh thông tin chính thức, kết nối học tập, quản lý sinh hoạt và cập nhật thông báo kịp thời cho tập thể lớp
                DA26TTNT.
              </p>
              <div className="actions">
                <Link className="btn btn-primary" href="/thanh-vien">
                  <Users size={16} />
                  Xem thành viên
                </Link>
                <Link className="btn" href="/thong-bao" style={{ background: "#fff" }}>
                  <Megaphone size={16} />
                  Xem thông báo
                </Link>
              </div>
            </div>

            <div className="hero-photo">
              <Image
                src="/images/hero-class-v2.jpg"
                alt="Hình minh họa sinh viên ngành Trí tuệ Nhân tạo DA26TTNT"
                fill
                priority
                sizes="(max-width: 900px) 100vw, 480px"
              />
              <figcaption>
                <span>Ngành Trí tuệ Nhân tạo</span>
                <span>Khóa 2026</span>
              </figcaption>
            </div>
          </div>

          {/* 4 STAT CARDS */}
          <div className="stats stats-4">
            <div className="stat">
              <span className="stat-icon">
                <Users size={22} />
              </span>
              <div>
                <strong>{d.members ?? 27}</strong>
                <span className="label">Thành viên chính thức</span>
              </div>
            </div>

            <div className="stat">
              <span className="stat-icon green">
                <ShieldCheck size={22} />
              </span>
              <div>
                <strong>03</strong>
                <span className="label">Ban cán sự (1 Trưởng, 2 Phó)</span>
              </div>
            </div>

            <div className="stat">
              <span className="stat-icon violet">
                <GraduationCap size={22} />
              </span>
              <div>
                <strong>01</strong>
                <span className="label">{d.advisor?.fullName ?? "Thầy Võ Thành C (CVHT)"}</span>
              </div>
            </div>

            <div className="stat">
              <span className="stat-icon red">
                <Megaphone size={22} />
              </span>
              <div>
                <strong>{String(d.totalPublished || 4).padStart(2, "0")}</strong>
                <span className="label">Thông báo đang phát hành</span>
              </div>
            </div>
          </div>
        </section>

        {/* MAIN TWO-COLUMN LAYOUT */}
        <div className="grid-main" style={{ marginTop: 24 }}>
          {/* LEFT COLUMN: THÔNG BÁO QUAN TRỌNG & MỚI NHẤT & TIẾN ĐỘ */}
          <div className="stack" style={{ gap: 20 }}>
            {/* THÔNG BÁO QUAN TRỌNG */}
            <div>
              <div className="section-title" style={{ marginTop: 0 }}>
                <h2>
                  <Megaphone size={19} className="red" />
                  <span>Thông báo quan trọng</span>
                </h2>
                <span className="aside">CẬP NHẬT KỲ 1</span>
              </div>

              {pinnedNotice ? (
                <div className="feature">
                  <div className="top">
                    <div style={{ display: "flex", gap: 6 }}>
                      <span className="badge red">
                        <Pin size={11} /> Đã ghim
                      </span>
                      <span className="badge dark">! Quan trọng</span>
                    </div>
                    <span className="date">Đăng ngày {formatDate(pinnedNotice.publishedAt)}</span>
                  </div>

                  <h3>
                    <Link href={`/thong-bao/${pinnedNotice.id}`}>{pinnedNotice.title}</Link>
                  </h3>

                  {pinnedNotice.summary && <p>{pinnedNotice.summary}</p>}

                  <div className="bottom">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <UserCheck size={14} style={{ color: "var(--blue)" }} />
                      Người đăng: <b>Ban cán sự lớp</b>
                    </span>
                    <Link href={`/thong-bao/${pinnedNotice.id}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      Xem chi tiết học phần & nộp file <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="feature">
                  <div className="top">
                    <div style={{ display: "flex", gap: 6 }}>
                      <span className="badge red">
                        <Pin size={11} /> Đã ghim
                      </span>
                      <span className="badge dark">! Quan trọng</span>
                    </div>
                    <span className="date">Đăng ngày 11/09/2026</span>
                  </div>
                  <h3>Thông báo nộp bài tập lớn và ghi điểm quá trình học phần &quot;Nhập môn ngành Trí tuệ nhân tạo (220284) - 2 tín chỉ&quot;</h3>
                  <p>
                    Yêu cầu tất cả 27 sinh viên nộp báo cáo nhóm đợt 1 và link mã nguồn GitHub trước 23:59 ngày 25/09/2026. Bảng
                    điểm danh và điểm cộng quá trình sẽ được tổng hợp chính thức trên cổng để phản hồi trước khi gửi về Khoa.
                  </p>
                  <div className="bottom">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <UserCheck size={14} style={{ color: "var(--blue)" }} />
                      Người đăng: <b>Ban cán sự lớp</b>
                    </span>
                    <Link href="/thong-bao" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      Xem chi tiết học phần & nộp file <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* DANH SÁCH THÔNG BÁO MỚI NHẤT */}
            <div className="card" style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <strong style={{ fontSize: "13.5px" }}>Danh sách thông báo mới nhất</strong>
                <span className="meta">{d.latest.length || 3} bản ghi</span>
              </div>

              <div>
                {d.latest.length > 0 ? (
                  d.latest.map((a) => (
                    <Link key={a.id} href={`/thong-bao/${a.id}`} className="list-row">
                      <div className="icon-box" style={{ width: 36, height: 36 }}>
                        {a.category.toLowerCase().includes("lịch") ? (
                          <Calendar size={17} />
                        ) : a.category.toLowerCase().includes("hoạt") ? (
                          <Megaphone size={17} />
                        ) : (
                          <GraduationCap size={17} />
                        )}
                      </div>
                      <div className="main">
                        <h3>{a.title}</h3>
                        <small>
                          Đăng bởi: <b>Ban cán sự</b> · {formatDate(a.publishedAt)}
                        </small>
                      </div>
                      <span className="badge outline" style={{ fontSize: 10.5 }}>
                        {a.category}
                      </span>
                      <ChevronRight size={15} className="chev" />
                    </Link>
                  ))
                ) : (
                  <>
                    <Link href="/thong-bao" className="list-row">
                      <div className="icon-box">
                        <Calendar size={17} />
                      </div>
                      <div className="main">
                        <h3>Lịch sinh hoạt lớp định kỳ tháng 09/2026</h3>
                        <small>
                          Đăng bởi: <b>Thạch Ngọc Tiến</b> (Lớp trưởng)
                        </small>
                      </div>
                      <span className="badge outline">Lịch sinh hoạt</span>
                      <ChevronRight size={15} className="chev" />
                    </Link>
                    <Link href="/thong-bao" className="list-row">
                      <div className="icon-box green">
                        <GraduationCap size={17} />
                      </div>
                      <div className="main">
                        <h3>Đăng ký tham gia nhóm đề tài học thuật AI Hackathon 2026</h3>
                        <small>
                          Đăng bởi: <b>Lâm Tuấn Kiệt</b> (Lớp phó học tập)
                        </small>
                      </div>
                      <span className="badge outline">Học tập</span>
                      <ChevronRight size={15} className="chev" />
                    </Link>
                    <Link href="/thong-bao" className="list-row">
                      <div className="icon-box violet">
                        <Megaphone size={17} />
                      </div>
                      <div className="main">
                        <h3>Kế hoạch phong trào văn thể mỹ chào tân sinh viên DA26TTNT</h3>
                        <small>
                          Đăng bởi: <b>Trần Thị Tường Vy</b> (Lớp phó phong trào)
                        </small>
                      </div>
                      <span className="badge outline">Hoạt động lớp</span>
                      <ChevronRight size={15} className="chev" />
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* TIẾN ĐỘ & THỐNG KÊ HỌC VỤ LỚP */}
            <div>
              <div className="section-title">
                <h2>
                  <Calendar size={19} />
                  <span>Tiến độ & Thống kê học vụ lớp</span>
                </h2>
              </div>

              <div className="grid-2">
                {/* TỶ LỆ HOÀN THÀNH HỒ SƠ */}
                <div className="card" style={{ padding: "18px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <strong style={{ fontSize: "13px" }}>Tỷ lệ hoàn thành hồ sơ sinh viên</strong>
                    <span style={{ fontSize: "12px", fontWeight: 750, color: "var(--green)" }}>100%</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div className="progress-ring" style={{ "--p": 100 } as React.CSSProperties} />
                    <div>
                      <strong style={{ fontSize: "20px" }}>27 / 27</strong>
                      <span className="meta" style={{ display: "block" }}>
                        Đã xác nhận lý lịch
                      </span>
                    </div>
                  </div>

                  <div className="kv-foot">
                    <span>Trạng thái: Hoàn tất</span>
                    <b>Hợp lệ</b>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT ASIDE COLUMN: CỐ VẤN HỌC TẬP & BAN CÁN SỰ LỚP */}
          <aside className="stack" style={{ gap: 20 }}>
            {/* CỐ VẤN HỌC TẬP */}
            <div className="card" style={{ padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h2 style={{ fontSize: "14.5px", fontWeight: 750, display: "flex", alignItems: "center", gap: 7, margin: 0 }}>
                  <GraduationCap size={18} style={{ color: "var(--blue)" }} />
                  <span>Cố vấn học tập</span>
                </h2>
              </div>

              <div className="advisor-mini">
                <div className="photo">
                  <Image
                    src={d.advisor?.avatarUrl || "/images/advisor-default.jpg"}
                    alt={d.advisor?.fullName ?? "Cố vấn học tập"}
                    width={54}
                    height={54}
                    unoptimized={Boolean(d.advisor?.avatarUrl)}
                    style={{ borderRadius: "50%", objectFit: "cover" }}
                  />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <strong>{d.advisor?.fullName ?? "Thầy Võ Thành C..."}</strong>
                  <small>Giảng viên Cố vấn học tập</small>
                  <small className="dep">Khoa Công nghệ Thông tin</small>
                </div>
              </div>

              <div className="contact-lines">
                <div>
                  <Mail size={14} />
                  <span>{d.advisor?.publicEmail ?? "vothanhc@da26ttnt.edu.vn"}</span>
                </div>
                <div>
                  <Clock size={14} />
                  <span>Tiếp sinh viên: {d.advisor?.officeHours ?? "Chiều Thứ 3 & Thứ 5"}</span>
                </div>
              </div>

              <Link
                href="/co-van"
                className="btn btn-soft"
                style={{ width: "100%", justifyContent: "center", display: "flex", textAlign: "center" }}
              >
                Đặt lịch trao đổi với CVHT
              </Link>
            </div>

            {/* BAN CÁN SỰ LỚP */}
            <div className="card" style={{ padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h2 style={{ fontSize: "14.5px", fontWeight: 750, display: "flex", alignItems: "center", gap: 7, margin: 0 }}>
                  <ShieldCheck size={18} style={{ color: "var(--blue)" }} />
                  <span>Ban cán sự lớp</span>
                </h2>
                <span className="badge outline" style={{ fontSize: "10px" }}>
                  Nhiệm kỳ I
                </span>
              </div>

              <div>
                {d.officers && d.officers.length > 0 ? (
                  d.officers.map((pos) => (
                    <div key={pos.id} className="person-row">
                      <MemberAvatar name={pos.member.fullName} avatarUrl={pos.member.avatarUrl} size={32} />
                      <div>
                        <strong>{pos.member.fullName}</strong>
                        <small>
                          {pos.title}
                          {pos.duties ? ` • ${pos.duties}` : ""}
                        </small>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="person-row">
                      <span className="avatar">TT</span>
                      <div>
                        <strong>Thạch Ngọc Tiến</strong>
                        <small>Lớp trưởng • Điều hành chung</small>
                      </div>
                    </div>
                    <div className="person-row">
                      <span className="avatar" style={{ background: "var(--green-50)", color: "var(--green)" }}>
                        LK
                      </span>
                      <div>
                        <strong>Lâm Tuấn Kiệt</strong>
                        <small>Lớp phó học tập • Quản lý học vụ</small>
                      </div>
                    </div>
                    <div className="person-row">
                      <span className="avatar" style={{ background: "var(--violet-50)", color: "#4b3fb8" }}>
                        TV
                      </span>
                      <div>
                        <strong>Trần Thị Tường Vy</strong>
                        <small>Lớp phó phong trào • Văn thể mỹ</small>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
