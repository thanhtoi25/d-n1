Bạn là Senior Full-stack Developer kiêm UI/UX Engineer. Hãy xây dựng website hoàn chỉnh cho lớp **DA26TTNT**, dựa trên ảnh UI hoặc thiết kế Figma tôi cung cấp.

Mục tiêu: chuyển thiết kế tham chiếu thành website hoạt động thực tế, có front-end, backend, cơ sở dữ liệu, đăng nhập, phân quyền và trang quản trị. Các thao tác phải lưu dữ liệu thật và tiếp tục hoạt động sau khi tải lại trang.

## 1. Đầu vào

- Tên website: **DA26TTNT — Cổng thông tin lớp**.
- Thiết kế tham chiếu: [ẢNH UI ĐÍNH KÈM HOẶC LINK FIGMA].
- Danh sách thành viên: [FILE EXCEL/CSV ĐÍNH KÈM].
- Thông tin cố vấn học tập: [ĐIỀN NẾU CÓ].
- Danh sách ban cán sự và chức vụ: [ĐIỀN NẾU CÓ].
- Ngôn ngữ: tiếng Việt.
- Múi giờ hiển thị: Asia/Ho_Chi_Minh.

Không suy đoán trường, ngành học hoặc thông tin cá nhân từ tên lớp. Không tự tạo tên thành viên, cố vấn học tập hay chức vụ.

Nếu thiếu dữ liệu, vẫn triển khai website với trạng thái “Chưa cập nhật” và chức năng nhập dữ liệu.

## 2. Phân tích thiết kế trước khi triển khai

Trước tiên, đọc các ảnh UI hoặc truy cập Figma bằng công cụ có sẵn, sau đó xác định:

- Các trang, bố cục và cấu trúc điều hướng.
- Màu sắc, font chữ, kích thước chữ.
- Khoảng cách, chiều rộng nội dung, bo góc, viền và bóng đổ.
- Component dùng chung.
- Icon, ảnh và tài nguyên cần sử dụng.
- Trạng thái tương tác thể hiện trong thiết kế.

Ưu tiên giữ đúng thiết kế tham chiếu. Không tự thay đổi phong cách hoặc biến thiết kế thành dashboard mẫu phổ thông.

Nếu có nhiều ảnh, xác định ảnh nào thuộc trang nào và dùng chung một hệ thống thiết kế. Nếu thiết kế chỉ có desktop, xây dựng phiên bản mobile phù hợp với cùng phong cách.

Nếu không thể đọc ảnh hoặc truy cập Figma, nói rõ tài nguyên nào bị thiếu; không tuyên bố đã xem thiết kế. Tiếp tục những phần độc lập và chỉ yêu cầu bổ sung tài nguyên thực sự cần thiết.

Các màn hình chưa có trong thiết kế phải được bổ sung nhất quán với màn hình đã có.

## 3. Công nghệ và cấu trúc

Nếu dự án hiện tại đã có công nghệ, hãy kiểm tra và tiếp tục sử dụng cấu trúc đó khi phù hợp.

Nếu tạo dự án mới, sử dụng:

- Next.js với App Router và TypeScript.
- Tailwind CSS.
- PostgreSQL và Prisma.
- Thư viện xác thực phù hợp với môi trường triển khai.
- Zod để kiểm tra dữ liệu.
- Lưu file vào object storage; môi trường local có thể dùng thư mục riêng thông qua storage adapter.

Chọn các phiên bản tương thích, tạo lockfile và không trộn API thuộc các phiên bản khác nhau.

Tổ chức rõ UI, nghiệp vụ, truy cập dữ liệu, xác thực và xử lý file. Không đặt bí mật hoặc thông tin kết nối cơ sở dữ liệu trong mã front-end.

## 4. Các trang người dùng

### Trang chủ

- Giới thiệu lớp DA26TTNT.
- Thông báo quan trọng được ghim.
- Thông báo mới nhất.
- Giới thiệu cố vấn học tập và ban cán sự.
- Lối tắt đến danh sách thành viên và thông báo.
- Số liệu lấy từ cơ sở dữ liệu thật.
- Trạng thái phù hợp khi chưa có dữ liệu.

### Trang thành viên

- Hiển thị dạng bảng và dạng thẻ.
- Tìm kiếm theo họ tên hoặc mã sinh viên, hỗ trợ tìm không dấu.
- Lọc theo chức vụ.
- Phân trang.
- Xem hồ sơ chi tiết.
- Avatar chữ cái đầu nếu chưa có ảnh.

Giữ nguyên họ tên và dấu tiếng Việt từ file. Mã sinh viên lưu dạng chuỗi để giữ số 0 ở đầu.

Chỉ hiển thị trường dữ liệu được phép công bố. Email, số điện thoại và thông tin riêng tư phải được kiểm soát ở backend, không chỉ ẩn bằng CSS.

### Trang cố vấn học tập

- Ảnh, họ tên, học vị/chức danh và đơn vị công tác.
- Giới thiệu vai trò hỗ trợ lớp.
- Kênh liên hệ được phép công bố.
- Lịch tư vấn nếu có.
- Hiển thị “Chưa cập nhật” cho thông tin còn thiếu.

### Trang ban cán sự

- Danh sách nhân sự theo chức vụ đã xác nhận.
- Họ tên, ảnh, nhiệm vụ và kênh liên hệ.
- Liên kết trực tiếp đến hồ sơ thành viên để tránh nhập thông tin lặp.
- Không tự gán chức vụ khi nhập danh sách lớp.

### Trang thông báo

- Danh sách, tìm kiếm, lọc theo loại và phân trang.
- Nhãn quan trọng, đã ghim và mới.
- Trang chi tiết với nội dung, tác giả, thời gian đăng, thời gian cập nhật.
- File đính kèm và hạn thực hiện nếu có.
- Xác nhận đã đọc, lưu theo tài khoản.
- Thông báo mới dựa trên thời điểm người dùng xem hoặc trạng thái đã đọc, không gắn nhãn tùy ý.

## 5. Đăng nhập và phân quyền

Triển khai ba vai trò:

**Thành viên**
- Xem nội dung nội bộ theo quyền.
- Xác nhận đã đọc thông báo.
- Cập nhật những trường được cho phép trong hồ sơ của mình.

**Ban cán sự**
- Có quyền của thành viên.
- Tạo và sửa bản nháp của mình.
- Đăng, ghim hoặc lưu trữ thông báo theo quyền quản trị viên cấp.
- Xem thống kê đã đọc khi được cho phép.

**Quản trị viên**
- Quản lý thành viên, tài khoản và chức vụ.
- Quản lý cố vấn học tập.
- Quản lý toàn bộ thông báo.
- Nhập danh sách lớp và cấu hình quyền.

Không cho người dùng tự chọn quyền khi đăng ký. Không tự tạo tài khoản hoặc mật khẩu chung cho toàn bộ thành viên khi nhập file.

Cung cấp cơ chế mời hoặc kích hoạt tài khoản. Thiết lập quản trị viên đầu tiên bằng quy trình an toàn, không hardcode mật khẩu.

Mặc định, danh sách thành viên và nội dung nội bộ yêu cầu đăng nhập. Chỉ công khai nội dung được quản trị viên đánh dấu cho phép.

Kiểm tra quyền tại mọi API và thao tác backend, kể cả quyền truy cập từng bản ghi.

## 6. Trang quản trị

Xây dựng các màn hình:

- Tổng quan.
- Quản lý thành viên.
- Nhập danh sách lớp.
- Quản lý ban cán sự.
- Quản lý cố vấn học tập.
- Quản lý thông báo.
- Quản lý tài khoản và quyền.

Trình soạn thông báo hỗ trợ tiêu đề, tóm tắt, nội dung, loại thông báo, mức độ quan trọng, file đính kèm và hạn thực hiện.

Thông báo có trạng thái bản nháp, đã đăng và đã lưu trữ. Bản nháp chỉ hiển thị với người có quyền; chỉ thông báo đã đăng mới xuất hiện trong danh sách người đọc.

Có xác nhận trước thao tác xóa và thông báo kết quả rõ ràng.

## 7. Nhập danh sách từ Excel/CSV

Triển khai luồng:

1. Tải file lên.
2. Chọn sheet nếu cần.
3. Ghép cột với trường dữ liệu.
4. Xem trước.
5. Kiểm tra lỗi.
6. Chọn chính sách xử lý trùng.
7. Xác nhận nhập.
8. Hiển thị kết quả và báo cáo lỗi.

Yêu cầu:

- Hỗ trợ tiếng Việt.
- Bỏ qua dòng trống.
- Kiểm tra họ tên bắt buộc.
- Phát hiện mã sinh viên trùng trong file và trong cơ sở dữ liệu.
- Không dùng họ tên làm khóa định danh duy nhất vì có thể trùng tên.
- Khi thiếu mã sinh viên, đánh dấu bản ghi có khả năng trùng để người quản lý xem lại.
- Không tự ghi đè dữ liệu.
- Dùng transaction để tránh nhập dở dang.
- Dữ liệu xem trước và dữ liệu nhập cuối cùng phải được kiểm tra tại server.

Nếu file chứa tên minh họa, không coi đó là danh sách lớp thật.

## 8. Cơ sở dữ liệu

Thiết kế tối thiểu các bảng:

- User: tài khoản, trạng thái và vai trò.
- Member: hồ sơ thành viên, liên kết tài khoản nếu có.
- ClassPosition: chức vụ, thành viên phụ trách và nhiệm vụ.
- Advisor: thông tin cố vấn học tập.
- Announcement: nội dung, tác giả, trạng thái, mức độ quan trọng và thời gian.
- Attachment: metadata và vị trí lưu file.
- AnnouncementRead: người đọc và thời điểm đọc.
- ImportJob: kết quả nhập dữ liệu.
- AuditLog: những thao tác quản trị quan trọng.

Thiết lập quan hệ, khóa ngoại, chỉ mục và ràng buộc duy nhất phù hợp. Một thành viên có thể kiêm nhiều chức vụ. Thời gian lưu nhất quán và chuyển múi giờ khi hiển thị.

Tạo migration để có thể dựng cơ sở dữ liệu từ đầu.

## 9. Bảo mật và độ tin cậy

- Kiểm tra dữ liệu tại server.
- Nếu dùng mật khẩu, sử dụng thư viện băm mật khẩu phù hợp.
- Quản lý phiên đăng nhập bằng cookie an toàn.
- Giới hạn tần suất đăng nhập và các endpoint nhạy cảm.
- Xử lý CSRF theo cơ chế xác thực sử dụng.
- Làm sạch nội dung rich text để phòng XSS.
- Kiểm tra kích thước và định dạng file tải lên.
- File nội bộ yêu cầu kiểm tra quyền trước khi tải xuống.
- Không lưu file tải lên vào vị trí có thể thực thi.
- Không ghi mật khẩu, token hoặc dữ liệu cá nhân không cần thiết vào log.
- Thông báo lỗi cho người dùng dễ hiểu, không lộ stack trace hay bí mật.

Không xem việc ẩn nút quản trị là cơ chế phân quyền.

## 10. Chất lượng UI

- Bám sát ảnh/Figma về bố cục, tỷ lệ và phong cách.
- Responsive ở mobile, tablet và desktop.
- Không có tràn ngang ngoài vùng bảng được chủ ý cho phép cuộn.
- Có loading, empty state, error state và phản hồi sau thao tác.
- Form có nhãn và lỗi tại từng trường.
- Hỗ trợ bàn phím, focus rõ ràng và quản lý focus cho modal.
- Đảm bảo độ tương phản và tôn trọng thiết lập giảm chuyển động.
- Tất cả nút và liên kết đều có hành vi hợp lý.
- Không có nút giả, số liệu giả hoặc trạng thái thành công khi backend chưa lưu được dữ liệu.

## 11. Kiểm thử và đối chiếu

Thực hiện các kiểm tra quan trọng:

- Đăng nhập và đăng xuất.
- Người không đủ quyền không thể gọi API quản trị.
- Thành viên không thể sửa hồ sơ người khác.
- Nhập file hợp lệ, file lỗi và file trùng.
- Bản nháp không xuất hiện cho người đọc.
- Tạo, sửa, đăng và ghim thông báo.
- Xác nhận đã đọc được lưu sau khi tải lại trang.
- File nội bộ không thể tải khi chưa được cấp quyền.
- Các trang chính hoạt động trên desktop và mobile.

Chạy lint, kiểm tra TypeScript, build và kiểm thử phù hợp. Sửa lỗi phát hiện được.

Chụp màn hình các trang chính và so sánh với thiết kế tham chiếu. Điều chỉnh sai lệch về bố cục, font, khoảng cách và màu sắc trước khi bàn giao.

Chỉ báo cáo kiểm tra đã thực sự chạy; ghi rõ kiểm tra bị chặn và nguyên nhân.

## 12. Bàn giao

Cung cấp:

- Mã nguồn hoàn chỉnh.
- Migration cơ sở dữ liệu.
- File `.env.example` không chứa bí mật.
- README hướng dẫn cài đặt, cấu hình, chạy và triển khai.
- Hướng dẫn tạo quản trị viên đầu tiên.
- Hướng dẫn nhập danh sách lớp.
- Mô tả phân quyền.
- Kết quả kiểm thử.
- Những thông tin hoặc dịch vụ còn cần cấu hình.

Nếu chưa có email hoặc object storage, xây dựng adapter và hướng dẫn cấu hình; không hiển thị như thể email đã được gửi hoặc file đã lưu khi dịch vụ chưa hoạt động.

Hãy thực hiện công việc đến khi có website chạy được trong môi trường hiện tại. Bắt đầu bằng kiểm tra tài nguyên đầu vào và cấu trúc dự án, sau đó triển khai, kiểm thử và bàn giao. Chỉ hỏi khi có thiếu sót thực sự chặn công việc; các lựa chọn kỹ thuật thông thường hãy tự quyết định và ghi lại ngắn gọn.