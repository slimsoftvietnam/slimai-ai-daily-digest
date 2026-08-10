# SlimAI - AI Daily Digest

Skill dành cho Codex giúp tạo bản tin AI tiếng Việt từ nguồn chính hãng, nghiên cứu chiến lược và cộng đồng công nghệ đáng tin cậy.

Bạn không cần biết lập trình để cài đặt hoặc sử dụng.

## Bắt đầu trong 3 bước

### 1. Nhờ Codex cài skill

Sao chép và gửi câu này cho Codex:

```text
Hãy cài skill slimai-ai-daily-digest từ
https://github.com/slimsoftvietnam/slimai-ai-daily-digest
```

Khi Codex báo cài xong, hãy mở một task mới.

### 2. Tạo bản tin

Gửi câu lệnh sau:

```text
Dùng $slimai-ai-daily-digest tạo bản tin AI hôm nay bằng tiếng Việt.
```

Skill sẽ tự tìm nguồn chính hãng, góc nhìn chiến lược và nội dung cộng đồng đáng tin cậy; bạn không cần chỉnh RSS, JSON hay mã nguồn.

### 3. Chọn định dạng bạn muốn

Bạn có thể nói thêm một trong các câu sau:

- `Trình bày thành bài đăng Telegram dễ đọc.`
- `Viết thành bài blog chuẩn SEO, không hiện điểm số.`
- `Viết thành email bản tin có tiêu đề và phần kêu gọi hành động.`
- `Tóm tắt ngắn để đăng fanpage.`

Skill chỉ tạo nội dung trong chat. Việc gửi Telegram, email hoặc đăng blog chỉ được thực hiện khi bạn yêu cầu rõ ràng và cung cấp quyền truy cập phù hợp. Không đưa API key hoặc bot token vào repository công khai.

## Luồng tự động mới

Skill đã có sẵn một script điều phối để tránh phải ghép nhiều lệnh thủ công. Quy trình hàng ngày là:

1. Thu thập RSS, chuẩn hóa URL và bỏ bài trùng.
2. Codex đọc nguồn chính hãng/chiến lược, kiểm chứng, chấm điểm và viết bản thảo.
3. Script kiểm tra bản thảo, đăng bài lên AIWeb và xác minh trang công khai cùng ảnh preview.
4. Script chia bản tóm tắt Zalo khi cần, gửi từng phần theo thứ tự và lưu message ID.
5. Chỉ sau khi hoàn tất, script mới đánh dấu các URL nguồn đã dùng.

Người không rành kỹ thuật chỉ cần yêu cầu:

```text
Dùng $slimai-ai-daily-digest chạy toàn bộ luồng bản tin hôm nay.
Đăng blog SlimAI, xác minh ảnh preview rồi gửi bản tóm tắt qua Zalo.
Không gửi Telegram. Không hiển thị khóa bí mật.
```

Các biến môi trường cần có trên máy chạy Codex:

| Biến | Mục đích |
|---|---|
| `SLIMAI_AIWEB_BASE_URL` | Địa chỉ website AIWeb, ví dụ `https://ai.slim.vn` |
| `SLIMAI_AIWEB_API_KEY` | Khóa đăng và đọc lại bài blog |
| `SLIMAI_ZALO_BOT_ENDPOINT` | Endpoint nhận tin nhắn Zalo Bot |
| `SLIMAI_ZALO_BOT_API_KEY` | Khóa gửi Zalo Bot |
| `SLIMAI_ZALO_MAX_CHARS` | Giới hạn kỹ thuật mỗi phần, có thể bỏ trống để dùng 1800 |

Trạng thái chống trùng nằm tại `work/slimai-ai-daily-digest-state.json`, bên ngoài thư mục skill. Khi sao lưu hoặc chuyển máy, hãy giữ tệp này nếu muốn tiếp tục tránh dùng lại các URL cũ.

### Mẫu lịch Codex ngắn gọn

Prompt của lịch chỉ cần gọi skill và nêu cấu hình vận hành; không sao chép lại toàn bộ tiêu chí biên tập:

```text
Hằng ngày lúc 07:00 Asia/Saigon, dùng $slimai-ai-daily-digest chạy toàn bộ luồng
với trạng thái tại work/slimai-ai-daily-digest-state.json.

Dùng SLIMAI_AIWEB_BASE_URL, SLIMAI_AIWEB_API_KEY,
SLIMAI_ZALO_BOT_ENDPOINT và SLIMAI_ZALO_BOT_API_KEY.
Chỉ đăng khi có ít nhất một tin mới đạt chuẩn. Sau khi xác minh URL công khai và
og:image, gửi tóm tắt Zalo. Tạm thời không gửi Telegram. Không hiển thị khóa bí mật.
Báo URL blog, trạng thái og:image, số phần Zalo và message ID.
```

Nếu một lần gửi Zalo mất phản hồi, skill sẽ không tự gửi lại ngay vì server có thể đã nhận tin. Hãy kiểm tra group trước; Codex chỉ tiếp tục lần gửi chưa rõ trạng thái bằng cùng khóa chống trùng khi được xác nhận là phù hợp.

## Skill này làm được gì?

- Tìm tính năng và model mới từ OpenAI, Claude, Gemini, Grok, Microsoft Copilot, Moonshot/Kimi, Seedance và Kling.
- Bổ sung góc nhìn chiến lược từ McKinsey, Gartner, KPMG và IBM.
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

```text
Dùng $slimai-ai-daily-digest để viết bài blog dễ đọc, lấy tin nổi bật nhất làm từ khóa SEO chính và không hiển thị điểm số.
```

## Cách đọc kết quả

Bản tin gồm các phần chính:

1. **Tóm tắt nhanh:** ba ý quan trọng nhất.
2. **Cập nhật từ hãng:** tính năng, model, API, giá hoặc thay đổi sản phẩm.
3. **Góc nhìn chiến lược:** nghiên cứu và khuyến nghị từ McKinsey, Gartner, KPMG và IBM.
4. **Bài cộng đồng:** tối đa 15 bài đã được chấm điểm và lọc chất lượng.
5. **Gợi ý áp dụng:** việc đội kỹ thuật, marketing hoặc quản lý có thể làm tiếp theo.

Mỗi bài cộng đồng phải đạt tối thiểu `60/100`. Điểm càng cao thì bài càng phù hợp với các tiêu chí: giá trị, độ tin cậy, tính thực tiễn, độ mới và tính nguyên bản.

Khi xuất bản thành bài blog, điểm số chỉ dùng nội bộ để chọn bài và không hiển thị trong nội dung. Bài blog dùng đoạn văn ngắn, đánh số các mục chính, dùng bảng khi nhiều tin có cùng trường thông tin, có phần tóm tắt nhanh và lấy tin quan trọng nhất làm từ khóa SEO chính. Slug URL cũng phải lấy từ từ khóa chính và tính năng mới cụ thể, ví dụ `gpt-live-hoi-thoai-ai-lien-tuc`; tránh slug chung chung như `ban-tin-cong-nghe` hoặc chỉ có ngày tháng. Giữ slug ngắn, không dấu, ngăn cách bằng dấu gạch ngang và không tự đổi sau khi bài đã xuất bản. Không thêm mục “Phương pháp biên tập của SlimAI” nếu người dùng không yêu cầu.

Nếu không đủ 15 bài tốt trong 24 giờ, skill có thể mở rộng phạm vi lên 48 giờ rồi tối đa 7 ngày. Skill không hạ điểm chất lượng chỉ để lấy đủ số lượng.

## Lưu ý về nguồn

- Mỗi liên kết phải dẫn trực tiếp đến đúng bài viết, không dẫn về trang chủ hoặc trang danh mục.
- Tin được gọi là “cập nhật chính thức” phải đến từ website của hãng.
- Nhận định của cộng đồng và dự báo tư vấn phải được phân biệt với dữ liệu đã kiểm chứng.
- Một số trang có thể chặn tự động hóa hoặc yêu cầu đăng nhập; skill không vượt paywall hoặc cơ chế bảo vệ truy cập.

## Cách thêm nguồn tin

Cách đơn giản nhất là gửi cho Codex tên nguồn và đường dẫn. Ví dụ:

```text
Hãy thêm blog NVIDIA AI vào $slimai-ai-daily-digest.
Kiểm tra đây có phải nguồn chính hãng không, tìm RSS nếu có,
thử đọc nguồn và chỉ cập nhật skill khi nguồn đạt tiêu chí.
```

Nếu chưa có đường dẫn, bạn có thể yêu cầu:

```text
Hãy tìm nguồn chính thức của [tên tổ chức], đánh giá độ tin cậy
và đề xuất thêm vào $slimai-ai-daily-digest. Chưa cập nhật cho đến khi tôi đồng ý.
```

Codex sẽ xếp nguồn vào đúng nhóm:

| Nhóm nguồn | Dùng cho | Tệp cấu hình |
|---|---|---|
| Chính hãng | Model, tính năng, API và thông báo sản phẩm | `references/official-sources.json` |
| Chiến lược | Nghiên cứu, khảo sát và góc nhìn quản trị | `references/strategic-sources.json` |
| Cộng đồng | Case study, mã nguồn mở và hướng dẫn thực tế | `references/sources.json` |

Một nguồn chỉ nên được thêm khi có tác giả hoặc tổ chức rõ ràng, nội dung nguyên bản, đường dẫn hoạt động và phù hợp với tiêu chí bản tin. Với nguồn cộng đồng, ưu tiên RSS/Atom. Nếu nguồn chính hãng hoặc chiến lược không có RSS, skill có thể đọc HTML công khai hoặc tìm kiếm giới hạn trong đúng tên miền.

Sau khi cập nhật, hãy yêu cầu Codex kiểm tra JSON, chạy thử nguồn mới và báo lỗi nếu trang chặn truy cập. Không thêm trang tổng hợp, bản sao nội dung, nguồn ẩn danh, trang chủ chung chung hoặc nguồn chủ yếu đăng quảng cáo. Tuyệt đối không lưu API key, cookie hay mật khẩu trong các tệp nguồn.

## Đăng lên Telegram, fanpage hoặc email

Skill có thể chuẩn bị nội dung cho từng kênh. Việc đăng hoặc gửi ra bên ngoài chỉ được thực hiện khi bạn yêu cầu rõ ràng.

Không lưu bot token, mật khẩu, API key hoặc thông tin đăng nhập trong repository, file hướng dẫn hay nội dung bản tin. Nếu một token đã được chia sẻ trong cuộc trò chuyện, hãy thu hồi token đó và tạo token mới.

## Đặt lịch tự động và gửi Telegram mỗi ngày

### Bạn cần chuẩn bị gì?

| Thông tin | Ví dụ | Lưu ý |
|---|---|---|
| Giờ gửi | `07:00` | Ghi rõ múi giờ, ví dụ `Asia/Ho_Chi_Minh` |
| Bot token | Nhận từ `@BotFather` | Là thông tin bí mật, không đưa vào GitHub hoặc prompt đặt lịch |
| Group chat ID | Một số thường bắt đầu bằng dấu `-` | Bot phải được thêm vào group và có quyền gửi tin |
| Topic ID | Chỉ cần với group dạng forum | Bỏ qua nếu group không dùng topic |
| Nội dung | Tiếng Việt, tối đa 15 bài | Có thể dùng cấu hình mặc định của skill |

### Thiết lập lần đầu

1. Tạo bot bằng `@BotFather`, thêm bot vào Telegram group và gửi thử một tin nhắn trong group.
2. Mở một task riêng tư trong Codex và cung cấp bot token một lần để Codex lưu vào biến môi trường `SLIMAI_TELEGRAM_BOT_TOKEN`. Lưu chat ID vào `SLIMAI_TELEGRAM_CHAT_ID`; nếu dùng topic, lưu thêm `SLIMAI_TELEGRAM_THREAD_ID`.
3. Khởi động lại ứng dụng Codex sau khi tạo biến môi trường, rồi yêu cầu gửi một bản tin thử.
4. Chỉ tạo lịch sau khi bản thử đến đúng group và hiển thị đúng định dạng.

Bạn có thể gửi yêu cầu thiết lập như sau:

```text
Hãy lưu thông tin Telegram tôi cung cấp vào các biến môi trường
SLIMAI_TELEGRAM_BOT_TOKEN và SLIMAI_TELEGRAM_CHAT_ID.
Không in lại token, không ghi token vào repository hoặc nội dung task đặt lịch.
Sau đó gửi một tin nhắn thử để xác nhận đúng group.
```

### Yêu cầu Codex tạo lịch

Trong ứng dụng Codex desktop, gửi câu lệnh:

```text
Hãy tạo Scheduled Task trong task này, chạy hàng ngày lúc 07:00
theo múi giờ Asia/Ho_Chi_Minh.

Mỗi lần chạy, dùng $slimai-ai-daily-digest để tìm tin AI mới đạt tiêu chí.
Chỉ gửi URL chưa từng gửi, dùng trạng thái tại
work/slimai-ai-daily-digest-state.json để tránh trùng.

Gửi bản tóm tắt tiếng Việt vào Telegram bằng các biến môi trường
SLIMAI_TELEGRAM_BOT_TOKEN và SLIMAI_TELEGRAM_CHAT_ID.
Dùng HTML, tắt link preview và chia thành nhiều phần nếu nội dung dài.
Nếu không có tin mới đạt chuẩn, chỉ gửi một thông báo ngắn.
Sau khi gửi, báo số phần và message ID nhưng không hiển thị token.
```

Sau khi tạo, mở mục **Scheduled** trong Codex để xem lịch và các lần chạy. Hãy kiểm tra vài bản tin đầu tiên trước khi để lịch hoạt động lâu dài.

### Điều kiện để lịch chạy được

- Nếu task dùng skill hoặc tệp trạng thái trên máy, máy phải bật, Codex desktop phải đang chạy và thư mục dự án vẫn tồn tại.
- Task cần quyền truy cập Internet để đọc nguồn tin và gọi Telegram Bot API.
- Telegram giới hạn mỗi tin nhắn văn bản ở 4.096 ký tự sau khi xử lý định dạng; skill sẽ tự chia nội dung thành nhiều phần.
- Nếu đổi bot token hoặc group, hãy cập nhật biến môi trường rồi khởi động lại Codex.
- Có thể tạm dừng, chạy thử, sửa giờ hoặc xem lịch sử tại mục **Scheduled**.

Tài liệu chính thức: [Codex Scheduled Tasks](https://learn.chatgpt.com/docs/automations) · [Telegram Bot API](https://core.telegram.org/bots/api#sendmessage)

## Gửi bản tóm tắt qua Zalo Bot

Sau khi bài blog được đăng và kiểm tra ảnh preview, skill có thể gửi một bản tóm tắt vào Zalo. Bạn cần cung cấp riêng tư:

| Thông tin | Biến môi trường | Lưu ý |
|---|---|---|
| Endpoint Zalo Bot | `SLIMAI_ZALO_BOT_ENDPOINT` | Ví dụ endpoint nhận `POST` JSON |
| API key | `SLIMAI_ZALO_BOT_API_KEY` | Không đưa vào GitHub hoặc prompt đặt lịch |

Tin nhắn Zalo dùng văn bản thuần, không dùng Markdown hoặc HTML. Nội dung được chia thành các nhóm có emoji, mỗi ý chính nằm trên một dòng và không giới hạn cố định ở 500 ký tự hay 7 gạch đầu dòng. Nếu API có giới hạn kỹ thuật thực tế, skill sẽ chia thành nhiều phần; CTA và URL blog chỉ xuất hiện ở phần cuối.

Thứ tự mặc định của bản tin là: **Góc nhìn chiến lược → Case study đã kiểm chứng → Tin chính thức từ hãng**. Với tin hãng, skill kiểm tra blog hoặc newsroom chính thức trước; release notes, changelog và tài liệu sản phẩm là nguồn bổ sung để xác minh chi tiết.

Nếu McKinsey, Gartner, KPMG hoặc IBM không có nghiên cứu mới chưa từng dùng, skill sẽ kiểm tra bài blog hoặc insight mới nhất trên website chính thức. Bài dự phòng vẫn phải liên quan trực tiếp đến AI, có hướng áp dụng cụ thể và chưa xuất hiện trong bản tin trước; bài cũ phải ghi rõ ngày.

Bài blog được viết cho người không chuyên kỹ thuật: dùng từ tiếng Việt dễ hiểu, giải thích thuật ngữ lạ trong ngoặc ở lần xuất hiện đầu tiên và thêm mục **Chú thích thuật ngữ** cuối bài khi có khái niệm mới hoặc khó.

Skill dùng `scripts/send-zalo.mjs` để bảo đảm trường `text` luôn là chuỗi thuần. Có thể kiểm tra trước mà không gửi tin:

```text
node scripts/send-zalo.mjs --file <duong-dan-tin-nhan.txt> --dry-run
```

Không dùng kết quả `Get-Content` của PowerShell rồi chuyển thẳng sang JSON, vì metadata của tệp có thể làm `text` thành object/array và khiến Zalo nhận tin không có nội dung.

Mẫu yêu cầu:

```text
Sau khi đăng bài blog, hãy gửi bản tóm tắt qua Zalo Bot.
Dùng SLIMAI_ZALO_BOT_ENDPOINT và SLIMAI_ZALO_BOT_API_KEY.

Tin nhắn phải là văn bản thuần, không dùng Markdown hoặc HTML.
Chia nội dung theo nhóm chủ đề có emoji, mỗi ý một dòng.
Tóm tắt đủ các cập nhật quan trọng và tách riêng Gartner,
McKinsey, KPMG, IBM nếu có nghiên cứu mới đạt chuẩn.

Dòng cuối là:
👉 Xem chi tiết kèm phân tích và đánh giá:
{URL bài blog}

Lưu URL và message ID thành công để tránh gửi trùng.
Không hiển thị API key.
```

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
