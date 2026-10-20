import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { PageHead } from "@/components/page-head";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Tài liệu dùng chung = file đính kèm của thông báo đã đăng; tải xuống đi qua API có kiểm tra quyền. */
export default async function DocumentsPage() {
  await requireUser("/tai-lieu");
  const files = await prisma.attachment.findMany({
    where: { announcement: { status: "PUBLISHED" } },
    include: { announcement: { select: { id: true, title: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return <AppShell active="/tai-lieu"><div className="content"><PageHead eyebrow="TÀI LIỆU" title="Tài liệu dùng chung" description="Các tệp đính kèm trong thông báo đã đăng."/>
    {files.length === 0 ? <section className="card"><EmptyState title="Chưa có tài liệu" detail="Tệp đính kèm của thông báo đã đăng sẽ xuất hiện tại đây."/></section>
      : <div className="table-wrap"><table><thead><tr><th>Tên tệp</th><th>Thông báo</th><th>Dung lượng</th><th>Ngày tải lên</th></tr></thead><tbody>
        {files.map((f) => <tr key={f.id}><td><a className="link" href={`/api/attachments/${f.id}`}>{f.originalName}</a></td><td><Link className="link" href={`/thong-bao/${f.announcement.id}`}>{f.announcement.title}</Link></td><td>{Math.ceil(f.size / 1024)} KB</td><td>{formatDate(f.createdAt)}</td></tr>)}</tbody></table></div>}
  </div></AppShell>;
}
