'use client'

interface ControlBarProps {
  ratio: number
  onRatioChange: (v: number) => void
  onCalculate: () => void
  onReset: () => void
  onExport: () => void
  onGradeSettings: () => void
  isCalculated: boolean
}

export default function ControlBar({
  ratio,
  onRatioChange,
  onCalculate,
  onReset,
  onExport,
  onGradeSettings,
  isCalculated,
}: ControlBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '10px 16px',
        background: '#F0F4FF',
        borderBottom: '2px solid #B0C4FF',
        flexWrap: 'wrap',
      }}
    >
      {/* 분배율 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e3a8a', whiteSpace: 'nowrap' }}>
          분배율
        </span>
        <input
          type="range"
          min={10}
          max={80}
          step={5}
          value={ratio}
          onChange={(e) => onRatioChange(Number(e.target.value))}
          style={{ width: '140px', accentColor: '#2563EB', cursor: 'pointer' }}
        />
        <span
          style={{
            fontSize: '15px',
            fontWeight: 700,
            color: '#1D4ED8',
            minWidth: '42px',
            textAlign: 'center',
          }}
        >
          {ratio}%
        </span>
      </div>

      <div style={{ width: '1px', height: '28px', background: '#C7D7FF' }} />

      {/* 등급 설정 */}
      <button onClick={onGradeSettings} style={btnStyle('#1e40af', '#fff')}>
        ⚙ 지점 등급 설정
      </button>

      {/* 자동 계산 */}
      <button onClick={onCalculate} style={btnStyle('#16a34a', '#fff')}>
        ▶ 자동 분배 계산
      </button>

      {/* 초기화 */}
      <button onClick={onReset} style={btnStyle('#DC2626', '#fff')}>
        ↺ 초기화
      </button>

      <div style={{ flex: 1 }} />

      {/* Excel 다운로드 */}
      <button
        onClick={onExport}
        disabled={!isCalculated}
        style={btnStyle(isCalculated ? '#15803D' : '#9CA3AF', '#fff')}
      >
        ↓ Excel 출고장 다운로드
      </button>
    </div>
  )
}

function btnStyle(bg: string, color: string): React.CSSProperties {
  return {
    background: bg,
    color,
    border: 'none',
    borderRadius: '4px',
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: bg === '#9CA3AF' ? 'not-allowed' : 'pointer',
    whiteSpace: 'nowrap',
  }
}
