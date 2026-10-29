# 🍊 Jeju Island

Vite + React + Supabase Auth + Pixabay 이미지, Vercel 배포용 제주도 사이트.

## 환경변수

| 변수 | 위치 | 설명 |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API | Project URL |
| `VITE_SUPABASE_ANON_KEY` | 같은 화면 | anon / publishable key (**service_role 키 금지**) |
| `PIXABAY_API_KEY` | https://pixabay.com/api/docs/ | 서버리스 함수(`api/pixabay.js`)에서만 사용 |

## 로컬 실행

```bash
npm install
cp .env.example .env   # 값 채우기
npm run dev
```

## Vercel 배포

1. Vercel → Add New Project → GitHub 저장소 import (Framework: Vite 자동 감지)
2. Environment Variables에 위 3개 등록 (Production/Preview/Development 모두)
3. Deploy
4. Supabase → Authentication → URL Configuration
   - Site URL: `https://<배포도메인>.vercel.app`
   - Redirect URLs: `https://<배포도메인>.vercel.app/**`, `http://localhost:5173/**`
