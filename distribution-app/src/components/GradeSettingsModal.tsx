'use client'

import { Branch, Grade, GRADE_BG, GRADE_WEIGHTS, GRADE_LABELS, GRADE_TEXT } from '@/lib/types'

interface Props {
  branches: Branch[]
  onUpdate: (branches: Branch[]) => void
  onClose: () => void
}

const GRADES: Grade[] = ['A', 'B', 'C', 'D', 'E', 'X']

const GRADE_DESC: Record<Grade, string> = {
  A: '100%',
  B: '70%',
  C: '40%',
  D: '20%',
  E: '10%',
  X: '제외',
}

export default function GradeSettingsModal({ branches, onUpdate, onClose }: Props) {
  function setGrade(id: string, grade: Grade) {
    onUpdate(branches.map((b) => (b.id === id ? { ...b, grade } : b)))
  }

  const counts = GRADES.reduce((acc, g) => {
    acc[g] = branches.filter((b) => b.grade === g).length
    return acc
  }, {} as Record<Grade, number>)

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: '8px', padding: '24px',
          minWidth: '560px', maxHeight: '85vh', overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e3a8a' }}>
            지점별 분배 등급 설정
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6B7280' }}>✕</button>
        </div>

        {/* 등급 범례 */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {GRADES.map((g) => (
            <span key={g} style={{
              background: GRADE_BG[g], border: `1px solid #ccc`, borderRadius: '4px',
              padding: '3px 10px', fontSize: '12px', fontWeight: 600, color: GRADE_TEXT[g],
            }}>
              {GRADE_LABELS[g]} ({GRADE_DESC[g]}) &nbsp;
              <span style={{ fontWeight: 400, color: '#6B7280' }}>{counts[g]}개</span>
            </span>
          ))}
        </div>

        {/* 지점 목록 */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: '#1e3a8a' }}>
              <th style={{ ...th, color: '#fff', background: '#1e3a8a' }}>지점코드</th>
              <th style={{ ...th, color: '#fff', background: '#1e3a8a' }}>지점명</th>
              {GRADES.map((g) => (
                <th key={g} style={{ ...th, background: GRADE_BG[g], color: GRADE_TEXT[g], fontSize: '11px' }}>
                  {g === 'X' ? '제외' : g}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {branches.map((b, i) => (
              <tr key={b.id} style={{
                background: b.grade === 'X' ? '#F9FAFB' : (i % 2 === 0 ? '#fff' : '#F8FAFF'),
                opacity: b.grade === 'X' ? 0.6 : 1,
              }}>
                <td style={{ ...td, fontFamily: 'monospace', fontSize: '11px' }}>{b.code}</td>
                <td style={{ ...td, fontWeight: b.grade !== 'X' ? 500 : 400 }}>{b.name}</td>
                {GRADES.map((g) => (
                  <td key={g} style={{ ...td, textAlign: 'center', background: b.grade === g ? GRADE_BG[g] : 'transparent' }}>
                    <input
                      type="radio"
                      name={b.id}
                      checked={b.grade === g}
                      onChange={() => setGrade(b.id, g)}
                      style={{ accentColor: '#2563EB', cursor: 'pointer', width: '15px', height: '15px' }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#6B7280' }}>
            총 {branches.length}개 지점 중 제외: {counts['X']}개 / 분배대상: {branches.length - counts['X']}개
          </span>
          <button onClick={onClose} style={{
            background: '#1D4ED8', color: '#fff', border: 'none', borderRadius: '4px',
            padding: '8px 24px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}>
            확인
          </button>
        </div>
      </div>
    </div>
  )
}

const th: React.CSSProperties = {
  padding: '7px 8px', border: '1px solid #D1D5DB',
  fontWeight: 700, textAlign: 'center', fontSize: '12px',
}

const td: React.CSSProperties = {
  padding: '6px 8px', border: '1px solid #E5E7EB',
}
