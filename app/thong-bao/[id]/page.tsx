import Link from "next/link";
import { notFound as nf } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ApiButton } from "@/components/api-form";
import { PageHead } from "@/components/page-head";
import { RichText } from "@/components/rich-text";
import { requireUser } from "@/lib/auth";
import { getAnnouncement } from "@/lib/services/announcements";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AnnouncementDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/thong-bao/${id}`);
  const a = await getAnnouncement(id, user).catch(() => null);
  if (!a) nf();
  return <AppShell active="/thong-bao"><div className="content">
    <Link href="/thong-bao" className="eyebrow">← Quay lại danh sách</Link>
    <PageHead eyebrow={a.category.toUpperCase()} title={a.title} description={`${a.author} · Đăng ${formatDate(a.publishedAt)} · Cập nhật ${formatDate(a.updatedAt)}`}/>
    <section className="card"><div className="card-body stack">
      <div className="row-actions">{a.pinned && <span className="badge">Đã ghim</span>}{a.importance !== "NORMAL" && <span className={`badge ${a.importance === "URGENT" ? "red" : "amber"}`}>{a.importance === "URGENT" ? "Khẩn" : "Quan trọng"}</span>}{a.status !== "PUBLISHED" && <span className="badge amber">{a.status === "DRAFT" ? "Bản nháp" : "Lưu trữ"}</span>}</div>
      {a.summary && <p><strong>{a.summary}</strong></p>}
      {a.deadline && <p className="meta">Hạn thực hiện: {formatDate(a.deadline)}</p>}
      <RichText text={a.content}/>
      {a.attachments.length > 0 && <div><strong>File đính kèm</strong>{a.attachments.map((f) => <p key={f.id}><a className="link" href={`/api/attachments/${f.id}`}>{f.originalName}</a> <span className="meta">({Math.ceil(f.size / 1024)} KB)</span></p>)}</div>}
      {a.status === "PUBLISHED" && (a.read ? <span className="badge green">Bạn đã xác nhận đã đọc</span> : <div><ApiButton url={`/api/announcements/${a.id}/read`} label="Xác nhận đã đọc"/></div>)}
      {"readCount" in a && <p className="meta">{a.readCount} người đã đọc</p>}
    </div></section>
  </div></AppShell>;
}
