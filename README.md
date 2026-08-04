# SlimAI - AI Daily Digest

Skill dành cho Codex giúp tạo bản tin AI tiếng Việt từ nguồn chính hãng, nghiên cứu chiến lược và cộng đồng công nghệ đáng tin cậy.

Bạn không cần biết lập trình để cài đặt hoặc sử dụng.

## Skill này làm được gì?

- Tìm tính năng và model mới từ OpenAI, Claude, Gemini, Grok, Microsoft Copilot, Moonshot/Kimi, Seedance và Kling.
- Bổ sung góc nhìn chiến lược từ McKinsey, Gartner và KPMG.
- Chọn tối đa 15 bài cộng đồng đạt ít nhất 60/100 điểm.
- Loại bài trùng, bài quảng cáo, nguồn không rõ ràng và bài thiếu bằng chứng.
- Dẫn liên kết thẳng đến đúng bài viết nguồn.
- Viết kết quả bằng tiếng Việt, phù hợp để biên tập cho fanpage, email hoặc Telegram.

## Cách cài đặt dễ nhất

### Cách 1: Nhờ Codex cài giúp

Mở Codex và gửi yêu cầu sau:

```text
Hãy cài skill slimai-ai-daily-digest từ repository
https://github.com/slimsoftvietnam/slimai-ai-daily-digest
Skill nằm ở thư mục gốc của repository.
```

Sau khi Codex báo cài đặt thành công, hãy mở một task mới để sử dụng skill.

### Cách 2: Cài bằng file ZIP trên Windows

1. Mở trang [Releases](https://github.com/slimsoftvietnam/slimai-ai-daily-digest/releases/latest).
2. Tải file `slimai-ai-daily-digest-codex.zip`.
3. Nhấp chuột phải vào file ZIP và chọn **Extract All**.
4. Sao chép thư mục `slimai-ai-daily-digest` vừa giải nén.
5. Dán thư mục đó vào:

   ```text
   C:\Users\TEN-CUA-BAN\.codex\skills\
   ```

6. Đóng rồi mở lại Codex, hoặc mở một task mới.

Lưu ý: thư mục cuối cùng phải có dạng:

```text
C:\Users\TEN-CUA-BAN\.codex\skills\slimai-ai-daily-digest\SKILL.md
```

Không để thêm một lớp thư mục lồng bên ngoài.

## Cách sử dụng

Yêu cầu cơ bản:

```text
Sử dụng $slimai-ai-daily-digest để tạo bản tin AI hôm nay bằng tiếng Việt.
```

Một số yêu cầu mẫu:

```text
Dùng $slimai-ai-daily-digest, lấy tin trong 48 giờ gần nhất.
```

```text
Dùng $slimai-ai-daily-digest và trình bày thành bài đăng Telegram dễ đọc.
```

```text
Dùng $slimai-ai-daily-digest, ưu tiên cập nhật OpenAI, Claude và Gemini.
```

```text
Dùng $slimai-ai-daily-digest để viết bản email có tiêu đề, preheader và phần gợi ý hành động.
```

## Cách đọc kết quả

Bản tin gồm các phần chính:

1. **Tóm tắt nhanh:** ba ý quan trọng nhất.
2. **Cập nhật từ hãng:** tính năng, model, API, giá hoặc thay đổi sản phẩm.
3. **Góc nhìn chiến lược:** nghiên cứu và khuyến nghị từ McKinsey, Gartner, KPMG.
4. **Bài cộng đồng:** tối đa 15 bài đã được chấm điểm và lọc chất lượng.
5. **Gợi ý áp dụng:** việc đội kỹ thuật, marketing hoặc quản lý có thể làm tiếp theo.

Mỗi bài cộng đồng phải đạt tối thiểu `60/100`. Điểm càng cao thì bài càng phù hợp với các tiêu chí: giá trị, độ tin cậy, tính thực tiễn, độ mới và tính nguyên bản.

Nếu không đủ 15 bài tốt trong 24 giờ, skill có thể mở rộng phạm vi lên 48 giờ rồi tối đa 7 ngày. Skill không hạ điểm chất lượng chỉ để lấy đủ số lượng.

## Lưu ý về nguồn

- Mỗi liên kết phải dẫn trực tiếp đến đúng bài viết, không dẫn về trang chủ hoặc trang danh mục.
- Tin được gọi là “cập nhật chính thức” phải đến từ website của hãng.
- Nhận định của cộng đồng và dự báo tư vấn phải được phân biệt với dữ liệu đã kiểm chứng.
- Một số trang có thể chặn tự động hóa hoặc yêu cầu đăng nhập; skill không vượt paywall hoặc cơ chế bảo vệ truy cập.

## Đăng lên Telegram, fanpage hoặc email

Skill có thể chuẩn bị nội dung cho từng kênh. Việc đăng hoặc gửi ra bên ngoài chỉ được thực hiện khi bạn yêu cầu rõ ràng.

Không lưu bot token, mật khẩu, API key hoặc thông tin đăng nhập trong repository, file hướng dẫn hay nội dung bản tin. Nếu một token đã được chia sẻ trong cuộc trò chuyện, hãy thu hồi token đó và tạo token mới.

## Khi skill không hoạt động

- Kiểm tra đúng đường dẫn `...\.codex\skills\slimai-ai-daily-digest\SKILL.md`.
- Mở task Codex mới sau khi cài đặt.
- Gọi đúng tên `$slimai-ai-daily-digest`.
- Kiểm tra máy có kết nối Internet.
- Nếu RSS không phản hồi, yêu cầu Codex chạy lại hoặc mở rộng khoảng thời gian.

## Thông tin

- Tên hiển thị: **SlimAI - AI Daily Digest**
- Tên skill: `slimai-ai-daily-digest`
- Đơn vị phát hành: Slimsoft Vietnam
- Liên hệ: `info@slimsoft.vn`
