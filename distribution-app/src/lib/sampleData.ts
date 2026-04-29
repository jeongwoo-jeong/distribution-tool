import { Branch, Grade, StyleItem } from './types'
import rawData from './realData.json'
import autoData from './autoData.json'

const gradeMap = autoData.gradeMap as Record<string, Grade>

export const INITIAL_BRANCHES: Branch[] = (rawData.branches as Branch[]).map((b) => ({
  ...b,
  grade: gradeMap[b.id] ?? b.grade,
}))

export const INITIAL_STYLES: StyleItem[] = (rawData.styles as StyleItem[])

export const INITIAL_CLEARANCE = autoData.clearanceData as {
  key: string
  type: 'style' | 'sku'
  branchId: string
  clearanceRate: number
}[]

export const STYLE_AVG = autoData.styleAvg as Record<string, number>
