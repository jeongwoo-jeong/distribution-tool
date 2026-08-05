'use client'

interface ControlBarProps {
  ratio: number
  onRatioChange: (v: number) => void
  onCalculate: () => void
  onReset: () => void
  onExport: () => void
  onDataUpload: () => void      // 브랜드 데이터 업로드
  onGradeSettings: () => void   // 등급 수동 조정
  isCalculated: boolean
  hasClearanceData: boolean
  branchCount: number
  styleCount: number
}

export default function ControlBar({
  ratio, onRatioChange, onCalculate, onReset, onExport,
  onDataUpload, onGradeSettings,
  isCalculated, hasClearanceData, branchCount, styleCount,
}: ControlBarProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 16px', background: '#F0F4FF', borderBottom: '2px solid #B0C4FF', flexWrap: 'wrap' }}>

      {/* 분배율 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e3a8a', whiteSpace: 'nowrap' }}>분배율</span>
        <button
          onClick={() => onRatioChange(Math.max(10, ratio - 5))}
          disabled={ratio <= 10}
          style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #93C5FD', background: ratio <= 10 ? '#F3F4F6' : '#fff', color: ratio <= 10 ? '#9CA3AF' : '#1D4ED8', fontWeight: 700, fontSize: '14px', cursor: ratio <= 10 ? 'not-allowed' : 'pointer', lineHeight: 1 }}
        >−</button>
        <input
          type="range" min={10} max={80} step={5} value={ratio}
          onChange={(e) => onRatioChange(Number(e.target.value))}
          style={{ width: '110px', accentColor: '#2563EB', cursor: 'pointer' }}
        />
        <button
          onClick={() => onRatioChange(Math.min(80, ratio + 5))}
          disabled={ratio >= 80}
          style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #93C5FD', background: ratio >= 80 ? '#F3F4F6' : '#fff', color: ratio >= 80 ? '#9CA3AF' : '#1D4ED8', fontWeight: 700, fontSize: '14px', cursor: ratio >= 80 ? 'not-allowed' : 'pointer', lineHeight: 1 }}
        >+</button>
        <span style={{ fontSize: '15px', fontWeight: 700, color: '#1D4ED8', minWidth: '40px', textAlign: 'center' }}>
          {ratio}%
        </span>
      </div>

      <Divider />

      {/* 데이터 업로드 */}
      <button onClick={onDataUpload} style={{ ...btn('#1D4ED8'), display: 'flex', alignItems: 'center', gap: '5px' }}>
        📂 브랜드 데이터 업로드
      </button>

      {/* 현재 데이터 현황 */}
      {(branchCount > 0 || styleCount > 0) && (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', background: '#DBEAFE', color: '#1D4ED8', borderRadius: '4px', padding: '2px 8px', fontWeight: 600 }}>
            매장 {branchCount}개
          </span>
          <span style={{ fontSize: '11px', background: '#F0FDF4', color: '#15803D', borderRadius: '4px', padding: '2px 8px', fontWeight: 600 }}>
            품목 {styleCount}개
          </span>
          {hasClearanceData && (
            <span style={{ fontSize: '11px', background: '#F0F9FF', color: '#0369A1', borderRadius: '4px', padding: '2px 8px', fontWeight: 600 }}>
              소진율 ✓
            </span>
          )}
        </div>
      )}

      <Divider />

      {/* 등급 수동 조정 */}
      <button onClick={onGradeSettings} style={btn('#4B5563')}>⚙ 등급 수동 조정</button>

      <Divider />

      {/* 실행 */}
      <button onClick={onCalculate} style={btn('#16a34a')}>▶ 자동 분배 계산</button>
      <button onClick={onReset} style={btn('#DC2626')}>↺ 초기화</button>

      <div style={{ flex: 1 }} />

      {/* Excel 다운로드 */}
      <button
        onClick={onExport}
        disabled={!isCalculated}
        style={btn(isCalculated ? '#15803D' : '#9CA3AF', !isCalculated)}
      >
        ↓ Excel 출고장 다운로드
      </button>
    </div>
  )
}

function Divider() {
  return <div style={{ width: '1px', height: '26px', background: '#C7D7FF', flexShrink: 0 }} />
}

function btn(bg: string, disabled = false): React.CSSProperties {
  return {
    background: bg, color: '#fff', border: 'none', borderRadius: '4px',
    padding: '6px 12px', fontSize: '12px', fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
  }
}
