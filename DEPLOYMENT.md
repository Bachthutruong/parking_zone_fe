# Frontend Deployment Guide

## Cấu hình đã được thiết lập

### 1. Vite Configuration
- ✅ **Client-side routing**: Đã cấu hình để handle SPA routing
- ✅ **API proxy**: Proxy `/api` requests đến backend
- ✅ **Code splitting**: Tự động split vendor và router chunks
- ✅ **Base path**: Cấu hình cho deployment

### 2. Deployment Files

#### Vercel Deployment
```json
// vercel.json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

#### Netlify Deployment
```toml
# netlify.toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Firebase/Other Platforms
```
# public/_redirects
/*    /index.html   200
```

## Các bước Deployment

### 1. Build Application
```bash
npm run build
```

### 2. Test Locally
```bash
npm run preview
```

### 3. Deploy to Platform

#### Vercel
```bash
npm install -g vercel
vercel --prod
```

#### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

#### Firebase
```bash
npm install -g firebase-tools
firebase init hosting
firebase deploy
```

## Environment Variables

Tạo file `.env` cho production:
```env
VITE_API_URL=https://your-backend-url.com
VITE_APP_NAME=Parking Zone
```

## Troubleshooting

### Lỗi 404 khi reload
- ✅ Đã cấu hình redirect rules
- ✅ Sử dụng BrowserRouter
- ✅ Build với Vite thay vì Next.js

### CORS Issues
- ✅ API proxy trong development
- ✅ CORS headers trong vercel.json

### Build Errors
- ✅ Đã xóa Next.js config files
- ✅ Sử dụng Vite config đúng cách
- ✅ TypeScript compilation

## Performance Optimization

### Code Splitting
- ✅ Vendor chunks (React, React-DOM)
- ✅ Router chunks (React Router)
- ✅ Dynamic imports cho pages lớn

### Bundle Size
- ✅ Tree shaking enabled
- ✅ Minification enabled
- ✅ Gzip compression

## Monitoring

### Build Analytics
- Bundle size warnings
- Chunk splitting analysis
- Performance metrics

### Runtime Monitoring
- Error tracking
- Performance monitoring
- User analytics 