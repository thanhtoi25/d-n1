"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type FieldDef = {
  name: string; label: string; type?: "text" | "email" | "textarea" | "select" | "checkbox" | "datetime-local" | "url" | "hidden";
  options?: { value: string; label: string }[]; required?: boolean; placeholder?: string; defaultValue?: string | boolean;
};

/** Kết quả lời mời tài khoản trả về từ API. */
export type InviteData = { invite: { emailSent: boolean; emailNote?: string; link: string } };

/** Form gọi API JSON; hiển thị lỗi theo trường nếu server trả 422. */
export function ApiForm({ url, method = "POST", fields, submit, successMessage, resetOnSuccess = true, closeDetailsOnSuccess = false }: {
  url: string; method?: string; fields: FieldDef[]; submit: string; successMessage?: (data: InviteData) => string; resetOnSuccess?: boolean; closeDetailsOnSuccess?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [ok, setOk] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const body: Record<string, unknown> = {};
    for (const f of fields) {
      if (f.type === "checkbox") body[f.name] = fd.get(f.name) === "on";
      else {
        const v = String(fd.get(f.name) ?? "").trim();
        if (v !== "") body[f.name] = f.type === "datetime-local" ? new Date(v).toISOString() : v;
      }
    }
    setPending(true); setError(null); setFieldErrors({}); setOk(null);
    try {
      const res = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Không thể lưu dữ liệu.");
        if (Array.isArray(json.details)) setFieldErrors(Object.fromEntries((json.details as { path: string; message: string }[]).map((d) => [d.path, d.message])));
        return;
      }
      setOk(successMessage ? successMessage(json.data) : "Đã lưu thành công.");
      if (resetOnSuccess) form.reset();
      if (closeDetailsOnSuccess) { const d = form.closest("details"); if (d) d.open = false; }
      router.refresh();
    } catch {
      setError("Không kết nối được máy chủ.");
    } finally { setPending(false); }
  }

  return <form onSubmit={onSubmit} className="stack-form" noValidate={false}>
    {fields.map((f) => {
      const id = `f-${f.name}`;
      const err = fieldErrors[f.name];
      if (f.type === "hidden") return <input key={f.name} type="hidden" name={f.name} value={String(f.defaultValue ?? "")}/>;
      return <div key={f.name} className={f.type === "checkbox" ? "check-row" : "form-row"}>
        {f.type === "checkbox"
          ? <label><input id={id} name={f.name} type="checkbox" defaultChecked={!!f.defaultValue}/> {f.label}</label>
          : <>
            <label htmlFor={id}>{f.label}{f.required && " *"}</label>
            {f.type === "textarea" ? <textarea id={id} name={f.name} className="field area" required={f.required} placeholder={f.placeholder} defaultValue={String(f.defaultValue ?? "")} rows={5}/>
              : f.type === "select" ? <select id={id} name={f.name} className="field" required={f.required} defaultValue={String(f.defaultValue ?? "")}>{!f.required && <option value="">—</option>}{f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
              : <input id={id} name={f.name} type={f.type ?? "text"} className="field" required={f.required} placeholder={f.placeholder} defaultValue={String(f.defaultValue ?? "")}/>}
          </>}
        {err && <small className="field-error" role="alert">{err}</small>}
      </div>;
    })}
    {error && <div className="error" role="alert">{error}</div>}
    {ok && <div className="success" role="status">{ok}</div>}
    <button className="btn btn-primary" disabled={pending}>{pending ? "Đang lưu..." : submit}</button>
  </form>;
}

/** Nút gọi API (đăng, lưu trữ, xóa…) có xác nhận trước khi thực hiện. */
export function ApiButton({ url, method = "POST", body, label, confirm, danger }: {
  url: string; method?: string; body?: unknown; label: string; confirm?: string; danger?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  async function run() {
    if (confirm && !window.confirm(confirm)) return;
    setPending(true); setMsg(null);
    try {
      const res = await fetch(url, { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) setMsg(json.error ?? "Thao tác thất bại.");
      else {
        const inv = json.data?.invite;
        if (inv?.link) setMsg(`${inv.emailSent ? "Đã gửi email. " : "Email chưa được gửi (" + (inv.emailNote ?? "") + "). "}Liên kết kích hoạt: ${inv.link}`);
        router.refresh();
      }
    } catch { setMsg("Không kết nối được máy chủ."); } finally { setPending(false); }
  }
  return <>
    <button type="button" className="btn" style={danger ? { color: "#c5303c" } : undefined} disabled={pending} onClick={run}>{pending ? "..." : label}</button>
    {msg && <small className="field-error" role="alert">{msg}</small>}
  </>;
}
