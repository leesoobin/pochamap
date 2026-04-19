@AGENTS.md

# pochamap 프로젝트

길거리 음식(닭꼬치, 붕어빵, 타코야끼) 위치를 제보하고 지도에서 찾을 수 있는 서비스.

## 기술 스택
- **Framework**: Next.js 16 (App Router) + TypeScript
- **Map**: Kakao Maps JavaScript SDK (동적 로딩)
- **DB/Auth**: Supabase (PostgreSQL + Auth)
- **Styling**: Tailwind CSS
- **Hosting**: Vercel (예정) / 현재 로컬 프로덕션 서버

## 빌드 & 실행
```bash
npm run build && npm start   # 프로덕션 (터널 사용 시 필수)
npm run dev                  # 개발 (localhost 전용)
```
> **주의**: 외부 터널(pochamap.sbbs.click)은 반드시 프로덕션 빌드로 서빙해야 함.  
> 개발 서버는 WebSocket HMR이 터널에서 502를 반환해 지도가 렌더링되지 않음.

## 주요 페이지
| 경로 | 설명 |
|------|------|
| `/` | 메인 지도 (카카오맵 + 필터) |
| `/report` | 일반 유저 제보 폼 |
| `/admin/login` | 관리자 로그인 |
| `/admin/reports` | 제보 검토 (승인/거절) |
| `/admin/locations` | 위치 직접 추가/수정/삭제 |

## 파일 구조
```
src/
  app/
    page.tsx                  # 메인 지도
    report/page.tsx           # 제보 폼
    admin/
      layout.tsx              # 관리자 사이드바
      login/page.tsx
      reports/page.tsx
      locations/page.tsx
      logout/route.ts
  components/
    map/
      KakaoMap.tsx            # 카카오맵 + 커스텀 핀
      FilterBar.tsx           # 음식 종류 필터
  lib/
    types.ts                  # 공통 타입 + 상수
    supabase/
      client.ts               # 브라우저용
      server.ts               # 서버용
  proxy.ts                    # 어드민 라우트 보호 (Next.js 16 미들웨어)
supabase/
  schema.sql                  # DB 스키마 (최초 1회 Supabase SQL Editor에서 실행)
```

## 환경변수 (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_KAKAO_MAP_KEY=
```

## 음식 타입
- `chicken_skewer` — 닭꼬치 🍢
- `bungeobbang` — 붕어빵 🐟
- `takoyaki` — 타코야끼 🐙

## 외부 서비스
- **Supabase 프로젝트**: skmnlekamfuuevcolluz.supabase.co
- **Kakao 개발자 콘솔**: JS키 등록 도메인 → localhost:3000, pochamap.sbbs.click
- **터널**: pochamap.sbbs.click (xray → EC2 → Caddy)
