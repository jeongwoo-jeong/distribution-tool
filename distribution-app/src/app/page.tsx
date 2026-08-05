'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Branch, BranchColumn, ClearanceData, DistributionData, StyleItem } from '@/lib/types'
import { INITIAL_BRANCHES, INITIAL_STYLES, INITIAL_CLEARANCE } from '@/lib/sampleData'
import { calculateDistribution } from '@/lib/calculations'
import { exportToExcel, exportToStockFile } from '@/lib/exportExcel'
import ControlBar from '@/components/ControlBar'
import DistributionTable from '@/components/DistributionTable'
import GradeSettingsModal from '@/components/GradeSettingsModal'
import DataUploadModal from '@/components/DataUploadModal'

const SAVE_KEY = 'distribution-app-v1'

function loadSaved() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export default function Home() {
  const saved = useMemo(() => loadSaved(), [])

  const [branches, setBranches] = useState<Branch[]>(saved?.branches ?? INITIAL_BRANCHES)
  const [allStyles, setAllStyles] = useState<StyleItem[]>(saved?.allStyles ?? INITIAL_STYLES)
  const [clearanceData, setClearanceData] = useState<ClearanceData[]>(saved?.clearanceData ?? INITIAL_CLEARANCE)
  const [stockBuffer, setStockBuffer] = useState<ArrayBuffer | null>(null)
  const [branchColumns, setBranchColumns] = useState<BranchColumn[]>(saved?.branchColumns ?? [])

  const [brandName, setBrandName] = useState<string>(saved?.brandName ?? '')
  const [ratio, setRatio] = useState<number>(saved?.ratio ?? 50)
  const [data, setData] = useState<DistributionData>(saved?.data ?? {})
  const [search, setSearch] = useState('')

  // 필터 (빈 배열 = 전체)
  const [filterYears, setFilterYears] = useState<string[]>([])
  const [filterSeasons, setFilterSeasons] = useState<string[]>([])
  const [filterCategories, setFilterCategories] = useState<string[]>([])

  const [showGradeModal, setShowGradeModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [saveIndicator, setSaveIndicator] = useState<'saved' | 'saving' | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 자동 저장: branches/allStyles/clearanceData/data/ratio 변경 시
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaveIndicator('saving')
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify({ branches, allStyles, clearanceData, branchColumns, ratio, data, brandName }))
        setSaveIndicator('saved')
        setTimeout(() => setSaveIndicator(null), 2000)
      } catch { setSaveIndicator(null) }
    }, 1000)
  }, [branches, allStyles, clearanceData, branchColumns, ratio, data, brandName])

  // 브랜드 데이터 업로드 적용
  function handleDataApply(
    newBranches: Branch[],
    newStyles: StyleItem[],
    newClearance: ClearanceData[],
    newStockBuffer: ArrayBuffer,
    newBranchColumns: BranchColumn[],
    newBrandName: string
  ) {
    setBranches(newBranches)
    setAllStyles(newStyles)
    setClearanceData(newClearance)
    setStockBuffer(newStockBuffer)
    setBranchColumns(newBranchColumns)
    if (newBrandName) setBrandName(newBrandName)
    setData({})
    setSearch('')
    setFilterYears([])
    setFilterSeasons([])
    setFilterCategories([])
  }

  const SEASON_LABEL: Record<number, string> = { 1: '봄(SS)', 2: '여름(SU)', 3: '가을(FW)', 4: '겨울(WI)', 9: '공통' }

  const availableYears = useMemo(() => {
    const years = [...new Set(allStyles.map((s) => s.year).filter(Boolean))] as number[]
    return years.sort()
  }, [allStyles])

  const categoryOptions = useMemo(() => {
    const cats = [...new Set(allStyles.map((s) => s.styleCode.substring(2, 4)).filter(Boolean))]
    return cats.sort()
  }, [allStyles])

  // styles = 분배 계산 대상 (필터 적용)
  // DistributionTable은 allStyles 전체를 표시하되, data가 없는 항목은 공란
  const styles = useMemo(() => {
    let result = allStyles
    const q = search.trim().toLowerCase()
    if (q) result = result.filter(
      (s) =>
        s.productName.toLowerCase().includes(q) ||
        s.styleCode.toLowerCase().includes(q) ||
        s.color.toLowerCase().includes(q)
    )
    if (filterYears.length > 0) result = result.filter((s) => filterYears.includes(String(s.year)))
    if (filterSeasons.length > 0) result = result.filter((s) => filterSeasons.includes(String(s.season)))
    if (filterCategories.length > 0) result = result.filter((s) => filterCategories.includes(s.styleCode.substring(2, 4)))
    return result
  }, [allStyles, search, filterYears, filterSeasons, filterCategories])

  const isCalculated = Object.keys(data).length > 0
  const availableTotal = useMemo(
    () => styles.reduce((s, st) => s + st.availableStock, 0),
    [styles]
  )

  function handleCalculate() {
    // 필터가 적용된 styles만 분배 계산 → 나머지는 data에 없으므로 테이블에서 공란
    setData(calculateDistribution(styles, branches, ratio / 100, clearanceData))
  }

  function handleReset() {
    setData({})
    setSearch('')
  }

  function handleCellChange(styleId: string, branchId: string, value: number) {
    setData((prev) => ({
      ...prev,
      [styleId]: { ...(prev[styleId] ?? {}), [branchId]: value },
    }))
  }

  const activeBranchCount = branches.filter((b) => b.grade !== 'X').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F8FAFF', fontFamily: 'Arial, sans-serif' }}>

      {/* 타이틀바 */}
      <div style={{ background: '#1D4ED8', color: '#fff', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '0.5px' }}>
            이월상품 자동 분배장 시스템
          </span>
          {saveIndicator === 'saving' && (
            <span style={{ fontSize: '11px', opacity: 0.7 }}>저장 중...</span>
          )}
          {saveIndicator === 'saved' && (
            <span style={{ fontSize: '11px', opacity: 0.8 }}>✓ 자동 저장됨</span>
          )}
        </div>
        <span style={{ display: 'none' }}>{/* placeholder */}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="품명 / 스타일코드 / 컬러 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '5px 28px 5px 10px', borderRadius: '4px', border: 'none', fontSize: '12px', width: '240px', outline: 'none' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: '14px' }}>✕</button>
            )}
          </div>
          <span style={{ fontSize: '12px', opacity: 0.8 }}>
            {styles.length !== allStyles.length ? `${styles.length} / ${allStyles.length}개` : `총 ${allStyles.length}개 품목`}
          </span>
          <span style={{ fontSize: '12px', opacity: 0.8 }}>
            {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
          </span>
        </div>
      </div>

      {/* 필터 바 */}
      {allStyles.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: '#EFF6FF', borderBottom: '1px solid #BFDBFE', flexShrink: 0, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e3a8a' }}>분배 필터</span>

          {/* 년도 멀티셀렉트 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: '#6B7280' }}>년도:</span>
            {(availableYears.length > 0 ? availableYears : [2024, 2025]).map((y) => {
              const sel = filterYears.includes(String(y))
              return (
                <button key={y} onClick={() => { setFilterYears((prev) => sel ? prev.filter((v) => v !== String(y)) : [...prev, String(y)]); setData({}) }}
                  style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, border: `1px solid ${sel ? '#1D4ED8' : '#93C5FD'}`, background: sel ? '#1D4ED8' : '#fff', color: sel ? '#fff' : '#1e3a8a' }}>
                  {y}년
                </button>
              )
            })}
          </div>

          {/* 계절 멀티셀렉트 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: '#6B7280' }}>계절:</span>
            {[1,2,3,4,9].map((s) => {
              const sel = filterSeasons.includes(String(s))
              return (
                <button key={s} onClick={() => { setFilterSeasons((prev) => sel ? prev.filter((v) => v !== String(s)) : [...prev, String(s)]); setData({}) }}
                  style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, border: `1px solid ${sel ? '#1D4ED8' : '#93C5FD'}`, background: sel ? '#1D4ED8' : '#fff', color: sel ? '#fff' : '#1e3a8a' }}>
                  {SEASON_LABEL[s]}
                </button>
              )
            })}
          </div>

          {/* 카테고리 (최대 3개 토글) */}
          {categoryOptions.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: '#6B7280' }}>카테고리:</span>
              {categoryOptions.map((cat) => {
                const selected = filterCategories.includes(cat)
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setFilterCategories((prev) =>
                        prev.includes(cat) ? prev.filter((c) => c !== cat) : prev.length < 3 ? [...prev, cat] : prev
                      )
                      setData({})
                    }}
                    style={{
                      fontSize: '11px', padding: '2px 8px', borderRadius: '12px', cursor: 'pointer', fontWeight: 600,
                      border: `1px solid ${selected ? '#1D4ED8' : '#93C5FD'}`,
                      background: selected ? '#1D4ED8' : '#fff',
                      color: selected ? '#fff' : '#1e3a8a',
                    }}
                  >
                    {cat}
                  </button>
                )
              })}
              <span style={{ fontSize: '10px', color: '#9CA3AF' }}>최대 3개</span>
            </div>
          )}

          {/* 필터 초기화 */}
          {(filterYears.length > 0 || filterSeasons.length > 0 || filterCategories.length > 0) && (
            <button onClick={() => { setFilterYears([]); setFilterSeasons([]); setFilterCategories([]); setData({}) }}
              style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', border: '1px solid #FCA5A5', color: '#DC2626', background: '#FEF2F2', cursor: 'pointer' }}>
              필터 초기화
            </button>
          )}

          {/* 분배 대상 표시 */}
          {(filterYears.length > 0 || filterSeasons.length > 0 || filterCategories.length > 0) && (
            <span style={{ fontSize: '11px', color: '#1D4ED8', fontWeight: 600 }}>
              분배 대상: {styles.length}개 / 전체 {allStyles.length}개
            </span>
          )}
        </div>
      )}

      {/* 컨트롤 바 */}
      <div style={{ flexShrink: 0 }}>
        <ControlBar
          ratio={ratio}
          onRatioChange={setRatio}
          onCalculate={handleCalculate}
          onReset={handleReset}
          onExport={() => {
            if (stockBuffer && branchColumns.length > 0 && isCalculated) {
              exportToStockFile(stockBuffer, branchColumns, allStyles, branches, data, brandName)
            } else {
              exportToExcel(allStyles, branches, data, ratio, brandName)
            }
          }}
          onDataUpload={() => setShowUploadModal(true)}
          onGradeSettings={() => setShowGradeModal(true)}
          isCalculated={isCalculated}
          hasClearanceData={clearanceData.length > 0}
          branchCount={activeBranchCount}
          styleCount={allStyles.length}
        />
      </div>

      {/* 분배장 테이블 */}
      <div style={{ flex: 1, overflow: 'hidden', padding: '8px 12px 12px', display: 'flex', flexDirection: 'column' }}>
        <DistributionTable
          styles={allStyles}
          branches={branches}
          data={data}
          onCellChange={handleCellChange}
          availableTotal={availableTotal}
          distributionRatio={ratio}
          brandName={brandName}
        />
      </div>

      {!isCalculated && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: '#1e3a8a', color: '#fff', padding: '10px 24px', borderRadius: '24px', fontSize: '13px', fontWeight: 600, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', pointerEvents: 'none' }}>
          분배율을 설정하고 "자동 분배 계산" 버튼을 눌러주세요
        </div>
      )}

      {showGradeModal && (
        <GradeSettingsModal branches={branches} onUpdate={setBranches} onClose={() => setShowGradeModal(false)} />
      )}
      {showUploadModal && (
        <DataUploadModal onApply={handleDataApply} onClose={() => setShowUploadModal(false)} />
      )}
    </div>
  )
}
