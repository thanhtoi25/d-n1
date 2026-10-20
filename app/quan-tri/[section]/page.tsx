import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ApiButton, ApiForm } from "@/components/api-form";
import { AddMemberBox } from "@/components/add-member-box";
import { CloseDetailsButton, DetailsAutoClose } from "@/components/details-auto-close";
import { EmptyState } from "@/components/empty-state";
import { ImportWizard } from "@/components/import-wizard";
import { GradeImport } from "@/components/grade-import";
import { MemberAvatarUpload } from "@/components/member-avatar-upload";
import { PageHead } from "@/components/page-head";
import { UploadButton } from "@/components/upload-button";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listAccounts } from "@/lib/services/accounts";
import { getAdvisor, listPositions } from "@/lib/services/advisor";
import { listMembers } from "@/lib/services/members";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const sections: Record<string, { title: string; description: string; min: "ADMIN" | "CLASS_OFFICER" }> = {
  "thanh-vien": { title: "Quản lý thành viên", description: "Quản lý hồ sơ, thông tin công khai và trạng thái thành viên.", min: "ADMIN" },
  "ban-can-su": { title: "Quản lý ban cán sự", description: "Gán chức vụ đã được xác nhận cho thành viên.", min: "ADMIN" },
  "co-van": { title: "Quản lý cố vấn học tập", description: "Cập nhật hồ sơ, thông tin liên hệ và lịch tư vấn.", min: "ADMIN" },
  "thong-bao": { title: "Quản lý thông báo", description: "Soạn thảo, xuất bản, ghim và lưu trữ thông báo.", min: "CLASS_OFFICER" },
  "tai-khoan": { title: "Tài khoản & phân quyền", description: "Mời người dùng, kích hoạt tài khoản và kiểm soát vai trò.", min: "ADMIN" },
};
const ROLES = [{ value: "MEMBER", label: "Thành viên" }, { value: "CLASS_OFFICER", label: "Ban cán sự" }, { value: "ADMIN", label: "Quản trị viên" }];
const ROLE_LABEL = Object.fromEntries(ROLES.map((r) => [r.value, r.label]));
const POSITION_OPTIONS = [
  { value: "Lớp trưởng", label: "Lớp trưởng" },
  { value: "Lớp phó học tập", label: "Lớp phó học tập" },
  { value: "Lớp phó phong trào", label: "Lớp phó phong trào" },
  { value: "Bí thư Chi đoàn", label: "Bí thư Chi đoàn" },
  { value: "Phó Bí thư Chi đoàn", label: "Phó Bí thư Chi đoàn" },
  { value: "Ủy viên Ban cán sự", label: "Ủy viên Ban cán sự" },
];

export default async function AdminSection({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const item = sections[section];
  if (!item) notFound();
  const user = await requireRole(item.min, `/quan-tri/${section}`);
  return <AppShell active="/quan-tri"><div className="content">
    <Link href="/quan-tri" className="eyebrow"><ArrowLeft size={12}/> Quay lại tổng quan</Link>
    <PageHead title={item.title} description={item.description}/>
    {section === "thanh-vien" && <Members/>}
    {section === "ban-can-su" && <Positions/>}
    {section === "co-van" && <Advisor/>}
    {section === "thong-bao" && <Announcements isAdmin={user.role === "ADMIN"} userId={user.id}/>}
    {section === "tai-khoan" && <Accounts selfId={user.id}/>}
  </div></AppShell>;
}

async function Members() {
  const admin = await requireRole("ADMIN");
  const data = await listMembers({ page: 1, pageSize: 100 }, admin);
  return <div className="stack">
    <DetailsAutoClose/>
    <AddMemberBox/>
    <section className="card excel-guide">
      <div className="card-head"><div><h2>Nhập thành viên từ Excel</h2><p className="meta">Tiện ích nhập file được đặt trong quản lý thành viên; không còn là một mục quản trị riêng.</p></div></div>
      <div className="card-body stack">
        <div className="notice"><strong>Cấu trúc file:</strong> dòng đầu tiên là tiêu đề, từ dòng thứ hai mỗi dòng là một thành viên. Không gộp ô.</div>
        <div className="table-wrap"><table><thead><tr><th>Tên cột gợi ý</th><th>Bắt buộc</th><th>Định dạng và ví dụ</th></tr></thead><tbody>
          <tr><td>Họ và tên</td><td>Có</td><td>Văn bản — Nguyễn Văn An</td></tr>
          <tr><td>Mã sinh viên</td><td>Không</td><td>Văn bản, duy nhất — 00123456 (định dạng Text để giữ số 0 đầu)</td></tr>
          <tr><td>Email</td><td>Không</td><td>Email hợp lệ — an.nguyen@example.com</td></tr>
          <tr><td>Điện thoại</td><td>Không</td><td>Văn bản — 0901234567</td></tr>
          <tr><td>Ngày tháng năm sinh</td><td>Không</td><td>dd/mm/yyyy — 01/08/2008</td></tr>
          <tr><td>Trạng thái cư trú</td><td>Không</td><td>Văn bản — Nội trú / Ngoại trú / Ở trọ</td></tr>
          <tr><td>Nội dung giới thiệu</td><td>Không</td><td>Văn bản, tối đa 1000 ký tự</td></tr>
        </tbody></table></div>
        <ul className="helper-list">
          <li>Hỗ trợ .xlsx, .xls và .csv (CSV nên dùng UTF-8), tối đa 5 MB và 2.000 dòng.</li>
          <li>Sau khi tải file, chọn sheet và ghép từng cột với trường tương ứng trước khi xác nhận.</li>
          <li>Dòng trống được bỏ qua; mã sinh viên trùng có thể chọn bỏ qua hoặc cập nhật hồ sơ hiện có.</li>
          <li>Ảnh, chức vụ, điểm chuyên cần và điểm khen thưởng không nhập từ Excel; admin thiết lập riêng tại từng hồ sơ bên dưới.</li>
        </ul>
        <ImportWizard/>
      </div>
    </section>
    <section className="card excel-guide">
      <div className="card-head"><div><h2>Nhập điểm từng môn từ Excel</h2><p className="meta">Mỗi dòng là điểm của một sinh viên ở một môn. Điểm hệ 4, điểm chữ, kết quả và điểm trung bình được tính tự động.</p></div></div>
      <div className="card-body stack">
        <div className="table-wrap"><table><thead><tr><th>Tên cột</th><th>Bắt buộc</th><th>Định dạng và ví dụ</th></tr></thead><tbody>
          <tr><td>MSSV</td><td>Có</td><td>Phải trùng mã sinh viên đã có — 119526003</td></tr>
          <tr><td>Mã MH</td><td>Có</td><td>Văn bản — 450015</td></tr>
          <tr><td>Nhóm</td><td>Không</td><td>Văn bản — 01</td></tr>
          <tr><td>Tên môn học</td><td>Có</td><td>Pháp luật đại cương</td></tr>
          <tr><td>Số tín chỉ</td><td>Có</td><td>Số nguyên — 2</td></tr>
          <tr><td>ĐTK L1 / ĐTK L2 / T3</td><td>Không</td><td>0–10 hoặc M (miễn) — 8.3</td></tr>
          <tr><td>Điểm TK (10)</td><td>Có (được để trống)</td><td>0–10 hoặc M; trống = chưa có điểm — 8</td></tr>
        </tbody></table></div>
        <ul className="helper-list">
          <li>Nhập lại cùng MSSV + Mã MH sẽ cập nhật điểm cũ.</li>
          <li>Quy đổi: ≥9 A+ (4.0), ≥8 A (3.5), ≥7 B+ (3.0), ≥6 B (2.5), ≥5 C+ (2.0), ≥4 C (1.5), ≥3 D+ (1.0), &lt;3 F. Đạt khi ≥ 4.</li>
        </ul>
        <GradeImport/>
      </div>
    </section>
    <section className="card"><div className="card-head"><h2>Danh sách ({data.total})</h2></div>
      {data.items.length === 0 ? <EmptyState title="Chưa có thành viên" detail="Thêm thủ công hoặc nhập từ Excel/CSV."/> : <div className="table-wrap"><table><thead><tr><th>Ảnh</th><th>Mã SV</th><th>Họ tên</th><th>Chức vụ / Ban cán sự</th><th>Tài khoản</th><th>Quản lý</th></tr></thead><tbody>
        {data.items.map((m) => <tr key={m.id}>
          <td>{m.avatarUrl ? <Image unoptimized className="member-avatar" src={m.avatarUrl} alt={`Ảnh ${m.fullName}`} width={44} height={44}/> : <span className="member-avatar member-avatar-empty">{m.fullName.trim().charAt(0).toUpperCase()}</span>}</td>
          <td>{m.studentCode ?? "—"}</td><td><strong>{m.fullName}</strong><div className="meta">{m.publicEmail ?? m.publicPhone ?? "Chưa có liên hệ công khai"}</div></td>
          <td>{m.positions.length ? <div className="position-chips">{m.positions.map((p) => <span className="badge" key={p.id}>{p.title}</span>)}</div> : <span className="meta">Thành viên</span>}</td>
          <td>{"hasAccount" in m && m.hasAccount ? "Có" : "Chưa có"}</td>
          <td><details className="member-editor"><summary className="btn btn-sm">Chỉnh sửa</summary><div className="member-editor-panel stack">
            <div style={{ display: "flex", justifyContent: "flex-end" }}><CloseDetailsButton label="✕ Đóng"/></div>
            <div><h3>Ảnh đại diện</h3><p className="meta">PNG hoặc JPEG, tối đa 5 MB.</p><MemberAvatarUpload memberId={m.id}/></div>
            <div><h3>Thông tin thành viên</h3><ApiForm url={`/api/members/${m.id}`} method="PATCH" resetOnSuccess={false} closeDetailsOnSuccess submit="Lưu thay đổi" fields={[
              { name: "fullName", label: "Họ và tên", required: true, defaultValue: m.fullName }, { name: "studentCode", label: "Mã sinh viên", defaultValue: m.studentCode ?? "" }, { name: "publicEmail", label: "Email công khai", type: "email", defaultValue: m.publicEmail ?? "" }, { name: "publicPhone", label: "Điện thoại công khai", defaultValue: m.publicPhone ?? "" }, { name: "bio", label: "Giới thiệu", type: "textarea", defaultValue: m.bio ?? "" }, { name: "birthDate", label: "Ngày sinh (dd/mm/yyyy)", defaultValue: m.birthDate ?? "" }, { name: "residence", label: "Trạng thái cư trú", defaultValue: m.residence ?? "" }]}/></div>
            <div><h3>Điểm chuyên cần & khen thưởng (admin nhập)</h3><ApiForm url={`/api/members/${m.id}`} method="PATCH" resetOnSuccess={false} closeDetailsOnSuccess submit="Lưu điểm" fields={[
              { name: "attendanceScore", label: "Điểm chuyên cần (0–10)", defaultValue: m.attendanceScore?.toString() ?? "" }, { name: "rewardScore", label: "Điểm khen thưởng (0–10)", defaultValue: m.rewardScore?.toString() ?? "" }]}/></div>
            <div><h3>Phân công ban cán sự</h3><ApiForm url="/api/positions" closeDetailsOnSuccess submit="Gán chức vụ" fields={[
              { name: "memberId", label: "", type: "hidden", defaultValue: m.id }, { name: "title", label: "Chức vụ", type: "select", required: true, options: POSITION_OPTIONS }, { name: "duties", label: "Nhiệm vụ", type: "textarea" }, { name: "publicEmail", label: "Email liên hệ chức vụ", type: "email", defaultValue: m.publicEmail ?? "" }]}/>
              {m.positions.length > 0 && <div className="position-remove-list">{m.positions.map((p) => <div key={p.id}><span>{p.title}</span><ApiButton url={`/api/positions/${p.id}`} method="DELETE" label="Gỡ" danger confirm={`Gỡ chức vụ ${p.title}?`}/></div>)}</div>}
            </div>
            <div className="danger-zone"><ApiButton url={`/api/members/${m.id}`} method="DELETE" label="Xóa thành viên" danger confirm={`Xóa thành viên ${m.fullName}? Không thể hoàn tác.`}/></div>
          </div></details></td>
        </tr>)}</tbody></table></div>}</section></div>;
}

async function Positions() {
  const [positions, members] = await Promise.all([listPositions(), prisma.member.findMany({ select: { id: true, fullName: true, studentCode: true }, orderBy: { fullName: "asc" }, take: 500 })]);
  return <div className="stack">
    <section className="card"><div className="card-head"><h2>Gán chức vụ</h2></div><div className="card-body">{members.length === 0 ? <p className="meta">Cần có thành viên trước khi gán chức vụ.</p> : <ApiForm url="/api/positions" submit="Gán chức vụ" fields={[
      { name: "memberId", label: "Thành viên", type: "select", required: true, options: members.map((m) => ({ value: m.id, label: `${m.fullName}${m.studentCode ? ` (${m.studentCode})` : ""}` })) },
      { name: "title", label: "Chức vụ", type: "select", required: true, options: POSITION_OPTIONS }, { name: "duties", label: "Nhiệm vụ", type: "textarea" }, { name: "publicEmail", label: "Email liên hệ", type: "email" }]}/>}</div></section>
    <section className="card"><div className="card-head"><h2>Hiện tại</h2></div>{positions.length === 0 ? <EmptyState title="Chưa có chức vụ" detail="Chưa gán chức vụ nào."/> : <div className="table-wrap"><table><thead><tr><th>Chức vụ</th><th>Thành viên</th><th>Thao tác</th></tr></thead><tbody>
      {positions.map((p) => <tr key={p.id}><td>{p.title}</td><td>{p.member.fullName}</td><td><ApiButton url={`/api/positions/${p.id}`} method="DELETE" label="Gỡ" danger confirm="Gỡ chức vụ này?"/></td></tr>)}</tbody></table></div>}</section></div>;
}

async function Advisor() {
  const a = await getAdvisor();
  return <section className="card"><div className="card-body"><ApiForm url="/api/advisor" method="PUT" resetOnSuccess={false} submit="Lưu hồ sơ" fields={[
    { name: "fullName", label: "Họ và tên", defaultValue: a?.fullName ?? "" }, { name: "title", label: "Học vị / chức danh", defaultValue: a?.title ?? "" }, { name: "department", label: "Đơn vị công tác", defaultValue: a?.department ?? "" },
    { name: "introduction", label: "Giới thiệu vai trò", type: "textarea", defaultValue: a?.introduction ?? "" }, { name: "avatarUrl", label: "URL ảnh", type: "url", defaultValue: a?.avatarUrl ?? "" },
    { name: "publicEmail", label: "Email", type: "email", defaultValue: a?.publicEmail ?? "" }, { name: "publicPhone", label: "Điện thoại", defaultValue: a?.publicPhone ?? "" }, { name: "officeHours", label: "Lịch tư vấn", type: "textarea", defaultValue: a?.officeHours ?? "" }]}/></div></section>;
}

async function Announcements({ isAdmin, userId }: { isAdmin: boolean; userId: string }) {
  const list = await prisma.announcement.findMany({ where: isAdmin ? {} : { authorId: userId }, include: { attachments: true, _count: { select: { reads: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
  const label = { DRAFT: "Bản nháp", PUBLISHED: "Đã đăng", ARCHIVED: "Lưu trữ" } as const;
  return <div className="stack">
    <section className="card"><div className="card-head"><h2>Soạn thông báo (lưu thành bản nháp)</h2></div><div className="card-body"><ApiForm url="/api/announcements" submit="Lưu bản nháp" fields={[
      { name: "title", label: "Tiêu đề", required: true }, { name: "summary", label: "Tóm tắt" }, { name: "content", label: "Nội dung", type: "textarea", required: true },
      { name: "category", label: "Loại", required: true, placeholder: "Học vụ, Hoạt động..." }, { name: "importance", label: "Mức độ", type: "select", required: true, defaultValue: "NORMAL", options: [{ value: "NORMAL", label: "Bình thường" }, { value: "IMPORTANT", label: "Quan trọng" }, { value: "URGENT", label: "Khẩn" }] },
      { name: "deadline", label: "Hạn thực hiện", type: "datetime-local" }, ...(isAdmin ? [{ name: "pinned", label: "Ghim", type: "checkbox" as const }, { name: "isPublic", label: "Công khai cho khách", type: "checkbox" as const }] : [])]}/></div></section>
    <section className="card"><div className="card-head"><h2>Thông báo ({list.length})</h2></div>{list.length === 0 ? <EmptyState title="Chưa có thông báo" detail="Soạn thông báo đầu tiên ở trên."/> : <div className="table-wrap"><table><thead><tr><th>Tiêu đề</th><th>Trạng thái</th><th>Đã đọc</th><th>Thao tác</th></tr></thead><tbody>
      {list.map((a) => <tr key={a.id}><td><Link className="link" href={`/thong-bao/${a.id}`}>{a.title}</Link>{a.pinned && <span className="badge">Ghim</span>}<div className="meta">{formatDate(a.createdAt)} · {a.attachments.length} file</div></td><td>{label[a.status]}</td><td>{a._count.reads}</td>
        <td><div className="row-actions">
          {(isAdmin || a.status === "DRAFT") && <UploadButton announcementId={a.id}/>}
          {isAdmin && a.status !== "PUBLISHED" && <ApiButton url={`/api/announcements/${a.id}`} body={{ action: "publish" }} label="Đăng" confirm="Đăng thông báo này cho mọi người?"/>}
          {isAdmin && a.status === "PUBLISHED" && <><ApiButton url={`/api/announcements/${a.id}`} body={{ action: "archive" }} label="Lưu trữ"/><ApiButton url={`/api/announcements/${a.id}`} body={{ action: "unpublish" }} label="Gỡ về nháp"/></>}
          {isAdmin && <ApiButton url={`/api/announcements/${a.id}`} method="PATCH" body={{ pinned: !a.pinned }} label={a.pinned ? "Bỏ ghim" : "Ghim"}/>}
          {isAdmin && <ApiButton url={`/api/announcements/${a.id}`} method="DELETE" label="Xóa" danger confirm="Xóa thông báo và file đính kèm? Không thể hoàn tác."/>}
        </div></td></tr>)}</tbody></table></div>}</section></div>;
}

async function Accounts({ selfId }: { selfId: string }) {
  const [accounts, members] = await Promise.all([listAccounts(), prisma.member.findMany({ where: { userId: null }, select: { id: true, fullName: true, studentCode: true }, orderBy: { fullName: "asc" }, take: 500 })]);
  const status = { ACTIVE: "Hoạt động", INVITED: "Chờ kích hoạt", SUSPENDED: "Bị khóa" } as const;
  return <div className="stack">
    <section className="card"><div className="card-head"><h2>Mời người dùng</h2></div><div className="card-body"><ApiForm url="/api/accounts" submit="Tạo lời mời"
      successMessage={(d) => `${d.invite.emailSent ? "Đã gửi email. " : "Email chưa được gửi (" + (d.invite.emailNote ?? "") + "). "}Liên kết kích hoạt (gửi thủ công): ${d.invite.link}`}
      fields={[{ name: "email", label: "Email", type: "email", required: true }, { name: "displayName", label: "Tên hiển thị", required: true }, { name: "role", label: "Vai trò", type: "select", required: true, defaultValue: "MEMBER", options: ROLES },
        { name: "memberId", label: "Liên kết hồ sơ thành viên", type: "select", options: members.map((m) => ({ value: m.id, label: `${m.fullName}${m.studentCode ? ` (${m.studentCode})` : ""}` })) }]}/></div></section>
    <section className="card"><div className="card-head"><h2>Tài khoản ({accounts.length})</h2></div>{accounts.length === 0 ? <EmptyState title="Chưa có tài khoản" detail="Tạo lời mời ở trên."/> : <div className="table-wrap"><table><thead><tr><th>Email</th><th>Vai trò</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>
      {accounts.map((u) => <tr key={u.id}><td>{u.displayName}<div className="meta">{u.email}</div></td><td>{ROLE_LABEL[u.role]}</td><td>{status[u.status]}</td><td><div className="row-actions">
        {u.id !== selfId && u.status !== "INVITED" && ROLES.filter((r) => r.value !== u.role).map((r) => <ApiButton key={r.value} url={`/api/accounts/${u.id}`} method="PATCH" body={{ role: r.value }} label={`→ ${r.label}`} confirm={`Đổi vai trò của ${u.displayName} thành ${r.label}?`}/>)}
        {u.id !== selfId && u.status === "ACTIVE" && <ApiButton url={`/api/accounts/${u.id}`} method="PATCH" body={{ status: "SUSPENDED" }} label="Khóa" danger confirm="Khóa tài khoản này?"/>}
        {u.id !== selfId && u.status === "SUSPENDED" && <ApiButton url={`/api/accounts/${u.id}`} method="PATCH" body={{ status: "ACTIVE" }} label="Mở khóa"/>}
        {u.status === "INVITED" && <ApiButton url={`/api/accounts/${u.id}`} body={{ action: "reinvite" }} label="Gửi lại lời mời"/>}
      </div></td></tr>)}</tbody></table></div>}</section></div>;
}
