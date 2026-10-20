import { LoginForm } from "./login-form";
import { BrandLogo } from "@/components/brand-logo";
export default function LoginPage(){return <main className="login-page"><section className="login-art"><div><div className="brand"><BrandLogo/><div><strong>DA26TTNT</strong><small>CỔNG THÔNG TIN LỚP</small></div></div><h1>Kết nối, sẻ chia và cùng nhau trưởng thành.</h1><p>Một không gian chung để theo dõi thông báo, quản lý thông tin và đồng hành cùng tập thể lớp.</p></div></section><section className="login-panel"><LoginForm/></section></main>}
