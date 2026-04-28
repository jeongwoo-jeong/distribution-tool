export type Grade = 'A' | 'B' | 'C' | 'D'

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
}

export interface DistributionData {
  [styleId: string]: {
    [branchId: string]: number
  }
}

export const GRADE_WEIGHTS: Record<Grade, number> = {
  A: 1.0,
  B: 0.7,
  C: 0.4,
  D: 0.1,
}

export const GRADE_BG: Record<Grade, string> = {
  A: '#DBEAFE',
  B: '#DCFCE7',
  C: '#FEF9C3',
  D: '#FCE7F3',
}

export const GRADE_BORDER: Record<Grade, string> = {
  A: '#93C5FD',
  B: '#86EFAC',
  C: '#FDE047',
  D: '#F9A8D4',
}
