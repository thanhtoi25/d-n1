"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Sheet = { name: string; headers: string[] };
type Row = { row: number; status: "new" | "update" | "skip" | "error"; messages: string[]; data?: { fullName: string; studentCode: string | null } };
type Preview = { results: Row[]; summary: { total: number; new: number; update: number; skip: number; error: number } };

const FIELD_LABELS: Record<string, string> = { fullName: "Họ và tên *", studentCode: "Mã sinh viên", publicEmail: "Email", publicPhone: "Điện thoại", birthDate: "Ngày tháng năm sinh", residence: "Trạng thái cư trú", bio: "Nội dung giới thiệu" };
const GUESS: Record<string, RegExp> = { fullName: /h[oọ]\s*(v[àa]\s*)?t[eê]n|name/i, studentCode: /m[aã]\s*(sv|sinh)|student|mssv/i, publicEmail: /mail/i, publicPhone: /(đi[eệ]n|dien|phone|sđt|sdt)/i, birthDate: /ng[aà]y\s*sinh|birth|dob/i, residence: /c[uư]\s*tr[uú]|residen/i, bio: /gi[oớ]i\s*thi[eệ]u|bio/i };

/** Luồng nhập: tải tệp → chọn sheet → ghép cột → xem trước → chính sách trùng → xác nhận. Server kiểm tra lại ở bước xác nhận. */
export function ImportWizard() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [sheet, setSheet] = useState("");
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [policy, setPolicy] = useState<"skip" | "update">("skip");
  const [allowDup, setAllowDup] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function call(mode: string, extra?: object) {
    const fd = new FormData();
    fd.append("file", file!); fd.append("mode", mode);
    fd.append("options", JSON.stringify({ sheet: sheet || undefined, mapping, policy, allowPossibleDuplicates: allowDup, ...extra }));
    const res = await fetch("/api/import", { method: "POST", body: fd });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error ?? "Có lỗi xảy ra.");
    return json.data;
  }
  const wrap = async (fn: () => Promise<void>) => { setBusy(true); setError(null); try { await fn(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } };

  const headers = sheets.find((s) => s.name === sheet)?.headers ?? [];
  const guess = (hs: string[]) => Object.fromEntries(Object.entries(GUESS).flatMap(([f, re]) => { const h = hs.find((x) => re.test(x)); return h ? [[f, h]] : []; }));

  const onFile = (f: File | null) => wrap(async () => {
    setFile(f); setPreview(null); setDone(null); setSheets([]);
    if (!f) return;
    const fd = new FormData(); fd.append("file", f); fd.append("mode", "sheets");
    const res = await fetch("/api/import", { method: "POST", body: fd });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error ?? "Không đọc được tệp.");
    setSheets(json.data.sheets); setSheet(json.data.sheets[0]?.name ?? ""); setMapping(guess(json.data.sheets[0]?.headers ?? []));
  });

  return <div className="stack">
    <section className="card"><div className="card-head"><h2>1. Tải tệp dữ liệu</h2></div><div className="card-body">
      <input id="class-file" type="file" accept=".xlsx,.xls,.csv" onChange={(e) => onFile(e.target.files?.[0] ?? null)} aria-label="Chọn tệp Excel hoặc CSV"/>
      <p className="meta">Hỗ trợ .xlsx, .xls, .csv, tối đa 5 MB. Dòng 1 là tiêu đề cột.</p></div></section>
    {sheets.length > 0 && <section className="card"><div className="card-head"><h2>2. Chọn sheet và ghép cột</h2></div><div className="card-body stack-form">
      {sheets.length > 1 && <div className="form-row"><label htmlFor="sheet">Sheet</label><select id="sheet" className="field" value={sheet} onChange={(e) => { setSheet(e.target.value); setMapping(guess(sheets.find((s) => s.name === e.target.value)?.headers ?? [])); setPreview(null); }}>{sheets.map((s) => <option key={s.name}>{s.name}</option>)}</select></div>}
      {Object.entries(FIELD_LABELS).map(([f, label]) => <div className="form-row" key={f}><label htmlFor={`m-${f}`}>{label}</label>
        <select id={`m-${f}`} className="field" value={mapping[f] ?? ""} onChange={(e) => { const m = { ...mapping }; if (e.target.value) m[f] = e.target.value; else delete m[f]; setMapping(m); setPreview(null); }}><option value="">— Không nhập —</option>{headers.map((h) => <option key={h}>{h}</option>)}</select></div>)}
      <div className="form-row"><label htmlFor="policy">Khi trùng mã sinh viên trong CSDL</label><select id="policy" className="field" value={policy} onChange={(e) => { setPolicy(e.target.value as "skip" | "update"); setPreview(null); }}><option value="skip">Bỏ qua (không ghi đè)</option><option value="update">Cập nhật bản ghi cũ</option></select></div>
      <div className="check-row"><label><input type="checkbox" checked={allowDup} onChange={(e) => { setAllowDup(e.target.checked); setPreview(null); }}/> Vẫn nhập bản ghi thiếu mã sinh viên nhưng trùng họ tên</label></div>
      <button className="btn btn-primary" disabled={busy || !mapping.fullName} onClick={() => wrap(async () => setPreview(await call("preview")))}>Xem trước và kiểm tra</button></div></section>}
    {preview && <section className="card"><div className="card-head"><h2>3. Kết quả kiểm tra</h2></div><div className="card-body stack">
      <p>{preview.summary.total} dòng · <span className="badge green">{preview.summary.new} mới</span> <span className="badge">{preview.summary.update} cập nhật</span> <span className="badge amber">{preview.summary.skip} bỏ qua</span> <span className="badge red">{preview.summary.error} lỗi</span></p>
      <div className="table-wrap"><table><thead><tr><th>Dòng</th><th>Họ tên</th><th>Mã SV</th><th>Trạng thái</th><th>Ghi chú</th></tr></thead><tbody>{preview.results.slice(0, 200).map((r) => <tr key={r.row}><td>{r.row}</td><td>{r.data?.fullName ?? "—"}</td><td>{r.data?.studentCode ?? "—"}</td><td>{r.status}</td><td>{r.messages.join(" ")}</td></tr>)}</tbody></table></div>
      {preview.summary.error > 0 ? <div className="error">Sửa các dòng lỗi trong tệp rồi tải lại trước khi nhập.</div>
        : <button className="btn btn-primary" disabled={busy || preview.summary.new + preview.summary.update === 0} onClick={() => { if (window.confirm(`Nhập ${preview.summary.new} mới, cập nhật ${preview.summary.update}?`)) wrap(async () => { const r = await call("commit"); setDone(`Đã nhập xong: ${r.summary.new} mới, ${r.summary.update} cập nhật, ${r.summary.skip} bỏ qua.`); setPreview(null); router.refresh(); }); }}>Xác nhận nhập</button>}</div></section>}
    {error && <div className="error" role="alert">{error}</div>}
    {done && <div className="success" role="status">{done}</div>}
  </div>;
}
