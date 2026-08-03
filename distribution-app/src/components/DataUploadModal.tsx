'use client'

import { useState, useRef, useCallback } from 'react'
import { Branch, StyleItem, ClearanceData, Grade, GRADE_BG, GRADE_TEXT } from '@/lib/types'
import {
  parseStockExcel, parseSalesExcel, parseClearanceExcel,
  buildBranchesFromStockAndSales, buildStylesFromStock, buildClearanceData,
  downloadStockTemplate, downloadSalesTemplate, downloadClearanceTemplate,
  ParsedStockRow, ParsedSalesRow, ParsedClearanceRow,
} from '@/lib/excelParser'
import { BranchColumn } from '@/lib/types'

interface Props {
  onApply: (
    branches: Branch[],
    styles: StyleItem[],
    clearanceData: ClearanceData[],
    stockBuffer: ArrayBuffer,
    branchColumns: BranchColumn[]
  ) => void
  onClose: () => void
}

type UploadStatus = 'idle' | 'loading' | 'done' | 'error'

interface FileState {
  file: File | null
  status: UploadStatus
  message: string
}

const initFile = (): FileState => ({ file: null, status: 'idle', message: '' })

const GRADES: Grade[] = ['A', 'B', 'C', 'D', 'E', 'X']

export default function DataUploadModal({ onApply, onClose }: Props) {
  const [stockState, setStockState] = useState<FileState>(initFile())
  const [salesState, setSalesState] = useState<FileState>(initFile())
  const [clearanceState, setClearanceState] = useState<FileState>(initFile())

  const [parsedStock, setParsedStock] = useState<ParsedStockRow[]>([])
  const [parsedSales, setParsedSales] = useState<ParsedSalesRow[]>([])
  const [parsedClearance, setParsedClearance] = useState<ParsedClearanceRow[]>([])
  const [previewBranches, setPreviewBranches] = useState<Branch[]>([])
  const [stockBuffer, setStockBuffer] = useState<ArrayBuffer | null>(null)
  const [branchColumns, setBranchColumns] = useState<BranchColumn[]>([])

  const stockRef = useRef<HTMLInputElement>(null)
  const salesRef = useRef<HTMLInputElement>(null)
  const clearanceRef = useRef<HTMLInputElement>(null)

  // ─── 파일 핸들러 ──────────────────────────────────────────────────
  async function handleStockFile(file: File) {
    setStockState({ file, status: 'loading', message: '파싱 중...' })
    try {
      const result = await parseStockExcel(file)
      if (result.rows.length === 0) throw new Error('데이터가 없습니다')
      setParsedStock(result.rows)
      setStockBuffer(result.fileBuffer)
      setBranchColumns(result.branchColumns)
      const totalStock = result.rows.reduce((s, r) => s + r.availableStock, 0)
      const styleCount = new Set(result.rows.map((r) => r.styleCode.substring(0, 9))).size
      const branchInfo = result.branchColumns.length > 0 ? ` / 매장컬럼 ${result.branchColumns.length}개` : ''
      setStockState({ file, status: 'done', message: `${styleCount}개 스타일 / ${result.rows.length}개 SKU / 총 ${totalStock.toLocaleString()}장${branchInfo}` })
    } catch {
      setStockState({ file, status: 'error', message: '양식 오류: 헤더(스타일코드/상품명/컬러/사이즈/가용재고수량) 확인' })
      setParsedStock([])
      setStockBuffer(null)
      setBranchColumns([])
    }
  }

  async function handleSalesFile(file: File) {
    setSalesState({ file, status: 'loading', message: '파싱 중...' })
    try {
      const data = await parseSalesExcel(file)
      if (data.length === 0) throw new Error('데이터가 없습니다')
      setParsedSales(data)
      const branches = buildBranchesFromStockAndSales(branchColumns, data)
      setPreviewBranches(branches)
      const closed = data.filter((d) => d.growthRate === -100).length
      const active = data.length - closed
      setSalesState({ file, status: 'done', message: `총 ${data.length}개 매장 (영업 ${active}개 · 폐점 ${closed}개) → 등급 자동 산정 완료` })
    } catch {
      setSalesState({ file, status: 'error', message: '양식 오류: 헤더(매장코드/매장명/매출액/매출성장률) 확인' })
      setParsedSales([])
      setPreviewBranches([])
    }
  }

  async function handleClearanceFile(file: File) {
    setClearanceState({ file, status: 'loading', message: '파싱 중...' })
    try {
      const data = await parseClearanceExcel(file)
      if (data.length === 0) throw new Error('데이터가 없습니다')
      setParsedClearance(data)
      const styleCount = new Set(data.map((r) => r.styleCode.substring(0, 9))).size
      setClearanceState({ file, status: 'done', message: `${data.length.toLocaleString()}건 · ${styleCount}개 스타일 → 우선 분배 적용 예정` })
    } catch {
      setClearanceState({ file, status: 'error', message: '양식 오류: 헤더(매장코드/스타일코드/소진율) 확인' })
      setParsedClearance([])
    }
  }

  // ─── 드래그 앤 드롭 ───────────────────────────────────────────────
  const makeDrop = (handler: (f: File) => void) => ({
    onDragOver: (e: React.DragEvent) => e.preventDefault(),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file) handler(file)
    },
  })

  // ─── 적용 ─────────────────────────────────────────────────────────
  function handleApply() {
    if (!parsedStock.length || !parsedSales.length || !stockBuffer) return
    const branches = buildBranchesFromStockAndSales(branchColumns, parsedSales)
    const styles = buildStylesFromStock(parsedStock)
    const clearance = parsedClearance.length > 0
      ? buildClearanceData(parsedClearance, branches)
      : []
    onApply(branches, styles, clearance, stockBuffer, branchColumns)
    onClose()
  }

  const canApply = parsedStock.length > 0 && parsedSales.length > 0

  // ─── 등급 분포 집계 ───────────────────────────────────────────────
  const gradeCounts = GRADES.reduce((acc, g) => {
    acc[g] = previewBranches.filter((b) => b.grade === g).length
    return acc
  }, {} as Record<Grade, number>)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '12px', width: '620px', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column' }}>

        {/* 헤더 */}
        <div style={{ background: 'linear-gradient(135deg, #1D4ED8, #2563EB)', color: '#fff', padding: '18px 22px', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '17px' }}>📂 브랜드 데이터 업로드</div>
            <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '4px' }}>
              엑셀 파일 3개를 업로드하면 매장 등급이 자동 산정되고 분배장이 생성됩니다
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '22px', cursor: 'pointer', lineHeight: 1, marginTop: '-2px' }}>✕</button>
        </div>

        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* 양식 다운로드 안내 */}
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '12px 16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1D4ED8', marginBottom: '8px' }}>
              📥 표준 양식 다운로드 (처음 사용 시 양식에 맞게 데이터 정리)
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { label: '가용재고 양식', fn: downloadStockTemplate },
                { label: '매장·매출 양식', fn: downloadSalesTemplate },
                { label: '소진율 양식', fn: downloadClearanceTemplate },
              ].map(({ label, fn }) => (
                <button key={label} onClick={fn} style={{ padding: '5px 12px', background: '#fff', border: '1px solid #93C5FD', borderRadius: '5px', fontSize: '12px', color: '#1D4ED8', cursor: 'pointer', fontWeight: 600 }}>
                  ↓ {label}
                </button>
              ))}
            </div>
          </div>

          {/* 파일 1: 가용재고 */}
          <FileUploadZone
            step="1"
            label="가용재고 파일"
            required
            cols="스타일코드 · 상품명 · 컬러 · 사이즈 · 가용재고수량"
            state={stockState}
            inputRef={stockRef}
            accept=".xlsx,.xls"
            dropProps={makeDrop(handleStockFile)}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleStockFile(f) }}
          />

          {/* 파일 2: 매장·매출 */}
          <FileUploadZone
            step="2"
            label="매장 · 매출 데이터"
            required
            cols="매장코드 · 매장명 · 매출액(원) · 매출성장률(%) *폐점=-100"
            state={salesState}
            inputRef={salesRef}
            accept=".xlsx,.xls"
            dropProps={makeDrop(handleSalesFile)}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSalesFile(f) }}
          />

          {/* 등급 분포 미리보기 */}
          {previewBranches.length > 0 && (
            <div style={{ background: '#F8FAFF', border: '1px solid #E0E7FF', borderRadius: '8px', padding: '12px 16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>자동 산정된 매장 등급 분포</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {GRADES.map((g) => (
                  gradeCounts[g] > 0 && (
                    <div key={g} style={{ background: GRADE_BG[g], border: `1px solid`, borderColor: GRADE_TEXT[g] + '40', borderRadius: '6px', padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: GRADE_TEXT[g] }}>{g}</span>
                      <span style={{ fontSize: '12px', color: '#374151' }}>{gradeCounts[g]}개</span>
                    </div>
                  )
                ))}
              </div>
              <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '6px' }}>
                ※ 매출 비중 70% + 성장률 30% 기준 자동 산정 | 업로드 후 수동 조정 가능
              </div>
            </div>
          )}

          {/* 파일 3: 소진율 */}
          <FileUploadZone
            step="3"
            label="소진율 데이터"
            required={false}
            cols="매장코드 · 스타일코드(9자리) · 소진율(0~100 또는 0~1)"
            state={clearanceState}
            inputRef={clearanceRef}
            accept=".xlsx,.xls"
            dropProps={makeDrop(handleClearanceFile)}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleClearanceFile(f) }}
          />

          {/* 소진율 설명 */}
          {clearanceState.status === 'idle' && (
            <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '-8px', paddingLeft: '4px' }}>
              💡 소진율 데이터를 넣으면 해당 스타일을 잘 판매한 매장에 우선 분배됩니다
            </div>
          )}

          {/* 버튼 */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px', borderTop: '1px solid #E5E7EB', marginTop: '4px' }}>
            <button onClick={onClose} style={{ padding: '9px 20px', border: '1px solid #D1D5DB', borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '13px', color: '#374151' }}>
              취소
            </button>
            <button
              onClick={handleApply}
              disabled={!canApply}
              style={{
                padding: '9px 28px',
                background: canApply ? '#1D4ED8' : '#9CA3AF',
                color: '#fff', border: 'none', borderRadius: '6px',
                cursor: canApply ? 'pointer' : 'not-allowed',
                fontSize: '13px', fontWeight: 700,
                boxShadow: canApply ? '0 2px 8px rgba(29,78,216,0.3)' : 'none',
              }}
            >
              ✓ 분배장 생성
            </button>
          </div>

          {!canApply && (
            <div style={{ textAlign: 'center', fontSize: '12px', color: '#9CA3AF', marginTop: '-8px' }}>
              가용재고 파일과 매장·매출 데이터는 필수입니다
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── 파일 업로드 존 서브컴포넌트 ────────────────────────────────────
interface FileUploadZoneProps {
  step: string
  label: string
  required: boolean
  cols: string
  state: FileState
  inputRef: React.RefObject<HTMLInputElement | null>
  accept: string
  dropProps: object
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function FileUploadZone({ step, label, required, cols, state, inputRef, accept, dropProps, onChange }: FileUploadZoneProps) {
  const statusColor = state.status === 'done' ? '#16A34A'
    : state.status === 'error' ? '#DC2626'
    : state.status === 'loading' ? '#D97706'
    : '#6B7280'

  const zoneBorder = state.status === 'done' ? '#86EFAC'
    : state.status === 'error' ? '#FCA5A5'
    : '#D1D5DB'

  const zoneBg = state.status === 'done' ? '#F0FDF4'
    : state.status === 'error' ? '#FEF2F2'
    : '#FAFAFA'

  return (
    <div>
      <div style={{ fontSize: '13px', fontWeight: 700, color: '#1F2937', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ background: '#1D4ED8', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, flexShrink: 0 }}>{step}</span>
        {label}
        {required
          ? <span style={{ color: '#DC2626', fontSize: '11px' }}>필수</span>
          : <span style={{ color: '#9CA3AF', fontSize: '11px' }}>선택</span>
        }
      </div>
      <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '6px', paddingLeft: '26px' }}>컬럼 순서: {cols}</div>
      <div
        {...dropProps}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${zoneBorder}`,
          background: zoneBg,
          borderRadius: '8px',
          padding: '14px 16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          transition: 'all 0.15s',
        }}
      >
        <span style={{ fontSize: '24px', flexShrink: 0 }}>
          {state.status === 'done' ? '✅' : state.status === 'error' ? '❌' : state.status === 'loading' ? '⏳' : '📄'}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          {state.status === 'idle' ? (
            <div style={{ fontSize: '13px', color: '#6B7280' }}>
              클릭 또는 파일을 여기로 드래그하세요 (.xlsx)
            </div>
          ) : (
            <>
              <div style={{ fontSize: '12px', color: '#374151', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {state.file?.name}
              </div>
              <div style={{ fontSize: '12px', color: statusColor, marginTop: '2px' }}>
                {state.message}
              </div>
            </>
          )}
        </div>
        {state.status !== 'idle' && (
          <span style={{ fontSize: '11px', color: '#1D4ED8', flexShrink: 0, textDecoration: 'underline' }}>변경</span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          style={{ display: 'none' }}
          onChange={onChange}
          onClick={(e) => { (e.target as HTMLInputElement).value = '' }}
        />
      </div>
    </div>
  )
}
