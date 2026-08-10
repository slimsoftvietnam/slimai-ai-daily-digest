# SlimAI - AI Daily Digest

Skill dành cho Codex giúp biến nhiều nguồn tin AI thành một quy trình xuất bản hoàn chỉnh. Người dùng không cần biết lập trình: chỉ cần cho Codex biết muốn theo dõi nguồn nào, kết nối website AIWeb và, nếu cần, kết nối Zalo Bot.

## Skill này làm gì?

Mỗi lần chạy, skill thực hiện lần lượt các công việc sau:

1. **Tổng hợp nguồn tin:** đọc blog chính thức, nghiên cứu chiến lược, case study và nguồn cộng đồng đáng tin cậy.
2. **Lưu cấu hình nguồn trong JSON:** phân loại nguồn thành chính hãng, chiến lược và cộng đồng để có thể bổ sung hoặc loại bỏ dễ dàng.
3. **Lọc và biên tập bản tin:** bỏ bài trùng, bài cũ, nguồn lỗi hoặc nội dung yếu; sau đó viết bản tin tiếng Việt dễ hiểu.
4. **Tạo ảnh bìa:** chuẩn bị ảnh đại diện 16:9 theo phong cách SlimAI, phù hợp để hiển thị trên blog và khi chia sẻ liên kết.
5. **Đăng bài lên AIWeb:** tạo hoặc cập nhật bài blog, tải ảnh lên thư viện và kiểm tra URL công khai cùng ảnh preview.
6. **Gửi vào Zalo group:** gửi bản tóm tắt dễ đọc qua Zalo Bot, kèm đường dẫn đến bài blog đầy đủ.
7. **Chống đăng và gửi trùng:** lưu URL bài nguồn, URL blog và mã tin nhắn đã gửi vào tệp trạng thái.

Thứ tự biên tập mặc định là: **góc nhìn chiến lược → case study đã kiểm chứng → tin chính thức từ hãng**. Với tin sản phẩm, skill ưu tiên blog hoặc newsroom chính thức trước release notes và các nguồn bổ sung khác.

## Bạn cần chuẩn bị gì?

| Nội dung | Bắt buộc | Bạn cần cung cấp |
|---|---:|---|
| Danh sách nguồn tin | Có | Tên hãng, tổ chức, website hoặc chủ đề muốn theo dõi |
| Góc nhìn cần thu thập | Có | Ví dụ: chiến lược, quản trị, marketing, năng suất, nhân sự |
| Website AIWeb | Khi muốn đăng blog | Địa chỉ website và API key AIWeb |
| Zalo Bot | Khi muốn gửi vào group | Endpoint, API key và group đã kết nối với bot |
| Lịch tự động | Không bắt buộc | Giờ chạy và múi giờ, ví dụ `07:00 Asia/Saigon` |

Không đưa API key, mật khẩu, cookie hoặc bot token vào GitHub hay bất kỳ tệp JSON nào của skill.

## Bước 1: Cài skill vào Codex

Cách đơn giản nhất là gửi cho Codex:

```text
Hãy cài skill slimai-ai-daily-digest từ repository:
https://github.com/slimsoftvietnam/slimai-ai-daily-digest
Skill nằm ở thư mục gốc của repository.
```

Sau khi Codex báo cài xong, mở một task mới và kiểm tra bằng câu lệnh:

```text
Dùng $slimai-ai-daily-digest và cho tôi biết skill đã sẵn sàng chưa.
```

Bạn cũng có thể tải file ZIP tại trang [Releases](https://github.com/slimsoftvietnam/slimai-ai-daily-digest/releases/latest), giải nén vào thư mục dưới đây rồi mở lại Codex:

```text
C:\Users\TEN-CUA-BAN\.codex\skills\slimai-ai-daily-digest\
```

Tệp `SKILL.md` phải nằm ngay trong thư mục trên, không nằm trong một lớp thư mục lồng thêm.

## Bước 2: Liệt kê nguồn tin và góc nhìn muốn thu thập

Bạn không cần tự sửa JSON. Hãy mô tả bằng ngôn ngữ thông thường, Codex sẽ kiểm tra URL, phân loại và cập nhật đúng tệp.

Mẫu yêu cầu đầy đủ:

```text
Dùng $slimai-ai-daily-digest và cấu hình nguồn cho tôi.

Nguồn chính hãng cần ưu tiên:
- OpenAI
- Anthropic/Claude
- Google Gemini/DeepMind
- Microsoft Copilot và GitHub Copilot

Nguồn góc nhìn chiến lược:
- McKinsey
- Gartner
- KPMG
- IBM

Chủ đề tôi quan tâm:
- AI ứng dụng cho doanh nghiệp
- Case study có số liệu hoặc kết quả đã kiểm chứng
- Công cụ và dự án mã nguồn mở đáng chú ý

Hãy tìm website chính thức, RSS nếu có, kiểm tra nguồn hoạt động rồi mới thêm.
Không thêm trang tổng hợp, nguồn ẩn danh hoặc nguồn chủ yếu đăng quảng cáo.
```

Skill lưu nguồn ở ba tệp:

| Loại nguồn | Nội dung | Tệp |
|---|---|---|
| Chính hãng | Model, tính năng, API, thay đổi sản phẩm | `references/official-sources.json` |
| Chiến lược | Nghiên cứu, khảo sát, quản trị và xu hướng doanh nghiệp | `references/strategic-sources.json` |
| Cộng đồng | Case study, mã nguồn mở và hướng dẫn thực tế | `references/sources.json` |

Nếu một nguồn không có RSS, skill có thể đọc HTML công khai hoặc tìm kiếm trong đúng tên miền. Mỗi liên kết được chọn phải dẫn thẳng đến bài gốc, không dẫn về trang chủ hoặc trang danh mục chung.

Để thêm một nguồn sau này, chỉ cần gửi:

```text
Hãy thêm [tên nguồn hoặc URL] vào $slimai-ai-daily-digest.
Kiểm tra đây có phải nguồn gốc đáng tin cậy không, tìm RSS nếu có,
chạy thử rồi báo tôi tệp JSON nào đã được cập nhật.
```

## Bước 3: Chạy thử bản tin trước khi kết nối dịch vụ

Nên chạy thử nội dung trong Codex trước:

```text
Dùng $slimai-ai-daily-digest tạo bản tin AI hôm nay bằng tiếng Việt.
Chỉ soạn bản nháp trong task, chưa đăng blog và chưa gửi Zalo.
Viết cho người không chuyên kỹ thuật; giải thích ngắn các thuật ngữ khó.
```

Hãy kiểm tra ba điểm:

- Tin nổi bật có đúng mối quan tâm của bạn không.
- Mỗi tin có URL chính xác đến bài nguồn không.
- Văn phong, độ dài và thứ tự các phần có dễ đọc không.

Nếu chưa phù hợp, hãy nói rõ nguồn nào cần ưu tiên, chủ đề nào cần bỏ hoặc cách trình bày mong muốn. Những thay đổi ổn định có thể được cập nhật vào skill.

## Bước 4: Kết nối website AIWeb qua API

### 4.1. Tạo API key trên AIWeb

1. Mở trang quản trị website AIWeb của bạn, thường là `https://ten-mien-cua-ban/login`.
2. Đăng nhập bằng tài khoản quản trị.
3. Mở **Settings → API Agent**.
4. Tạo API key có quyền đọc/ghi bài blog và tải ảnh.
5. Dùng nút kiểm tra API trong trang quản trị, hoặc yêu cầu Codex kiểm tra `ping/status`.
6. Sao chép API key và chỉ cung cấp trong task riêng tư.

### 4.2. Cho Codex biết thông tin kết nối

Bạn cần hai biến môi trường:

| Biến | Ví dụ |
|---|---|
| `SLIMAI_AIWEB_BASE_URL` | `https://ai.slim.vn` |
| `SLIMAI_AIWEB_API_KEY` | Khóa bắt đầu bằng `aiw_...` |

Mẫu yêu cầu:

```text
Hãy kết nối $slimai-ai-daily-digest với website AIWeb của tôi.
Lưu địa chỉ website vào SLIMAI_AIWEB_BASE_URL và API key tôi cung cấp
vào SLIMAI_AIWEB_API_KEY. Không in lại khóa và không ghi khóa vào repository.
Sau đó chỉ kiểm tra kết nối, chưa đăng bài.
```

Khi kết nối thành công, skill có thể:

- tạo tiêu đề và slug theo từ khóa của tin nổi bật nhất;
- tạo hoặc tải ảnh bìa lên thư viện AIWeb;
- chèn ảnh minh họa từ tư liệu gốc vào đúng mục khi phù hợp;
- đăng hoặc cập nhật bài blog;
- kiểm tra URL công khai, `og:title`, `og:description` và `og:image`.

Ảnh bìa mặc định là JPEG 16:9, ưu tiên kích thước `1200 × 675 px` và dung lượng dưới `500 KB`.

Tài liệu AIWeb dành cho chủ website nằm trong skill `aiweb`; nếu giao diện của bạn khác mô tả trên, hãy yêu cầu Codex dùng `$aiweb` để kiểm tra đúng phiên bản hiện tại.

## Bước 5: Tạo Zalo Bot và kết nối group (không bắt buộc)

Chỉ thực hiện bước này nếu bạn muốn tự động gửi phần tóm tắt sau khi bài blog đã được đăng.

### 5.1. Chuẩn bị phía Zalo

1. Tạo hoặc sử dụng một **Zalo Official Account (OA)** của doanh nghiệp.
2. Nếu tự tích hợp, tạo ứng dụng tại Zalo Developers và cấu hình quyền OA/OpenAPI cần thiết.
3. Nếu dùng nhà cung cấp Zalo Bot, làm theo hướng dẫn của nhà cung cấp để kết nối OA hoặc tài khoản bot với group đích.
4. Thêm bot/tài khoản được dùng để gửi tin vào đúng group và gửi thử một tin thủ công.
5. Lấy **endpoint** và **API key** của dịch vụ Zalo Bot.

Tài liệu chính thức:

- [Zalo Official Account](https://oa.zalo.me/)
- [Tài liệu Zalo Developers](https://developers.zalo.me/docs/)
- [Zalo OA OpenAPI](https://oa.zalo.me/home/function/extension)

Lưu ý: skill không tự tạo OA hoặc tự thêm tài khoản vào group. Skill gửi nội dung qua endpoint Zalo Bot mà bạn đã cấu hình. Việc gửi vào group phải được dịch vụ Zalo Bot của bạn hỗ trợ; đây không phải là API key AIWeb và cũng không phải access token được lưu trong repository.

### 5.2. Kết nối Zalo Bot với skill

Bạn cần các biến sau:

| Biến | Nội dung |
|---|---|
| `SLIMAI_ZALO_BOT_ENDPOINT` | Địa chỉ nhận yêu cầu gửi tin |
| `SLIMAI_ZALO_BOT_API_KEY` | Khóa của dịch vụ Zalo Bot |
| `SLIMAI_ZALO_MAX_CHARS` | Không bắt buộc; giới hạn kỹ thuật mỗi phần tin |

Ví dụ endpoint dùng với dịch vụ Slim Zalo Bot:

```text
https://slim.vn/zalobot/api/v1/messages
```

Mẫu yêu cầu kết nối và kiểm tra:

```text
Hãy lưu endpoint Zalo Bot vào SLIMAI_ZALO_BOT_ENDPOINT và API key tôi cung cấp
vào SLIMAI_ZALO_BOT_API_KEY. Không in lại hoặc ghi khóa vào repository.

Gửi một tin nhắn thử duy nhất vào group đã cấu hình. Nếu thành công,
báo message ID. Không gửi lại lần hai khi chưa xác định rõ lần đầu thất bại.
```

Tin Zalo đầu ra là văn bản thuần, gồm tiêu đề, các nhóm ý chính, mỗi ý một dòng và một CTA ở cuối:

```text
BẢN TIN SLIMAI NGÀY DD/MM

Chủ đề nổi bật: ...

📊 Góc nhìn chiến lược
• ...

💼 Case study thực tế
• ...

🤖 Tin chính thức từ hãng
• ...

👉 Xem chi tiết kèm phân tích và đánh giá:
https://ten-mien-cua-ban/blog/slug-theo-tu-khoa
```

Nếu API giới hạn độ dài, skill chia thành nhiều phần và chỉ đặt CTA cùng URL ở phần cuối. Tin được gửi tuần tự để tránh xuất hiện hai bản giống nhau cùng lúc.

## Bước 6: Chạy toàn bộ quy trình

Sau khi đã kiểm tra AIWeb và Zalo Bot, hãy chạy thử toàn bộ luồng bằng câu lệnh:

```text
Dùng $slimai-ai-daily-digest chạy toàn bộ luồng bản tin hôm nay:
thu thập nguồn → biên tập → tạo ảnh bìa → đăng blog AIWeb →
xác minh URL và ảnh preview → gửi một bản tóm tắt vào Zalo group.

Chỉ đăng khi có ít nhất một tin mới đạt chuẩn.
Không gửi Telegram. Không hiển thị khóa bí mật.
Cuối cùng báo URL blog, trạng thái og:image, số phần Zalo và message ID.
```

Trước khi gửi Zalo, skill phải xác nhận:

- bài blog mở công khai;
- ảnh preview là URL tuyệt đối, trả về HTTP 200 và đúng loại tệp ảnh;
- URL blog chưa từng được gửi thành công;
- nội dung Zalo là chuỗi văn bản, không phải object hoặc array.

## Bước 7: Đặt lịch tự động trên Codex

Chỉ đặt lịch sau khi luồng thủ công đã chạy thành công ít nhất một lần.

Mẫu yêu cầu:

```text
Hãy tạo lịch Codex chạy hằng ngày lúc 07:00 theo múi giờ Asia/Saigon.

Mỗi lần chạy, dùng $slimai-ai-daily-digest chạy toàn bộ luồng với trạng thái tại
work/slimai-ai-daily-digest-state.json.

Dùng các biến SLIMAI_AIWEB_BASE_URL, SLIMAI_AIWEB_API_KEY,
SLIMAI_ZALO_BOT_ENDPOINT và SLIMAI_ZALO_BOT_API_KEY.
Chỉ đăng blog và gửi Zalo khi có tin mới đạt chuẩn.
Không gửi Telegram và không hiển thị khóa bí mật.
```

Máy chạy Codex cần được bật, có Internet và còn quyền truy cập thư mục chứa tệp trạng thái. Nếu chuyển máy, hãy sao lưu `work/slimai-ai-daily-digest-state.json` để tránh dùng lại tin cũ hoặc gửi trùng.

## Checklist trước khi bật lịch hằng ngày

- [ ] Skill đã được cài và nhận đúng tên `$slimai-ai-daily-digest`.
- [ ] Danh sách nguồn và góc nhìn đã được duyệt.
- [ ] Một bản tin nháp đã được kiểm tra thủ công.
- [ ] AIWeb API đã kết nối và đăng thử thành công.
- [ ] Ảnh bìa và ảnh preview hiển thị đúng.
- [ ] Zalo Bot đã gửi đúng một tin vào đúng group.
- [ ] Tin Zalo có URL chính xác đến bài blog.
- [ ] Tệp trạng thái nằm ngoài thư mục skill và được giữ an toàn.
- [ ] Lịch có đúng giờ và múi giờ.

## Xử lý lỗi thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| Codex không nhận skill | Kiểm tra đường dẫn tới `SKILL.md`, mở lại Codex và tạo task mới |
| Nguồn không có bài | Kiểm tra RSS/HTML, ngày xuất bản và phạm vi 24–48 giờ; không hạ chuẩn để lấp quota |
| URL nguồn dẫn về trang chủ | Yêu cầu Codex tìm canonical URL của đúng bài gốc |
| AIWeb báo không có quyền | Tạo lại API key với quyền blog và media, rồi kiểm tra `ping/status` |
| Blog không có ảnh preview | Kiểm tra `og:image` là URL tuyệt đối, HTTP 200 và có `content-type` ảnh |
| Zalo nhận `array` nhưng không có nội dung | Dùng `scripts/send-zalo.mjs`; trường `text` phải là một chuỗi văn bản thuần |
| Zalo gửi hai tin giống nhau | Kiểm tra message ID và state; không thử lại khi phản hồi lần đầu chưa rõ |
| Bài hoặc tin bị lặp | Giữ và kiểm tra `work/slimai-ai-daily-digest-state.json` |

## Các tệp quan trọng

| Tệp | Mục đích |
|---|---|
| `SKILL.md` | Quy trình và tiêu chí chính của skill |
| `references/official-sources.json` | Nguồn tin chính hãng |
| `references/strategic-sources.json` | Nguồn góc nhìn chiến lược |
| `references/sources.json` | Nguồn cộng đồng |
| `scripts/run-digest.mjs` | Chạy toàn bộ luồng |
| `scripts/send-zalo.mjs` | Chuẩn hóa và gửi nội dung Zalo |
| `work/slimai-ai-daily-digest-state.json` | Trạng thái chống trùng; nằm ngoài skill |

## Bảo mật

- Không ghi API key vào README, JSON nguồn, log, nội dung blog hoặc GitHub.
- Chỉ lưu bí mật trong biến môi trường hoặc kho bí mật của máy chạy Codex.
- Không gửi lại đầy đủ khóa trong báo cáo kết quả.
- Nếu khóa từng bị chia sẻ công khai, hãy thu hồi và tạo khóa mới.
- Đọc dữ liệu trước khi cập nhật; kiểm tra lại bài công khai sau khi đăng.

## Thông tin

- Tên hiển thị: **SlimAI - AI Daily Digest**
- Tên skill: `slimai-ai-daily-digest`
- Đơn vị phát hành: Slimsoft Vietnam
- Liên hệ: `info@slimsoft.vn`
