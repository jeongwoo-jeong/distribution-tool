'use client'

interface ControlBarProps {
  ratio: number
  onRatioChange: (v: number) => void
  onCalculate: () => void
  onReset: () => void
  onExport: () => void
  onGradeSettings: () => void
  onSalesData: () => void
  onClearanceData: () => void
  isCalculated: boolean
  hasClearanceData: boolean
}

export default function ControlBar({
  ratio, onRatioChange, onCalculate, onReset, onExport,
  onGradeSettings, onSalesData, onClearanceData,
  isCalculated, hasClearanceData,
}: ControlBarProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 16px', background: '#F0F4FF', borderBottom: '2px solid #B0C4FF', flexWrap: 'wrap' }}>

      {/* 분배율 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e3a8a', whiteSpace: 'nowrap' }}>분배율</span>
        <input
          type="range" min={10} max={80} step={5} value={ratio}
          onChange={(e) => onRatioChange(Number(e.target.value))}
          style={{ width: '130px', accentColor: '#2563EB', cursor: 'pointer' }}
        />
        <span style={{ fontSize: '15px', fontWeight: 700, color: '#1D4ED8', minWidth: '40px', textAlign: 'center' }}>
          {ratio}%
        </span>
      </div>

      <Divider />

      {/* 그룹1: 등급/매출 설정 */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <button onClick={onGradeSettings} style={btn('#1e40af')}>⚙ 지점 등급 설정</button>
        <button onClick={onSalesData} style={btn('#7C3AED')}>📊 매출데이터 · 자동등급</button>
      </div>

      <Divider />

      {/* 그룹2: 소진율 */}
      <button
        onClick={onClearanceData}
        style={{ ...btn('#0369A1'), position: 'relative' }}
      >
        📈 소진율 우선분배
        {hasClearanceData && (
          <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#16a34a', color: '#fff', borderRadius: '50%', width: '14px', height: '14px', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>✓</span>
        )}
      </button>

      <Divider />

      {/* 그룹3: 실행 */}
      <button onClick={onCalculate} style={btn('#16a34a')}>▶ 자동 분배 계산</button>
      <button onClick={onReset} style={btn('#DC2626')}>↺ 초기화</button>

      <div style={{ flex: 1 }} />

      {/* Excel */}
      <button onClick={onExport} disabled={!isCalculated} style={btn(isCalculated ? '#15803D' : '#9CA3AF', !isCalculated)}>
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
