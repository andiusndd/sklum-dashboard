# SKLUM Standalone Dashboard

Dashboard HTML/JS thuần, chạy qua Node.js proxy để đọc dữ liệu từ Google Sheets.

## Chạy local

```bash
npm install
npm start
```

Mở:

```text
http://localhost:3000
```

## Cấu trúc chính

- `index.html`: giao diện dashboard.
- `server.js`: server local, nạp `.env.local` rồi mount API từ `api/server.js`.
- `api/server.js`: endpoint `/api/data` và `/api/save-config`.
- `.env.local`: cấu hình thật của dự án, không nên commit.

## Biến môi trường cần có

Tạo `.env.local` từ `.env.example` và điền:

- `SHEET_ID`: Google Sheet ID.
- `GOOGLE_CREDENTIALS`: JSON service account.
- `ADMIN_PASSWORD`: mật khẩu cho phần quản trị nếu dùng.

## Lưu ý vận hành

- Dashboard tự refresh mỗi 60 giây.
- Khi tab bị ẩn, auto-refresh sẽ tạm dừng để tiết kiệm tài nguyên.
- Nếu đổi Sheet ID trong modal settings, giá trị sẽ được lưu vào `localstorage.json`.

## Ghi chú

Repo này đã được chuyển từ Next.js sang standalone HTML/JS + Node.js để dễ chỉnh sửa và triển khai nhanh hơn.
