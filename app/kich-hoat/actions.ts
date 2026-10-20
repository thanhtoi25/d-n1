"use server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { ZodError } from "zod";
import { HttpError } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { activate, activateInput } from "@/lib/services/accounts";

export async function activateAccount(_: unknown, formData: FormData) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  if (!(await rateLimit(`activate:${ip}`, 10, 15 * 60_000)).ok) return { error: "Quá nhiều lần thử. Vui lòng thử lại sau." };
  if (formData.get("password") !== formData.get("confirm")) return { error: "Mật khẩu nhập lại không khớp." };
  try {
    await activate(activateInput.parse({ token: formData.get("token"), password: formData.get("password") }));
  } catch (e) {
    if (e instanceof ZodError) return { error: e.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
    if (e instanceof HttpError) return { error: e.message };
    return { error: "Không thể kích hoạt. Vui lòng thử lại." };
  }
  redirect("/dang-nhap");
}
