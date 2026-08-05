import * as XLSX from 'xlsx'
import { Branch, BranchColumn, StyleItem, DistributionData, GRADE_WEIGHTS } from './types'
import { getTotalByStyle, getTotalByBranch, getGrandTotal } from './calculations'

export function exportToExcel(
  styles: StyleItem[],
  branches: Branch[],
  data: DistributionData,
  ratio: number,
  brandName = ''
) {
  const wb = XLSX.utils.book_new()
  const rows: (string | number)[][] = []
  const title = brandName ? `${brandName} 이월상품 분배장` : '이월상품 분배장'

  // Title
  rows.push([title])
  rows.push([
    `작성일: ${new Date().toLocaleDateString('ko-KR')}`,
    '',
    '',
    '',
    `분배율: ${ratio}%`,
    '',
    `총 분배량: ${getGrandTotal(data).toLocaleString()}`,
  ])
  rows.push([])

  // Grade row
  rows.push([
    '', '', '', '', '', '', '',
    ...branches.map((b) => `${b.grade}등급`),
    '',
  ])

  // Header
  rows.push([
    'No.', '스타일코드', '품명', '컬러', '사이즈', '가용재고', '분배량',
    ...branches.map((b) => b.name),
    '합계',
  ])

  // Data rows
  for (const style of styles) {
    rows.push([
      style.no,
      style.styleCode,
      style.productName,
      style.color,
      style.size,
      style.availableStock,
      getTotalByStyle(data, style.id) || '',
      ...branches.map((b) => data[style.id]?.[b.id] || ''),
      getTotalByStyle(data, style.id) || '',
    ])
  }

  // Footer
  rows.push([
    '합계', '', '', '', '',
    styles.reduce((s, st) => s + st.availableStock, 0),
    getGrandTotal(data),
    ...branches.map((b) => getTotalByBranch(data, b.id) || ''),
    getGrandTotal(data),
  ])

  const ws = XLSX.utils.aoa_to_sheet(rows)

  // Column widths
  ws['!cols'] = [
    { wch: 5 }, { wch: 14 }, { wch: 10 }, { wch: 8 }, { wch: 6 },
    { wch: 9 }, { wch: 9 },
    ...branches.map(() => ({ wch: 10 })),
    { wch: 9 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, '분배장')
  const prefix = brandName || '이월상품'
  XLSX.writeFile(wb, `${prefix}_분배장_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

// ─── 가용재고 원본 파일에 분배 수량 채워서 다운로드 ────────────────────
export function exportToStockFile(
  fileBuffer: ArrayBuffer,
  branchColumns: BranchColumn[],
  styles: StyleItem[],
  branches: Branch[],
  data: DistributionData,
  brandName = ''
) {
  const wb = XLSX.read(fileBuffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as unknown[][]

  // 시트 시작 행 오프셋: sheet_to_json 배열 인덱스 → 실제 셀 row 번호
  const sheetRange = ws['!ref'] ? XLSX.utils.decode_range(ws['!ref']) : { s: { r: 0 } }
  const rowOffset = sheetRange.s.r

  // ARTICLE 헤더행 찾기 (배열 인덱스 기준)
  let headerRowIdx = -1
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    if (String((rows[i] as unknown[])[7] ?? '').trim().toUpperCase() === 'ARTICLE') {
      headerRowIdx = i
      break
    }
  }
  if (headerRowIdx < 0) return

  // 매장코드 → branchId 맵
  const branchIdMap = new Map(branches.map((b) => [b.code, b.id]))
  // ARTICLE → StyleItem 목록 (파일 순서 보존)
  const stylesByArticle = new Map<string, string[]>()
  for (const s of styles) {
    if (!stylesByArticle.has(s.styleCode)) stylesByArticle.set(s.styleCode, [])
    stylesByArticle.get(s.styleCode)!.push(s.id)
  }
  const articleOccurrence = new Map<string, number>()

  for (let rowIdx = headerRowIdx + 1; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx] as unknown[]
    const article = String(row[7] ?? '').trim()
    if (!article) continue

    // 같은 ARTICLE이 여러 행일 때 순서대로 매핑
    const occurrence = articleOccurrence.get(article) ?? 0
    articleOccurrence.set(article, occurrence + 1)
    const styleIdList = stylesByArticle.get(article)
    const styleId = styleIdList?.[occurrence]
    if (!styleId || !data[styleId]) continue

    const distRow = data[styleId]
    const kVal = Number(row[10] ?? 0)  // K열: 가용재고
    let rowTotal = 0
    const countedBranches = new Set<string>()

    const sheetRowIdx = rowIdx + rowOffset  // 실제 셀 주소용 row 번호

    // 각 매장 컬럼에 분배 수량 채우기
    for (const { code, colIdx } of branchColumns) {
      const branchId = branchIdMap.get(code)
      const qty = branchId ? (distRow[branchId] ?? 0) : 0
      const cellRef = XLSX.utils.encode_cell({ r: sheetRowIdx, c: colIdx })
      if (qty > 0) {
        ws[cellRef] = { v: qty, t: 'n' }
      } else {
        delete ws[cellRef]
      }
      // 같은 매장코드가 헤더에 중복될 경우 합계 이중 계산 방지
      if (branchId && !countedBranches.has(branchId)) {
        rowTotal += qty
        countedBranches.add(branchId)
      }
    }

    // 안전장치: 출고합계가 가용재고 초과 방지
    const safeTotal = Math.min(rowTotal, kVal)

    // L열(index 11): 출고합계
    const lRef = XLSX.utils.encode_cell({ r: sheetRowIdx, c: 11 })
    ws[lRef] = { v: safeTotal, t: 'n' }

    // J열(index 9): 잔여 = K - L (항상 0 이상)
    const jRef = XLSX.utils.encode_cell({ r: sheetRowIdx, c: 9 })
    ws[jRef] = { v: Math.max(0, kVal - safeTotal), t: 'n' }
  }

  const date = new Date().toISOString().slice(0, 10)
  const prefix = brandName || '이월상품'
  XLSX.writeFile(wb, `${prefix}_가용재고_분배완료_${date}.xlsx`)
}
