import Link from "next/link";
import Image from "next/image";
import {
  AlertCircle,
  Building,
  Calendar,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Megaphone,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { getAdvisor } from "@/lib/services/advisor";

export const dynamic = "force-dynamic";

export default async function AdvisorPage() {
  await requireUser("/co-van");
  const a = await getAdvisor();

  return (
    <AppShell active="/co-van">
      <div className="content">
        {/* BREADCRUMB */}
        <div className="crumbs">
          <Link href="/">Cổng thông tin lớp</Link>
          <span>›</span>
          <span className="cur">Cố vấn học tập</span>
        </div>

        {/* TITLE AND CTA */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", margin: "8px 0 24px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 6px", letterSpacing: "-.02em" }}>
              Hồ Sơ Cố Vấn Học Tập – Lớp DA26TTNT
            </h1>
            <p className="meta" style={{ margin: 0, fontSize: "12.5px" }}>
              Đồng hành, định hướng học thuật và hỗ trợ rèn luyện cho tập thể sinh viên K26 ngành Trí tuệ nhân tạo.
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span
              style={{
                fontFamily: "var(--mono)",
                fontSize: "11px",
                background: "var(--blue-50)",
                color: "var(--blue)",
                padding: "8px 12px",
                borderRadius: 8,
                fontWeight: 600,
              }}
            >
              CVHT-DA26-AI
            </span>
            <button className="btn btn-primary" type="button">
              <Calendar size={14} />
              Đặt lịch tư vấn
            </button>
          </div>
        </div>

        {/* TOP PROFILE HERO AND OFFICE LOCATION */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 18, marginBottom: 24 }}>
          {/* ADVISOR MAIN CARD */}
          <div
            className="card"
            style={{
              padding: "24px",
              display: "grid",
              gridTemplateColumns: "140px 1fr",
              gap: 24,
              borderTop: "3px solid var(--green)",
            }}
          >
            {/* AVATAR/PHOTO */}
            <div style={{ position: "relative", width: 140, height: 165, borderRadius: 12, overflow: "hidden" }}>
              <Image
                src="/images/advisor-default.jpg"
                alt="Thầy Cố vấn học tập"
                fill
                unoptimized
                style={{ objectFit: "cover" }}
              />
              <span
                style={{
                  position: "absolute",
                  bottom: 0,
                  insetInline: 0,
                  background: "rgba(10, 20, 40, .85)",
                  color: "#fff",
                  fontSize: "10px",
                  fontWeight: 700,
                  textAlign: "center",
                  padding: "4px 0",
                  letterSpacing: ".05em",
                }}
              >
                CỐ VẤN HỌC TẬP
              </span>
            </div>

            {/* DETAILS */}
            <div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <span className="badge green" style={{ fontSize: "10px", padding: "2px 8px" }}>
                  ● Đang tiếp nhận lịch tư vấn học kỳ 1 (2026 - 2027)
                </span>
              </div>
              <span className="meta" style={{ fontSize: "11px", fontFamily: "var(--mono)" }}>
                Niên khóa 2026 - 2030
              </span>

              <h2 style={{ fontSize: "22px", fontWeight: 800, margin: "6px 0 4px" }}>
                {a?.fullName || "Thầy Võ Thành C"}
              </h2>
              <div style={{ color: "var(--blue)", fontWeight: 700, fontSize: "13px", marginBottom: 10 }}>
                {a?.title || "Giảng viên - Cố vấn học tập"}, {a?.department || "Trường Kỹ thuật & Công nghệ"}
              </div>

              <p style={{ fontSize: "12px", color: "var(--ink-2)", lineHeight: 1.6, margin: "0 0 16px" }}>
                {a?.introduction ||
                  "Trực tiếp giám sát quy chế học vụ, định hướng nghiên cứu thuật toán Deep Learning, Data Science và đại diện ký xác nhận hồ sơ học tập cho sinh viên lớp DA26TTNT."}
              </p>

              {/* CONTACT MATRIX */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  background: "#f8fafc",
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: "1px solid var(--line)",
                }}
              >
                <div>
                  <div className="meta" style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}>
                    HÒM THƯ CÔNG VỤ
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
                    <span style={{ fontSize: "12px", fontWeight: 600 }}>{a?.publicEmail || "vothanhc@da26ttnt.edu.vn"}</span>
                    <Copy size={13} style={{ color: "var(--muted)", cursor: "pointer" }} />
                  </div>
                </div>

                <div>
                  <div className="meta" style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}>
                    VĂN PHÒNG LÀM VIỆC
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: 600, marginTop: 4 }}>
                    Phòng C71.102 (Tòa C7 - Khoa Công nghệ thông tin)
                  </div>
                </div>

                <div style={{ gridColumn: "span 2", borderTop: "1px solid #edf1f6", paddingTop: 8 }}>
                  <div className="meta" style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}>
                    GIỜ TIẾP SINH VIÊN CỐ ĐỊNH
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                    <strong style={{ fontSize: "12px" }}>{a?.officeHours || "Chiều Thứ 3 & Thứ 5 (14:00 - 16:30)"}</strong>
                    <span className="meta" style={{ fontSize: "11px" }}>
                      • Ưu tiên sinh viên đã đăng ký trước trên cổng
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT OFFICE INFO */}
          <div className="card" style={{ padding: "18px" }}>
            <h3 style={{ fontSize: "13.5px", fontWeight: 750, display: "flex", alignItems: "center", gap: 7, margin: "0 0 12px" }}>
              <Building size={16} style={{ color: "var(--blue)" }} />
              Địa điểm làm việc
            </h3>
            <p style={{ fontSize: "12px", color: "var(--ink-2)", lineHeight: 1.6, margin: "0 0 14px" }}>
              Tầng 2, Tòa B - Phòng B204 (Phòng nghiên cứu & điều phối môn học Trí tuệ Nhân tạo), Trường Đại học Công nghệ.
            </p>
            <div
              style={{
                background: "var(--blue-50)",
                border: "1px solid var(--blue-100)",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: "11px",
                color: "var(--ink-2)",
                lineHeight: 1.5,
                display: "flex",
                gap: 8,
              }}
            >
              <AlertCircle size={15} style={{ color: "var(--blue)", flex: "none" }} />
              <span>Vui lòng đeo thẻ sinh viên khi đến phòng làm việc.</span>
            </div>
          </div>
        </div>

        {/* THÔNG BÁO & CHỈ ĐẠO TỪ THẦY CỐ VẤN */}
        <div style={{ marginBottom: 28 }}>
          <div className="section-title">
            <h2>
              <Megaphone size={18} />
              <span>Thông báo & Chỉ đạo từ Thầy Cố vấn</span>
            </h2>
            <span className="aside">LỚP DA26TTNT</span>
          </div>

          <div className="stack" style={{ gap: 14 }}>
            {/* NOTICE CARD 1 */}
            <div className="card" style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className="badge red" style={{ fontSize: "10.5px" }}>
                    ● Gấp • Deadline
                  </span>
                  <span className="meta" style={{ fontFamily: "var(--mono)", fontSize: "11px" }}>
                    MÃ HP: 220284 • Đăng ngày 28/10/2026
                  </span>
                </div>
                <Link href="/thong-bao" className="btn btn-sm btn-soft">
                  Chi tiết <ExternalLink size={12} />
                </Link>
              </div>

              <h3 style={{ fontSize: "15px", fontWeight: 750, margin: "0 0 6px" }}>
                Nhắc nhở nộp bài tập lớn học phần Nhập môn Trí tuệ Nhân tạo (220284)
              </h3>
              <p style={{ fontSize: "12.5px", color: "var(--ink-2)", lineHeight: 1.6, margin: 0 }}>
                Tất cả 6 nhóm trưởng lớp DA26TTNT kiểm tra lại định dạng source code Github Repo và file báo cáo PDF theo đúng cấu
                trúc mẫu đã ban hành. Hạn chót đóng hệ thống nộp là 23:59 ngày Chủ nhật. Sinh viên gặp sự cố kỹ thuật cần liên hệ
                BCS để tổng hợp ngay.
              </p>
            </div>

            {/* NOTICE CARD 2 */}
            <div className="card" style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className="badge green" style={{ fontSize: "10.5px" }}>
                    ● Nghiên cứu khoa học
                  </span>
                  <span className="meta" style={{ fontFamily: "var(--mono)", fontSize: "11px" }}>
                    AI Lab K26 • Đăng ngày 22/10/2026
                  </span>
                </div>
                <button type="button" className="btn btn-sm btn-soft">
                  <Download size={12} /> Đề tài mẫu
                </button>
              </div>

              <h3 style={{ fontSize: "15px", fontWeight: 750, margin: "0 0 6px" }}>
                Định hướng đăng ký đề tài Nghiên cứu Khoa học Sinh viên cấp Khoa đợt 1
              </h3>
              <p style={{ fontSize: "12.5px", color: "var(--ink-2)", lineHeight: 1.6, margin: 0 }}>
                Thầy khuyến khích các bạn sinh viên có nguyện vọng tham gia lab chuyên sâu gửi tóm tắt đề tài (Abstract) tập trung
                vào Edge AI, Reinforcement Learning hoặc LLMs ứng dụng cho y tế. Nhóm từ 2-4 thành viên gửi bản thảo qua form đặt
                lịch để Thầy góp ý trước khi nộp Khoa.
              </p>
            </div>
          </div>
        </div>

        {/* TÀI LIỆU & BIỂU MẪU HỌC VỤ DO THẦY CHIA SẺ */}
        <div>
          <div className="section-title">
            <h2>
              <FileText size={18} />
              <span>Tài liệu & Biểu mẫu học vụ do Thầy chia sẻ</span>
            </h2>
            <span className="aside">4 TỆP TIN CHÍNH QUY</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
              <span className="icon-box red" style={{ width: 36, height: 36, borderRadius: 8, fontWeight: 700, fontSize: "11px" }}>
                PDF
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ fontSize: "12.5px", display: "block" }}>Mẫu đơn xin hoãn thi</strong>
                <span className="meta" style={{ fontSize: "10.5px" }}>
                  BM-DA26-HT01 • 142 KB
                </span>
              </div>
              {/* <a
                href="/path-to-your-file.pdf"
                download="Ten_File_Sau_Khi_Tai.pdf"
                style={{ display: "inline-flex", textDecoration: "none" }}>*/}
              <Download size={16} style={{ color: "var(--blue)", cursor: "pointer" }} />
              {/*</a>*/}
            </div>
            <div className="card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
              <span className="icon-box" style={{ width: 36, height: 36, borderRadius: 8, fontWeight: 700, fontSize: "11px" }}>
                DOC
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ fontSize: "12.5px", display: "block" }}>Mẫu đề cương nghiên</strong>
                <span className="meta" style={{ fontSize: "10.5px" }}>
                  AI-RESEARCH-PROPOSAL • 380 KB
                </span>
              </div>
              <Download size={16} style={{ color: "var(--blue)", cursor: "pointer" }} />
            </div>

            <div className="card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
              <span className="icon-box red" style={{ width: 36, height: 36, borderRadius: 8, fontWeight: 700, fontSize: "11px" }}>
                PDF
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ fontSize: "12.5px", display: "block" }}>Sổ tay quy chế đào tạo</strong>
                <span className="meta" style={{ fontSize: "10.5px" }}>
                  QC-KHOA-TTNT-2026 • 2.1 MB
                </span>
              </div>
              <Download size={16} style={{ color: "var(--blue)", cursor: "pointer" }} />
            </div>

            <div className="card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
              <span className="icon-box" style={{ width: 36, height: 36, borderRadius: 8, fontWeight: 700, fontSize: "11px" }}>
                DOC
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ fontSize: "12.5px", display: "block" }}>Mẫu đơn xin cấp bảng điểm</strong>
                <span className="meta" style={{ fontSize: "10.5px" }}>
                  DRL-DA26-XN04 • 95 KB
                </span>
              </div>
              <Download size={16} style={{ color: "var(--blue)", cursor: "pointer" }} />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
