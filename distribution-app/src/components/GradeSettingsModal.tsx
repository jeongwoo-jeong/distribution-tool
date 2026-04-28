'use client'

import { Branch, Grade, GRADE_BG, GRADE_WEIGHTS } from '@/lib/types'

interface Props {
  branches: Branch[]
  onUpdate: (branches: Branch[]) => void
  onClose: () => void
}

const GRADES: Grade[] = ['A', 'B', 'C', 'D']

export default function GradeSettingsModal({ branches, onUpdate, onClose }: Props) {
  function setGrade(id: string, grade: Grade) {
    onUpdate(branches.map((b) => (b.id === id ? { ...b, grade } : b)))
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '8px',
          padding: '24px',
          minWidth: '480px',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e3a8a' }}>
            지점별 분배 등급 설정
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6B7280' }}>
            ✕
          </button>
        </div>

        {/* 등급 범례 */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {GRADES.map((g) => (
            <span
              key={g}
              style={{
                background: GRADE_BG[g],
                border: `1px solid #ccc`,
                borderRadius: '4px',
                padding: '3px 10px',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              {g}등급 ({(GRADE_WEIGHTS[g] * 100).toFixed(0)}%)
            </span>
          ))}
        </div>

        {/* 지점 목록 */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#EFF6FF' }}>
              <th style={th}>지점코드</th>
              <th style={th}>지점명</th>
              {GRADES.map((g) => (
                <th key={g} style={{ ...th, background: GRADE_BG[g] }}>
                  {g}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {branches.map((b, i) => (
              <tr key={b.id} style={{ background: i % 2 === 0 ? '#fff' : '#F9FAFB' }}>
                <td style={td}>{b.code}</td>
                <td style={td}>{b.name}</td>
                {GRADES.map((g) => (
                  <td key={g} style={{ ...td, textAlign: 'center' }}>
                    <input
                      type="radio"
                      name={b.id}
                      checked={b.grade === g}
                      onChange={() => setGrade(b.id, g)}
                      style={{ accentColor: '#2563EB', cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: '16px', textAlign: 'right' }}>
          <button
            onClick={onClose}
            style={{
              background: '#1D4ED8',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 24px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  )
}

const th: React.CSSProperties = {
  padding: '8px 10px',
  border: '1px solid #D1D5DB',
  fontWeight: 700,
  textAlign: 'center',
  fontSize: '12px',
}

const td: React.CSSProperties = {
  padding: '7px 10px',
  border: '1px solid #E5E7EB',
}
