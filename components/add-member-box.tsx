"use client";

import { Camera, Plus, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const POSITIONS = ["", "Lớp trưởng", "Lớp phó học tập", "Lớp phó phong trào", "Bí thư Chi đoàn", "Phó Bí thư Chi đoàn", "Ủy viên Ban cán sự"];

export function AddMemberBox() {
  const router = useRouter();
  const details = useRef<HTMLDetailsElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    setPending(true);
    setError(null);
    try {
      const memberResponse = await fetch("/api/members", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fullName: String(fd.get("fullName") ?? "").trim(),
          studentCode: String(fd.get("studentCode") ?? "").trim(),
          publicEmail: String(fd.get("publicEmail") ?? "").trim(),
          publicPhone: String(fd.get("publicPhone") ?? "").trim(),
          bio: String(fd.get("bio") ?? "").trim(),
        }),
      });
      const memberJson = await memberResponse.json().catch(() => ({}));
      if (!memberResponse.ok) throw new Error(memberJson.error ?? "Không thể thêm thành viên.");
      const memberId = memberJson.data.id as string;

      const image = fd.get("avatar");
      if (image instanceof File && image.size > 0) {
        const avatarData = new FormData();
        avatarData.append("file", image);
        const avatarResponse = await fetch(`/api/members/${memberId}/avatar`, { method: "POST", body: avatarData });
        const avatarJson = await avatarResponse.json().catch(() => ({}));
        if (!avatarResponse.ok) throw new Error(`Đã tạo thành viên nhưng chưa lưu được ảnh: ${avatarJson.error ?? "lỗi tải ảnh"}`);
      }

      const title = String(fd.get("position") ?? "");
      if (title) {
        const positionResponse = await fetch("/api/positions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ memberId, title }),
        });
        const positionJson = await positionResponse.json().catch(() => ({}));
        if (!positionResponse.ok) throw new Error(`Đã tạo thành viên nhưng chưa gán được chức vụ: ${positionJson.error ?? "lỗi chức vụ"}`);
      }

      form.reset();
      details.current?.removeAttribute("open");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể lưu thành viên.");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <details ref={details} className="card add-member-box">
      <summary className="card-head">
        <div><h2>Thêm thành viên</h2><p className="meta">Nhập hồ sơ, ảnh và chức vụ trong cùng một biểu mẫu.</p></div>
        <span className="btn btn-primary"><Plus size={15}/> Mở biểu mẫu</span>
      </summary>
      <div className="card-body">
        <form className="stack-form" onSubmit={submit}>
          <div className="member-form-grid">
            <div className="form-row"><label htmlFor="new-fullName">Họ và tên *</label><input id="new-fullName" className="field" name="fullName" required/></div>
            <div className="form-row"><label htmlFor="new-studentCode">Mã sinh viên</label><input id="new-studentCode" className="field" name="studentCode"/></div>
            <div className="form-row"><label htmlFor="new-email">Email công khai</label><input id="new-email" className="field" name="publicEmail" type="email"/></div>
            <div className="form-row"><label htmlFor="new-phone">Điện thoại công khai</label><input id="new-phone" className="field" name="publicPhone"/></div>
            <div className="form-row"><label htmlFor="new-position">Chức vụ</label><select id="new-position" className="field" name="position">{POSITIONS.map((p) => <option key={p} value={p}>{p || "Thành viên (không có chức vụ)"}</option>)}</select></div>
            <div className="form-row"><label htmlFor="new-avatar">Ảnh sinh viên</label><label className="field file-field" htmlFor="new-avatar"><Camera size={15}/><span>Chọn ảnh PNG/JPEG, tối đa 5 MB</span></label><input id="new-avatar" name="avatar" type="file" accept="image/png,image/jpeg" hidden/></div>
          </div>
          <div className="form-row"><label htmlFor="new-bio">Giới thiệu</label><textarea id="new-bio" className="field area" name="bio" rows={4}/></div>
          {error && <div className="error" role="alert">{error}</div>}
          <button className="btn btn-primary" disabled={pending}><UserPlus size={15}/>{pending ? "Đang lưu..." : "Lưu thành viên"}</button>
        </form>
      </div>
    </details>
  );
}
