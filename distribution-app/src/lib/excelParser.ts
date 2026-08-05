import * as XLSX from 'xlsx'
import { Branch, BranchColumn, StyleItem, ClearanceData, Grade } from './types'

// ─── 파싱 결과 타입 ──────────────────────────────────────────────────
export interface ParsedStockRow {
  styleCode: string
  productName: string
  color: string
  size: string
  availableStock: number
  year?: number
  season?: number
}

export interface ParsedStockResult {
  rows: ParsedStockRow[]
  branchColumns: import('./types').BranchColumn[]
  fileBuffer: ArrayBuffer
  brandName: string   // B열 스타일그룹명 (예: "인디고키즈")
}

export interface ParsedSalesRow {
  code: string
  name: string
  sales: number
  growthRate: number // 폐점 매장은 -100 입력
}

export interface ParsedClearanceRow {
  branchCode: string
  styleCode: string   // 9자리 base style 또는 전체 article
  clearanceRate: number
}

// ─── 내부 유틸 ──────────────────────────────────────────────────────
async function readFileBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target!.result as ArrayBuffer)
    reader.onerror = () => reject(new Error('파일 읽기 실패'))
    reader.readAsArrayBuffer(file)
  })
}

function getRows(ws: XLSX.WorkSheet): unknown[][] {
  return (XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as unknown[][])
}

// ─── 1. 가용재고 파싱 ────────────────────────────────────────────────
// 실제 양식 (인디고키즈 ERP):
//   7행 헤더: H=ARTICLE | I=스타일/컬러("품명, 컬러코드 컬러명, 사이즈") | L=가용합계
//   8행~: 데이터
// 구버전 양식 (단순 5컬럼):
//   1행 헤더: A=스타일코드 | B=상품명 | C=컬러 | D=사이즈 | E=가용재고수량
export async function parseStockExcel(file: File): Promise<ParsedStockResult> {
  const buf = await readFileBuffer(file)
  const wb = XLSX.read(buf, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = getRows(ws)

  // 처음 10행 안에서 H열(index 7)에 'ARTICLE'이 있는 행을 헤더로 판별
  let headerRowIdx = -1
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    if (String(rows[i]?.[7] ?? '').trim().toUpperCase() === 'ARTICLE') {
      headerRowIdx = i
      break
    }
  }
  const isErpFormat = headerRowIdx >= 0

  const results: ParsedStockRow[] = []
  const branchColumns: BranchColumn[] = []
  let brandName = ''

  if (isErpFormat) {
    // 헤더행(7행)에서 매장코드, 2행에서 매장명 추출 (M열=index 12 이후)
    // 코드는 숫자(7204) 또는 알파뉴메릭(C13N) 모두 허용, 한글/빈값만 제외
    const headerRow = rows[headerRowIdx]
    const nameRow = rows[1] ?? []  // 2행: 매장명
    for (let colIdx = 12; colIdx < headerRow.length; colIdx++) {
      const code = String(headerRow[colIdx] ?? '').trim()
      const name = String(nameRow[colIdx] ?? '').trim()
      // 알파뉴메릭 코드 허용 (숫자전용 + C13N 같은 코드), 한글 포함 시 제외
      if (code && /^[A-Z0-9]+$/i.test(code)) {
        branchColumns.push({ code, colIdx, name: name || undefined })
      }
    }

    // ERP 양식: ARTICLE 헤더 다음 행부터 데이터, B열(index 1)에서 브랜드명 추출
    for (let i = headerRowIdx + 1; i < rows.length; i++) {
      const row = rows[i]
      if (!brandName) brandName = String(row[1] ?? '').trim()  // B열: 스타일그룹명
      const styleCode = String(row[7] ?? '').trim()    // H열: ARTICLE
      const styleColor = String(row[8] ?? '').trim()   // I열: "품명, 컬러, 사이즈"
      const availableStock = Number(row[10] ?? 0)      // K열: 가용재고
      const year = Number(row[5] ?? 0) || undefined    // F열: 판매 년도
      const season = Number(row[6] ?? 0) || undefined  // G열: 판매 계절

      if (!styleCode || isNaN(availableStock) || availableStock <= 0) continue

      const parts = styleColor.split(',').map((s) => s.trim())
      const productName = parts[0] ?? styleColor
      const color = parts[1] ?? ''
      const size = parts[2] ?? ''

      results.push({ styleCode, productName, color, size, availableStock, year, season })
    }
  } else {
    // 구버전 양식
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      const styleCode = String(row[0] ?? '').trim()
      const productName = String(row[1] ?? '').trim()
      const color = String(row[2] ?? '').trim()
      const size = String(row[3] ?? '').trim()
      const availableStock = Number(row[4] ?? 0)
      if (!styleCode || isNaN(availableStock) || availableStock <= 0) continue
      results.push({ styleCode, productName, color, size, availableStock })
    }
  }

  return { rows: results, branchColumns, fileBuffer: buf, brandName }
}

// ─── 2. 매장·매출 파싱 ──────────────────────────────────────────────
// ERP 양식 (전년대비 매출 성장율):
//   7행~: D=매장코드 | E=매장명 | F=올해매출(KRW) | G=작년매출 | H=전년비성장률(%)
//   H=-100 → 클로징 매장(X등급), H=0 → 비매장(고객센터/본사 등, 제외)
// 구버전 양식:
//   1행 헤더: A=매장코드 | B=매장명 | C=매출액(원) | D=매출성장률(%)
export async function parseSalesExcel(file: File): Promise<ParsedSalesRow[]> {
  const buf = await readFileBuffer(file)
  const wb = XLSX.read(buf, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = getRows(ws)

  // 첫 3행 안에 '성장율' 또는 '성장률'이 있으면 ERP 양식으로 판별
  const isErpFormat = rows.slice(0, 3).some((row) =>
    row.some((v) => String(v).includes('성장율') || String(v).includes('성장률'))
  )

  const results: ParsedSalesRow[] = []

  if (isErpFormat) {
    // ERP 양식 (전년대비 매출 성장율):
    // C(2)=매장코드 | D(3)=매장명 | E(4)=올해매출 | G(6)=전년비성장률
    // C열이 숫자 코드인 행만 처리 (합계/브랜드 집계행 제외)
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const code = String(row[2] ?? '').trim()   // C열: 매장코드
      const name = String(row[3] ?? '').trim()   // D열: 매장명
      const sales = Number(row[4] ?? 0)          // E열: 올해 매출
      const growthRate = Number(row[6] ?? 0)     // G열: 전년비 성장률

      // C열이 숫자 코드가 아니면 합계/브랜드 집계행 → skip
      if (!code || !name || !/^\d+$/.test(code)) continue
      // 매출=0이고 성장률=0이면 비매장(고객센터/본사/물류) → skip
      if (sales === 0 && growthRate === 0) continue

      results.push({ code, name, sales, growthRate })
    }
  } else {
    // 구버전 양식: 1행 헤더, 2행~부터 데이터
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      const code = String(row[0] ?? '').trim()
      const name = String(row[1] ?? '').trim()
      const sales = Number(row[2] ?? 0)
      const growthRate = Number(row[3] ?? 0)
      if (!code || !name) continue
      results.push({ code, name, sales, growthRate })
    }
  }

  return results
}

// ─── 3. 소진율 파싱 ─────────────────────────────────────────────────
// ERP 양식 (점입고대비판매율):
//   5행~: B=지점코드 | C=지점명 | F=스타일코드(9자리) | S=판매율(%)
//   B열이 숫자 코드인 행만 처리 (합계행 등 제외)
// 구버전 양식:
//   1행 헤더: A=매장코드 | B=스타일코드 | C=소진율(0~100 또는 0~1)
export async function parseClearanceExcel(file: File): Promise<ParsedClearanceRow[]> {
  const buf = await readFileBuffer(file)
  const wb = XLSX.read(buf, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = getRows(ws)

  // R열(index 17)에 "판매율" 이 있으면 점입고대비판매율 ERP 양식으로 판별
  const isErpFormat = rows.slice(0, 3).some(
    (row) => String(row[17] ?? '').includes('판매율')
  )

  const results: ParsedClearanceRow[] = []

  if (isErpFormat) {
    // ERP 양식 (점입고대비판매율): 4행(index 3)부터 데이터
    // A(0)=지점코드 | E(4)=스타일코드(9자리) | R(17)=판매율(%)
    for (let i = 3; i < rows.length; i++) {
      const row = rows[i]
      const branchCode = String(row[0] ?? '').trim()   // A열: 지점코드
      const styleCode = String(row[4] ?? '').trim()    // E열: 스타일코드(9자리)
      const rate = Number(row[17] ?? 0)                // R열: 판매율(%)

      // 한글 포함(합계행/브랜드행) 또는 비어있는 행 skip, 알파뉴메릭 코드는 허용
      if (!branchCode || !styleCode || !/^[A-Z0-9]+$/i.test(branchCode)) continue
      if (isNaN(rate)) continue

      results.push({ branchCode, styleCode, clearanceRate: rate })
    }
  } else {
    // 구버전 양식
    let maxRate = 0
    const rawRows: { branchCode: string; styleCode: string; rate: number }[] = []
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      const branchCode = String(row[0] ?? '').trim()
      const styleCode = String(row[1] ?? '').trim()
      const rate = Number(row[2] ?? 0)
      if (!branchCode || !styleCode || isNaN(rate)) continue
      if (rate > maxRate) maxRate = rate
      rawRows.push({ branchCode, styleCode, rate })
    }
    const scale = maxRate <= 1 ? 100 : 1
    rawRows.forEach((r) => results.push({
      branchCode: r.branchCode,
      styleCode: r.styleCode,
      clearanceRate: r.rate * scale,
    }))
  }

  return results
}

// ─── 등급 산정 헬퍼 ────────────────────────────────────────────────
function computeGradeMap(salesData: ParsedSalesRow[]): Map<string, Grade> {
  const active = salesData.filter((d) => d.growthRate !== -100 && d.sales > 0)
  const gradeMap = new Map<string, Grade>()
  if (!active.length) return gradeMap

  const totalSales = active.reduce((s, d) => s + d.sales, 0)
  const minS = Math.min(...active.map((d) => d.sales / totalSales))
  const maxS = Math.max(...active.map((d) => d.sales / totalSales))

  const scored = active.map((d) => {
    const share = d.sales / totalSales
    const normS = maxS !== minS ? (share - minS) / (maxS - minS) : 0.5
    return { code: d.code, score: normS }
  })
  scored.sort((a, b) => b.score - a.score)
  const n = scored.length

  const gradeOf = (rank: number): Grade => {
    const p = rank / n
    if (p < 0.1) return 'A'
    if (p < 0.3) return 'B'
    if (p < 0.6) return 'C'
    if (p < 0.9) return 'D'
    return 'E'
  }
  scored.forEach((d, i) => gradeMap.set(d.code, gradeOf(i)))
  return gradeMap
}

// ─── 데이터 변환: Branch[] (가용재고 컬럼 순서 기준) ──────────────────
// 가용재고 파일의 매장 컬럼 순서를 따르며, 매출 파일에서 이름/등급 매칭
// 매출 파일에만 있는 매장은 무시, 가용재고에만 있는 매장은 X등급
export function buildBranchesFromStockAndSales(
  branchColumns: BranchColumn[],
  salesData: ParsedSalesRow[]
): Branch[] {
  const gradeMap = computeGradeMap(salesData)
  const closedSet = new Set(salesData.filter((d) => d.growthRate === -100).map((d) => d.code))

  // 매장코드 → 매출데이터 맵
  const byCode = new Map(salesData.map((s) => [s.code, s]))

  // 매장명 → 매출데이터 맵 (코드 불일치 시 이름으로 fallback)
  // 이름 정규화: 공백 제거 + 소문자 ("분당점" = "분당점")
  const normalize = (s: string) => s.replace(/\s/g, '').toLowerCase()
  const byName = new Map(salesData.map((s) => [normalize(s.name), s]))

  if (branchColumns.length > 0) {
    return branchColumns.map(({ code, name: stockName }) => {
      // 1순위: 코드 매칭
      let matched = byCode.get(code)
      // 2순위: 매장명 매칭 (C13N처럼 코드 체계가 다를 때)
      if (!matched && stockName) {
        matched = byName.get(normalize(stockName))
      }

      const salesCode = matched?.code ?? code
      return {
        id: `br_${code}`,
        code,
        name: matched?.name ?? stockName ?? code,
        grade: closedSet.has(salesCode)
          ? ('X' as Grade)
          : matched && gradeMap.has(salesCode)
          ? (gradeMap.get(salesCode) as Grade)
          : ('X' as Grade),
      }
    })
  }
  // 구버전: 매출 파일 기준으로 Branch 생성 (기존 동작)
  return buildBranchesFromSales(salesData)
}

// ─── 데이터 변환: Branch[] (매출 파일만 있을 때 기존 동작) ────────────
export function buildBranchesFromSales(salesData: ParsedSalesRow[]): Branch[] {
  const gradeMap = computeGradeMap(salesData)
  return salesData.map((d) => ({
    id: `br_${d.code}`,
    code: d.code,
    name: d.name,
    grade:
      d.growthRate === -100
        ? ('X' as Grade)
        : (gradeMap.get(d.code) ?? ('C' as Grade)),
  }))
}

// ─── 데이터 변환: StyleItem[] ────────────────────────────────────────
export function buildStylesFromStock(stockData: ParsedStockRow[]): StyleItem[] {
  return stockData.map((s, i) => ({
    id: `st_${i + 1}_${s.styleCode}`,
    no: i + 1,
    styleCode: s.styleCode,
    productName: s.productName,
    color: s.color,
    size: s.size,
    availableStock: s.availableStock,
    year: s.year,
    season: s.season,
  }))
}

// ─── 데이터 변환: ClearanceData[] ───────────────────────────────────
export function buildClearanceData(
  rawData: ParsedClearanceRow[],
  branches: Branch[]
): ClearanceData[] {
  const codeToId = new Map(branches.map((b) => [b.code, b.id]))
  return rawData
    .filter((r) => codeToId.has(r.branchCode))
    .map((r) => ({
      key: r.styleCode.length >= 9 ? r.styleCode.substring(0, 9) : r.styleCode,
      type: 'style' as const,
      branchId: codeToId.get(r.branchCode)!,
      clearanceRate: r.clearanceRate,
    }))
}

// ─── 양식 다운로드 ───────────────────────────────────────────────────
export function downloadStockTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['스타일코드', '상품명', '컬러', '사이즈', '가용재고수량'],
    ['ABCD1234A01BLK', '여름 티셔츠', 'BLK', '01', 30],
    ['ABCD1234A02WHT', '여름 티셔츠', 'WHT', '02', 15],
    ['ABCD1234B01RED', '데님 팬츠', 'RED', '01', 8],
  ])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '가용재고')
  XLSX.writeFile(wb, '가용재고_양식.xlsx')
}

export function downloadSalesTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['매장코드', '매장명', '매출액(원)', '매출성장률(%) *폐점=-100'],
    ['7204', '분당점', 150000000, 12.5],
    ['8201', '강남점', 280000000, 8.3],
    ['7301', '야탑점', 95000000, -3.2],
    ['9901', '폐점매장', 0, -100],
  ])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '매장매출')
  XLSX.writeFile(wb, '매장매출_양식.xlsx')
}

export function downloadClearanceTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['매장코드', '스타일코드(9자리 또는 전체)', '소진율(0~100 또는 0~1)'],
    ['7204', 'ABCD1234A', 85.5],
    ['8201', 'ABCD1234A', 62.0],
    ['7301', 'ABCD1234A', 41.3],
    ['7204', 'ABCD1234B', 100.0],
  ])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '소진율')
  XLSX.writeFile(wb, '소진율_양식.xlsx')
}
