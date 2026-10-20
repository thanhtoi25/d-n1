import Link from "next/link";
import { ShieldCheck, Mail } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { MemberAvatar } from "@/components/member-avatar";
import { requireUser } from "@/lib/auth";
import { listPositions } from "@/lib/services/advisor";

export const dynamic = "force-dynamic";

export default async function OfficersPage() {
  await requireUser("/ban-can-su");
  const positions = await listPositions();
  const groups = new Map<string, typeof positions>();
  for (const p of positions) groups.set(p.title, [...(groups.get(p.title) ?? []), p]);

  return (
    <AppShell active="/ban-can-su">
      <div className="content">
        <div className="crumbs">
          <Link href="/">Trang chủ</Link>
          <span>›</span>
          <span className="cur">Ban cán sự</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", margin: "10px 0 24px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 6px", letterSpacing: "-.02em" }}>
              Ban Cán Sự Lớp DA26TTNT
            </h1>
            <p className="meta" style={{ margin: 0, fontSize: "12.5px" }}>
              Đội ngũ điều phối học vụ, phong trào và kết nối các thành viên trong tập thể lớp.
            </p>
          </div>
          <span className="badge outline" style={{ fontSize: "12px", padding: "6px 14px", fontWeight: 700 }}>
            Nhiệm kỳ 2026 - 2027
          </span>
        </div>

        {groups.size === 0 ? (
          <div className="card" style={{ padding: "40px" }}>
            <EmptyState title="Chưa cập nhật ban cán sự" detail="Quản trị viên có thể gán chức vụ cho thành viên trong trang Quản trị." />
          </div>
        ) : (
          <div className="stack" style={{ gap: 20 }}>
            {[...groups].map(([title, list]) => (
              <div key={title} className="card" style={{ padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <ShieldCheck size={18} style={{ color: "var(--blue)" }} />
                  <h2 style={{ fontSize: "16px", fontWeight: 750, margin: 0 }}>{title}</h2>
                  <span className="meta" style={{ fontSize: "11px" }}>({list.length} phụ trách)</span>
                </div>

                <div className="cards" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                  {list.map((p) => (
                    <div key={p.id} className="card" style={{ padding: "16px", background: "#f8fafc", border: "1px solid var(--line)" }}>
                      <div className="member-cell" style={{ marginBottom: 10 }}>
                        <MemberAvatar name={p.member.fullName} avatarUrl={p.member.avatarUrl} size={38} className="officer"/>
                        <div>
                          <Link className="link" href={`/thanh-vien/${p.member.id}`} style={{ fontWeight: 750, fontSize: "14px" }}>
                            {p.member.fullName}
                          </Link>
                          <div className="meta" style={{ fontFamily: "var(--mono)", fontSize: "11px" }}>
                            MSSV: {p.member.studentCode ?? "Chưa cập nhật"}
                          </div>
                        </div>
                      </div>

                      {p.duties && (
                        <p style={{ fontSize: "12px", color: "var(--ink-2)", lineHeight: 1.5, margin: "0 0 10px" }}>
                          {p.duties}
                        </p>
                      )}

                      {p.publicEmail && (
                        <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: "11.5px", color: "var(--blue)" }}>
                          <Mail size={13} />
                          <span>{p.publicEmail}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
