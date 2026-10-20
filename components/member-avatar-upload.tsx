"use client";

import { Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function MemberAvatarUpload({ memberId }: { memberId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setMessage(null);
    const body = new FormData();
    body.append("file", file);
    const response = await fetch(`/api/members/${memberId}/avatar`, { method: "POST", body }).catch(() => null);
    const json = await response?.json().catch(() => ({}));
    if (!response?.ok) setMessage(json?.error ?? "Không thể tải ảnh lên.");
    else router.refresh();
    setBusy(false);
    event.target.value = "";
  }

  return (
    <label className="btn btn-sm" style={{ cursor: busy ? "wait" : "pointer" }}>
      <Camera size={13}/>
      {busy ? "Đang tải..." : "Tải ảnh"}
      <input
        type="file"
        accept="image/png,image/jpeg"
        hidden
        disabled={busy}
        onChange={upload}
        aria-label="Tải ảnh đại diện thành viên"
      />
      {message && <small className="field-error" role="alert">{message}</small>}
    </label>
  );
}
