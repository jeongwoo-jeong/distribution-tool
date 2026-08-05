'use client'

import { Branch, StyleItem, DistributionData, GRADE_BG, GRADE_BORDER } from '@/lib/types'
import { getTotalByStyle, getTotalByBranch, getGrandTotal } from '@/lib/calculations'

interface Props {
  styles: StyleItem[]
  branches: Branch[]
  data: DistributionData
  onCellChange: (styleId: string, branchId: string, value: number) => void
  availableTotal: number
  distributionRatio: number
  brandName?: string
}

const FIXED_COL_WIDTH = [40, 110, 90, 68, 50, 80, 72]
const BRANCH_COL_WIDTH = 64

export default function DistributionTable({
  styles,
  branches,
  data,
  onCellChange,
  availableTotal,
  distributionRatio,
  brandName,
}: Props) {
  const grandTotal = getGrandTotal(data)
  const isCalculated = Object.keys(data).length > 0

  return (
    <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
      <table
        style={{
          borderCollapse: 'collapse',
          fontSize: '12px',
          fontFamily: 'Arial, sans-serif',
          tableLayout: 'fixed',
          minWidth: `${FIXED_COL_WIDTH.reduce((a, b) => a + b, 0) + branches.length * BRANCH_COL_WIDTH + 70}px`,
        }}
      >
        {/* Column widths */}
        <colgroup>
          <col style={{ width: FIXED_COL_WIDTH[0] }} />
          <col style={{ width: FIXED_COL_WIDTH[1] }} />
          <col style={{ width: FIXED_COL_WIDTH[2] }} />
          <col style={{ width: FIXED_COL_WIDTH[3] }} />
          <col style={{ width: FIXED_COL_WIDTH[4] }} />
          <col style={{ width: FIXED_COL_WIDTH[5] }} />
          <col style={{ width: FIXED_COL_WIDTH[6] }} />
          {branches.map((b) => (
            <col key={b.id} style={{ width: BRANCH_COL_WIDTH }} />
          ))}
          <col style={{ width: 70 }} />
        </colgroup>

        <thead>
          {/* Row 1: Title */}
          <tr>
            <td
              colSpan={7 + branches.length + 1}
              style={{
                ...headerCell,
                background: '#1D4ED8',
                color: '#fff',
                fontSize: '15px',
                fontWeight: 700,
                textAlign: 'center',
                padding: '10px',
                letterSpacing: '1px',
              }}
            >
              {brandName ? `${brandName} 이월상품 분배장` : '이월상품 분배장'}
            </td>
          </tr>

          {/* Row 2: Meta info */}
          <tr>
            <td colSpan={3} style={{ ...metaCell, textAlign: 'left' }}>
              작성일: {new Date().toLocaleDateString('ko-KR')}
            </td>
            <td colSpan={2} style={metaCell}>
              가용재고 합계: <strong>{availableTotal.toLocaleString()}</strong>
            </td>
            <td colSpan={2} style={metaCell}>
              분배율: <strong>{distributionRatio}%</strong>
            </td>
            <td colSpan={branches.length + 1} style={{ ...metaCell, textAlign: 'right' }}>
              총 분배량: <strong style={{ color: '#1D4ED8' }}>{grandTotal.toLocaleString()}</strong>
            </td>
          </tr>

          {/* Row 3: Branch grade header */}
          <tr style={{ background: '#DBEAFE' }}>
            <td colSpan={7} style={{ ...headerCell, background: '#EFF6FF' }} />
            {branches.map((b) => (
              <td
                key={b.id}
                style={{
                  ...headerCell,
                  background: GRADE_BG[b.grade],
                  borderBottom: `3px solid ${GRADE_BORDER[b.grade]}`,
                  textAlign: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#374151',
                }}
              >
                {b.grade}등급
              </td>
            ))}
            <td style={{ ...headerCell, background: '#EFF6FF' }} />
          </tr>

          {/* Row 4: Column headers */}
          <tr style={{ background: '#1e3a8a' }}>
            {['No.', '스타일코드', '품명', '컬러', '사이즈', '가용재고', '분배량'].map((h) => (
              <td key={h} style={{ ...headerCell, color: '#fff', background: '#1e3a8a' }}>
                {h}
              </td>
            ))}
            {branches.map((b) => (
              <td
                key={b.id}
                style={{
                  ...headerCell,
                  background: '#1e3a8a',
                  color: '#fff',
                  fontSize: '11px',
                  maxWidth: BRANCH_COL_WIDTH,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  padding: '4px 3px',
                }}
                title={b.name}
              >
                {b.name.length > 6 ? b.name.slice(0, 6) + '…' : b.name}
              </td>
            ))}
            <td style={{ ...headerCell, color: '#fff', background: '#1e3a8a' }}>합계</td>
          </tr>
        </thead>

        <tbody>
          {styles.map((style, idx) => {
            const rowTotal = getTotalByStyle(data, style.id)
            const distQty = data[style.id] ? Object.values(data[style.id]).reduce((s, v) => s + v, 0) : 0

            return (
              <tr
                key={style.id}
                style={{ background: idx % 2 === 0 ? '#fff' : '#F8FAFF' }}
              >
                <td style={{ ...cell, textAlign: 'center', color: '#6B7280' }}>{style.no}</td>
                <td style={{ ...cell, fontFamily: 'monospace', fontSize: '11px' }}>{style.styleCode}</td>
                <td style={{ ...cell, fontWeight: 600 }}>{style.productName}</td>
                <td style={{ ...cell, textAlign: 'center' }}>{style.color}</td>
                <td style={{ ...cell, textAlign: 'center', fontWeight: 600 }}>{style.size}</td>
                <td style={{ ...cell, textAlign: 'right', fontWeight: 600 }}>
                  {style.availableStock.toLocaleString()}
                </td>
                <td
                  style={{
                    ...cell,
                    textAlign: 'right',
                    color: distQty > 0 ? '#1D4ED8' : '#9CA3AF',
                    fontWeight: 600,
                  }}
                >
                  {distQty > 0 ? distQty.toLocaleString() : '-'}
                </td>

                {branches.map((b) => {
                  const val = data[style.id]?.[b.id] ?? 0
                  return (
                    <td
                      key={b.id}
                      style={{
                        ...cell,
                        textAlign: 'center',
                        background: idx % 2 === 0
                          ? `${GRADE_BG[b.grade]}55`
                          : `${GRADE_BG[b.grade]}99`,
                        padding: '1px 2px',
                      }}
                    >
                      <input
                        type="number"
                        min={0}
                        value={val === 0 ? '' : val}
                        placeholder={isCalculated ? '0' : ''}
                        onChange={(e) => {
                          const n = parseInt(e.target.value, 10)
                          onCellChange(style.id, b.id, isNaN(n) ? 0 : n)
                        }}
                        style={{
                          width: '100%',
                          border: 'none',
                          background: 'transparent',
                          textAlign: 'center',
                          fontSize: '12px',
                          fontWeight: val > 0 ? 600 : 400,
                          color: val > 0 ? '#111827' : '#D1D5DB',
                          outline: 'none',
                          padding: '3px 0',
                        }}
                        onFocus={(e) => (e.target.style.background = '#EFF6FF')}
                        onBlur={(e) => (e.target.style.background = 'transparent')}
                      />
                    </td>
                  )
                })}

                <td
                  style={{
                    ...cell,
                    textAlign: 'right',
                    fontWeight: 700,
                    color: rowTotal > 0 ? '#1D4ED8' : '#9CA3AF',
                    background: idx % 2 === 0 ? '#EFF6FF' : '#DBEAFE',
                  }}
                >
                  {rowTotal > 0 ? rowTotal.toLocaleString() : '-'}
                </td>
              </tr>
            )
          })}
        </tbody>

        {/* Footer totals */}
        <tfoot>
          <tr style={{ background: '#1e3a8a', color: '#fff', fontWeight: 700 }}>
            <td colSpan={5} style={{ ...footerCell, textAlign: 'center' }}>
              합 계
            </td>
            <td style={{ ...footerCell, textAlign: 'right' }}>
              {styles.reduce((s, st) => s + st.availableStock, 0).toLocaleString()}
            </td>
            <td style={{ ...footerCell, textAlign: 'right' }}>
              {getGrandTotal(data).toLocaleString() || '-'}
            </td>
            {branches.map((b) => (
              <td key={b.id} style={{ ...footerCell, textAlign: 'center' }}>
                {getTotalByBranch(data, b.id) || '-'}
              </td>
            ))}
            <td style={{ ...footerCell, textAlign: 'right', color: '#FDE68A' }}>
              {grandTotal.toLocaleString() || '-'}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

const headerCell: React.CSSProperties = {
  border: '1px solid #D1D5DB',
  padding: '5px 6px',
  fontWeight: 700,
  textAlign: 'center',
  fontSize: '12px',
  whiteSpace: 'nowrap',
}

const metaCell: React.CSSProperties = {
  border: '1px solid #D1D5DB',
  padding: '5px 8px',
  fontSize: '12px',
  background: '#F0F4FF',
  color: '#374151',
  textAlign: 'center',
}

const cell: React.CSSProperties = {
  border: '1px solid #E5E7EB',
  padding: '4px 6px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const footerCell: React.CSSProperties = {
  border: '1px solid #374151',
  padding: '6px 6px',
  fontSize: '12px',
  whiteSpace: 'nowrap',
}
