# 이월 상품 자동 분배장 시스템

의류 영업팀의 이월 상품 출고 업무를 자동화하는 웹 애플리케이션입니다.

## 기술 스택

- **Frontend**: React / Next.js 14 (App Router)
- **Backend**: Supabase (DB + Auth + Storage)
- **배포**: Vercel

## 핵심 기능

- 전년 판매 데이터 / 재고 소진율 기반 자동 분배 계산
- 지점별 분배 등급(A/B/C/D) 설정 및 가중치 적용
- 분배 비율 슬라이더 (10% ~ 80%)
- 기존 분배장 레이아웃 유지
- Excel 출고장 Export
- 분배 이력 저장 및 조회

## 시작하기

```bash
npm install
npm run dev
```
