# SKLUM Standalone Dashboard

Dashboard HTML/JS thuần, chạy qua Node.js proxy để đọc dữ liệu từ Google Sheets.

## Live

- Production: [https://sklum-dashboard.vercel.app](https://sklum-dashboard.vercel.app)
- API data: `/api/data`

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
- `api/server.js`: server Express local.
- `api/data.js`: serverless function cho Vercel, trả dữ liệu Google Sheets.
- `api/save-config.js`: serverless function lưu Sheet ID.
- `api/_helpers.js`: logic dùng chung để đọc Google Sheets.
- `.env.local`: cấu hình thật của dự án, không nên commit.

## Data source

Dashboard hiện đang đọc từ sheet:

- `1vR6ZhTMotNPxzuReclqE7DUBF9EsjiofVjQqEDIurEc`

Google Sheet này cần share cho service account:

- `dashboard-reader@divine-glazing-451115-a0.iam.gserviceaccount.com`

## Biến môi trường cần có

Tạo `.env.local` từ `.env.example` và điền:

- `SHEET_ID`: Google Sheet ID.
- `GOOGLE_CREDENTIALS`: JSON service account.
- `ADMIN_PASSWORD`: mật khẩu cho phần quản trị nếu dùng.

## Vận hành

- Dashboard tự refresh mỗi 60 giây.
- Khi tab bị ẩn, auto-refresh sẽ tạm dừng để tiết kiệm tài nguyên.
- Nếu đổi Sheet ID trong modal settings, giá trị sẽ được lưu vào `localstorage.json`.

## Deploy Vercel

Repo này đã được cấu hình để deploy trực tiếp trên Vercel.

1. Connect repo GitHub vào project Vercel.
2. Thêm environment variables trên Vercel.
3. Push lên `main` để auto deploy.

## Ghi chú

Repo này đã được chuyển từ Next.js sang standalone HTML/JS + Node.js để dễ chỉnh sửa và triển khai nhanh hơn.
