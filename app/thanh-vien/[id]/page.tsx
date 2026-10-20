import Link from "next/link";
import { notFound as nf } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Mail,
  Printer,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { MemberAvatar } from "@/components/member-avatar";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { convert, summarize } from "@/lib/grades";

export const dynamic = "force-dynamic";

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser(`/thanh-vien/${id}`);

  // Tìm thành viên
  const member = await prisma.member.findUnique({
    where: { id },
    include: { positions: true, grades: { orderBy: { subjectCode: "asc" } } },
  });

  if (!member) nf();

  // Lấy danh sách thành viên để làm thanh chuyển tiếp (Trước / Sau)
  const allMembers = await prisma.member.findMany({
    select: { id: true, fullName: true, studentCode: true },
    orderBy: [{ studentCode: "asc" }, { fullName: "asc" }],
  });

  // Lấy cơ cấu Ban cán sự từ CSDL (tự cập nhật khi thay đổi chức vụ)
  const classPositions = await prisma.classPosition.findMany({
    include: { member: { select: { id: true, fullName: true } } },
    orderBy: { createdAt: "asc" },
  });

  const currentIndex = allMembers.findIndex((m) => m.id === member.id);
  const prevMember = currentIndex > 0 ? allMembers[currentIndex - 1] : allMembers[allMembers.length - 1];
  const nextMember = currentIndex < allMembers.length - 1 ? allMembers[currentIndex + 1] : allMembers[0];

  const isOfficer = member.positions && member.positions.length > 0;
  const officerPos = member.positions?.[0];
  const isFemale = member.fullName.includes("Vy") || member.fullName.includes("Thy");
  const fmt = (v: number | null) => (v === null || v === undefined ? "—" : v.toLocaleString("vi-VN"));
  const sum = summarize(member.grades);

  return (
    <AppShell active="/thanh-vien">
      <div className="content">
        {/* TOP BACK BAR & CRUMBS */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Link href="/thanh-vien" className="btn btn-sm" style={{ background: "#fff", display: "inline-flex", gap: 4 }}>
              <ChevronLeft size={14} /> Danh sách thành viên
            </Link>
            <div className="crumbs" style={{ margin: 0 }}>
              <Link href="/thanh-vien">Thành viên</Link>
              <span>›</span>
              <span>Chi tiết hồ sơ</span>
              <span>›</span>
              <strong style={{ color: "var(--ink)" }}>{member.fullName}</strong>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <span
              style={{
                background: "var(--blue-50)",
                color: "var(--blue)",
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: 650,
                display: "inline-flex",
                gap: 6,
                alignItems: "center",
              }}
            >
              Danh bạ 27 SV <b style={{ background: "var(--blue)", color: "#fff", padding: "1px 6px", borderRadius: 4 }}>{currentIndex + 1}/27</b>
            </span>
            <button className="btn btn-sm" style={{ background: "#fff" }} type="button">
              <Printer size={13} />
            </button>
            <button className="btn btn-sm btn-primary" type="button">
              Cập nhật hồ sơ
            </button>
          </div>
        </div>

        {/* HERO PROFILE CARD */}
        <div
          className="card"
          style={{
            background: "linear-gradient(180deg, #dbeafe 0%, #f1f5f9 28%, #ffffff 100%)",
            borderRadius: 16,
            padding: "24px 28px",
            marginBottom: 20,
            border: "1px solid var(--line)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
            {/* AVATAR & NAME INFO */}
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <MemberAvatar name={member.fullName} avatarUrl={member.avatarUrl} size={90} className="profile-photo" />

              <div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <h1 style={{ fontSize: "26px", fontWeight: 800, margin: 0 }}>{member.fullName}</h1>
                  {isOfficer && (
                    <span className="badge green" style={{ padding: "3px 8px" }}>
                      ★ {officerPos?.title}
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 6, flexWrap: "wrap" }}>
                  <span className="badge gray">{isFemale ? "Nữ" : "Nam"}</span>
                  <span className="meta" style={{ fontFamily: "var(--mono)", color: "var(--ink)" }}>
                    MSSV: {member.studentCode || "110526020"}
                  </span>
                  <span className="meta">Khóa 2026 - 2030 (K26)</span>
                  <span className="meta" style={{ color: "var(--blue)", fontWeight: 600 }}>
                    Ngành Trí tuệ Nhân tạo
                  </span>
                </div>
              </div>
            </div>

            {/* THREE STAT PILLS */}
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 16px", textAlign: "center" }}>
                <span className="meta" style={{ fontSize: "10px", fontWeight: 700 }}>CHUYÊN CẦN</span>
                <strong style={{ display: "block", fontSize: "18px", color: "var(--green)" }}>{fmt(member.attendanceScore)}</strong>
              </div>
              <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 16px", textAlign: "center" }}>
                <span className="meta" style={{ fontSize: "10px", fontWeight: 700 }}>ĐIỂM TB HỆ 10</span>
                <strong style={{ display: "block", fontSize: "18px", color: "var(--blue)" }}>{fmt(sum.gpa10)}</strong>
              </div>
              <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 16px", textAlign: "center" }}>
                <span className="meta" style={{ fontSize: "10px", fontWeight: 700 }}>KHEN THƯỞNG</span>
                <strong style={{ display: "block", fontSize: "18px", color: "var(--ink)" }}>{fmt(member.rewardScore)}</strong>
              </div>
            </div>
          </div>

          {/* ATTRIBUTES ROW */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 16,
              background: "#fff",
              border: "1px solid var(--line)",
              borderRadius: 12,
              padding: "14px 18px",
              marginTop: 20,
            }}
          >
            <div>
              <span className="meta" style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}>NGÀY SINH</span>
              <strong style={{ display: "block", fontSize: "14px", marginTop: 2 }}>{member.birthDate || "—"}</strong>
            </div>
            <div>
              <span className="meta" style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}>LỚP SINH HOẠT</span>
              <strong style={{ display: "block", fontSize: "14px", marginTop: 2 }}>DA26TTNT</strong>
            </div>
            <div>
              <span className="meta" style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}>EMAIL SINH VIÊN</span>
              <strong style={{ display: "block", fontSize: "13px", marginTop: 2, color: "var(--blue)" }}>
                {member.publicEmail || `${member.studentCode?.toLowerCase() ?? "thydb"}@st.edu.vn`}
              </strong>
            </div>
            <div>
              <span className="meta" style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}>TRẠNG THÁI CƯ TRÚ</span>
              <span className="badge outline" style={{ marginTop: 2, display: "inline-block" }}>{member.residence || "Chưa cập nhật"}</span>
            </div>
          </div>
          {member.bio && (
            <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 12, padding: "14px 18px", marginTop: 12 }}>
              <span className="meta" style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}>GIỚI THIỆU</span>
              <p style={{ fontSize: "13px", color: "var(--ink-2)", lineHeight: 1.7, margin: "4px 0 0", whiteSpace: "pre-line" }}>{member.bio}</p>
            </div>
          )}
        </div>

        {/* DETAILS GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
          {/* LEFT: TABS & OFFICER RESPONSIBILITIES */}
          <div>
            <div className="tabs" style={{ marginBottom: 16 }}>
              <span className="tab active">Thông tin học vụ & Vai trò</span>
            </div>
            {isOfficer ? (
              <div className="card" style={{ padding: "20px 24px", borderLeft: "4px solid var(--green)" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                  <ShieldCheck size={18} style={{ color: "var(--green)" }} />
                  <h3 style={{ fontSize: "15px", fontWeight: 750, margin: 0 }}>Trọng trách Ban cán sự: {officerPos?.title}</h3>
                </div>
                {officerPos?.duties && (
                  <p style={{ fontSize: "13px", color: "var(--ink-2)", lineHeight: 1.7, margin: 0, whiteSpace: "pre-line" }}>{officerPos.duties}</p>
                )}
              </div>
            ) : (
              <div className="card" style={{ padding: "16px 24px", borderLeft: "4px solid var(--line)" }}>
                <h3 style={{ fontSize: "15px", fontWeight: 750, margin: 0 }}>Vai trò: Thành viên</h3>
              </div>
            )}

            <div className="card" style={{ padding: "20px 24px", marginTop: 16 }}>
              <h3 style={{ fontSize: "15px", fontWeight: 750, margin: "0 0 12px" }}>Xem điểm</h3>
              {member.grades.length === 0 ? (
                <p className="meta" style={{ margin: 0 }}>Chưa có điểm môn học. Quản trị viên nhập từ Excel tại Quản trị › Thành viên.</p>
              ) : (
                <>
                  <div className="table-wrap">
                    <table style={{ fontSize: "12.5px" }}>
                      <thead>
                        <tr><th>STT</th><th>Mã MH</th><th>Nhóm</th><th>Tên môn học</th><th>TC</th><th>ĐTK L1</th><th>ĐTK L2</th><th>T3</th><th>TK (10)</th><th>TK (4)</th><th>TK (C)</th><th>Kết quả</th></tr>
                      </thead>
                      <tbody>
                        {member.grades.map((g, i) => {
                          const c = convert(g.final10);
                          return (
                            <tr key={g.id} style={c.pending ? { background: "#f8fafc" } : undefined}>
                              <td>{i + 1}</td><td style={{ fontFamily: "var(--mono)" }}>{g.subjectCode}</td><td>{g.groupCode ?? ""}</td><td>{g.subjectName}</td>
                              <td style={{ textAlign: "center" }}>{g.credits}</td><td>{g.l1 ?? ""}</td><td>{g.l2 ?? ""}</td><td>{g.t3 ?? ""}</td>
                              <td><b>{g.final10 ?? ""}</b></td><td>{c.score4?.toFixed(1) ?? ""}</td><td>{c.letter ?? ""}</td>
                              <td style={{ textAlign: "center", color: c.passed ? "var(--blue)" : "#dc2626", fontWeight: 700 }}>{c.passed ? "✓" : "✕"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px 24px", background: "var(--blue-50)", borderRadius: 10, padding: "12px 16px", marginTop: 12, fontSize: "12.5px", color: "var(--blue)" }}>
                    <span>Điểm trung bình hệ 4: <b>{sum.gpa4?.toFixed(2) ?? "—"}</b></span>
                    <span>Điểm trung bình hệ 10: <b>{sum.gpa10?.toFixed(2) ?? "—"}</b></span>
                    <span>Số tín chỉ đạt: <b>{sum.passedCredits}</b></span>
                    <span>Xếp loại: <b>{sum.rank}</b></span>
                  </div>
                </>
              )}
            </div>

            <div className="card" style={{ padding: "20px 24px", marginTop: 16 }}>
              <h3 style={{ fontSize: "15px", fontWeight: 750, margin: "0 0 12px" }}>Chuyên cần & Khen thưởng</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                {[
                  ["Điểm chuyên cần", member.attendanceScore, "var(--green)"],
                  ["Điểm khen thưởng", member.rewardScore, "var(--ink)"],
                ].map(([label, v, color]) => (
                  <div key={label as string} style={{ background: "#f8fafc", border: "1px solid var(--line)", borderRadius: 10, padding: "12px 14px" }}>
                    <span className="meta" style={{ fontSize: "11px", fontWeight: 700 }}>{label as string}</span>
                    <strong style={{ display: "block", fontSize: "22px", color: color as string }}>{fmt(v as number | null)}<span className="meta" style={{ fontSize: "12px" }}> /10</span></strong>
                  </div>
                ))}
              </div>
              <p className="meta" style={{ margin: "10px 0 0", fontSize: "11.5px" }}>Điểm chuyên cần và khen thưởng do admin nhập.</p>
            </div>
          </div>

          {/* RIGHT: THAO TÁC QUẢN TRỊ BCS & CƠ CẤU LỚP */}
          <div className="stack" style={{ gap: 16 }}>
            {/* THAO TÁC QUẢN TRỊ */}
            <div className="card" style={{ padding: "18px" }}>
              <h3 style={{ fontSize: "13.5px", fontWeight: 750, display: "flex", alignItems: "center", gap: 7, margin: "0 0 12px" }}>
                <UserCheck size={16} style={{ color: "var(--blue)" }} />
                Thao tác Quản trị BCS
              </h3>

              <div className="stack" style={{ gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ width: "100%", justifyContent: "space-between", background: "var(--blue-50)", color: "var(--blue)", border: 0 }}
                >
                  <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                    <Mail size={13} /> Gửi thông báo cá nhân
                  </span>
                  <span>›</span>
                </button>

                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ width: "100%", justifyContent: "space-between", background: "#f8fafc", border: "1px solid var(--line)" }}
                >
                  <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                    <FileSpreadsheet size={13} /> Cập nhật đóng quỹ lớp
                  </span>
                  <span className="badge green" style={{ padding: "1px 6px" }}>Đã nộp</span>
                </button>

                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ width: "100%", justifyContent: "space-between", background: "#f8fafc", border: "1px solid var(--line)" }}
                >
                  <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                    <Download size={13} /> Xuất phiếu sơ yếu lý lịch (PDF)
                  </span>
                  <Download size={12} />
                </button>
              </div>
            </div>

            {/* CƠ CẤU LỚP DA26TTNT */}
            <div className="card" style={{ padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <strong style={{ fontSize: "13px" }}>Cơ cấu Lớp DA26TTNT</strong>
                <span className="meta">Sĩ số: {allMembers.length}</span>
              </div>

              <div style={{ display: "grid", gap: 8, fontSize: "12px" }}>
                {classPositions.length === 0 && <span className="meta">Chưa có Ban cán sự.</span>}
                {classPositions.map((p) => {
                  const isCurrent = p.memberId === member.id;
                  return (
                    <div key={p.id} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <span className="meta">{p.title}</span>
                      {isCurrent ? (
                        <b style={{ color: "var(--blue)" }}>{p.member.fullName} (Hiện tại)</b>
                      ) : (
                        <Link href={`/thanh-vien/${p.member.id}`}>
                          <b>{p.member.fullName}</b>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM PAGINATION: SINH VIÊN TRƯỚC / SAU */}
        {prevMember && nextMember && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
              gap: 16,
              marginTop: 28,
              paddingTop: 18,
              borderTop: "1px solid var(--line)",
            }}
          >
            <Link
              href={`/thanh-vien/${prevMember.id}`}
              className="card"
              style={{ padding: "12px 18px", display: "flex", gap: 12, alignItems: "center" }}
            >
              <ChevronLeft size={18} style={{ color: "var(--muted)" }} />
              <div>
                <span className="meta" style={{ fontSize: "10.5px" }}>SINH VIÊN TRƯỚC ({currentIndex}/27)</span>
                <strong style={{ display: "block", fontSize: "13.5px" }}>{prevMember.fullName}</strong>
                <span className="meta" style={{ fontFamily: "var(--mono)", fontSize: "11px" }}>MSSV: {prevMember.studentCode}</span>
              </div>
            </Link>

            <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--muted)" }}>
              {currentIndex + 1} / {allMembers.length}
            </span>

            <Link
              href={`/thanh-vien/${nextMember.id}`}
              className="card"
              style={{ padding: "12px 18px", display: "flex", gap: 12, alignItems: "center", justifyContent: "flex-end", textAlign: "right" }}
            >
              <div>
                <span className="meta" style={{ fontSize: "10.5px" }}>SINH VIÊN SAU ({currentIndex + 2}/27)</span>
                <strong style={{ display: "block", fontSize: "13.5px" }}>{nextMember.fullName}</strong>
                <span className="meta" style={{ fontFamily: "var(--mono)", fontSize: "11px" }}>MSSV: {nextMember.studentCode}</span>
              </div>
              <ChevronRight size={18} style={{ color: "var(--muted)" }} />
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
