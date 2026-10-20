import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { PageHead } from "@/components/page-head";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Lịch lớp lấy từ hạn thực hiện của các thông báo đã đăng — không có dữ liệu giả. */
export default async function CalendarPage() {
  await requireUser("/lich");
  const now = new Date();
  const items = await prisma.announcement.findMany({
    where: { status: "PUBLISHED", deadline: { not: null } },
    select: { id: true, title: true, category: true, importance: true, deadline: true },
    orderBy: { deadline: "asc" },
    take: 200,
  });
  const upcoming = items.filter((a) => a.deadline! >= now);
  const past = items.filter((a) => a.deadline! < now).reverse().slice(0, 20);
  const Row = ({ a }: { a: (typeof items)[number] }) => <div className="announcement"><div className="row-actions"><span className="badge">{a.category}</span>{a.importance !== "NORMAL" && <span className={`badge ${a.importance === "URGENT" ? "red" : "amber"}`}>{a.importance === "URGENT" ? "Khẩn" : "Quan trọng"}</span>}</div><h3><Link href={`/thong-bao/${a.id}`}>{a.title}</Link></h3><div className="meta">Hạn: {formatDate(a.deadline)}</div></div>;
  return <AppShell active="/lich"><div className="content"><PageHead eyebrow="LỊCH LỚP" title="Lịch học & hoạt động" description="Các mốc thời gian được lấy từ hạn thực hiện của thông báo đã đăng."/>
    <div className="grid-main"><section className="card"><div className="card-head"><h2>Sắp tới ({upcoming.length})</h2></div>{upcoming.length ? <div className="card-body">{upcoming.map((a) => <Row key={a.id} a={a}/>)}</div> : <EmptyState title="Chưa có lịch" detail="Thông báo có hạn thực hiện sẽ xuất hiện tại đây."/>}</section>
      <aside><section className="card"><div className="card-head"><h2>Đã qua</h2></div>{past.length ? <div className="card-body">{past.map((a) => <Row key={a.id} a={a}/>)}</div> : <EmptyState title="Chưa có" detail="Chưa có mốc nào đã qua."/>}</section></aside></div></div></AppShell>;
}
