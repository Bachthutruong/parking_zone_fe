# Parking Zone Frontend

Frontend cho hệ thống quản lý đặt chỗ đậu xe sân bay.

## Công nghệ sử dụng

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Shadcn/ui** - UI components
- **React Router** - Routing
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Axios** - HTTP client

## Cài đặt

1. **Cài đặt dependencies:**
```bash
cd frontend
npm install
```

2. **Tạo file .env:**
```bash
cp .env.example .env
```

3. **Chạy development server:**
```bash
npm run dev
```

## Cấu trúc thư mục

```
src/
├── components/          # React components
│   ├── ui/             # UI components (shadcn/ui)
│   ├── Header.tsx      # Header component
│   ├── Footer.tsx      # Footer component
│   ├── Layout.tsx      # Layout wrapper
│   └── ProtectedRoute.tsx # Route protection
├── contexts/           # React contexts
│   ├── AuthContext.tsx # Authentication context
│   └── ThemeContext.tsx # Theme context
├── hooks/              # Custom hooks
├── lib/                # Utility functions
├── pages/              # Page components
│   ├── admin/          # Admin pages
│   ├── HomePage.tsx    # Home page
│   ├── LoginPage.tsx   # Login page
│   ├── RegisterPage.tsx # Register page
│   ├── BookingPage.tsx # Booking page
│   └── LookupPage.tsx  # Lookup page
├── services/           # API services
│   ├── api.ts          # API client
│   ├── auth.ts         # Auth service
│   ├── booking.ts      # Booking service
│   ├── parking.ts      # Parking service
│   ├── addonServices.ts # Addon services
│   └── discountCodes.ts # Discount codes
├── types/              # TypeScript types
└── main.tsx           # App entry point
```

## Tính năng

### Trang chủ
- Giới thiệu dịch vụ
- Các loại bãi đậu xe
- Call-to-action buttons

### Đăng nhập/Đăng ký
- Form validation với Zod
- Error handling
- Responsive design

### Đặt chỗ (Đang phát triển)
- Chọn loại bãi đậu
- Chọn thời gian
- Dịch vụ bổ sung
- Mã giảm giá
- Tính toán giá

### Tra cứu (Đang phát triển)
- Tìm kiếm theo số điện thoại
- Tìm kiếm theo biển số xe
- Hiển thị trạng thái đặt chỗ

### Admin Panel (Đang phát triển)
- Dashboard thống kê
- Quản lý đặt chỗ
- Quản lý người dùng
- Cài đặt hệ thống

## Environment Variables

```env
VITE_API_URL=https://parking-zone-be.onrender.com/api
```

## Scripts

```bash
# Development
npm run dev

# Build
npm run build

# Preview build
npm run preview

# Lint
npm run lint
```

## Development

### Thêm component mới
1. Tạo file trong `src/components/`
2. Export component
3. Import và sử dụng

### Thêm page mới
1. Tạo file trong `src/pages/`
2. Thêm route trong `src/App.tsx`
3. Cập nhật navigation nếu cần

### Thêm API service
1. Tạo file trong `src/services/`
2. Sử dụng `api` client từ `src/services/api.ts`
3. Export functions

## Build và Deploy

```bash
# Build production
npm run build

# Preview build
npm run preview
```

Build files sẽ được tạo trong thư mục `dist/`.

## License

MIT 