'use client'

import { useState, useMemo } from 'react'
import { Branch, DistributionData, StyleItem } from '@/lib/types'
import { INITIAL_BRANCHES, INITIAL_STYLES } from '@/lib/sampleData'
import { calculateDistribution } from '@/lib/calculations'
import { exportToExcel } from '@/lib/exportExcel'
import ControlBar from '@/components/ControlBar'
import DistributionTable from '@/components/DistributionTable'
import GradeSettingsModal from '@/components/GradeSettingsModal'

export default function Home() {
  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES)
  const [styles] = useState<StyleItem[]>(INITIAL_STYLES)
  const [ratio, setRatio] = useState(50)
  const [data, setData] = useState<DistributionData>({})
  const [showGradeModal, setShowGradeModal] = useState(false)

  const isCalculated = Object.keys(data).length > 0
  const availableTotal = useMemo(
    () => styles.reduce((s, st) => s + st.availableStock, 0),
    [styles]
  )

  function handleCalculate() {
    setData(calculateDistribution(styles, branches, ratio / 100))
  }

  function handleReset() {
    setData({})
  }

  function handleCellChange(styleId: string, branchId: string, value: number) {
    setData((prev) => ({
      ...prev,
      [styleId]: { ...(prev[styleId] ?? {}), [branchId]: value },
    }))
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#F8FAFF',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div
        style={{
          background: '#1D4ED8',
          color: '#fff',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '0.5px' }}>
          인디고키즈 이월상품 분배장 시스템
        </span>
        <span style={{ fontSize: '12px', opacity: 0.8 }}>
          {new Date().toLocaleDateString('ko-KR', {
            year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
          })}
        </span>
      </div>

      <div style={{ flexShrink: 0 }}>
        <ControlBar
          ratio={ratio}
          onRatioChange={setRatio}
          onCalculate={handleCalculate}
          onReset={handleReset}
          onExport={() => exportToExcel(styles, branches, data, ratio)}
          onGradeSettings={() => setShowGradeModal(true)}
          isCalculated={isCalculated}
        />
      </div>

      <div style={{ flex: 1, overflow: 'hidden', padding: '12px', display: 'flex', flexDirection: 'column' }}>
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
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1e3a8a',
            color: '#fff',
            padding: '10px 24px',
            borderRadius: '24px',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            pointerEvents: 'none',
          }}
        >
          분배율을 설정하고 "자동 분배 계산" 버튼을 눌러주세요
        </div>
      )}

      {showGradeModal && (
        <GradeSettingsModal
          branches={branches}
          onUpdate={setBranches}
          onClose={() => setShowGradeModal(false)}
        />
      )}
    </div>
  )
}
