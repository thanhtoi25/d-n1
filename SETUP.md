# DA26TTNT — Cổng thông tin lớp

## Yêu cầu

- Node.js 20 trở lên và npm 10 trở lên
- PostgreSQL 15 trở lên

## Cài đặt

1. Chạy `npm install`.
2. Sao chép `.env.example` thành `.env` và cập nhật `DATABASE_URL`.
3. Chạy `npm run db:generate`.
4. Chạy `npx prisma migrate deploy` (hoặc `npm run db:migrate` khi phát triển) để áp dụng toàn bộ migration.
5. Tạo quản trị viên đầu tiên theo hướng dẫn bên dưới.
6. Chạy `npm run dev` và mở `http://localhost:3000`.

## Tạo quản trị viên đầu tiên

Điền `BOOTSTRAP_ADMIN_EMAIL` và `BOOTSTRAP_ADMIN_PASSWORD` trong `.env`. Mật khẩu phải có ít nhất 12 ký tự. Chạy `npm run db:seed`, sau đó xóa hai giá trị này khỏi môi trường nếu không còn cần thiết. Script không chứa mật khẩu mặc định và không tự tạo tài khoản hàng loạt.

## Phân quyền

- `MEMBER`: xem nội dung được cấp quyền, đánh dấu đã đọc và sửa phần hồ sơ được cho phép.
- `CLASS_OFFICER`: gồm quyền thành viên và quản lý thông báo theo phạm vi được cấp.
- `ADMIN`: quản lý thành viên, cố vấn, tài khoản, vai trò, nhập dữ liệu và toàn bộ thông báo.

Mọi endpoint thay đổi dữ liệu phải kiểm tra phiên và quyền ở phía máy chủ. Danh sách thành viên và nội dung nội bộ mặc định không công khai.

## Nhập danh sách

Từ **Quản trị → Nhập danh sách lớp**, chọn Excel/CSV, ghép cột, kiểm tra bản xem trước, chọn chính sách xử lý trùng rồi xác nhận. Mã sinh viên được lưu dạng chuỗi. Hệ thống không dùng họ tên làm khóa duy nhất và không tự ghi đè bản ghi trùng.

## Kiểm tra

Chạy `npm run lint`, `npm run typecheck` và `npm run build` trước khi triển khai.

## Dịch vụ cần cấu hình

- PostgreSQL qua `DATABASE_URL`.
- Email: đặt `MAIL_WEBHOOK_URL` (endpoint nhận JSON `{to, subject, text}`, tùy chọn `MAIL_WEBHOOK_TOKEN`). Chưa cấu hình thì hệ thống báo rõ "chưa gửi" và hiện liên kết kích hoạt cho quản trị viên chuyển thủ công.
- File đính kèm: lưu local tại `STORAGE_DIR` (mặc định `storage/uploads`, ngoài thư mục public). Production nên thay adapter trong `lib/storage.ts` bằng object storage.
- Rate limit đang lưu trong bộ nhớ (một instance); nhiều instance cần Redis.

## API chính

`/api/members`, `/api/announcements` (+ `/[id]`, `/[id]/read`, `/[id]/attachments`), `/api/attachments/[id]`, `/api/import`, `/api/accounts`, `/api/advisor`, `/api/positions`, `/api/auth/logout`. Mọi route dùng `route(minRole, handler)` trong `lib/api.ts` để kiểm tra phiên, vai trò và origin.

## Mời và kích hoạt tài khoản

Quản trị → Tài khoản & quyền → tạo lời mời; người được mời mở `/kich-hoat?token=...` để đặt mật khẩu (tối thiểu 10 ký tự, liên kết hết hạn sau 7 ngày).
