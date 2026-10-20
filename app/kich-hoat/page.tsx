import { ActivateForm } from "./activate-form";
import { BrandLogo } from "@/components/brand-logo";

export default async function ActivatePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <main className="login-page"><section className="login-art"><div><div className="brand"><BrandLogo/><div><strong>DA26TTNT</strong><small>CỔNG THÔNG TIN LỚP</small></div></div><h1>Chào mừng bạn đến với lớp.</h1><p>Đặt mật khẩu để hoàn tất kích hoạt tài khoản được mời.</p></div></section>
    <section className="login-panel">{token && /^[0-9a-f]{64}$/.test(token) ? <ActivateForm token={token}/> : <div className="login-form"><h2>Liên kết không hợp lệ</h2><p>Hãy nhờ quản trị viên gửi lại lời mời.</p></div>}</section></main>;
}
