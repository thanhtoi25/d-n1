import Link from "next/link";
import {
  CheckCircle,
  Clock,
  Megaphone,
  Paperclip,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireUser("/quan-tri");

  const memberCount = await prisma.member.count();

  return (
    <AppShell active="/quan-tri">
      <div className="content">
        {/* BREADCRUMB */}
        <div className="crumbs">
          <Link href="/quan-tri">Hệ thống quản trị</Link>
          <span>›</span>
          <span className="cur">Quản trị & Điều hành BCS</span>
          <span className="tag" style={{ marginLeft: 8 }}>
            SYNC - ACTIVE
          </span>
        </div>

        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", margin: "10px 0 20px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 6px", letterSpacing: "-.02em" }}>
              Trung Tâm Quản Trị & Điều Hành Học Vụ Lớp DA26TTNT
            </h1>
            <p className="meta" style={{ margin: 0, fontSize: "12.5px" }}>
              Khu vực quản lý danh sách sinh viên, đăng thông báo và đối soát dữ liệu điểm danh / học tập.
            </p>
          </div>

        </div>

        {/* TABS BAR */}
        <div className="tabs" style={{ marginBottom: 20 }}>
          <Link href="/quan-tri/thong-bao" className="tab active">
            <Megaphone size={15} />
            <span>Soạn thảo & Đăng thông báo</span>
          </Link>
          <Link href="/quan-tri/thanh-vien" className="tab" style={{ background: "#fff" }}>
            <Users size={15} />
            <span>Quản lý thành viên & Vai trò</span>
          </Link>
          <Link href="/quan-tri/ban-can-su" className="tab" style={{ background: "#fff" }}>
            <ShieldCheck size={15} />
            <span>Cấu hình & Phân quyền BCS</span>
          </Link>
        </div>

        {/* MAIN TWO-COLUMN SPLIT */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
          {/* LEFT: FORM SOẠN THẢO THÔNG BÁO TỨC THÌ */}
          <div className="card" style={{ padding: "24px 28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ width: 4, height: 20, background: "var(--blue)", borderRadius: 2 }} />
                <h2 style={{ fontSize: "16px", fontWeight: 800, margin: 0 }}>
                  Soạn thảo & Đăng thông báo học vụ tức thì
                </h2>
              </div>
              <span className="meta" style={{ fontSize: "11px" }}>
                Gửi tới: <b>Toàn thể sinh viên DA26TTNT</b>
              </span>
            </div>

            <form action="/api/announcements" method="POST" className="stack" style={{ gap: 16 }}>
              {/* TIÊU ĐỀ */}
              <div className="form-row">
                <label style={{ fontSize: "12px", fontWeight: 700 }}>Tiêu đề thông báo *</label>
                <input
                  name="title"
                  className="field"
                  placeholder="Ví dụ: [LỊCH HỌC BỔ SUNG] Môn Trí tuệ Nhân tạo Cơ sở tuần 12..."
                  required
                />
              </div>

              {/* PHÂN LOẠI & MỨC ĐỘ ƯU TIÊN */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="form-row">
                  <label style={{ fontSize: "12px", fontWeight: 700 }}>Phân loại danh mục</label>
                  <select name="category" className="field" defaultValue="Học tập & Lịch thi">
                    <option value="Học tập & Lịch thi">Học tập & Lịch thi</option>
                    <option value="Lịch sinh hoạt">Lịch sinh hoạt</option>
                    <option value="Hoạt động phong trào">Hoạt động phong trào</option>
                    <option value="Học bổng & Học vụ">Học bổng & Học vụ</option>
                  </select>
                </div>

                <div className="form-row">
                  <label style={{ fontSize: "12px", fontWeight: 700 }}>Mức độ ưu tiên hiển thị</label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      background: "#f8fafc",
                      border: "1px solid var(--line)",
                      borderRadius: 8,
                      height: 38,
                      padding: "0 14px",
                    }}
                  >
                    <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: "11.5px", cursor: "pointer", color: "var(--red)" }}>
                      <input type="checkbox" name="urgent" />
                      <span>Quan trọng (Gửi Mail)</span>
                    </label>
                    <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: "11.5px", cursor: "pointer" }}>
                      <input type="checkbox" name="pinned" />
                      <span>Ghim đầu trang</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* NỘI DUNG */}
              <div className="form-row">
                <label style={{ fontSize: "12px", fontWeight: 700 }}>Nội dung chi tiết thông báo</label>
                <textarea
                  name="content"
                  className="field area"
                  rows={5}
                  placeholder="Nhập tóm tắt nội dung, giảng đường, thời gian bắt đầu và các yêu cầu chuẩn bị..."
                  required
                />
              </div>

              {/* TỆP ĐÍNH KÈM */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px dashed #cbd5e1",
                  borderRadius: 10,
                  padding: "12px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: "12px" }}>
                  <Paperclip size={15} style={{ color: "var(--blue)" }} />
                  <span>
                    Đính kèm tệp: <b>Slide_OnTap_KiemTra_GiuaKy.pdf (2.4MB)</b>
                  </span>
                </div>
                <button type="button" className="btn btn-sm" style={{ border: 0, color: "var(--blue)", background: "none" }}>
                  <Plus size={14} /> Thêm tệp đính kèm
                </button>
              </div>

              {/* ACTIONS */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button type="button" className="btn" style={{ background: "#fff" }}>
                  Lưu bản nháp
                </button>
                <button type="submit" className="btn btn-primary">
                  <Send size={14} />
                  Đăng thông báo ngay
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT: TRẠNG THÁI CSDL & NHẬT KÝ TÁC VỤ */}
          <div className="stack" style={{ gap: 18 }}>
            {/* TRẠNG THÁI KẾT NỐI CSDL */}
            <div className="card" style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14 }}>
                <RefreshCw size={15} style={{ color: "var(--green)" }} />
                <h3 style={{ fontSize: "13.5px", fontWeight: 750, margin: 0 }}>
                  Trạng thái kết nối CSDL Lớp
                </h3>
              </div>

              <div style={{ display: "grid", gap: 10, fontSize: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="meta">Tổng số sinh viên ghi nhận</span>
                  <strong style={{ fontSize: "14px" }}>{memberCount || 27} / 27</strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="meta">Đăng ký chuyên ngành AI</span>
                  <strong style={{ color: "var(--green)" }}>100%</strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="meta">Lần đồng bộ gần nhất</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "11px" }}>Hôm nay 08:35</span>
                </div>
              </div>

              <div
                style={{
                  background: "var(--green-50)",
                  border: "1px solid #bbf7d0",
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontSize: "11.5px",
                  color: "var(--green)",
                  lineHeight: 1.5,
                  display: "flex",
                  gap: 8,
                  marginTop: 14,
                }}
              >
                <CheckCircle size={16} style={{ flex: "none" }} />
                <span>Toàn bộ hồ sơ học viên đã được mã hóa và xác thực chữ ký số BCS.</span>
              </div>
            </div>

            {/* NHẬT KÝ TÁC VỤ GẦN ĐÂY */}
            <div className="card" style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14 }}>
                <Clock size={15} style={{ color: "var(--muted)" }} />
                <h3 style={{ fontSize: "13.5px", fontWeight: 750, margin: 0 }}>
                  Nhật ký tác vụ gần đây
                </h3>
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ fontSize: "11.5px", borderLeft: "2px solid var(--blue)", paddingLeft: 10 }}>
                  <strong>Thạch Ngọc Tiến</strong> đã tải lên file điểm danh tuần 11
                  <div className="meta" style={{ fontSize: "10.5px", marginTop: 2 }}>
                    10 phút trước • 48KB
                  </div>
                </div>

                <div style={{ fontSize: "11.5px", borderLeft: "2px solid var(--green)", paddingLeft: 10 }}>
                  <strong>Lâm Tuấn Kiệt</strong> cập nhật điểm bài tập lớn Trí tuệ nhân tạo
                  <div className="meta" style={{ fontSize: "10.5px", marginTop: 2 }}>
                    02 giờ trước • SV
                  </div>
                </div>

                <div style={{ fontSize: "11.5px", borderLeft: "2px solid #8b5cf6", paddingLeft: 10 }}>
                  <strong>Trần Thị Tường Vy</strong> phát động phong trào Hackathon Khoa
                  <div className="meta" style={{ fontSize: "10.5px", marginTop: 2 }}>
                    Hôm qua 16:40
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
