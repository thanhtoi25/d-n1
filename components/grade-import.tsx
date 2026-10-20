"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Res = { results: { row: number; status: string; messages: string[]; studentCode?: string; subjectName?: string }[]; summary: { total: number; ok: number; error: number } };

export function GradeImport() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Res | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function call(f: File, mode: string) {
    const fd = new FormData(); fd.append("file", f); fd.append("mode", mode);
    const res = await fetch("/api/grades/import", { method: "POST", body: fd });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error ?? "Có lỗi xảy ra.");
    return json.data;
  }
  const run = async (fn: () => Promise<void>) => { setBusy(true); setMsg(null); try { await fn(); } catch (e) { setMsg({ ok: false, text: (e as Error).message }); } finally { setBusy(false); } };

  return <div className="stack">
    <input id="grade-file" type="file" accept=".xlsx,.xls,.csv" aria-label="Chọn tệp điểm" onChange={(e) => { const f = e.target.files?.[0] ?? null; setFile(f); setPreview(null); if (f) run(async () => setPreview(await call(f, "preview"))); }}/>
    {preview && <>
      <p>{preview.summary.total} dòng · <span className="badge green">{preview.summary.ok} hợp lệ</span> <span className="badge red">{preview.summary.error} lỗi</span></p>
      {preview.summary.error > 0 && <div className="table-wrap"><table><thead><tr><th>Dòng</th><th>MSSV</th><th>Môn</th><th>Lỗi</th></tr></thead><tbody>
        {preview.results.filter((r) => r.status === "error").slice(0, 100).map((r) => <tr key={r.row}><td>{r.row}</td><td>{r.studentCode ?? "—"}</td><td>{r.subjectName ?? "—"}</td><td>{r.messages.join(" ")}</td></tr>)}
      </tbody></table></div>}
      {preview.summary.error === 0 && <button id="grade-commit" className="btn btn-primary" disabled={busy} onClick={() => run(async () => { const r = await call(file!, "commit"); setMsg({ ok: true, text: `Đã nhập ${r.summary.ok} điểm môn học.` }); setPreview(null); router.refresh(); })}>Xác nhận nhập điểm</button>}
    </>}
    {msg && <div className={msg.ok ? "success" : "error"} role="status">{msg.text}</div>}
  </div>;
}
