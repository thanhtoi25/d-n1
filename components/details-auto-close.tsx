"use client";
import { useEffect } from "react";

/** Đóng các ô chỉnh sửa (details.member-editor) khi bấm ra ngoài hoặc nhấn Esc; chỉ mở một ô tại một thời điểm. */
export function DetailsAutoClose({ selector = "details.member-editor" }: { selector?: string }) {
  useEffect(() => {
    const closeAll = (except?: Element | null) =>
      document.querySelectorAll<HTMLDetailsElement>(`${selector}[open]`).forEach((d) => { if (d !== except) d.open = false; });
    const onClick = (e: MouseEvent) => closeAll((e.target as Element | null)?.closest(selector));
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeAll(); };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("click", onClick); document.removeEventListener("keydown", onKey); };
  }, [selector]);
  return null;
}

/** Nút đóng ô chỉnh sửa chứa nó. */
export function CloseDetailsButton({ label = "Đóng" }: { label?: string }) {
  return <button type="button" className="btn btn-sm" onClick={(e) => { const d = e.currentTarget.closest("details"); if (d) d.open = false; }}>{label}</button>;
}
