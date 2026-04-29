import * as XLSX from 'xlsx'
import { Branch, StyleItem, ClearanceData, Grade } from './types'

// ─── 파싱 결과 타입 ──────────────────────────────────────────────────
export interface ParsedStockRow {
  styleCode: string
  productName: string
  color: string
  size: string
  availableStock: number
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
// 헤더(1행): A=스타일코드 | B=상품명 | C=컬러 | D=사이즈 | E=가용재고수량
export async function parseStockExcel(file: File): Promise<ParsedStockRow[]> {
  const buf = await readFileBuffer(file)
  const wb = XLSX.read(buf, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = getRows(ws)

  const results: ParsedStockRow[] = []
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
  return results
}

// ─── 2. 매장·매출 파싱 ──────────────────────────────────────────────
// 헤더(1행): A=매장코드 | B=매장명 | C=매출액(원) | D=매출성장률(%) *폐점=-100
export async function parseSalesExcel(file: File): Promise<ParsedSalesRow[]> {
  const buf = await readFileBuffer(file)
  const wb = XLSX.read(buf, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = getRows(ws)

  const results: ParsedSalesRow[] = []
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const code = String(row[0] ?? '').trim()
    const name = String(row[1] ?? '').trim()
    const sales = Number(row[2] ?? 0)
    const growthRate = Number(row[3] ?? 0)
    if (!code || !name) continue
    results.push({ code, name, sales, growthRate })
  }
  return results
}

// ─── 3. 소진율 파싱 ─────────────────────────────────────────────────
// 헤더(1행): A=매장코드 | B=스타일코드 | C=소진율(0~100 또는 0~1)
export async function parseClearanceExcel(file: File): Promise<ParsedClearanceRow[]> {
  const buf = await readFileBuffer(file)
  const wb = XLSX.read(buf, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = getRows(ws)

  // 최대값 먼저 확인해서 0~1 vs 0~100 판별
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

  // 최대값이 1 이하면 소수(0~1), 초과면 백분율(0~100)
  const scale = maxRate <= 1 ? 100 : 1

  return rawRows.map((r) => ({
    branchCode: r.branchCode,
    styleCode: r.styleCode,
    clearanceRate: r.rate * scale, // 항상 0~100으로 통일
  }))
}

// ─── 데이터 변환: Branch[] ───────────────────────────────────────────
export function buildBranchesFromSales(salesData: ParsedSalesRow[]): Branch[] {
  const active = salesData.filter((d) => d.growthRate !== -100 && d.sales > 0)

  if (active.length === 0) {
    return salesData.map((d) => ({
      id: `br_${d.code}`,
      code: d.code,
      name: d.name,
      grade: 'X' as Grade,
    }))
  }

  const totalSales = active.reduce((s, d) => s + d.sales, 0)

  const minS = Math.min(...active.map((d) => d.sales / totalSales))
  const maxS = Math.max(...active.map((d) => d.sales / totalSales))
  const growthValues = active.map((d) => d.growthRate)
  const minG = Math.min(...growthValues)
  const maxG = Math.max(...growthValues)

  const scored = active.map((d) => {
    const share = d.sales / totalSales
    const normS = maxS !== minS ? (share - minS) / (maxS - minS) : 0.5
    const normG = maxG !== minG ? (d.growthRate - minG) / (maxG - minG) : 0.5
    return { code: d.code, score: 0.7 * normS + 0.3 * normG }
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

  const gradeMap = new Map(scored.map((d, i) => [d.code, gradeOf(i)]))

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
