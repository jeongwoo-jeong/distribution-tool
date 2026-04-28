import { Branch, StyleItem, DistributionData, GRADE_WEIGHTS } from './types'

export function calculateDistribution(
  styles: StyleItem[],
  branches: Branch[],
  ratio: number
): DistributionData {
  const result: DistributionData = {}
  if (!branches.length) return result

  const totalWeight = branches.reduce((sum, b) => sum + GRADE_WEIGHTS[b.grade], 0)
  if (totalWeight === 0) return result

  const sorted = [...branches].sort((a, b) => GRADE_WEIGHTS[b.grade] - GRADE_WEIGHTS[a.grade])

  for (const style of styles) {
    result[style.id] = {}
    const totalQty = Math.floor(style.availableStock * ratio)
    let remaining = totalQty
    const qtys: Record<string, number> = {}

    for (const branch of branches) {
      const qty = Math.floor(totalQty * GRADE_WEIGHTS[branch.grade] / totalWeight)
      qtys[branch.id] = qty
      remaining -= qty
    }

    for (let i = 0; i < remaining; i++) {
      qtys[sorted[i % sorted.length].id]++
    }

    for (const branch of branches) {
      result[style.id][branch.id] = qtys[branch.id] ?? 0
    }
  }

  return result
}

export function getTotalByStyle(data: DistributionData, styleId: string): number {
  const row = data[styleId]
  if (!row) return 0
  return Object.values(row).reduce((s, v) => s + v, 0)
}

export function getTotalByBranch(data: DistributionData, branchId: string): number {
  return Object.values(data).reduce((s, row) => s + (row[branchId] ?? 0), 0)
}

export function getGrandTotal(data: DistributionData): number {
  return Object.values(data).reduce(
    (s, row) => s + Object.values(row).reduce((rs, v) => rs + v, 0),
    0
  )
}
