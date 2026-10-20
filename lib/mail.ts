/**
 * Adapter email. Chưa cấu hình dịch vụ gửi thật thì KHÔNG giả vờ đã gửi:
 * trả về { sent: false } để giao diện hiển thị liên kết cho quản trị viên chuyển thủ công.
 * Cấu hình MAIL_WEBHOOK_URL (một endpoint nhận JSON {to, subject, text}) để gửi thật.
 */
export type MailResult = { sent: boolean; reason?: string };

export async function sendMail(to: string, subject: string, text: string): Promise<MailResult> {
  const url = process.env.MAIL_WEBHOOK_URL;
  if (!url) return { sent: false, reason: "Chưa cấu hình dịch vụ email (MAIL_WEBHOOK_URL)." };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...(process.env.MAIL_WEBHOOK_TOKEN ? { authorization: `Bearer ${process.env.MAIL_WEBHOOK_TOKEN}` } : {}) },
      body: JSON.stringify({ to, subject, text }),
    });
    return res.ok ? { sent: true } : { sent: false, reason: `Dịch vụ email trả về lỗi ${res.status}.` };
  } catch {
    return { sent: false, reason: "Không kết nối được dịch vụ email." };
  }
}
