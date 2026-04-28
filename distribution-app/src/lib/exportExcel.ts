import * as XLSX from 'xlsx'
import { Branch, StyleItem, DistributionData, GRADE_WEIGHTS } from './types'
import { getTotalByStyle, getTotalByBranch, getGrandTotal } from './calculations'

export function exportToExcel(
  styles: StyleItem[],
  branches: Branch[],
  data: DistributionData,
  ratio: number
) {
  const wb = XLSX.utils.book_new()
  const rows: (string | number)[][] = []

  // Title
  rows.push(['인디고키즈 이월상품 분배장'])
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
  XLSX.writeFile(wb, `인디고키즈_분배장_${new Date().toISOString().slice(0, 10)}.xlsx`)
}
