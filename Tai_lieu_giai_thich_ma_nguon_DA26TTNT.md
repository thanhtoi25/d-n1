# CẨM NANG BACKEND & KIẾN TRÚC TOÀN DIỆN DỰ ÁN CỔNG THÔNG TIN LỚP DA26TTNT
> **Tác giả:** Senior Backend Engineer  
> **Đối tượng:** Tân sinh viên ngành Công nghệ Thông tin / Kỹ thuật Phần mềm mới bước chân vào lập trình Web Full-Stack.  
> **Mục tiêu:** Giải thích từ gốc rễ tư duy kiến trúc, cách hoạt động thực tế của từng dòng code, chu trình dữ liệu từ Database đến Giao diện và các nguyên tắc bảo mật công nghiệp chuẩn mực nhất bằng văn phong trực quan, dễ hiểu.

---

## MỤC LỤC
1. [Lời nói đầu & Tư duy Backend căn bản](#1-lời-nói-đầu--tư-duy-backend-căn-bản)
2. [Bức tranh tổng thể: Một Web App thực sự chạy như thế nào?](#2-bức-tranh-tổng-thể-một-web-app-thực-sự-chạy-như-thế-nào)
3. [Cơ sở dữ liệu (Database) & Prisma ORM: Trái tim lưu trữ](#3-cơ-sở-dữ-liệu-database--prisma-orm-trái-tim-lưu-trữ)
4. [Tầng Xác thực & Phân quyền (Authentication & Authorization)](#4-tầng-xác-thực--phân-quyền-authentication--authorization)
5. [Tầng Dịch vụ (Service Layer): Nơi xử lý nghiệp vụ thông minh](#5-tầng-dịch-vụ-service-layer-nơi-xử-lý-nghiệp-vụ-thông-minh)
6. [Tầng API (Route Handlers): Cổng giao tiếp an toàn](#6-tầng-api-route-handlers-cổng-giao-tiếp-an-toàn)
7. [Middleware: Vệ sĩ canh cổng tự động](#7-middleware-vệ-sĩ-canh-cổng-tự-động)
8. [Tầng Giao diện (Next.js Server Components): Tối ưu tốc độ vượt trội](#8-tầng-giao-diện-nextjs-server-components-tối-ưu-tốc-độ-vượt-trội)
9. [Hệ thống Kiểm thử Tự động (Automated Testing với Vitest)](#9-hệ-thống-kiểm-thử-tự-động-automated-testing-với-vitest)
10. [Lời khuyên của một Senior dành cho Tân Sinh Viên](#10-lời-khuyên-của-một-senior-dành-cho-tân-sinh-viên)

---

## 1. Lời nói đầu & Tư duy Backend căn bản

Chào bạn – một tân sinh viên đầy nhiệt huyết vừa bước chân vào thế giới lập trình!

Khi mới bắt đầu học làm web, nhiều bạn thường bị cuốn hút bởi những nút bấm đầy màu sắc, hoạt ảnh lung linh (Frontend). Điều đó rất tuyệt, nhưng bạn có bao giờ tự hỏi:
- *Khi bấm nút "Đăng nhập", tài khoản và mật khẩu bay đi đâu?*
- *Làm sao máy chủ biết bạn là Lớp trưởng hay Thành viên bình thường để cho phép hoặc chặn quyền xóa dữ liệu?*
- *Nếu mất điện máy chủ hoặc người dùng F5 tải lại trang, vì sao dữ liệu danh sách 29 bạn sinh viên vẫn còn nguyên vẹn?*

Đó chính là sứ mệnh của **Backend** (Hậu phương kỹ thuật). Backend là toàn bộ bộ não, hệ thần kinh và kho lưu trữ của ứng dụng:
- Đảm bảo **tính toàn vẹn dữ liệu** (không ai có thể hack để biến điểm số hay thông tin thành sai lệch).
- Đảm bảo **an toàn bảo mật** (mật khẩu không bao giờ được lộ ra dưới dạng chữ thường).
- Đảm bảo **hiệu năng & tính sẵn sàng** (hệ thống phục vụ hàng trăm người cùng lúc mà không bị treo).

Dự án **Cổng thông tin lớp DA26TTNT** bạn đang cầm trên tay là một ứng dụng chuẩn công nghiệp (Production-ready), kết hợp hài hòa giữa **Next.js 15 (App Router)**, **TypeScript**, **Prisma ORM**, và **PostgreSQL**. Bài viết này sẽ "mổ xẻ" từng bộ phận để bạn hiểu cặn kẽ bản chất mà không hề cảm thấy nhàm chán!

---

## 2. Bức tranh tổng thể: Một Web App thực sự chạy như thế nào?

Hãy tưởng tượng hệ thống web như một **Nhà hàng tiêu chuẩn 5 sao**:

```
[Khách hàng] (Trình duyệt của bạn)
     │
     ▼ Gửi yêu cầu (Request: "Cho tôi xem danh sách thành viên")
[Người gác cửa] (Middleware)  ──▶ Kiểm tra thẻ khách / cookie phiên đăng nhập
     │
     ▼ Chuyển vào quầy phục vụ
[Bồi bàn / Tiếp tân] (Route Handler / Server Component) ──▶ Nhận đơn, kiểm tra tính hợp lệ
     │
     ▼ Đưa vào khu vực bếp
[Bếp trưởng chuyên nghiệp] (Service Layer: lib/services/*) ──▶ Nấu món (Xử lý nghiệp vụ, tính toán)
     │
     ▼ Lấy nguyên liệu từ kho lạnh
[Thủ kho thông minh] (Prisma ORM: lib/prisma.ts) ──▶ Truy vấn kho nguyên liệu
     │
     ▼
[Kho dự trữ trung tâm] (PostgreSQL Database) ──▶ Lưu trữ dữ liệu vĩnh viễn trên ổ cứng
```

### Chu trình dữ liệu 4 bước khép kín:
1. **Client Request:** Bạn gõ `http://localhost:3000/thanh-vien` vào trình duyệt. Trình duyệt gửi một HTTP GET Request kèm cookie phiên đăng nhập.
2. **Middleware Interception:** Vệ sĩ `middleware.ts` kiểm tra: *"Bạn đã đăng nhập chưa? Trang này có yêu cầu đăng nhập không?"* Nếu chưa, bạn bị chuyển hướng ngay sang trang `/dang-nhap`.
3. **Server Component & Service Execution:** Trang `app/thanh-vien/page.tsx` gọi hàm `listMembers()` trong `lib/services/members.ts`. Hàm này yêu cầu Prisma ORM lọc dữ liệu sinh viên trong Database PostgreSQL.
4. **HTML Rendering & Response:** Server kết hợp dữ liệu lấy được với giao diện, "nướng" thành mã HTML hoàn chỉnh và gửi ngược về trình duyệt để hiển thị trước mắt bạn trong tích tắc.

---

## 3. Cơ sở dữ liệu (Database) & Prisma ORM: Trái tim lưu trữ

### 3.1. Database là gì và tại sao không dùng file JSON/Excel để lưu?
Nếu bạn lưu dữ liệu vào một file Excel hay JSON trên máy:
- Khi 2 người cùng bấm sửa thông tin tại cùng một tích tắc, file sẽ bị xung đột hoặc ghi đè mất dữ liệu.
- Khi dữ liệu lên tới hàng triệu dòng, tìm kiếm trong file text sẽ chậm như rùa bò.
- Không có cơ chế ràng buộc (ví dụ: cấm 2 sinh viên trùng nhau Mã số sinh viên).

Vì vậy, chúng ta dùng **PostgreSQL** — hệ cơ sở dữ liệu quan hệ mạnh mẽ hàng đầu thế giới.

### 3.2. Prisma ORM: Cầu nối thần kỳ
Thay vì phải viết những câu lệnh SQL dài dòng, dễ nhầm lẫn như:
```sql
SELECT * FROM "Member" WHERE "studentCode" = '110526001';
```
Prisma cho phép lập trình viên Backend viết code TypeScript với gợi ý lệnh (IntelliSense) chuẩn xác 100%:
```typescript
const student = await prisma.member.findUnique({
  where: { studentCode: '110526001' }
});
```

### 3.3. Giải thích cấu trúc bảng (`prisma/schema.prisma`)

Mở file `prisma/schema.prisma`, bạn sẽ thấy các bảng (Tables / Models) cốt lõi:

#### 1. Model `User` (Tài khoản người dùng):
```prisma
model User {
  id              String        @id @default(cuid())
  email           String        @unique
  passwordHash    String?
  role            Role          @default(MEMBER)
  status          AccountStatus @default(INVITED)
  member          Member?
  sessions        Session[]
  ...
}
```
- `id`: Mã định danh duy nhất (dùng thuật toán `cuid()` để tạo chuỗi ngẫu nhiên không trùng lặp, bảo mật hơn số tăng dần 1, 2, 3 vì hacker không đoán được id của người khác).
- `email`: Tên đăng nhập, có thuộc tính `@unique` (không bao giờ cho phép 2 tài khoản trùng email).
- `passwordHash`: **Mật khẩu đã băm (Hash)**. Không bao giờ lưu mật khẩu thô như `123456`! Hệ thống dùng thuật toán `bcrypt` để biến đổi mật khẩu thành một chuỗi ký tự vô nghĩa không thể giải mã ngược.
- `role`: Vai trò người dùng (`MEMBER`: Thành viên, `CLASS_OFFICER`: Ban cán sự, `ADMIN`: Quản trị viên).

#### 2. Model `Member` (Hồ sơ sinh viên) & `ClassPosition` (Chức vụ BCS):
```prisma
model Member {
  id          String   @id @default(cuid())
  studentCode String?  @unique
  fullName    String
  searchName  String
  positions   ClassPosition[]
  ...
}
```
- `searchName`: Tên sinh viên đã được loại bỏ dấu tiếng Việt (ví dụ: "Thạch Ngọc Tiến" thành "thach ngoc tien"). Khi người dùng gõ tìm kiếm không dấu "tien", hệ thống tìm kiếm siêu nhanh trên cột này mà không cần hàm xử lý phức tạp.
- Quan hệ `1 - N` (Một - Nhiều): Một thành viên (`Member`) có thể giữ nhiều chức vụ (`positions`), ví dụ vừa là "Lớp trưởng", vừa phụ trách "Ban thi đua".

#### 3. Model `Announcement` (Thông báo) & `AnnouncementRead` (Xác nhận đã đọc):
- Khi Ban cán sự đăng bài, thông báo có các thuộc tính: `pinned` (ghim), `importance` (`NORMAL` / `IMPORTANT` / `URGENT`), `deadline` (hạn chót).
- Bảng `AnnouncementRead`: Lưu vết sinh viên nào đã bấm nút *"Xác nhận đã đọc"*. Nhờ đó, hệ thống thống kê chính xác: *"Đã có 28/29 sinh viên đọc thông báo này"*.

---

## 4. Tầng Xác thực & Phân quyền (Authentication & Authorization)

Đây là ranh giới sống còn của một hệ thống Backend:
- **Authentication (Xác thực):** Bạn là ai? (Hỏi thẻ căn cước / Email & Mật khẩu).
- **Authorization (Phân quyền):** Bạn có quyền làm gì? (Sinh viên thường không được xóa danh sách lớp, chỉ Ban cán sự mới được đăng thông báo).

### 4.1. Cơ chế Cookie và Phiên làm việc (Session) trong `lib/auth.ts`
HTTP vốn dĩ là giao thức "vô trạng thái" (Stateless) — máy chủ không tự nhớ bạn là ai giữa 2 lần click chuột. Do đó, hệ thống sử dụng **Session Cookie**:

1. Khi bạn nhập đúng mật khẩu, server sinh ra một chuỗi ngẫu nhiên cực dài gọi là `sessionToken`.
2. Server băm token này lưu vào bảng `Session` trong Database:
   ```typescript
   await prisma.session.create({
     data: {
       tokenHash: hashToken(token),
       userId: user.id,
       expiresAt: new Date(Date.now() + SESSION_TTL_MS),
     }
   });
   ```
3. Server gửi token đó về trình duyệt và lưu vào Cookie với cờ `HttpOnly`:
   - `HttpOnly`: Ngăn chặn mã độc Javascript (XSS) trên trình duyệt đọc trộm cookie này.
   - `SameSite=Lax`: Chống tấn công giả mạo yêu cầu (CSRF).
4. Mỗi lần bạn bấm vào bất kỳ trang nào, cookie này tự động bay kèm theo request. Server chỉ việc kiểm tra token trong database để biết bạn là ai qua hàm:
   ```typescript
   export async function currentUser(): Promise<SessionUser | null>
   ```

### 4.2. Phân cấp quyền hạn hình tháp
Hệ thống sử dụng hàm so khớp thứ bậc vai trò:
```typescript
const rank: Record<Role, number> = {
  MEMBER: 1,        // Thành viên bình thường
  CLASS_OFFICER: 2, // Ban cán sự lớp
  ADMIN: 3          // Quản trị viên tối cao
};

export const hasRole = (userRole: Role, minRole: Role) =>
  rank[userRole] >= rank[minRole];
```
- Nếu một thao tác yêu cầu tối thiểu `CLASS_OFFICER` (cấp 2), chỉ có Ban cán sự (cấp 2) và Admin (cấp 3) mới được phép thực thi. Thành viên cấp 1 sẽ nhận ngay mã lỗi `403 Forbidden` (Bị từ chối truy cập).

---

## 5. Tầng Dịch vụ (Service Layer): Nơi xử lý nghiệp vụ thông minh

Một sai lầm rất phổ biến của các lập trình viên mới vào nghề là: *"Nhồi nhét toàn bộ logic lấy database, tính toán, kiểm tra quyền vào chung một file giao diện hoặc file API"*.

Trong dự án này, toàn bộ "trí tuệ" được tách riêng vào thư mục `lib/services/`:
- `lib/services/members.ts`: Quản lý danh sách sinh viên.
- `lib/services/announcements.ts`: Nghiệp vụ đăng bài, lọc bài ghim, đếm lượt đọc.
- `lib/services/import.ts`: Bộ xử lý nhập danh sách tự động từ file Excel / CSV.

### 5.1. Ví dụ thực chiến: Bộ phân tích Excel/CSV thông minh (`lib/services/import.ts`)
Khi nhập danh sách 29 sinh viên từ một file Excel tải từ cổng đào tạo:
1. **Loại bỏ ký tự lạ (BOM):** File CSV tiếng Việt hay chứa ký tự ẩn đầu file UTF-8 BOM (`\uFEFF`). Nếu không xử lý, cột `"Họ và tên"` sẽ bị nhận nhầm thành `"\uFEFFHọ và tên"`, gây lỗi toàn bộ. Code của hệ thống giải mã sạch sẽ:
   ```typescript
   const text = new TextDecoder("utf-8").decode(buf).replace(/^\uFEFF/, "");
   ```
2. **Bảo tồn số 0 đầu của Mã số sinh viên:** Mã SV như `01234567` thường bị Excel tự biến thành số `1234567` (mất số 0). Hàm import ép kiểu tế bào dạng `raw: true` để giữ nguyên dạng chuỗi văn bản.
3. **Ánh xạ cột linh hoạt (Fuzzy header matching):** Cột trong file Excel có thể viết là `"Họ và tên"`, `"Họ tên"`, hay `"FULL NAME"`. Hàm `matchColumn()` tự động hiểu tất cả các biến thể này để ghép đúng trường vào cơ sở dữ liệu.

---

## 6. Tầng API (Route Handlers): Cổng giao tiếp an toàn

Các file trong `app/api/**/route.ts` đóng vai trò là những điểm tiếp nhận tín hiệu (Endpoints) cho các yêu cầu HTTP từ bên ngoài (Frontend hoặc ứng dụng khác).

### 6.1. Bọc bảo vệ toàn diện với `route()` wrapper (`lib/api.ts`)
Mỗi API trong dự án đều được bọc trong hàm helper `route()`:
```typescript
export const POST = route(async (req, { user }) => {
  // Logic xử lý nghiệp vụ ở đây
});
```
Hàm `route()` này làm những việc kỳ diệu sau:
1. **Tự động bắt lỗi (Error Handling):** Nếu Database bị sập hoặc có lỗi không lường trước, API sẽ không bị "chết đứng" mà trả về mã lỗi HTTP chuẩn mực (`500 Internal Server Error`) kèm thông báo an toàn, không làm lộ mật khẩu cơ sở dữ liệu ra ngoài.
2. **Kiểm tra quyền tự động:** Chỉ cần khai báo `{ auth: "CLASS_OFFICER" }`, hàm sẽ tự động chặn mọi người dùng chưa đăng nhập hoặc không đủ thẩm quyền trước khi họ kịp chạm vào logic bên trong.
3. **Xác thực dữ liệu đầu vào với thư viện Zod:**
   ```typescript
   const data = memberInput.parse(await req.json());
   ```
   Nếu người dùng gửi thiếu họ tên hoặc gửi email sai định dạng (ví dụ `abc@@xyz`), Zod sẽ phát hiện ngay và trả về lỗi `422 Unprocessable Entity` chỉ rõ đích danh trường nào bị sai.

---

## 7. Middleware: Vệ sĩ canh cổng tự động (`middleware.ts`)

File `middleware.ts` nằm ngay ở thư mục gốc của dự án. Đây là trạm kiểm soát chạy trên nền tảng **Edge Runtime** (siêu nhanh):

```typescript
export async function middleware(req: NextRequest) {
  const token = req.cookies.get("da26_session")?.value;
  const isProtected = PROTECTED_PATHS.some((p) => req.nextUrl.pathname.startsWith(p));

  // Nếu người dùng cố vào trang nội bộ (/thanh-vien, /thong-bao, /quan-tri) mà chưa có cookie
  if (isProtected && !token) {
    const loginUrl = new URL("/dang-nhap", req.url);
    loginUrl.searchParams.set("from", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}
```
- Khi một người lạ cố tình truy cập vào trang `http://localhost:3000/quan-tri`, `middleware` lập tức chặn lại và đá văng về `/dang-nhap?from=/quan-tri`.
- Sau khi đăng nhập thành công, hệ thống sẽ tự động đưa người đó quay trở lại đúng trang họ muốn xem ban đầu. Đây là trải nghiệm người dùng (UX) chuẩn mực mà một Senior luôn tính toán trước.

---

## 8. Tầng Giao diện (Next.js Server Components): Tối ưu tốc độ vượt trội

Dự án sử dụng **React Server Components (RSC)** mặc định của Next.js 15:

### Server Component là gì và nó khác gì React truyền thống?
- **React truyền thống (Client-side rendering):** Trình duyệt phải tải cả một đống mã Javascript nặng nề về máy bạn, sau đó máy bạn tự chạy JS rồi mới gọi API lấy dữ liệu. Mạng chậm là màn hình trắng tinh quay tròn cả buổi.
- **Next.js Server Component:** Toàn bộ việc gọi Database, lấy dữ liệu diễn ra ngay trên Server (nơi đặt máy chủ cực khỏe và gần database). Server tạo ra mã HTML hoàn chỉnh và trả về cho bạn. Kết quả là website tải nhanh như chớp, và mã nguồn nhạy cảm (như mật khẩu DB) không bao giờ bị lộ xuống máy người dùng!

Ví dụ trực quan tại trang chủ `app/page.tsx`:
```typescript
// Chạy trực tiếp trên Server - không lo rò rỉ bảo mật!
export default async function HomePage() {
  const user = await currentUser();
  const d = await homeData(user); // Lấy số liệu trực tiếp từ Database
  
  return (
    <AppShell active="/">
       {/* Giao diện HTML được đổ dữ liệu ngay tức thì */}
       <strong>{d.members ?? 29}</strong>
    </AppShell>
  );
}
```

---

## 9. Hệ thống Kiểm thử Tự động (Automated Testing với Vitest)

Một lập trình viên nghiệp dư viết code xong thường dùng chuột tự bấm thử trên web vài cái rồi bảo: *"Xong rồi, chạy ngon!"*. Nhưng khi sửa một tính năng mới, những tính năng cũ có thể bị gãy ngầm mà không ai hay biết.

Một **Senior Backend** luôn xây dựng một dàn "Robot kiểm thử tự động":
Thư mục `tests/` chứa **67 bài kiểm thử tự động**:
1. `tests/unit.test.ts`: Kiểm tra các hàm nhỏ nhặt như bỏ dấu tiếng Việt, định dạng ngày tháng, hash token.
2. `tests/members.test.ts`: Giả lập thêm sinh viên, trùng mã sinh viên có bị chặn không, sinh viên thường có sửa trộm điểm của bạn khác được không.
3. `tests/announcements.test.ts`: Kiểm tra logic bài viết ghim, lưu nháp, xác nhận đọc bài.
4. `tests/api-accounts.test.ts`: Kiểm tra API đăng nhập, kích hoạt tài khoản bằng mã bảo mật.
5. `tests/import.test.ts`: Giả lập nạp file CSV, file lỗi, file dính BOM.

Mỗi lần gõ lệnh `npm test`, 67 bài test chạy vèo qua trong vòng chưa đầy 10 giây. Khi cả 67 bài xanh lét (`67 passed`), chúng ta tự tin 100% rằng hệ thống vận hành hoàn hảo không một tì vết!

---

## 10. Lời khuyên của một Senior dành cho Tân Sinh Viên

Chào mừng bạn đã đi hết chặng đường tìm hiểu kiến trúc của dự án DA26TTNT! Để trở thành một kỹ sư phần mềm xuất sắc trong 4 năm đại học sắp tới, hãy ghi nhớ 4 nguyên tắc vàng sau:

1. **Hiểu bản chất trước khi dùng thư viện:** Đừng vội học framework này nọ nếu chưa nắm chắc Javascript cơ bản, cách hoạt động của HTTP Request/Response, và cách thiết kế cơ sở dữ liệu quan hệ (ERD).
2. **Không bao giờ tin tưởng dữ liệu từ người dùng (Never trust user input):** Mọi dữ liệu gửi lên từ form, dù là số điện thoại hay họ tên, đều phải được kiểm tra (Validate) chặt chẽ bằng Zod ở Backend trước khi lưu vào Database.
3. **Bảo mật ngay từ dòng code đầu tiên (Security by Design):** Không bao giờ lưu mật khẩu thường; luôn dùng Session an toàn; luôn phân quyền nhiều lớp (ở cả Middleware, Route Handler và Service Layer).
4. **Viết code rõ ràng, có trách nhiệm:** Viết code để 6 tháng sau chính bạn đọc lại vẫn hiểu, và đồng đội trong nhóm nhìn vào là có thể phối hợp làm việc ngay.

Chúc bạn có một hành trình học tập đầy đam mê và gặt hái thật nhiều thành tựu rực rỡ với ngành Công nghệ Thông tin! 🚀
