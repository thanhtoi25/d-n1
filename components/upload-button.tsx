"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function UploadButton({ announcementId }: { announcementId: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setMsg(null);
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch(`/api/announcements/${announcementId}/attachments`, { method: "POST", body: fd }).catch(() => null);
    const json = await res?.json().catch(() => ({}));
    if (!res?.ok) setMsg(json?.error ?? "Tải tệp thất bại.");
    else router.refresh();
    setBusy(false); e.target.value = "";
  }
  return <label className="btn">{busy ? "Đang tải..." : "Đính kèm"}<input type="file" hidden onChange={onChange} disabled={busy} aria-label="Đính kèm tệp"/>{msg && <small className="field-error" role="alert">{msg}</small>}</label>;
}
