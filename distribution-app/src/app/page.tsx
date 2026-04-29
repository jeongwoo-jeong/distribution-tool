'use client'

import { useState, useMemo } from 'react'
import { Branch, ClearanceData, DistributionData, StyleItem } from '@/lib/types'
import { INITIAL_BRANCHES, INITIAL_STYLES } from '@/lib/sampleData'
import { calculateDistribution } from '@/lib/calculations'
import { exportToExcel } from '@/lib/exportExcel'
import ControlBar from '@/components/ControlBar'
import DistributionTable from '@/components/DistributionTable'
import GradeSettingsModal from '@/components/GradeSettingsModal'
import SalesDataModal from '@/components/SalesDataModal'
import ClearanceDataModal from '@/components/ClearanceDataModal'

export default function Home() {
  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES)
  const [allStyles] = useState<StyleItem[]>(INITIAL_STYLES)
  const [ratio, setRatio] = useState(50)
  const [data, setData] = useState<DistributionData>({})
  const [clearanceData, setClearanceData] = useState<ClearanceData[]>([])
  const [search, setSearch] = useState('')

  const [showGradeModal, setShowGradeModal] = useState(false)
  const [showSalesModal, setShowSalesModal] = useState(false)
  const [showClearanceModal, setShowClearanceModal] = useState(false)

  const styles = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return allStyles
    return allStyles.filter(
      (s) =>
        s.productName.toLowerCase().includes(q) ||
        s.styleCode.toLowerCase().includes(q) ||
        s.color.toLowerCase().includes(q)
    )
  }, [allStyles, search])

  const isCalculated = Object.keys(data).length > 0
  const availableTotal = useMemo(
    () => styles.reduce((s, st) => s + st.availableStock, 0),
    [styles]
  )

  function handleCalculate() {
    setData(calculateDistribution(allStyles, branches, ratio / 100, clearanceData))
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F8FAFF', fontFamily: 'Arial, sans-serif' }}>

      {/* 타이틀바 */}
      <div style={{ background: '#1D4ED8', color: '#fff', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '0.5px' }}>
          인디고키즈 이월상품 분배장 시스템
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

      {/* 컨트롤 바 */}
      <div style={{ flexShrink: 0 }}>
        <ControlBar
          ratio={ratio}
          onRatioChange={setRatio}
          onCalculate={handleCalculate}
          onReset={handleReset}
          onExport={() => exportToExcel(allStyles, branches, data, ratio)}
          onGradeSettings={() => setShowGradeModal(true)}
          onSalesData={() => setShowSalesModal(true)}
          onClearanceData={() => setShowClearanceModal(true)}
          isCalculated={isCalculated}
          hasClearanceData={clearanceData.length > 0}
        />
      </div>

      {/* 분배장 테이블 */}
      <div style={{ flex: 1, overflow: 'hidden', padding: '8px 12px 12px', display: 'flex', flexDirection: 'column' }}>
        <DistributionTable
          styles={styles}
          branches={branches}
          data={data}
          onCellChange={handleCellChange}
          availableTotal={availableTotal}
          distributionRatio={ratio}
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
      {showSalesModal && (
        <SalesDataModal branches={branches} onApply={setBranches} onClose={() => setShowSalesModal(false)} />
      )}
      {showClearanceModal && (
        <ClearanceDataModal currentData={clearanceData} onApply={setClearanceData} onClose={() => setShowClearanceModal(false)} />
      )}
    </div>
  )
}
