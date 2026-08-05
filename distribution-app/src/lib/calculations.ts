import { Branch, StyleItem, DistributionData, GRADE_WEIGHTS, BranchSalesData, ClearanceData, Grade } from './types'

// 스타일코드 추출: article 앞 9자리 (색상/사이즈 제외)
function extractBaseStyle(article: string): string {
  return article.length >= 9 ? article.substring(0, 9) : article
}

// 소진율 맵: key(article or baseStyle) + branchId → clearanceRate
function buildClearanceMap(clearanceList: ClearanceData[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const c of clearanceList) {
    map.set(`${c.key}::${c.branchId}`, c.clearanceRate)
  }
  return map
}

// 스타일별 전체 평균 소진율
function buildAvgClearanceMap(clearanceList: ClearanceData[]): Map<string, number> {
  const sums = new Map<string, { total: number; count: number }>()
  for (const c of clearanceList) {
    const prev = sums.get(c.key) ?? { total: 0, count: 0 }
    sums.set(c.key, { total: prev.total + c.clearanceRate, count: prev.count + 1 })
  }
  const avgs = new Map<string, number>()
  sums.forEach((v, k) => avgs.set(k, v.total / v.count))
  return avgs
}

const MAX_PER_BRANCH = 15  // 매장당 스타일별 최대 분배 수량

export function calculateDistribution(
  styles: StyleItem[],
  branches: Branch[],
  ratio: number,
  clearanceList: ClearanceData[] = []
): DistributionData {
  const result: DistributionData = {}
  const activeBranches = branches.filter((b) => b.grade !== 'X')
  if (!activeBranches.length) return result

  const clearanceMap = buildClearanceMap(clearanceList)
  const avgMap = buildAvgClearanceMap(clearanceList)

  for (const style of styles) {
    result[style.id] = {}
    const totalQty = Math.floor(style.availableStock * ratio)
    if (totalQty === 0) continue

    const baseStyle = extractBaseStyle(style.styleCode)

    // 각 지점의 유효 가중치 = 등급가중치 × 소진율보정
    const effectiveWeights: Record<string, number> = {}
    for (const branch of activeBranches) {
      const gradeW = GRADE_WEIGHTS[branch.grade]

      // 소진율 보정: SKU 우선, 없으면 스타일코드로 fallback
      const skuRate = clearanceMap.get(`${style.styleCode}::${branch.id}`)
      const styleRate = clearanceMap.get(`${baseStyle}::${branch.id}`)
      const branchRate = skuRate ?? styleRate

      let clearanceBoost = 1.0
      const avgKey = skuRate !== undefined ? style.styleCode : baseStyle
      const styleHasData = avgMap.has(baseStyle) || avgMap.has(style.styleCode)

      if (branchRate !== undefined) {
        const avg = avgMap.get(avgKey) ?? branchRate
        if (avg > 0) {
          const clearanceRatio = branchRate / avg
          clearanceBoost = Math.pow(clearanceRatio, 2)
          clearanceBoost = Math.max(0.01, clearanceBoost)
        }
      } else if (styleHasData) {
        // 해당 스타일에 소진율 데이터가 존재하지만 이 지점 데이터가 없으면 기본값 낮춤
        clearanceBoost = 0.5
      }

      effectiveWeights[branch.id] = gradeW * clearanceBoost
    }

    const totalWeight = Object.values(effectiveWeights).reduce((s, w) => s + w, 0)
    if (totalWeight === 0) continue

    const sorted = [...activeBranches].sort(
      (a, b) => effectiveWeights[b.id] - effectiveWeights[a.id]
    )

    let remaining = totalQty
    const qtys: Record<string, number> = {}
    for (const branch of activeBranches) {
      const qty = Math.min(
        Math.floor(totalQty * effectiveWeights[branch.id] / totalWeight),
        MAX_PER_BRANCH
      )
      qtys[branch.id] = qty
      remaining -= qty
    }
    // 나머지 수량을 cap에 걸리지 않은 매장 순서대로 배분
    for (let i = 0; i < remaining; i++) {
      const branch = sorted[i % sorted.length]
      if ((qtys[branch.id] ?? 0) < MAX_PER_BRANCH) {
        qtys[branch.id]++
      }
    }

    for (const branch of activeBranches) {
      result[style.id][branch.id] = qtys[branch.id] ?? 0
    }
    // 제외 지점은 0
    for (const branch of branches) {
      if (branch.grade === 'X') result[style.id][branch.id] = 0
    }
  }

  return result
}

// ─── 자동 등급 산정 ───────────────────────────────────────────────
export function autoAssignGrades(
  branches: Branch[],
  salesDataList: BranchSalesData[]
): Branch[] {
  if (!salesDataList.length) return branches

  const salesMap = new Map(salesDataList.map((s) => [s.branchId, s]))

  // 데이터 있는 지점만 점수 계산
  const scored: { branchId: string; score: number }[] = []
  for (const s of salesDataList) {
    scored.push({ branchId: s.branchId, score: 0 }) // 임시
  }

  const growths = salesDataList.map((s) => s.prevYearGrowthRate)
  const recents = salesDataList.map((s) => s.recentThreeMonthsSales)

  const minG = Math.min(...growths), maxG = Math.max(...growths)
  const minR = Math.min(...recents), maxR = Math.max(...recents)

  const withScore = salesDataList.map((s) => {
    const normG = maxG !== minG ? (s.prevYearGrowthRate - minG) / (maxG - minG) : 0.5
    const normR = maxR !== minR ? (s.recentThreeMonthsSales - minR) / (maxR - minR) : 0.5
    return { branchId: s.branchId, score: 0.3 * normG + 0.7 * normR }
  })

  withScore.sort((a, b) => b.score - a.score)
  const n = withScore.length

  const gradeOf = (rank: number): Grade => {
    const pct = rank / n
    if (pct < 0.1) return 'A'
    if (pct < 0.3) return 'B'
    if (pct < 0.6) return 'C'
    if (pct < 0.9) return 'D'
    return 'E'
  }

  const gradeMap = new Map(withScore.map((s, i) => [s.branchId, gradeOf(i)]))

  return branches.map((b) => ({
    ...b,
    grade: gradeMap.has(b.id) ? (gradeMap.get(b.id) as Grade) : b.grade,
  }))
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
