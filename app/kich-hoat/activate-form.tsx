"use client";
import { useActionState } from "react";
import { activateAccount } from "./actions";

export function ActivateForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(activateAccount, null);
  return <form action={action} className="login-form"><input type="hidden" name="token" value={token}/>
    <div className="eyebrow">KÍCH HOẠT TÀI KHOẢN</div><h2>Đặt mật khẩu</h2><p>Mật khẩu tối thiểu 10 ký tự.</p>
    {state?.error && <div className="error" role="alert">{state.error}</div>}
    <label htmlFor="password">Mật khẩu</label><input className="field" id="password" name="password" type="password" autoComplete="new-password" minLength={10} required/>
    <label htmlFor="confirm">Nhập lại mật khẩu</label><input className="field" id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={10} required/>
    <button className="btn btn-primary" disabled={pending}>{pending ? "Đang xử lý..." : "Kích hoạt"}</button></form>;
}
