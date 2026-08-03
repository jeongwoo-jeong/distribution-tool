export type Grade = 'A' | 'B' | 'C' | 'D' | 'E' | 'X'

export interface Branch {
  id: string
  code: string
  name: string
  grade: Grade
}

export interface StyleItem {
  id: string
  no: number
  styleCode: string
  productName: string
  color: string
  size: string
  availableStock: number
  year?: number    // F열: 판매 년도
  season?: number  // G열: 1=봄 2=여름 3=가을 4=겨울 9=공통
}

export type BranchColumn = {
  code: string
  colIdx: number  // 가용재고 파일의 0-based 열 인덱스
}

export interface DistributionData {
  [styleId: string]: {
    [branchId: string]: number
  }
}

// 매장별 매출 데이터 (자동 등급 산정용)
export interface BranchSalesData {
  branchId: string
  prevYearGrowthRate: number   // 전년 대비 성장률 (%)
  recentThreeMonthsSales: number  // 직전 3개월 매출 (원)
}

// 소진율 데이터 (스타일별 우선 분배용)
export interface ClearanceData {
  key: string            // styleCode(9자리) or article(SKU 전체)
  type: 'style' | 'sku'
  branchId: string
  clearanceRate: number  // 해당 지점 소진율 (%)
}

export const GRADE_WEIGHTS: Record<Grade, number> = {
  A: 1.0,
  B: 0.8,
  C: 0.6,
  D: 0.4,
  E: 0.3,
  X: 0,   // 제외
}

export const GRADE_LABELS: Record<Grade, string> = {
  A: 'A등급',
  B: 'B등급',
  C: 'C등급',
  D: 'D등급',
  E: 'E등급',
  X: '제외',
}

export const GRADE_BG: Record<Grade, string> = {
  A: '#DBEAFE',
  B: '#DCFCE7',
  C: '#FEF9C3',
  D: '#FFE4C4',
  E: '#FCE7F3',
  X: '#F3F4F6',
}

export const GRADE_BORDER: Record<Grade, string> = {
  A: '#93C5FD',
  B: '#86EFAC',
  C: '#FDE047',
  D: '#FDBA74',
  E: '#F9A8D4',
  X: '#D1D5DB',
}

export const GRADE_TEXT: Record<Grade, string> = {
  A: '#1D4ED8',
  B: '#15803D',
  C: '#92400E',
  D: '#C2410C',
  E: '#9D174D',
  X: '#6B7280',
}
